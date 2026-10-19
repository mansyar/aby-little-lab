import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MockFn } from "../helpers/phaserMock";
import {
  assertBoundedSuccessEffect,
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

import { BigSmallScene } from "../../scenes/BigSmallScene";
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

describe("BigSmallScene round initialization", () => {
  it("creates 6 toy images", () => {
    const scene = new BigSmallScene();
    scene.create();

    const imageCalls = getMockFn(scene.add.image).mock.calls;
    const toyKeys = imageCalls
      .map((call) => call[2] as string)
      .filter((key) => key.startsWith("toy_") && key !== "toy_box");
    expect(toyKeys).toHaveLength(6);
  });

  it("creates 2 box images", () => {
    const scene = new BigSmallScene();
    scene.create();

    const imageCalls = getMockFn(scene.add.image).mock.calls;
    const boxKeys = imageCalls.map((call) => call[2] as string).filter((key) => key === "toy_box");
    expect(boxKeys).toHaveLength(2);
  });

  it("creates 2 drop zones with dropZone flag", () => {
    const scene = new BigSmallScene();
    scene.create();

    const zoneMock = getMockFn(scene.add.zone);
    expect(zoneMock).toHaveBeenCalledTimes(2);

    for (const result of zoneMock.mock.results) {
      const zone = result.value as Record<string, MockFn>;
      expect(getMockFn(zone.setInteractive)).toHaveBeenCalledWith({ dropZone: true });
    }
  });

  it("makes toy images interactive and draggable", () => {
    const scene = new BigSmallScene();
    scene.create();

    const imageResults = getMockFn(scene.add.image).mock.results;
    const imageCalls = getMockFn(scene.add.image).mock.calls;
    const toyResults = imageResults.filter((_result, index) => {
      const key = imageCalls[index][2] as string;
      return key.startsWith("toy_") && key !== "toy_box";
    });

    expect(toyResults).toHaveLength(6);
    for (const result of toyResults) {
      const obj = result.value as Record<string, MockFn>;
      expect(getMockFn(obj.setInteractive)).toHaveBeenCalled();
    }
    expect(getMockFn(scene.input.setDraggable)).toHaveBeenCalledTimes(6);
  });

  it("creates big toys >=96px and small toys >=64px", () => {
    const scene = new BigSmallScene();
    scene.create();

    const imageResults = getMockFn(scene.add.image).mock.results;
    const imageCalls = getMockFn(scene.add.image).mock.calls;

    const toySizes: number[] = [];
    for (let i = 0; i < imageCalls.length; i++) {
      const key = imageCalls[i][2] as string;
      if (key.startsWith("toy_") && key !== "toy_box") {
        const obj = imageResults[i].value as Record<string, MockFn>;
        const displaySizeCalls = getMockFn(obj.setDisplaySize).mock.calls;
        toySizes.push(displaySizeCalls[0]?.[0] as number);
      }
    }

    const bigToys = toySizes.filter((s) => s >= 100);
    const smallToys = toySizes.filter((s) => s < 100);

    expect(bigToys).toHaveLength(3);
    expect(smallToys).toHaveLength(3);

    for (const size of bigToys) {
      expect(size).toBeGreaterThanOrEqual(96);
    }
    for (const size of smallToys) {
      expect(size).toBeGreaterThanOrEqual(64);
    }
  });
});

describe("BigSmallScene drag and drop", () => {
  /** Returns toy image objects with their scaleCategory and origin positions. */
  function getToys(scene: unknown): Array<{
    obj: Record<string, MockFn>;
    scaleCategory: "big" | "small";
    originX: number;
    originY: number;
  }> {
    const add = (scene as { add: Record<string, unknown> }).add;
    const imageMock = getMockFn(add.image);
    const results: Array<{
      obj: Record<string, MockFn>;
      scaleCategory: "big" | "small";
      originX: number;
      originY: number;
    }> = [];

    for (let i = 0; i < imageMock.mock.calls.length; i++) {
      const key = imageMock.mock.calls[i][2] as string;
      if (key.startsWith("toy_") && key !== "toy_box") {
        const obj = imageMock.mock.results[i].value as Record<string, MockFn>;
        const displaySizeCalls = getMockFn(obj.setDisplaySize).mock.calls;
        const size = displaySizeCalls[0]?.[0] as number;
        const scaleCategory: "big" | "small" = size >= 100 ? "big" : "small";
        results.push({
          obj,
          scaleCategory,
          originX: imageMock.mock.calls[i][0] as number,
          originY: imageMock.mock.calls[i][1] as number,
        });
      }
    }
    return results;
  }

  /** Returns box slot zone objects with their scaleCategory and positions. */
  function getBoxSlots(scene: unknown): Array<{
    zone: Record<string, MockFn>;
    scaleCategory: "big" | "small";
    x: number;
    y: number;
  }> {
    const add = (scene as { add: Record<string, unknown> }).add;
    const imageMock = getMockFn(add.image);
    const zoneMock = getMockFn(add.zone);

    const boxSizes: number[] = [];
    for (let i = 0; i < imageMock.mock.calls.length; i++) {
      const key = imageMock.mock.calls[i][2] as string;
      if (key === "toy_box") {
        const obj = imageMock.mock.results[i].value as Record<string, MockFn>;
        const displaySizeCalls = getMockFn(obj.setDisplaySize).mock.calls;
        boxSizes.push(displaySizeCalls[0]?.[0] as number);
      }
    }

    const results: Array<{
      zone: Record<string, MockFn>;
      scaleCategory: "big" | "small";
      x: number;
      y: number;
    }> = [];

    for (let j = 0; j < boxSizes.length && j < zoneMock.mock.results.length; j++) {
      const scaleCategory: "big" | "small" = boxSizes[j] >= 100 ? "big" : "small";
      results.push({
        zone: zoneMock.mock.results[j].value as Record<string, MockFn>,
        scaleCategory,
        x: zoneMock.mock.calls[j][0] as number,
        y: zoneMock.mock.calls[j][1] as number,
      });
    }
    return results;
  }

  it("correct drop snaps toy to box position, marks non-interactive, and shows bounded feedback", () => {
    const scene = new BigSmallScene();
    scene.create();

    const toys = getToys(scene);
    const slots = getBoxSlots(scene);
    const initialGraphicsCount = getMockFn(scene.add.graphics).mock.results.length;
    const toy = toys[0];
    const slot = slots.find((s) => s.scaleCategory === toy.scaleCategory);
    if (!slot) throw new Error("No matching box slot found");

    const onCalls = getMockFn(toy.obj.on).mock.calls;
    const dropCall = onCalls.find((c) => c[0] === "drop");
    const dropCallback = dropCall?.[1] as (pointer: unknown, target: unknown) => void;
    dropCallback(null, slot.zone);

    // Correct drop animates to box position via a 200ms Cubic.out snap tween.
    const snapTween = getMockFn(scene.tweens.add).mock.calls.find(
      (call) =>
        call[0]?.targets === toy.obj &&
        call[0]?.x === slot.x &&
        call[0]?.y === slot.y &&
        call[0]?.ease === "Cubic.out",
    );
    expect(snapTween).toBeDefined();
    if (!snapTween) return;
    expect((snapTween[0] as { duration: number }).duration).toBe(200);
    expect(getMockFn(toy.obj.setPosition)).not.toHaveBeenCalledWith(slot.x, slot.y);
    expect(getMockFn(toy.obj.disableInteractive)).toHaveBeenCalled();
    expect(mockAudio.playCorrect).toHaveBeenCalled();
    assertBoundedSuccessEffect(scene, initialGraphicsCount);
  });

  it("incorrect drop bounces toy back to origin with wobble (no penalty, remains draggable)", () => {
    const scene = new BigSmallScene();
    scene.create();

    const toys = getToys(scene);
    const slots = getBoxSlots(scene);
    const toy = toys[0];
    const wrongSlot = slots.find((s) => s.scaleCategory !== toy.scaleCategory);
    if (!wrongSlot) throw new Error("No mismatching box slot found");

    const onCalls = getMockFn(toy.obj.on).mock.calls;

    const dropCall = onCalls.find((c) => c[0] === "drop");
    const dropCallback = dropCall?.[1] as (pointer: unknown, target: unknown) => void;
    dropCallback(null, wrongSlot.zone);

    const dragendCall = onCalls.find((c) => c[0] === "dragend");
    const dragendCallback = dragendCall?.[1] as () => void;
    dragendCallback();

    const tweenCalls = getMockFn(scene.tweens.add).mock.calls;
    const toyTween = tweenCalls.find((c) => c[0]?.targets === toy.obj);
    expect(toyTween).toBeDefined();
    if (!toyTween) throw new Error("toy bounce-back tween not found");
    expect(toyTween[0].x).toBe(toy.originX);
    expect(toyTween[0].y).toBe(toy.originY);

    expect(mockAudio.playIncorrect).toHaveBeenCalled();
    expect(getMockFn(toy.obj.disableInteractive)).not.toHaveBeenCalled();
    expect(getMockFn(scene.scene.start)).not.toHaveBeenCalled();
  });

  it("sorted toys lock in place and do not bounce on dragend", () => {
    const scene = new BigSmallScene();
    scene.create();

    const toys = getToys(scene);
    const slots = getBoxSlots(scene);
    const toy = toys[0];
    const slot = slots.find((s) => s.scaleCategory === toy.scaleCategory);
    if (!slot) throw new Error("No matching box slot found");

    const onCalls = getMockFn(toy.obj.on).mock.calls;

    const dropCall = onCalls.find((c) => c[0] === "drop");
    const dropCallback = dropCall?.[1] as (pointer: unknown, target: unknown) => void;
    dropCallback(null, slot.zone);

    expect(getMockFn(toy.obj.disableInteractive)).toHaveBeenCalled();

    const dragendCall = onCalls.find((c) => c[0] === "dragend");
    const dragendCallback = dragendCall?.[1] as () => void;
    dragendCallback();

    const tweenCalls = getMockFn(scene.tweens.add).mock.calls;
    const bounceTween = tweenCalls.find(
      (c) => c[0]?.targets === toy.obj && c[0]?.x === toy.originX && c[0]?.y === toy.originY,
    );
    expect(bounceTween).toBeUndefined();
  });

  it("creates touch targets meeting 64x64px minimum", () => {
    const scene = new BigSmallScene();
    scene.create();

    const toys = getToys(scene);
    expect(toys).toHaveLength(6);

    for (const toy of toys) {
      const setDisplaySizeCalls = getMockFn(toy.obj.setDisplaySize).mock.calls;
      for (const call of setDisplaySizeCalls) {
        expect(call[0]).toBeGreaterThanOrEqual(64);
        expect(call[1]).toBeGreaterThanOrEqual(64);
      }
    }
  });

  it("drop on non-box target is a no-op (no snap, no SFX, no particles)", () => {
    const scene = new BigSmallScene();
    scene.create();

    const toys = getToys(scene);
    const toy = toys[0];

    const onCalls = getMockFn(toy.obj.on).mock.calls;
    const dropCall = onCalls.find((c) => c[0] === "drop");
    const dropCallback = dropCall?.[1] as (pointer: unknown, target: unknown) => void;
    dropCallback(null, {});

    expect(getMockFn(toy.obj.disableInteractive)).not.toHaveBeenCalled();
    expect(mockAudio.playCorrect).not.toHaveBeenCalled();
    expect(getMockFn(scene.add.particles)).not.toHaveBeenCalled();
  });

  it("dragend without a drop on a zone bounces silently (no incorrect SFX)", () => {
    const scene = new BigSmallScene();
    scene.create();

    const toys = getToys(scene);
    const toy = toys[0];

    const onCalls = getMockFn(toy.obj.on).mock.calls;
    const dragendCall = onCalls.find((c) => c[0] === "dragend");
    const dragendCallback = dragendCall?.[1] as () => void;
    dragendCallback();

    const tweenCalls = getMockFn(scene.tweens.add).mock.calls;
    const bounceTween = tweenCalls.find(
      (c) => c[0]?.targets === toy.obj && c[0]?.x === toy.originX,
    );
    expect(bounceTween).toBeDefined();

    expect(mockAudio.playIncorrect).not.toHaveBeenCalled();
  });

  it("lifts and tilts the toy on drag start and restores it on drag end", () => {
    const scene = new BigSmallScene();
    scene.create();

    const toys = getToys(scene);
    const toy = toys[0];
    const onCalls = getMockFn(toy.obj.on).mock.calls;

    const dragstartCallback = onCalls.find((c) => c[0] === "dragstart")?.[1] as () => void;
    expect(dragstartCallback).toBeDefined();
    dragstartCallback();

    const liftTween = getMockFn(scene.tweens.add).mock.calls.find(
      (c) => c[0]?.targets === toy.obj && c[0]?.angle === 4,
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
      (c) => c[0]?.targets === toy.obj && c[0]?.scaleX === 1 && c[0]?.scaleY === 1,
    );
    expect(restoreTween).toBeDefined();
    expect(restoreTween?.[0]?.angle).toBe(0);
  });

  it("uses a reduced-motion lift (1.05 scale, no tilt) when requested", () => {
    vi.stubGlobal("window", {
      matchMedia: vi.fn(() => ({ matches: true })),
    });

    const scene = new BigSmallScene();
    scene.create();

    const toys = getToys(scene);
    const toy = toys[0];
    const dragstartCallback = getMockFn(toy.obj.on).mock.calls.find(
      (c) => c[0] === "dragstart",
    )?.[1] as () => void;
    dragstartCallback();

    const liftTween = getMockFn(scene.tweens.add).mock.calls.find(
      (c) => c[0]?.targets === toy.obj && c[0]?.scaleX === 1.05,
    );
    expect(liftTween).toBeDefined();
    if (!liftTween) return;
    expect(liftTween[0].angle).toBe(0);
  });

  it("pulses a soft outline on the box drop zone while dragging over it and clears on leave", () => {
    const scene = new BigSmallScene();
    scene.create();

    const slots = getBoxSlots(scene);
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

  it("shrinks the toy into the box with a 150ms tween on a correct drop", () => {
    const scene = new BigSmallScene();
    scene.create();

    const toys = getToys(scene);
    const slots = getBoxSlots(scene);
    const toy = toys[0];
    const slot = slots.find((s) => s.scaleCategory === toy.scaleCategory);
    expect(slot).toBeDefined();
    if (!slot) return;

    const dropCallback = getMockFn(toy.obj.on).mock.calls.find((c) => c[0] === "drop")?.[1] as
      | ((pointer: unknown, target: unknown) => void)
      | undefined;
    expect(dropCallback).toBeDefined();
    if (!dropCallback) return;
    dropCallback(null, slot.zone);

    const shrinkTween = getMockFn(scene.tweens.add).mock.calls.find(
      (call) => call[0]?.targets === toy.obj && call[0]?.scaleX === 0 && call[0]?.scaleY === 0,
    );
    expect(shrinkTween).toBeDefined();
    expect(shrinkTween?.[0]?.duration).toBe(150);
    expect(shrinkTween?.[0]?.ease).toBe("Sine.in");
  });

  it("follows the pointer while a toy is dragged", () => {
    const scene = new BigSmallScene();
    scene.create();

    const toy = getToys(scene)[0];
    const dragCallbacks = getMockFn(toy.obj.on)
      .mock.calls.filter((c) => c[0] === "drag")
      .map((c) => c[1] as (pointer: unknown, x: number, y: number) => void);
    expect(dragCallbacks.length).toBeGreaterThan(0);

    for (const callback of dragCallbacks) callback(null, 420, 500);

    expect(getMockFn(toy.obj.setPosition)).toHaveBeenCalledWith(420, 500);
  });

  it("does not restore the drag-lift scale for a toy that was sorted", () => {
    const scene = new BigSmallScene();
    scene.create();

    const toys = getToys(scene);
    const slots = getBoxSlots(scene);
    const toy = toys[0];
    const slot = slots.find((s) => s.scaleCategory === toy.scaleCategory);
    expect(slot).toBeDefined();
    if (!slot) return;

    (
      getMockFn(toy.obj.on).mock.calls.find((c) => c[0] === "drop")?.[1] as
        | ((pointer: unknown, target: unknown) => void)
        | undefined
    )?.(null, slot.zone);

    const dragendCallbacks = getMockFn(toy.obj.on)
      .mock.calls.filter((c) => c[0] === "dragend")
      .map((c) => c[1] as () => void);
    dragendCallbacks.forEach((callback) => {
      callback();
    });

    const restoreTween = getMockFn(scene.tweens.add).mock.calls.find(
      (call) => call[0]?.targets === toy.obj && call[0]?.scaleX === 1 && call[0]?.scaleY === 1,
    );
    expect(restoreTween).toBeUndefined();
  });

  it("wiggles the box lid and briefly scales the box up on a correct drop", () => {
    const scene = new BigSmallScene();
    scene.create();

    const toys = getToys(scene);
    const slots = getBoxSlots(scene);
    const toy = toys[0];
    const slot = slots.find((s) => s.scaleCategory === toy.scaleCategory);
    expect(slot).toBeDefined();
    if (!slot) return;

    const imageMock = getMockFn(scene.add.image);
    const boxImages: Array<Record<string, MockFn>> = [];
    for (let i = 0; i < imageMock.mock.calls.length; i++) {
      if (imageMock.mock.calls[i][2] === "toy_box") {
        boxImages.push(imageMock.mock.results[i].value as Record<string, MockFn>);
      }
    }
    const box = boxImages[slots.indexOf(slot)];
    expect(box).toBeDefined();
    if (!box) return;

    (
      getMockFn(toy.obj.on).mock.calls.find((c) => c[0] === "drop")?.[1] as
        | ((pointer: unknown, target: unknown) => void)
        | undefined
    )?.(null, slot.zone);

    const wiggleTween = getMockFn(scene.tweens.add).mock.calls.find(
      (call) => call[0]?.targets === box && call[0]?.angle === 3 && call[0]?.yoyo === true,
    );
    expect(wiggleTween).toBeDefined();
    expect(wiggleTween?.[0]?.repeat).toBe(3);

    const bumpTween = getMockFn(scene.tweens.add).mock.calls.find(
      (call) => call[0]?.targets === box && call[0]?.scaleX === 1.05 && call[0]?.yoyo === true,
    );
    expect(bumpTween).toBeDefined();
  });

  it("uses reduced-motion timings for the box reaction", () => {
    vi.stubGlobal("window", { matchMedia: vi.fn(() => ({ matches: true })) });

    const scene = new BigSmallScene();
    scene.create();

    const toys = getToys(scene);
    const slots = getBoxSlots(scene);
    const toy = toys[0];
    const slot = slots.find((s) => s.scaleCategory === toy.scaleCategory);
    expect(slot).toBeDefined();
    if (!slot) return;

    const imageMock = getMockFn(scene.add.image);
    const boxImages: Array<Record<string, MockFn>> = [];
    for (let i = 0; i < imageMock.mock.calls.length; i++) {
      if (imageMock.mock.calls[i][2] === "toy_box") {
        boxImages.push(imageMock.mock.results[i].value as Record<string, MockFn>);
      }
    }
    const box = boxImages[slots.indexOf(slot)];
    expect(box).toBeDefined();
    if (!box) return;

    (
      getMockFn(toy.obj.on).mock.calls.find((c) => c[0] === "drop")?.[1] as
        | ((pointer: unknown, target: unknown) => void)
        | undefined
    )?.(null, slot.zone);

    const shrinkTween = getMockFn(scene.tweens.add).mock.calls.find(
      (call) => call[0]?.targets === toy.obj && call[0]?.scaleX === 0,
    );
    expect(shrinkTween?.[0]?.duration).toBe(90);

    const wiggleTween = getMockFn(scene.tweens.add).mock.calls.find(
      (call) => call[0]?.targets === box && call[0]?.angle === 3,
    );
    expect(wiggleTween?.[0]?.duration).toBe(120);

    const bumpTween = getMockFn(scene.tweens.add).mock.calls.find(
      (call) => call[0]?.targets === box && call[0]?.scaleX === 1.02,
    );
    expect(bumpTween).toBeDefined();
    expect(bumpTween?.[0]?.duration).toBe(150);
  });
});

describe("BigSmallScene completion and sticker flow", () => {
  /** Returns toy image objects with their scaleCategory. */
  function getToys(scene: unknown): Array<{
    obj: Record<string, MockFn>;
    scaleCategory: "big" | "small";
  }> {
    const add = (scene as { add: Record<string, unknown> }).add;
    const imageMock = getMockFn(add.image);
    const results: Array<{
      obj: Record<string, MockFn>;
      scaleCategory: "big" | "small";
    }> = [];

    for (let i = 0; i < imageMock.mock.calls.length; i++) {
      const key = imageMock.mock.calls[i][2] as string;
      if (key.startsWith("toy_") && key !== "toy_box") {
        const obj = imageMock.mock.results[i].value as Record<string, MockFn>;
        const displaySizeCalls = getMockFn(obj.setDisplaySize).mock.calls;
        const size = displaySizeCalls[0]?.[0] as number;
        const scaleCategory: "big" | "small" = size >= 100 ? "big" : "small";
        results.push({ obj, scaleCategory });
      }
    }
    return results;
  }

  /** Returns box slot zone objects with their scaleCategory. */
  function getBoxSlots(
    scene: unknown,
  ): Array<{ zone: Record<string, MockFn>; scaleCategory: "big" | "small" }> {
    const add = (scene as { add: Record<string, unknown> }).add;
    const imageMock = getMockFn(add.image);
    const zoneMock = getMockFn(add.zone);

    const boxSizes: number[] = [];
    for (let i = 0; i < imageMock.mock.calls.length; i++) {
      const key = imageMock.mock.calls[i][2] as string;
      if (key === "toy_box") {
        const obj = imageMock.mock.results[i].value as Record<string, MockFn>;
        const displaySizeCalls = getMockFn(obj.setDisplaySize).mock.calls;
        boxSizes.push(displaySizeCalls[0]?.[0] as number);
      }
    }

    const results: Array<{
      zone: Record<string, MockFn>;
      scaleCategory: "big" | "small";
    }> = [];

    for (let j = 0; j < boxSizes.length && j < zoneMock.mock.results.length; j++) {
      const scaleCategory: "big" | "small" = boxSizes[j] >= 100 ? "big" : "small";
      results.push({
        zone: zoneMock.mock.results[j].value as Record<string, MockFn>,
        scaleCategory,
      });
    }
    return results;
  }

  /** Simulates dropping all toys on their matching boxes. */
  function completeAllToys(scene: BigSmallScene): void {
    const toys = getToys(scene);
    const slots = getBoxSlots(scene);
    for (const toy of toys) {
      const slot = slots.find((s) => s.scaleCategory === toy.scaleCategory);
      if (!slot) throw new Error("No matching box slot found");
      const onCalls = getMockFn(toy.obj.on).mock.calls;
      const dropCall = onCalls.find((c) => c[0] === "drop");
      const dropCallback = dropCall?.[1] as (pointer: unknown, target: unknown) => void;
      dropCallback(null, slot.zone);
    }
  }

  it("plays win SFX when all 6 toys are sorted", () => {
    vi.mocked(hasSticker).mockReturnValue(false);

    const scene = new BigSmallScene();
    scene.create();
    completeAllToys(scene);

    expect(mockAudio.playWin).toHaveBeenCalled();
  });

  it("awards sticker on first completion only", () => {
    vi.mocked(hasSticker).mockReturnValue(false);

    const scene = new BigSmallScene();
    scene.create();
    completeAllToys(scene);

    expect(earnSticker).toHaveBeenCalledWith("big-small");
    expect(mockAudio.playSticker).toHaveBeenCalled();
  });

  it("does not re-award sticker on replay", () => {
    vi.mocked(hasSticker).mockReturnValue(true);

    const scene = new BigSmallScene();
    scene.create();
    completeAllToys(scene);

    expect(earnSticker).not.toHaveBeenCalled();
    expect(mockAudio.playSticker).not.toHaveBeenCalled();
  });

  it("auto-returns to Hub after 3s delay", () => {
    vi.mocked(hasSticker).mockReturnValue(false);

    const scene = new BigSmallScene();
    scene.create();
    completeAllToys(scene);

    const delayedCallMock = getMockFn(scene.time.delayedCall);
    const autoReturnCall = delayedCallMock.mock.calls.find((call) => call[0] === 3000);
    expect(autoReturnCall).toBeDefined();

    const callback = autoReturnCall?.[1] as () => void;
    callback();
    completeFadeOuts(scene);

    expect(getMockFn(scene.scene.start)).toHaveBeenCalledWith("Hub", {
      justEarned: "big-small",
    });
  });
});

describe("BigSmallScene spoken instruction", () => {
  beforeEach(() => {
    localStorage.clear();
    for (const fn of Object.values(mockSpeech)) {
      fn.mockClear();
    }
  });

  it("shows and speaks the rule when the round starts", () => {
    const scene = new BigSmallScene();
    scene.create();

    const textMock = getMockFn((scene as unknown as { add: Record<string, unknown> }).add.text);
    const call = textMock.mock.calls.find((c) => c[2] === "Put the big toys in the big box.");
    expect(call).toBeDefined();
    expect(mockSpeech.speakSentence).toHaveBeenCalledWith("Put the big toys in the big box.", true);
  });
});
