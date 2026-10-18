import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MockFn } from "../helpers/phaserMock";
import {
  completeFadeOuts,
  emitPwaEvent,
  expectUsesDefaultFrameHitArea,
  findLastAddedImage,
  fireAllObjectEvents,
  getAllGameObjects,
  getMockFn,
  getRectangles,
  getTextObject,
  getTileIcons,
  mockAudio,
  mockBridge,
  mockBridgeState,
  mockPwaToast,
  mockPwaToastDestroy,
  mockSettingsPanel,
  mockSpeech,
  triggerAllPointerdowns,
  triggerAllPointerups,
  triggerPointerupOn,
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
import { PreloadScene } from "../../scenes/PreloadScene";
import { ensureSceneLoaded } from "../../scenes/sceneRegistry";
import {
  addProfile,
  earnSticker,
  getActiveProfile,
  hasSticker,
  switchProfile,
} from "../../utils/storage";

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

import { GAME_SCENE_KEYS } from "../helpers/gameScenes";

describe("PreloadScene", () => {
  it("sets up progress bar during preload", () => {
    const scene = new PreloadScene();
    scene.preload();

    expect(getMockFn(scene.load.on)).toHaveBeenCalledWith("progress", expect.any(Function));
    expect(getMockFn(scene.load.on)).toHaveBeenCalledWith("complete", expect.any(Function));
  });

  it("transitions to HubScene on create", () => {
    const scene = new PreloadScene();
    scene.create();
    completeFadeOuts(scene);

    expect(getMockFn(scene.scene.start)).toHaveBeenCalledWith("Hub");
  });

  it("updates progress bar display size on progress event", () => {
    const scene = new PreloadScene();
    scene.preload();

    const loadOnMock = getMockFn(scene.load.on);
    const progressCall = loadOnMock.mock.calls.find((call) => call[0] === "progress");
    const progressCallback = progressCall?.[1] as (value: number) => void;

    const progressBar = getMockFn(scene.add.rectangle).mock.results[0].value as Record<
      string,
      MockFn
    >;

    progressCallback(0.5);
    expect(getMockFn(progressBar.setDisplaySize)).toHaveBeenCalledWith(150, 30);
  });

  it("destroys progress bar elements on complete event", () => {
    const scene = new PreloadScene();
    scene.preload();

    const loadOnMock = getMockFn(scene.load.on);
    const completeCall = loadOnMock.mock.calls.find((call) => call[0] === "complete");
    const completeCallback = completeCall?.[1] as () => void;

    const progressBar = getMockFn(scene.add.rectangle).mock.results[0].value as Record<
      string,
      MockFn
    >;
    const progressBox = getMockFn(scene.add.rectangle).mock.results[1].value as Record<
      string,
      MockFn
    >;

    completeCallback();
    expect(getMockFn(progressBar.destroy)).toHaveBeenCalled();
    expect(getMockFn(progressBox.destroy)).toHaveBeenCalled();
  });

  it("shows a brand lockup above the progress bar while loading", () => {
    const scene = new PreloadScene();
    scene.preload();

    const title = getTextObject(scene, "Aby's Little Lab");
    expect(title).toBeDefined();
    if (!title) throw new Error("preload title text not found");
    const tagline = getTextObject(scene, "Fun little games");
    expect(tagline).toBeDefined();
    if (!tagline) throw new Error("preload tagline text not found");

    const loadOnMock = getMockFn(scene.load.on);
    const completeCall = loadOnMock.mock.calls.find((call) => call[0] === "complete");
    const completeCallback = completeCall?.[1] as () => void;
    completeCallback();
    expect(getMockFn(title.destroy)).toHaveBeenCalled();
    expect(getMockFn(tagline.destroy)).toHaveBeenCalled();
  });

  it("loads all 170 shape, letter, numeral, animal/food, toy, sticker, bubble, card back, sleep glyph, tile icon, speaker icon, and mascot SVGs during preload", () => {
    const scene = new PreloadScene();
    scene.preload();

    const svgCalls = getMockFn(scene.load.svg).mock.calls;
    expect(svgCalls).toHaveLength(170);
  });

  it("loads shape SVGs with correct keys", () => {
    const scene = new PreloadScene();
    scene.preload();

    const svgCalls = getMockFn(scene.load.svg).mock.calls;
    const keys = svgCalls.map((call) => call[0] as string);

    expect(keys).toContain("shape_circle");
    expect(keys).toContain("shape_square");
    expect(keys).toContain("shape_triangle");
    expect(keys).toContain("shape_star");
    expect(keys).toContain("shape_heart");
    expect(keys).toContain("shape_crescent");
    expect(keys).toContain("cutout_circle");
    expect(keys).toContain("cutout_square");
    expect(keys).toContain("cutout_triangle");
    expect(keys).toContain("cutout_star");
    expect(keys).toContain("cutout_heart");
    expect(keys).toContain("cutout_crescent");
    expect(keys).toContain("sticker_shape_sorter");
  });

  it("loads animal and food SVGs with correct keys", () => {
    const scene = new PreloadScene();
    scene.preload();

    const svgCalls = getMockFn(scene.load.svg).mock.calls;
    const keys = svgCalls.map((call) => call[0] as string);

    expect(keys).toContain("animal_monkey");
    expect(keys).toContain("animal_rabbit");
    expect(keys).toContain("animal_cat");
    expect(keys).toContain("animal_dog");
    expect(keys).toContain("animal_elephant");
    expect(keys).toContain("animal_pig");
    expect(keys).toContain("food_banana");
    expect(keys).toContain("food_carrot");
    expect(keys).toContain("food_fish");
    expect(keys).toContain("food_bone");
    expect(keys).toContain("food_peanut");
    expect(keys).toContain("food_apple");
    expect(keys).toContain("sticker_animal_trace");
    expect(keys).toContain("bubble");
    expect(keys).toContain("sticker_pop_freeze");
  });

  it("loads both mascot poses with correct keys", () => {
    const scene = new PreloadScene();
    scene.preload();

    const svgCalls = getMockFn(scene.load.svg).mock.calls;
    const keys = svgCalls.map((call) => call[0] as string);

    expect(keys).toContain("mascot_idle");
    expect(keys).toContain("mascot_celebrate");
  });

  it("passes explicit width and height for high-res rasterization", () => {
    const scene = new PreloadScene();
    scene.preload();

    const svgCalls = getMockFn(scene.load.svg).mock.calls;
    for (const call of svgCalls) {
      expect(call[2]).toEqual(
        expect.objectContaining({
          width: expect.any(Number),
          height: expect.any(Number),
        }),
      );
    }
  });
});

describe("HubScene", () => {
  it("opens SettingsPanel when the settings parental lock succeeds", () => {
    const scene = new HubScene();
    scene.create();

    triggerAllPointerdowns(scene);
    const holdCallback = getMockFn(scene.time.delayedCall).mock.calls.find(
      (call) => call[0] === 3000,
    )?.[1] as () => void;
    holdCallback();

    expect(mockSettingsPanel).toHaveBeenCalledWith(scene, undefined, expect.any(Function));
  });

  it("refreshes the avatar chip when the settings panel reports a change", () => {
    const scene = new HubScene();
    scene.create();

    triggerAllPointerdowns(scene);
    const holdCallback = getMockFn(scene.time.delayedCall).mock.calls.find(
      (call) => call[0] === 3000,
    )?.[1] as () => void;
    holdCallback();

    // Simulate the profile add/delete flow in Settings: invoke the
    // onProgressReset callback passed to the panel, then add a profile.
    const settingsArgs = mockSettingsPanel.mock.calls.at(-1) as unknown[];
    const onProgressReset = settingsArgs[2] as () => void;
    addProfile("dog");
    onProgressReset();

    const chip = findLastAddedImage(scene, "animal_cat");
    expect(chip).toBeDefined();
    expect(getMockFn(chip?.setTexture)).toHaveBeenCalledWith("animal_dog");
  });

  it("creates 7 game tiles", () => {
    const scene = new HubScene();
    scene.create();

    const allObjects = getAllGameObjects(scene);
    const interactiveObjects = allObjects.filter(
      (obj) => getMockFn(obj.setInteractive).mock.calls.length > 0,
    );

    expect(interactiveObjects.length).toBeGreaterThanOrEqual(7);
  });

  it("renders one dedicated storybook icon image per game tile (textless differentiators)", () => {
    const scene = new HubScene();
    scene.create();

    const icons = getTileIcons(scene);
    expect(icons).toHaveLength(20);
    expect(new Set(icons.map((i) => i.key))).toEqual(
      new Set([
        "tile_shape_sorter",
        "tile_animal_trace",
        "tile_pop_freeze",
        "tile_shadow_match",
        "tile_musical_memory",
        "tile_big_small",
        "tile_pattern_builder",
        "tile_alphabet",
        "tile_word_match",
        "tile_word_builder",
        "tile_how_many",
        "tile_first_sounds",
        "tile_more_less",
        "tile_odd_one_out",
        "tile_color_match",
        "tile_add_it_up",
        "tile_take_away",
        "tile_memory_match",
        "tile_decode_it",
        "tile_number_order",
      ]),
    );
    // Icons render at their per-tile display size (>=64px default; the four
    // typography-heavy tiles use 56px so their ink clears the label). The
    // tile rect itself remains the 160x150 touch target for kids.
    for (const icon of icons) {
      const displaySizeCalls = getMockFn(icon.obj.setDisplaySize).mock.calls;
      expect(displaySizeCalls.length).toBeGreaterThanOrEqual(1);
      const size = displaySizeCalls.at(-1) as [number, number] | undefined;
      const tile = GAME_TILES.find((entry) => entry.tileKey === icon.key);
      const expected = tile?.iconDisplay ?? 64;
      expect(size?.[0]).toBe(expected);
      expect(size?.[1]).toBe(expected);
    }
  });

  it("creates sticker book checking sticker status for each game", () => {
    earnSticker("shape-sorter");

    const scene = new HubScene();
    scene.create();

    expect(hasSticker).toHaveBeenCalledTimes(20);
  });

  it("navigates to each game scene when respective tile is clicked", async () => {
    // A fresh Hub per navigation mirrors reality: once a transition starts,
    // the guard blocks further transitions on that instance until shutdown
    // (which Phaser fires when the Hub is replaced by the game scene).
    for (let i = 0; i < GAME_SCENE_KEYS.length; i++) {
      const scene = new HubScene();
      scene.create();

      const tile = getRectangles(scene)[i];
      fireAllObjectEvents(tile, "pointerup");
      // The tile handler awaits the (mocked) lazy scene loader before
      // transitioning, so flush the pending microtask before fading out.
      await new Promise((resolve) => setTimeout(resolve, 0));
      completeFadeOuts(scene);

      expect(ensureSceneLoaded).toHaveBeenCalledWith(scene, GAME_SCENE_KEYS[i]);
      expect(getMockFn(scene.scene.start)).toHaveBeenCalledWith(GAME_SCENE_KEYS[i]);
    }
  });

  it("launches a different game after auto-returning to the same scene instance", async () => {
    // Production replays ONE HubScene instance across visits: Phaser keeps
    // the Hub in its scene registry, so returning from a game re-runs
    // create() on the identical object instead of constructing a fresh one.
    const scene = new HubScene();
    scene.create();

    // First visit: launch Shape Sorter.
    const firstVisitRectCount = getRectangles(scene).length;
    fireAllObjectEvents(getRectangles(scene)[0], "pointerup");
    await new Promise((resolve) => setTimeout(resolve, 0));
    completeFadeOuts(scene);
    expect(getMockFn(scene.scene.start)).toHaveBeenCalledWith("ShapeSorter");

    // Phaser fires shutdown when the Hub is replaced by the game scene;
    // emit it through the working event emitter so BOTH on/once-registered
    // cleanup handlers run (the transition guard registers via once).
    scene.events.emit("shutdown");

    // Auto-return: the SAME instance re-runs create().
    scene.create();

    // Second visit: tap a DIFFERENT tile (second rect of the new batch).
    fireAllObjectEvents(getRectangles(scene)[firstVisitRectCount + 1], "pointerup");
    await new Promise((resolve) => setTimeout(resolve, 0));
    completeFadeOuts(scene);

    expect(ensureSceneLoaded).toHaveBeenCalledWith(scene, "AnimalTrace");
    expect(getMockFn(scene.scene.start)).toHaveBeenCalledWith("AnimalTrace");
  });

  it("resumes AudioManager when a tile is clicked", () => {
    const scene = new HubScene();
    scene.create();

    triggerAllPointerups(scene);

    expect(mockAudio.resume).toHaveBeenCalled();
  });

  it("unlocks WebKit speech on the first tile tap (iOS gesture unlock)", () => {
    const scene = new HubScene();
    scene.create();

    triggerAllPointerups(scene);

    expect(mockSpeech.unlockSpeechForUserGesture).toHaveBeenCalled();
  });

  it("starts BGM when a tile is clicked", () => {
    const scene = new HubScene();
    scene.create();

    triggerAllPointerups(scene);

    expect(mockAudio.playBGM).toHaveBeenCalled();
  });
});

describe("Hub profile switcher", () => {
  it("renders the active profile's avatar as a 96px chip on the Hub", () => {
    const scene = new HubScene();
    scene.create();

    const chip = findLastAddedImage(scene, "animal_cat");
    expect(chip).toBeDefined();
    if (!chip) return;
    // Frame-based default hit area covers the visible chip exactly.
    expectUsesDefaultFrameHitArea(chip);
    expect(getMockFn(chip.on).mock.calls.some((call) => call[0] === "pointerup")).toBe(true);
  });

  it("opens the avatar picker on chip tap without a parental hold", () => {
    const scene = new HubScene();
    scene.create();

    const chip = findLastAddedImage(scene, "animal_cat");
    if (!chip) throw new Error("chip not created");
    triggerPointerupOn(chip);

    expect((scene as unknown as { profileChip: { isOpen(): boolean } }).profileChip.isOpen()).toBe(
      true,
    );
    // No 3s parental hold involved: the 3000ms hold callback never fired.
    expect(getMockFn(scene.time.delayedCall).mock.calls.some((call) => call[0] === 3000)).toBe(
      false,
    );
    // Both chip and picker avatar use the active profile's texture.
    expect(
      getMockFn((scene as unknown as { add: Record<string, unknown> }).add.image).mock.calls.filter(
        (call) => call[2] === "animal_cat",
      ),
    ).toHaveLength(2);
  });

  it("switching profiles re-renders the sticker shelf and closes the picker", () => {
    addProfile("dog");
    const scene = new HubScene();
    scene.create();

    const chip = findLastAddedImage(scene, "animal_dog");
    if (!chip) throw new Error("chip not created");
    triggerPointerupOn(chip);

    expect(getActiveProfile().id).toBe("p2");
    const pickerAvatar = findLastAddedImage(scene, "animal_cat");
    if (!pickerAvatar) throw new Error("picker avatar not created");
    triggerPointerupOn(pickerAvatar);

    expect(getActiveProfile().id).toBe("p1");
    expect((scene as unknown as { profileChip: { isOpen(): boolean } }).profileChip.isOpen()).toBe(
      false,
    );
    // Shelf re-rendered: 20 more sticker lookups after the initial 20.
    expect(hasSticker).toHaveBeenCalledTimes(40);
    // Chip re-textured to the newly active profile.
    expect(getMockFn(chip.setTexture)).toHaveBeenCalledWith("animal_cat");
  });

  it("tapping outside the picker closes it without switching", () => {
    addProfile("dog");
    const scene = new HubScene();
    scene.create();

    const chip = findLastAddedImage(scene, "animal_dog");
    if (!chip) throw new Error("chip not created");
    triggerPointerupOn(chip);

    // The overlay is the full-screen (1024×768) rectangle added when the
    // picker opened. Match by geometry: decorative rectangles such as the
    // active-profile ring may be created after it.
    const rectangleMock = getMockFn(
      (scene as unknown as { add: Record<string, unknown> }).add.rectangle,
    );
    const overlay = rectangleMock.mock.results
      .map((r) => r.value as { args?: number[] } & Record<string, MockFn>)
      .filter((r) => r.args?.[2] === 1024)
      .at(-1);
    if (!overlay) throw new Error("overlay not created");
    triggerPointerupOn(overlay);

    expect(getActiveProfile().id).toBe("p2");
    expect((scene as unknown as { profileChip: { isOpen(): boolean } }).profileChip.isOpen()).toBe(
      false,
    );
    expect(hasSticker).toHaveBeenCalledTimes(20);
  });

  it("renders the sticker shelf for the active profile only", () => {
    // Award a sticker on p1 (default), then create p2 as the active profile.
    earnSticker("shape-sorter");
    addProfile("dog");
    const scene = new HubScene();
    scene.create();

    // p2 shelf render: shape-sorter is NOT earned.
    expect((hasSticker as MockFn).mock.results[0]?.value).toBe(false);

    // Switch back to p1 and re-render: shape-sorter IS earned.
    switchProfile("p1");
    (
      scene as unknown as { grid: { rerenderStickerShelf: () => void } }
    ).grid.rerenderStickerShelf();

    expect((hasSticker as MockFn).mock.results[20]?.value).toBe(true);
    expect((hasSticker as MockFn).mock.calls).toHaveLength(40);
  });
});

describe("Hub PWA lifecycle toasts", () => {
  beforeEach(() => {
    mockBridgeState.listener = null;
    mockPwaToast.mockClear();
    mockPwaToastDestroy.mockClear();
    mockBridge.setHubActive.mockClear();
    mockBridge.updateNow.mockClear();
    mockBridge.updateAvailable.mockClear();
    mockBridge.updateAvailable.mockReturnValue(false);
    mockBridge.subscribe.mockClear();
  });

  it("subscribes to the PWA bridge and marks the hub active on create", () => {
    const scene = new HubScene();
    scene.create();

    expect(mockBridge.subscribe).toHaveBeenCalledWith(expect.any(Function));
    expect(mockBridge.setHubActive).toHaveBeenCalledWith(true);
  });

  it("shows an update toast when the bridge reports a new version", () => {
    const scene = new HubScene();
    scene.create();

    emitPwaEvent("needRefresh");

    expect(mockPwaToast).toHaveBeenCalledTimes(1);
    const options = mockPwaToast.mock.calls[0]?.[1] as {
      kind: string;
      onUpdate?: () => void;
    };
    expect(options.kind).toBe("update");
  });

  it("shows an offline toast when the bridge reports offline readiness", () => {
    const scene = new HubScene();
    scene.create();

    emitPwaEvent("offlineReady");

    expect(mockPwaToast).toHaveBeenCalledTimes(1);
    const options = mockPwaToast.mock.calls[0]?.[1] as { kind: string };
    expect(options.kind).toBe("offline");
  });

  it("shows an update toast on create when an update is already available", () => {
    mockBridge.updateAvailable.mockReturnValue(true);

    const scene = new HubScene();
    scene.create();

    expect(mockPwaToast).toHaveBeenCalledTimes(1);
    const options = mockPwaToast.mock.calls[0]?.[1] as { kind: string };
    expect(options.kind).toBe("update");
  });

  it("does not show a toast on create when no update is available", () => {
    const scene = new HubScene();
    scene.create();

    expect(mockPwaToast).not.toHaveBeenCalled();
  });

  it("applies the update when the toast Update action fires", () => {
    const scene = new HubScene();
    scene.create();
    emitPwaEvent("needRefresh");

    const options = mockPwaToast.mock.calls[0]?.[1] as {
      onUpdate?: () => void;
    };
    options.onUpdate?.();

    expect(mockBridge.updateNow).toHaveBeenCalledTimes(1);
  });

  it("destroys the toast on scene shutdown", () => {
    const scene = new HubScene();
    scene.create();
    emitPwaEvent("offlineReady");

    triggerShutdown(scene);
    expect(mockPwaToastDestroy).toHaveBeenCalled();
  });
});

describe("Hub mascot companion", () => {
  /** Returns the mock object created for the mascot_idle image. */
  function getMascotImage(scene: HubScene): Record<string, MockFn> {
    const imageMock = getMockFn(scene.add.image);
    const index = imageMock.mock.calls.findIndex((call) => call[2] === "mascot_idle");
    return imageMock.mock.results[index].value as Record<string, MockFn>;
  }

  it("places Professor Hoot at a bottom corner at small scale", () => {
    const scene = new HubScene();
    scene.create();

    const imageMock = getMockFn(scene.add.image);
    const call = imageMock.mock.calls.find((c) => c[2] === "mascot_idle");
    expect(call).toBeDefined();
    const [x, y] = call as [number, number, string];
    expect(x).toBeGreaterThan(scene.cameras.main.width - 150);
    expect(y).toBeGreaterThan(scene.cameras.main.height - 150);

    const mascot = getMascotImage(scene);
    const scale = getMockFn(mascot.setScale).mock.calls[0][0] as number;
    expect(scale).toBeLessThan(0.5);
  });

  it("sits behind gameplay z-order and is touch-inert", () => {
    const scene = new HubScene();
    scene.create();

    const mascot = getMascotImage(scene);
    const depth = getMockFn(mascot.setDepth).mock.calls[0][0] as number;
    expect(depth).toBeLessThan(0);
    expect(getMockFn(mascot.setInteractive)).not.toHaveBeenCalled();
  });

  it("waves on load", () => {
    const scene = new HubScene();
    scene.create();

    const mascot = getMascotImage(scene);
    const tweenCalls = getMockFn(scene.tweens.add).mock.calls;
    const wave = tweenCalls.find((call) => call[0]?.targets === mascot && call[0]?.angle?.to === 8);
    expect(wave).toBeDefined();
  });

  it("cheers with the celebrate pose when justEarned is present", () => {
    earnSticker("shape-sorter");
    const scene = new HubScene();
    scene.init({ justEarned: "shape-sorter" });
    scene.create();

    const mascot = getMascotImage(scene);
    expect(getMockFn(mascot.setTexture)).toHaveBeenCalledWith("mascot_celebrate");

    const tweenCalls = getMockFn(scene.tweens.add).mock.calls;
    const bounce = tweenCalls.find(
      (call) => call[0]?.targets === mascot && typeof call[0]?.scale === "number",
    );
    expect(bounce).toBeDefined();
    expect(bounce?.[0]?.scale).toBeCloseTo(0.2 * 1.1, 5);
  });

  it("still waves and does not cheer when justEarned is absent", () => {
    const scene = new HubScene();
    scene.create();

    const mascot = getMascotImage(scene);
    expect(getMockFn(mascot.setTexture)).not.toHaveBeenCalledWith("mascot_celebrate");
  });

  it("runs the idle loop on the Hub", () => {
    const scene = new HubScene();
    scene.create();

    const mascot = getMascotImage(scene);
    const tweenCalls = getMockFn(scene.tweens.add).mock.calls;
    const bob = tweenCalls.find((call) => call[0]?.targets === mascot && call[0]?.repeat === -1);
    expect(bob).toBeDefined();
  });

  it("is destroyed on scene shutdown", () => {
    const scene = new HubScene();
    scene.create();

    const mascot = getMascotImage(scene);
    triggerShutdown(scene);
    expect(getMockFn(mascot.destroy)).toHaveBeenCalledTimes(1);
  });
});
