import { AudioManager } from "../../audio/AudioManager";
import {
  AUDIO_IDENTITIES,
  DEFAULT_IDENTITY,
  descendingContour,
  identityForGameId,
  winTempoForBudget,
} from "../../game/audioIdentity";
import type { GameId } from "../../types";
import { load } from "../../utils/storage";

/**
 * Speech lifecycle double: AudioManager subscribes once at init(), so the test
 * needs a handle on that listener to drive start/end/error deterministically.
 */
const speechHarness = vi.hoisted(() => {
  const listeners = new Set<(event: { kind: string }) => void>();
  return {
    listeners,
    emit(kind: string): void {
      for (const listener of listeners) {
        listener({ kind });
      }
    },
    reset(): void {
      listeners.clear();
    },
  };
});

vi.mock("../../utils/speech", () => ({
  onSpeechLifecycle: (listener: (event: { kind: string }) => void) => {
    speechHarness.listeners.add(listener);
    return () => {
      speechHarness.listeners.delete(listener);
    };
  },
}));

type MockFn = ReturnType<typeof vi.fn>;

interface MockAudioElement {
  src: string;
  loop: boolean;
  volume: number;
  currentTime: number;
  paused: boolean;
  play: MockFn;
  pause: MockFn;
  load: MockFn;
}

interface MockOscillator {
  type: string;
  frequency: { value: number };
  connect: MockFn;
  start: MockFn;
  stop: MockFn;
}

interface MockGainNode {
  gain: { value: number };
  connect: MockFn;
}

/**
 * One synthesized note captured with its own oscillator and gain node, so
 * trio notes can be asserted individually instead of through the shared
 * harness mocks.
 */
interface CapturedNote {
  oscillator: MockOscillator;
  gainNode: MockGainNode;
}

interface MockAudioContext {
  state: string;
  currentTime: number;
  destination: object;
  createOscillator: MockFn;
  createGain: MockFn;
  resume: MockFn;
  close: MockFn;
}

describe("AudioManager", () => {
  let manager: AudioManager;
  let mockAudios: MockAudioElement[];
  let mockOscillator: MockOscillator;
  let mockGainNode: MockGainNode;
  let mockAudioContext: MockAudioContext;
  let audioContextConstructor: MockFn;
  let audioConstructor: MockFn;

  beforeEach(() => {
    localStorage.clear();
    mockAudios = [];

    mockOscillator = {
      type: "sine",
      frequency: { value: 0 },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };

    mockGainNode = {
      gain: { value: 0 },
      connect: vi.fn(),
    };

    mockAudioContext = {
      state: "running",
      currentTime: 0,
      destination: {},
      createOscillator: vi.fn(() => mockOscillator),
      createGain: vi.fn(() => mockGainNode),
      resume: vi.fn(),
      close: vi.fn(),
    };

    // biome-ignore lint/complexity/useArrowFunction: Must use function expression — arrow functions cannot be used as constructors with new
    audioContextConstructor = vi.fn(function () {
      return mockAudioContext;
    });
    vi.stubGlobal("AudioContext", audioContextConstructor);

    // biome-ignore lint/complexity/useArrowFunction: Must use function expression — arrow functions cannot be used as constructors with new
    audioConstructor = vi.fn(function (src?: string) {
      const audio: MockAudioElement = {
        src: src ?? "",
        loop: false,
        volume: 1,
        currentTime: 0,
        paused: true,
        play: vi.fn(() => Promise.resolve()),
        pause: vi.fn(),
        load: vi.fn(),
      };
      mockAudios.push(audio);
      return audio;
    });
    vi.stubGlobal("Audio", audioConstructor);

    manager = new AudioManager();
  });

  afterEach(() => {
    // init() now owns app-wide listeners; tear the manager down so a listener
    // from one case can never react to another case's visibility events.
    manager.destroy();
    vi.unstubAllGlobals();
  });

  function findAudioBySrc(srcPart: string): MockAudioElement | undefined {
    return mockAudios.find((a) => a.src.includes(srcPart));
  }

  describe("init()", () => {
    it("creates an AudioContext", () => {
      manager.init();
      expect(audioContextConstructor).toHaveBeenCalledTimes(1);
    });

    it("creates BGM audio element with loop enabled", () => {
      manager.init();
      const bgm = findAudioBySrc("bgm");
      expect(bgm).toBeDefined();
      expect(bgm?.loop).toBe(true);
    });

    it("creates BGM audio element with exact runtime URL /audio/bgm.mp3", () => {
      manager.init();
      const bgm = findAudioBySrc("bgm");
      expect(bgm).toBeDefined();
      expect(bgm?.src).toBe("/audio/bgm.mp3");
    });

    it("sets BGM audio element volume to a comfortable level below maximum", () => {
      manager.init();
      const bgm = findAudioBySrc("bgm");
      expect(bgm).toBeDefined();
      expect(bgm?.volume).toBeGreaterThan(0);
      expect(bgm?.volume).toBeLessThan(1.0);
    });

    it("does not create file audio elements for synthesized SFX", () => {
      manager.init();
      expect(audioConstructor).toHaveBeenCalledTimes(1);
      expect(audioConstructor).toHaveBeenCalledWith("/audio/bgm.mp3");
    });

    it("loads bgmEnabled setting from storage (defaults to true)", () => {
      manager.init();
      manager.playBGM();
      const bgm = findAudioBySrc("bgm");
      expect(bgm?.play).toHaveBeenCalled();
    });

    it("respects bgmEnabled=false from storage on init", () => {
      const data = load();
      data.settings.bgmEnabled = false;
      // Simulate a legacy v1 save: force re-migration so settings flow through.
      localStorage.removeItem("abby-little-lab:v2");
      localStorage.setItem("abby-little-lab:v1", JSON.stringify(data));

      manager.init();
      manager.playBGM();
      const bgm = findAudioBySrc("bgm");
      expect(bgm?.play).not.toHaveBeenCalled();
    });
  });

  describe("getInstance()", () => {
    it("returns an AudioManager instance", () => {
      const instance = AudioManager.getInstance();
      expect(instance).toBeInstanceOf(AudioManager);
    });

    it("returns the same instance on subsequent calls", () => {
      const first = AudioManager.getInstance();
      const second = AudioManager.getInstance();
      expect(first).toBe(second);
    });
  });

  describe("playBGM()", () => {
    it("plays the BGM audio element", () => {
      manager.init();
      manager.playBGM();
      const bgm = findAudioBySrc("bgm");
      expect(bgm?.play).toHaveBeenCalled();
    });

    it("does nothing when BGM is disabled", () => {
      manager.init();
      manager.setBGMEnabled(false);
      manager.playBGM();
      const bgm = findAudioBySrc("bgm");
      expect(bgm?.play).not.toHaveBeenCalled();
    });

    it("handles promise rejection from play() without throwing", async () => {
      manager.init();
      const bgm = findAudioBySrc("bgm");
      expect(bgm).toBeDefined();
      if (!bgm) return;
      bgm.play = vi.fn(() => Promise.reject(new Error("NotAllowed")));

      manager.playBGM();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  });

  describe("resume()", () => {
    it("resumes a suspended AudioContext from a user gesture", () => {
      mockAudioContext.state = "suspended";
      manager.init();

      manager.resume();

      expect(mockAudioContext.resume).toHaveBeenCalledTimes(1);
    });
  });

  describe("playSFX()", () => {
    it("routes legacy SFX calls to synthesized audio", () => {
      manager.init();

      manager.playSFX("pop");

      expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(1);
    });
  });

  describe("pauseBGM()", () => {
    it("pauses the BGM audio element", () => {
      manager.init();
      manager.playBGM();
      manager.pauseBGM();
      const bgm = findAudioBySrc("bgm");
      expect(bgm?.pause).toHaveBeenCalled();
    });
  });

  describe("setBGMEnabled()", () => {
    it("updates bgmEnabled in localStorage", () => {
      manager.init();
      manager.setBGMEnabled(false);
      const data = load();
      expect(data.settings.bgmEnabled).toBe(false);
    });

    it("pauses BGM when set to false", () => {
      manager.init();
      manager.playBGM();
      manager.setBGMEnabled(false);
      const bgm = findAudioBySrc("bgm");
      expect(bgm?.pause).toHaveBeenCalled();
    });

    it("can re-enable BGM after disabling", () => {
      manager.init();
      manager.setBGMEnabled(false);
      manager.setBGMEnabled(true);
      const data = load();
      expect(data.settings.bgmEnabled).toBe(true);
    });
  });

  describe("setSFXEnabled()", () => {
    it("updates sfxEnabled in localStorage", () => {
      manager.init();
      manager.setSFXEnabled(false);
      const data = load();
      expect(data.settings.sfxEnabled).toBe(false);
    });

    it("can re-enable SFX after disabling", () => {
      manager.init();
      manager.setSFXEnabled(false);
      manager.setSFXEnabled(true);
      const data = load();
      expect(data.settings.sfxEnabled).toBe(true);
    });
  });

  describe("playFrogNote()", () => {
    it("creates an oscillator with frequency 261.63 for C4", () => {
      manager.init();
      manager.playFrogNote(261.63);
      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
      expect(mockOscillator.frequency.value).toBe(261.63);
    });

    it("creates an oscillator with frequency 329.63 for E4", () => {
      manager.init();
      manager.playFrogNote(329.63);
      expect(mockOscillator.frequency.value).toBe(329.63);
    });

    it("creates an oscillator with frequency 392.0 for G4", () => {
      manager.init();
      manager.playFrogNote(392.0);
      expect(mockOscillator.frequency.value).toBe(392.0);
    });

    it("uses sine wave type for warm tone", () => {
      manager.init();
      manager.playFrogNote(261.63);
      expect(mockOscillator.type).toBe("sine");
    });

    it("starts and stops the oscillator", () => {
      manager.init();
      manager.playFrogNote(261.63);
      expect(mockOscillator.start).toHaveBeenCalled();
      expect(mockOscillator.stop).toHaveBeenCalled();
    });

    it("does nothing when SFX is disabled", () => {
      manager.init();
      manager.setSFXEnabled(false);
      manager.playFrogNote(261.63);
      expect(mockAudioContext.createOscillator).not.toHaveBeenCalled();
    });
  });

  describe("playCorrect()", () => {
    it("creates multiple oscillators for ascending chime", () => {
      manager.init();
      manager.playCorrect();
      expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(3);
    });

    it("starts and stops oscillators", () => {
      manager.init();
      manager.playCorrect();
      expect(mockOscillator.start).toHaveBeenCalled();
      expect(mockOscillator.stop).toHaveBeenCalled();
    });

    it("does nothing when SFX is disabled", () => {
      manager.init();
      manager.setSFXEnabled(false);
      manager.playCorrect();
      expect(mockAudioContext.createOscillator).not.toHaveBeenCalled();
    });
  });

  describe("playIncorrect()", () => {
    it("creates multiple oscillators for descending tone", () => {
      manager.init();
      manager.playIncorrect();
      expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(2);
    });

    it("starts and stops oscillators", () => {
      manager.init();
      manager.playIncorrect();
      expect(mockOscillator.start).toHaveBeenCalled();
      expect(mockOscillator.stop).toHaveBeenCalled();
    });

    it("does nothing when SFX is disabled", () => {
      manager.init();
      manager.setSFXEnabled(false);
      manager.playIncorrect();
      expect(mockAudioContext.createOscillator).not.toHaveBeenCalled();
    });
  });

  describe("playWin()", () => {
    it("creates multiple oscillators for celebratory tone", () => {
      manager.init();
      manager.playWin();
      expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(4);
    });

    it("starts and stops oscillators", () => {
      manager.init();
      manager.playWin();
      expect(mockOscillator.start).toHaveBeenCalled();
      expect(mockOscillator.stop).toHaveBeenCalled();
    });

    it("does nothing when SFX is disabled", () => {
      manager.init();
      manager.setSFXEnabled(false);
      manager.playWin();
      expect(mockAudioContext.createOscillator).not.toHaveBeenCalled();
    });
  });

  describe("playSticker()", () => {
    it("creates multiple oscillators for sparkle tone", () => {
      manager.init();
      manager.playSticker();
      expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(2);
    });

    it("starts and stops oscillators", () => {
      manager.init();
      manager.playSticker();
      expect(mockOscillator.start).toHaveBeenCalled();
      expect(mockOscillator.stop).toHaveBeenCalled();
    });

    it("does nothing when SFX is disabled", () => {
      manager.init();
      manager.setSFXEnabled(false);
      manager.playSticker();
      expect(mockAudioContext.createOscillator).not.toHaveBeenCalled();
    });
  });

  describe("playPop()", () => {
    it("creates an oscillator for percussive blip", () => {
      manager.init();
      manager.playPop();
      expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(1);
    });

    it("starts and stops the oscillator", () => {
      manager.init();
      manager.playPop();
      expect(mockOscillator.start).toHaveBeenCalled();
      expect(mockOscillator.stop).toHaveBeenCalled();
    });

    it("does nothing when SFX is disabled", () => {
      manager.init();
      manager.setSFXEnabled(false);
      manager.playPop();
      expect(mockAudioContext.createOscillator).not.toHaveBeenCalled();
    });
  });

  describe("playWake()", () => {
    it("creates multiple oscillators for rousing tone", () => {
      manager.init();
      manager.playWake();
      expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(2);
    });

    it("starts and stops oscillators", () => {
      manager.init();
      manager.playWake();
      expect(mockOscillator.start).toHaveBeenCalled();
      expect(mockOscillator.stop).toHaveBeenCalled();
    });

    it("does nothing when SFX is disabled", () => {
      manager.init();
      manager.setSFXEnabled(false);
      manager.playWake();
      expect(mockAudioContext.createOscillator).not.toHaveBeenCalled();
    });
  });

  describe("playIdleCall()", () => {
    it("creates two oscillators for a gentle two-tone call", () => {
      manager.init();
      manager.playIdleCall();
      expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(2);
    });

    it("starts and stops oscillators", () => {
      manager.init();
      manager.playIdleCall();
      expect(mockOscillator.start).toHaveBeenCalled();
      expect(mockOscillator.stop).toHaveBeenCalled();
    });

    it("does nothing when SFX is disabled", () => {
      manager.init();
      manager.setSFXEnabled(false);
      manager.playIdleCall();
      expect(mockAudioContext.createOscillator).not.toHaveBeenCalled();
    });
  });

  describe("destroy()", () => {
    it("closes the AudioContext", () => {
      manager.init();
      manager.destroy();
      expect(mockAudioContext.close).toHaveBeenCalled();
    });

    it("pauses BGM on destroy", () => {
      manager.init();
      manager.playBGM();
      manager.destroy();
      const bgm = findAudioBySrc("bgm");
      expect(bgm?.pause).toHaveBeenCalled();
    });
  });

  describe("audio focus", () => {
    let bgm: MockAudioElement;
    let cancelSpeech: MockFn;
    let speaking = false;
    let documentVisibility: DocumentVisibilityState = "visible";

    function requireBGM(): MockAudioElement {
      const element = mockAudios.at(-1);
      if (!element) throw new Error("BGM element was not created");
      return element;
    }

    function setDocumentVisibility(state: DocumentVisibilityState): void {
      documentVisibility = state;
      document.dispatchEvent(new Event("visibilitychange"));
    }

    beforeEach(() => {
      speechHarness.reset();
      documentVisibility = "visible";
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        get: () => documentVisibility,
      });
      cancelSpeech = vi.fn();
      vi.stubGlobal("speechSynthesis", {
        get speaking() {
          return speaking;
        },
        cancel: cancelSpeech,
      });
      speaking = false;
      vi.useFakeTimers();
      manager.init();
      bgm = requireBGM();
    });

    afterEach(() => {
      vi.useRealTimers();
      Reflect.deleteProperty(document, "visibilityState");
      speechHarness.reset();
    });

    it("subscribes to the speech lifecycle exactly once at init", () => {
      manager.init();
      expect(speechHarness.listeners.size).toBe(1);
    });

    it("ducks the BGM when narration starts", () => {
      speechHarness.emit("speech:start");
      vi.advanceTimersByTime(150);
      expect(bgm.volume).toBeCloseTo(0.024, 3);
    });

    it("ramps the duck instead of jumping", () => {
      speechHarness.emit("speech:start");
      vi.advanceTimersByTime(20);
      expect(bgm.volume).toBeLessThan(0.3);
      expect(bgm.volume).toBeGreaterThan(0.024);
    });

    it("restores the BGM when narration ends", () => {
      speechHarness.emit("speech:start");
      vi.advanceTimersByTime(150);
      speechHarness.emit("speech:end");
      vi.advanceTimersByTime(150);
      expect(bgm.volume).toBeCloseTo(0.3, 5);
    });

    it("restores the BGM when narration errors", () => {
      speechHarness.emit("speech:start");
      vi.advanceTimersByTime(150);
      speechHarness.emit("speech:error");
      vi.advanceTimersByTime(150);
      expect(bgm.volume).toBeCloseTo(0.3, 5);
    });

    it("holds the duck across a re-entrant utterance", () => {
      speechHarness.emit("speech:start");
      vi.advanceTimersByTime(150);
      speechHarness.emit("speech:start");
      vi.advanceTimersByTime(150);
      expect(bgm.volume).toBeCloseTo(0.024, 3);
      speechHarness.emit("speech:end");
      vi.advanceTimersByTime(150);
      expect(bgm.volume).toBeCloseTo(0.3, 5);
    });

    it("restores the BGM when no terminal speech event arrives", () => {
      speechHarness.emit("speech:start");
      vi.advanceTimersByTime(150);
      expect(bgm.volume).toBeCloseTo(0.024, 3);
      vi.advanceTimersByTime(15000);
      vi.advanceTimersByTime(150);
      expect(bgm.volume).toBeCloseTo(0.3, 5);
    });

    it("keeps the duck while the engine still speaks and restores on a later check", () => {
      speaking = true;
      speechHarness.emit("speech:start");
      vi.advanceTimersByTime(15150);
      expect(bgm.volume).toBeCloseTo(0.024, 3);
      speaking = false;
      vi.advanceTimersByTime(15000);
      vi.advanceTimersByTime(150);
      expect(bgm.volume).toBeCloseTo(0.3, 5);
    });

    it("restores the BGM when BGM is disabled mid-narration", () => {
      speechHarness.emit("speech:start");
      vi.advanceTimersByTime(150);
      manager.setBGMEnabled(false);
      vi.advanceTimersByTime(150);
      expect(bgm.volume).toBeCloseTo(0.3, 5);
    });

    it("restores the BGM when SFX is disabled mid-narration", () => {
      speechHarness.emit("speech:start");
      vi.advanceTimersByTime(150);
      manager.setSFXEnabled(false);
      vi.advanceTimersByTime(150);
      expect(bgm.volume).toBeCloseTo(0.3, 5);
    });

    it("does not duck when SFX is disabled", () => {
      manager.setSFXEnabled(false);
      speechHarness.emit("speech:start");
      vi.advanceTimersByTime(150);
      expect(bgm.volume).toBeCloseTo(0.3, 5);
    });

    it("does not duck when BGM is disabled", () => {
      manager.setBGMEnabled(false);
      speechHarness.emit("speech:start");
      vi.advanceTimersByTime(150);
      expect(bgm.volume).toBeCloseTo(0.3, 5);
    });

    it("does not duck before init", () => {
      const elementsBefore = mockAudios.length;
      const fresh = new AudioManager();

      expect(() => {
        fresh.duckBGM();
        fresh.restoreBGM();
      }).not.toThrow();

      expect(mockAudios).toHaveLength(elementsBefore);
      expect(vi.getTimerCount()).toBe(0);
      expect(cancelSpeech).not.toHaveBeenCalled();
    });

    it("never persists the ducked level", () => {
      const stored = localStorage.getItem("abby-little-lab:v2");
      speechHarness.emit("speech:start");
      vi.advanceTimersByTime(150);
      expect(localStorage.getItem("abby-little-lab:v2")).toBe(stored);
    });

    it("pauses the BGM, cancels narration, and releases the duck when hidden", () => {
      manager.playBGM();
      bgm.paused = false;
      speechHarness.emit("speech:start");
      vi.advanceTimersByTime(150);
      expect(cancelSpeech).not.toHaveBeenCalled();

      setDocumentVisibility("hidden");
      vi.advanceTimersByTime(150);

      expect(cancelSpeech).toHaveBeenCalledTimes(1);
      expect(bgm.pause).toHaveBeenCalledTimes(1);
      expect(bgm.volume).toBeCloseTo(0.3, 5);
    });

    it("resumes the BGM on show when it was playing before the hide", () => {
      manager.playBGM();
      bgm.paused = false;
      setDocumentVisibility("hidden");
      expect(bgm.pause).toHaveBeenCalledTimes(1);
      bgm.play.mockClear();

      setDocumentVisibility("visible");

      expect(bgm.play).toHaveBeenCalledTimes(1);
    });

    it("does not resume the BGM on show when it was paused before the hide", () => {
      manager.pauseBGM();
      bgm.paused = true;
      setDocumentVisibility("hidden");
      bgm.play.mockClear();

      setDocumentVisibility("visible");

      expect(bgm.play).not.toHaveBeenCalled();
    });

    it("does not resume the BGM on show when BGM was disabled while hidden", () => {
      manager.playBGM();
      bgm.paused = false;
      setDocumentVisibility("hidden");
      manager.setBGMEnabled(false);
      bgm.play.mockClear();

      setDocumentVisibility("visible");

      expect(bgm.play).not.toHaveBeenCalled();
    });

    it("stays inert where the document has no visibilityState", () => {
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        get: () => undefined,
      });
      const inert = new AudioManager();
      inert.init();
      const inertBgm = requireBGM();
      inertBgm.paused = false;

      setDocumentVisibility("hidden");

      expect(inertBgm.pause).not.toHaveBeenCalled();
      inert.destroy();
    });

    it("releases the speech subscription and visibility listener on destroy", () => {
      expect(speechHarness.listeners.size).toBe(1);
      manager.destroy();
      expect(speechHarness.listeners.size).toBe(0);
      expect(() => setDocumentVisibility("hidden")).not.toThrow();
    });
  });

  describe("game context", () => {
    it("resolves the default identity when no context is registered", () => {
      expect(manager.resolveTrioIdentity()).toEqual(DEFAULT_IDENTITY);
    });

    it("resolves the registered game's identity", () => {
      manager.setGameContext("more-less");
      expect(manager.resolveTrioIdentity()).toEqual(identityForGameId("more-less"));
    });

    it("falls back to the default identity for an unknown game id", () => {
      // Deliberate wrong type: unknown runtime ids must degrade to the default voice.
      manager.setGameContext("not-a-game" as GameId);
      expect(manager.resolveTrioIdentity()).toEqual(DEFAULT_IDENTITY);
    });

    it("resolves the default identity after the context is cleared", () => {
      manager.setGameContext("shape-sorter");
      manager.clearGameContext();
      expect(manager.resolveTrioIdentity()).toEqual(DEFAULT_IDENTITY);
    });

    it("clears the context on destroy", () => {
      manager.setGameContext("shape-sorter");
      manager.destroy();
      expect(manager.resolveTrioIdentity()).toEqual(DEFAULT_IDENTITY);
    });
  });

  describe("trio identity synthesis", () => {
    /** Correct/win anchor note (C5). */
    const C5 = 523.25;

    /** Frequency `semitones` above `anchor` (equal temperament). */
    function semitoneHz(anchor: number, semitones: number): number {
      return anchor * 2 ** (semitones / 12);
    }

    /** Audible synthesis parameters of one captured note (ctx time starts at 0). */
    function noteSpec(note: CapturedNote) {
      const startOffset = note.oscillator.start.mock.calls[0][0] as number;
      const stopAt = note.oscillator.stop.mock.calls[0][0] as number;
      return {
        waveform: note.oscillator.type,
        frequency: note.oscillator.frequency.value,
        gain: note.gainNode.gain.value,
        startOffset,
        duration: stopAt - startOffset,
      };
    }

    let notes: CapturedNote[] = [];

    /**
     * Swaps the shared harness mocks for per-note capture. playTone pairs one
     * createOscillator with one createGain per note, in that order, so a
     * captured gain is handed straight to the next createGain call. Call it
     * again between cues to reset the capture.
     */
    function capturePerNote(): void {
      notes = [];
      let pendingGain: MockGainNode = { gain: { value: 0 }, connect: vi.fn() };
      mockAudioContext.createOscillator = vi.fn(() => {
        pendingGain = { gain: { value: 0 }, connect: vi.fn() };
        const oscillator: MockOscillator = {
          type: "sine",
          frequency: { value: 0 },
          connect: vi.fn(),
          start: vi.fn(),
          stop: vi.fn(),
        };
        notes.push({ oscillator, gainNode: pendingGain });
        return oscillator;
      });
      mockAudioContext.createGain = vi.fn(() => pendingGain);
    }

    it("keeps the default identity a fixed point of today's voices", () => {
      manager.init();
      capturePerNote();

      manager.playCorrect();
      const correct = notes.map(noteSpec);
      expect(correct).toHaveLength(3);
      expect(correct[0]).toEqual({
        waveform: "sine",
        frequency: 523.25,
        gain: 0.3,
        startOffset: 0,
        duration: 0.15,
      });
      expect(correct[1].frequency).toBeCloseTo(659.25, 2); // E5, today's hardcoded tone
      expect(correct[1].waveform).toBe("sine");
      expect(correct[1].gain).toBe(0.3);
      expect(correct[1].startOffset).toBe(0.12);
      // Durations are read back as stopAt - startOffset, so float sums need
      // a tolerance; the synthesis itself is exact.
      expect(correct[1].duration).toBeCloseTo(0.15, 6);
      expect(correct[2].frequency).toBeCloseTo(783.99, 2); // G5
      expect(correct[2].startOffset).toBe(0.24);
      expect(correct[2].duration).toBeCloseTo(0.2, 6);

      capturePerNote();
      manager.playIncorrect();
      const incorrect = notes.map(noteSpec);
      expect(incorrect).toHaveLength(2);
      expect(incorrect[0]).toEqual({
        waveform: "sine",
        frequency: 392.0,
        gain: 0.2,
        startOffset: 0,
        duration: 0.15,
      });
      expect(incorrect[1].frequency).toBeCloseTo(261.63, 2); // C4
      expect(incorrect[1].startOffset).toBe(0.12);
      expect(incorrect[1].duration).toBeCloseTo(0.2, 6);

      capturePerNote();
      manager.playWin();
      const win = notes.map(noteSpec);
      expect(win).toHaveLength(4);
      expect(win[0]).toEqual({
        waveform: "sine",
        frequency: 523.25,
        gain: 0.3,
        startOffset: 0,
        duration: 0.12,
      });
      expect(win[1].frequency).toBeCloseTo(659.25, 2); // E5
      expect(win[1].startOffset).toBe(0.1);
      expect(win[1].duration).toBeCloseTo(0.12, 6);
      expect(win[2].frequency).toBeCloseTo(783.99, 2); // G5
      expect(win[2].startOffset).toBe(0.2);
      expect(win[3].frequency).toBe(1046.5); // exact octave above C5
      expect(win[3].startOffset).toBeCloseTo(0.3, 6); // 3 * 0.1, float-rounded
      expect(win[3].duration).toBeCloseTo(0.25, 6);
      expect(win[3].startOffset + win[3].duration).toBeCloseTo(0.55, 5);
    });

    it("transposes every note by the identity's pitch offset", () => {
      manager.init();
      manager.setGameContext("how-many"); // pitch +5, correct contour [0, 5, 9]
      capturePerNote();
      manager.playCorrect();
      const specs = notes.map(noteSpec);
      expect(specs).toHaveLength(3);
      expect(specs[0].frequency).toBeCloseTo(semitoneHz(C5, 5), 6);
      expect(specs[1].frequency).toBeCloseTo(semitoneHz(C5, 10), 6);
      expect(specs[2].frequency).toBeCloseTo(semitoneHz(C5, 14), 6);
    });

    it("shapes the notes with the identity's waveform", () => {
      manager.init();
      manager.setGameContext("pop-freeze"); // square
      capturePerNote();
      manager.playCorrect();
      for (const note of notes) {
        expect(note.oscillator.type).toBe("square");
      }

      manager.setGameContext("shadow-match"); // sawtooth
      capturePerNote();
      manager.playWin();
      for (const note of notes) {
        expect(note.oscillator.type).toBe("sawtooth");
      }
    });

    it("slows note spacing and duration for a slow identity", () => {
      manager.init();
      manager.setGameContext("musical-memory"); // tempo 1.25, default contours
      capturePerNote();
      manager.playCorrect();
      const specs = notes.map(noteSpec);
      expect(specs[0].startOffset).toBe(0);
      expect(specs[1].startOffset).toBeCloseTo(0.15, 6); // 0.12 * 1.25
      expect(specs[2].startOffset).toBeCloseTo(0.3, 6); // 0.24 * 1.25
      expect(specs[0].duration).toBeCloseTo(0.1875, 6); // 0.15 * 1.25
      expect(specs[2].duration).toBeCloseTo(0.25, 6); // 0.2 * 1.25
    });

    it("speeds note spacing and duration up for a fast identity", () => {
      manager.init();
      manager.setGameContext("shape-sorter"); // tempo 0.75, default contours
      capturePerNote();
      manager.playIncorrect();
      const specs = notes.map(noteSpec);
      expect(specs[1].startOffset).toBeCloseTo(0.09, 6); // 0.12 * 0.75
      expect(specs[1].duration).toBeCloseTo(0.15, 6); // 0.2 * 0.75
    });

    it("honors the identity's melodic contour", () => {
      manager.init();
      manager.setGameContext("pop-freeze"); // pitch -3, correct contour [0, 5, 9]
      capturePerNote();
      manager.playCorrect();
      const specs = notes.map(noteSpec);
      expect(specs[0].frequency).toBeCloseTo(semitoneHz(C5, -3), 6); // A4
      expect(specs[1].frequency).toBeCloseTo(semitoneHz(C5, 2), 6);
      expect(specs[2].frequency).toBeCloseTo(semitoneHz(C5, 6), 6);
    });

    it("synthesizes the default voice for an unknown game id", () => {
      manager.init();
      // Deliberate wrong type: unknown runtime ids must keep the default voice.
      manager.setGameContext("not-a-game" as GameId);
      capturePerNote();
      manager.playCorrect();
      const specs = notes.map(noteSpec);
      expect(specs[0].frequency).toBe(523.25);
      expect(specs[0].waveform).toBe("sine");
      expect(specs[1].startOffset).toBe(0.12);
      expect(specs[2].startOffset).toBe(0.24);
    });

    it("is deterministic: the same identity synthesizes identical notes", () => {
      manager.init();
      manager.setGameContext("how-many");
      capturePerNote();
      manager.playCorrect();
      const first = notes.map(noteSpec);
      capturePerNote();
      manager.playCorrect();
      expect(notes.map(noteSpec)).toEqual(first);
    });

    it("keeps the incorrect cue gently descending for every identity (NFR-1)", () => {
      manager.init();
      for (const gameId of Object.keys(AUDIO_IDENTITIES) as GameId[]) {
        const identity = AUDIO_IDENTITIES[gameId];
        if (!identity) continue;
        manager.setGameContext(gameId);
        capturePerNote();
        manager.playIncorrect();
        const specs = notes.map(noteSpec);
        expect(specs, gameId).toHaveLength(identity.contours.incorrect.length);
        for (let i = 1; i < specs.length; i++) {
          expect(specs[i].frequency, gameId).toBeLessThanOrEqual(specs[i - 1].frequency);
        }
        // Gentle: never more than an octave below the cue's transposed anchor
        // (the pitch offset shifts register on purpose; the guard bounds the
        // contour's own descent).
        const first = specs[0];
        const last = specs[specs.length - 1];
        expect(last.frequency, gameId).toBeGreaterThanOrEqual(first.frequency / 2);
      }
    });

    it("keeps the win cue inside the celebration budget for every identity (NFR-2)", () => {
      manager.init();
      for (const gameId of Object.keys(AUDIO_IDENTITIES) as GameId[]) {
        manager.setGameContext(gameId);
        capturePerNote();
        manager.playWin();
        const specs = notes.map(noteSpec);
        expect(specs.length).toBeGreaterThan(0);
        const last = specs[specs.length - 1];
        const end = last.startOffset + last.duration;
        // Sub-nanosecond float tolerance on the read-back duration sum.
        expect(end, gameId).toBeGreaterThanOrEqual(0.3 - 1e-9);
        expect(end, gameId).toBeLessThanOrEqual(0.8 + 1e-9);
      }
    });

    it("clamps an over-fast win tempo to the budget's upper bound", () => {
      manager.init();
      capturePerNote();
      vi.spyOn(manager, "resolveTrioIdentity").mockReturnValue({
        ...DEFAULT_IDENTITY,
        tempo: 1.5,
      });
      manager.playWin();
      const specs = notes.map(noteSpec);
      const last = specs[specs.length - 1];
      expect(last.startOffset + last.duration).toBeCloseTo(0.8, 5);
      expect(specs[1].startOffset).toBeCloseTo(0.1 * (0.8 / 0.55), 5);
    });

    it("clamps an over-slow win tempo to the budget's lower bound", () => {
      manager.init();
      capturePerNote();
      vi.spyOn(manager, "resolveTrioIdentity").mockReturnValue({
        ...DEFAULT_IDENTITY,
        tempo: 0.4,
      });
      manager.playWin();
      const specs = notes.map(noteSpec);
      const last = specs[specs.length - 1];
      expect(last.startOffset + last.duration).toBeCloseTo(0.3, 5);
    });
  });

  describe("trio no-fail guards", () => {
    it("flattens a rising incorrect contour instead of inverting the cue", () => {
      expect(descendingContour([0, 5, 9])).toEqual([0, 0, 0]);
      expect(descendingContour([0, -3, -1])).toEqual([0, -3, -3]);
    });

    it("caps the descent at the documented contour range", () => {
      expect(descendingContour([0, -40, -60])).toEqual([0, -12, -12]);
    });

    it("keeps a descending contour untouched", () => {
      expect(descendingContour([0, -7])).toEqual([0, -7]);
      expect(descendingContour([0, -3])).toEqual([0, -3]);
    });

    it("clamps the win tempo into the celebration budget for the base timing", () => {
      // Today's base win timing: last note starts at 0.3 s and rings 0.25 s.
      expect(winTempoForBudget(1.5, 0.55)).toBeCloseTo(0.8 / 0.55, 5);
      expect(winTempoForBudget(1.25, 0.55)).toBe(1.25); // inside the budget: untouched
      expect(winTempoForBudget(0.4, 0.55)).toBeCloseTo(0.3 / 0.55, 5);
    });
  });
});
