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

import { ShadowMatchScene } from "../../scenes/ShadowMatchScene";
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

describe("ShadowMatchScene round initialization", () => {
  it("creates 6 shadow silhouette images", () => {
    const scene = new ShadowMatchScene();
    scene.create();

    const imageCalls = getMockFn(scene.add.image).mock.calls;
    const shadowKeys = imageCalls
      .map((call) => call[2] as string)
      .filter((key) => key.startsWith("sm_shadow_"));
    expect(shadowKeys).toHaveLength(6);
  });

  it("creates 6 object images", () => {
    const scene = new ShadowMatchScene();
    scene.create();

    const imageCalls = getMockFn(scene.add.image).mock.calls;
    const objectKeys = imageCalls
      .map((call) => call[2] as string)
      .filter((key) => key.startsWith("sm_") && !key.startsWith("sm_shadow_"));
    expect(objectKeys).toHaveLength(6);
  });

  it("makes object images interactive and draggable", () => {
    const scene = new ShadowMatchScene();
    scene.create();

    const imageResults = getMockFn(scene.add.image).mock.results;
    const imageCalls = getMockFn(scene.add.image).mock.calls;
    const objectResults = imageResults.filter((_result, index) => {
      const key = imageCalls[index][2] as string;
      return key.startsWith("sm_") && !key.startsWith("sm_shadow_");
    });

    expect(objectResults).toHaveLength(6);
    for (const result of objectResults) {
      const obj = result.value as Record<string, MockFn>;
      expect(getMockFn(obj.setInteractive)).toHaveBeenCalled();
    }
    expect(getMockFn(scene.input.setDraggable)).toHaveBeenCalledTimes(6);
  });
});

describe("ShadowMatchScene drag and drop", () => {
  /** Returns object image objects with their types and origin positions. */
  function getObjects(scene: unknown): Array<{
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
      if (key.startsWith("sm_") && !key.startsWith("sm_shadow_")) {
        results.push({
          obj: imageMock.mock.results[i].value as Record<string, MockFn>,
          type: key.replace("sm_", ""),
          originX: imageMock.mock.calls[i][0] as number,
          originY: imageMock.mock.calls[i][1] as number,
        });
      }
    }
    return results;
  }

  /** Returns shadow slot zone objects with their types and positions. */
  function getShadowSlots(scene: unknown): Array<{
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
      if (key.startsWith("sm_shadow_")) {
        slotTypes.push(key.replace("sm_shadow_", ""));
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

  it("correct drop snaps object to shadow position, marks non-interactive, and shows bounded feedback", () => {
    const scene = new ShadowMatchScene();
    scene.create();

    const objects = getObjects(scene);
    const slots = getShadowSlots(scene);
    const initialGraphicsCount = getMockFn(scene.add.graphics).mock.results.length;
    const object = objects[0];
    const slot = slots.find((s) => s.type === object.type);
    if (!slot) throw new Error("No matching shadow slot found");

    const onCalls = getMockFn(object.obj.on).mock.calls;
    const dropCall = onCalls.find((c) => c[0] === "drop");
    const dropCallback = dropCall?.[1] as (pointer: unknown, target: unknown) => void;
    dropCallback(null, slot.zone);

    // Correct drop animates to shadow position via a 200ms Cubic.out snap tween.
    const snapTween = getMockFn(scene.tweens.add).mock.calls.find(
      (call) =>
        call[0]?.targets === object.obj &&
        call[0]?.x === slot.x &&
        call[0]?.y === slot.y &&
        call[0]?.ease === "Cubic.out",
    );
    expect(snapTween).toBeDefined();
    if (!snapTween) return;
    expect((snapTween[0] as { duration: number }).duration).toBe(200);
    expect(getMockFn(object.obj.setPosition)).not.toHaveBeenCalledWith(slot.x, slot.y);
    expect(getMockFn(object.obj.disableInteractive)).toHaveBeenCalled();
    expect(mockAudio.playCorrect).toHaveBeenCalled();
    assertBoundedSuccessEffect(scene, initialGraphicsCount);
  });

  it("incorrect drop bounces object back to origin with wobble (no penalty)", () => {
    const scene = new ShadowMatchScene();
    scene.create();

    const objects = getObjects(scene);
    const slots = getShadowSlots(scene);
    const object = objects[0];
    const wrongSlot = slots.find((s) => s.type !== object.type);
    if (!wrongSlot) throw new Error("No mismatching slot found");

    const onCalls = getMockFn(object.obj.on).mock.calls;

    // Simulate drop on wrong zone (no snap, no SFX)
    const dropCall = onCalls.find((c) => c[0] === "drop");
    const dropCallback = dropCall?.[1] as (pointer: unknown, target: unknown) => void;
    dropCallback(null, wrongSlot.zone);

    // Simulate dragend (triggers bounce-back)
    const dragendCall = onCalls.find((c) => c[0] === "dragend");
    const dragendCallback = dragendCall?.[1] as () => void;
    dragendCallback();

    const tweenCalls = getMockFn(scene.tweens.add).mock.calls;
    const objTween = tweenCalls.find((c) => c[0]?.targets === object.obj);
    expect(objTween).toBeDefined();
    if (!objTween) throw new Error("object bounce-back tween not found");
    expect(objTween[0].x).toBe(object.originX);
    expect(objTween[0].y).toBe(object.originY);

    expect(mockAudio.playIncorrect).toHaveBeenCalled();
    expect(getMockFn(scene.scene.start)).not.toHaveBeenCalled();
  });

  it("matched objects lock in place and do not bounce on dragend", () => {
    const scene = new ShadowMatchScene();
    scene.create();

    const objects = getObjects(scene);
    const slots = getShadowSlots(scene);
    const object = objects[0];
    const slot = slots.find((s) => s.type === object.type);
    if (!slot) throw new Error("No matching slot found");

    const onCalls = getMockFn(object.obj.on).mock.calls;

    // Correct drop
    const dropCall = onCalls.find((c) => c[0] === "drop");
    const dropCallback = dropCall?.[1] as (pointer: unknown, target: unknown) => void;
    dropCallback(null, slot.zone);

    expect(getMockFn(object.obj.disableInteractive)).toHaveBeenCalled();

    // Dragend after match — should NOT bounce
    const dragendCall = onCalls.find((c) => c[0] === "dragend");
    const dragendCallback = dragendCall?.[1] as () => void;
    dragendCallback();

    const tweenCalls = getMockFn(scene.tweens.add).mock.calls;
    const bounceTween = tweenCalls.find(
      (c) =>
        c[0]?.targets === object.obj && c[0]?.x === object.originX && c[0]?.y === object.originY,
    );
    expect(bounceTween).toBeUndefined();
  });

  it("creates touch targets meeting 64x64px minimum", () => {
    const scene = new ShadowMatchScene();
    scene.create();

    const objects = getObjects(scene);
    expect(objects.length).toBe(6);

    for (const object of objects) {
      const setDisplaySizeCalls = getMockFn(object.obj.setDisplaySize).mock.calls;
      for (const call of setDisplaySizeCalls) {
        expect(call[0]).toBeGreaterThanOrEqual(64);
        expect(call[1]).toBeGreaterThanOrEqual(64);
      }
    }
  });

  it("drop on non-slot target is a no-op (no snap, no SFX, no particles)", () => {
    const scene = new ShadowMatchScene();
    scene.create();

    const objects = getObjects(scene);
    const object = objects[0];

    const onCalls = getMockFn(object.obj.on).mock.calls;
    const dropCall = onCalls.find((c) => c[0] === "drop");
    const dropCallback = dropCall?.[1] as (pointer: unknown, target: unknown) => void;
    dropCallback(null, {});

    expect(getMockFn(object.obj.disableInteractive)).not.toHaveBeenCalled();
    expect(mockAudio.playCorrect).not.toHaveBeenCalled();
    expect(getMockFn(scene.add.particles)).not.toHaveBeenCalled();
  });

  it("dragend without a drop on a zone bounces silently (no incorrect SFX)", () => {
    const scene = new ShadowMatchScene();
    scene.create();

    const objects = getObjects(scene);
    const object = objects[0];

    // Simulate dragend without a preceding drop (object released on empty space)
    const onCalls = getMockFn(object.obj.on).mock.calls;
    const dragendCall = onCalls.find((c) => c[0] === "dragend");
    const dragendCallback = dragendCall?.[1] as () => void;
    dragendCallback();

    // Bounce tween should be created
    const tweenCalls = getMockFn(scene.tweens.add).mock.calls;
    const bounceTween = tweenCalls.find(
      (c) => c[0]?.targets === object.obj && c[0]?.x === object.originX,
    );
    expect(bounceTween).toBeDefined();

    // Incorrect SFX should NOT play (dropped on empty space, not a wrong zone)
    expect(mockAudio.playIncorrect).not.toHaveBeenCalled();
  });

  it("follows the pointer while an object is dragged", () => {
    const scene = new ShadowMatchScene();
    scene.create();

    const object = getObjects(scene)[0];
    const dragCallbacks = getMockFn(object.obj.on)
      .mock.calls.filter((c) => c[0] === "drag")
      .map((c) => c[1] as (pointer: unknown, x: number, y: number) => void);
    expect(dragCallbacks.length).toBeGreaterThan(0);

    for (const callback of dragCallbacks) callback(null, 300, 450);

    expect(getMockFn(object.obj.setPosition)).toHaveBeenCalledWith(300, 450);
  });

  it("lifts and tilts the object on drag start and restores it on drag end", () => {
    const scene = new ShadowMatchScene();
    scene.create();

    const objects = getObjects(scene);
    const object = objects[0];
    const onCalls = getMockFn(object.obj.on).mock.calls;

    const dragstartCallback = onCalls.find((c) => c[0] === "dragstart")?.[1] as () => void;
    expect(dragstartCallback).toBeDefined();
    dragstartCallback();

    const liftTween = getMockFn(scene.tweens.add).mock.calls.find(
      (c) => c[0]?.targets === object.obj && c[0]?.angle === 4,
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
      (c) => c[0]?.targets === object.obj && c[0]?.scaleX === 1 && c[0]?.scaleY === 1,
    );
    expect(restoreTween).toBeDefined();
    expect(restoreTween?.[0]?.angle).toBe(0);
  });

  it("uses a reduced-motion lift (1.05 scale, no tilt) when requested", () => {
    vi.stubGlobal("window", {
      matchMedia: vi.fn(() => ({ matches: true })),
    });

    const scene = new ShadowMatchScene();
    scene.create();

    const objects = getObjects(scene);
    const object = objects[0];
    const dragstartCallback = getMockFn(object.obj.on).mock.calls.find(
      (c) => c[0] === "dragstart",
    )?.[1] as () => void;
    dragstartCallback();

    const liftTween = getMockFn(scene.tweens.add).mock.calls.find(
      (c) => c[0]?.targets === object.obj && c[0]?.scaleX === 1.05,
    );
    expect(liftTween).toBeDefined();
    if (!liftTween) return;
    expect(liftTween[0].angle).toBe(0);
  });

  it("pulses a soft outline on the shadow slot while dragging over it and clears on leave", () => {
    const scene = new ShadowMatchScene();
    scene.create();

    const slots = getShadowSlots(scene);
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

  it("stamps the shadow slot with a scale pulse and fill flash on a correct drop", () => {
    const scene = new ShadowMatchScene();
    scene.create();

    const objects = getObjects(scene);
    const slots = getShadowSlots(scene);
    const object = objects[0];
    const slot = slots.find((s) => s.type === object.type);
    expect(slot).toBeDefined();
    if (!slot) return;

    const imageMock = getMockFn(scene.add.image);
    const shadowImages: Array<Record<string, MockFn>> = [];
    for (let i = 0; i < imageMock.mock.calls.length; i++) {
      if ((imageMock.mock.calls[i][2] as string).startsWith("sm_shadow_")) {
        shadowImages.push(imageMock.mock.results[i].value as Record<string, MockFn>);
      }
    }
    const shadow = shadowImages[slots.indexOf(slot)];
    expect(shadow).toBeDefined();
    if (!shadow) return;

    const initialGraphicsCount = getMockFn(scene.add.graphics).mock.results.length;
    (
      getMockFn(object.obj.on).mock.calls.find((c) => c[0] === "drop")?.[1] as
        | ((pointer: unknown, target: unknown) => void)
        | undefined
    )?.(null, slot.zone);

    const stampTween = getMockFn(scene.tweens.add).mock.calls.find(
      (call) => call[0]?.targets === shadow && call[0]?.scaleX === 1.1 && call[0]?.yoyo === true,
    );
    expect(stampTween).toBeDefined();
    expect(stampTween?.[0]?.duration).toBe(200);

    const flash = getMockFn(scene.add.graphics).mock.results[initialGraphicsCount]?.value as
      | Record<string, MockFn>
      | undefined;
    expect(flash).toBeDefined();
    if (!flash) return;
    expect(getMockFn(flash.fillStyle)).toHaveBeenCalled();
    expect(getMockFn(flash.fillCircle)).toHaveBeenCalled();

    const flashTween = getMockFn(scene.tweens.add).mock.calls.find(
      (call) => call[0]?.targets === flash && call[0]?.alpha === 0,
    );
    expect(flashTween).toBeDefined();
    const onComplete = flashTween?.[0]?.onComplete as (() => void) | undefined;
    expect(onComplete).toBeDefined();
    onComplete?.();
    expect(getMockFn(flash.destroy)).toHaveBeenCalledTimes(1);
  });

  it("dims the matched object after a correct drop", () => {
    const scene = new ShadowMatchScene();
    scene.create();

    const objects = getObjects(scene);
    const slots = getShadowSlots(scene);
    const object = objects[0];
    const slot = slots.find((s) => s.type === object.type);
    expect(slot).toBeDefined();
    if (!slot) return;

    (
      getMockFn(object.obj.on).mock.calls.find((c) => c[0] === "drop")?.[1] as
        | ((pointer: unknown, target: unknown) => void)
        | undefined
    )?.(null, slot.zone);

    const dimTween = getMockFn(scene.tweens.add).mock.calls.find(
      (call) => call[0]?.targets === object.obj && call[0]?.alpha === 0.5,
    );
    expect(dimTween).toBeDefined();
    expect(dimTween?.[0]?.duration).toBe(200);
  });

  it("uses reduced-motion amplitudes for the shadow reveal", () => {
    vi.stubGlobal("window", { matchMedia: vi.fn(() => ({ matches: true })) });

    const scene = new ShadowMatchScene();
    scene.create();

    const objects = getObjects(scene);
    const slots = getShadowSlots(scene);
    const object = objects[0];
    const slot = slots.find((s) => s.type === object.type);
    expect(slot).toBeDefined();
    if (!slot) return;

    const imageMock = getMockFn(scene.add.image);
    const shadowImages: Array<Record<string, MockFn>> = [];
    for (let i = 0; i < imageMock.mock.calls.length; i++) {
      if ((imageMock.mock.calls[i][2] as string).startsWith("sm_shadow_")) {
        shadowImages.push(imageMock.mock.results[i].value as Record<string, MockFn>);
      }
    }
    const shadow = shadowImages[slots.indexOf(slot)];

    (
      getMockFn(object.obj.on).mock.calls.find((c) => c[0] === "drop")?.[1] as
        | ((pointer: unknown, target: unknown) => void)
        | undefined
    )?.(null, slot.zone);

    const stampTween = getMockFn(scene.tweens.add).mock.calls.find(
      (call) => call[0]?.targets === shadow && call[0]?.scaleX === 1.05,
    );
    expect(stampTween?.[0]?.duration).toBe(120);

    const dimTween = getMockFn(scene.tweens.add).mock.calls.find(
      (call) => call[0]?.targets === object.obj && call[0]?.alpha === 0.5,
    );
    expect(dimTween?.[0]?.duration).toBe(120);
  });
});

describe("ShadowMatchScene completion and sticker flow", () => {
  /** Returns object image objects with their types. */
  function getObjects(scene: unknown): Array<{ obj: Record<string, MockFn>; type: string }> {
    const add = (scene as { add: Record<string, unknown> }).add;
    const imageMock = getMockFn(add.image);
    const results: Array<{ obj: Record<string, MockFn>; type: string }> = [];

    for (let i = 0; i < imageMock.mock.calls.length; i++) {
      const key = imageMock.mock.calls[i][2] as string;
      if (key.startsWith("sm_") && !key.startsWith("sm_shadow_")) {
        results.push({
          obj: imageMock.mock.results[i].value as Record<string, MockFn>,
          type: key.replace("sm_", ""),
        });
      }
    }
    return results;
  }

  /** Returns shadow slot zone objects with their types. */
  function getShadowSlots(scene: unknown): Array<{ zone: Record<string, MockFn>; type: string }> {
    const add = (scene as { add: Record<string, unknown> }).add;
    const imageMock = getMockFn(add.image);
    const zoneMock = getMockFn(add.zone);

    const slotTypes: string[] = [];
    for (let i = 0; i < imageMock.mock.calls.length; i++) {
      const key = imageMock.mock.calls[i][2] as string;
      if (key.startsWith("sm_shadow_")) {
        slotTypes.push(key.replace("sm_shadow_", ""));
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

  /** Simulates dropping all objects on their matching shadow slots. */
  function completeAllObjects(scene: ShadowMatchScene): void {
    const objects = getObjects(scene);
    const slots = getShadowSlots(scene);
    for (const object of objects) {
      const slot = slots.find((s) => s.type === object.type);
      if (!slot) throw new Error("No matching shadow slot found");
      const onCalls = getMockFn(object.obj.on).mock.calls;
      const dropCall = onCalls.find((c) => c[0] === "drop");
      const dropCallback = dropCall?.[1] as (pointer: unknown, target: unknown) => void;
      dropCallback(null, slot.zone);
    }
  }

  it("plays win SFX when all 6 objects are matched", () => {
    vi.mocked(hasSticker).mockReturnValue(false);

    const scene = new ShadowMatchScene();
    scene.create();
    completeAllObjects(scene);

    expect(mockAudio.playWin).toHaveBeenCalled();
  });

  it("awards sticker on first completion only", () => {
    vi.mocked(hasSticker).mockReturnValue(false);

    const scene = new ShadowMatchScene();
    scene.create();
    completeAllObjects(scene);

    expect(earnSticker).toHaveBeenCalledWith("shadow-match");
    expect(mockAudio.playSticker).toHaveBeenCalled();
  });

  it("does not re-award sticker on replay", () => {
    vi.mocked(hasSticker).mockReturnValue(true);

    const scene = new ShadowMatchScene();
    scene.create();
    completeAllObjects(scene);

    expect(earnSticker).not.toHaveBeenCalled();
    expect(mockAudio.playSticker).not.toHaveBeenCalled();
  });

  it("auto-returns to Hub after 3s delay", () => {
    vi.mocked(hasSticker).mockReturnValue(false);

    const scene = new ShadowMatchScene();
    scene.create();
    completeAllObjects(scene);

    const delayedCallMock = getMockFn(scene.time.delayedCall);
    const autoReturnCall = delayedCallMock.mock.calls.find((call) => call[0] === 3000);
    expect(autoReturnCall).toBeDefined();

    const callback = autoReturnCall?.[1] as () => void;
    callback();
    completeFadeOuts(scene);

    expect(getMockFn(scene.scene.start)).toHaveBeenCalledWith("Hub", {
      justEarned: "shadow-match",
    });
  });
});

describe("ShadowMatchScene spoken instruction", () => {
  beforeEach(() => {
    localStorage.clear();
    for (const fn of Object.values(mockSpeech)) {
      fn.mockClear();
    }
  });

  it("shows and speaks the rule when the round starts", () => {
    const scene = new ShadowMatchScene();
    scene.create();

    const textMock = getMockFn((scene as unknown as { add: Record<string, unknown> }).add.text);
    const call = textMock.mock.calls.find((c) => c[2] === "Drag each picture onto its shadow.");
    expect(call).toBeDefined();
    expect(mockSpeech.speakSentence).toHaveBeenCalledWith(
      "Drag each picture onto its shadow.",
      true,
    );
  });
});
