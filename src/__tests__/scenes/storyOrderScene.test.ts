import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { stubMatchMedia } from "../helpers/matchMediaStub";

type MockFn = ReturnType<typeof vi.fn>;

vi.mock("phaser", async () => {
  const { createPhaserModuleMock } = await import("../helpers/phaserMock");
  return createPhaserModuleMock().module;
});

const { mockAudio } = vi.hoisted(() => ({
  mockAudio: {
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
  },
}));

vi.mock("../../audio/AudioManager", () => ({
  AudioManager: {
    getInstance: () => mockAudio,
  },
}));

const { mockParentLockInstances, MockParentLock } = vi.hoisted(() => {
  const mockParentLockInstances: Array<Record<string, unknown>> = [];
  class MockParentLock {
    constructor(...args: unknown[]) {
      mockParentLockInstances.push(args[0] as Record<string, unknown>);
    }

    destroy(): void {}
  }
  return { mockParentLockInstances, MockParentLock };
});

vi.mock("../../components/ParentLock", () => ({
  ParentLock: MockParentLock,
}));

const { mockSpeech } = vi.hoisted(() => ({
  mockSpeech: {
    speakNumber: vi.fn(() => true),
    speakSentence: vi.fn(() => true),
    speakWord: vi.fn(() => true),
    isSpeechSupported: vi.fn(() => true),
    onSpeechLifecycle: vi.fn(() => vi.fn()),
  },
}));

vi.mock("../../utils/speech", () => mockSpeech);

const { mockCompletionEffect } = vi.hoisted(() => ({
  mockCompletionEffect: {
    createCompletionSplash: vi.fn(),
    createWinCelebration: vi.fn(),
  },
}));

vi.mock("../../utils/completionEffect", () => mockCompletionEffect);

import { StoryOrderScene } from "../../scenes/StoryOrderScene";
import { tapHits } from "../helpers/hitTest";

const RULE = "Put the story in order, first to last.";

function getMockFn(fn: unknown): MockFn {
  return fn as unknown as MockFn;
}

function addOf(scene: unknown): Record<string, unknown> {
  return (scene as { add: Record<string, unknown> }).add;
}

function getZones(scene: unknown): Array<Record<string, MockFn>> {
  return getMockFn(addOf(scene).zone).mock.results.map((r) => r.value as Record<string, MockFn>);
}

function getCurrentRound(scene: unknown): { shuffled: string[]; solution: string[] } {
  const s = scene as {
    rounds: Array<{ shuffled: string[]; solution: string[] }>;
    roundIndex: number;
  };
  return s.rounds[s.roundIndex];
}

interface TestPanel {
  id: string;
  container: Record<string, MockFn> & { x?: number; y?: number };
  bg: Record<string, MockFn>;
  key: string;
  originX: number;
  originY: number;
  slotIndex: number | null;
  justDropped: boolean;
}

interface TestSlot {
  zone: Record<string, MockFn>;
  x: number;
  y: number;
  occupiedBy: TestPanel | null;
}

/**
 * The drag board surface the tests exercise, viewed through the mock zone.
 * Typed loosely on purpose: the real shell is generic over the scene's panel
 * type, whose mock containers only share the mock record shape.
 */
interface TestBoard {
  getSlots(): TestSlot[];
  isOverAnyZone(x: number, y: number): boolean;
}

function internals(scene: unknown): { panels: TestPanel[]; slots: TestSlot[] } {
  // Slots live on the shared drag board now; the scene keeps no local copy.
  const s = scene as unknown as { panels: TestPanel[]; board: TestBoard };
  return { panels: s.panels, slots: s.board.getSlots() };
}

function boardOf(scene: unknown): TestBoard {
  return (scene as unknown as { board: TestBoard }).board;
}

function handlersOf(
  container: Record<string, MockFn>,
  event: string,
): Array<(...a: never[]) => void> {
  return getMockFn(container.on)
    .mock.calls.filter((c) => c[0] === event)
    .map((c) => c[1] as (...a: never[]) => void);
}

function lastHandler(container: Record<string, MockFn>, event: string): (...a: never[]) => void {
  const all = handlersOf(container, event);
  expect(all.length).toBeGreaterThan(0);
  return all[all.length - 1];
}

function drop(scene: unknown, panel: TestPanel, slotIndex: number): void {
  const { slots } = internals(scene);
  (lastHandler(panel.container, "drop") as (pointer: unknown, zone: unknown) => void)(
    undefined,
    slots[slotIndex].zone,
  );
}

function fillBoard(scene: unknown, order: string[]): void {
  const { panels } = internals(scene);
  order.forEach((key, index) => {
    const panel = panels.find((p) => p.key === key);
    expect(panel).toBeDefined();
    drop(scene, panel as TestPanel, index);
  });
}

function validate(scene: unknown): void {
  // The shell validates when a drag ends; with no registered pieces no
  // gesture can end, so an empty board cannot reach validation.
  const panels = internals(scene).panels;
  if (panels.length === 0) return;
  (lastHandler(panels[0].container, "dragend") as () => void)();
}

function delayedCallbacks(scene: unknown): Array<() => void> {
  return getMockFn((scene as { time: Record<string, unknown> }).time.delayedCall).mock.calls.map(
    (c) => c[1] as () => void,
  );
}

function tweenConfigs(scene: unknown): Array<Record<string, unknown>> {
  return getMockFn((scene as { tweens: Record<string, unknown> }).tweens.add).mock.calls.map(
    (c) => c[0] as Record<string, unknown>,
  );
}

function wiggleTween(scene: unknown): Record<string, unknown> | undefined {
  return tweenConfigs(scene).find((c) => typeof c.onComplete === "function");
}

/**
 * Builds the engine-accurate hit-test subject for a panel container. Phaser
 * adds the display origin (half of `setSize`) before testing the hit area, so
 * the visible, centred panel occupies `(0,0)-(w,h)` in that local space.
 */
function hitSubject(panel: TestPanel) {
  const config = getMockFn(panel.container.setInteractive).mock.calls[0]?.[0] as
    | { hitArea: { x: number; y: number; width: number; height: number } }
    | undefined;
  if (!config) throw new Error("panel is not interactive");
  const size = getMockFn(panel.container.setSize).mock.calls[0] as [number, number];
  return {
    x: panel.originX,
    y: panel.originY,
    scale: 1,
    displayOriginX: size[0] / 2,
    displayOriginY: size[1] / 2,
    hitArea: config.hitArea,
  };
}

describe("StoryOrderScene shell", () => {
  beforeEach(() => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    stubMatchMedia(false);
    localStorage.clear();
    mockParentLockInstances.length = 0;
    for (const fn of Object.values(mockAudio)) {
      fn.mockClear();
    }
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("renders mascot, parent-locked Back button, and 6 progress dots", () => {
    const scene = new StoryOrderScene();
    scene.create();

    const textMock = getMockFn(addOf(scene).text);
    expect(textMock.mock.calls.find((call) => call[2] === "← Back")).toBeDefined();
    expect(mockParentLockInstances).toHaveLength(1);

    const circleMock = getMockFn(addOf(scene).circle);
    expect(circleMock.mock.calls).toHaveLength(6);
    expect((scene as unknown as { rounds: unknown[] }).rounds).toHaveLength(6);
    expect((scene as unknown as { inputLocked: boolean }).inputLocked).toBe(false);
  });

  it("preloads only the 33 story panels, not the boot art", () => {
    const scene = new StoryOrderScene();
    scene.preload();

    const keys = getMockFn(
      (scene as unknown as { load: Record<string, unknown> }).load.svg,
    ).mock.calls.map((call) => call[0] as string);
    expect(keys).toHaveLength(33);
    expect(new Set(keys).size).toBe(33);
    expect(keys).toContain("story_seed_planted");
    expect(keys).toContain("story_rain_puddle");
    expect(keys).toContain("story_cake_whole");
    expect(keys).toContain("story_sun_set");
  });

  it("renders three panels in the tray and three pip-marked ordinal slots", () => {
    const scene = new StoryOrderScene();
    scene.create();
    const round = getCurrentRound(scene);

    expect(round.shuffled).toHaveLength(3);
    expect(round.solution).toHaveLength(3);
    expect(internals(scene).panels.map((p) => p.key)).toEqual(round.shuffled);
    expect(getZones(scene)).toHaveLength(3);

    const outlines = getMockFn(addOf(scene).graphics).mock.results.map(
      (r) => r.value as Record<string, MockFn>,
    );
    expect(outlines).toHaveLength(3);
    // 1 + 2 + 3 pips: the only ordinal cue, and no digits or words.
    const pipCount = outlines.reduce(
      (sum, outline) => sum + getMockFn(outline.fillCircle).mock.calls.length,
      0,
    );
    expect(pipCount).toBe(6);
    const textMock = getMockFn(addOf(scene).text);
    expect(textMock.mock.calls.some((call) => call[2] === "1" || call[2] === "2")).toBe(false);
  });

  it("rebuilds three panels and three slots for every one of the six rounds", () => {
    const scene = new StoryOrderScene();
    scene.create();
    const s = scene as unknown as {
      rounds: Array<{ shuffled: string[]; solution: string[] }>;
      roundIndex: number;
      renderRound: () => void;
    };

    for (let i = 0; i < s.rounds.length; i++) {
      s.roundIndex = i;
      s.renderRound();
      expect(s.rounds[i].shuffled).toHaveLength(3);
      expect(s.rounds[i].solution).toHaveLength(3);
      expect(internals(scene).panels).toHaveLength(3);
      expect(internals(scene).slots).toHaveLength(3);
    }
  });

  it("shows and speaks the rule and nothing per round", () => {
    const scene = new StoryOrderScene();
    scene.create();

    const textMock = getMockFn(addOf(scene).text);
    expect(textMock.mock.calls.find((call) => call[2] === RULE)).toBeDefined();
    expect(mockSpeech.speakSentence).toHaveBeenCalledWith(RULE, true);
  });
});

describe("StoryOrderScene interactions", () => {
  beforeEach(() => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    stubMatchMedia(false);
    localStorage.clear();
    mockParentLockInstances.length = 0;
    mockSpeech.speakSentence.mockClear();
    for (const fn of Object.values(mockAudio)) {
      fn.mockClear();
    }
    mockCompletionEffect.createCompletionSplash.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("gives the whole visible panel a 180 px hit area and misses outside it", () => {
    const scene = new StoryOrderScene();
    scene.create();
    const panel = internals(scene).panels[0];
    const subject = hitSubject(panel);

    expect(tapHits(subject, panel.originX, panel.originY)).toBe(true);
    expect(tapHits(subject, panel.originX + 80, panel.originY + 80)).toBe(true);
    expect(tapHits(subject, panel.originX + 91, panel.originY)).toBe(false);
    expect(tapHits(subject, panel.originX - 100, panel.originY - 100)).toBe(false);
  });

  it("lifts on dragstart and follows the pointer, ignoring a locked board", () => {
    const scene = new StoryOrderScene();
    scene.create();
    const { panels } = internals(scene);

    lastHandler(panels[0].container, "dragstart")();
    lastHandler(panels[0].container, "drag")(undefined as never, 111 as never, 222 as never);
    expect(panels[0].container.setPosition).toHaveBeenCalledWith(111, 222);

    (scene as unknown as { inputLocked: boolean }).inputLocked = true;
    getMockFn(panels[1].container.setPosition).mockClear();
    lastHandler(panels[1].container, "dragstart")();
    lastHandler(panels[1].container, "drag")(undefined as never, 5 as never, 6 as never);
    expect(panels[1].container.setPosition).not.toHaveBeenCalled();
  });

  it("claims an empty slot on drop and snaps to it", () => {
    const scene = new StoryOrderScene();
    scene.create();
    const { panels, slots } = internals(scene);
    drop(scene, panels[0], 0);

    expect(panels[0].slotIndex).toBe(0);
    expect(slots[0].occupiedBy).toBe(panels[0]);
    const snap = tweenConfigs(scene).at(-1);
    expect(snap?.x).toBe(slots[0].x);
    expect(snap?.y).toBe(slots[0].y);
  });

  it("re-snaps to its own slot without changing occupancy", () => {
    const scene = new StoryOrderScene();
    scene.create();
    const { panels, slots } = internals(scene);
    drop(scene, panels[0], 0);
    drop(scene, panels[0], 0);
    expect(panels[0].slotIndex).toBe(0);
    expect(slots[0].occupiedBy).toBe(panels[0]);
  });

  it("swaps the two occupants when a placed panel lands on an occupied slot", () => {
    const scene = new StoryOrderScene();
    scene.create();
    const { panels, slots } = internals(scene);
    drop(scene, panels[0], 0);
    drop(scene, panels[1], 1);
    drop(scene, panels[0], 1);

    expect(panels[0].slotIndex).toBe(1);
    expect(panels[1].slotIndex).toBe(0);
    expect(slots[1].occupiedBy).toBe(panels[0]);
    expect(slots[0].occupiedBy).toBe(panels[1]);
  });

  it("sends the occupant back to the tray when a tray panel takes its slot", () => {
    const scene = new StoryOrderScene();
    scene.create();
    const { panels, slots } = internals(scene);
    drop(scene, panels[0], 0);
    const occupant = panels[0];
    drop(scene, panels[1], 0);

    expect(panels[1].slotIndex).toBe(0);
    expect(slots[0].occupiedBy).toBe(panels[1]);
    expect(occupant.slotIndex).toBeNull();
    const home = tweenConfigs(scene)
      .filter((c) => c.targets === occupant.container)
      .at(-1);
    expect(home?.x).toBe(occupant.originX);
    expect(home?.y).toBe(occupant.originY);
  });

  it("ignores drops while locked or onto an unknown zone", () => {
    const scene = new StoryOrderScene();
    scene.create();
    const { panels, slots } = internals(scene);

    (scene as unknown as { inputLocked: boolean }).inputLocked = true;
    drop(scene, panels[0], 0);
    expect(panels[0].slotIndex).toBeNull();
    expect(slots[0].occupiedBy).toBeNull();

    (scene as unknown as { inputLocked: boolean }).inputLocked = false;
    (lastHandler(panels[0].container, "drop") as (pointer: unknown, zone: unknown) => void)(
      undefined,
      {},
    );
    expect(panels[0].slotIndex).toBeNull();
  });

  it("returns a missed tray drag home and never validates", () => {
    const scene = new StoryOrderScene();
    scene.create();
    const panel = internals(scene).panels[0];
    panel.container.x = 0;
    panel.container.y = 0;
    lastHandler(panel.container, "dragend")();

    const home = tweenConfigs(scene).find((c) => c.targets === panel.container);
    expect(home?.x).toBe(panel.originX);
    expect(home?.y).toBe(panel.originY);
    expect(mockAudio.playCorrect).not.toHaveBeenCalled();
    expect(mockAudio.playIncorrect).not.toHaveBeenCalled();
  });

  it("does not validate when the third panel is dropped outside a slot", () => {
    const scene = new StoryOrderScene();
    scene.create();
    const { panels, slots } = internals(scene);
    drop(scene, panels[0], 0);
    drop(scene, panels[1], 1);
    const third = panels[2];
    third.container.x = 0;
    third.container.y = 0;
    lastHandler(third.container, "dragend")();

    expect(slots[2].occupiedBy).toBeNull();
    expect(third.slotIndex).toBeNull();
    expect(mockAudio.playCorrect).not.toHaveBeenCalled();
    expect(mockAudio.playIncorrect).not.toHaveBeenCalled();
    expect(tweenConfigs(scene).find((c) => c.targets === third.container)?.x).toBe(third.originX);
  });

  it("keeps a dropped panel in its slot when the gesture's pointerup follows dragend", () => {
    const scene = new StoryOrderScene();
    scene.create();
    const { panels, slots } = internals(scene);
    const panel = panels[0];

    // Browser order: dragstart, pointerdown, drop, dragend, then pointerup.
    lastHandler(panel.container, "dragstart")();
    lastHandler(panel.container, "pointerdown")();
    drop(scene, panel, 0);
    panel.container.x = slots[0].x;
    panel.container.y = slots[0].y;
    lastHandler(panel.container, "dragend")();
    lastHandler(panel.container, "pointerup")();

    expect(panel.slotIndex).toBe(0);
    expect(slots[0].occupiedBy).toBe(panel);
  });

  it("routes a real pointer sequence through the container's drop wire", () => {
    const scene = new StoryOrderScene();
    scene.create();
    const { panels, slots } = internals(scene);
    const panel = panels[0];

    lastHandler(panel.container, "pointerdown")();
    lastHandler(panel.container, "dragstart")();
    (lastHandler(panel.container, "drag") as (...a: unknown[]) => void)({}, slots[0].x, slots[0].y);
    panel.container.x = slots[0].x;
    panel.container.y = slots[0].y;
    (lastHandler(panel.container, "drop") as (...a: unknown[]) => void)({}, slots[0].zone);
    lastHandler(panel.container, "dragend")();
    lastHandler(panel.container, "pointerup")();

    expect(panel.slotIndex).toBe(0);
    expect(slots[0].occupiedBy).toBe(panel);
  });

  it("returns a placed panel on a real tap, then revalidates a refilled strip", () => {
    const scene = new StoryOrderScene();
    scene.create();
    const { slots } = internals(scene);
    const solution = getCurrentRound(scene).solution;
    // Leave the strip incomplete: a completed strip has already been resolved
    // (advancing, or locking the board on a wrong order), so a tap that
    // withdraws a panel is an in-progress gesture.
    fillBoard(scene, solution.slice(0, 2));
    const tapped = slots[0].occupiedBy as TestPanel;
    // A clean tap fires only pointerdown/pointerup: with the 10 px threshold,
    // dragstart/dragend imply real movement, so the trailing pointerup of a
    // drag is (correctly) not treated as a tap-to-return.
    lastHandler(tapped.container, "pointerdown")();
    lastHandler(tapped.container, "pointerup")();

    expect(slots[0].occupiedBy).toBeNull();
    expect(tapped.slotIndex).toBeNull();
    expect(mockAudio.playCorrect).not.toHaveBeenCalled();

    fillBoard(scene, getCurrentRound(scene).solution);
    validate(scene);
    expect(mockAudio.playCorrect).toHaveBeenCalledTimes(1);
  });

  it("gives a wobbly tap 10 px of slack before it counts as a drag", () => {
    const scene = new StoryOrderScene();
    scene.create();

    expect(
      (scene.input as unknown as { dragDistanceThreshold: number }).dragDistanceThreshold,
    ).toBe(10);
  });

  it("puts the ordered strip above the shuffled tray", () => {
    const scene = new StoryOrderScene();
    scene.create();
    const { panels, slots } = internals(scene);
    const trayY = panels[0].originY;

    expect(slots.every((slot) => slot.y < trayY)).toBe(true);
  });

  it("moves a placed panel into another empty slot", () => {
    const scene = new StoryOrderScene();
    scene.create();
    const { panels, slots } = internals(scene);
    drop(scene, panels[0], 0);
    drop(scene, panels[1], 1);
    drop(scene, panels[0], 2);

    expect(panels[0].slotIndex).toBe(2);
    expect(slots[0].occupiedBy).toBeNull();
    expect(slots[2].occupiedBy).toBe(panels[0]);
  });

  it("returns a missed placed drag to its slot", () => {
    const scene = new StoryOrderScene();
    scene.create();
    const { panels, slots } = internals(scene);
    drop(scene, panels[0], 0);
    panels[0].container.x = -500;
    panels[0].container.y = -500;
    lastHandler(panels[0].container, "dragend")();

    const back = tweenConfigs(scene).find((c) => c.targets === panels[0].container);
    expect(back?.x).toBe(slots[0].x);
    expect(back?.y).toBe(slots[0].y);
  });

  it("ignores a tap on a placed panel while the board is locked", () => {
    const scene = new StoryOrderScene();
    scene.create();
    const { panels, slots } = internals(scene);
    drop(scene, panels[0], 0);
    (scene as unknown as { inputLocked: boolean }).inputLocked = true;
    lastHandler(panels[0].container, "pointerup")();
    lastHandler(panels[0].container, "dragend")();
    expect(slots[0].occupiedBy).toBe(panels[0]);
    expect(mockAudio.playCorrect).not.toHaveBeenCalled();
  });

  it("does not tween a tray panel on a plain tap", () => {
    const scene = new StoryOrderScene();
    scene.create();
    const panel = internals(scene).panels[1];
    const before = tweenConfigs(scene).length;
    lastHandler(panel.container, "pointerup")();
    expect(tweenConfigs(scene)).toHaveLength(before);
  });

  it("advances on a correct strip after the shared feedback", () => {
    const scene = new StoryOrderScene();
    scene.create();
    fillBoard(scene, getCurrentRound(scene).solution);
    validate(scene);

    expect(mockAudio.playCorrect).toHaveBeenCalledTimes(1);
    expect(mockCompletionEffect.createCompletionSplash).toHaveBeenCalledTimes(1);
    expect((scene as unknown as { inputLocked: boolean }).inputLocked).toBe(true);

    const dots = getMockFn(addOf(scene).circle).mock.results.map(
      (r) => (r.value as Record<string, MockFn>).setAlpha,
    );
    expect(getMockFn(dots[0]).mock.calls).toContainEqual([1]);

    const callbacks = delayedCallbacks(scene);
    callbacks[callbacks.length - 1]();
    expect((scene as unknown as { roundIndex: number }).roundIndex).toBe(1);
    expect((scene as unknown as { inputLocked: boolean }).inputLocked).toBe(false);
  });

  it("leaves a wrong strip exactly in place, unlocks, and accepts one move", () => {
    const scene = new StoryOrderScene();
    scene.create();
    const { panels, slots } = internals(scene);
    const solution = getCurrentRound(scene).solution;
    const wrong = [...solution].reverse();
    fillBoard(scene, wrong);
    const placed = slots.map((s) => s.occupiedBy?.key);
    expect(placed).toEqual(wrong);

    validate(scene);
    expect(mockAudio.playIncorrect).toHaveBeenCalledTimes(1);
    expect((scene as unknown as { inputLocked: boolean }).inputLocked).toBe(true);

    const wiggle = wiggleTween(scene) as { onComplete?: () => void } | undefined;
    wiggle?.onComplete?.();
    expect((scene as unknown as { inputLocked: boolean }).inputLocked).toBe(false);
    // Re-validating an unchanged strip must not waggle the child again.
    validate(scene);
    expect(mockAudio.playIncorrect).toHaveBeenCalledTimes(1);
    // Nothing bounced home: the child's work survives the wrong answer.
    expect(slots.map((s) => s.occupiedBy?.key)).toEqual(wrong);
    expect(
      tweenConfigs(scene).some(
        (c) =>
          c.y === panels[0].originY &&
          panels.some((p) => c.targets === p.container && p.slotIndex !== null),
      ),
    ).toBe(false);

    // Moving one panel (slot 0 <-> slot 2) completes the story.
    drop(scene, slots[0].occupiedBy as TestPanel, 2);
    validate(scene);
    expect(mockAudio.playCorrect).toHaveBeenCalledTimes(1);
    expect(slots.map((s) => s.occupiedBy?.key)).toEqual(solution);
  });

  it("does not validate a partially filled strip", () => {
    const scene = new StoryOrderScene();
    scene.create();
    drop(scene, internals(scene).panels[0], 0);
    validate(scene);
    expect(mockAudio.playCorrect).not.toHaveBeenCalled();
    expect(mockAudio.playIncorrect).not.toHaveBeenCalled();
    expect((scene as unknown as { inputLocked: boolean }).inputLocked).toBe(false);
  });

  it("completes the game on the last round", () => {
    const scene = new StoryOrderScene();
    scene.create();
    const s = scene as unknown as {
      rounds: Array<{ solution: string[] }>;
      roundIndex: number;
      renderRound: () => void;
    };
    s.roundIndex = s.rounds.length - 1;
    s.renderRound();
    fillBoard(scene, s.rounds[s.roundIndex].solution);
    validate(scene);

    expect(mockAudio.playCorrect).toHaveBeenCalled();
    const callbacks = delayedCallbacks(scene);
    callbacks[callbacks.length - 1]();
    expect(mockAudio.playWin).toHaveBeenCalledTimes(1);
  });

  it("tolerates destroy failures when clearing a round", () => {
    const scene = new StoryOrderScene();
    scene.create();
    const s = scene as unknown as {
      roundObjects: Array<{ destroy: MockFn }>;
      board: { getSlots: () => Array<{ zone: { destroy: MockFn } }> };
      clearRound: () => void;
    };
    s.roundObjects[0].destroy = vi.fn(() => {
      throw new Error("boom");
    }) as unknown as MockFn;
    // The shell owns the drop zones; its clear tolerates an already-gone zone.
    s.board.getSlots()[0].zone.destroy = vi.fn(() => {
      throw new Error("boom");
    }) as unknown as MockFn;
    expect(() => s.clearRound()).not.toThrow();
    expect(s.board.getSlots()).toHaveLength(0);
  });

  it("does nothing when the round is missing or the slice is stale", () => {
    const scene = new StoryOrderScene();
    scene.create();
    const { panels, slots } = internals(scene);

    // A tray panel has nothing to return: tapping it must not move anything.
    const tweensBefore = tweenConfigs(scene).length;
    lastHandler(panels[1].container, "pointerdown")();
    lastHandler(panels[1].container, "pointerup")();
    expect(tweenConfigs(scene)).toHaveLength(tweensBefore);

    // A stale slot index must not throw a tap-to-return.
    drop(scene, panels[0], 0);
    panels[0].slotIndex = 5;
    expect(() => {
      lastHandler(panels[0].container, "pointerdown")();
      lastHandler(panels[0].container, "pointerup")();
    }).not.toThrow();

    // A missing round leaves the board empty and never validates.
    (scene as unknown as { roundIndex: number }).roundIndex = 99;
    (scene as unknown as { renderRound: () => void }).renderRound();
    expect(internals(scene).panels).toHaveLength(0);
    expect(internals(scene).slots).toHaveLength(0);
    expect(slots.length).toBe(3);
    validate(scene);
    expect(mockAudio.playCorrect).not.toHaveBeenCalled();
    expect(mockAudio.playIncorrect).not.toHaveBeenCalled();
  });

  it("detects whether a point is over any slot and reports no placed panel for an empty slot", () => {
    const scene = new StoryOrderScene();
    scene.create();
    const { slots } = internals(scene);
    const board = boardOf(scene);
    const s = scene as unknown as {
      wiggleTargets: () => unknown[];
    };
    expect(board.isOverAnyZone(slots[0].x, slots[0].y)).toBe(true);
    expect(board.isOverAnyZone(-9999, -9999)).toBe(false);

    drop(scene, internals(scene).panels[0], 0);
    expect(s.wiggleTargets()).toHaveLength(1);
    board.getSlots()[0].occupiedBy = null;
    expect(s.wiggleTargets()).toHaveLength(0);
  });
});
