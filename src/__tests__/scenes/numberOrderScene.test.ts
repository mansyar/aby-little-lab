import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type MockFn = ReturnType<typeof vi.fn>;

vi.mock("phaser", () => {
  function createMockGameObject(scene?: unknown): Record<string, MockFn> {
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
      lineStyle: vi.fn().mockReturnThis(),
      lineBetween: vi.fn().mockReturnThis(),
      strokeRect: vi.fn().mockReturnThis(),
      destroy: vi.fn(),
      scaleX: 1,
      scaleY: 1,
      scene,
    };
  }

  class MockScene {
    add!: Record<string, MockFn>;
    scene!: Record<string, MockFn>;
    input!: Record<string, MockFn>;
    cameras!: {
      main: Record<string, MockFn> & {
        centerX: number;
        centerY: number;
        width: number;
        height: number;
      };
    };
    scale!: Record<string, MockFn> & { width: number; height: number };
    time!: Record<string, MockFn>;
    tweens!: Record<string, MockFn>;
    sys!: { events: Record<string, MockFn> };
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

const { getAdaptiveBandShiftMock } = vi.hoisted(() => ({
  getAdaptiveBandShiftMock: vi.fn((): -1 | 0 | 1 => 0),
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

function fireDrop(scene: unknown, zone: unknown): void {
  const card = getCards(scene).at(-1) as Record<string, MockFn>;
  const dropHandler = getMockFn(card.on).mock.calls.find((c) => c[0] === "drop")?.[1];
  if (typeof dropHandler === "function") {
    dropHandler(undefined, zone);
  }
}

function fireDragEnd(scene: unknown): void {
  const card = getCards(scene).at(-1) as Record<string, MockFn>;
  const dragEndHandler = getMockFn(card.on).mock.calls.find((c) => c[0] === "dragend")?.[1];
  if (typeof dragEndHandler === "function") {
    dragEndHandler();
  }
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

    const textMock = getMockFn((scene as { add: Record<string, unknown> }).add.text);
    expect(textMock.mock.calls.find((call) => call[2] === "← Back")).toBeDefined();

    expect(mockParentLockInstances).toHaveLength(1);
    expect((mockParentLockInstances[0] as { onSuccess: unknown }).onSuccess).toBeDefined();

    const circleMock = getMockFn((scene as { add: Record<string, unknown> }).add.circle);
    expect(circleMock.mock.calls).toHaveLength(6);

    expect((scene as { rounds: unknown[] }).rounds).toHaveLength(6);
    expect((scene as { inputLocked: boolean }).inputLocked).toBe(false);
  });

  it("renders 3 cards, zones, and dashed outlines for the first (easy band) round", () => {
    const scene = new NumberOrderScene();
    scene.create();

    const round = getCurrentRound(scene);
    expect(round.shuffled).toHaveLength(3);
    expect(round.solution).toHaveLength(3);

    expect(getCards(scene)).toHaveLength(3);
    expect(getZones(scene)).toHaveLength(3);
    const graphicsMock = getMockFn((scene as { add: Record<string, unknown> }).add.graphics);
    expect(graphicsMock.mock.calls).toHaveLength(3);
  });
});
