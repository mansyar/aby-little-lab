import fs from "node:fs";
import path from "node:path";
import { AudioManager } from "../../audio/AudioManager";
import { load } from "../../utils/storage";

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

  describe("BGM runtime URL", () => {
    const bgmRuntimePath = path.resolve(process.cwd(), "public/audio/bgm.mp3");

    it("BGM file exists at public/audio/bgm.mp3", () => {
      expect(fs.existsSync(bgmRuntimePath)).toBe(true);
    });

    it("BGM file is non-empty", () => {
      if (!fs.existsSync(bgmRuntimePath)) return;
      const stats = fs.statSync(bgmRuntimePath);
      expect(stats.size).toBeGreaterThan(0);
    });

    it("BGM runtime file matches source asset size", () => {
      const sourcePath = path.resolve(process.cwd(), "src/assets/audio/bgm.mp3");
      if (!fs.existsSync(bgmRuntimePath) || !fs.existsSync(sourcePath)) return;
      const runtimeStats = fs.statSync(bgmRuntimePath);
      const sourceStats = fs.statSync(sourcePath);
      expect(runtimeStats.size).toBe(sourceStats.size);
    });
  });
});
