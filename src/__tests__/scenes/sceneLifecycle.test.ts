import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MockFn } from "../helpers/phaserMock";
import {
  anyObjectOffCalled,
  completeHubEntrances,
  getEmptySlots,
  getMockFn,
  getStickerImages,
  getTextObject,
  mockSettingsPanel,
  mockSettingsPanelDestroy,
  restoreStorageSpies,
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

import { generatePathPoints } from "../../game/animalTraceLogic";
import { AnimalTraceScene } from "../../scenes/AnimalTraceScene";
import { BigSmallScene } from "../../scenes/BigSmallScene";
import { HubScene } from "../../scenes/HubScene";
import { MusicalMemoryScene } from "../../scenes/MusicalMemoryScene";
import { PopFreezeScene } from "../../scenes/PopFreezeScene";
import { ShadowMatchScene } from "../../scenes/ShadowMatchScene";
import { ShapeSorterScene } from "../../scenes/ShapeSorterScene";
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

import { GAME_SCENES } from "../helpers/gameScenes";

describe("game mascot companion", () => {
  /** Asserts the mascot sits in the bottom-right corner, small, behind gameplay. */
  function expectCornerMascot(scene: unknown): void {
    const imageMock = getMockFn((scene as { add: Record<string, unknown> }).add.image);
    const callIndex = imageMock.mock.calls.findIndex((call) => call[2] === "mascot_idle");
    if (callIndex < 0) throw new Error("Mascot image not created");
    expect(imageMock.mock.calls[callIndex][0] as number).toBeGreaterThan(874);
    expect(imageMock.mock.calls[callIndex][1] as number).toBeGreaterThan(618);
    const mascot = imageMock.mock.results[callIndex].value as Record<string, MockFn>;
    expect(getMockFn(mascot.setScale).mock.calls[0]?.[0] as number).toBeLessThan(0.5);
    expect(getMockFn(mascot.setDepth).mock.calls[0]?.[0] as number).toBeLessThan(0);
    expect(getMockFn(mascot.setInteractive)).not.toHaveBeenCalled();
  }

  /** Returns the mascot image game object created by a scene (throws if missing). */
  function getMascot(scene: unknown): Record<string, MockFn> {
    const imageMock = getMockFn((scene as { add: Record<string, unknown> }).add.image);
    for (let i = 0; i < imageMock.mock.calls.length; i++) {
      if (imageMock.mock.calls[i][2] === "mascot_idle") {
        return imageMock.mock.results[i].value as Record<string, MockFn>;
      }
    }
    throw new Error("Mascot image not created");
  }

  /** Returns all scale-yoyo tweens targeting the mascot (cheer bounces). */
  function findMascotScaleTweens(
    scene: unknown,
    mascot: Record<string, MockFn>,
  ): Array<Record<string, unknown>> {
    return getMockFn((scene as { tweens: Record<string, unknown> }).tweens.add)
      .mock.calls.map((call) => call[0] as Record<string, unknown>)
      .filter(
        (config) =>
          config.targets === mascot && typeof config.scale === "number" && config.yoyo === true,
      );
  }

  /** Returns all angle tweens targeting the mascot (entry curious tilt, then nods). */
  function findMascotAngleTweens(
    scene: unknown,
    mascot: Record<string, MockFn>,
  ): Array<Record<string, unknown>> {
    return getMockFn((scene as { tweens: Record<string, unknown> }).tweens.add)
      .mock.calls.map((call) => call[0] as Record<string, unknown>)
      .filter(
        (config) =>
          config.targets === mascot && typeof config.angle === "object" && config.angle !== null,
      );
  }

  /** Returns draggable images (key prefix) with their type suffixes. */
  function getDraggables(
    scene: unknown,
    keyPrefix: string,
  ): Array<{ obj: Record<string, MockFn>; type: string }> {
    const imageMock = getMockFn((scene as { add: Record<string, unknown> }).add.image);
    const results: Array<{ obj: Record<string, MockFn>; type: string }> = [];
    for (let i = 0; i < imageMock.mock.calls.length; i++) {
      const key = imageMock.mock.calls[i][2] as string;
      if (key.startsWith(keyPrefix) && !key.startsWith("sm_shadow_") && key !== "toy_box") {
        results.push({
          obj: imageMock.mock.results[i].value as Record<string, MockFn>,
          type: key.replace(keyPrefix, ""),
        });
      }
    }
    return results;
  }

  /** Returns drop zone objects (slot prefix) with their type suffixes. */
  function getDragSlots(
    scene: unknown,
    slotPrefix: string,
  ): Array<{ zone: Record<string, MockFn>; type: string }> {
    const imageMock = getMockFn((scene as { add: Record<string, unknown> }).add.image);
    const zoneMock = getMockFn((scene as { add: Record<string, unknown> }).add.zone);
    const slotTypes: string[] = [];
    for (let i = 0; i < imageMock.mock.calls.length; i++) {
      const key = imageMock.mock.calls[i][2] as string;
      if (key.startsWith(slotPrefix)) {
        slotTypes.push(key.replace(slotPrefix, ""));
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

  /** Simulates dropping an object on a zone. */
  function dropObject(obj: Record<string, MockFn>, zone: Record<string, MockFn>): void {
    const dropCallback = getMockFn(obj.on).mock.calls.find((c) => c[0] === "drop")?.[1] as (
      pointer: unknown,
      target: unknown,
    ) => void;
    dropCallback(null, zone);
  }

  /** Simulates releasing a drag (dragend). */
  function dragEnd(obj: Record<string, MockFn>): void {
    const dragendCallback = getMockFn(obj.on).mock.calls.find((c) => c[0] === "dragend")?.[1] as
      | (() => void)
      | undefined;
    dragendCallback?.();
  }

  /** Returns toys with their scale category (big >= 100px display size). */
  function getToys(
    scene: unknown,
  ): Array<{ obj: Record<string, MockFn>; scaleCategory: "big" | "small" }> {
    const imageMock = getMockFn((scene as { add: Record<string, unknown> }).add.image);
    const results: Array<{ obj: Record<string, MockFn>; scaleCategory: "big" | "small" }> = [];
    for (let i = 0; i < imageMock.mock.calls.length; i++) {
      const key = imageMock.mock.calls[i][2] as string;
      if (key.startsWith("toy_") && key !== "toy_box") {
        const obj = imageMock.mock.results[i].value as Record<string, MockFn>;
        const size = getMockFn(obj.setDisplaySize).mock.calls[0]?.[0] as number;
        results.push({ obj, scaleCategory: size >= 100 ? "big" : "small" });
      }
    }
    return results;
  }

  /** Returns box drop zones with their scale category. */
  function getBoxes(
    scene: unknown,
  ): Array<{ zone: Record<string, MockFn>; scaleCategory: "big" | "small" }> {
    const imageMock = getMockFn((scene as { add: Record<string, unknown> }).add.image);
    const zoneMock = getMockFn((scene as { add: Record<string, unknown> }).add.zone);
    const boxSizes: number[] = [];
    for (let i = 0; i < imageMock.mock.calls.length; i++) {
      if (imageMock.mock.calls[i][2] === "toy_box") {
        const obj = imageMock.mock.results[i].value as Record<string, MockFn>;
        boxSizes.push(getMockFn(obj.setDisplaySize).mock.calls[0]?.[0] as number);
      }
    }
    const results: Array<{ zone: Record<string, MockFn>; scaleCategory: "big" | "small" }> = [];
    for (let j = 0; j < boxSizes.length && j < zoneMock.mock.results.length; j++) {
      results.push({
        zone: zoneMock.mock.results[j].value as Record<string, MockFn>,
        scaleCategory: boxSizes[j] >= 100 ? "big" : "small",
      });
    }
    return results;
  }

  const ANIMAL_X = 200;
  const FOOD_X = 824;
  const SPRITE_Y = 384;
  const PATH_POINTS = 6;

  /** Returns the input callback registered for an event name. */
  function getInputCallback(scene: unknown, eventName: string): (...args: unknown[]) => void {
    const inputOnMock = getMockFn((scene as { input: Record<string, unknown> }).input.on);
    const call = inputOnMock.mock.calls.find((c) => c[0] === eventName);
    if (!call || typeof call[1] !== "function") {
      throw new Error(`Input callback for "${eventName}" not found`);
    }
    return call[1] as (...args: unknown[]) => void;
  }

  /** Simulates tracing a single AnimalTrace path. */
  function completePath(scene: unknown): void {
    const pathPoints = generatePathPoints(ANIMAL_X, SPRITE_Y, FOOD_X, SPRITE_Y, PATH_POINTS);
    const pointerdown = getInputCallback(scene, "pointerdown");
    const pointermove = getInputCallback(scene, "pointermove");
    pointerdown({ x: pathPoints[0].x, y: pathPoints[0].y });
    for (let i = 1; i < pathPoints.length; i++) {
      pointermove({ x: pathPoints[i].x, y: pathPoints[i].y });
    }
  }

  /** Simulates tracing all 3 AnimalTrace paths with between-pair advances. */
  function completeAllPaths(scene: unknown): void {
    for (let pair = 0; pair < 3; pair++) {
      completePath(scene);
      if (pair < 2) {
        const delayedCallMock = getMockFn(
          (scene as { time: Record<string, unknown> }).time.delayedCall,
        );
        const advanceCalls = delayedCallMock.mock.calls.filter((call) => call[0] === 1000);
        const latest = advanceCalls[advanceCalls.length - 1];
        if (latest && typeof latest[1] === "function") {
          (latest[1] as () => void)();
        }
      }
    }
  }

  /** Returns PopFreeze bubble physics images. */
  function getBubbles(scene: unknown): Array<Record<string, MockFn>> {
    const physics = (scene as { physics: { add: Record<string, unknown> } }).physics.add;
    return getMockFn(physics.image).mock.results.map((r) => r.value as Record<string, MockFn>);
  }

  /** Simulates a tap on a bubble. */
  function tapBubble(bubble: Record<string, MockFn>): void {
    const pointerdownCall = getMockFn(bubble.on).mock.calls.find((c) => c[0] === "pointerdown");
    if (pointerdownCall && typeof pointerdownCall[1] === "function") {
      (pointerdownCall[1] as () => void)();
    }
  }

  /** Simulates popping 6 poppable bubbles to complete the PopFreeze round. */
  function completePopRound(scene: unknown): void {
    let bubbles = getBubbles(scene);
    tapBubble(bubbles[1]);
    tapBubble(bubbles[2]);
    tapBubble(bubbles[3]);
    tapBubble(bubbles[4]);
    bubbles = getBubbles(scene);
    tapBubble(bubbles[5]);
    tapBubble(bubbles[6]);
  }

  /** Returns MusicalMemory frog images in index order. */
  function getFrogs(scene: unknown): Array<Record<string, MockFn>> {
    const imageMock = getMockFn((scene as { add: Record<string, unknown> }).add.image);
    const frogKeys = ["frog_green", "frog_blue", "frog_red"];
    const frogs: Array<Record<string, MockFn>> = [];
    for (let i = 0; i < imageMock.mock.calls.length; i++) {
      const key = imageMock.mock.calls[i][2] as string;
      const frogIndex = frogKeys.indexOf(key);
      if (frogIndex >= 0) {
        frogs[frogIndex] = imageMock.mock.results[i].value as Record<string, MockFn>;
      }
    }
    return frogs;
  }

  /** Simulates a tap on a frog. */
  function tapFrog(frogs: Array<Record<string, MockFn>>, frogIndex: number): void {
    const frog = frogs[frogIndex];
    if (!frog) throw new Error(`Frog ${frogIndex} not found`);
    const pointerdownCall = getMockFn(frog.on).mock.calls.find((c) => c[0] === "pointerdown");
    if (pointerdownCall && typeof pointerdownCall[1] === "function") {
      (pointerdownCall[1] as () => void)();
    }
  }

  /** Fires delayedCall callbacks added at or after startIndex, sorted by delay. */
  function fireDelayedCallsFrom(scene: unknown, startIndex: number): void {
    const delayedCallMock = getMockFn(
      (scene as { time: Record<string, unknown> }).time.delayedCall,
    );
    const calls = delayedCallMock.mock.calls
      .slice(startIndex)
      .sort((a, b) => (a[0] as number) - (b[0] as number));
    for (const call of calls) {
      if (typeof call[1] === "function") {
        (call[1] as () => void)();
      }
    }
  }

  /** Completes one MusicalMemory round (playback, then the actual note taps). */
  function completeMemoryRound(
    scene: unknown,
    frogs: Array<Record<string, MockFn>>,
    firedUpTo: number,
    sequenceLength: number,
  ): number {
    fireDelayedCallsFrom(scene, firedUpTo);
    const newFiredUpTo = getMockFn((scene as { time: Record<string, unknown> }).time.delayedCall)
      .mock.calls.length;
    const sequence = (scene as { sequence: number[] }).sequence;
    for (let i = 0; i < sequenceLength; i++) {
      tapFrog(frogs, sequence[i]);
    }
    return newFiredUpTo;
  }

  /** Completes all 5 MusicalMemory rounds (lengths 2→6). */
  function completeAllMemoryRounds(scene: unknown, frogs: Array<Record<string, MockFn>>): void {
    let firedUpTo = 0;
    for (let len = 2; len <= 6; len++) {
      firedUpTo = completeMemoryRound(scene, frogs, firedUpTo, len);
    }
  }

  interface MascotGameCase {
    name: string;
    build: () => { create: () => void };
    sim: {
      seedRandom?: boolean;
      correct: (scene: unknown) => void;
      incorrect?: (scene: unknown) => void;
      win: (scene: unknown) => void;
    };
  }

  const GAME_MASCOT_CASES: MascotGameCase[] = [
    {
      name: "ShapeSorterScene",
      build: () => new ShapeSorterScene(),
      sim: {
        correct: (scene) => {
          const shapes = getDraggables(scene, "shape_");
          const slots = getDragSlots(scene, "cutout_");
          const shape = shapes[0];
          const slot = slots.find((s) => s.type === shape.type);
          if (!slot) throw new Error("No matching slot found");
          dropObject(shape.obj, slot.zone);
        },
        incorrect: (scene) => {
          const shapes = getDraggables(scene, "shape_");
          const slots = getDragSlots(scene, "cutout_");
          const shape = shapes[0];
          const wrongSlot = slots.find((s) => s.type !== shape.type);
          if (!wrongSlot) throw new Error("No mismatching slot found");
          dropObject(shape.obj, wrongSlot.zone);
          dragEnd(shape.obj);
        },
        win: (scene) => {
          for (let round = 0; round < 3; round++) {
            const shapes = getDraggables(scene, "shape_").slice(round * 3, round * 3 + 3);
            const slots = getDragSlots(scene, "cutout_").slice(round * 3, round * 3 + 3);
            for (const shape of shapes) {
              const slot = slots.find((s) => s.type === shape.type);
              if (!slot) throw new Error("No matching slot found");
              dropObject(shape.obj, slot.zone);
            }
            if (round < 2) {
              // Fire the newest round-advance delayed call (NEXT_ROUND_DELAY = 1200ms).
              const delayedCallMock = getMockFn(
                (scene as { time: { delayedCall: unknown } }).time.delayedCall,
              );
              const advanceCalls = delayedCallMock.mock.calls.filter((call) => call[0] === 1200);
              const advanceCall = advanceCalls[advanceCalls.length - 1];
              const advanceCallback = advanceCall?.[1] as () => void;
              advanceCallback();
            }
          }
        },
      },
    },
    {
      name: "AnimalTraceScene",
      build: () => new AnimalTraceScene(),
      sim: {
        seedRandom: true,
        correct: (scene) => completePath(scene),
        // No-fail game: there is no incorrect reaction path.
        win: (scene) => completeAllPaths(scene),
      },
    },
    {
      name: "PopFreezeScene",
      build: () => new PopFreezeScene(),
      sim: {
        seedRandom: true,
        correct: (scene) => {
          const bubbles = getBubbles(scene);
          tapBubble(bubbles[1]);
        },
        incorrect: (scene) => {
          const bubbles = getBubbles(scene);
          tapBubble(bubbles[0]);
        },
        win: (scene) => completePopRound(scene),
      },
    },
    {
      name: "ShadowMatchScene",
      build: () => new ShadowMatchScene(),
      sim: {
        correct: (scene) => {
          const objects = getDraggables(scene, "sm_");
          const slots = getDragSlots(scene, "sm_shadow_");
          const object = objects[0];
          const slot = slots.find((s) => s.type === object.type);
          if (!slot) throw new Error("No matching shadow slot found");
          dropObject(object.obj, slot.zone);
        },
        incorrect: (scene) => {
          const objects = getDraggables(scene, "sm_");
          const slots = getDragSlots(scene, "sm_shadow_");
          const object = objects[0];
          const wrongSlot = slots.find((s) => s.type !== object.type);
          if (!wrongSlot) throw new Error("No mismatching shadow slot found");
          dropObject(object.obj, wrongSlot.zone);
          dragEnd(object.obj);
        },
        win: (scene) => {
          const objects = getDraggables(scene, "sm_");
          const slots = getDragSlots(scene, "sm_shadow_");
          for (const object of objects) {
            const slot = slots.find((s) => s.type === object.type);
            if (!slot) throw new Error("No matching shadow slot found");
            dropObject(object.obj, slot.zone);
          }
        },
      },
    },
    {
      name: "MusicalMemoryScene",
      build: () => new MusicalMemoryScene(),
      sim: {
        seedRandom: true,
        correct: (scene) => {
          fireDelayedCallsFrom(scene, 0);
          const frogs = getFrogs(scene);
          tapFrog(frogs, 1);
          tapFrog(frogs, 1);
        },
        incorrect: (scene) => {
          fireDelayedCallsFrom(scene, 0);
          const frogs = getFrogs(scene);
          tapFrog(frogs, 0);
        },
        win: (scene) => {
          const frogs = getFrogs(scene);
          completeAllMemoryRounds(scene, frogs);
        },
      },
    },
    {
      name: "BigSmallScene",
      build: () => new BigSmallScene(),
      sim: {
        correct: (scene) => {
          const toys = getToys(scene);
          const boxes = getBoxes(scene);
          const toy = toys[0];
          const box = boxes.find((b) => b.scaleCategory === toy.scaleCategory);
          if (!box) throw new Error("No matching box found");
          dropObject(toy.obj, box.zone);
        },
        incorrect: (scene) => {
          const toys = getToys(scene);
          const boxes = getBoxes(scene);
          const toy = toys[0];
          const wrongBox = boxes.find((b) => b.scaleCategory !== toy.scaleCategory);
          if (!wrongBox) throw new Error("No mismatching box found");
          dropObject(toy.obj, wrongBox.zone);
          dragEnd(toy.obj);
        },
        win: (scene) => {
          const toys = getToys(scene);
          const boxes = getBoxes(scene);
          for (const toy of toys) {
            const box = boxes.find((b) => b.scaleCategory === toy.scaleCategory);
            if (!box) throw new Error("No matching box found");
            dropObject(toy.obj, box.zone);
          }
        },
      },
    },
  ];

  for (const game of GAME_MASCOT_CASES) {
    describe(`mascot reactions in ${game.name}`, () => {
      beforeEach(() => {
        if (game.sim.seedRandom) {
          vi.spyOn(Math, "random").mockReturnValue(0.5);
        }
      });

      afterEach(() => {
        vi.restoreAllMocks();
      });

      it("places a small corner mascot behind gameplay", () => {
        const scene = game.build();
        scene.create();
        expectCornerMascot(scene);
      });

      it("cheers on a correct action", () => {
        const scene = game.build();
        scene.create();
        const mascot = getMascot(scene);
        game.sim.correct(scene);

        expect(getMockFn(mascot.setTexture)).toHaveBeenCalledWith("mascot_celebrate");
        const bounces = findMascotScaleTweens(scene, mascot);
        expect(bounces.some((b) => Math.abs((b.scale as number) - 0.22) < 0.001)).toBe(true);
      });

      if (game.sim.incorrect) {
        it("nods on an incorrect action", () => {
          const scene = game.build();
          scene.create();
          const mascot = getMascot(scene);
          game.sim.incorrect?.(scene);

          const angleTweens = findMascotAngleTweens(scene, mascot);
          // Entry curious() tilts first; the incorrect-action nod comes last.
          const entry = angleTweens[0];
          expect(entry).toBeDefined();
          if (!entry) return;
          expect((entry.angle as { to: number }).to).toBe(10);
          const nod = angleTweens[angleTweens.length - 1];
          expect(nod).toBeDefined();
          if (!nod) return;
          expect((nod.angle as { to: number }).to).toBe(6);
        });
      }

      it("does a big cheer when the round is won", () => {
        const scene = game.build();
        scene.create();
        const mascot = getMascot(scene);
        game.sim.win(scene);

        expect(getMockFn(mascot.setTexture)).toHaveBeenCalledWith("mascot_celebrate");
        const bounces = findMascotScaleTweens(scene, mascot);
        expect(bounces.some((b) => Math.abs((b.scale as number) - 0.24) < 0.001)).toBe(true);
      });

      it("destroys the mascot on scene shutdown", () => {
        const scene = game.build();
        scene.create();
        const mascot = getMascot(scene);
        triggerShutdown(scene);
        expect(getMockFn(mascot.destroy)).toHaveBeenCalled();
      });
    });
  }

  it("does not nod when a ShapeSorter shape is released in mid-air (no zone interaction)", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const scene = new ShapeSorterScene();
    scene.create();

    const mascot = getMascot(scene);
    const draggables = getDraggables(scene, "shape_");
    const tweensBefore = findMascotAngleTweens(scene, mascot).length;
    dragEnd(draggables[0].obj);

    // The entry curious() tilt predates the release; mid-air adds no nod.
    expect(findMascotAngleTweens(scene, mascot)).toHaveLength(tweensBefore);
    vi.restoreAllMocks();
  });
});

describe("scene shutdown cleanup", () => {
  it.each(GAME_SCENES)("destroys ParentLock on shutdown in $name", ({ SceneClass }) => {
    const scene = new SceneClass();
    scene.create();

    expect(anyObjectOffCalled(scene)).toBe(false);

    triggerShutdown(scene);

    expect(anyObjectOffCalled(scene)).toBe(true);
  });

  it("destroys ParentLock on shutdown in HubScene", () => {
    const scene = new HubScene();
    scene.create();

    expect(anyObjectOffCalled(scene)).toBe(false);

    triggerShutdown(scene);

    expect(anyObjectOffCalled(scene)).toBe(true);
  });

  it("destroys an open SettingsPanel on HubScene shutdown", () => {
    const scene = new HubScene();
    scene.create();

    triggerAllPointerdowns(scene);
    const holdCallback = getMockFn(scene.time.delayedCall).mock.calls.find(
      (call) => call[0] === 3000,
    )?.[1] as () => void;
    holdCallback();
    triggerShutdown(scene);

    expect(mockSettingsPanelDestroy).toHaveBeenCalled();
  });

  it("clears tracked stickers on shutdown so a shelf re-render never touches previous visits", () => {
    earnSticker("shape-sorter");
    // Other describes stub hasSticker via mockReturnValue (persists past
    // clearAllMocks), so restore the real storage-backed behavior for this
    // test deterministically (earnSticker -> true, resetProgress -> false).
    restoreStorageSpies();

    const scene = new HubScene();
    scene.create();
    completeHubEntrances(scene);
    const firstVisit = getStickerImages(scene);
    expect(firstVisit).toHaveLength(1);
    const firstVisitSlots = getEmptySlots(scene);
    expect(firstVisitSlots).toHaveLength(21);

    // Leave the Hub (shutdown clears the tracked shelf) and return: create()
    // re-runs on every visit via scene.start.
    triggerShutdown(scene);
    scene.create();
    completeHubEntrances(scene);
    expect(getStickerImages(scene)).toHaveLength(2);

    // Isolate first-visit images: a re-render after a progress reset must not
    // destroy (or re-destroy) them — only the live second-visit shelf.
    for (const { obj } of firstVisit) {
      getMockFn(obj.destroy).mockClear();
    }
    triggerAllPointerdowns(scene);
    const holdCalls = getMockFn(scene.time.delayedCall).mock.calls.filter(
      (call) => call[0] === 3000,
    );
    expect(holdCalls.length).toBeGreaterThan(0);
    // The last hold belongs to the live (second-visit) settings button.
    (holdCalls[holdCalls.length - 1][1] as () => void)();
    const settingsArgs = mockSettingsPanel.mock.calls.at(-1);
    const rerender = settingsArgs?.[2] as () => void;
    expect(rerender).toBeDefined();
    resetProgress();
    rerender();

    for (const { obj } of firstVisit) {
      expect(getMockFn(obj.destroy)).not.toHaveBeenCalled();
    }
    // The reset cleared everything: the re-rendered shelf holds 22 fresh
    // empty slots (the stale first-visit objects still exist, untouched).
    const fresh = getEmptySlots(scene).filter(
      (obj) => getMockFn(obj.destroy).mock.calls.length === 0,
    );
    expect(fresh).toHaveLength(22);
  });
});

describe("cross-scene touch regression", () => {
  /** Fires the first registered listener for an event on a game object. */
  function fireEvent(obj: Record<string, MockFn>, event: string): void {
    const callback = getMockFn(obj.on).mock.calls.find((call) => call[0] === event)?.[1] as
      | (() => void)
      | undefined;
    if (!callback) throw new Error(`no '${event}' listener registered on object`);
    callback();
  }

  /** Returns the ParentLock 3000ms hold callback scheduled on the scene. */
  function holdCallback(scene: unknown): () => void {
    const call = getMockFn(
      (scene as { time: Record<string, unknown> }).time.delayedCall,
    ).mock.calls.find((entry) => entry[0] === 3000);
    if (!call) throw new Error("ParentLock 3000ms hold not found");
    return call[1] as () => void;
  }

  it.each(GAME_SCENES)(
    "never navigates when the Back hold is released early in $name",
    ({ SceneClass }) => {
      const scene = new SceneClass();
      scene.create();

      const backButton = getTextObject(scene, "Back");
      if (!backButton) throw new Error("Back button not found");

      fireEvent(backButton, "pointerdown");
      fireEvent(backButton, "pointerup");

      // A stale hold callback after early release must never navigate.
      holdCallback(scene)();
      expect(getMockFn(scene.scene.start)).not.toHaveBeenCalledWith("Hub");
    },
  );

  it.each(GAME_SCENES)(
    "never navigates when the Back hold is cancelled in $name",
    ({ SceneClass }) => {
      const scene = new SceneClass();
      scene.create();

      const backButton = getTextObject(scene, "Back");
      if (!backButton) throw new Error("Back button not found");

      fireEvent(backButton, "pointerdown");
      fireEvent(backButton, "pointercancel");

      holdCallback(scene)();
      expect(getMockFn(scene.scene.start)).not.toHaveBeenCalledWith("Hub");
    },
  );

  it("never opens the panel when the Settings hold is released early", () => {
    const scene = new HubScene();
    scene.create();

    const settingsButton = getTextObject(scene, "Settings");
    if (!settingsButton) throw new Error("Settings button not found");

    fireEvent(settingsButton, "pointerdown");
    fireEvent(settingsButton, "pointerup");

    holdCallback(scene)();
    expect(mockSettingsPanel).not.toHaveBeenCalled();
  });

  it("opens the panel exactly once when the Settings hold completes despite duplicate pointerdown", () => {
    const scene = new HubScene();
    scene.create();

    const settingsButton = getTextObject(scene, "Settings");
    if (!settingsButton) throw new Error("Settings button not found");

    fireEvent(settingsButton, "pointerdown");
    fireEvent(settingsButton, "pointerdown");

    const holdCalls = getMockFn(scene.time.delayedCall).mock.calls.filter(
      (call) => call[0] === 3000,
    );
    expect(holdCalls.length).toBe(1);

    (holdCalls[0][1] as () => void)();
    (holdCalls[0][1] as () => void)();
    expect(mockSettingsPanel).toHaveBeenCalledTimes(1);
  });

  it.each(GAME_SCENES)(
    "cleans up the hold progress ring on shutdown in $name",
    ({ SceneClass }) => {
      const scene = new SceneClass();
      scene.create();

      const backButton = getTextObject(scene, "Back");
      if (!backButton) throw new Error("Back button not found");

      fireEvent(backButton, "pointerdown");

      const graphicsMock = getMockFn(scene.add.graphics);
      const ring = graphicsMock.mock.results.at(-1)?.value as Record<string, MockFn>;
      expect(ring).toBeDefined();

      triggerShutdown(scene);

      expect(getMockFn(ring.destroy)).toHaveBeenCalled();
    },
  );

  it("cleans up the Settings hold progress ring on Hub shutdown", () => {
    const scene = new HubScene();
    scene.create();

    const settingsButton = getTextObject(scene, "Settings");
    if (!settingsButton) throw new Error("Settings button not found");

    fireEvent(settingsButton, "pointerdown");

    const graphicsMock = getMockFn(scene.add.graphics);
    const ring = graphicsMock.mock.results.at(-1)?.value as Record<string, MockFn>;
    expect(ring).toBeDefined();

    triggerShutdown(scene);

    expect(getMockFn(ring.destroy)).toHaveBeenCalled();
  });
});
