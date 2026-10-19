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

const { getAdaptiveBandShiftMock } = vi.hoisted(() => ({
  getAdaptiveBandShiftMock: vi.fn((_gameId: string): -1 | 0 | 1 => 0),
}));

vi.mock("../../utils/storage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../utils/storage")>();
  return {
    ...actual,
    getAdaptiveBandShift: (gameId: string) => getAdaptiveBandShiftMock(gameId),
  };
});

import { NumberOrderScene } from "../../scenes/NumberOrderScene";
import { tapHits } from "../helpers/hitTest";

function getMockFn(fn: unknown): MockFn {
  return fn as unknown as MockFn;
}

function getCurrentRound(scene: unknown): { shuffled: number[]; solution: number[] } {
  const s = scene as {
    rounds: Array<{ shuffled: number[]; solution: number[] }>;
    roundIndex: number;
  };
  return s.rounds[s.roundIndex];
}

function getZones(scene: unknown): Array<Record<string, MockFn>> {
  const zoneMock = getMockFn((scene as { add: Record<string, unknown> }).add.zone);
  return zoneMock.mock.results.map((r) => r.value as Record<string, MockFn>);
}

function getCards(scene: unknown): Array<Record<string, MockFn>> {
  const containerMock = getMockFn((scene as { add: Record<string, unknown> }).add.container);
  return containerMock.mock.results.map((r) => r.value as Record<string, MockFn>);
}

describe("NumberOrderScene shell", () => {
  beforeEach(() => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    stubMatchMedia(false);
    localStorage.clear();
    mockParentLockInstances.length = 0;
    mockSpeech.speakNumber.mockClear();
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
    const scene = new NumberOrderScene();
    scene.create();

    const textMock = getMockFn((scene as unknown as { add: Record<string, unknown> }).add.text);
    expect(textMock.mock.calls.find((call) => call[2] === "← Back")).toBeDefined();

    expect(mockParentLockInstances).toHaveLength(1);
    expect((mockParentLockInstances[0] as { onSuccess: unknown }).onSuccess).toBeDefined();

    const circleMock = getMockFn((scene as unknown as { add: Record<string, unknown> }).add.circle);
    expect(circleMock.mock.calls).toHaveLength(6);

    expect((scene as unknown as { rounds: unknown[] }).rounds).toHaveLength(6);
    expect((scene as unknown as { inputLocked: boolean }).inputLocked).toBe(false);
  });

  it("renders 3 cards, zones, and dashed outlines for the first (easy band) round", () => {
    const scene = new NumberOrderScene();
    scene.create();

    const round = getCurrentRound(scene);
    expect(round.shuffled).toHaveLength(3);
    expect(round.solution).toHaveLength(3);

    expect(getCards(scene)).toHaveLength(3);
    expect(getZones(scene)).toHaveLength(3);
    const graphicsMock = getMockFn(
      (scene as unknown as { add: Record<string, unknown> }).add.graphics,
    );
    expect(graphicsMock.mock.calls).toHaveLength(3);
  });
});

describe("NumberOrderScene interactions", () => {
  beforeEach(() => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    stubMatchMedia(false);
    localStorage.clear();
    mockParentLockInstances.length = 0;
    mockSpeech.speakNumber.mockClear();
    for (const fn of Object.values(mockAudio)) {
      fn.mockClear();
    }
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  interface TestCard {
    container: Record<string, MockFn> & { x?: number; y?: number };
    bg: Record<string, MockFn>;
    numeral: number;
    originX: number;
    originY: number;
    slotIndex: number | null;
    justDropped: boolean;
  }

  interface TestSlot {
    zone: Record<string, MockFn>;
    outline: Record<string, MockFn>;
    x: number;
    y: number;
    occupiedBy: TestCard | null;
  }

  function internals(scene: unknown): { cards: TestCard[]; slots: TestSlot[] } {
    const s = scene as { cards: TestCard[]; slots: TestSlot[] };
    return { cards: s.cards, slots: s.slots };
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

  /**
   * Builds the engine-accurate hit-test subject for a card container. Phaser
   * adds the display origin (half of `setSize`) before testing the hit area,
   * so the visible, centred card occupies `(0,0)-(w,h)` in that local space.
   */
  function hitSubject(card: TestCard) {
    const config = getMockFn(card.container.setInteractive).mock.calls[0]?.[0] as
      | { hitArea: { x: number; y: number; width: number; height: number } }
      | undefined;
    if (!config) throw new Error("card container is not interactive");
    const size = getMockFn(card.container.setSize).mock.calls[0] as [number, number];
    return {
      x: card.originX,
      y: card.originY,
      scale: 1,
      displayOriginX: size[0] / 2,
      displayOriginY: size[1] / 2,
      hitArea: config.hitArea,
    };
  }

  it("hit-tests the visible card: centre and lower-right hit, outside taps miss", () => {
    const scene = new NumberOrderScene();
    scene.create();
    const card = internals(scene).cards[0];
    const subject = hitSubject(card);

    // The whole visible card is tappable...
    expect(tapHits(subject, card.originX, card.originY)).toBe(true);
    expect(tapHits(subject, card.originX + 40, card.originY + 40)).toBe(true);
    // ...and nothing outside its edges is.
    expect(tapHits(subject, card.originX + 71, card.originY)).toBe(false);
    expect(tapHits(subject, card.originX - 100, card.originY - 100)).toBe(false);
  });

  function drop(scene: unknown, card: TestCard, slotIndex: number): void {
    const { slots } = internals(scene);
    (scene as { handleDrop: (c: TestCard, z: unknown) => void }).handleDrop(
      card,
      slots[slotIndex].zone,
    );
  }

  function fillBoard(scene: unknown, order: number[]): void {
    const { cards } = internals(scene);
    for (let i = 0; i < order.length; i++) {
      const card = cards.find((c) => c.numeral === order[i]);
      expect(card).toBeDefined();
      drop(scene, card as TestCard, i);
    }
  }

  function delayedCallbacks(scene: unknown): Array<() => void> {
    return getMockFn((scene as { time: Record<string, unknown> }).time.delayedCall).mock.calls.map(
      (c) => c[1] as () => void,
    );
  }

  it("speaks the numeral on tap and ignores taps while locked", () => {
    const scene = new NumberOrderScene();
    scene.create();
    const { cards } = internals(scene);
    const tap = lastHandler(cards[0].container, "pointerdown");
    tap();
    expect(mockSpeech.speakNumber).toHaveBeenCalledTimes(1);
    expect(mockSpeech.speakNumber).toHaveBeenCalledWith(cards[0].numeral, expect.anything());

    (scene as unknown as { inputLocked: boolean }).inputLocked = true;
    tap();
    expect(mockSpeech.speakNumber).toHaveBeenCalledTimes(1);
  });

  it("lifts on dragstart and moves with the pointer via drag", () => {
    const scene = new NumberOrderScene();
    scene.create();
    const { cards } = internals(scene);
    const dragstart = lastHandler(cards[0].container, "dragstart");
    const drag = lastHandler(cards[0].container, "drag");
    dragstart();
    drag(undefined as never, 111 as never, 222 as never);
    expect(cards[0].container.setPosition).toHaveBeenCalledWith(111, 222);

    (scene as unknown as { inputLocked: boolean }).inputLocked = true;
    getMockFn(cards[1].container.setPosition).mockClear();
    const drag2 = lastHandler(cards[1].container, "drag");
    drag2(undefined as never, 5 as never, 6 as never);
    expect(cards[1].container.setPosition).not.toHaveBeenCalled();
  });

  it("claims an empty slot on drop and snaps to it", () => {
    const scene = new NumberOrderScene();
    scene.create();
    const { cards, slots } = internals(scene);
    const tweens = getMockFn((scene as unknown as { tweens: Record<string, unknown> }).tweens.add);
    const before = tweens.mock.calls.length;
    drop(scene, cards[0], 0);
    expect(cards[0].slotIndex).toBe(0);
    expect(slots[0].occupiedBy).toBe(cards[0]);
    expect(tweens.mock.calls.length).toBeGreaterThan(before);
    const snap = tweens.mock.calls[tweens.mock.calls.length - 1][0] as { x: number; y: number };
    expect(snap.x).toBe(slots[0].x);
    expect(snap.y).toBe(slots[0].y);
  });

  it("snaps back onto its own slot without changing occupancy", () => {
    const scene = new NumberOrderScene();
    scene.create();
    const { cards, slots } = internals(scene);
    drop(scene, cards[0], 0);
    drop(scene, cards[0], 0);
    expect(cards[0].slotIndex).toBe(0);
    expect(slots[0].occupiedBy).toBe(cards[0]);
  });

  it("swaps occupants when dropping a placed card onto an occupied slot", () => {
    const scene = new NumberOrderScene();
    scene.create();
    const { cards, slots } = internals(scene);
    drop(scene, cards[0], 0);
    drop(scene, cards[1], 1);
    drop(scene, cards[0], 1);
    expect(cards[0].slotIndex).toBe(1);
    expect(cards[1].slotIndex).toBe(0);
    expect(slots[1].occupiedBy).toBe(cards[0]);
    expect(slots[0].occupiedBy).toBe(cards[1]);
  });

  it("returns the occupant home when a source card drops onto an occupied slot", () => {
    const scene = new NumberOrderScene();
    scene.create();
    const { cards, slots } = internals(scene);
    drop(scene, cards[0], 0);
    const occupant = cards[0];
    const tweens = getMockFn((scene as unknown as { tweens: Record<string, unknown> }).tweens.add);
    tweens.mockClear();
    drop(scene, cards[1], 0);
    expect(cards[1].slotIndex).toBe(0);
    expect(slots[0].occupiedBy).toBe(cards[1]);
    expect(occupant.slotIndex).toBeNull();
    const homeTween = tweens.mock.calls.find(
      (c) => (c[0] as { targets: unknown }).targets === occupant.container,
    );
    expect(homeTween).toBeDefined();
    expect((homeTween as unknown as Array<{ x: number }>)[0].x).toBe(occupant.originX);
  });

  it("ignores drops while locked or onto unknown zones", () => {
    const scene = new NumberOrderScene();
    scene.create();
    const { cards, slots } = internals(scene);
    (scene as unknown as { inputLocked: boolean }).inputLocked = true;
    drop(scene, cards[0], 0);
    expect(cards[0].slotIndex).toBeNull();
    expect(slots[0].occupiedBy).toBeNull();
    (scene as unknown as { inputLocked: boolean }).inputLocked = false;
    (scene as unknown as { handleDrop: (c: TestCard, z: unknown) => void }).handleDrop(
      cards[0],
      {},
    );
    expect(cards[0].slotIndex).toBeNull();
  });

  it("tap-to-return sends a placed card home on pointerup", () => {
    const scene = new NumberOrderScene();
    scene.create();
    const { cards, slots } = internals(scene);
    drop(scene, cards[0], 0);
    expect(slots[0].occupiedBy).toBe(cards[0]);
    const pointerup = lastHandler(cards[0].container, "pointerup");
    pointerup();
    expect(cards[0].slotIndex).toBeNull();
    expect(slots[0].occupiedBy).toBeNull();
  });

  it("keeps a dropped card in its slot when the gesture's pointerup follows dragend", () => {
    const scene = new NumberOrderScene();
    scene.create();
    const { cards, slots } = internals(scene);
    const card = cards[0];

    // Real input order observed in the browser: dragstart fires BEFORE
    // pointerdown, then drop, dragend, and the pointerup that ends the gesture.
    lastHandler(card.container, "dragstart")();
    lastHandler(card.container, "pointerdown")();
    drop(scene, card, 0);
    card.container.x = slots[0].x;
    card.container.y = slots[0].y;
    lastHandler(card.container, "dragend")();
    lastHandler(card.container, "pointerup")();

    expect(card.slotIndex).toBe(0);
    expect(slots[0].occupiedBy).toBe(card);
  });

  it("bounces a missed source drag home on dragend", () => {
    const scene = new NumberOrderScene();
    scene.create();
    const { cards } = internals(scene);
    const card = cards[0];
    card.container.x = 0;
    card.container.y = 0;
    const tweens = getMockFn((scene as unknown as { tweens: Record<string, unknown> }).tweens.add);
    tweens.mockClear();
    lastHandler(card.container, "dragend")();
    const home = tweens.mock.calls.find(
      (c) => (c[0] as { targets: unknown }).targets === card.container,
    );
    expect(home).toBeDefined();
    expect((home as unknown as Array<{ x: number }>)[0].x).toBe(card.originX);
    expect((scene as unknown as { inputLocked: boolean }).inputLocked).toBe(false);
  });

  it("bounces a missed placed drag back to its slot on dragend", () => {
    const scene = new NumberOrderScene();
    scene.create();
    const { cards, slots } = internals(scene);
    drop(scene, cards[0], 0);
    const card = cards[0];
    card.container.x = 0;
    card.container.y = 0;
    const tweens = getMockFn((scene as unknown as { tweens: Record<string, unknown> }).tweens.add);
    tweens.mockClear();
    lastHandler(card.container, "dragend")();
    const back = tweens.mock.calls.find(
      (c) => (c[0] as { targets: unknown }).targets === card.container,
    );
    expect(back).toBeDefined();
    expect((back as unknown as Array<{ x: number }>)[0].x).toBe(slots[0].x);
  });

  it("advances to the next round on a correct full board", () => {
    const scene = new NumberOrderScene();
    scene.create();
    const round = getCurrentRound(scene);
    fillBoard(scene, round.solution);
    (scene as unknown as { tryAutoValidate: () => void }).tryAutoValidate();
    expect(mockAudio.playCorrect).toHaveBeenCalledTimes(1);
    expect((scene as unknown as { inputLocked: boolean }).inputLocked).toBe(true);
    const callbacks = delayedCallbacks(scene);
    expect(callbacks.length).toBeGreaterThan(0);
    callbacks[callbacks.length - 1]();
    expect((scene as unknown as { roundIndex: number }).roundIndex).toBe(1);
    expect((scene as unknown as { inputLocked: boolean }).inputLocked).toBe(false);
  });

  it("wiggles and bounces home on an incorrect full board", () => {
    const scene = new NumberOrderScene();
    scene.create();
    const round = getCurrentRound(scene);
    fillBoard(scene, [...round.solution].reverse());
    // Guard: reversed must actually be wrong for distinct ascending solutions
    expect([...round.solution].reverse()).not.toEqual(round.solution);
    (scene as unknown as { tryAutoValidate: () => void }).tryAutoValidate();
    expect(mockAudio.playIncorrect).toHaveBeenCalledTimes(1);
    const tweens = getMockFn((scene as unknown as { tweens: Record<string, unknown> }).tweens.add);
    const wiggle = tweens.mock.calls
      .map((c) => c[0] as { onComplete?: () => void })
      .find((c) => typeof c.onComplete === "function");
    expect(wiggle).toBeDefined();
    wiggle?.onComplete?.();
    const { slots } = internals(scene);
    expect(slots.every((s) => s.occupiedBy === null)).toBe(true);
    expect((scene as unknown as { inputLocked: boolean }).inputLocked).toBe(false);
  });

  it("does not validate a partially filled board", () => {
    const scene = new NumberOrderScene();
    scene.create();
    const { cards } = internals(scene);
    drop(scene, cards[0], 0);
    (scene as unknown as { tryAutoValidate: () => void }).tryAutoValidate();
    expect(mockAudio.playCorrect).not.toHaveBeenCalled();
    expect(mockAudio.playIncorrect).not.toHaveBeenCalled();
    expect((scene as unknown as { inputLocked: boolean }).inputLocked).toBe(false);
  });

  it("completes the game with a win on the final round", () => {
    const scene = new NumberOrderScene();
    scene.create();
    const s = scene as unknown as {
      rounds: Array<{ solution: number[] }>;
      roundIndex: number;
      renderRound: () => void;
      tryAutoValidate: () => void;
    };
    s.roundIndex = s.rounds.length - 1;
    s.renderRound();
    const last = s.rounds[s.roundIndex];
    fillBoard(scene, last.solution);
    s.tryAutoValidate();
    expect(mockAudio.playCorrect).toHaveBeenCalled();
    const callbacks = delayedCallbacks(scene);
    callbacks[callbacks.length - 1]();
    expect(mockAudio.playWin).toHaveBeenCalledTimes(1);
  });

  it("lays out two images for numeral 10 and one for single numerals", () => {
    const scene = new NumberOrderScene();
    scene.create();
    const imageMock = getMockFn((scene as unknown as { add: Record<string, unknown> }).add.image);
    const before = imageMock.mock.calls.length;
    (scene as unknown as { createCard: (n: number, x: number, y: number) => void }).createCard(
      10,
      100,
      260,
    );
    const added = imageMock.mock.calls.slice(before).map((c) => c[2] as string);
    expect(added).toContain("numeral_1");
    expect(added).toContain("numeral_0");
  });

  it("tolerates destroy failures when clearing a round", () => {
    const scene = new NumberOrderScene();
    scene.create();
    const s = scene as unknown as {
      roundObjects: Array<{ destroy: MockFn }>;
      slots: Array<{ zone: { destroy: MockFn }; outline: { destroy: MockFn } }>;
      clearRound: () => void;
    };
    s.roundObjects[0].destroy = vi.fn(() => {
      throw new Error("boom");
    }) as unknown as MockFn;
    s.slots[0].zone.destroy = vi.fn(() => {
      throw new Error("boom");
    }) as unknown as MockFn;
    s.slots[0].outline.destroy = vi.fn(() => {
      throw new Error("boom");
    }) as unknown as MockFn;
    expect(() => s.clearRound()).not.toThrow();
    expect(s.slots).toHaveLength(0);
  });

  it("detects whether a point is over any drop zone", () => {
    const scene = new NumberOrderScene();
    scene.create();
    const { slots } = internals(scene);
    const s = scene as unknown as { isOverAnyZone: (x: number, y: number) => boolean };
    expect(s.isOverAnyZone(slots[0].x, slots[0].y)).toBe(true);
    expect(s.isOverAnyZone(-9999, -9999)).toBe(false);
  });

  it("returnCardToSource is a no-op for source cards", () => {
    const scene = new NumberOrderScene();
    scene.create();
    const { cards } = internals(scene);
    const tweens = getMockFn((scene as unknown as { tweens: Record<string, unknown> }).tweens.add);
    const before = tweens.mock.calls.length;
    (scene as unknown as { returnCardToSource: (c: TestCard) => void }).returnCardToSource(
      cards[0],
    );
    expect(tweens.mock.calls.length).toBe(before);
  });
});

describe("NumberOrderScene spoken instruction", () => {
  beforeEach(() => {
    localStorage.clear();
    for (const fn of Object.values(mockSpeech)) {
      fn.mockClear();
    }
  });

  it("shows and speaks the rule when the round starts", () => {
    const scene = new NumberOrderScene();
    scene.create();

    const addText = (scene as unknown as { add: { text: { mock: { calls: unknown[][] } } } }).add
      .text;
    const call = addText.mock.calls.find(
      (c) => c[2] === "Put the numbers in order, smallest first.",
    );
    expect(call).toBeDefined();
    expect(mockSpeech.speakSentence).toHaveBeenCalledWith(
      "Put the numbers in order, smallest first.",
      true,
    );
  });
});
