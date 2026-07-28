import { AudioManager } from "../../audio/AudioManager";
import { load } from "../../utils/storage";

const SFX_NAMES = ["pop", "correct", "incorrect", "wake", "win", "sticker"];

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

    it("creates SFX audio elements for all 6 sounds", () => {
      manager.init();
      for (const name of SFX_NAMES) {
        const audio = findAudioBySrc(name);
        expect(audio).toBeDefined();
      }
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

  describe("pauseBGM()", () => {
    it("pauses the BGM audio element", () => {
      manager.init();
      manager.playBGM();
      manager.pauseBGM();
      const bgm = findAudioBySrc("bgm");
      expect(bgm?.pause).toHaveBeenCalled();
    });
  });

  describe("playSFX()", () => {
    it.each(SFX_NAMES)("plays the %s sound", (name) => {
      manager.init();
      manager.playSFX(name);
      const audio = findAudioBySrc(name);
      expect(audio?.play).toHaveBeenCalled();
    });

    it("resets currentTime to 0 before playing", () => {
      manager.init();
      manager.playSFX("pop");
      const audio = findAudioBySrc("pop");
      expect(audio?.currentTime).toBe(0);
    });

    it("does nothing when SFX is disabled", () => {
      manager.init();
      manager.setSFXEnabled(false);
      manager.playSFX("pop");
      const audio = findAudioBySrc("pop");
      expect(audio?.play).not.toHaveBeenCalled();
    });

    it("handles promise rejection from play() without throwing", async () => {
      manager.init();
      const audio = findAudioBySrc("pop");
      expect(audio).toBeDefined();
      if (!audio) return;
      audio.play = vi.fn(() => Promise.reject(new Error("NotAllowed")));

      manager.playSFX("pop");
      await new Promise((resolve) => setTimeout(resolve, 0));
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
});
