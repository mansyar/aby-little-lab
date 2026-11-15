import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { stubMatchMedia } from "../../helpers/matchMediaStub";
import { type MockFn, type MockObject, MockScene, mockRegistry } from "../../helpers/phaserMock";

vi.mock("phaser", async () => {
  const { createPhaserModuleMock } = await import("../../helpers/phaserMock");
  return createPhaserModuleMock().module;
});

import { CHIP_HEIGHT, CHIP_LABEL_Y, CHIP_WIDTH } from "../../../game/hub/groupLayout";
import { HubGrid, type HubGridDeps } from "../../../game/hubGrid";

/** Every chip rectangle, in creation order. */
function chipRects(): MockObject[] {
  return mockRegistry.filter((obj) => {
    const [, , width, height] = (obj.args ?? []) as unknown[];
    return obj.kind === "rectangle" && width === CHIP_WIDTH && height === CHIP_HEIGHT;
  });
}

/** Every chip hit zone, in creation order. */
function chipZones(): MockObject[] {
  return mockRegistry.filter((obj) => {
    const [, , width, height] = (obj.args ?? []) as unknown[];
    return obj.kind === "zone" && width === CHIP_WIDTH && height === CHIP_HEIGHT;
  });
}

/** Every chip label, in creation order (14px is the chip label tier). */
function chipLabels(): MockObject[] {
  return mockRegistry.filter(
    (obj) => obj.kind === "text" && (obj.args?.[3] as { fontSize?: string })?.fontSize === "14px",
  );
}

/** The fill a chip rectangle was last painted with. */
function lastFill(rect: MockObject): number {
  return (rect.setFillStyle as MockFn).mock.calls.at(-1)?.[0] as number;
}

function makeDeps(overrides: Partial<HubGridDeps> = {}): {
  deps: HubGridDeps;
  scene: MockScene;
} {
  const scene = new MockScene();
  const deps: HubGridDeps = {
    scene: scene as unknown as HubGridDeps["scene"],
    isTimeUp: () => false,
    activateTile: vi.fn(),
    onUserGesture: vi.fn(),
    gestureBlocked: () => false,
    ...overrides,
  };
  return { deps, scene };
}

describe("groupChips — the row", () => {
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

  it("creates six chips in selection order, each with a word", () => {
    const { deps } = makeDeps();
    const grid = new HubGrid(deps);
    grid.classifyViewport();
    grid.buildWideGrid();

    expect(chipRects()).toHaveLength(6);
    expect(chipLabels().map((label) => label.args?.[2])).toEqual([
      "All",
      "Letters",
      "Numbers",
      "Thinking",
      "Play",
      "Stories",
    ]);
    for (const label of chipLabels()) {
      expect(label.args?.[1]).toBe(CHIP_LABEL_Y);
    }
    // 6 plates + 4 drawn squares each + 6 labels + 6 hit zones, on a cold shell.
    expect(chipZones()).toHaveLength(6);
    expect(grid.chipViews).toHaveLength(6);
  });

  it("paints All as selected and the groups as unselected", () => {
    const { deps } = makeDeps();
    const grid = new HubGrid(deps);
    grid.classifyViewport();
    grid.buildWideGrid();

    const rects = chipRects();
    expect(lastFill(rects[0] as MockObject)).toBe(0x2b6cb0);
    for (const rect of rects.slice(1)) {
      expect(lastFill(rect)).toBe(0xfff8e7);
    }
    const [allLabel, lettersLabel] = chipLabels() as MockObject[];
    expect((allLabel.setColor as MockFn).mock.calls.at(-1)?.[0]).toBe("#ffffff");
    expect((lettersLabel.setColor as MockFn).mock.calls.at(-1)?.[0]).toBe("#2d3748");
  });

  it("uses the shipped glyph texture when the shell has it, and draws it otherwise", () => {
    const { deps, scene } = makeDeps();
    // A cold TextureManager: nothing preloaded, so every glyph is drawn.
    const cold = new HubGrid(deps);
    cold.classifyViewport();
    cold.buildWideGrid();
    expect(
      mockRegistry.filter(
        (obj) => obj.kind === "image" && String(obj.args?.[2]).startsWith("group_"),
      ),
    ).toHaveLength(0);
    // Each of the six chips falls back to a drawn 2x2 grid of four squares.
    expect(
      mockRegistry.filter((obj) => obj.kind === "rectangle" && obj.args?.[2] === 12),
    ).toHaveLength(24);

    mockRegistry.length = 0;
    scene.textures.exists = vi.fn(() => true);
    const warm = new HubGrid(deps);
    warm.classifyViewport();
    warm.buildWideGrid();
    expect(
      mockRegistry
        .filter((obj) => obj.kind === "image" && String(obj.args?.[2]).startsWith("group_"))
        .map((obj) => obj.args?.[2]),
    ).toEqual(["group_letters", "group_numbers", "group_thinking", "group_play", "group_stories"]);
  });

  it("selects a group on release, repaints the row and reports the choice", () => {
    const onSelectGroup = vi.fn();
    const { deps } = makeDeps({ onSelectGroup });
    const grid = new HubGrid(deps);
    grid.classifyViewport();
    grid.buildWideGrid();

    const numbers = chipZones()[2] as MockObject;
    numbers.handlers.pointerup?.();

    expect(onSelectGroup).toHaveBeenCalledWith("numbers");
    expect(grid.selection).toBe("numbers");
    expect(lastFill(chipRects()[2] as MockObject)).toBe(0x2b6cb0);
    expect(lastFill(chipRects()[0] as MockObject)).toBe(0xfff8e7);
  });

  it("re-selecting the current chip changes nothing", () => {
    const onSelectGroup = vi.fn();
    const onBoardChange = vi.fn();
    const { deps } = makeDeps({ onSelectGroup, onBoardChange });
    const grid = new HubGrid(deps);
    grid.classifyViewport();
    grid.buildWideGrid();

    const all = chipZones()[0] as MockObject;
    all.handlers.pointerup?.();

    expect(onSelectGroup).not.toHaveBeenCalled();
    expect(onBoardChange).not.toHaveBeenCalled();
  });

  it("releases every chip object on shutdown, and forgets them", () => {
    const { deps } = makeDeps();
    const grid = new HubGrid(deps);
    grid.classifyViewport();
    grid.buildWideGrid();
    const built = grid.chips.slice();
    expect(built.length).toBeGreaterThan(0);

    grid.destroy();

    for (const obj of built) {
      expect((obj as unknown as MockObject).destroy).toHaveBeenCalled();
    }
    expect(grid.chips).toEqual([]);
    expect(grid.chipViews).toEqual([]);
  });
});
