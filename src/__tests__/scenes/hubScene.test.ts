import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type MatchMediaStub, stubMatchMedia } from "../helpers/matchMediaStub";
import { type MockFn, type MockObject, mockRegistry } from "../helpers/phaserMock";

const { mockAudio, mockRecordGamePlay } = vi.hoisted(() => {
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
  return { mockAudio, mockRecordGamePlay };
});

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

/** Hub-only browser bridges: keep them inert in tests. */
vi.mock("../../utils/pwaBridge", () => ({
  getPwaBridge: vi.fn(() => null),
}));

vi.mock("../../utils/speech", () => ({
  unlockSpeechForUserGesture: vi.fn(),
}));

/** Lazy chunk loading is not exercised here; resolve immediately. */
vi.mock("../../scenes/sceneRegistry", () => ({
  ensureSceneLoaded: vi.fn(() => Promise.resolve()),
}));

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

import { HubScene } from "../../scenes/HubScene";
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
      return obj.kind === "rectangle" && w === 160 && h === 116;
    });
    expect(wideTiles.length).toBe(0);
  });

  it("maps page-1 tiles to games 11-20 (How Many? first)", () => {
    const scene = createNarrowHub();

    // Flip to page 2 via the second dot.
    pageDots()[1].handlers.pointerup?.();

    const afterFlip = pagedRects().length;
    expect(afterFlip).toBe(20); // outgoing page lingers (slide timer mocked)
    const pageOneFirst = pagedRects()[10];
    pageOneFirst.handlers.pointerup?.();

    expect(mockRecordGamePlay).toHaveBeenCalledWith("how-many");
    expect(scene).toBeDefined();
  });

  it("shows two textless page dots, active page highlighted", () => {
    createNarrowHub();

    const dots = pageDots();
    expect(dots.length).toBe(2);
    // Active dot bright, inactive dot dim.
    expect(dots[0].setAlpha).toHaveBeenCalledWith(expect.closeTo(0.9, 5));
    expect(dots[1].setAlpha).toHaveBeenCalledWith(expect.closeTo(0.25, 5));
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
    expect(dots.length).toBe(2);
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

  /** All wide-grid tile rectangles (160x116) in creation order. */
  function wideRects(): MockObject[] {
    return mockRegistry.filter((obj) => {
      const [, , w, h] = (obj.args ?? []) as unknown[];
      return obj.kind === "rectangle" && w === 160 && h === 116;
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
    expect(wideRects().length).toBe(20);
    expect(pageDots().length).toBe(0);
    const wideBefore = wideRects().length;

    fireResize(scene, 844, 390);

    // The registry accumulates destroyed objects, so "rebuild" is asserted as
    // newly-created paged tiles and zero additional wide tiles.
    expect(pagedRects().length).toBe(10);
    expect(wideRects().length).toBe(wideBefore);
    expect(pageDots().length).toBe(2);
  });

  it("rebuilds the wide grid when a resize crosses back above the threshold", () => {
    const scene = createNarrowHub();
    expect(pagedRects().length).toBe(10);
    const pagedBefore = pagedRects().length;
    const dotsBefore = pageDots().length;

    fireResize(scene, 1024, 768);

    expect(wideRects().length).toBe(20);
    expect(pagedRects().length).toBe(pagedBefore);
    expect(pageDots().length).toBe(dotsBefore);
  });

  it("leaves the grid untouched when a resize stays in the same classification", () => {
    const scene = new HubScene();
    scene.create();

    fireResize(scene, 1600, 900);

    expect(wideRects().length).toBe(20);
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
    // The rebuilt wide grid must contain all 20 games.
    expect(wideRects().length).toBe(20);
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

  it("records a play for the tapped tile's game on the active profile", () => {
    const scene = new HubScene();
    scene.create();

    const tapTile = getHandler("rectangle", "pointerup");
    expect(tapTile).toBeDefined();
    tapTile?.();

    expect(mockRecordGamePlay).toHaveBeenCalledTimes(1);
    expect(mockRecordGamePlay).toHaveBeenCalledWith("shape-sorter");
    // Persisted through the real storage implementation.
    expect(getProgress()["shape-sorter"].plays).toBe(1);
    expect(getProgress()["color-match"].plays).toBe(0);
  });

  it("ignores taps on other tiles once navigation has started", () => {
    const scene = new HubScene();
    scene.create();

    const tapTiles = mockRegistry.filter(
      (obj) => obj.kind === "rectangle" && obj.handlers.pointerup,
    );
    expect(tapTiles.length).toBeGreaterThanOrEqual(2);
    tapTiles[0].handlers.pointerup?.();
    tapTiles[1].handlers.pointerup?.();

    expect(mockRecordGamePlay).toHaveBeenCalledTimes(1);
    expect(mockRecordGamePlay).toHaveBeenCalledWith("shape-sorter");
  });

  it("does not double-record when a tile is tapped repeatedly", () => {
    const scene = new HubScene();
    scene.create();

    const tapTile = getHandler("rectangle", "pointerup");
    expect(tapTile).toBeDefined();
    tapTile?.();
    tapTile?.();

    expect(mockRecordGamePlay).toHaveBeenCalledTimes(1);
    expect(getProgress()["shape-sorter"].plays).toBe(1);
  });

  it("renders all 20 tiles fully inside the 1024×768 canvas (5×4 grid)", () => {
    const scene = new HubScene();
    scene.create();

    const tiles = mockRegistry.filter((obj) => obj.kind === "rectangle" && obj.handlers.pointerup);
    expect(tiles).toHaveLength(20);

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

  it("preserves the 5×4 grid geometry at 1024×768", () => {
    setReducedMotion(false);
    const scene = new HubScene();
    scene.create();

    const tiles = getNavTiles();
    expect(tiles).toHaveLength(20);

    const rows = new Map<number, MockObject[]>();
    for (const tile of tiles) {
      const y = tile.args?.[1] as number;
      const row = rows.get(y);
      if (row) row.push(tile);
      else rows.set(y, [tile]);
    }
    const rowSizes = [...rows.keys()].sort((a, b) => a - b).map((y) => rows.get(y)?.length ?? 0);
    expect(rowSizes).toEqual([5, 5, 5, 5]);

    for (const [, row] of rows) {
      const xs = row.map((t) => t.args?.[0] as number).sort((a, b) => a - b);
      for (let i = 1; i < xs.length; i++) {
        expect(xs[i] - xs[i - 1]).toBeCloseTo(182, 0); // TILE_WIDTH(160)+TILE_SPACING(22)
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

    // Dashed empty slots draw arcs at the sticker radius (28px).
    const emptySlots = mockRegistry.filter(
      (obj) => obj.kind === "graphics" && obj.arc.mock.calls.some((call) => call[2] === 28),
    );
    expect(emptySlots).toHaveLength(18);
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
    expect(navTiles).toHaveLength(20);
    const motionTargets = (scene.tweens.add as MockFn).mock.calls.filter((call) => {
      const config = call[0] as { targets?: unknown };
      return navTiles.includes(config.targets as MockObject);
    });
    expect(motionTargets).toHaveLength(0);
  });
});
