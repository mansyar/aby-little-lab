import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type MockFn = ReturnType<typeof vi.fn>;

/**
 * Mock Phaser module. Scene files extend Phaser.Scene, which at runtime
 * resolves to MockScene. Each instance gets fresh mock methods in the
 * constructor, enabling per-test isolation.
 */
vi.mock("phaser", () => {
  /** Creates a mock game object with chainable methods used by Phaser scenes. */
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
      setVelocity: vi.fn().mockReturnThis(),
      setCollideWorldBounds: vi.fn().mockReturnThis(),
      setBounce: vi.fn().mockReturnThis(),
      setCircle: vi.fn().mockReturnThis(),
      fillStyle: vi.fn().mockReturnThis(),
      fillCircle: vi.fn().mockReturnThis(),
      slice: vi.fn().mockReturnThis(),
      fillPath: vi.fn().mockReturnThis(),
      clear: vi.fn().mockReturnThis(),
      getCenter: vi.fn(() => ({ x: 0, y: 0 })),
      beginPath: vi.fn().mockReturnThis(),
      moveTo: vi.fn().mockReturnThis(),
      lineTo: vi.fn().mockReturnThis(),
      strokePath: vi.fn().mockReturnThis(),
      lineStyle: vi.fn().mockReturnThis(),
      strokeRect: vi.fn().mockReturnThis(),
      strokeCircle: vi.fn().mockReturnThis(),
      destroy: vi.fn(),
      scaleX: 1,
      scaleY: 1,
      scene,
    };
  }

  class MockScene {
    add!: Record<string, MockFn>;
    scene!: Record<string, MockFn>;
    load!: Record<string, MockFn>;
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
    events!: Record<string, MockFn>;
    children!: Record<string, MockFn>;
    physics!: { add: Record<string, MockFn>; world: Record<string, MockFn> };

    constructor() {
      this.add = {
        rectangle: vi.fn(() => createMockGameObject(this)),
        text: vi.fn(() => createMockGameObject(this)),
        image: vi.fn(() => createMockGameObject(this)),
        container: vi.fn(() => createMockGameObject(this)),
        circle: vi.fn(() => createMockGameObject(this)),
        graphics: vi.fn(() => createMockGameObject(this)),
        zone: vi.fn(() => createMockGameObject(this)),
        particles: vi.fn(() => createMockGameObject(this)),
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
      this.load = {
        svg: vi.fn(),
        image: vi.fn(),
        audio: vi.fn(),
        on: vi.fn(),
        once: vi.fn(),
        off: vi.fn(),
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
        forEach: vi.fn(),
      };
      this.physics = {
        add: {
          image: vi.fn(() => createMockGameObject()),
        },
        world: {
          setBoundsCollision: vi.fn(),
          setBounds: vi.fn(),
        },
      };
    }
  }

  /** Mock for Phaser.Curves.Path — must be a class to support `new`. */
  class MockPath {
    add: MockFn;
    lineTo: MockFn;
    getPoints: MockFn;
    start: { x: number; y: number };
    end: { x: number; y: number };

    constructor() {
      this.add = vi.fn().mockReturnThis();
      this.lineTo = vi.fn().mockReturnThis();
      this.getPoints = vi.fn(() => []);
      this.start = { x: 0, y: 0 };
      this.end = { x: 0, y: 0 };
    }
  }

  /** Mock for Phaser.Geom.Rectangle — must be a class to support `new`. */
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
      Curves: { Path: MockPath },
      Geom: { Rectangle: MockRectangle },
    },
    Scene: MockScene,
    Game: vi.fn(),
    Scale: { FIT: 0, CENTER_BOTH: 0 },
    AUTO: "AUTO",
    Curves: { Path: MockPath },
    Geom: { Rectangle: MockRectangle },
  };
});

/** Mock AudioManager so scene tests can verify audio calls without real AudioContext. */
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

/** Mock ParentLock so tests can drive the hold-to-exit flow directly. */
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

/** Mock the TTS wrapper so tests can verify word speech without real voices. */
const { mockSpeech } = vi.hoisted(() => ({
  mockSpeech: {
    speakWord: vi.fn(() => true),
    isSpeechSupported: vi.fn(() => true),
  },
}));

vi.mock("../../utils/speech", () => mockSpeech);

import { earnSticker, updateSettings } from "../../utils/storage";
import { getWord, generateLetterTiles } from "../../game/wordLogic";
import { WordBuilderScene } from "../../scenes/WordBuilderScene";

/** Casts a Phaser-typed method to a MockFn for mock assertions. */
function getMockFn(fn: unknown): MockFn {
  return fn as unknown as MockFn;
}

/** Returns the current round of the scene. */
function getCurrentRound(scene: unknown): { target: string; choices: string[] } {
  const s = scene as { rounds: Array<{ target: string; choices: string[] }>; roundIndex: number };
  return s.rounds[s.roundIndex];
}

/** Card row y positions derived from the layout constants (centerY 384). */
const CARD_ROW_YS = [384 + 110, 384 + 270];

/** Returns the 4 card rectangles (created at the two card rows). */
function getCardRects(scene: unknown): Array<Record<string, MockFn>> {
  const s = scene as { add: Record<string, unknown> };
  const rectangleMock = getMockFn(s.add.rectangle);
  const cards: Array<Record<string, MockFn>> = [];
  for (let i = 0; i < rectangleMock.mock.calls.length; i++) {
    if (CARD_ROW_YS.includes(rectangleMock.mock.calls[i][1] as number)) {
      cards.push(rectangleMock.mock.results[i].value as Record<string, MockFn>);
    }
  }
  return cards;
}

/** Returns the letter images of one card (2×2 grid position by x/y). */
function getCardLetters(scene: unknown, cardIndex: number): Array<Record<string, MockFn>> {
  const s = scene as { add: Record<string, unknown> };
  const imageMock = getMockFn(s.add.image);
  const centerX = (scene as { cameras: { main: { centerX: number } } }).cameras.main.centerX;
  const letters: Array<Record<string, MockFn>> = [];
  for (let i = 0; i < imageMock.mock.calls.length; i++) {
    const [x, y, key] = imageMock.mock.calls[i] as [number, number, string];
    if (typeof key !== "string" || !key.startsWith("letter_")) continue;
    const row = y === CARD_ROW_YS[0] ? 0 : 1;
    const col = x < centerX ? 0 : 1;
    if (row * 2 + col === cardIndex) {
      letters.push(imageMock.mock.results[i].value as Record<string, MockFn>);
    }
  }
  return letters;
}

/** Returns the mascot image object (created with the mascot_idle texture). */
function getMascotImage(scene: unknown): Record<string, MockFn> {
  const s = scene as { add: Record<string, unknown> };
  const imageMock = getMockFn(s.add.image);
  const index = imageMock.mock.calls.findIndex((call) => call[2] === "mascot_idle");
  return imageMock.mock.results[index].value as Record<string, MockFn>;
}

/** Returns the 6 progress dot circle objects in creation order. */
function getProgressDots(scene: unknown): Array<Record<string, MockFn>> {
  const s = scene as { add: Record<string, unknown> };
  const circleMock = getMockFn(s.add.circle);
  return circleMock.mock.results.map((r) => r.value as Record<string, MockFn>);
}

/** Simulates a tap on an answer card by triggering its pointerdown callback. */
function tapCard(scene: unknown, cardIndex: number): void {
  const cards = getCardRects(scene);
  const card = cards[cardIndex];
  if (!card) throw new Error(`Card ${cardIndex} not found`);
  const onCalls = getMockFn(card.on).mock.calls;
  const pointerdownCall = onCalls.find((c) => c[0] === "pointerdown");
  if (pointerdownCall && typeof pointerdownCall[1] === "function") {
    (pointerdownCall[1] as () => void)();
  }
}

/** Fires the next-round delay (700ms) so the round advances. */
function fireNextRoundDelay(scene: unknown): void {
  const delayedCallMock = getMockFn(
    (scene as { time: Record<string, unknown> }).time.delayedCall,
  );
  const nextRoundCall = delayedCallMock.mock.calls.find((call) => call[0] === 700);
  expect(nextRoundCall).toBeDefined();
  if (nextRoundCall && typeof nextRoundCall[1] === "function") {
    (nextRoundCall[1] as () => void)();
  }
}

/** Taps the correct card and fires the next-round delay for the current round. */
function completeRound(scene: unknown): void {
  const round = getCurrentRound(scene);
  tapCard(scene, round.choices.indexOf(round.target));
  fireNextRoundDelay(scene);
}

/** Fires the auto-return delay (3000ms) and the fade-out completion callback. */
function fireAutoReturn(scene: unknown): void {
  const delayedCallMock = getMockFn(
    (scene as { time: Record<string, unknown> }).time.delayedCall,
  );
  const autoReturnCall = delayedCallMock.mock.calls.find((call) => call[0] === 3000);
  expect(autoReturnCall).toBeDefined();
  if (autoReturnCall && typeof autoReturnCall[1] === "function") {
    (autoReturnCall[1] as () => void)();
  }
  const fadeOutMock = getMockFn(
    (scene as { cameras: { main: Record<string, MockFn> } }).cameras.main.fadeOut,
  );
  const fadeOutCall = fadeOutMock.mock.calls.at(-1);
  if (fadeOutCall && typeof fadeOutCall[4] === "function") {
    (fadeOutCall[4] as () => void)();
  }
}

describe("WordBuilderScene shell", () => {
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
    mockSpeech.speakWord.mockClear();
    mockSpeech.isSpeechSupported.mockClear();
    for (const fn of Object.values(mockAudio)) {
      fn.mockClear();
    }
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("renders mascot, parent-locked Back button, and 3 progress dots for 3 words", () => {
    const scene = new WordBuilderScene();
    scene.create();

    const imageMock = getMockFn((scene as { add: Record<string, unknown> }).add.image);
    expect(imageMock.mock.calls.some((call) => call[2] === "mascot_idle")).toBe(true);

    const textMock = getMockFn((scene as { add: Record<string, unknown> }).add.text);
    const backCall = textMock.mock.calls.find((call) => call[2] === "← Back");
    expect(backCall).toBeDefined();
    const backIndex = textMock.mock.calls.indexOf(backCall);
    expect(
      getMockFn(textMock.mock.results[backIndex].value.setInteractive),
    ).toHaveBeenCalled();
    expect(mockParentLockInstances).toHaveLength(1);
    expect(mockParentLockInstances[0].onSuccess).toBeDefined();

    const circleMock = getMockFn((scene as { add: Record<string, unknown> }).add.circle);
    expect(circleMock.mock.calls).toHaveLength(3);

    expect((scene as { words: unknown[] }).words).toHaveLength(3);
    expect((scene as { inputLocked: boolean }).inputLocked).toBe(false);
  });

  it("returns to the Hub when the parent lock succeeds", () => {
    const scene = new WordBuilderScene();
    scene.create();

    mockParentLockInstances[0].onSuccess();

    const fadeOutMock = getMockFn(
      (scene as { cameras: { main: Record<string, unknown> } }).cameras.main.fadeOut,
    );
    expect(fadeOutMock).toHaveBeenCalled();
    const fadeOutCall = fadeOutMock.mock.calls.at(-1);
    if (fadeOutCall && typeof fadeOutCall[4] === "function") {
      (fadeOutCall[4] as () => void)();
    }
    expect((scene as { scene: Record<string, unknown> }).scene.start).toHaveBeenCalledWith(
      "Hub",
    );
  });
});

/** Current word under test (from scene state). */
function getCurrentWord(scene: unknown): string {
  const s = scene as { words: Array<{ word: string }>; wordIndex: number };
  return s.words[s.wordIndex].word;
}

/** Slot row Y (slots sit at centerY + 40 = 424). */
const SLOT_Y = 384 + 40;

/** Tile row Y (tiles sit at centerY + 220 = 604). */
const TILE_Y = 384 + 220;

/** Rectangles whose y is the slot row. */
function getSlotRects(scene: unknown): Array<Record<string, MockFn>> {
  const s = scene as { add: Record<string, MockFn> };
  const rectangleMock = getMockFn(s.add.rectangle);
  const slots: Array<Record<string, MockFn>> = [];
  for (let i = 0; i < rectangleMock.mock.calls.length; i++) {
    if (rectangleMock.mock.calls[i][1] === SLOT_Y) {
      slots.push(rectangleMock.mock.results[i].value as Record<string, MockFn>);
    }
  }
  return slots;
}

/** Rectangles whose y is the tile row. */
function getTileRects(scene: unknown): Array<Record<string, MockFn>> {
  const s = scene as { add: Record<string, MockFn> };
  const rectangleMock = getMockFn(s.add.rectangle);
  const tiles: Array<Record<string, MockFn>> = [];
  for (let i = 0; i < rectangleMock.mock.calls.length; i++) {
    if (rectangleMock.mock.calls[i][1] === TILE_Y) {
      tiles.push(rectangleMock.mock.results[i].value as Record<string, MockFn>);
    }
  }
  return tiles;
}

/** Simulates a tap on a letter tile by triggering its pointerdown callback. */
function tapTile(scene: unknown, tileIndex: number): void {
  const tiles = getTileRects(scene);
  const tile = tiles[tileIndex];
  if (!tile) throw new Error(`Tile ${tileIndex} not found`);
  const onCalls = getMockFn(tile.on).mock.calls;
  const pointerdownCall = onCalls.find((c) => c[0] === "pointerdown");
  if (pointerdownCall && typeof pointerdownCall[1] === "function") {
    (pointerdownCall[1] as () => void)();
  }
}

/** Letter images placed in the slot row (the letters locked in so far). */
function getSlotImages(scene: unknown): Array<{ key: string; x: number }> {
  const s = scene as { add: Record<string, MockFn> };
  const imageMock = getMockFn(s.add.image);
  return imageMock.mock.calls
    .filter((call) => call[1] === SLOT_Y && typeof call[2] === "string")
    .map((call) => ({ key: call[2] as string, x: call[0] as number }))
    .sort((a, b) => a.x - b.x);
}

/** Tile letters in on-screen order (scene private state, accessed in tests). */
function getTileValues(scene: unknown): string[] {
  return (scene as unknown as { tileLetterValues: string[] }).tileLetterValues;
}

describe("WordBuilderScene interaction", () => {
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
    mockSpeech.speakWord.mockClear();
    mockSpeech.isSpeechSupported.mockClear();
    for (const fn of Object.values(mockAudio)) {
      fn.mockClear();
    }
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("fills the next empty slot with a settle pop and locks the tile in", () => {
    const scene = new WordBuilderScene();
    scene.create();

    const word = getCurrentWord(scene);
    const tiles = getTileValues(scene);
    const correctIndex = tiles.indexOf(word[0]);

    tapTile(scene, correctIndex);

    expect(mockAudio.playPop).toHaveBeenCalledTimes(1);
    const slots = getSlotImages(scene);
    expect(slots).toHaveLength(1);
    expect(slots[0].key).toBe(`letter_${word[0].toLowerCase()}`);

    // The tile is locked in: tapping it again does not fill another slot.
    tapTile(scene, correctIndex);
    expect(getSlotImages(scene)).toHaveLength(1);
  });

  it("wiggles wrong tiles with a soft tone and no penalty", () => {
    const scene = new WordBuilderScene();
    scene.create();

    const word = getCurrentWord(scene);
    const tiles = getTileValues(scene);
    const wrongIndex = tiles.findIndex((letter) => letter !== word[0]);

    tapTile(scene, wrongIndex);

    expect(mockAudio.playIncorrect).toHaveBeenCalledTimes(1);
    expect(getSlotImages(scene)).toHaveLength(0);

    const wiggleTween = getMockFn(scene.tweens.add).mock.calls.find((call) => {
      const t = call[0] as { angle?: number; yoyo?: boolean };
      return t?.angle === 4 && t?.yoyo === true;
    });
    expect(wiggleTween).toBeDefined();
    const targets = (wiggleTween![0] as { targets: unknown[] }).targets;
    const wrongRect = getTileRects(scene)[wrongIndex];
    expect(targets).toContain(wrongRect);
  });

  it("fills slots strictly left-to-right in word order", () => {
    const scene = new WordBuilderScene();
    scene.create();

    const word = getCurrentWord(scene);
    const tiles = getTileValues(scene);
    for (const letter of word.slice(0, 2)) {
      tapTile(scene, tiles.indexOf(letter));
    }

    const slots = getSlotImages(scene);
    expect(slots).toHaveLength(2);
    expect(slots[0].key).toBe(`letter_${word[0].toLowerCase()}`);
    expect(slots[1].key).toBe(`letter_${word[1].toLowerCase()}`);
    expect(slots[0].x).toBeLessThan(slots[1].x);
  });

  it("locks input once the word is fully spelled", () => {
    const scene = new WordBuilderScene();
    scene.create();

    const word = getCurrentWord(scene);
    const tiles = getTileValues(scene);
    for (const letter of word) {
      tapTile(scene, tiles.indexOf(letter));
    }

    expect(getSlotImages(scene)).toHaveLength(word.length);
    expect((scene as { inputLocked: boolean }).inputLocked).toBe(true);

    tapTile(scene, 0);
    expect(getSlotImages(scene)).toHaveLength(word.length);
    expect(mockAudio.playPop).toHaveBeenCalledTimes(word.length);
  });
});

/** Letter images on the tile row, sorted left-to-right by x. */
function getTileLetters(scene: unknown): Array<{ key: string; x: number }> {
  const s = scene as { add: Record<string, MockFn> };
  const imageMock = getMockFn(s.add.image);
  return imageMock.mock.calls
    .filter((call) => call[1] === TILE_Y && typeof call[2] === "string")
    .map((call) => ({ key: call[2] as string, x: call[0] as number }))
    .sort((a, b) => a.x - b.x);
}

/** The prompt picture image (from the word's promptTexture). */
function getPromptImage(scene: unknown): Record<string, MockFn> | undefined {
  const s = scene as { add: Record<string, MockFn> };
  const imageMock = getMockFn(s.add.image);
  const word = getCurrentWord(scene);
  const texture = getWord(word)?.promptTexture;
  const call = imageMock.mock.calls.find((c) => c[2] === texture);
  return call
    ? (imageMock.mock.results[imageMock.mock.calls.indexOf(call)].value as Record<string, MockFn>)
    : undefined;
}

describe("WordBuilderScene round rendering", () => {
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
    mockSpeech.speakWord.mockClear();
    mockSpeech.isSpeechSupported.mockClear();
    for (const fn of Object.values(mockAudio)) {
      fn.mockClear();
    }
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("renders the prompt picture from the word's texture key", () => {
    const scene = new WordBuilderScene();
    scene.create();

    const prompt = getPromptImage(scene);
    expect(prompt).toBeDefined();
    expect(getMockFn(prompt!.setDisplaySize)).toHaveBeenCalledWith(180, 180);
  });

  it("renders one slot per letter of the word", () => {
    const scene = new WordBuilderScene();
    scene.create();

    const word = getCurrentWord(scene);
    const slots = getSlotRects(scene);
    expect(slots).toHaveLength(word.length);
    for (const slot of slots) {
      expect(getMockFn(slot.setStrokeStyle)).toHaveBeenCalled();
    }
  });

  it("renders 6 letter tiles with distractors from letter textures", () => {
    const scene = new WordBuilderScene();
    scene.create();

    const word = getCurrentWord(scene);
    const expectedTiles = generateLetterTiles(getWord(word)!.word);
    const tiles = getTileRects(scene);
    expect(tiles).toHaveLength(6);
    for (const tile of tiles) {
      expect(getMockFn(tile.setInteractive)).toHaveBeenCalled();
      expect(getMockFn(tile.setStrokeStyle)).toHaveBeenCalled();
    }

    const letters = getTileLetters(scene);
    expect(letters).toHaveLength(6);
    expect(letters.map((l) => l.key)).toEqual(
      expectedTiles.map((letter) => `letter_${letter.toLowerCase()}`),
    );
    const firstLetterMock = getMockFn(
      (scene as { add: Record<string, unknown> }).add.image,
    );
    const letterCall = firstLetterMock.mock.calls.find((c) => c[1] === TILE_Y);
    if (letterCall) {
      const letterIndex = firstLetterMock.mock.calls.indexOf(letterCall);
      const letterObj = firstLetterMock.mock.results[letterIndex]
        .value as Record<string, MockFn>;
      expect(getMockFn(letterObj.setDisplaySize)).toHaveBeenCalledWith(80, 80);
    }
  });

  it("speaks the word when SFX is enabled and stays silent when disabled", () => {
    const scene = new WordBuilderScene();
    scene.create();

    const word = getCurrentWord(scene);
    expect(mockSpeech.speakWord).toHaveBeenCalledWith(word, true);

    mockSpeech.speakWord.mockClear();
    updateSettings({ sfxEnabled: false });
    const silentScene = new WordBuilderScene();
    silentScene.create();
    expect(mockSpeech.speakWord).toHaveBeenCalledWith(word, false);
  });
});