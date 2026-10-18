import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { stubMatchMedia } from "../helpers/matchMediaStub";
import { type MockFn, type MockObject, MockScene, mockRegistry } from "../helpers/phaserMock";

vi.mock("phaser", async () => {
  const { createPhaserModuleMock } = await import("../helpers/phaserMock");
  return createPhaserModuleMock().module;
});

import { HubGrid, type HubGridDeps } from "../../game/hubGrid";
import { earnSticker } from "../../utils/storage";

/** Count rectangles of a given size in the mock registry. */
function rects(w: number, h: number): MockObject[] {
  return mockRegistry.filter((obj) => {
    const [, , rw, rh] = (obj.args ?? []) as unknown[];
    return obj.kind === "rectangle" && rw === w && rh === h;
  });
}

/** Dispatch a scene-level input event on the mock scene. */
function fireSceneInput(scene: MockScene, event: string, pointer: { x: number; y: number }): void {
  for (const fn of scene.sceneInputHandlers[event] ?? []) {
    (fn as unknown as (p: { x: number; y: number }) => void)(pointer);
  }
}

function makeDeps(overrides: Partial<HubGridDeps> = {}): {
  deps: HubGridDeps;
  scene: MockScene;
  activate: MockFn;
} {
  const scene = new MockScene();
  const activate = vi.fn();
  const deps: HubGridDeps = {
    scene: scene as unknown as HubGridDeps["scene"],
    isTimeUp: () => false,
    activateTile: activate,
    onUserGesture: vi.fn(),
    gestureBlocked: () => false,
    ...overrides,
  };
  return { deps, scene, activate };
}

describe("HubGrid — classic wide 5x4 grid", () => {
  beforeEach(() => {
    stubMatchMedia(false);
    localStorage.clear();
    mockRegistry.length = 0;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("builds 20 tiles of 160x116 with icons and labels", () => {
    const { deps } = makeDeps();
    const grid = new HubGrid(deps);

    grid.buildWideGrid();

    expect(rects(160, 116).length).toBe(20);
    const images = mockRegistry.filter((obj) => obj.kind === "image");
    const texts = mockRegistry.filter((obj) => obj.kind === "text");
    // 20 icons + 20 sticker slots would be more; the wide grid adds 20 icons.
    expect(images.length).toBe(20);
    expect(texts.length).toBe(20);
  });

  it("activates a tile on tap exactly once (navLocked blocks double-taps)", () => {
    const { deps, activate } = makeDeps();
    const grid = new HubGrid(deps);
    grid.buildWideGrid();

    const tile = grid.attractTargets[0] as unknown as MockObject;
    tile.handlers.pointerup?.();
    tile.handlers.pointerup?.();

    expect(activate).toHaveBeenCalledTimes(1);
    expect(activate).toHaveBeenCalledWith(0);
  });

  it("swallows taps entirely while time is up", () => {
    const { deps, activate } = makeDeps({ isTimeUp: () => true });
    const grid = new HubGrid(deps);
    grid.buildWideGrid();
    grid.applyTimeUpLock();

    const tile = grid.attractTargets[0] as unknown as MockObject;
    tile.handlers.pointerup?.();

    expect(activate).not.toHaveBeenCalled();
  });

  it("applyTimeUpLock dims, shrinks and disables tiles; restoreTiles undoes it", () => {
    const { deps } = makeDeps();
    const grid = new HubGrid(deps);
    grid.buildWideGrid();
    grid.applyTimeUpLock();

    const tile = grid.attractTargets[0] as unknown as MockObject;
    expect(tile.setAlpha).toHaveBeenCalledWith(0.45);
    expect(tile.setScale).toHaveBeenCalledWith(0.97);
    expect(tile.disableInteractive).toHaveBeenCalled();

    grid.restoreTiles();
    expect(tile.setAlpha).toHaveBeenCalledWith(1);
    expect(tile.setScale).toHaveBeenCalledWith(1);
    expect(tile.setInteractive).toHaveBeenCalled();
  });

  it("shows earned stickers on the shelf and dashed slots for unearned ones", () => {
    earnSticker("shape-sorter");
    const { deps } = makeDeps();
    const grid = new HubGrid(deps);
    grid.buildWideGrid();

    // One earned sticker thumbnail for shape-sorter.
    const stickers = mockRegistry.filter(
      (obj) => obj.kind === "image" && ((obj.args?.[2] as string) ?? "").startsWith("sticker_"),
    );
    expect(stickers.length).toBe(1);
    // 19 unearned slots: each dashed ring has 10 arc segments.
    const slotGraphics = mockRegistry.filter((obj) => obj.kind === "graphics");
    for (const g of slotGraphics) {
      expect(g.arc).toHaveBeenCalledTimes(10);
    }
    expect(slotGraphics.length).toBe(19);
  });

  it("runs no breathe tweens under reduced motion", () => {
    const { deps, scene } = makeDeps();
    stubMatchMedia(true);
    const grid = new HubGrid(deps);
    grid.buildWideGrid();

    const breathe = (scene.tweens.add as MockFn).mock.calls.filter(
      (call) => (call[0] as { duration?: number }).duration === 2500,
    );
    expect(breathe.length).toBe(0);
  });
});

describe("HubGrid — paged grid (narrow viewports)", () => {
  beforeEach(() => {
    stubMatchMedia(false);
    localStorage.clear();
    mockRegistry.length = 0;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("builds one page of 10 tiles of 176x196; page 1 maps to games 11-20", () => {
    const { deps, activate } = makeDeps();
    const grid = new HubGrid(deps);
    grid.buildPageGrid(1);

    expect(rects(176, 196).length).toBe(10);

    const tile = grid.attractTargets[0] as unknown as MockObject;
    tile.handlers.pointerup?.();

    // Page 2 starts at game index 10 (How Many?).
    expect(activate).toHaveBeenCalledWith(10);
  });

  it("shows two page dots with the active page highlighted", () => {
    const { deps } = makeDeps();
    const grid = new HubGrid(deps);
    grid.hubPage = 0;
    grid.createPageDots();

    const dots = mockRegistry.filter((obj) => {
      const [, y, r] = (obj.args ?? []) as unknown[];
      return obj.kind === "circle" && y === 640 && r === 8;
    });
    expect(dots.length).toBe(2);
    expect(dots[0].setAlpha).toHaveBeenCalledWith(expect.closeTo(0.9, 5));
    expect(dots[1].setAlpha).toHaveBeenCalledWith(expect.closeTo(0.25, 5));
  });

  /** Builds deps on a small-phone landscape viewport (844x390 CSS px). */
  function narrowViewport(scene: MockScene): void {
    scene.scale.displaySize = { width: 844, height: 390 };
  }

  it("flips pages on a horizontal swipe inside the grid region", () => {
    const { deps, scene } = makeDeps();
    const grid = new HubGrid(deps);
    narrowViewport(scene);
    grid.classifyViewport();
    grid.createPageDots();
    grid.wireSwipeGestures();
    grid.buildPageGrid(0);

    fireSceneInput(scene, "pointerdown", { x: 512, y: 300 });
    fireSceneInput(scene, "pointermove", { x: 400, y: 300 });
    fireSceneInput(scene, "pointerup", { x: 400, y: 300 });

    // Outgoing page lingers (slide timer is mocked), so 20 rects total.
    expect(rects(176, 196).length).toBe(20);
    const dots = mockRegistry.filter((obj) => {
      const [, y, r] = (obj.args ?? []) as unknown[];
      return obj.kind === "circle" && y === 640 && r === 8;
    });
    const lastAlpha = (dots[1].setAlpha as MockFn).mock.calls.at(-1)?.[0];
    expect(lastAlpha).toBeCloseTo(0.9, 5);
  });

  it("ignores swipes that start outside the grid region", () => {
    const { deps, scene } = makeDeps();
    const grid = new HubGrid(deps);
    narrowViewport(scene);
    grid.classifyViewport();
    grid.createPageDots();
    grid.wireSwipeGestures();
    grid.buildPageGrid(0);

    // Avatar-chip band (top-left), well outside the paged grid bounds.
    fireSceneInput(scene, "pointerdown", { x: 60, y: 60 });
    fireSceneInput(scene, "pointermove", { x: 200, y: 60 });
    fireSceneInput(scene, "pointerup", { x: 300, y: 60 });

    expect(rects(176, 196).length).toBe(10);
  });

  it("re-arms swipe wiring after a scene shutdown (revisit)", () => {
    const { deps, scene } = makeDeps();
    const grid = new HubGrid(deps);
    narrowViewport(scene);
    grid.classifyViewport();
    grid.createPageDots();
    grid.wireSwipeGestures();

    // Phaser's InputPlugin.shutdown() drops every scene input listener while
    // the Hub scene instance survives, so simulate that on the mock scene.
    scene.sceneInputHandlers = {};
    grid.resetForVisit();
    grid.wireSwipeGestures();

    expect(scene.sceneInputHandlers.pointerdown?.length).toBe(1);
  });

  it("derives each shelf sticker's scale from its own texture tier", () => {
    earnSticker("shape-sorter");
    const { deps } = makeDeps();
    const grid = new HubGrid(deps);
    grid.buildWideGrid();

    const sticker = mockRegistry.find(
      (obj) => obj.kind === "image" && ((obj.args?.[2] as string) ?? "").startsWith("sticker_"),
    );
    if (!sticker) throw new Error("earned sticker thumbnail not created");
    // Card tier: 256px raster scaled to the 56px shelf slot.
    expect((sticker.setScale as MockFn).mock.calls[0]?.[0]).toBeCloseTo(56 / 256, 5);
  });
});
