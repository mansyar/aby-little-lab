import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MockFn } from "../helpers/phaserMock";
import {
  assertBoundedSuccessEffect,
  assertWinCelebrationCreated,
  completeFadeOuts,
  getMockFn,
  getTextObject,
  mockAudio,
  mockSpeech,
} from "../helpers/sceneFlowHarness";

/**
 * Every module the scene flows touch is replaced with a shared double from
 * `sceneFlowHarness`. The `vi.mock` calls must stay in this file: Vitest hoists
 * them above the imports, so the factories load the harness dynamically.
 */
vi.mock("../../utils/fonts", async () => {
  const { mockEnsureGlyphFontLoaded } = await import("../helpers/sceneFlowHarness");
  return { ensureGlyphFontLoaded: mockEnsureGlyphFontLoaded };
});

vi.mock("phaser", async () => {
  const { createPhaserModuleMock } = await import("../helpers/phaserMock");
  return createPhaserModuleMock().module;
});

vi.mock("../../utils/storage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../utils/storage")>();
  const { mockStorageHasSticker, mockStorageEarnSticker, storageActual } = await import(
    "../helpers/sceneFlowHarness"
  );
  storageActual.hasSticker = actual.hasSticker;
  storageActual.earnSticker = actual.earnSticker;
  mockStorageHasSticker.mockImplementation(actual.hasSticker);
  mockStorageEarnSticker.mockImplementation(actual.earnSticker);
  return {
    ...actual,
    hasSticker: mockStorageHasSticker,
    earnSticker: mockStorageEarnSticker,
  };
});

vi.mock("../../audio/AudioManager", async () => {
  const { mockAudio } = await import("../helpers/sceneFlowHarness");
  return { AudioManager: { getInstance: () => mockAudio } };
});

vi.mock("../../utils/speech", async () => {
  const { mockSpeech } = await import("../helpers/sceneFlowHarness");
  return mockSpeech;
});

vi.mock("../../components/SettingsPanel", async () => {
  const { MockSettingsPanel } = await import("../helpers/sceneFlowHarness");
  return { SettingsPanel: MockSettingsPanel };
});

vi.mock("../../components/PwaToast", async () => {
  const { MockPwaToast } = await import("../helpers/sceneFlowHarness");
  return { PwaToast: MockPwaToast };
});

vi.mock("../../utils/pwaBridge", async () => {
  const { mockBridge } = await import("../helpers/sceneFlowHarness");
  return { getPwaBridge: () => mockBridge };
});

vi.mock("../../scenes/sceneRegistry", async () => {
  const { mockEnsureSceneLoaded } = await import("../helpers/sceneFlowHarness");
  return { ensureSceneLoaded: mockEnsureSceneLoaded };
});

import { PopFreezeScene } from "../../scenes/PopFreezeScene";
import { earnSticker, hasSticker } from "../../utils/storage";

beforeEach(() => {
  vi.stubGlobal("screen", {
    orientation: {
      lock: vi.fn().mockResolvedValue(undefined),
      unlock: vi.fn(),
    },
  });
  localStorage.clear();
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("PopFreezeScene round initialization", () => {
  beforeEach(() => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /** Returns bubble physics image objects created by the scene. */
  function getBubbles(scene: unknown): Array<Record<string, MockFn>> {
    const physics = (scene as { physics: { add: Record<string, unknown> } }).physics.add;
    const imageMock = getMockFn(physics.image);
    return imageMock.mock.results.map((r) => r.value as Record<string, MockFn>);
  }

  it("creates 5 concurrent bubble physics images", () => {
    const scene = new PopFreezeScene();
    scene.create();

    const physicsImageMock = getMockFn(scene.physics.add.image);
    expect(physicsImageMock.mock.calls).toHaveLength(5);
  });

  it("sets world bounds collision for bouncing", () => {
    const scene = new PopFreezeScene();
    scene.create();

    expect(getMockFn(scene.physics.world.setBoundsCollision)).toHaveBeenCalled();
  });

  it("sets velocity on each bubble for floating motion", () => {
    const scene = new PopFreezeScene();
    scene.create();

    const bubbles = getBubbles(scene);
    for (const bubble of bubbles) {
      expect(getMockFn(bubble.setVelocity)).toHaveBeenCalled();
    }
  });

  it("enables world bounds collision on each bubble", () => {
    const scene = new PopFreezeScene();
    scene.create();

    const bubbles = getBubbles(scene);
    for (const bubble of bubbles) {
      expect(getMockFn(bubble.setCollideWorldBounds)).toHaveBeenCalledWith(true);
    }
  });

  it("makes each bubble interactive for tapping", () => {
    const scene = new PopFreezeScene();
    scene.create();

    const bubbles = getBubbles(scene);
    for (const bubble of bubbles) {
      expect(getMockFn(bubble.setInteractive)).toHaveBeenCalled();
    }
  });

  it("creates touch targets meeting 64x64px minimum", () => {
    const scene = new PopFreezeScene();
    scene.create();

    const bubbles = getBubbles(scene);
    for (const bubble of bubbles) {
      const setDisplaySizeCalls = getMockFn(bubble.setDisplaySize).mock.calls;
      for (const call of setDisplaySizeCalls) {
        expect(call[0]).toBeGreaterThanOrEqual(64);
        expect(call[1]).toBeGreaterThanOrEqual(64);
      }
    }
  });

  it("creates animal image for sleeping bubbles", () => {
    const scene = new PopFreezeScene();
    scene.create();

    const imageCalls = getMockFn(scene.add.image).mock.calls;
    const animalKeys = imageCalls
      .map((call) => call[2] as string)
      .filter((key) => key.startsWith("animal_"));
    expect(animalKeys.length).toBeGreaterThanOrEqual(1);
  });

  it("creates sleep glyph image (not text) for sleeping bubbles", () => {
    const scene = new PopFreezeScene();
    scene.create();

    const imageCalls = getMockFn(scene.add.image).mock.calls;
    const zzzKeys = imageCalls
      .map((call) => call[2] as string)
      .filter((key) => key === "sleep_zzz");
    expect(zzzKeys.length).toBeGreaterThanOrEqual(1);

    const textCalls = getMockFn(scene.add.text).mock.calls;
    const zzzTextCalls = textCalls.filter((call) => call[2] === "Zzz");
    expect(zzzTextCalls).toHaveLength(0);
  });
});

describe("PopFreezeScene tap interaction", () => {
  beforeEach(() => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /** Returns bubble physics image objects created by the scene. */
  function getBubbles(scene: unknown): Array<Record<string, MockFn>> {
    const physics = (scene as { physics: { add: Record<string, unknown> } }).physics.add;
    const imageMock = getMockFn(physics.image);
    return imageMock.mock.results.map((r) => r.value as Record<string, MockFn>);
  }

  /** Simulates a tap on a bubble by triggering its pointerdown callback. */
  function tapBubble(bubble: Record<string, MockFn>): void {
    const onCalls = getMockFn(bubble.on).mock.calls;
    const pointerdownCall = onCalls.find((c) => c[0] === "pointerdown");
    if (pointerdownCall && typeof pointerdownCall[1] === "function") {
      (pointerdownCall[1] as () => void)();
    }
  }

  it("tapping a poppable bubble triggers pop SFX + bounded success feedback", () => {
    const scene = new PopFreezeScene();
    scene.create();

    const bubbles = getBubbles(scene);
    const initialGraphicsCount = getMockFn(scene.add.graphics).mock.results.length;
    // With Math.random=0.5: bubble 0 is sleeping, bubbles 1-4 are poppable
    const poppableBubble = bubbles[1];

    tapBubble(poppableBubble);

    expect(mockAudio.playPop).toHaveBeenCalled();
    assertBoundedSuccessEffect(scene, initialGraphicsCount);
  });

  it("tapping a sleeping bubble triggers wake SFX with no penalty", () => {
    const scene = new PopFreezeScene();
    scene.create();

    const bubbles = getBubbles(scene);
    const sleepingBubble = bubbles[0];

    tapBubble(sleepingBubble);

    expect(mockAudio.playWake).toHaveBeenCalled();
    expect(mockAudio.playPop).not.toHaveBeenCalled();
    expect(getMockFn(sleepingBubble.destroy)).not.toHaveBeenCalled();
  });

  it("tapping a poppable bubble starts pop animation tween", () => {
    const scene = new PopFreezeScene();
    scene.create();

    const bubbles = getBubbles(scene);
    const poppableBubble = bubbles[1];

    tapBubble(poppableBubble);

    const tweenCalls = getMockFn(scene.tweens.add).mock.calls;
    const popTween = tweenCalls.find((c) => c[0]?.targets === poppableBubble);
    expect(popTween).toBeDefined();
  });

  it("tapping a sleeping bubble starts wake wobble animation", () => {
    const scene = new PopFreezeScene();
    scene.create();

    const bubbles = getBubbles(scene);
    const sleepingBubble = bubbles[0];

    tapBubble(sleepingBubble);

    const tweenCalls = getMockFn(scene.tweens.add).mock.calls;
    const wakeTween = tweenCalls.find(
      (c) => c[0]?.targets === sleepingBubble && c[0]?.yoyo === true,
    );
    expect(wakeTween).toBeDefined();
  });

  it("uses a reduced-motion wake wobble when requested", () => {
    vi.stubGlobal("window", {
      matchMedia: vi.fn(() => ({ matches: true })),
    });

    const scene = new PopFreezeScene();
    scene.create();

    const bubbles = getBubbles(scene);
    const sleepingBubble = bubbles[0];

    tapBubble(sleepingBubble);

    const tweenCalls = getMockFn(scene.tweens.add).mock.calls;
    const wakeTween = tweenCalls.find(
      (c) => c[0]?.targets === sleepingBubble && c[0]?.yoyo === true,
    );
    expect(wakeTween).toBeDefined();
    if (!wakeTween) return;
    expect(wakeTween[0].duration).toBe(180);
    expect(wakeTween[0].scaleX).toBeCloseTo((96 / 256) * 1.05, 5);
    expect(wakeTween[0].scaleY).toBeCloseTo((96 / 256) * 1.05, 5);
  });

  it("emits self-cleaning droplet circles when a bubble pops", () => {
    const scene = new PopFreezeScene();
    scene.create();

    const graphicsMock = getMockFn(scene.add.graphics);
    const graphicsCountBefore = graphicsMock.mock.results.length;

    const bubbles = getBubbles(scene);
    tapBubble(bubbles[1]);

    // Splash + droplets graphics both created
    expect(graphicsMock.mock.results.length).toBeGreaterThan(graphicsCountBefore + 1);

    // The droplets graphics draws 3 radiating circles
    let droplets: Record<string, MockFn> | undefined;
    for (let i = graphicsCountBefore; i < graphicsMock.mock.results.length; i++) {
      const g = graphicsMock.mock.results[i].value as Record<string, MockFn>;
      if (getMockFn(g.fillCircle).mock.calls.length >= 3) {
        droplets = g;
      }
    }
    expect(droplets).toBeDefined();
    if (!droplets) return;
    expect(getMockFn(droplets.fillCircle)).toHaveBeenCalledTimes(3);

    // Fade tween fades the droplets out and destroys them on completion
    const fadeTween = getMockFn(scene.tweens.add).mock.calls.find(
      (c) => c[0]?.targets === droplets && c[0]?.alpha === 0,
    );
    expect(fadeTween).toBeDefined();
    if (!fadeTween) return;
    expect(fadeTween[0].duration).toBe(300);
    const onComplete = (fadeTween[0] as { onComplete?: () => void }).onComplete;
    expect(onComplete).toEqual(expect.any(Function));
    onComplete?.();
    expect(getMockFn(droplets.destroy)).toHaveBeenCalledTimes(1);
  });

  it("uses reduced-motion droplet timing when requested", () => {
    vi.stubGlobal("window", {
      matchMedia: vi.fn(() => ({ matches: true })),
    });

    const scene = new PopFreezeScene();
    scene.create();

    const graphicsMock = getMockFn(scene.add.graphics);
    const graphicsCountBefore = graphicsMock.mock.results.length;

    const bubbles = getBubbles(scene);
    tapBubble(bubbles[1]);

    let droplets: Record<string, MockFn> | undefined;
    for (let i = graphicsCountBefore; i < graphicsMock.mock.results.length; i++) {
      const g = graphicsMock.mock.results[i].value as Record<string, MockFn>;
      if (getMockFn(g.fillCircle).mock.calls.length >= 3) {
        droplets = g;
      }
    }
    expect(droplets).toBeDefined();
    if (!droplets) return;

    const fadeTween = getMockFn(scene.tweens.add).mock.calls.find(
      (c) => c[0]?.targets === droplets && c[0]?.alpha === 0,
    );
    expect(fadeTween).toBeDefined();
    if (!fadeTween) return;
    expect(fadeTween[0].duration).toBe(180);
    expect(fadeTween[0].scaleX).toBe(1.05);
  });

  it("starts a gentle breathing loop on sleeping animals", () => {
    const scene = new PopFreezeScene();
    scene.create();

    const imageMock = getMockFn(scene.add.image);
    let animalImage: Record<string, MockFn> | undefined;
    for (let i = 0; i < imageMock.mock.calls.length; i++) {
      if (String(imageMock.mock.calls[i][2]).startsWith("animal_")) {
        animalImage = imageMock.mock.results[i].value as Record<string, MockFn>;
        break;
      }
    }
    expect(animalImage).toBeDefined();
    if (!animalImage) return;

    const breatheTween = getMockFn(scene.tweens.add).mock.calls.find(
      (c) => c[0]?.targets === animalImage && c[0]?.repeat === -1,
    );
    expect(breatheTween).toBeDefined();
    if (!breatheTween) return;
    expect(breatheTween[0].yoyo).toBe(true);
    expect(breatheTween[0].scaleX).toBeCloseTo(1.03, 5);
    expect(breatheTween[0].scaleY).toBeCloseTo(1.03, 5);
    expect(breatheTween[0].duration).toBe(750);
  });

  it("skips the breathing loop under reduced motion", () => {
    vi.stubGlobal("window", {
      matchMedia: vi.fn(() => ({ matches: true })),
    });

    const scene = new PopFreezeScene();
    scene.create();

    const imageMock = getMockFn(scene.add.image);
    let animalImage: Record<string, MockFn> | undefined;
    for (let i = 0; i < imageMock.mock.calls.length; i++) {
      if (String(imageMock.mock.calls[i][2]).startsWith("animal_")) {
        animalImage = imageMock.mock.results[i].value as Record<string, MockFn>;
        break;
      }
    }
    expect(animalImage).toBeDefined();
    if (!animalImage) return;

    expect(
      getMockFn(scene.tweens.add).mock.calls.some(
        (c) => c[0]?.targets === animalImage && c[0]?.repeat === -1,
      ),
    ).toBe(false);
  });

  it("registers a shutdown cleanup for the breathing loop", () => {
    const scene = new PopFreezeScene();
    scene.create();

    expect(getMockFn(scene.events.once)).toHaveBeenCalledWith("shutdown", expect.any(Function));
  });

  it("respawns a poppable bubble after pop to maintain concurrent count", () => {
    const scene = new PopFreezeScene();
    scene.create();

    const physicsImageMock = getMockFn(scene.physics.add.image);
    expect(physicsImageMock.mock.calls).toHaveLength(5);

    const bubbles = getBubbles(scene);
    tapBubble(bubbles[1]);

    expect(physicsImageMock.mock.calls).toHaveLength(6);

    const newBubble = physicsImageMock.mock.results[5].value as Record<string, MockFn>;
    expect(getMockFn(newBubble.setInteractive)).toHaveBeenCalled();
  });

  it("does not respawn after win target is reached", () => {
    const scene = new PopFreezeScene();
    scene.create();

    const physicsImageMock = getMockFn(scene.physics.add.image);
    let bubbles = getBubbles(scene);

    // Pop 4 initial poppable bubbles (indices 1-4)
    tapBubble(bubbles[1]);
    tapBubble(bubbles[2]);
    tapBubble(bubbles[3]);
    tapBubble(bubbles[4]);

    // 4 pops → 4 respawns → 9 total physics images
    expect(physicsImageMock.mock.calls).toHaveLength(9);

    // Get updated list (includes respawns at indices 5-8)
    bubbles = getBubbles(scene);
    tapBubble(bubbles[5]);
    // 5 pops → 5 respawns → 10 total
    expect(physicsImageMock.mock.calls).toHaveLength(10);

    tapBubble(bubbles[6]);
    // 6 pops = win target → NO respawn → still 10
    expect(physicsImageMock.mock.calls).toHaveLength(10);
  });
});

describe("PopFreezeScene completion and sticker flow", () => {
  beforeEach(() => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /** Returns bubble physics image objects created by the scene. */
  function getBubbles(scene: unknown): Array<Record<string, MockFn>> {
    const physics = (scene as { physics: { add: Record<string, unknown> } }).physics.add;
    const imageMock = getMockFn(physics.image);
    return imageMock.mock.results.map((r) => r.value as Record<string, MockFn>);
  }

  /** Simulates a tap on a bubble by triggering its pointerdown callback. */
  function tapBubble(bubble: Record<string, MockFn>): void {
    const onCalls = getMockFn(bubble.on).mock.calls;
    const pointerdownCall = onCalls.find((c) => c[0] === "pointerdown");
    if (pointerdownCall && typeof pointerdownCall[1] === "function") {
      (pointerdownCall[1] as () => void)();
    }
  }

  /** Simulates popping 6 poppable bubbles to complete the round. */
  function completeRound(scene: PopFreezeScene): void {
    let bubbles = getBubbles(scene);
    // With Math.random=0.5: bubble 0 is sleeping, bubbles 1-4 are poppable
    tapBubble(bubbles[1]);
    tapBubble(bubbles[2]);
    tapBubble(bubbles[3]);
    tapBubble(bubbles[4]);
    // 4 pops → 4 respawns → 9 total; get updated list with respawns
    bubbles = getBubbles(scene);
    tapBubble(bubbles[5]);
    tapBubble(bubbles[6]);
  }

  it("sizes every bubble physics body to the 96px display size", () => {
    const scene = new PopFreezeScene();
    scene.create();

    // Without setCircle, the Arcade body stays at the 512px SVG frame:
    // bubbles would bounce ~208px short of the visible edge and overlap
    // each other's tap regions. Every bubble must get a 96px circle body.
    const physicsImageMock = getMockFn(scene.physics.add.image);
    const bubbles = physicsImageMock.mock.results.map((r) => r.value as Record<string, MockFn>);
    expect(bubbles.length).toBeGreaterThan(0);
    for (const bubble of bubbles) {
      expect(getMockFn(bubble.setCircle)).toHaveBeenCalledWith(48);
    }
  });

  it("plays win SFX when 6 poppable bubbles are popped", () => {
    vi.mocked(hasSticker).mockReturnValue(false);

    const scene = new PopFreezeScene();
    scene.create();
    completeRound(scene);

    expect(mockAudio.playWin).toHaveBeenCalled();
  });

  it("ignores a late Back hold when the auto-return is already navigating", () => {
    vi.mocked(hasSticker).mockReturnValue(false);

    const scene = new PopFreezeScene();
    scene.create();

    // Child starts a 3s Back hold mid-game, then pops the last bubble.
    const backButton = getTextObject(scene, "Back");
    if (!backButton) throw new Error("Back button not found");
    const pointerdown = getMockFn(backButton.on).mock.calls.find(
      (call) => call[0] === "pointerdown",
    );
    const pointerdownCallback = pointerdown?.[1] as (() => void) | undefined;
    if (!pointerdownCallback) throw new Error("Back button pointerdown not found");
    pointerdownCallback();
    completeRound(scene);

    const timeMock = getMockFn(scene.time.delayedCall);
    const hold3000 = timeMock.mock.calls.filter((call) => call[0] === 3000);
    expect(hold3000.length).toBeGreaterThanOrEqual(2);
    const parentLockHold = hold3000[0][1] as () => void;
    const autoReturn = hold3000[hold3000.length - 1][1] as () => void;

    // Auto-return fires first and navigates exactly once.
    autoReturn();
    completeFadeOuts(scene);
    expect(getMockFn(scene.scene.start)).toHaveBeenCalledTimes(1);

    // The stale Back hold completes afterwards: must NOT start a second
    // transition (the guard blocks it before any new fade-out begins).
    parentLockHold();
    expect(getMockFn(scene.cameras.main.fadeOut)).toHaveBeenCalledTimes(1);
    expect(getMockFn(scene.scene.start)).toHaveBeenCalledTimes(1);
  });

  it("awards sticker on first completion only", () => {
    vi.mocked(hasSticker).mockReturnValue(false);

    const scene = new PopFreezeScene();
    scene.create();
    completeRound(scene);

    expect(earnSticker).toHaveBeenCalledWith("pop-freeze");
    expect(mockAudio.playSticker).toHaveBeenCalled();
  });

  it("does not re-award sticker on replay", () => {
    vi.mocked(hasSticker).mockReturnValue(true);

    const scene = new PopFreezeScene();
    scene.create();
    completeRound(scene);

    expect(earnSticker).not.toHaveBeenCalled();
    expect(mockAudio.playSticker).not.toHaveBeenCalled();
  });

  it("auto-returns to Hub after 3s delay", () => {
    vi.mocked(hasSticker).mockReturnValue(false);

    const scene = new PopFreezeScene();
    scene.create();
    completeRound(scene);

    const delayedCallMock = getMockFn(scene.time.delayedCall);
    const autoReturnCall = delayedCallMock.mock.calls.find((call) => call[0] === 3000);
    expect(autoReturnCall).toBeDefined();

    const callback = autoReturnCall?.[1] as () => void;
    callback();
    completeFadeOuts(scene);

    expect(getMockFn(scene.scene.start)).toHaveBeenCalledWith("Hub", {
      justEarned: "pop-freeze",
    });
  });

  it("triggers the choreographed win celebration on round completion", () => {
    vi.mocked(hasSticker).mockReturnValue(false);

    const scene = new PopFreezeScene();
    scene.create();
    completeRound(scene);

    assertWinCelebrationCreated(scene);
  });

  it("creates sticker animation image on first completion", () => {
    vi.mocked(hasSticker).mockReturnValue(false);

    const scene = new PopFreezeScene();
    scene.create();
    completeRound(scene);

    const imageCalls = getMockFn(scene.add.image).mock.calls;
    const keys = imageCalls.map((call) => call[2] as string);
    expect(keys).toContain("sticker_pop_freeze");
  });
});

describe("PopFreezeScene spoken instruction", () => {
  beforeEach(() => {
    localStorage.clear();
    for (const fn of Object.values(mockSpeech)) {
      fn.mockClear();
    }
  });

  it("shows and speaks the rule when the round starts", () => {
    const scene = new PopFreezeScene();
    scene.create();

    const textMock = getMockFn((scene as unknown as { add: Record<string, unknown> }).add.text);
    const call = textMock.mock.calls.find(
      (c) => c[2] === "Pop the bubbles, but not the sleeping animals.",
    );
    expect(call).toBeDefined();
    expect(mockSpeech.speakSentence).toHaveBeenCalledWith(
      "Pop the bubbles, but not the sleeping animals.",
      true,
    );
  });
});
