import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MockFn } from "../helpers/phaserMock";
import {
  assertBoundedSuccessEffect,
  completeFadeOuts,
  getMockFn,
  mockAudio,
  triggerAllPointerdowns,
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

import { ShapeSorterScene } from "../../scenes/ShapeSorterScene";
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

describe("ShapeSorterScene round initialization", () => {
  it("creates 3 cutout slot images", () => {
    const scene = new ShapeSorterScene();
    scene.create();

    const imageCalls = getMockFn(scene.add.image).mock.calls;
    const slotKeys = imageCalls
      .map((call) => call[2] as string)
      .filter((key) => key.startsWith("cutout_"));
    expect(slotKeys).toHaveLength(3);
  });

  it("creates 3 shape images", () => {
    const scene = new ShapeSorterScene();
    scene.create();

    const imageCalls = getMockFn(scene.add.image).mock.calls;
    const shapeKeys = imageCalls
      .map((call) => call[2] as string)
      .filter((key) => key.startsWith("shape_"));
    expect(shapeKeys).toHaveLength(3);
  });

  it("makes shape images interactive for dragging", () => {
    const scene = new ShapeSorterScene();
    scene.create();

    const imageResults = getMockFn(scene.add.image).mock.results;
    const imageCalls = getMockFn(scene.add.image).mock.calls;
    const shapeResults = imageResults.filter((_result, index) => {
      const key = imageCalls[index][2] as string;
      return key.startsWith("shape_");
    });

    expect(shapeResults).toHaveLength(3);
    for (const result of shapeResults) {
      const obj = result.value as Record<string, MockFn>;
      expect(getMockFn(obj.setInteractive)).toHaveBeenCalled();
    }
  });
});

describe("ShapeSorterScene drag and drop", () => {
  /** Returns shape image objects with their types and origin positions. */
  function getShapes(scene: unknown): Array<{
    obj: Record<string, MockFn>;
    type: string;
    originX: number;
    originY: number;
  }> {
    const add = (scene as { add: Record<string, unknown> }).add;
    const imageMock = getMockFn(add.image);
    const results: Array<{
      obj: Record<string, MockFn>;
      type: string;
      originX: number;
      originY: number;
    }> = [];

    for (let i = 0; i < imageMock.mock.calls.length; i++) {
      const key = imageMock.mock.calls[i][2] as string;
      if (key.startsWith("shape_")) {
        results.push({
          obj: imageMock.mock.results[i].value as Record<string, MockFn>,
          type: key.replace("shape_", ""),
          originX: imageMock.mock.calls[i][0] as number,
          originY: imageMock.mock.calls[i][1] as number,
        });
      }
    }
    return results;
  }

  /** Returns slot zone objects with their types and positions. */
  function getSlots(scene: unknown): Array<{
    zone: Record<string, MockFn>;
    type: string;
    x: number;
    y: number;
  }> {
    const add = (scene as { add: Record<string, unknown> }).add;
    const imageMock = getMockFn(add.image);
    const zoneMock = getMockFn(add.zone);

    const slotTypes: string[] = [];
    for (let i = 0; i < imageMock.mock.calls.length; i++) {
      const key = imageMock.mock.calls[i][2] as string;
      if (key.startsWith("cutout_")) {
        slotTypes.push(key.replace("cutout_", ""));
      }
    }

    const results: Array<{
      zone: Record<string, MockFn>;
      type: string;
      x: number;
      y: number;
    }> = [];

    for (let i = 0; i < zoneMock.mock.results.length && i < slotTypes.length; i++) {
      results.push({
        zone: zoneMock.mock.results[i].value as Record<string, MockFn>,
        type: slotTypes[i],
        x: zoneMock.mock.calls[i][0] as number,
        y: zoneMock.mock.calls[i][1] as number,
      });
    }
    return results;
  }

  it("correct drop snaps shape to slot center, marks non-interactive, and shows bounded feedback", () => {
    const scene = new ShapeSorterScene();
    scene.create();

    const shapes = getShapes(scene);
    const slots = getSlots(scene);
    const initialGraphicsCount = getMockFn(scene.add.graphics).mock.results.length;
    const shape = shapes[0];
    const slot = slots.find((s) => s.type === shape.type);
    if (!slot) throw new Error("No matching slot found");

    // Simulate drop on matching zone
    const onCalls = getMockFn(shape.obj.on).mock.calls;
    const dropCall = onCalls.find((c) => c[0] === "drop");
    const dropCallback = dropCall?.[1] as (pointer: unknown, target: unknown) => void;
    dropCallback(null, slot.zone);

    // Correct drop animates to slot center via a 200ms Back.out snap tween
    // (no instant setPosition snap).
    const snapTween = getMockFn(scene.tweens.add).mock.calls.find(
      (call) =>
        call[0]?.targets === shape.obj &&
        call[0]?.x === slot.x &&
        call[0]?.y === slot.y &&
        call[0]?.ease === "Back.out",
    );
    expect(snapTween).toBeDefined();
    if (!snapTween) return;
    expect((snapTween[0] as { duration: number }).duration).toBe(200);
    expect(getMockFn(shape.obj.setPosition)).not.toHaveBeenCalledWith(slot.x, slot.y);
    expect(getMockFn(shape.obj.disableInteractive)).toHaveBeenCalled();
    expect(mockAudio.playCorrect).toHaveBeenCalled();
    assertBoundedSuccessEffect(scene, initialGraphicsCount);
  });

  it("uses a reduced-motion success effect when requested", () => {
    vi.stubGlobal("window", {
      matchMedia: vi.fn(() => ({ matches: true })),
    });

    const scene = new ShapeSorterScene();
    scene.create();

    const shapes = getShapes(scene);
    const slots = getSlots(scene);
    const initialGraphicsCount = getMockFn(scene.add.graphics).mock.results.length;
    const shape = shapes[0];
    const slot = slots.find((s) => s.type === shape.type);
    if (!slot) throw new Error("No matching slot found");

    const dropCall = getMockFn(shape.obj.on).mock.calls.find((call) => call[0] === "drop");
    const dropCallback = dropCall?.[1] as (pointer: unknown, target: unknown) => void;
    dropCallback(null, slot.zone);

    assertBoundedSuccessEffect(scene, initialGraphicsCount);
    const graphicsMock = getMockFn(scene.add.graphics);
    const effect = graphicsMock.mock.results[initialGraphicsCount].value as Record<string, MockFn>;
    const effectTween = getMockFn(scene.tweens.add).mock.calls.find(
      (call) => call[0]?.targets === effect,
    );
    expect(effectTween).toBeDefined();
    if (!effectTween) return;
    expect((effectTween[0] as { duration: number }).duration).toBeLessThanOrEqual(300);
  });

  it("incorrect drop bounces shape back to origin with wobble (no penalty)", () => {
    const scene = new ShapeSorterScene();
    scene.create();

    const shapes = getShapes(scene);
    const slots = getSlots(scene);
    const shape = shapes[0];
    const wrongSlot = slots.find((s) => s.type !== shape.type);

    // Drop on a wrong slot, then release
    const onCalls = getMockFn(shape.obj.on).mock.calls;
    const dropCallback = onCalls.find((c) => c[0] === "drop")?.[1] as (
      pointer: unknown,
      target: unknown,
    ) => void;
    dropCallback(null, wrongSlot?.zone);
    const dragendCallback = onCalls.find((c) => c[0] === "dragend")?.[1] as () => void;
    dragendCallback();

    // Verify bounce-back tween targets origin position
    const tweenCalls = getMockFn(scene.tweens.add).mock.calls;
    const shapeTween = tweenCalls.find((c) => c[0]?.targets === shape.obj);
    expect(shapeTween).toBeDefined();
    if (!shapeTween) throw new Error("shape bounce-back tween not found");
    expect(shapeTween[0].x).toBe(shape.originX);
    expect(shapeTween[0].y).toBe(shape.originY);

    expect(mockAudio.playIncorrect).toHaveBeenCalled();
    // No penalty — scene not restarted
    expect(getMockFn(scene.scene.start)).not.toHaveBeenCalled();
  });

  it("uses a reduced-motion bounce-back when requested", () => {
    vi.stubGlobal("window", {
      matchMedia: vi.fn(() => ({ matches: true })),
    });

    const scene = new ShapeSorterScene();
    scene.create();

    const shapes = getShapes(scene);
    const shape = shapes[0];

    const onCalls = getMockFn(shape.obj.on).mock.calls;
    const dragendCall = onCalls.find((c) => c[0] === "dragend");
    const dragendCallback = dragendCall?.[1] as () => void;
    dragendCallback();

    const tweenCalls = getMockFn(scene.tweens.add).mock.calls;
    const bounceTween = tweenCalls.find((c) => c[0]?.targets === shape.obj);
    expect(bounceTween).toBeDefined();
    if (!bounceTween) return;
    expect((bounceTween[0] as { duration: number }).duration).toBe(180);
  });

  it("lifts and tilts the shape on drag start and restores it on drag end", () => {
    const scene = new ShapeSorterScene();
    scene.create();

    const shapes = getShapes(scene);
    const shape = shapes[0];
    const onCalls = getMockFn(shape.obj.on).mock.calls;

    const dragstartCallback = onCalls.find((c) => c[0] === "dragstart")?.[1] as () => void;
    expect(dragstartCallback).toBeDefined();
    dragstartCallback();

    const liftTween = getMockFn(scene.tweens.add).mock.calls.find(
      (c) => c[0]?.targets === shape.obj && c[0]?.angle === 4,
    );
    expect(liftTween).toBeDefined();
    if (!liftTween) return;
    expect(liftTween[0].scaleX).toBe(1.1);
    expect(liftTween[0].scaleY).toBe(1.1);

    // Both dragend listeners fire in the real game: the scene's bounce-back
    // handler (game logic) and the drag-lift restore (juice).
    const dragendCallbacks = onCalls
      .filter((c) => c[0] === "dragend")
      .map((c) => c[1] as () => void);
    dragendCallbacks.forEach((callback) => {
      callback();
    });

    const restoreTween = getMockFn(scene.tweens.add).mock.calls.find(
      (c) => c[0]?.targets === shape.obj && c[0]?.scaleX === 1 && c[0]?.scaleY === 1,
    );
    expect(restoreTween).toBeDefined();
    expect(restoreTween?.[0]?.angle).toBe(0);
  });

  it("uses a reduced-motion lift (1.05 scale, no tilt) when requested", () => {
    vi.stubGlobal("window", {
      matchMedia: vi.fn(() => ({ matches: true })),
    });

    const scene = new ShapeSorterScene();
    scene.create();

    const shapes = getShapes(scene);
    const shape = shapes[0];
    const dragstartCallback = getMockFn(shape.obj.on).mock.calls.find(
      (c) => c[0] === "dragstart",
    )?.[1] as () => void;
    dragstartCallback();

    const liftTween = getMockFn(scene.tweens.add).mock.calls.find(
      (c) => c[0]?.targets === shape.obj && c[0]?.scaleX === 1.05,
    );
    expect(liftTween).toBeDefined();
    if (!liftTween) return;
    expect(liftTween[0].angle).toBe(0);
  });

  it("pulses a soft outline on the drop zone while dragging over it and clears on leave", () => {
    const scene = new ShapeSorterScene();
    scene.create();

    const slots = getSlots(scene);
    const inputOnMock = getMockFn(scene.input.on);
    const dragenterCallback = inputOnMock.mock.calls.find((c) => c[0] === "dragenter")?.[1] as
      | ((pointer: unknown, obj: unknown, zone: unknown) => void)
      | undefined;
    expect(dragenterCallback).toBeDefined();
    if (!dragenterCallback) return;

    const initialGraphicsCount = getMockFn(scene.add.graphics).mock.results.length;
    dragenterCallback(null, null, slots[0].zone);

    const highlight = getMockFn(scene.add.graphics).mock.results[initialGraphicsCount]?.value as
      | Record<string, MockFn>
      | undefined;
    expect(highlight).toBeDefined();
    if (!highlight) return;
    expect(getMockFn(highlight.strokeRect)).toHaveBeenCalled();

    const pulseTween = getMockFn(scene.tweens.add).mock.calls.find(
      (call) => call[0]?.targets === highlight && call[0]?.repeat === -1,
    );
    expect(pulseTween).toBeDefined();
    expect(pulseTween?.[0]?.yoyo).toBe(true);

    const dragleaveCallback = inputOnMock.mock.calls.find((c) => c[0] === "dragleave")?.[1] as
      | ((pointer: unknown, obj: unknown, zone: unknown) => void)
      | undefined;
    expect(dragleaveCallback).toBeDefined();
    if (!dragleaveCallback) return;
    dragleaveCallback(null, null, slots[0].zone);

    expect(getMockFn(highlight.destroy)).toHaveBeenCalledTimes(1);
  });

  it("drop on non-slot target is a no-op (no snap, no SFX, no particles)", () => {
    const scene = new ShapeSorterScene();
    scene.create();

    const shapes = getShapes(scene);
    const shape = shapes[0];

    // Simulate drop on an invalid target (not a registered zone)
    const onCalls = getMockFn(shape.obj.on).mock.calls;
    const dropCall = onCalls.find((c) => c[0] === "drop");
    const dropCallback = dropCall?.[1] as (pointer: unknown, target: unknown) => void;
    dropCallback(null, {});

    expect(getMockFn(shape.obj.disableInteractive)).not.toHaveBeenCalled();
    expect(mockAudio.playCorrect).not.toHaveBeenCalled();
    expect(getMockFn(scene.add.particles)).not.toHaveBeenCalled();
  });

  it("dragend without a drop on a zone bounces silently (no incorrect SFX)", () => {
    const scene = new ShapeSorterScene();
    scene.create();

    const shapes = getShapes(scene);
    const shape = shapes[0];

    // Drag end with no prior drop on a zone: bounce back without incorrect SFX
    const onCalls = getMockFn(shape.obj.on).mock.calls;
    const dragendCallback = onCalls.find((c) => c[0] === "dragend")?.[1] as () => void;
    dragendCallback();

    const tweenCalls = getMockFn(scene.tweens.add).mock.calls;
    const bounceTween = tweenCalls.find(
      (c) => c[0]?.targets === shape.obj && c[0]?.x === shape.originX,
    );
    expect(bounceTween).toBeDefined();
    expect(mockAudio.playIncorrect).not.toHaveBeenCalled();
  });

  it("creates touch targets meeting 64x64px minimum", () => {
    const scene = new ShapeSorterScene();
    scene.create();

    const shapes = getShapes(scene);
    expect(shapes.length).toBe(3);

    for (const shape of shapes) {
      const setDisplaySizeCalls = getMockFn(shape.obj.setDisplaySize).mock.calls;
      for (const call of setDisplaySizeCalls) {
        expect(call[0]).toBeGreaterThanOrEqual(64);
        expect(call[1]).toBeGreaterThanOrEqual(64);
      }
    }
  });
});

describe("ShapeSorterScene completion and sticker flow", () => {
  /** Returns shape image objects with their types. */
  function getShapeObjects(scene: unknown): Array<{ obj: Record<string, MockFn>; type: string }> {
    const add = (scene as { add: Record<string, unknown> }).add;
    const imageMock = getMockFn(add.image);
    const results: Array<{ obj: Record<string, MockFn>; type: string }> = [];

    for (let i = 0; i < imageMock.mock.calls.length; i++) {
      const key = imageMock.mock.calls[i][2] as string;
      if (key.startsWith("shape_")) {
        results.push({
          obj: imageMock.mock.results[i].value as Record<string, MockFn>,
          type: key.replace("shape_", ""),
        });
      }
    }
    return results;
  }

  /** Returns slot zone objects with their types. */
  function getSlotZones(scene: unknown): Array<{ zone: Record<string, MockFn>; type: string }> {
    const add = (scene as { add: Record<string, unknown> }).add;
    const imageMock = getMockFn(add.image);
    const zoneMock = getMockFn(add.zone);

    const slotTypes: string[] = [];
    for (let i = 0; i < imageMock.mock.calls.length; i++) {
      const key = imageMock.mock.calls[i][2] as string;
      if (key.startsWith("cutout_")) {
        slotTypes.push(key.replace("cutout_", ""));
      }
    }

    const results: Array<{ zone: Record<string, MockFn>; type: string }> = [];

    for (let i = 0; i < zoneMock.mock.results.length && i < slotTypes.length; i++) {
      results.push({
        zone: zoneMock.mock.results[i].value as Record<string, MockFn>,
        type: slotTypes[i],
      });
    }
    return results;
  }

  /** Simulates completing all three rounds by placing every shape of each round. */
  function completeAllRounds(scene: ShapeSorterScene): void {
    for (let round = 0; round < 3; round++) {
      const shapes = getShapeObjects(scene).slice(round * 3, round * 3 + 3);
      const slots = getSlotZones(scene).slice(round * 3, round * 3 + 3);
      for (const shape of shapes) {
        const slot = slots.find((s) => s.type === shape.type);
        if (!slot) throw new Error("No matching slot found");
        const onCalls = getMockFn(shape.obj.on).mock.calls;
        const dropCall = onCalls.find((c) => c[0] === "drop");
        const dropCallback = dropCall?.[1] as (pointer: unknown, target: unknown) => void;
        dropCallback(null, slot.zone);
      }
      if (round < 2) {
        // Fire the newest round-advance delayed call (NEXT_ROUND_DELAY = 1200ms).
        const advanceCalls = getMockFn(scene.time.delayedCall).mock.calls.filter(
          (call) => call[0] === 1200,
        );
        const advanceCall = advanceCalls[advanceCalls.length - 1];
        const advanceCallback = advanceCall?.[1] as () => void;
        advanceCallback();
      }
    }
  }

  it("plays win SFX when all shapes are placed", () => {
    vi.mocked(hasSticker).mockReturnValue(false);

    const scene = new ShapeSorterScene();
    scene.create();
    completeAllRounds(scene);

    expect(mockAudio.playWin).toHaveBeenCalled();
  });

  it("awards sticker on first completion only", () => {
    vi.mocked(hasSticker).mockReturnValue(false);

    const scene = new ShapeSorterScene();
    scene.create();
    completeAllRounds(scene);

    expect(earnSticker).toHaveBeenCalledWith("shape-sorter");
    expect(mockAudio.playSticker).toHaveBeenCalled();
  });

  it("does not re-award sticker on replay", () => {
    vi.mocked(hasSticker).mockReturnValue(true);

    const scene = new ShapeSorterScene();
    scene.create();
    completeAllRounds(scene);

    expect(earnSticker).not.toHaveBeenCalled();
    expect(mockAudio.playSticker).not.toHaveBeenCalled();
  });

  it("auto-returns to Hub after 3s delay", () => {
    vi.mocked(hasSticker).mockReturnValue(false);

    const scene = new ShapeSorterScene();
    scene.create();
    completeAllRounds(scene);

    const delayedCallMock = getMockFn(scene.time.delayedCall);
    const autoReturnCall = delayedCallMock.mock.calls.find((call) => call[0] === 3000);
    expect(autoReturnCall).toBeDefined();

    const callback = autoReturnCall?.[1] as () => void;
    callback();
    completeFadeOuts(scene);

    expect(getMockFn(scene.scene.start)).toHaveBeenCalledWith("Hub", {
      justEarned: "shape-sorter",
    });
  });

  it("ignores a late Back hold when the auto-return is already navigating", () => {
    vi.mocked(hasSticker).mockReturnValue(false);

    const scene = new ShapeSorterScene();
    scene.create();

    // Child starts a 3s Back hold mid-game, then finishes the round.
    triggerAllPointerdowns(scene);
    completeAllRounds(scene);

    const timeMock = getMockFn(scene.time.delayedCall);
    const hold3000 = timeMock.mock.calls.filter((call) => call[0] === 3000);
    expect(hold3000.length).toBeGreaterThanOrEqual(2);
    const parentLockHold = hold3000[0][1] as () => void;
    const autoReturn = hold3000[hold3000.length - 1][1] as () => void;

    // Auto-return fires first and navigates exactly once.
    autoReturn();
    completeFadeOuts(scene);
    expect(getMockFn(scene.scene.start)).toHaveBeenCalledTimes(1);
    expect(getMockFn(scene.scene.start)).toHaveBeenCalledWith("Hub", {
      justEarned: "shape-sorter",
    });

    // The stale Back hold completes afterwards: must NOT start a second
    // transition (the guard blocks it before any new fade-out begins).
    parentLockHold();
    expect(getMockFn(scene.cameras.main.fadeOut)).toHaveBeenCalledTimes(1);
    expect(getMockFn(scene.scene.start)).toHaveBeenCalledTimes(1);
  });

  it("passes no justEarned data on replay auto-return", () => {
    vi.mocked(hasSticker).mockReturnValue(true);

    const scene = new ShapeSorterScene();
    scene.create();
    completeAllRounds(scene);

    const delayedCallMock = getMockFn(scene.time.delayedCall);
    const autoReturnCall = delayedCallMock.mock.calls.find((call) => call[0] === 3000);
    const callback = autoReturnCall?.[1] as () => void;
    callback();
    completeFadeOuts(scene);

    expect(getMockFn(scene.scene.start)).toHaveBeenCalledWith("Hub");
  });
});
