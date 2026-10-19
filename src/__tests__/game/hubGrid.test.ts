import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { stubMatchMedia } from "../helpers/matchMediaStub";
import { type MockFn, type MockObject, MockScene, mockRegistry } from "../helpers/phaserMock";

vi.mock("phaser", async () => {
  const { createPhaserModuleMock } = await import("../helpers/phaserMock");
  return createPhaserModuleMock().module;
});

import { HubGrid, type HubGridDeps } from "../../game/hubGrid";
import { earnSticker } from "../../utils/storage";
import { textureSizeFor } from "../../utils/textureTiers";

/** Count rectangles of a given size in the mock registry. */
function rects(w: number, h: number): MockObject[] {
  return mockRegistry.filter((obj) => {
    const [, , rw, rh] = (obj.args ?? []) as unknown[];
    return obj.kind === "rectangle" && rw === w && rh === h;
  });
}

/**
 * Phaser lays a Text object out in a line box of roughly 1.2em, centred on its
 * origin, so this is the label's bottom edge in logical px.
 */
const LABEL_LINE_HEIGHT_RATIO = 1.2;

/** Bottom edge of the label drawn at `tileX` (tiles and labels share an x). */
function labelBottom(tileX: number): number {
  const label = mockRegistry.find((obj) => obj.kind === "text" && obj.args?.[0] === tileX);
  if (!label) throw new Error("tile label not created");
  const style = label.args?.[3] as { fontSize?: string } | undefined;
  const fontSize = Number.parseFloat(style?.fontSize ?? "");
  return (label.args?.[1] as number) + (fontSize * LABEL_LINE_HEIGHT_RATIO) / 2;
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

describe("HubGrid — classic wide 6x4 grid", () => {
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

  it("builds 21 tiles of 144x116 with icons and labels", () => {
    const { deps } = makeDeps();
    const grid = new HubGrid(deps);

    grid.buildWideGrid();

    expect(rects(144, 116).length).toBe(21);
    const images = mockRegistry.filter((obj) => obj.kind === "image");
    const texts = mockRegistry.filter((obj) => obj.kind === "text");
    // 21 icons + 21 sticker slots would be more; the wide grid adds 21 icons.
    expect(images.length).toBe(21);
    expect(texts.length).toBe(21);
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
    // 20 unearned slots: each dashed ring has 10 arc segments.
    const slotGraphics = mockRegistry.filter((obj) => obj.kind === "graphics");
    for (const g of slotGraphics) {
      expect(g.arc).toHaveBeenCalledTimes(10);
    }
    expect(slotGraphics.length).toBe(20);
  });

  it("keeps the earned sticker below the tile label and above the tile's bottom edge", () => {
    earnSticker("shape-sorter");
    const { deps } = makeDeps();
    const grid = new HubGrid(deps);
    grid.buildWideGrid();

    const tile = rects(144, 116)[0];
    const tileX = tile.args?.[0] as number;
    const tileY = tile.args?.[1] as number;
    const tileBottom = tileY + (tile.args?.[3] as number) / 2;

    const sticker = mockRegistry.find(
      (obj) => obj.kind === "image" && ((obj.args?.[2] as string) ?? "").startsWith("sticker_"),
    );
    if (!sticker) throw new Error("earned sticker thumbnail not created");
    const scale = (sticker.setScale as MockFn).mock.calls[0]?.[0] as number;
    const size = textureSizeFor("sticker_shape_sorter") * scale;
    const centreY = sticker.args?.[1] as number;

    // Regression guard: a 56px plaque on this 144x116 tile spanned +17..+73,
    // covering the game name and spilling past the tile's bottom edge.
    expect(centreY - size / 2).toBeGreaterThanOrEqual(labelBottom(tileX));
    expect(centreY + size / 2).toBeLessThanOrEqual(tileBottom);
  });

  it("keeps the dashed empty-slot ring below the tile label too", () => {
    const { deps } = makeDeps();
    const grid = new HubGrid(deps);
    grid.buildWideGrid();

    const ring = mockRegistry.find((obj) => obj.kind === "graphics");
    if (!ring) throw new Error("empty-slot ring not created");
    const [centreX, centreY] = (ring.setPosition as MockFn).mock.calls[0] as [number, number];
    const radius = (ring.arc as MockFn).mock.calls[0]?.[2] as number;
    const tile = rects(144, 116).find((obj) => obj.args?.[0] === centreX);
    if (!tile) throw new Error("tile for the empty-slot ring not found");
    const tileBottom = (tile.args?.[1] as number) + (tile.args?.[3] as number) / 2;

    expect(centreY - radius).toBeGreaterThanOrEqual(labelBottom(centreX));
    expect(centreY + radius).toBeLessThanOrEqual(tileBottom);
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

  it("builds only the remaining tile on the last page", () => {
    const { deps, activate } = makeDeps();
    const grid = new HubGrid(deps);
    grid.buildPageGrid(2);

    expect(rects(176, 196).length).toBe(1);

    const tile = grid.attractTargets[0] as unknown as MockObject;
    tile.handlers.pointerup?.();

    // Page 3 holds the 21st game (Feelings Faces).
    expect(activate).toHaveBeenCalledWith(20);
  });

  it("keeps a paged sticker shelf below the tile label as well", () => {
    earnSticker("shape-sorter");
    const { deps } = makeDeps();
    const grid = new HubGrid(deps);
    grid.buildPageGrid(0);

    const tile = rects(176, 196)[0];
    const tileX = tile.args?.[0] as number;
    const tileY = tile.args?.[1] as number;
    const tileBottom = tileY + (tile.args?.[3] as number) / 2;

    const sticker = mockRegistry.find(
      (obj) => obj.kind === "image" && ((obj.args?.[2] as string) ?? "").startsWith("sticker_"),
    );
    if (!sticker) throw new Error("earned sticker thumbnail not created");
    const scale = (sticker.setScale as MockFn).mock.calls[0]?.[0] as number;
    const size = textureSizeFor("sticker_shape_sorter") * scale;
    const centreY = sticker.args?.[1] as number;

    // The paged label sits lower (+48, 20px) but its tile is taller (+98).
    expect(centreY - size / 2).toBeGreaterThanOrEqual(labelBottom(tileX));
    expect(centreY + size / 2).toBeLessThanOrEqual(tileBottom);
  });

  it("shows one page dot per page with the active page highlighted", () => {
    const { deps } = makeDeps();
    const grid = new HubGrid(deps);
    grid.hubPage = 0;
    grid.createPageDots();

    const dots = mockRegistry.filter((obj) => {
      const [, y, r] = (obj.args ?? []) as unknown[];
      return obj.kind === "circle" && y === 640 && r === 8;
    });
    expect(dots.length).toBe(3);
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
    // Card tier: 256px raster scaled to the 22px shelf slot.
    expect((sticker.setScale as MockFn).mock.calls[0]?.[0]).toBeCloseTo(22 / 256, 5);
  });
});
