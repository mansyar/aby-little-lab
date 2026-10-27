import type Phaser from "phaser";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type MatchMediaStub, stubMatchMedia } from "../helpers/matchMediaStub";
import { type MockFn, type MockObject, MockScene, mockRegistry } from "../helpers/phaserMock";
import { settleLoad } from "../helpers/sceneFlowHarness";

const { mockAudio, mockRecordGamePlay, idleScheduler, artScheduler, chunkLoaders } = vi.hoisted(
  () => {
    const mockAudio = {
      init: vi.fn(),
      resume: vi.fn(),
      playBGM: vi.fn(),
      playCorrect: vi.fn(),
      playIncorrect: vi.fn(),
      playWin: vi.fn(),
      playSticker: vi.fn(),
      playPop: vi.fn(),
      playWake: vi.fn(),
      playFrogNote: vi.fn(),
      playIdleCall: vi.fn(),
    };
    const mockRecordGamePlay = vi.fn();
    /**
     * Manual idle scheduler: records every request so a test decides when an
     * idle slot fires. The prewarm engine keeps its real pacing (one import in
     * flight, cancelled slots dropped); only the platform clock is stood in for.
     */
    function createManualScheduler(): {
      request: (callback: () => void) => number;
      cancel: (handle: number) => void;
      /** Runs the oldest queued idle callback; false when none is pending. */
      fire: () => boolean;
      /** Number of idle callbacks still queued. */
      size: () => number;
      clear: () => void;
    } {
      const slots = new Map<number, () => void>();
      let nextHandle = 0;
      return {
        request(callback: () => void): number {
          nextHandle += 1;
          slots.set(nextHandle, callback);
          return nextHandle;
        },
        cancel(handle: number): void {
          slots.delete(handle);
        },
        fire(): boolean {
          const oldest = slots.entries().next();
          if (oldest.done) return false;
          slots.delete(oldest.value[0]);
          oldest.value[1]();
          return true;
        },
        size(): number {
          return slots.size;
        },
        clear(): void {
          slots.clear();
        },
      };
    }
    /** Drives the chunk pass; the art pass gets its own scheduler below. */
    const idleScheduler = createManualScheduler();
    /** Drives the art pass so chunk and art pacing stay independently observable. */
    const artScheduler = createManualScheduler();
    /** Three of the 22 lazy chunks, enough to observe order and pacing. */
    const chunkLoaders = {
      ShapeSorter: vi.fn(() => Promise.resolve("ShapeSorter")),
      AnimalTrace: vi.fn(() => Promise.resolve("AnimalTrace")),
      PopFreeze: vi.fn(() => Promise.resolve("PopFreeze")),
    };
    return { mockAudio, mockRecordGamePlay, idleScheduler, artScheduler, chunkLoaders };
  },
);

/**
 * Mock Phaser module. HubScene extends Phaser.Scene, which at runtime resolves
 * to MockScene. Every created game object records its event handlers in
 * mockRegistry so tests can drive interactions (e.g. tile taps) directly.
 */
vi.mock("phaser", async () => {
  const { createPhaserModuleMock } = await import("../helpers/phaserMock");
  return createPhaserModuleMock().module;
});

/** Mock AudioManager so create() can start/resume audio without real AudioContext. */
vi.mock("../../audio/AudioManager", () => ({
  AudioManager: {
    getInstance: () => mockAudio,
  },
}));

/** Mock scene components; their internals are covered by their own tests. */
vi.mock("../../components/Mascot", () => ({
  createCornerMascot: vi.fn(() => ({
    cheer: vi.fn(),
    wave: vi.fn(),
    flapGreeting: vi.fn(),
    nod: vi.fn(),
    idleLoop: vi.fn(),
    destroy: vi.fn(),
  })),
}));

vi.mock("../../components/ParentLock", () => ({
  ParentLock: class {
    destroy = vi.fn();
  },
}));

vi.mock("../../components/PwaToast", () => ({
  PwaToast: class {
    destroy = vi.fn();
    show = vi.fn();
  },
}));

vi.mock("../../components/SettingsPanel", () => ({
  SettingsPanel: class {
    destroy = vi.fn();
  },
}));

/**
 * The game-entry art cue: idle prewarm must never create or show it (FR-2), so
 * the mock records construction and the art tests assert it stays untouched
 * while the Hub rasterizes keys.
 */
vi.mock("../../components/ArtLoadingCue", () => ({
  createArtLoadingCue: vi.fn(() => ({
    show: vi.fn(),
    clear: vi.fn(),
    destroy: vi.fn(),
  })),
}));

/** Hub-only browser bridges: keep them inert in tests. */
vi.mock("../../utils/pwaBridge", () => ({
  getPwaBridge: vi.fn(() => null),
}));

vi.mock("../../utils/speech", () => ({
  unlockSpeechForUserGesture: vi.fn(),
}));

/**
 * Lazy chunk loading is not exercised here; the retrying wrapper reports
 * success. The prewarm sees real loaders so its pacing and ordering can be
 * driven through the manual idle scheduler.
 */
vi.mock("../../scenes/sceneRegistry", () => ({
  ensureSceneLoaded: vi.fn(() => Promise.resolve()),
  loadSceneWithRetry: vi.fn(() => Promise.resolve(true)),
  sceneLoaders: chunkLoaders,
}));

/**
 * Partial prewarm mock: the real engines run (pacing, cancellation and the
 * shared queued sets are their contract), with a manual scheduler injected per
 * pass and the returned controller wrapped so a test can assert cancellation.
 * Chunk and art slots live on separate schedulers so each pass's pacing stays
 * independently observable.
 */
vi.mock("../../game/hub/prewarm", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../game/hub/prewarm")>();
  return {
    ...actual,
    startPrewarm: vi.fn((options: StartPrewarmOptions) => {
      const controller = actual.startPrewarm({ ...options, scheduler: idleScheduler });
      return { cancel: vi.fn(() => controller.cancel()) };
    }),
    startArtPrewarm: vi.fn((options: StartArtPrewarmOptions) => {
      const controller = actual.startArtPrewarm({ ...options, scheduler: artScheduler });
      return { cancel: vi.fn(() => controller.cancel()) };
    }),
  };
});

/**
 * Partial storage mock: keep the real implementation (persistence assertions
 * stay meaningful) but spy on recordGamePlay to assert wiring. The spy calls
 * through to the real function so recorded plays actually persist.
 */
vi.mock("../../utils/storage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../utils/storage")>();
  mockRecordGamePlay.mockImplementation((gameId: GameId) => {
    actual.recordGamePlay(gameId);
  });
  return { ...actual, recordGamePlay: mockRecordGamePlay };
});

import { createArtLoadingCue } from "../../components/ArtLoadingCue";
import { music } from "../../game/art/music";
import { preloadArtGroups } from "../../game/art/registry";
import { shapes } from "../../game/art/shapes";
import artGroupsSource from "../../game/hub/artGroups.ts?raw";
import {
  ART_KEYS_BY_GAME,
  type ArtKeyEntry,
  type StartArtPrewarmOptions,
  type StartPrewarmOptions,
  startArtPrewarm,
  startPrewarm,
} from "../../game/hub/prewarm";
import { HubScene } from "../../scenes/HubScene";
import hubSceneSource from "../../scenes/HubScene.ts?raw";
import { loadSceneWithRetry } from "../../scenes/sceneRegistry";
import type { GameId } from "../../types";
import {
  addProfile,
  earnSticker,
  getActiveProfile,
  getAvailableAvatars,
  getProfiles,
  getProgress,
  recordPlayTime,
  setPlayTimeLimit,
} from "../../utils/storage";

/** Returns the first object of the given kind registered for an event. */
function getHandler(kind: string, event: string): ((...args: unknown[]) => unknown) | undefined {
  return mockRegistry.find((obj) => obj.kind === kind && obj.handlers[event])?.handlers[event];
}

/** Scene-level input handlers captured by the mock Phaser input plugin. */
function sceneInputHandlers(scene: HubScene): Record<string, MockFn[]> {
  return (scene as unknown as { sceneInputHandlers: Record<string, MockFn[]> }).sceneInputHandlers;
}

/** Scale-manager handlers captured by the mock Phaser scale plugin. */
function scaleHandlers(scene: HubScene): Record<string, MockFn[]> {
  return (scene as unknown as { scaleHandlers: Record<string, MockFn[]> }).scaleHandlers;
}

describe("HubScene paged grid (narrow viewports)", () => {
  /** Builds a Hub on a small-phone landscape viewport (844x390 CSS px). */
  function createNarrowHub(): HubScene {
    const scene = new HubScene();
    (scene.scale as unknown as { displaySize: { width: number; height: number } }).displaySize = {
      width: 844,
      height: 390,
    };
    scene.create();
    return scene;
  }

  /** All paged-size tile rectangles (176x196) in creation order. */
  function pagedRects(): MockObject[] {
    return mockRegistry.filter((obj) => {
      const [, , w, h] = (obj.args ?? []) as unknown[];
      return obj.kind === "rectangle" && w === 176 && h === 196;
    });
  }

  /** The page-dot circles in creation order. */
  function pageDots(): MockObject[] {
    return mockRegistry.filter((obj) => {
      const [, y, r] = (obj.args ?? []) as unknown[];
      return obj.kind === "circle" && y === 640 && r === 8;
    });
  }

  beforeEach(() => {
    stubMatchMedia(false);
    localStorage.clear();
    mockRegistry.length = 0;
    mockRecordGamePlay.mockClear();
    for (const fn of Object.values(mockAudio)) {
      fn.mockClear();
    }
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("renders exactly one page of 10 larger tiles and no wide tiles", () => {
    createNarrowHub();

    expect(pagedRects().length).toBe(10);
    const wideTiles = mockRegistry.filter((obj) => {
      const [, , w, h] = (obj.args ?? []) as unknown[];
      return obj.kind === "rectangle" && w === 144 && h === 116;
    });
    expect(wideTiles.length).toBe(0);
  });

  it("maps page-1 tiles to games 11-20 (How Many? first)", async () => {
    const scene = createNarrowHub();

    // Flip to page 2 via the second dot.
    pageDots()[1].handlers.pointerup?.();

    const afterFlip = pagedRects().length;
    expect(afterFlip).toBe(20); // outgoing page lingers (slide timer mocked)
    const pageOneFirst = pagedRects()[10];
    pageOneFirst.handlers.pointerup?.();
    // The play is charged only once the load resolved.
    await settleLoad(loadSceneWithRetry);

    expect(mockRecordGamePlay).toHaveBeenCalledWith("how-many");
    expect(scene).toBeDefined();
  });

  it("builds the last page as two centred tiles", () => {
    createNarrowHub();

    pageDots()[2].handlers.pointerup?.();

    // The outgoing page lingers under the mock slide timer: 10 + 2 rects.
    const rects = pagedRects();
    expect(rects.length).toBe(12);
    const incoming = rects.slice(10);
    expect(incoming).toHaveLength(2);

    // Two 176px columns centred on the 1024px canvas: 414 and 610 about 512.
    // The incoming page is created a canvas-width to the right and slides in.
    const shifted = incoming.map((tile) => (tile.args?.[0] as number) - 1024);
    const xs = shifted.sort((a, b) => a - b);
    expect(xs[0]).toBeCloseTo(414, 5);
    expect(xs[1]).toBeCloseTo(610, 5);
    expect((xs[0] + xs[1]) / 2).toBeCloseTo(512, 5);
  });

  it("launches Story Order from the 22nd tile on the last page", async () => {
    createNarrowHub();

    pageDots()[2].handlers.pointerup?.();
    const incoming = pagedRects().slice(10);
    expect(incoming).toHaveLength(2);
    incoming[1].handlers.pointerup?.();
    await settleLoad(loadSceneWithRetry);

    expect(mockRecordGamePlay).toHaveBeenCalledWith("story-order");
  });

  it("shows one textless page dot per page, active page highlighted", () => {
    createNarrowHub();

    const dots = pageDots();
    expect(dots.length).toBe(3);
    // Active dot bright, inactive dots dim.
    expect(dots[0].setAlpha).toHaveBeenCalledWith(expect.closeTo(0.9, 5));
    expect(dots[1].setAlpha).toHaveBeenCalledWith(expect.closeTo(0.25, 5));
    expect(dots[2].setAlpha).toHaveBeenCalledWith(expect.closeTo(0.25, 5));
  });

  it("flips pages on a horizontal swipe inside the grid region", () => {
    const scene = createNarrowHub();

    scene_input_down(scene, 512, 300);
    scene_input_move(scene, 400, 300);
    scene_input_up(scene, 400, 300);

    // Page 2 was built (outgoing page lingers under the mock timers).
    expect(pagedRects().length).toBe(20);
    // Dots flipped: second dot is now the active one.
    const dots = pageDots();
    const lastAlphaSecond = (dots[1].setAlpha as MockFn).mock.calls.at(-1)?.[0];
    expect(lastAlphaSecond).toBeCloseTo(0.9, 5);
  });

  it("ignores vertical drags", () => {
    const scene = createNarrowHub();

    scene_input_down(scene, 512, 200);
    scene_input_move(scene, 512, 330);
    scene_input_up(scene, 512, 330);

    expect(pagedRects().length).toBe(10);
  });

  it("ignores swipes that start outside the grid region", () => {
    const scene = createNarrowHub();

    // Avatar-chip band (top-left), well outside the paged grid bounds.
    scene_input_down(scene, 60, 60);
    scene_input_move(scene, 200, 60);
    scene_input_up(scene, 300, 60);

    expect(pagedRects().length).toBe(10);
  });

  it("swallows tile taps once a swipe is in flight", () => {
    const scene = createNarrowHub();

    scene_input_down(scene, 512, 300);
    scene_input_move(scene, 400, 300); // past the 60px threshold -> swiping
    const tile = pagedRects()[0];
    tile.handlers.pointerup?.();

    expect(mockRecordGamePlay).not.toHaveBeenCalled();
  });

  it("builds the same single page without slide tweens under reduced motion", () => {
    stubMatchMedia(true);
    createNarrowHub();

    expect(pagedRects().length).toBe(10);
    const dots = pageDots();
    expect(dots.length).toBe(3);
  });

  /** Fires a scene-level pointer event through the captured input handlers. */
  function scene_input_down(scene: HubScene, x: number, y: number): void {
    for (const handler of sceneInputHandlers(scene).pointerdown ?? []) handler({ x, y });
  }
  function scene_input_move(scene: HubScene, x: number, y: number): void {
    for (const handler of sceneInputHandlers(scene).pointermove ?? []) handler({ x, y });
  }
  function scene_input_up(scene: HubScene, x: number, y: number): void {
    for (const handler of sceneInputHandlers(scene).pointerup ?? []) handler({ x, y });
  }

  /** All wide-grid tile rectangles (144x116) in creation order. */
  function wideRects(): MockObject[] {
    return mockRegistry.filter((obj) => {
      const [, , w, h] = (obj.args ?? []) as unknown[];
      return obj.kind === "rectangle" && w === 144 && h === 116;
    });
  }

  /** Fires the Phaser scale-manager resize event with a new display size. */
  function fireResize(scene: HubScene, width: number, height: number): void {
    (scene.scale as unknown as { displaySize: { width: number; height: number } }).displaySize = {
      width,
      height,
    };
    // The resize handler is registered with the grid as its `this` context
    // (Phaser calls fn.call(context)), so dispatch it the same way.
    const grid = (scene as unknown as { grid: unknown }).grid;
    for (const handler of scaleHandlers(scene).resize ?? []) handler.call(grid);
  }

  it("registers a resize listener on the scale manager", () => {
    const scene = createNarrowHub();
    expect(scaleHandlers(scene).resize?.length).toBe(1);
  });

  it("rebuilds as a paged grid when a resize crosses below the touch floor", () => {
    const scene = new HubScene();
    scene.create();
    expect(wideRects().length).toBe(22);
    expect(pageDots().length).toBe(0);
    const wideBefore = wideRects().length;

    fireResize(scene, 844, 390);

    // The registry accumulates destroyed objects, so "rebuild" is asserted as
    // newly-created paged tiles and zero additional wide tiles.
    expect(pagedRects().length).toBe(10);
    expect(wideRects().length).toBe(wideBefore);
    expect(pageDots().length).toBe(3);
  });

  it("rebuilds the wide grid when a resize crosses back above the threshold", () => {
    const scene = createNarrowHub();
    expect(pagedRects().length).toBe(10);
    const pagedBefore = pagedRects().length;
    const dotsBefore = pageDots().length;

    fireResize(scene, 1024, 768);

    expect(wideRects().length).toBe(22);
    expect(pagedRects().length).toBe(pagedBefore);
    expect(pageDots().length).toBe(dotsBefore);
  });

  it("drops the retry cue when a resize rebuilds the grid under it", async () => {
    const scene = createNarrowHub();
    vi.mocked(loadSceneWithRetry).mockResolvedValueOnce(false);

    // The cue's hit floor is the only 96x96 rectangle the Hub adds.
    const cueFloors = () =>
      mockRegistry.filter(
        (obj) => obj.kind === "rectangle" && obj.args?.[2] === 96 && obj.args?.[3] === 96,
      );
    pagedRects()[0].handlers.pointerup?.();
    await settleLoad(loadSceneWithRetry);
    const cueFloor = cueFloors().at(-1);
    if (!cueFloor) throw new Error("retry cue not on screen");

    // Crossing back above the touch floor rebuilds every tile the cue could be
    // anchored to, so the cue goes with them rather than sitting over a slot
    // that now belongs to another game.
    fireResize(scene, 1024, 768);

    expect(cueFloor.destroy).toHaveBeenCalled();
  });

  it("leaves the grid untouched when a resize stays in the same classification", () => {
    const scene = new HubScene();
    scene.create();

    fireResize(scene, 1600, 900);

    expect(wideRects().length).toBe(22);
    expect(pagedRects().length).toBe(0);
    expect(pageDots().length).toBe(0);
  });

  it("resets to page 1 tiles when re-classifying after paging", () => {
    const scene = createNarrowHub();
    // Flip to page 2 via the second page dot, then cross back to wide.
    const secondDot = pageDots()[1];
    secondDot.handlers.pointerup?.[0]?.();
    expect(pagedRects().length).toBe(10);
    fireResize(scene, 1024, 768);
    // The rebuilt wide grid must contain all 22 games.
    expect(wideRects().length).toBe(22);
  });

  it("unregisters the resize listener on shutdown", () => {
    const scene = createNarrowHub();
    const shutdown = (scene as unknown as { eventsHandlers: Record<string, MockFn[]> })
      .eventsHandlers.shutdown?.[0];
    expect(shutdown).toBeDefined();
    shutdown?.();
    expect(scene.scale.off).toHaveBeenCalledWith(
      "resize",
      expect.any(Function),
      (scene as unknown as { grid: unknown }).grid,
    );
  });

  it("ignores swipes while the profile picker overlay is open", () => {
    const scene = createNarrowHub();
    // Open the picker by tapping the avatar chip (image at 68, 68).
    const chip = mockRegistry.find(
      (obj) => obj.kind === "image" && obj.args?.[0] === 68 && obj.args?.[1] === 68,
    );
    if (!chip) throw new Error("profile chip image not found");
    // Fire every pointerup handler (press feedback + open) in dispatch order.
    for (const { name, cb } of chip.allHandlers) {
      if (name === "pointerup") cb();
    }

    const dotsBefore = pageDots().reduce((sum, dot) => sum + dot.setAlpha.mock.calls.length, 0);
    const rectsBefore = pagedRects().length;

    // A full swipe inside the grid region while the picker is open must not
    // flip the page behind the overlay.
    scene_input_down(scene, 422, 193);
    scene_input_move(scene, 362, 193);
    scene_input_up(scene, 302, 193);

    expect(pagedRects().length).toBe(rectsBefore);
    expect(pageDots().reduce((sum, dot) => sum + dot.setAlpha.mock.calls.length, 0)).toBe(
      dotsBefore,
    );
  });
});

describe("HubScene session-start recording", () => {
  beforeEach(() => {
    stubMatchMedia(false);
    localStorage.clear();
    mockRegistry.length = 0;
    mockRecordGamePlay.mockClear();
    for (const fn of Object.values(mockAudio)) {
      fn.mockClear();
    }
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("records a play for the tapped tile's game on the active profile", async () => {
    const scene = new HubScene();
    scene.create();

    const tapTile = getHandler("rectangle", "pointerup");
    expect(tapTile).toBeDefined();
    tapTile?.();
    await settleLoad(loadSceneWithRetry);

    expect(mockRecordGamePlay).toHaveBeenCalledTimes(1);
    expect(mockRecordGamePlay).toHaveBeenCalledWith("shape-sorter");
    // Persisted through the real storage implementation.
    expect(getProgress()["shape-sorter"].plays).toBe(1);
    expect(getProgress()["color-match"].plays).toBe(0);
  });

  it("ignores taps on other tiles once navigation has started", async () => {
    const scene = new HubScene();
    scene.create();

    const tapTiles = mockRegistry.filter(
      (obj) => obj.kind === "rectangle" && obj.handlers.pointerup,
    );
    expect(tapTiles.length).toBeGreaterThanOrEqual(2);
    tapTiles[0].handlers.pointerup?.();
    tapTiles[1].handlers.pointerup?.();
    await settleLoad(loadSceneWithRetry);

    expect(mockRecordGamePlay).toHaveBeenCalledTimes(1);
    expect(mockRecordGamePlay).toHaveBeenCalledWith("shape-sorter");
  });

  it("does not double-record when a tile is tapped repeatedly", async () => {
    const scene = new HubScene();
    scene.create();

    const tapTile = getHandler("rectangle", "pointerup");
    expect(tapTile).toBeDefined();
    tapTile?.();
    tapTile?.();
    await settleLoad(loadSceneWithRetry);

    expect(mockRecordGamePlay).toHaveBeenCalledTimes(1);
    expect(getProgress()["shape-sorter"].plays).toBe(1);
  });

  it("renders all 22 tiles fully inside the 1024×768 canvas (6×4 grid)", () => {
    const scene = new HubScene();
    scene.create();

    const tiles = mockRegistry.filter((obj) => obj.kind === "rectangle" && obj.handlers.pointerup);
    expect(tiles).toHaveLength(22);

    for (const tile of tiles) {
      const [x, y, width, height] = tile.args as number[];
      expect(y - height / 2).toBeGreaterThanOrEqual(0);
      expect(y + height / 2).toBeLessThanOrEqual(768);
      expect(x - width / 2).toBeGreaterThanOrEqual(0);
      expect(x + width / 2).toBeLessThanOrEqual(1024);
    }
  });
});

describe("HubScene profile and hierarchy cohesion", () => {
  let matchMediaMock: MatchMediaStub;

  beforeEach(() => {
    matchMediaMock = stubMatchMedia(false);
    localStorage.clear();
    mockRegistry.length = 0;
    mockRecordGamePlay.mockClear();
    for (const fn of Object.values(mockAudio)) {
      fn.mockClear();
    }
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  /** Toggles the `prefers-reduced-motion` media query result. */
  function setReducedMotion(reduced: boolean): void {
    matchMediaMock.setReducedMotion(reduced);
  }

  function getNavTiles(): MockObject[] {
    return mockRegistry.filter((obj) => obj.kind === "rectangle" && obj.handlers.pointerup);
  }

  function getChipImage(): MockObject {
    const chip = mockRegistry.find(
      (obj) => obj.kind === "image" && obj.args?.[0] === 68 && obj.args?.[1] === 68,
    );
    if (!chip) throw new Error("profile chip image not found");
    return chip;
  }

  /** Small decorative/state rectangles (rings, badges) near a point. */
  function getSmallRectsNear(cx: number, cy: number, tolerance = 2): MockObject[] {
    return mockRegistry.filter((obj) => {
      if (obj.kind !== "rectangle") return false;
      const [x, y, w, h] = obj.args as number[];
      if (w > 300 || h > 300) return false;
      return Math.abs(x - cx) <= tolerance && Math.abs(y - cy) <= tolerance;
    });
  }

  /** Fires every handler for an event, matching real Phaser dispatch order. */
  function fireAll(obj: MockObject, event: string): void {
    for (const { name, cb } of obj.allHandlers) {
      if (name === event) cb();
    }
  }

  it("marks the active-profile avatar chip with a persistent ring outline", () => {
    setReducedMotion(false);
    const scene = new HubScene();
    scene.create();

    const chip = getChipImage();
    expect(chip).toBeDefined();

    // A flat storybook ring centered on the chip (not scale alone).
    const rings = getSmallRectsNear(chip.args?.[0] as number, chip.args?.[1] as number);
    expect(rings.length).toBeGreaterThan(0);
    const ring = rings[0];
    if (!ring) throw new Error("chip ring rectangle not found");
    const [, , rw, rh] = ring.args as number[];
    expect(rw).toBeGreaterThanOrEqual(72); // AVATAR_CHIP_DISPLAY
    expect(rh).toBeGreaterThanOrEqual(72);
  });

  it("marks the active avatar inside the picker with a ring while keeping its larger scale", () => {
    setReducedMotion(false);
    const scene = new HubScene();
    scene.create();

    // Ensure at least two profiles so the picker has a real choice.
    if (getProfiles().length < 2) {
      addProfile(getAvailableAvatars()[0]);
      mockRegistry.length = 0;
      const fresh = new HubScene();
      fresh.create();
    }

    const baseScale = 96 / 256; // PICKER_AVATAR_DISPLAY / AVATAR_TEXTURE_SIZE
    const activeScale = baseScale * 1.15;
    fireAll(getChipImage(), "pointerup");

    const avatars = mockRegistry.filter(
      (obj) =>
        obj.kind === "image" &&
        obj.args?.[1] === 384 &&
        obj.setScale.mock.calls.some((call) => call[0] === activeScale),
    );
    expect(avatars).toHaveLength(1);
    const active = avatars[0];
    if (!active) throw new Error("active picker avatar not found");

    const rings = getSmallRectsNear(active.args?.[0] as number, 384);
    expect(rings.length).toBeGreaterThan(0);

    // The larger scale remains as an additional cue (pin existing behavior).
    expect(active.setScale).toHaveBeenCalledWith(activeScale);
    const inactive = mockRegistry.filter(
      (obj) =>
        obj.kind === "image" &&
        obj.args?.[1] === 384 &&
        obj !== active &&
        obj.setScale.mock.calls.some((call) => call[0] === baseScale),
    );
    expect(inactive.length).toBe(getProfiles().length - 1);
  });

  it("keeps pressed-tile feedback without breaking navigation semantics", () => {
    setReducedMotion(false);
    const scene = new HubScene();
    scene.create();

    const tile = getNavTiles()[0];
    // Press feedback attaches when the entrance tween completes; simulate it.
    const entrance = (scene.tweens.add as MockFn).mock.calls
      .map((call) => call[0] as { targets?: unknown[]; onComplete?: () => void })
      .find(
        (config) =>
          Array.isArray(config.targets) &&
          config.targets.includes(tile) &&
          typeof config.onComplete === "function",
      );
    expect(entrance).toBeDefined();
    if (!entrance || typeof entrance.onComplete !== "function") {
      throw new Error("tile entrance tween with onComplete callback not found");
    }
    entrance.onComplete();

    expect(tile.handlers.pointerdown).toBeDefined();
    tile.handlers.pointerdown?.();
    expect(tile.setScale).toHaveBeenCalledWith(0.95);
    expect(tile.handlers.pointercancel).toBeDefined();
  });

  it("preserves the 6×4 grid geometry at 1024×768", () => {
    setReducedMotion(false);
    const scene = new HubScene();
    scene.create();

    const tiles = getNavTiles();
    expect(tiles).toHaveLength(22);

    const rows = new Map<number, MockObject[]>();
    for (const tile of tiles) {
      const y = tile.args?.[1] as number;
      const row = rows.get(y);
      if (row) row.push(tile);
      else rows.set(y, [tile]);
    }
    const rowSizes = [...rows.keys()].sort((a, b) => a - b).map((y) => rows.get(y)?.length ?? 0);
    expect(rowSizes).toEqual([6, 6, 6, 4]);

    for (const [, row] of rows) {
      const xs = row.map((t) => t.args?.[0] as number).sort((a, b) => a - b);
      for (let i = 1; i < xs.length; i++) {
        expect(xs[i] - xs[i - 1]).toBeCloseTo(166, 0); // TILE_WIDTH(144)+TILE_SPACING(22)
      }
    }
  });

  it("shows earned stickers on the shelf and dashed slots for unearned ones", () => {
    setReducedMotion(false);
    earnSticker("shape-sorter");
    earnSticker("color-match");
    const scene = new HubScene();
    scene.create();

    const earned = mockRegistry.filter(
      (obj) =>
        obj.kind === "image" &&
        typeof obj.args?.[2] === "string" &&
        (obj.args[2] as string).startsWith("sticker_"),
    );
    expect(earned).toHaveLength(2);

    // Dashed empty slots draw arcs at the sticker radius (11px).
    const emptySlots = mockRegistry.filter(
      (obj) => obj.kind === "graphics" && obj.arc.mock.calls.some((call) => call[2] === 11),
    );
    expect(emptySlots).toHaveLength(20);
  });

  it("locks tiles with a moon badge once the daily limit is reached", () => {
    setReducedMotion(false);
    const profileId = getActiveProfile().id;
    setPlayTimeLimit(profileId, 30);
    recordPlayTime(profileId, 30);
    const scene = new HubScene();
    scene.create();

    for (const tile of getNavTiles()) {
      expect(tile.setAlpha).toHaveBeenCalledWith(0.45); // TIME_UP_TILE_ALPHA
      expect(tile.disableInteractive).toHaveBeenCalled();
    }

    const moons = mockRegistry.filter(
      (obj) => obj.kind === "graphics" && obj.fillCircle.mock.calls.length >= 2,
    );
    expect(moons.length).toBeGreaterThan(0);
  });

  it("keeps tiles interactive with a hint arc when time remains", () => {
    setReducedMotion(false);
    const profileId = getActiveProfile().id;
    setPlayTimeLimit(profileId, 30);
    recordPlayTime(profileId, 26);
    const scene = new HubScene();
    scene.create();

    for (const tile of getNavTiles()) {
      expect(tile.disableInteractive).not.toHaveBeenCalled();
    }
    const arcs = mockRegistry.filter(
      (obj) =>
        obj.kind === "graphics" &&
        obj.slice.mock.calls.some((call) => call[2] === 12) && // HINT_ARC_RADIUS
        obj.fillStyle.mock.calls.some((call) => call[0] === 0xed8936), // HINT_WARM_COLOR
    );
    expect(arcs.length).toBeGreaterThan(0);
  });

  it("switches profiles from the picker and re-textures the chip", () => {
    setReducedMotion(false);
    const scene = new HubScene();
    scene.create();
    if (getProfiles().length < 2) {
      addProfile(getAvailableAvatars()[0]);
      mockRegistry.length = 0;
      const fresh = new HubScene();
      fresh.create();
    }

    const before = getActiveProfile().id;
    fireAll(getChipImage(), "pointerup");

    const baseScale = 96 / 256;
    const other = mockRegistry.find(
      (obj) =>
        obj.kind === "image" &&
        obj.args?.[1] === 384 &&
        obj.setScale.mock.calls.some((call) => call[0] === baseScale),
    );
    if (!other) throw new Error("inactive picker avatar not found");

    fireAll(other, "pointerup");

    expect(getActiveProfile().id).not.toBe(before);
    // Picker closed: every picker avatar was destroyed.
    for (const obj of mockRegistry.filter((o) => o.kind === "image" && o.args?.[1] === 384)) {
      expect(obj.destroy.mock.calls.length).toBeGreaterThan(0);
    }
  });

  it("adds no idle motion tweens under reduced motion while tiles stay tappable", () => {
    setReducedMotion(true);
    const scene = new HubScene();
    scene.create();

    const navTiles = getNavTiles();
    expect(navTiles).toHaveLength(22);
    const motionTargets = (scene.tweens.add as MockFn).mock.calls.filter((call) => {
      const config = call[0] as { targets?: unknown };
      return navTiles.includes(config.targets as MockObject);
    });
    expect(motionTargets).toHaveLength(0);
  });
});

describe("HubScene idle prewarm", () => {
  let visibility: DocumentVisibilityState;

  beforeEach(() => {
    stubMatchMedia(false);
    localStorage.clear();
    mockRegistry.length = 0;
    mockRecordGamePlay.mockClear();
    idleScheduler.clear();
    artScheduler.clear();
    for (const loader of Object.values(chunkLoaders)) {
      loader.mockClear();
    }
    vi.mocked(startPrewarm).mockClear();
    vi.mocked(startArtPrewarm).mockClear();
    visibility = "visible";
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => visibility,
    });
  });

  afterEach(() => {
    Reflect.deleteProperty(document, "visibilityState");
    idleScheduler.clear();
    artScheduler.clear();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  /** Reports the document as the given state and dispatches the browser event. */
  function setVisibility(next: DocumentVisibilityState): void {
    visibility = next;
    document.dispatchEvent(new Event("visibilitychange"));
  }

  /** True when the Hub armed its post-entrance prewarm start (1200 ms). */
  function hasPrewarmStart(scene: HubScene): boolean {
    return (scene.time.delayedCall as MockFn).mock.calls.some((call) => call[0] === 1200);
  }

  /** Fires the Hub's post-entrance prewarm start. */
  function firePrewarmStart(scene: HubScene): void {
    const calls = (scene.time.delayedCall as MockFn).mock.calls;
    const index = calls.findIndex((call) => call[0] === 1200);
    if (index < 0) throw new Error("the Hub armed no prewarm start");
    (calls[index][1] as () => void)();
  }

  /** The controller the most recent prewarm pass returned. */
  function lastController(): { cancel: MockFn } {
    const value = vi.mocked(startPrewarm).mock.results.at(-1)?.value as
      | { cancel: MockFn }
      | undefined;
    if (!value) throw new Error("no prewarm pass was started");
    return value;
  }

  /** The 22 nav tiles in Hub order. */
  function navTiles(): MockObject[] {
    return mockRegistry.filter((obj) => obj.kind === "rectangle" && obj.handlers.pointerup);
  }

  /** Lets a resolved chunk import settle its promise chain. */
  async function flushImports(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  it("starts no prewarm while the Hub opens locked, and starts one when the lock clears", () => {
    const profileId = getActiveProfile().id;
    setPlayTimeLimit(profileId, 15);
    recordPlayTime(profileId, 15);

    const scene = new HubScene();
    scene.create();

    expect(hasPrewarmStart(scene)).toBe(false);
    expect(startPrewarm).not.toHaveBeenCalled();
    expect(idleScheduler.size()).toBe(0);

    // The parent raises the cap; the next foreground return re-reads it.
    setPlayTimeLimit(profileId, null);
    setVisibility("visible");

    expect(hasPrewarmStart(scene)).toBe(true);
    firePrewarmStart(scene);
    expect(startPrewarm).toHaveBeenCalledTimes(1);
  });

  it("stops the pass when the lock arrives mid-cycle and starts a fresh one when it clears", () => {
    const profileId = getActiveProfile().id;
    const scene = new HubScene();
    scene.create();
    firePrewarmStart(scene);
    const first = lastController();
    expect(idleScheduler.size()).toBe(1);

    // The cap is reached while the pass is still waiting for an idle slot.
    setPlayTimeLimit(profileId, 15);
    recordPlayTime(profileId, 15);
    setVisibility("visible");

    expect(first.cancel).toHaveBeenCalled();
    expect(idleScheduler.size()).toBe(0);

    setPlayTimeLimit(profileId, null);
    setVisibility("visible");
    firePrewarmStart(scene);

    expect(startPrewarm).toHaveBeenCalledTimes(2);
    expect(lastController()).not.toBe(first);
  });

  it("pauses while the document is hidden and resumes on the way back", () => {
    const scene = new HubScene();
    scene.create();
    firePrewarmStart(scene);
    const controller = lastController();
    expect(idleScheduler.size()).toBe(1);

    setVisibility("hidden");

    expect(controller.cancel).toHaveBeenCalled();
    expect(idleScheduler.size()).toBe(0);

    setVisibility("visible");
    firePrewarmStart(scene);

    expect(startPrewarm).toHaveBeenCalledTimes(2);
    expect(idleScheduler.size()).toBe(1);
  });

  it("cancels the pass before the tap's load is awaited", () => {
    const scene = new HubScene();
    scene.create();
    firePrewarmStart(scene);
    const controller = lastController();

    const tile = navTiles()[0];
    if (!tile) throw new Error("no nav tile found");
    tile.handlers.pointerup?.();

    expect(controller.cancel).toHaveBeenCalled();
    // Ordering, not just both happening: the tap's fetch must never queue
    // behind prewarm work.
    const cancelOrder = controller.cancel.mock.invocationCallOrder[0];
    const loadOrder = vi.mocked(loadSceneWithRetry).mock.invocationCallOrder[0];
    expect(cancelOrder).toBeLessThan(loadOrder);
  });

  it("cancels on shutdown and warms the next visit from where the last one stopped", async () => {
    const scene = new HubScene();
    scene.create();
    firePrewarmStart(scene);
    const first = lastController();

    idleScheduler.fire();
    await flushImports();
    expect(chunkLoaders.ShapeSorter).toHaveBeenCalledTimes(1);

    const shutdown = (scene as unknown as { eventsHandlers: Record<string, MockFn[]> })
      .eventsHandlers.shutdown?.[0];
    if (!shutdown) throw new Error("the Hub registered no shutdown handler");
    shutdown();

    expect(first.cancel).toHaveBeenCalled();
    expect(idleScheduler.size()).toBe(0);

    // A new visit on the same (Phaser-reused) instance: a fresh pass that skips
    // the chunk the previous visit already imported.
    scene.create();
    firePrewarmStart(scene);
    expect(lastController()).not.toBe(first);
    idleScheduler.fire();
    await flushImports();

    expect(chunkLoaders.ShapeSorter).toHaveBeenCalledTimes(1);
    expect(chunkLoaders.AnimalTrace).toHaveBeenCalledTimes(1);
  });

  it("orders the pass recency-first for the active profile", () => {
    // The storage spy calls through, so this really records the play.
    mockRecordGamePlay("pop-freeze");

    const scene = new HubScene();
    scene.create();
    firePrewarmStart(scene);

    const options = vi.mocked(startPrewarm).mock.calls[0]?.[0];
    if (!options) throw new Error("no prewarm pass was started");
    expect(options.entries.map((entry) => entry.key)).toEqual([
      "PopFreeze",
      "ShapeSorter",
      "AnimalTrace",
    ]);
  });
});

describe("HubScene idle art prewarm", () => {
  let visibility: DocumentVisibilityState;

  beforeEach(() => {
    stubMatchMedia(false);
    localStorage.clear();
    mockRegistry.length = 0;
    mockRecordGamePlay.mockClear();
    idleScheduler.clear();
    artScheduler.clear();
    vi.mocked(startPrewarm).mockClear();
    vi.mocked(startArtPrewarm).mockClear();
    vi.mocked(createArtLoadingCue).mockClear();
    visibility = "visible";
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => visibility,
    });
  });

  afterEach(() => {
    Reflect.deleteProperty(document, "visibilityState");
    idleScheduler.clear();
    artScheduler.clear();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  /** Reports the document as the given state and dispatches the browser event. */
  function setVisibility(next: DocumentVisibilityState): void {
    visibility = next;
    document.dispatchEvent(new Event("visibilitychange"));
  }

  /** Fires the Hub's post-entrance start; arms the chunk and art passes together. */
  function firePrewarmStart(scene: HubScene): void {
    const calls = (scene.time.delayedCall as MockFn).mock.calls;
    const index = calls.findIndex((call) => call[0] === 1200);
    if (index < 0) throw new Error("the Hub armed no prewarm start");
    (calls[index][1] as () => void)();
  }

  /** The controller the most recent art pass returned. */
  function lastArtController(): { cancel: MockFn } {
    const value = vi.mocked(startArtPrewarm).mock.results.at(-1)?.value as
      | { cancel: MockFn }
      | undefined;
    if (!value) throw new Error("no art pass was started");
    return value;
  }

  /** The 22 nav tiles in Hub order. */
  function navTiles(): MockObject[] {
    return mockRegistry.filter((obj) => obj.kind === "rectangle" && obj.handlers.pointerup);
  }

  /** Lets a lazy art-group import and the engine's promise chain settle. */
  async function flushArt(): Promise<void> {
    for (let round = 0; round < 10; round += 1) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  /**
   * Waits until the Hub queued `count` svg loads. The first key pays the lazy
   * chunk transform (tens of milliseconds of wall clock), which empty
   * microtask rounds cannot cover — so poll on time, not on rounds.
   */
  async function waitForSvg(scene: HubScene, count: number): Promise<void> {
    const deadline = Date.now() + 10000;
    while (svgQueue(scene).length < count) {
      if (Date.now() > deadline) {
        throw new Error(`timed out waiting for ${count} queued art keys`);
      }
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
  }

  /** Art keys queued on the Hub loader so far, in queue order. */
  function svgQueue(scene: HubScene): Array<{ key: string; url: string; size: number }> {
    return ((scene.load.svg as MockFn).mock.calls as unknown[][]).map((call) => ({
      key: call[0] as string,
      url: call[1] as string,
      size: (call[2] as { width: number }).width,
    }));
  }

  /** Fires the most recently registered loader handler for the given event. */
  function fireLoadEvent(scene: HubScene, event: "complete" | "loaderror"): void {
    const handlers = ((scene.load.on as MockFn).mock.calls as unknown[][]).filter(
      (call) => call[0] === event,
    );
    const handler = handlers.at(-1)?.[1] as (() => void) | undefined;
    if (!handler) throw new Error(`the Hub registered no load ${event} handler`);
    handler();
  }

  it("keeps game SVG markup out of the shell: art tables load through dynamic imports only", () => {
    // A static import would inline every game's artwork into the shell entry and
    // break the 200 kB validate-bundle budget; the lazy loaders are the only
    // sanctioned path from the Hub to the art tables. The game-entry cue is
    // pinned too: idle prewarm must never reach the module that creates it.
    expect(hubSceneSource).not.toMatch(/from\s+["']\.\.\/game\/(art|storyOrderArt)/);
    expect(hubSceneSource).not.toMatch(/from\s+["']\.\.\/components\/ArtLoadingCue["']/);
    const lazyGroupImports = artGroupsSource.match(/import\("\.\.\/art\/[a-z]+"\)/g) ?? [];
    expect(lazyGroupImports).toHaveLength(12);
    expect(artGroupsSource).toContain('import("../storyOrderArt")');
  });

  it("starts the art pass alongside the chunk pass once the entrance settles", () => {
    const scene = new HubScene();
    scene.create();
    firePrewarmStart(scene);

    expect(startPrewarm).toHaveBeenCalledTimes(1);
    expect(startArtPrewarm).toHaveBeenCalledTimes(1);
    const options = vi.mocked(startArtPrewarm).mock.calls[0]?.[0];
    if (!options) throw new Error("no art pass was started");
    expect(options.keysByGame).toBe(ART_KEYS_BY_GAME);
    expect(options.gridOrder).toHaveLength(22);
    expect(options.queued).toBeInstanceOf(Set);
    expect(artScheduler.size()).toBe(1);

    // The presence probe reads the live TextureManager: nothing is warm on a
    // fresh boot, and a key the manager holds is reported present.
    expect(options.isPresent("cutout_circle")).toBe(false);
    scene.textures.createCanvas("cutout_circle");
    expect(options.isPresent("cutout_circle")).toBe(true);
  });

  it("rasterizes one key per idle tick through the Hub loader at the key's tier", async () => {
    const scene = new HubScene();
    scene.create();
    firePrewarmStart(scene);

    artScheduler.fire();
    await waitForSvg(scene, 1);

    const first = svgQueue(scene);
    expect(first).toHaveLength(1);
    expect(first[0]?.key).toBe("cutout_circle");
    expect(first[0]?.url.startsWith("data:image/svg+xml;base64,")).toBe(true);
    expect(first[0]?.size).toBe(256);
    expect((scene.load.start as MockFn).mock.calls).toHaveLength(1);

    // The engine holds the next tick until the loader reports the file done.
    expect(artScheduler.fire()).toBe(false);
    expect(svgQueue(scene)).toHaveLength(1);

    fireLoadEvent(scene, "complete");
    await flushArt();
    expect(artScheduler.size()).toBe(1);

    artScheduler.fire();
    await waitForSvg(scene, 2);

    const second = svgQueue(scene);
    expect(second).toHaveLength(2);
    expect(second[1]?.key).toBe("cutout_square");
    expect((scene.load.start as MockFn).mock.calls).toHaveLength(2);
  });

  it("skips keys the TextureManager already holds", async () => {
    const scene = new HubScene();
    scene.create();
    scene.textures.createCanvas("cutout_circle");
    firePrewarmStart(scene);

    artScheduler.fire();
    await waitForSvg(scene, 1);

    const queued = svgQueue(scene);
    expect(queued).toHaveLength(1);
    expect(queued[0]?.key).toBe("cutout_square");
  });

  it("never creates the art cue while the idle pass rasterizes", async () => {
    const scene = new HubScene();
    scene.create();
    firePrewarmStart(scene);

    artScheduler.fire();
    await waitForSvg(scene, 1);
    fireLoadEvent(scene, "complete");
    await flushArt();
    artScheduler.fire();
    await waitForSvg(scene, 2);

    expect(vi.mocked(createArtLoadingCue)).not.toHaveBeenCalled();
  });

  it("starts no art pass while the Hub opens locked, and starts one when the lock clears", () => {
    const profileId = getActiveProfile().id;
    setPlayTimeLimit(profileId, 15);
    recordPlayTime(profileId, 15);

    const scene = new HubScene();
    scene.create();

    expect(startArtPrewarm).not.toHaveBeenCalled();
    expect(artScheduler.size()).toBe(0);

    // The parent raises the cap; the next foreground return re-reads it.
    setPlayTimeLimit(profileId, null);
    setVisibility("visible");

    firePrewarmStart(scene);
    expect(startArtPrewarm).toHaveBeenCalledTimes(1);
    expect(artScheduler.size()).toBe(1);
  });

  it("pauses the art pass while the document is hidden and resumes on the way back", () => {
    const scene = new HubScene();
    scene.create();
    firePrewarmStart(scene);
    const controller = lastArtController();
    expect(artScheduler.size()).toBe(1);

    setVisibility("hidden");

    expect(controller.cancel).toHaveBeenCalled();
    expect(artScheduler.size()).toBe(0);

    setVisibility("visible");
    firePrewarmStart(scene);

    expect(startArtPrewarm).toHaveBeenCalledTimes(2);
    expect(artScheduler.size()).toBe(1);
  });

  it("cancels the art pass before the tap's load is awaited", () => {
    const scene = new HubScene();
    scene.create();
    firePrewarmStart(scene);
    const controller = lastArtController();

    const tile = navTiles()[0];
    if (!tile) throw new Error("no nav tile found");
    tile.handlers.pointerup?.();

    expect(controller.cancel).toHaveBeenCalled();
    // Ordering, not just both happening: the tap's fetch must never queue
    // behind art raster work.
    const cancelOrder = controller.cancel.mock.invocationCallOrder[0];
    const loadOrder = vi.mocked(loadSceneWithRetry).mock.invocationCallOrder[0];
    expect(cancelOrder).toBeLessThan(loadOrder);
  });

  it("cancels the art pass on shutdown and resumes the next visit where it stopped", async () => {
    const scene = new HubScene();
    scene.create();
    firePrewarmStart(scene);
    const first = lastArtController();

    artScheduler.fire();
    await waitForSvg(scene, 1);
    expect(svgQueue(scene).map((entry) => entry.key)).toEqual(["cutout_circle"]);
    fireLoadEvent(scene, "complete");
    await flushArt();

    const shutdown = (scene as unknown as { eventsHandlers: Record<string, MockFn[]> })
      .eventsHandlers.shutdown?.[0];
    if (!shutdown) throw new Error("the Hub registered no shutdown handler");
    shutdown();

    expect(first.cancel).toHaveBeenCalled();
    expect(artScheduler.size()).toBe(0);

    (scene.load.svg as MockFn).mockClear();
    (scene.load.start as MockFn).mockClear();

    // A new visit on the same (Phaser-reused) instance: a fresh pass that skips
    // the key the previous visit already rasterized.
    scene.create();
    firePrewarmStart(scene);
    expect(lastArtController()).not.toBe(first);

    artScheduler.fire();
    await waitForSvg(scene, 1);

    expect(svgQueue(scene).map((entry) => entry.key)).toEqual(["cutout_square"]);
  });

  it("resolves every art key of every game to its group's markup", async () => {
    const scene = new HubScene();
    scene.create();
    const hub = scene as unknown as {
      resolveArtSvg: (entry: ArtKeyEntry) => Promise<string | undefined>;
    };

    // A key from a game's second group exercises the fallback across tables.
    const circle = await hub.resolveArtSvg({
      gameId: "shape-sorter",
      key: "shape_circle",
      size: 192,
    });
    expect(circle).toBe(shapes.assets.find((asset) => asset.key === "shape_circle")?.svg);

    for (const keys of Object.values(ART_KEYS_BY_GAME)) {
      for (const entry of keys) {
        const svg = await hub.resolveArtSvg(entry);
        if (!svg) throw new Error(`no markup resolved for ${entry.gameId}/${entry.key}`);
        expect(svg).toContain("<svg");
      }
    }

    await expect(
      hub.resolveArtSvg({ gameId: "shape-sorter", key: "not-a-real-key", size: 256 }),
    ).resolves.toBeUndefined();
  });

  it("queues zero art keys when the TextureManager already holds the game (AC-5)", () => {
    const warmed = new MockScene([]);
    for (const asset of music.assets) {
      warmed.textures.createCanvas(asset.key);
    }

    preloadArtGroups(warmed as unknown as Phaser.Scene, [music]);

    expect((warmed.load.svg as MockFn).mock.calls).toHaveLength(0);
    // Nothing queued means nothing to listen for either.
    expect((warmed.load.on as MockFn).mock.calls).toHaveLength(0);
  });
});
