import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RoundNarrator, type RoundNarratorOptions } from "../../components/RoundNarrator";
import { type MockObject, MockScene } from "../helpers/phaserMock";

type MockFn = ReturnType<typeof vi.fn>;
type LifecycleListener = (event: { kind: string }) => void;

vi.mock("phaser", async () => {
  const { createPhaserModuleMock } = await import("../helpers/phaserMock");
  return createPhaserModuleMock().module;
});

const { mockSettings, getSettingsMock } = vi.hoisted(() => ({
  mockSettings: { sfxEnabled: true },
  getSettingsMock: vi.fn(),
}));

vi.mock("../../utils/storage", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  getSettings: () => getSettingsMock(),
}));

const { mockSpeech } = vi.hoisted(() => ({
  mockSpeech: {
    speakSentence: vi.fn((_text: string, _enabled: boolean) => true),
    isSpeechSupported: vi.fn(() => true),
    onSpeechLifecycle: vi.fn((_listener: LifecycleListener) => vi.fn()),
  },
}));

vi.mock("../../utils/speech", () => mockSpeech);

vi.mock("../../utils/motion", () => ({
  isReducedMotion: () => false,
}));

const RULE = "Tap the face that shows how Aby feels.";
const TEST_VOICE = { name: "Test Voice", lang: "en-US" } as SpeechSynthesisVoice;

let voices: SpeechSynthesisVoice[] = [];
let voicesListeners: Array<() => void> = [];
let synth: {
  getVoices: MockFn;
  addEventListener?: MockFn;
  removeEventListener: MockFn;
};

/** Replaces the installed voices and fires the engine's voiceschanged event. */
function settle(next: SpeechSynthesisVoice[]): void {
  voices = next;
  for (const listener of [...voicesListeners]) listener();
}

/** Creates a mock scene whose objects are not registered globally. */
function createScene(): MockScene {
  return new MockScene([]);
}

/** Every `icon_speaker` image the narrator created. */
function glyphs(scene: MockScene): MockObject[] {
  return scene.add.image.mock.results
    .map((result) => result.value as MockObject)
    .filter((object) => object.args?.[2] === "icon_speaker");
}

/** The glyph currently on screen (the most recent one not destroyed). */
function liveGlyph(scene: MockScene): MockObject {
  const glyph = glyphs(scene)
    .filter((object) => object.destroy.mock.calls.length === 0)
    .at(-1);
  if (!glyph) throw new Error("the narrator created no live glyph");
  return glyph;
}

/** Every rule line the narrator created, newest first. */
function labels(scene: MockScene): MockObject[] {
  return scene.add.text.mock.results.map((result) => result.value as MockObject).reverse();
}

function options(overrides: Partial<RoundNarratorOptions> = {}): RoundNarratorOptions {
  return { x: 700, y: 200, replay: vi.fn(), ...overrides };
}

function ruleLabel(): NonNullable<RoundNarratorOptions["label"]> {
  return { text: RULE, x: 512, y: 112, wrapWidth: 620 };
}

describe("RoundNarrator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSettings.sfxEnabled = true;
    getSettingsMock.mockImplementation(() => mockSettings);
    mockSpeech.isSpeechSupported.mockReturnValue(true);
    mockSpeech.onSpeechLifecycle.mockImplementation(() => vi.fn());
    voices = [];
    voicesListeners = [];
    synth = {
      getVoices: vi.fn(() => voices),
      addEventListener: vi.fn((event: string, listener: () => void) => {
        if (event === "voiceschanged") voicesListeners.push(listener);
      }),
      removeEventListener: vi.fn((event: string, listener: () => void) => {
        if (event !== "voiceschanged") return;
        voicesListeners = voicesListeners.filter((entry) => entry !== listener);
      }),
    };
    vi.stubGlobal("speechSynthesis", synth);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("creates one replay glyph at the requested position with the shared surface", () => {
    const scene = createScene();
    const narrator = new RoundNarrator(scene as never, options());

    const glyph = liveGlyph(scene);
    expect(glyph.args).toEqual([700, 200, "icon_speaker"]);
    expect(glyph.setDisplaySize).toHaveBeenCalledWith(96, 96);
    // The engine's frame-based default covers the visible icon: no custom area.
    expect(glyph.setInteractive).toHaveBeenCalledWith();
    expect(narrator.glyph.button).toBe(glyph);
  });

  it("replays the current prompt when the glyph is tapped", () => {
    const scene = createScene();
    const replay = vi.fn();
    new RoundNarrator(scene as never, options({ replay }));

    for (const entry of liveGlyph(scene).allHandlers) {
      if (entry.name === "pointerdown") entry.cb();
    }

    expect(replay).toHaveBeenCalledTimes(1);
  });

  it("shows the active-speaking grammar from the speech lifecycle", () => {
    const scene = createScene();
    new RoundNarrator(scene as never, options());

    const glyph = liveGlyph(scene);
    expect(mockSpeech.onSpeechLifecycle).toHaveBeenCalledTimes(1);
    const listener = mockSpeech.onSpeechLifecycle.mock.calls[0]?.[0];
    expect(listener).toBeTypeOf("function");
    if (!listener) return;

    listener({ kind: "speech:start" });
    expect(glyph.setTint).toHaveBeenCalledWith(0x68d391);

    listener({ kind: "speech:end" });
    expect(glyph.clearTint).toHaveBeenCalled();
    expect(glyph.setAlpha).toHaveBeenLastCalledWith(1);
  });

  it("reads the SFX toggle through getSettings and dims the glyph when off", () => {
    mockSettings.sfxEnabled = false;
    const scene = createScene();
    new RoundNarrator(scene as never, options());

    expect(getSettingsMock).toHaveBeenCalled();
    const glyph = liveGlyph(scene);
    expect(glyph.setTint).toHaveBeenCalledWith(0xa0aec0);
    expect(glyph.setAlpha).toHaveBeenCalledWith(0.6);
    expect(mockSpeech.onSpeechLifecycle).not.toHaveBeenCalled();
  });

  it("writes a rule line and announces it once when asked", () => {
    const scene = createScene();
    const narrator = new RoundNarrator(
      scene as never,
      options({ label: ruleLabel(), announce: RULE }),
    );

    const label = labels(scene)[0];
    expect(label?.args?.slice(0, 3)).toEqual([512, 112, RULE]);
    expect(label?.setOrigin).toHaveBeenCalledWith(0.5);
    expect(narrator.label).toBe(label);
    expect(mockSpeech.speakSentence).toHaveBeenCalledTimes(1);
    expect(mockSpeech.speakSentence).toHaveBeenCalledWith(RULE, true);
  });

  it("does not announce a rule line while the caption fallback is up", () => {
    mockSettings.sfxEnabled = false;
    const scene = createScene();
    new RoundNarrator(
      scene as never,
      options({ label: ruleLabel(), announce: RULE, caption: { onChange: vi.fn() } }),
    );

    expect(mockSpeech.speakSentence).not.toHaveBeenCalled();
  });

  describe("caption fallback", () => {
    it("keeps the spoken path while the voice list is still unknown", () => {
      const scene = createScene();
      const onChange = vi.fn();
      const narrator = new RoundNarrator(
        scene as never,
        options({ label: ruleLabel(), announce: RULE, caption: { onChange } }),
      );

      expect(narrator.isCaptioning).toBe(false);
      expect(onChange).not.toHaveBeenCalled();
      expect(liveGlyph(scene).setTint).not.toHaveBeenCalled();
      expect(mockSpeech.speakSentence).toHaveBeenCalledTimes(1);
    });

    it("captions the displayed round once the engine settles on no voices", () => {
      const scene = createScene();
      const onChange = vi.fn();
      const narrator = new RoundNarrator(
        scene as never,
        options({ label: ruleLabel(), announce: RULE, caption: { onChange } }),
      );
      const firstGlyph = liveGlyph(scene);
      const firstLabel = labels(scene)[0];

      settle([]);

      expect(narrator.isCaptioning).toBe(true);
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith(true);

      const rebuilt = liveGlyph(scene);
      expect(rebuilt).not.toBe(firstGlyph);
      expect(firstGlyph.destroy).toHaveBeenCalled();
      expect(rebuilt.setTint).toHaveBeenCalledWith(0xa0aec0);
      expect(rebuilt.setAlpha).toHaveBeenCalledWith(0.6);
      expect(firstLabel?.destroy).toHaveBeenCalled();
      // The rule was already spoken for this round — it is never re-spoken.
      expect(mockSpeech.speakSentence).toHaveBeenCalledTimes(1);
    });

    it("stays on the spoken path when the engine settles with a voice", () => {
      const scene = createScene();
      const onChange = vi.fn();
      const narrator = new RoundNarrator(
        scene as never,
        options({ label: ruleLabel(), announce: RULE, caption: { onChange } }),
      );
      const glyph = liveGlyph(scene);

      settle([TEST_VOICE]);

      expect(narrator.isCaptioning).toBe(false);
      expect(onChange).not.toHaveBeenCalled();
      expect(liveGlyph(scene)).toBe(glyph);
      expect(mockSpeech.speakSentence).toHaveBeenCalledTimes(1);
    });

    it("flips back to spoken without re-speaking the rule", () => {
      const scene = createScene();
      const onChange = vi.fn();
      const narrator = new RoundNarrator(
        scene as never,
        options({ label: ruleLabel(), announce: RULE, caption: { onChange } }),
      );

      settle([]);
      expect(narrator.isCaptioning).toBe(true);
      onChange.mockClear();
      mockSpeech.speakSentence.mockClear();

      settle([TEST_VOICE]);

      expect(narrator.isCaptioning).toBe(false);
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith(false);
      const glyph = liveGlyph(scene);
      expect(glyph.setTint).not.toHaveBeenCalled();
      // The scene speaks the scenario inline; the narrator must not speak.
      expect(mockSpeech.speakSentence).not.toHaveBeenCalled();
    });

    it("decides immediately on an engine that never fires voiceschanged", () => {
      synth = {
        getVoices: vi.fn(() => []),
        addEventListener: undefined,
        removeEventListener: vi.fn(),
      };
      vi.stubGlobal("speechSynthesis", synth);
      const scene = createScene();
      const onChange = vi.fn();
      const narrator = new RoundNarrator(
        scene as never,
        options({ label: ruleLabel(), announce: RULE, caption: { onChange } }),
      );

      expect(narrator.isCaptioning).toBe(true);
      expect(liveGlyph(scene).setTint).toHaveBeenCalledWith(0xa0aec0);
      expect(mockSpeech.speakSentence).not.toHaveBeenCalled();
      expect(onChange).not.toHaveBeenCalled();
    });

    it("re-reads the decision at a round boundary without notifying", () => {
      const scene = createScene();
      const onChange = vi.fn();
      const narrator = new RoundNarrator(
        scene as never,
        options({ label: ruleLabel(), announce: RULE, caption: { onChange } }),
      );

      mockSettings.sfxEnabled = false;
      narrator.refreshCaptionFallback();

      expect(narrator.isCaptioning).toBe(true);
      expect(onChange).not.toHaveBeenCalled();
      // The silent refresh leaves the live glyph untouched; the round's own
      // render decides how to show the caption.
      expect(glyphs(scene)).toHaveLength(1);
    });
  });

  describe("teardown", () => {
    it("drives the glyph's active grammar for non-Web-Speech replay", () => {
      const scene = createScene();
      const narrator = new RoundNarrator(scene as never, options());
      const glyph = liveGlyph(scene);

      narrator.setActive(true);
      expect(glyph.setTint).toHaveBeenCalledWith(0x68d391);
      narrator.setActive(false);
      expect(glyph.clearTint).toHaveBeenCalled();
      expect(glyph.setAlpha).toHaveBeenLastCalledWith(1);
    });

    it("subscribes once per unmuted glyph and releases each on rebuild and destroy", () => {
      const scene = createScene();
      const unsubscribes: MockFn[] = [];
      mockSpeech.onSpeechLifecycle.mockImplementation(() => {
        const unsubscribe = vi.fn();
        unsubscribes.push(unsubscribe);
        return unsubscribe;
      });
      const narrator = new RoundNarrator(
        scene as never,
        options({ label: ruleLabel(), caption: { onChange: vi.fn() } }),
      );

      expect(mockSpeech.onSpeechLifecycle).toHaveBeenCalledTimes(1);

      // Caption mode dims the rebuilt glyph, so it holds no subscription.
      settle([]);
      expect(mockSpeech.onSpeechLifecycle).toHaveBeenCalledTimes(1);
      expect(unsubscribes[0]).toHaveBeenCalledTimes(1);

      settle([TEST_VOICE]);
      expect(mockSpeech.onSpeechLifecycle).toHaveBeenCalledTimes(2);

      narrator.destroy();
      expect(unsubscribes[1]).toHaveBeenCalledTimes(1);
    });

    it("destroys the glyph and rule line and stops listening for voices", () => {
      const scene = createScene();
      const narrator = new RoundNarrator(
        scene as never,
        options({ label: ruleLabel(), caption: { onChange: vi.fn() } }),
      );
      const glyph = liveGlyph(scene);
      const label = labels(scene)[0];

      narrator.destroy();

      expect(glyph.destroy).toHaveBeenCalledTimes(1);
      expect(label?.destroy).toHaveBeenCalledTimes(1);
      expect(synth.removeEventListener).toHaveBeenCalledTimes(1);
      expect(voicesListeners).toHaveLength(0);

      // A late settle after teardown must not rebuild anything.
      settle([]);
      expect(glyphs(scene)).toHaveLength(1);
    });
  });
});
