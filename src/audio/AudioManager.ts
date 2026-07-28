import { getSettings, updateSettings } from "../utils/storage";

const SFX_NAMES = ["pop", "correct", "incorrect", "wake", "win", "sticker"] as const;

export type SfxName = (typeof SFX_NAMES)[number];

const SFX_FILES: Record<SfxName, string> = {
  pop: "/audio/pop.mp3",
  correct: "/audio/correct.mp3",
  incorrect: "/audio/incorrect.mp3",
  wake: "/audio/wake.mp3",
  win: "/audio/win.mp3",
  sticker: "/audio/sticker.mp3",
};

const BGM_FILE = "/audio/bgm.mp3";

const FROG_NOTE_DURATION = 0.5;
const FROG_NOTE_GAIN = 0.3;

/**
 * Manages all audio for the application: BGM loop, SFX playback, and synthesized frog notes.
 * Uses HTML5 Audio for MP3 playback and Web Audio API for oscillator synthesis.
 */
export class AudioManager {
  private audioContext: AudioContext | null = null;
  private bgmAudio: HTMLAudioElement | null = null;
  private sfxAudio: Record<SfxName, HTMLAudioElement> | null = null;
  private bgmEnabled = true;
  private sfxEnabled = true;

  /**
   * Initializes the audio system: creates AudioContext, loads settings from storage,
   * and creates audio elements for BGM and all SFX sounds.
   */
  init(): void {
    this.audioContext = new AudioContext();

    const settings = getSettings();
    this.bgmEnabled = settings.bgmEnabled;
    this.sfxEnabled = settings.sfxEnabled;

    this.bgmAudio = new Audio(BGM_FILE);
    this.bgmAudio.loop = true;

    this.sfxAudio = {} as Record<SfxName, HTMLAudioElement>;
    for (const name of SFX_NAMES) {
      this.sfxAudio[name] = new Audio(SFX_FILES[name]);
    }
  }

  /**
   * Starts BGM playback if BGM is enabled.
   * Does nothing if BGM is disabled or not initialized.
   */
  playBGM(): void {
    if (!this.bgmEnabled || !this.bgmAudio) return;
    this.bgmAudio.play();
  }

  /**
   * Pauses BGM playback.
   * Does nothing if not initialized.
   */
  pauseBGM(): void {
    if (!this.bgmAudio) return;
    this.bgmAudio.pause();
  }

  /**
   * Plays a sound effect by name. Resets the audio to the beginning before playing.
   * Does nothing if SFX is disabled or not initialized.
   * @param name - The name of the SFX to play (pop, correct, incorrect, wake, win, sticker).
   */
  playSFX(name: SfxName): void {
    if (!this.sfxEnabled || !this.sfxAudio) return;
    const audio = this.sfxAudio[name];
    audio.currentTime = 0;
    audio.play();
  }

  /**
   * Enables or disables BGM playback. Persists the setting to localStorage.
   * Pauses BGM when disabling.
   * @param enabled - Whether BGM should be enabled.
   */
  setBGMEnabled(enabled: boolean): void {
    this.bgmEnabled = enabled;
    updateSettings({ bgmEnabled: enabled });
    if (!enabled) {
      this.pauseBGM();
    }
  }

  /**
   * Enables or disables SFX playback. Persists the setting to localStorage.
   * @param enabled - Whether SFX should be enabled.
   */
  setSFXEnabled(enabled: boolean): void {
    this.sfxEnabled = enabled;
    updateSettings({ sfxEnabled: enabled });
  }

  /**
   * Plays a synthesized frog note using the Web Audio API.
   * Uses a sine wave for a warm tone. Does nothing if SFX is disabled or not initialized.
   * @param frequency - The frequency of the note in Hz (e.g., 261.63 for C4).
   */
  playFrogNote(frequency: number): void {
    if (!this.sfxEnabled || !this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = frequency;

    gainNode.gain.value = FROG_NOTE_GAIN;

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    const now = this.audioContext.currentTime;
    oscillator.start(now);
    oscillator.stop(now + FROG_NOTE_DURATION);
  }

  /**
   * Cleans up audio resources: pauses BGM, closes AudioContext, and clears references.
   */
  destroy(): void {
    this.pauseBGM();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.bgmAudio = null;
    this.sfxAudio = null;
  }
}
