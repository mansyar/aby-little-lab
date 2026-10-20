import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MockFn } from "../helpers/phaserMock";
import {
  completeFadeOuts,
  completeHubEntrances,
  expectHitAreaOrigin,
  expectTouchTargetSize,
  expectUsesDefaultFrameHitArea,
  fireAllObjectEvents,
  getEmptySlots,
  getImageByKey,
  getMockFn,
  getRectangles,
  getStickerImage,
  getStickerImageSafe,
  getStickerImages,
  getTextObject,
  mockAudio,
  mockSettingsPanel,
  triggerAllPointerdowns,
  triggerShutdown,
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

import { GAME_TILES } from "../../game/hubTiles";
import { HubScene } from "../../scenes/HubScene";
import { MusicalMemoryScene } from "../../scenes/MusicalMemoryScene";
import { earnSticker, resetProgress } from "../../utils/storage";

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

import { GAME_SCENE_KEYS, GAME_SCENES } from "../helpers/gameScenes";

describe("Hub engagement entrance and idle life", () => {
  it("staggers tile and sticker entrance tweens 40ms apart (300ms Sine.out each)", () => {
    const scene = new HubScene();
    scene.create();

    const tweenCalls = getMockFn(scene.tweens.add).mock.calls;
    const entranceTweens = tweenCalls
      .map(
        (call) => call[0] as { delay?: number; duration?: number; ease?: string; alpha?: number },
      )
      .filter(
        (config) =>
          config.duration === 300 &&
          typeof config.delay === "number" &&
          (config.alpha === 1 || config.alpha === 0.55),
      );

    expect(entranceTweens.length).toBeGreaterThanOrEqual(12);
    const delays = entranceTweens.map((config) => config.delay as number).sort((a, b) => a - b);
    for (let i = 1; i < delays.length; i++) {
      expect(delays[i] - delays[i - 1]).toBe(40);
    }
    for (const config of entranceTweens) {
      expect(config.ease).toBe("Sine.out");
    }
  });

  it("keeps each tile icon at its display size while tile and label pop in", () => {
    const scene = new HubScene();
    scene.create();

    const tweenCalls = getMockFn(scene.tweens.add).mock.calls;
    const entrances = tweenCalls
      .map((call) => call[0])
      .filter(
        (config) =>
          config?.alpha === 1 && config?.duration === 300 && Array.isArray(config.targets),
      );
    const tileEntrance = entrances.find((config) => config.targets.length === 2);
    expect(tileEntrance).toBeDefined();
    expect(tileEntrance?.scaleX).toBe(1);

    // Icon entrances appear in GAME_TILES order, one per tile, each ending
    // at its own display scale (typography-heavy tiles render smaller) so
    // the entrance pop never resets them to the native texture size.
    const iconEntrances = entrances.filter((config) => config.targets.length === 1);
    expect(iconEntrances).toHaveLength(GAME_TILES.length);
    iconEntrances.forEach((config, i) => {
      const expected = (GAME_TILES[i].iconDisplay ?? 64) / 160;
      expect(config.scaleX).toBe(expected);
      expect(config.scaleY).toBe(expected);
    });
  });

  it("pulses tiles, labels and icons in a phase-offset 2.5s scale wave", () => {
    const scene = new HubScene();
    scene.create();

    const tweenCalls = getMockFn(scene.tweens.add).mock.calls;
    const breatheTweens = tweenCalls
      .map(
        (call) =>
          call[0] as {
            targets?: unknown[];
            duration?: number;
            yoyo?: boolean;
            repeat?: number;
            ease?: string;
            delay?: number;
            scaleX?: number;
            scaleY?: number;
            y?: number;
          },
      )
      .filter(
        (config) =>
          config.duration === 2500 &&
          config.yoyo === true &&
          config.repeat === -1 &&
          typeof config.delay === "number",
      );

    // Two per tile: the tile+label group and the icon (from its own scale).
    expect(breatheTweens).toHaveLength(GAME_TILES.length * 2);

    for (const config of breatheTweens) {
      expect(config.ease).toBe("Sine.inOut");
      expect(config.y).toBeUndefined();
      expect(config.scaleX).toBe(config.scaleY);
    }

    GAME_TILES.forEach((tile, i) => {
      const expectedDelay = 300 + 50 + i * 200;
      const pair = breatheTweens.filter((config) => config.delay === expectedDelay);
      expect(pair).toHaveLength(2);
      const group = pair.find((config) => config.targets?.length === 2);
      const iconTween = pair.find((config) => config.targets?.length === 1);
      expect(group).toBeDefined();
      expect(iconTween).toBeDefined();
      // Tile and label breathe from scale 1; the icon from its display scale.
      expect(group?.scaleX).toBe(1.025);
      const iconScale = ((tile.iconDisplay ?? 64) / 160) * 1.025;
      expect(iconTween?.scaleX).toBeCloseTo(iconScale, 10);
    });
  });

  it("adds low-contrast drifting background decorations behind tiles", () => {
    const scene = new HubScene();
    scene.create();

    const circleMock = getMockFn(scene.add.circle);
    expect(circleMock.mock.calls.length).toBeGreaterThanOrEqual(4);
    for (const result of circleMock.mock.results) {
      const dot = result.value as Record<string, MockFn>;
      expect(getMockFn(dot.setDepth)).toHaveBeenCalledWith(-1);
    }

    const tweenCalls = getMockFn(scene.tweens.add).mock.calls;
    const driftTweens = tweenCalls
      .map((call) => call[0] as { duration?: number; yoyo?: boolean; repeat?: number })
      .filter(
        (config) =>
          config.duration !== undefined &&
          config.duration >= 4000 &&
          config.duration <= 6000 &&
          config.yoyo === true &&
          config.repeat === -1,
      );
    expect(driftTweens.length).toBeGreaterThanOrEqual(4);
  });

  it("under reduced motion: entrance fades only, no bob or drift", () => {
    vi.stubGlobal("window", {
      matchMedia: vi.fn(() => ({ matches: true })),
    });

    const scene = new HubScene();
    scene.create();

    const configs = getMockFn(scene.tweens.add).mock.calls.map(
      (call) => call[0] as Record<string, unknown>,
    );

    expect(configs.some((config) => config.duration === 2500 && config.yoyo === true)).toBe(false);
    expect(
      configs.some(
        (config) =>
          typeof config.duration === "number" &&
          config.duration >= 4000 &&
          config.duration <= 6000 &&
          config.yoyo === true,
      ),
    ).toBe(false);

    const entranceTweens = configs.filter(
      (config) => config.duration === 300 && typeof config.delay === "number",
    );
    expect(entranceTweens.length).toBeGreaterThanOrEqual(12);
    for (const config of entranceTweens) {
      // Tiles/labels/earned stickers fade to 1; empty slots to 0.55.
      expect([1, 0.55]).toContain(config.alpha);
      expect("scaleX" in config).toBe(false);
      expect("scaleY" in config).toBe(false);
    }
  });
});

describe("Hub engagement tile press feedback", () => {
  it("squishes tiles to 95% on pointerdown and springs back with overshoot on release", () => {
    const scene = new HubScene();
    scene.create();
    completeHubEntrances(scene);

    const tile = getRectangles(scene)[0];
    fireAllObjectEvents(tile, "pointerdown");
    expect(getMockFn(tile.setScale)).toHaveBeenCalledWith(0.95);

    fireAllObjectEvents(tile, "pointerup");
    const tweenCalls = getMockFn(scene.tweens.add).mock.calls;
    const springTween = tweenCalls.find((call) => call[0]?.targets === tile);
    expect(springTween).toBeDefined();
    expect(springTween?.[0]?.scaleX).toBe(1);
    expect(springTween?.[0]?.scaleY).toBe(1);
    expect(springTween?.[0]?.ease).toBe("Back.out");
  });

  it("springs tiles back on pointerout and pointercancel", () => {
    const scene = new HubScene();
    scene.create();
    completeHubEntrances(scene);

    const tile = getRectangles(scene)[0];
    for (const event of ["pointerout", "pointercancel"]) {
      getMockFn(scene.tweens.add).mockClear();
      fireAllObjectEvents(tile, event);
      const springTween = getMockFn(scene.tweens.add).mock.calls.find(
        (call) => call[0]?.targets === tile && call[0]?.ease === "Back.out",
      );
      expect(springTween).toBeDefined();
    }
  });

  it("keeps tile taps navigating to games after press feedback is attached", async () => {
    // Fresh Hub per navigation (see "navigates to each game scene").
    for (let i = 0; i < GAME_SCENE_KEYS.length; i++) {
      const scene = new HubScene();
      scene.create();
      completeHubEntrances(scene);

      const tile = getRectangles(scene)[i];
      fireAllObjectEvents(tile, "pointerup");
      // Flush the mocked lazy-loader microtask before fading out.
      await new Promise((resolve) => setTimeout(resolve, 0));
      completeFadeOuts(scene);

      expect(getMockFn(scene.scene.start)).toHaveBeenCalledWith(GAME_SCENE_KEYS[i]);
    }
  });

  it("does not navigate while a tile is merely pressed (only on release)", () => {
    const scene = new HubScene();
    scene.create();
    completeHubEntrances(scene);

    triggerAllPointerdowns(scene);
    completeFadeOuts(scene);

    expect(getMockFn(scene.scene.start)).not.toHaveBeenCalled();
  });

  it("cancels navigation when the pointer leaves or cancels before release", () => {
    const scene = new HubScene();
    scene.create();
    completeHubEntrances(scene);

    const tile = getRectangles(scene)[0];
    fireAllObjectEvents(tile, "pointerdown");
    fireAllObjectEvents(tile, "pointerout");
    completeFadeOuts(scene);
    expect(getMockFn(scene.scene.start)).not.toHaveBeenCalled();

    const otherTile = getRectangles(scene)[1];
    fireAllObjectEvents(otherTile, "pointerdown");
    fireAllObjectEvents(otherTile, "pointercancel");
    completeFadeOuts(scene);
    expect(getMockFn(scene.scene.start)).not.toHaveBeenCalled();
  });

  it("does not attach press feedback to tiles under reduced motion", () => {
    vi.stubGlobal("window", {
      matchMedia: vi.fn(() => ({ matches: true })),
    });

    const scene = new HubScene();
    scene.create();
    completeHubEntrances(scene);

    const tile = getRectangles(scene)[0];
    fireAllObjectEvents(tile, "pointerdown");
    fireAllObjectEvents(tile, "pointerup");

    expect(getMockFn(tile.setScale)).not.toHaveBeenCalled();
    expect(getMockFn(scene.tweens.add).mock.calls.some((call) => call[0]?.targets === tile)).toBe(
      false,
    );
  });
});

describe("Hub engagement sticker shelf", () => {
  /** Sticker textures are rasterized at their card tier (256px); the shelf displays them at 22px. */
  const STICKER_BASE_SCALE = 22 / 256;

  it("replaces the star markers with one real sticker thumbnail per game (textless, touch-inert)", () => {
    earnSticker("shape-sorter");

    const scene = new HubScene();
    scene.create();

    const stickers = getStickerImages(scene);
    expect(stickers).toHaveLength(1);
    expect(new Set(stickers.map((s) => s.key))).toEqual(new Set(["sticker_shape_sorter"]));

    // No ★/☆ text markers remain
    const textMock = getMockFn(scene.add.text);
    for (const call of textMock.mock.calls) {
      const text = call[2];
      if (typeof text === "string") {
        expect(text).not.toMatch(/[★☆]/);
      }
    }

    // Shelf is touch-inert
    for (const sticker of stickers) {
      expect(getMockFn(sticker.obj.setInteractive)).not.toHaveBeenCalled();
    }
  });

  it("shows dashed empty-slot outlines for unearned stickers (textless, touch-inert)", () => {
    const scene = new HubScene();
    scene.create();

    // Fresh profile: nothing earned -> 22 dashed outlines, no ghost thumbnails.
    expect(getStickerImages(scene)).toHaveLength(0);
    const slots = getEmptySlots(scene);
    expect(slots).toHaveLength(22);
    for (const slot of slots) {
      expect(getMockFn(slot.setInteractive)).not.toHaveBeenCalled();
      expect(getMockFn(slot.arc).mock.calls.length).toBeGreaterThanOrEqual(5);
    }
  });

  it("earned stickers get a gentle sparkle loop", () => {
    earnSticker("shape-sorter");

    const scene = new HubScene();
    scene.create();
    completeHubEntrances(scene);

    const sticker = getStickerImage(scene, "sticker_shape_sorter");
    const tweenCalls = getMockFn(scene.tweens.add).mock.calls;
    const targetsSticker = (call: { targets?: unknown }): boolean => {
      const targets = call.targets;
      return Array.isArray(targets) ? targets.includes(sticker) : targets === sticker;
    };
    const entrance = tweenCalls.find((call) => targetsSticker(call[0]) && call[0]?.alpha === 1);
    expect(entrance).toBeDefined();
    // Entrances must land on the shelf base scale (56px from a 512px texture),
    // not scale 1 (which would render the texture full-size).
    expect(entrance?.[0]?.scaleX).toBeCloseTo(STICKER_BASE_SCALE, 5);
    expect(entrance?.[0]?.scaleY).toBeCloseTo(STICKER_BASE_SCALE, 5);
    const sparkle = tweenCalls.find(
      (call) => call[0]?.targets === sticker && call[0]?.repeat === -1,
    );
    expect(sparkle).toBeDefined();
  });

  it("unearned stickers show a dashed empty slot and have no sparkle", () => {
    const scene = new HubScene();
    scene.create();

    expect(getStickerImageSafe(scene, "sticker_animal_trace")).toBeUndefined();
    const slot = getEmptySlots(scene)[1];
    const tweenCalls = getMockFn(scene.tweens.add).mock.calls;
    const entrance = tweenCalls.find((call) => call[0]?.targets === slot);
    expect(entrance).toBeDefined();
    expect(entrance?.[0]?.alpha).toBe(0.55);

    const sparkle = tweenCalls.find((call) => call[0]?.targets === slot && call[0]?.repeat === -1);
    expect(sparkle).toBeUndefined();
  });

  it("gives the justEarned sticker a larger bounce and sparkle burst on entrance", () => {
    earnSticker("shape-sorter");

    const scene = new HubScene();
    scene.init({ justEarned: "shape-sorter" });
    scene.create();

    const sticker = getStickerImage(scene, "sticker_shape_sorter");
    const tweenCalls = getMockFn(scene.tweens.add).mock.calls;
    const entrance = tweenCalls.find(
      (call) => call[0]?.targets === sticker && call[0]?.alpha === 1,
    );
    expect(entrance).toBeDefined();
    expect(entrance?.[0]?.scaleX).toBeCloseTo(1.15 * STICKER_BASE_SCALE, 5);
    expect(entrance?.[0]?.scaleY).toBeCloseTo(1.15 * STICKER_BASE_SCALE, 5);
    expect(entrance?.[0]?.ease).toBe("Back.out");

    completeHubEntrances(scene);
    const burst = getMockFn(scene.tweens.add).mock.calls.find(
      (call) =>
        call[0]?.targets === sticker &&
        call[0]?.repeat === -1 &&
        typeof call[0]?.scaleX === "number",
    );
    expect(burst).toBeDefined();
    // The burst pulse must also stay at shelf scale (1.25x the 56px base).
    expect(burst?.[0]?.scaleX).toBeCloseTo(1.25 * STICKER_BASE_SCALE, 5);
  });

  it("under reduced motion: empty slots appear instantly (no fade tween)", () => {
    vi.stubGlobal("window", {
      matchMedia: vi.fn(() => ({ matches: true })),
    });

    const scene = new HubScene();
    scene.create();

    // Reduced motion skips the fade entirely: no tween may target a slot,
    // and each slot lands directly at its final alpha.
    const slots = getEmptySlots(scene);
    const slotTweens = getMockFn(scene.tweens.add).mock.calls.filter((call) =>
      slots.includes(call[0]?.targets),
    );
    expect(slotTweens).toHaveLength(0);
    for (const slot of slots) {
      expect(getMockFn(slot.setAlpha)).toHaveBeenCalledWith(0.55);
    }
  });

  it("re-renders the sticker shelf when the settings panel reports a progress reset", () => {
    earnSticker("shape-sorter");

    const scene = new HubScene();
    scene.create();
    completeHubEntrances(scene);

    // Open the parental settings panel the way a parent would (3s hold).
    const settingsButton = getTextObject(scene, "Settings");
    if (!settingsButton) throw new Error("Settings button not found");
    const pointerdown = getMockFn(settingsButton.on).mock.calls.find(
      (call) => call[0] === "pointerdown",
    )?.[1] as (() => void) | undefined;
    if (!pointerdown) throw new Error("no pointerdown listener");
    pointerdown();
    const holdCall = getMockFn(scene.time.delayedCall).mock.calls.find((call) => call[0] === 3000);
    if (!holdCall) throw new Error("ParentLock 3000ms hold not found");
    (holdCall[1] as () => void)();

    // The Hub hands the settings panel a shelf re-render callback.
    const settingsArgs = mockSettingsPanel.mock.calls.at(-1);
    expect(settingsArgs).toBeDefined();
    const rerender = settingsArgs?.[2] as () => void;
    expect(typeof rerender).toBe("function");

    const oldStickerImages = getStickerImages(scene);
    expect(oldStickerImages).toHaveLength(1);
    const oldSlots = getEmptySlots(scene);
    expect(oldSlots).toHaveLength(21);

    // The real panel calls resetProgress() before notifying the Hub; mirror it.
    resetProgress();
    rerender();

    // Old thumbnails are destroyed...
    for (const { obj } of oldStickerImages) {
      expect(getMockFn(obj.destroy)).toHaveBeenCalled();
    }
    // ...and replaced by a fresh, fully empty shelf (the reset cleared everything).
    const liveStickers = getStickerImages(scene).filter(
      ({ obj }) => getMockFn(obj.destroy).mock.calls.length === 0,
    );
    expect(liveStickers).toHaveLength(0);
    const liveSlots = getEmptySlots(scene).filter(
      (obj) => getMockFn(obj.destroy).mock.calls.length === 0,
    );
    expect(liveSlots).toHaveLength(22);
    const tweenCalls = getMockFn(scene.tweens.add).mock.calls;
    for (const obj of liveSlots) {
      const targetsSticker = (call: { targets?: unknown }): boolean => {
        const targets = call.targets;
        return Array.isArray(targets) ? targets.includes(obj) : targets === obj;
      };
      const entrance = tweenCalls.find((call) => targetsSticker(call[0]));
      expect(entrance).toBeDefined();
      expect(entrance?.[0]?.alpha).toBe(0.55);
    }
  });
});

describe("Hub engagement idle attract", () => {
  it("arms an idle attract timer ~25s after the scene is created", () => {
    const scene = new HubScene();
    scene.create();

    const idleCalls = getMockFn(scene.time.delayedCall).mock.calls.filter(
      (call) => call[0] === 25000,
    );
    expect(idleCalls.length).toBeGreaterThanOrEqual(1);
  });

  it("plays the idle call and wiggles a couple of tiles when the idle timer fires", () => {
    const scene = new HubScene();
    scene.create();

    const idleCall = getMockFn(scene.time.delayedCall).mock.calls.find((call) => call[0] === 25000);
    expect(idleCall).toBeDefined();
    const callback = idleCall?.[1] as () => void;
    callback();

    expect(mockAudio.playIdleCall).toHaveBeenCalled();

    const wiggleTweens = getMockFn(scene.tweens.add).mock.calls.filter(
      (call) => call[0]?.angle !== undefined && call[0]?.repeat === -1,
    );
    expect(wiggleTweens.length).toBe(2);
  });

  it("repeats the idle call every ~10s while idle", () => {
    const scene = new HubScene();
    scene.create();

    const fireIdle = (delay: number): void => {
      const call = getMockFn(scene.time.delayedCall).mock.calls.find((c) => c[0] === delay);
      expect(call).toBeDefined();
      const callback = call?.[1] as () => void;
      callback();
    };

    fireIdle(25000);
    expect(mockAudio.playIdleCall).toHaveBeenCalledTimes(1);

    fireIdle(10000);
    expect(mockAudio.playIdleCall).toHaveBeenCalledTimes(2);
  });

  it("resets the idle timer on pointer input", () => {
    const scene = new HubScene();
    scene.create();

    const delayedCallMock = getMockFn(scene.time.delayedCall);
    const before = delayedCallMock.mock.calls.filter((call) => call[0] === 25000).length;

    const inputOnMock = getMockFn(scene.input.on);
    const pointerdownCall = inputOnMock.mock.calls.find((call) => call[0] === "pointerdown");
    expect(pointerdownCall).toBeDefined();
    if (pointerdownCall && typeof pointerdownCall[1] === "function") {
      (pointerdownCall[1] as () => void)();
    }

    const after = delayedCallMock.mock.calls.filter((call) => call[0] === 25000).length;
    expect(after).toBe(before + 1);
  });

  it("resumes the AudioContext on any first pointerdown so idle-attract audio is audible", () => {
    const scene = new HubScene();
    scene.create();

    const inputOnMock = getMockFn(scene.input.on);
    const pointerdownCall = inputOnMock.mock.calls.find((call) => call[0] === "pointerdown");
    expect(pointerdownCall).toBeDefined();
    if (pointerdownCall && typeof pointerdownCall[1] === "function") {
      (pointerdownCall[1] as () => void)();
    }

    expect(mockAudio.resume).toHaveBeenCalled();
  });

  it("clears the idle timer on shutdown", () => {
    const scene = new HubScene();
    scene.create();

    const delayedCallMock = getMockFn(scene.time.delayedCall);
    const idleCallIndex = delayedCallMock.mock.calls.findIndex((call) => call[0] === 25000);
    const idleTimer = delayedCallMock.mock.results[idleCallIndex]?.value as {
      remove: MockFn;
    };
    expect(idleTimer).toBeDefined();

    triggerShutdown(scene);

    expect(getMockFn(idleTimer.remove)).toHaveBeenCalled();
  });

  it("does not duplicate wiggle targets when the scene is re-created", () => {
    const scene = new HubScene();
    scene.create();
    // Revisit — scene.start("Hub") runs create() again on the same instance.
    scene.create();

    const idleCall = getMockFn(scene.time.delayedCall).mock.calls.find((call) => call[0] === 25000);
    expect(idleCall).toBeDefined();
    const callback = idleCall?.[1] as () => void;
    callback();

    const wiggleTweens = getMockFn(scene.tweens.add).mock.calls.filter(
      (call) => call[0]?.angle !== undefined && call[0]?.repeat === -1,
    );
    expect(wiggleTweens.length).toBe(2);
  });

  it("under reduced motion: plays the idle call but does not wiggle tiles", () => {
    vi.stubGlobal("window", {
      matchMedia: vi.fn(() => ({ matches: true })),
    });

    const scene = new HubScene();
    scene.create();

    const idleCall = getMockFn(scene.time.delayedCall).mock.calls.find((call) => call[0] === 25000);
    const callback = idleCall?.[1] as () => void;
    callback();

    expect(mockAudio.playIdleCall).toHaveBeenCalled();
    const wiggleTweens = getMockFn(scene.tweens.add).mock.calls.filter(
      (call) => call[0]?.angle !== undefined && call[0]?.repeat === -1,
    );
    expect(wiggleTweens.length).toBe(0);
  });
});

describe("game scene stubs", () => {
  it.each(GAME_SCENES)("navigates back to Hub via back button hold in $name", ({ SceneClass }) => {
    const scene = new SceneClass();
    scene.create();

    // Trigger pointerdown on the back button (starts ParentLock timer)
    triggerAllPointerdowns(scene);

    // Find ParentLock's delayedCall (3000ms default hold duration)
    const timeMock = getMockFn(scene.time.delayedCall);
    const parentLockCall = timeMock.mock.calls.find((call) => call[0] === 3000);

    if (!parentLockCall) {
      throw new Error("ParentLock delayedCall (3000ms) not found");
    }

    // Simulate hold completion (ParentLock success callback)
    const holdCallback = parentLockCall[1] as () => void;
    holdCallback();
    completeFadeOuts(scene);

    expect(getMockFn(scene.scene.start)).toHaveBeenCalledWith("Hub");
  });
});

describe("protected control touch targets", () => {
  it.each(GAME_SCENES)("gives the Back control a 96x96 hit area in $name", ({ SceneClass }) => {
    const scene = new SceneClass();
    scene.create();

    const backButton = getTextObject(scene, "Back");
    if (!backButton) throw new Error("Back button not found");
    expectTouchTargetSize(backButton);
  });

  it("gives the Hub Settings control a 96x96 hit area", () => {
    const scene = new HubScene();
    scene.create();

    const settingsButton = getTextObject(scene, "Settings");
    if (!settingsButton) throw new Error("Settings button not found");
    expectTouchTargetSize(settingsButton);
    expectHitAreaOrigin(settingsButton, 0, 0);
  });

  it("makes the Musical Memory Replay control tappable across its visible icon", () => {
    const scene = new MusicalMemoryScene();
    scene.create();

    const replayButton = getImageByKey(scene, "icon_speaker");
    if (!replayButton) throw new Error("Replay button not found");
    // Frame-based default hit area: covers exactly the visible 96x96 icon
    // (a custom centered rect is dead in Phaser 4 texture-local space).
    expectUsesDefaultFrameHitArea(replayButton);
  });
});

describe("control press feedback", () => {
  /** Fires every event listener registered on the control. */
  function fireControlEvent(obj: Record<string, MockFn>, event: string): void {
    const callbacks = getMockFn(obj.on)
      .mock.calls.filter((call) => call[0] === event)
      .map((call) => call[1] as () => void);
    if (callbacks.length === 0) throw new Error(`no '${event}' listener registered on control`);
    for (const callback of callbacks) {
      callback();
    }
  }

  it.each(GAME_SCENES)(
    "squishes the Back control while pressed and restores it in $name",
    ({ SceneClass }) => {
      const scene = new SceneClass();
      scene.create();

      const backButton = getTextObject(scene, "Back");
      if (!backButton) throw new Error("Back button not found");

      fireControlEvent(backButton, "pointerdown");
      expect(getMockFn(backButton.setScale)).toHaveBeenCalledWith(0.95);
      fireControlEvent(backButton, "pointerup");
      expect(getMockFn(backButton.setScale)).toHaveBeenLastCalledWith(1);
    },
  );

  it("squishes the Hub Settings control while pressed and restores it on cancel", () => {
    const scene = new HubScene();
    scene.create();

    const settingsButton = getTextObject(scene, "Settings");
    if (!settingsButton) throw new Error("Settings button not found");

    fireControlEvent(settingsButton, "pointerdown");
    expect(getMockFn(settingsButton.setScale)).toHaveBeenCalledWith(0.95);
    fireControlEvent(settingsButton, "pointercancel");
    expect(getMockFn(settingsButton.setScale)).toHaveBeenLastCalledWith(1);
  });

  it("squishes the Musical Memory Replay control while pressed and restores it on pointerout", () => {
    const scene = new MusicalMemoryScene();
    scene.create();

    const replayButton = getImageByKey(scene, "icon_speaker");
    if (!replayButton) throw new Error("Replay button not found");

    fireControlEvent(replayButton, "pointerdown");
    expect(getMockFn(replayButton.setScale)).toHaveBeenCalledWith(0.95);
    fireControlEvent(replayButton, "pointerout");
    expect(getMockFn(replayButton.setScale)).toHaveBeenLastCalledWith(1);
  });
});
