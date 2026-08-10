import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type MockFn = ReturnType<typeof vi.fn>;

/**
 * Mock Phaser module (same infrastructure as navigation.test.ts) so real
 * scene classes can be instantiated and driven end-to-end.
 */
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
      arc: vi.fn().mockReturnThis(),
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
        add: vi.fn(),
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

/** Real storage implementation (no spies) so persistence is truly exercised. */
vi.mock("../../audio/AudioManager", () => ({
  AudioManager: {
    getInstance: () => mockAudio,
  },
}));

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

const { MockSettingsPanel, mockSettingsPanel, mockSettingsPanelDestroy } = vi.hoisted(() => {
  class MockSettingsPanel {
    constructor(...args: unknown[]) {
      mockSettingsPanel(...args);
    }

    destroy(): void {
      mockSettingsPanelDestroy();
    }
  }
  return {
    MockSettingsPanel,
    mockSettingsPanel: vi.fn(),
    mockSettingsPanelDestroy: vi.fn(),
  };
});

vi.mock("../../components/SettingsPanel", () => ({
  SettingsPanel: MockSettingsPanel,
}));

const { MockPwaToast, mockPwaToast, mockPwaToastDestroy } = vi.hoisted(() => {
  class MockPwaToast {
    constructor(...args: unknown[]) {
      mockPwaToast(...args);
    }

    destroy(): void {
      mockPwaToastDestroy();
    }
  }
  return {
    MockPwaToast,
    mockPwaToast: vi.fn(),
    mockPwaToastDestroy: vi.fn(),
  };
});

vi.mock("../../components/PwaToast", () => ({
  PwaToast: MockPwaToast,
}));

const { mockBridge } = vi.hoisted(() => ({
  mockBridge: {
    subscribe: vi.fn(() => vi.fn()),
    setHubActive: vi.fn(),
    updateNow: vi.fn(),
    updateAvailable: vi.fn(() => false),
    offlineReadyShown: vi.fn(() => false),
  },
}));

vi.mock("../../utils/pwaBridge", () => ({
  getPwaBridge: () => mockBridge,
}));

import { generateWordRound, getWord } from "../../game/wordLogic";
import { BootScene } from "../../scenes/BootScene";

/**
 * Mock the glyph font gate so the BootScene await resolves on a microtask
 * (track baloo2-glyphs_20260811).
 */
vi.mock("../../utils/fonts", () => ({
  ensureGlyphFontLoaded: vi.fn(() => Promise.resolve()),
}));
import { HubScene } from "../../scenes/HubScene";
import { PreloadScene } from "../../scenes/PreloadScene";
import { WordBuilderScene } from "../../scenes/WordBuilderScene";
import { WordMatchScene } from "../../scenes/WordMatchScene";
import { earnSticker, hasSticker } from "../../utils/storage";

const STORAGE_KEY = "abby-little-lab:v2";

function getMockFn(fn: unknown): MockFn {
  return fn as unknown as MockFn;
}

/** Fires the callback passed to the latest `cameras.main.fadeOut` call. */
function completeFadeOuts(scene: unknown): void {
  const fadeOut = getMockFn(
    (scene as { cameras: { main: { fadeOut: unknown } } }).cameras.main.fadeOut,
  );
  const last = fadeOut.mock.calls.at(-1);
  if (!last) throw new Error("no fadeOut call");
  (last[4] as () => void)();
}

/** Fires the callback of the LATEST time.delayedCall registered with `delay`. */
function fireDelayedCall(scene: unknown, delay: number): void {
  const calls = getMockFn((scene as { time: { delayedCall: unknown } }).time.delayedCall).mock
    .calls;
  const match = calls.filter((call) => call[0] === delay).at(-1);
  if (!match) throw new Error(`no delayedCall registered with delay ${delay}`);
  (match[1] as () => void)();
}

/** Fires the first registered listener for `event` on a mock game object. */
function fireObjectEvent(obj: unknown, event: string): void {
  const onMock = getMockFn((obj as { on: unknown }).on);
  const call = onMock.mock.calls.find((c) => c[0] === event);
  if (!call) throw new Error(`no '${event}' listener registered`);
  (call[1] as () => void)();
}

/** The tile rectangles added by HubScene (index = GAME_TILES position). */
function getTileRects(scene: unknown): unknown[] {
  const rectMock = getMockFn((scene as { add: { rectangle: unknown } }).add.rectangle);
  return rectMock.mock.results.map((r) => r.value);
}

describe("First Words integration flows", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal("screen", {
      orientation: { lock: vi.fn(() => Promise.resolve()) },
    });
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    Object.values(mockAudio).forEach((fn) => {
      (fn as MockFn).mockClear();
    });
    mockSettingsPanel.mockClear();
    mockSettingsPanelDestroy.mockClear();
    mockPwaToast.mockClear();
    mockPwaToastDestroy.mockClear();
    mockBridge.subscribe.mockClear();
    mockBridge.setHubActive.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("boot → hub → Find the Word → sticker → hub (auto-return with justEarned)", async () => {
    // Boot launches Preload (after the glyph font gate resolves).
    const boot = new BootScene();
    boot.create();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(getMockFn(boot.scene.start)).toHaveBeenCalledWith("Preload");

    // Preload finishes and transitions to the Hub.
    const preload = new PreloadScene();
    preload.create();
    completeFadeOuts(preload);
    expect(getMockFn(preload.scene.start)).toHaveBeenCalledWith("Hub");

    // Hub: tap the Find the Word tile (index 8); the real lazy loader runs.
    const hub = new HubScene();
    hub.create();
    const tiles = getTileRects(hub);
    expect(tiles).toHaveLength(18);
    fireObjectEvent(tiles[8], "pointerup");
    await new Promise((resolve) => setTimeout(resolve, 0)); // flush dynamic import
    completeFadeOuts(hub);
    const hubStarts = getMockFn(hub.scene.start).mock.calls.map((c) => c[0] as string);
    expect(hubStarts).toContain("WordMatch");

    // Find the Word: play all 6 rounds.
    const wordMatch = new WordMatchScene();
    wordMatch.create();
    for (let round = 0; round < 6; round++) {
      const scene = wordMatch as unknown as {
        rounds: Array<{ target: string; choices: string[] }>;
        roundIndex: number;
      };
      const current = scene.rounds[scene.roundIndex];
      const cardRects = getMockFn(wordMatch.add.rectangle).mock.results.map((r) => r.value);
      const correctIndex = current.choices.indexOf(current.target);
      // Cards are created in createCards; each round adds 4 new rects.
      const card = cardRects.at(-4 + correctIndex);
      fireObjectEvent(card, "pointerdown");
      fireDelayedCall(wordMatch, 700);
    }
    expect(hasSticker("word-match")).toBe(true);

    // Auto-return to the Hub with justEarned after the 3s delay.
    fireDelayedCall(wordMatch, 3000);
    completeFadeOuts(wordMatch);
    const startCalls = getMockFn(wordMatch.scene.start).mock.calls;
    expect(startCalls.at(-1)).toEqual(["Hub", { justEarned: "word-match" }]);
  });

  it("boot → hub → Build the Word → sticker (auto-return with justEarned)", async () => {
    const hub = new HubScene();
    hub.create();
    const tiles = getTileRects(hub);
    fireObjectEvent(tiles[9], "pointerup");
    await new Promise((resolve) => setTimeout(resolve, 0));
    completeFadeOuts(hub);
    expect(getMockFn(hub.scene.start).mock.calls.map((c) => c[0])).toContain("WordBuilder");

    const builder = new WordBuilderScene();
    builder.create();
    const state = builder as unknown as {
      words: Array<{ word: string }>;
      wordIndex: number;
      tileLetterValues: string[];
    };

    // Spell each of the 3 words by tapping its letters in order.
    for (let word = 0; word < 3; word++) {
      const current = state.words[state.wordIndex];
      for (const expected of current.word) {
        const tileIndex = state.tileLetterValues.indexOf(expected);
        expect(tileIndex).toBeGreaterThanOrEqual(0);
        const tileRects = getMockFn(builder.add.rectangle).mock.results.map((r) => r.value);
        fireObjectEvent(tileRects.at(-6 + tileIndex), "pointerdown");
      }
      fireDelayedCall(builder, 1200);
    }
    expect(hasSticker("word-builder")).toBe(true);

    fireDelayedCall(builder, 3000);
    completeFadeOuts(builder);
    const startCalls = getMockFn(builder.scene.start).mock.calls;
    expect(startCalls.at(-1)).toEqual(["Hub", { justEarned: "word-builder" }]);
  });

  it("persists both word stickers in localStorage across a reload and renders them earned", () => {
    // Simulate a prior session's completion via the real storage layer.
    earnSticker("word-match");
    earnSticker("word-builder");

    // Offline persistence: the save survives in localStorage.
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as {
      activeProfileId: string;
      profiles: Array<{ id: string; stickers: Record<string, { earned: boolean }> }>;
    };
    const activeProfile =
      saved.profiles.find((p) => p.id === saved.activeProfileId) ?? saved.profiles[0];
    expect(activeProfile.stickers["word-match"].earned).toBe(true);
    expect(activeProfile.stickers["word-builder"].earned).toBe(true);

    // A fresh Hub (reload) shows both stickers at the earned scale.
    const hub = new HubScene();
    hub.create();
    const imageMock = getMockFn(hub.add.image);
    const stickerCalls = imageMock.mock.calls.filter((call) =>
      ["sticker_word_match", "sticker_word_builder"].includes(call[2] as string),
    );
    expect(stickerCalls.map((c) => c[2])).toEqual(
      expect.arrayContaining(["sticker_word_match", "sticker_word_builder"]),
    );
    const earnedScale = 56 / 512;
    for (const call of stickerCalls) {
      const index = imageMock.mock.calls.indexOf(call);
      const image = imageMock.mock.results[index].value;
      const scaleMock = getMockFn((image as { setScale: unknown }).setScale);
      expect(scaleMock.mock.calls.some((c) => c[0] === earnedScale)).toBe(true);
    }
  });

  it("renders prompt pictures for reused-texture and new-SVG words in both games", () => {
    // Find the Word — drive rounds including OWL (reuses Professor Hoot art)
    // and SUN (new SVG). The scene is data-driven, so injecting rounds into
    // the real scene exercises renderRound → getWord → texture key end-to-end.
    const wordMatch = new WordMatchScene();
    wordMatch.create();
    const matchState = wordMatch as unknown as {
      rounds: Array<{ target: string; choices: string[] }>;
      roundIndex: number;
      renderRound: () => void;
    };
    // Returns the word or throws, avoiding non-null assertions (Biome rule).
    const requiredWord = (key: string) => {
      const word = getWord(key);
      if (!word) throw new Error(`Word "${key}" not found in pool`);
      return word;
    };
    matchState.rounds = [
      generateWordRound(requiredWord("OWL")),
      generateWordRound(requiredWord("SUN")),
      generateWordRound(requiredWord("DUCK")),
      generateWordRound(requiredWord("BEAR")),
    ];
    matchState.roundIndex = 0;
    matchState.renderRound();

    for (let round = 0; round < 4; round++) {
      const current = matchState.rounds[matchState.roundIndex];
      const correctIndex = current.choices.indexOf(current.target);
      const cardRects = getMockFn(wordMatch.add.rectangle).mock.results.map((r) => r.value);
      fireObjectEvent(cardRects.at(-4 + correctIndex), "pointerdown");
      fireDelayedCall(wordMatch, 700);
    }
    expect(hasSticker("word-match")).toBe(true);

    // Prompt pictures are the images scaled to 180x180 (mascot art and the
    // back button are not) — collect their texture keys.
    const imageCalls = getMockFn(wordMatch.add.image).mock.calls;
    const matchPromptKeys = imageCalls
      .map((call, index) => ({
        key: call[2] as string,
        obj: getMockFn(wordMatch.add.image).mock.results[index].value,
      }))
      .filter(({ obj }) =>
        getMockFn((obj as { setDisplaySize: unknown }).setDisplaySize).mock.calls.some(
          (c) => c[0] === 180 && c[1] === 180,
        ),
      )
      .map(({ key }) => key);
    expect(matchPromptKeys).toContain("mascot_idle"); // OWL reuses Hoot
    expect(matchPromptKeys).toContain("sm_sun"); // SUN uses the new SVG
    expect(matchPromptKeys).toContain("sm_duck"); // DUCK uses the new SVG
    expect(matchPromptKeys).toContain("toy_teddy_bear"); // BEAR reuses the teddy

    // Build the Word — same data-driven path with DUCK (new SVG) and BEAR.
    const builder = new WordBuilderScene();
    builder.create();
    const builderState = builder as unknown as {
      words: Array<{ word: string }>;
      wordIndex: number;
      tileLetterValues: string[];
      renderRound: () => void;
    };
    builderState.words = [
      (() => {
        const word = getWord("DUCK");
        if (!word) throw new Error('Word "DUCK" not found in pool');
        return word;
      })(),
      (() => {
        const word = getWord("BEAR");
        if (!word) throw new Error('Word "BEAR" not found in pool');
        return word;
      })(),
    ];
    builderState.wordIndex = 0;
    builderState.renderRound();

    for (let word = 0; word < 2; word++) {
      const current = builderState.words[builderState.wordIndex];
      for (const expected of current.word) {
        const tileIndex = builderState.tileLetterValues.indexOf(expected);
        expect(tileIndex).toBeGreaterThanOrEqual(0);
        const tileRects = getMockFn(builder.add.rectangle).mock.results.map((r) => r.value);
        fireObjectEvent(tileRects.at(-6 + tileIndex), "pointerdown");
      }
      fireDelayedCall(builder, 1200);
    }
    expect(hasSticker("word-builder")).toBe(true);

    const builderPromptKeys = getMockFn(builder.add.image)
      .mock.calls.map((call, index) => ({
        key: call[2] as string,
        obj: getMockFn(builder.add.image).mock.results[index].value,
      }))
      .filter(({ obj }) =>
        getMockFn((obj as { setDisplaySize: unknown }).setDisplaySize).mock.calls.some(
          (c) => c[0] === 180 && c[1] === 180,
        ),
      )
      .map(({ key }) => key);
    expect(builderPromptKeys).toContain("sm_duck");
    expect(builderPromptKeys).toContain("toy_teddy_bear");
  });
});
