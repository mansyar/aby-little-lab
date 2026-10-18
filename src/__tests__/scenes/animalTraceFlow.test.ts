import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MockFn } from "../helpers/phaserMock";
import {
  assertBoundedSuccessEffect,
  assertWinCelebrationCreated,
  completeFadeOuts,
  getMockFn,
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

import { generatePathPoints } from "../../game/animalTraceLogic";
import { AnimalTraceScene } from "../../scenes/AnimalTraceScene";
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

describe("AnimalTraceScene path tracing", () => {
  /** Layout constants matching the scene implementation. */
  const ANIMAL_X = 200;
  const FOOD_X = 824;
  const SPRITE_Y = 384;
  const PATH_POINTS = 6;

  beforeEach(() => {
    // Deterministic Math.random so test helper's generatePathPoints
    // matches the scene's internal generatePathPoints call
    vi.spyOn(Math, "random").mockReturnValue(0.5);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /** Returns the input callback registered for a given event name. */
  function getInputCallback(scene: unknown, eventName: string): (...args: unknown[]) => void {
    const inputOnMock = getMockFn((scene as { input: Record<string, unknown> }).input.on);
    const call = inputOnMock.mock.calls.find((c) => c[0] === eventName);
    if (!call || typeof call[1] !== "function") {
      throw new Error(`Input callback for "${eventName}" not found`);
    }
    return call[1] as (...args: unknown[]) => void;
  }

  /** Returns the animal image game object created by the scene. */
  function getAnimalSprite(scene: unknown): Record<string, MockFn> {
    const imageMock = getMockFn((scene as { add: Record<string, unknown> }).add.image);
    for (let i = 0; i < imageMock.mock.calls.length; i++) {
      const key = imageMock.mock.calls[i][2] as string;
      if (key.startsWith("animal_")) {
        return imageMock.mock.results[i].value as Record<string, MockFn>;
      }
    }
    throw new Error("Animal sprite not found");
  }

  /** Returns the food image game object created by the scene. */
  function getFoodSprite(scene: unknown): Record<string, MockFn> {
    const imageMock = getMockFn((scene as { add: Record<string, unknown> }).add.image);
    for (let i = 0; i < imageMock.mock.calls.length; i++) {
      const key = imageMock.mock.calls[i][2] as string;
      if (key.startsWith("food_")) {
        return imageMock.mock.results[i].value as Record<string, MockFn>;
      }
    }
    throw new Error("Food sprite not found");
  }

  /** Simulates tracing the entire path by advancing through all points. */
  function completePath(scene: unknown): void {
    const pathPoints = generatePathPoints(ANIMAL_X, SPRITE_Y, FOOD_X, SPRITE_Y, PATH_POINTS);
    const pointerdown = getInputCallback(scene, "pointerdown");
    const pointermove = getInputCallback(scene, "pointermove");

    pointerdown({ x: pathPoints[0].x, y: pathPoints[0].y });
    for (let i = 1; i < pathPoints.length; i++) {
      pointermove({ x: pathPoints[i].x, y: pathPoints[i].y });
    }
  }

  it("creates animal and food images for the first pair", () => {
    const scene = new AnimalTraceScene();
    scene.create();

    const imageCalls = getMockFn(scene.add.image).mock.calls;
    const keys = imageCalls.map((call) => call[2] as string);

    expect(keys.some((k) => k.startsWith("animal_"))).toBe(true);
    expect(keys.some((k) => k.startsWith("food_"))).toBe(true);
  });

  it("creates a graphics object for the dotted path", () => {
    const scene = new AnimalTraceScene();
    scene.create();

    expect(getMockFn(scene.add.graphics)).toHaveBeenCalled();
  });

  it("registers pointerdown, pointermove, and pointerup handlers", () => {
    const scene = new AnimalTraceScene();
    scene.create();

    const inputOnMock = getMockFn(scene.input.on);
    const events = inputOnMock.mock.calls.map((call) => call[0] as string);

    expect(events).toContain("pointerdown");
    expect(events).toContain("pointermove");
    expect(events).toContain("pointerup");
  });

  it("pointermove near next path point advances animal sprite", () => {
    const scene = new AnimalTraceScene();
    scene.create();

    const pathPoints = generatePathPoints(ANIMAL_X, SPRITE_Y, FOOD_X, SPRITE_Y, PATH_POINTS);
    const animalSprite = getAnimalSprite(scene);

    const pointerdown = getInputCallback(scene, "pointerdown");
    const pointermove = getInputCallback(scene, "pointermove");

    pointerdown({ x: pathPoints[0].x, y: pathPoints[0].y });
    pointermove({ x: pathPoints[1].x, y: pathPoints[1].y });

    // Animal hops toward the next waypoint with a 6px arc (apex tween)
    const hopTween = getMockFn(scene.tweens.add).mock.calls.find(
      (c) => c[0]?.targets === animalSprite && c[0]?.x === pathPoints[1].x,
    );
    expect(hopTween).toBeDefined();
    if (!hopTween) return;
    expect(hopTween[0].y).toBe(pathPoints[1].y - 6);
    expect(hopTween[0].duration).toBe(60);
    expect(hopTween[0].ease).toBe("Sine.inOut");
  });

  it("pointer far from path does not advance animal", () => {
    const scene = new AnimalTraceScene();
    scene.create();

    const animalSprite = getAnimalSprite(scene);

    const pointerdown = getInputCallback(scene, "pointerdown");
    const pointermove = getInputCallback(scene, "pointermove");

    pointerdown({ x: 500, y: 100 });
    pointermove({ x: 600, y: 100 });

    // Animal should not have hopped at all
    expect(getMockFn(scene.tweens.add).mock.calls.some((c) => c[0]?.targets === animalSprite)).toBe(
      false,
    );
  });

  it("pointerup pauses animal — no position reset", () => {
    const scene = new AnimalTraceScene();
    scene.create();

    const pathPoints = generatePathPoints(ANIMAL_X, SPRITE_Y, FOOD_X, SPRITE_Y, PATH_POINTS);
    const animalSprite = getAnimalSprite(scene);

    const pointerdown = getInputCallback(scene, "pointerdown");
    const pointermove = getInputCallback(scene, "pointermove");
    const pointerup = getInputCallback(scene, "pointerup");

    // Advance to point 1
    pointerdown({ x: pathPoints[0].x, y: pathPoints[0].y });
    pointermove({ x: pathPoints[1].x, y: pathPoints[1].y });

    // Pointer up (pause)
    pointerup();

    // Move pointer near point 2 while pointer is up — should not advance
    pointermove({ x: pathPoints[2].x, y: pathPoints[2].y });

    // Animal should still be hopping to point 1 (only one hop tween created)
    const hopTweens = getMockFn(scene.tweens.add).mock.calls.filter(
      (c) => c[0]?.targets === animalSprite,
    );
    expect(hopTweens).toHaveLength(1);
    const onlyHop = hopTweens[0];
    expect(onlyHop).toBeDefined();
    if (!onlyHop) return;
    expect(onlyHop[0].x).toBe(pathPoints[1].x);
  });

  it("resume continues from current position after pointer lift", () => {
    const scene = new AnimalTraceScene();
    scene.create();

    const pathPoints = generatePathPoints(ANIMAL_X, SPRITE_Y, FOOD_X, SPRITE_Y, PATH_POINTS);
    const animalSprite = getAnimalSprite(scene);

    const pointerdown = getInputCallback(scene, "pointerdown");
    const pointermove = getInputCallback(scene, "pointermove");
    const pointerup = getInputCallback(scene, "pointerup");

    // Advance to point 1, then pause
    pointerdown({ x: pathPoints[0].x, y: pathPoints[0].y });
    pointermove({ x: pathPoints[1].x, y: pathPoints[1].y });
    pointerup();

    // Resume — pointer down near current position, move to point 2
    pointerdown({ x: pathPoints[1].x, y: pathPoints[1].y });
    pointermove({ x: pathPoints[2].x, y: pathPoints[2].y });

    // Animal should now be hopping to point 2 (second hop tween created)
    const hopTweens = getMockFn(scene.tweens.add).mock.calls.filter(
      (c) => c[0]?.targets === animalSprite,
    );
    expect(hopTweens).toHaveLength(2);
    const secondHop = hopTweens[1];
    expect(secondHop).toBeDefined();
    if (!secondHop) return;
    expect(secondHop[0].x).toBe(pathPoints[2].x);
  });

  it("reaching food triggers correct SFX + bounded success feedback", () => {
    const scene = new AnimalTraceScene();
    scene.create();

    const initialGraphicsCount = getMockFn(scene.add.graphics).mock.results.length;
    completePath(scene);

    expect(mockAudio.playCorrect).toHaveBeenCalled();
    assertBoundedSuccessEffect(scene, initialGraphicsCount);
  });

  it("no SFX during tracing (only on path completion)", () => {
    const scene = new AnimalTraceScene();
    scene.create();

    const pathPoints = generatePathPoints(ANIMAL_X, SPRITE_Y, FOOD_X, SPRITE_Y, PATH_POINTS);
    const pointerdown = getInputCallback(scene, "pointerdown");
    const pointermove = getInputCallback(scene, "pointermove");

    pointerdown({ x: pathPoints[0].x, y: pathPoints[0].y });
    pointermove({ x: pathPoints[1].x, y: pathPoints[1].y });
    pointermove({ x: pathPoints[2].x, y: pathPoints[2].y });

    expect(mockAudio.playCorrect).not.toHaveBeenCalled();
    expect(mockAudio.playIncorrect).not.toHaveBeenCalled();
  });

  it("trace tolerance is generous (pointer within 60px of target advances)", () => {
    const scene = new AnimalTraceScene();
    scene.create();

    const pathPoints = generatePathPoints(ANIMAL_X, SPRITE_Y, FOOD_X, SPRITE_Y, PATH_POINTS);
    const animalSprite = getAnimalSprite(scene);

    const pointerdown = getInputCallback(scene, "pointerdown");
    const pointermove = getInputCallback(scene, "pointermove");

    pointerdown({ x: pathPoints[0].x, y: pathPoints[0].y });

    // Move to 40px before point 1 in x (within 60px tolerance)
    pointermove({ x: pathPoints[1].x - 40, y: pathPoints[1].y });

    const hopTween = getMockFn(scene.tweens.add).mock.calls.find(
      (c) => c[0]?.targets === animalSprite && c[0]?.x === pathPoints[1].x,
    );
    expect(hopTween).toBeDefined();
    if (!hopTween) return;
    expect(hopTween[0].y).toBe(pathPoints[1].y - 6);
  });

  it("advances to next pair after path completion", () => {
    const scene = new AnimalTraceScene();
    scene.create();

    completePath(scene);

    // Find the delayedCall for advancing to next pair (1000ms)
    const delayedCallMock = getMockFn(scene.time.delayedCall);
    const advanceCall = delayedCallMock.mock.calls.find((call) => call[0] === 1000);
    expect(advanceCall).toBeDefined();

    const imageCountBefore = getMockFn(scene.add.image).mock.calls.length;

    // Trigger the advance callback
    const callback = advanceCall?.[1] as () => void;
    callback();

    // New animal and food images should have been created
    const imageCountAfter = getMockFn(scene.add.image).mock.calls.length;
    expect(imageCountAfter).toBeGreaterThan(imageCountBefore);
  });

  it("cleans success feedback after its bounded animation", () => {
    const scene = new AnimalTraceScene();
    scene.create();

    const initialGraphicsCount = getMockFn(scene.add.graphics).mock.results.length;
    completePath(scene);

    assertBoundedSuccessEffect(scene, initialGraphicsCount);
  });

  it("lands the animal on the waypoint after the hop arc completes", () => {
    const scene = new AnimalTraceScene();
    scene.create();

    const pathPoints = generatePathPoints(ANIMAL_X, SPRITE_Y, FOOD_X, SPRITE_Y, PATH_POINTS);
    const animalSprite = getAnimalSprite(scene);

    const pointerdown = getInputCallback(scene, "pointerdown");
    const pointermove = getInputCallback(scene, "pointermove");

    pointerdown({ x: pathPoints[0].x, y: pathPoints[0].y });
    pointermove({ x: pathPoints[1].x, y: pathPoints[1].y });

    const apexTween = getMockFn(scene.tweens.add).mock.calls.find(
      (c) => c[0]?.targets === animalSprite && c[0]?.y === pathPoints[1].y - 6,
    );
    expect(apexTween).toBeDefined();
    if (!apexTween) return;

    // Apex tween schedules a landing tween back to the waypoint y
    const onComplete = (apexTween[0] as { onComplete?: () => void }).onComplete;
    expect(onComplete).toEqual(expect.any(Function));
    onComplete?.();

    const landingTween = getMockFn(scene.tweens.add).mock.calls.find(
      (c) =>
        c[0]?.targets === animalSprite &&
        c[0]?.y === pathPoints[1].y &&
        c[0]?.duration === 60 &&
        c[0]?.x === undefined,
    );
    expect(landingTween).toBeDefined();
    if (!landingTween) return;
    expect(landingTween[0].ease).toBe("Sine.inOut");
  });

  it("uses a reduced-motion hop (no arc, shorter duration) when requested", () => {
    vi.stubGlobal("window", { matchMedia: vi.fn(() => ({ matches: true })) });

    const scene = new AnimalTraceScene();
    scene.create();

    const pathPoints = generatePathPoints(ANIMAL_X, SPRITE_Y, FOOD_X, SPRITE_Y, PATH_POINTS);
    const animalSprite = getAnimalSprite(scene);

    const pointerdown = getInputCallback(scene, "pointerdown");
    const pointermove = getInputCallback(scene, "pointermove");

    pointerdown({ x: pathPoints[0].x, y: pathPoints[0].y });
    pointermove({ x: pathPoints[1].x, y: pathPoints[1].y });

    const hopTween = getMockFn(scene.tweens.add).mock.calls.find(
      (c) => c[0]?.targets === animalSprite && c[0]?.x === pathPoints[1].x,
    );
    expect(hopTween).toBeDefined();
    if (!hopTween) return;
    expect(hopTween[0].y).toBe(pathPoints[1].y); // no arc
    expect(hopTween[0].duration).toBe(36);

    expect(
      getMockFn(scene.tweens.add).mock.calls.some((c) => c[0]?.y === pathPoints[1].y - 6),
    ).toBe(false);
  });

  it("wiggles the food sprite when the path is completed", () => {
    const scene = new AnimalTraceScene();
    scene.create();

    const foodSprite = getFoodSprite(scene);
    completePath(scene);

    const wiggleTween = getMockFn(scene.tweens.add).mock.calls.find(
      (c) =>
        c[0]?.targets === foodSprite &&
        c[0]?.angle === 4 &&
        c[0]?.yoyo === true &&
        c[0]?.repeat === 3,
    );
    expect(wiggleTween).toBeDefined();
    if (!wiggleTween) return;
    expect(wiggleTween[0].duration).toBe(200);
    expect(wiggleTween[0].ease).toBe("Sine.inOut");
  });

  it("uses a gentler reduced-motion food wiggle", () => {
    vi.stubGlobal("window", { matchMedia: vi.fn(() => ({ matches: true })) });

    const scene = new AnimalTraceScene();
    scene.create();

    const foodSprite = getFoodSprite(scene);
    completePath(scene);

    const wiggleTween = getMockFn(scene.tweens.add).mock.calls.find(
      (c) => c[0]?.targets === foodSprite,
    );
    expect(wiggleTween).toBeDefined();
    if (!wiggleTween) return;
    expect(wiggleTween[0].angle).toBe(2);
    expect(wiggleTween[0].duration).toBe(120);
  });

  it("pops the progress dot with a scale bounce when a path is completed", () => {
    const scene = new AnimalTraceScene();
    scene.create();

    const circleMock = getMockFn(scene.add.circle);
    const dots = circleMock.mock.results.map((r) => r.value as Record<string, MockFn>);

    completePath(scene);

    const popTween = getMockFn(scene.tweens.add).mock.calls.find(
      (c) => c[0]?.targets === dots[0] && c[0]?.scaleX === 1.4 && c[0]?.yoyo === true,
    );
    expect(popTween).toBeDefined();
    if (!popTween) return;
    expect(popTween[0].scaleY).toBe(1.4);
    expect(popTween[0].ease).toBe("Back.out");
    expect(popTween[0].duration).toBe(250);
  });

  it("uses a reduced-motion progress dot pop", () => {
    vi.stubGlobal("window", { matchMedia: vi.fn(() => ({ matches: true })) });

    const scene = new AnimalTraceScene();
    scene.create();

    const circleMock = getMockFn(scene.add.circle);
    const dots = circleMock.mock.results.map((r) => r.value as Record<string, MockFn>);

    completePath(scene);

    const popTween = getMockFn(scene.tweens.add).mock.calls.find((c) => c[0]?.targets === dots[0]);
    expect(popTween).toBeDefined();
    if (!popTween) return;
    expect(popTween[0].scaleX).toBe(1.2);
    expect(popTween[0].duration).toBe(150);
  });
});

describe("AnimalTraceScene completion and sticker flow", () => {
  /** Layout constants matching the scene implementation. */
  const ANIMAL_X = 200;
  const FOOD_X = 824;
  const SPRITE_Y = 384;
  const PATH_POINTS = 6;

  beforeEach(() => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /** Returns the input callback registered for a given event name. */
  function getInputCallback(scene: unknown, eventName: string): (...args: unknown[]) => void {
    const inputOnMock = getMockFn((scene as { input: Record<string, unknown> }).input.on);
    const call = inputOnMock.mock.calls.find((c) => c[0] === eventName);
    if (!call || typeof call[1] !== "function") {
      throw new Error(`Input callback for "${eventName}" not found`);
    }
    return call[1] as (...args: unknown[]) => void;
  }

  /** Simulates tracing a single path by advancing through all points. */
  function completePath(scene: unknown): void {
    const pathPoints = generatePathPoints(ANIMAL_X, SPRITE_Y, FOOD_X, SPRITE_Y, PATH_POINTS);
    const pointerdown = getInputCallback(scene, "pointerdown");
    const pointermove = getInputCallback(scene, "pointermove");

    pointerdown({ x: pathPoints[0].x, y: pathPoints[0].y });
    for (let i = 1; i < pathPoints.length; i++) {
      pointermove({ x: pathPoints[i].x, y: pathPoints[i].y });
    }
  }

  /** Simulates tracing all 3 paths, triggering delayedCall advances between pairs. */
  function completeAllPaths(scene: unknown): void {
    for (let pair = 0; pair < 3; pair++) {
      completePath(scene);

      if (pair < 2) {
        const delayedCallMock = getMockFn(
          (scene as { time: Record<string, unknown> }).time.delayedCall,
        );
        const advanceCalls = delayedCallMock.mock.calls.filter((call) => call[0] === 1000);
        const latestAdvance = advanceCalls[advanceCalls.length - 1];
        const callback = latestAdvance?.[1] as () => void;
        callback();
      }
    }
  }

  it("plays win SFX when all 3 paths are traced", () => {
    vi.mocked(hasSticker).mockReturnValue(false);

    const scene = new AnimalTraceScene();
    scene.create();
    completeAllPaths(scene);

    expect(mockAudio.playWin).toHaveBeenCalled();
  });

  it("awards sticker on first completion only", () => {
    vi.mocked(hasSticker).mockReturnValue(false);

    const scene = new AnimalTraceScene();
    scene.create();
    completeAllPaths(scene);

    expect(earnSticker).toHaveBeenCalledWith("animal-trace");
    expect(mockAudio.playSticker).toHaveBeenCalled();
  });

  it("does not re-award sticker on replay", () => {
    vi.mocked(hasSticker).mockReturnValue(true);

    const scene = new AnimalTraceScene();
    scene.create();
    completeAllPaths(scene);

    expect(earnSticker).not.toHaveBeenCalled();
    expect(mockAudio.playSticker).not.toHaveBeenCalled();
  });

  it("auto-returns to Hub after 3s delay", () => {
    vi.mocked(hasSticker).mockReturnValue(false);

    const scene = new AnimalTraceScene();
    scene.create();
    completeAllPaths(scene);

    const delayedCallMock = getMockFn(scene.time.delayedCall);
    const autoReturnCalls = delayedCallMock.mock.calls.filter((call) => call[0] === 3000);
    const autoReturnCall = autoReturnCalls[autoReturnCalls.length - 1];
    expect(autoReturnCall).toBeDefined();

    const callback = autoReturnCall?.[1] as () => void;
    callback();
    completeFadeOuts(scene);

    expect(getMockFn(scene.scene.start)).toHaveBeenCalledWith("Hub", {
      justEarned: "animal-trace",
    });
  });

  it("triggers the choreographed win celebration on round completion", () => {
    vi.mocked(hasSticker).mockReturnValue(false);

    const scene = new AnimalTraceScene();
    scene.create();
    completeAllPaths(scene);

    assertWinCelebrationCreated(scene);
  });

  it("creates sticker animation image on first completion", () => {
    vi.mocked(hasSticker).mockReturnValue(false);

    const scene = new AnimalTraceScene();
    scene.create();
    completeAllPaths(scene);

    const imageCalls = getMockFn(scene.add.image).mock.calls;
    const keys = imageCalls.map((call) => call[2] as string);
    expect(keys).toContain("sticker_animal_trace");
  });

  it("creates 3 progress indicator dots on scene create", () => {
    const scene = new AnimalTraceScene();
    scene.create();

    expect(getMockFn(scene.add.circle)).toHaveBeenCalledTimes(3);
  });

  it("highlights a progress dot when a path is completed", () => {
    const scene = new AnimalTraceScene();
    scene.create();

    const circleMock = getMockFn(scene.add.circle);
    const dots = circleMock.mock.results.map((r) => r.value as Record<string, MockFn>);

    completePath(scene);

    expect(getMockFn(dots[0].setAlpha)).toHaveBeenCalledWith(1);
  });
});

describe("AnimalTraceScene spoken instruction", () => {
  beforeEach(() => {
    localStorage.clear();
    for (const fn of Object.values(mockSpeech)) {
      fn.mockClear();
    }
  });

  it("shows and speaks the rule when the round starts", () => {
    const scene = new AnimalTraceScene();
    scene.create();

    const textMock = getMockFn((scene as unknown as { add: Record<string, unknown> }).add.text);
    const call = textMock.mock.calls.find((c) => c[2] === "Trace the line to the animal's food.");
    expect(call).toBeDefined();
    expect(mockSpeech.speakSentence).toHaveBeenCalledWith(
      "Trace the line to the animal's food.",
      true,
    );
  });
});
