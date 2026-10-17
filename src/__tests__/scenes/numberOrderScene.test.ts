import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type MockFn = ReturnType<typeof vi.fn>;

vi.mock("phaser", () => {
  function createMockGameObject(scene?: unknown): Record<string, MockFn | number> {
    return {
      setInteractive: vi.fn().mockReturnThis(),
      disableInteractive: vi.fn(),
      on: vi.fn().mockReturnThis(),
      off: vi.fn().mockReturnThis(),
      setOrigin: vi.fn().mockReturnThis(),
      setScale: vi.fn().mockReturnThis(),
      setTexture: vi.fn().mockReturnThis(),
      setDepth: vi.fn().mockReturnThis(),
      setStyle: vi.fn().mockReturnThis(),
      setFontSize: vi.fn().mockReturnThis(),
      setText: vi.fn().mockReturnThis(),
      setColor: vi.fn().mockReturnThis(),
      setVisible: vi.fn().mockReturnThis(),
      setAlpha: vi.fn().mockReturnThis(),
      setPosition: vi.fn().mockReturnThis(),
      setSize: vi.fn().mockReturnThis(),
      setDisplaySize: vi.fn().mockReturnThis(),
      setStrokeStyle: vi.fn().mockReturnThis(),
      setFillStyle: vi.fn().mockReturnThis(),
      fillStyle: vi.fn().mockReturnThis(),
      fillCircle: vi.fn().mockReturnThis(),
      lineStyle: vi.fn().mockReturnThis(),
      lineBetween: vi.fn().mockReturnThis(),
      strokeRect: vi.fn().mockReturnThis(),
      destroy: vi.fn(),
      scaleX: 1,
      scaleY: 1,
      scene: scene as MockFn,
    };
  }

  class MockScene {
    add!: Record<string, MockFn>;
    scene!: Record<string, MockFn>;
    input!: Record<string, MockFn>;
    cameras!: {
      main: Record<string, MockFn | number> & {
        centerX: number;
        centerY: number;
        width: number;
        height: number;
      };
    };
    scale!: Record<string, MockFn | number> & { width: number; height: number };
    time!: Record<string, MockFn>;
    tweens!: Record<string, MockFn>;
    sys!: { events: Record<string, MockFn> };
    events!: Record<string, MockFn>;
    children!: Record<string, MockFn>;

    constructor() {
      this.add = {
        rectangle: vi.fn(() => createMockGameObject(this)),
        text: vi.fn(() => createMockGameObject(this)),
        image: vi.fn(() => createMockGameObject(this)),
        container: vi.fn(() => createMockGameObject(this)),
        circle: vi.fn(() => createMockGameObject(this)),
        graphics: vi.fn(() => createMockGameObject(this)),
        zone: vi.fn(() => createMockGameObject(this)),
      };
      this.scene = {
        start: vi.fn(),
        stop: vi.fn(),
        launch: vi.fn(),
        get: vi.fn(),
        switch: vi.fn(),
        sleep: vi.fn(),
        wake: vi.fn(),
        pause: vi.fn(),
        resume: vi.fn(),
      };
      this.input = {
        on: vi.fn(),
        off: vi.fn(),
        setDraggable: vi.fn(),
      };
      this.cameras = {
        main: {
          setBackgroundColor: vi.fn(),
          fadeIn: vi.fn(),
          fadeOut: vi.fn(),
          setZoom: vi.fn(),
          zoomTo: vi.fn(),
          centerX: 512,
          centerY: 384,
          width: 1024,
          height: 768,
        },
      };
      this.scale = {
        setSize: vi.fn(),
        on: vi.fn(),
        width: 1024,
        height: 768,
      };
      this.time = {
        delayedCall: vi.fn(() => ({ remove: vi.fn() })),
        addEvent: vi.fn(),
      };
      this.tweens = {
        add: vi.fn(() => ({ remove: vi.fn(), stop: vi.fn() })),
      };
      this.sys = {
        events: {
          on: vi.fn(),
          once: vi.fn(),
          off: vi.fn(),
        },
      };
      this.events = this.sys.events;
      this.children = {
        bringToTop: vi.fn(),
        forEach: vi.fn(),
      };
    }
  }

  class MockRectangle {
    static Contains = vi.fn(() => true);

    constructor(
      readonly x: number,
      readonly y: number,
      readonly width: number,
      readonly height: number,
    ) {}
  }

  return {
    default: {
      Scene: MockScene,
      Game: vi.fn(),
      Scale: { FIT: 0, CENTER_BOTH: 0 },
      AUTO: "AUTO",
      Geom: { Rectangle: MockRectangle },
    },
    Scene: MockScene,
    Game: vi.fn(),
    Scale: { FIT: 0, CENTER_BOTH: 0 },
    AUTO: "AUTO",
    Geom: { Rectangle: MockRectangle },
  };
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
  let matchMediaMock: MockFn;

  beforeEach(() => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    matchMediaMock = vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    vi.stubGlobal("matchMedia", matchMediaMock);
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
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );
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
    dragging: boolean;
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
    expect(cards[0].dragging).toBe(true);
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
    cards[0].dragging = false;
    const pointerup = lastHandler(cards[0].container, "pointerup");
    pointerup();
    expect(cards[0].slotIndex).toBeNull();
    expect(slots[0].occupiedBy).toBeNull();

    // While dragging, pointerup does nothing
    drop(scene, cards[1], 1);
    cards[1].dragging = true;
    const pointerup2 = lastHandler(cards[1].container, "pointerup");
    pointerup2();
    expect(cards[1].slotIndex).toBe(1);
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
