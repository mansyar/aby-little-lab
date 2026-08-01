import { getSettings, updateSettings } from "../utils/storage";

const SFX_NAMES = ["pop", "correct", "incorrect", "wake", "win", "sticker"] as const;

export type SfxName = (typeof SFX_NAMES)[number];

const BGM_FILE = "/audio/bgm.mp3";
const BGM_VOLUME = 0.3;

const FROG_NOTE_DURATION = 0.5;
const FROG_NOTE_GAIN = 0.3;

/**
 * Manages all audio for the application: BGM loop, synthesized SFX, and frog notes.
 * Uses HTML5 Audio for BGM playback and Web Audio API for oscillator synthesis.
 */
export class AudioManager {
  private static instance: AudioManager | null = null;
  private audioContext: AudioContext | null = null;
  private bgmAudio: HTMLAudioElement | null = null;
  private bgmEnabled = true;
  private sfxEnabled = true;

  /** Returns the shared AudioManager singleton instance. */
  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  /**
   * Initializes the audio system: creates AudioContext, loads settings from storage,
   * and creates the looping BGM audio element.
   */
  init(): void {
    this.audioContext = new AudioContext();

    const settings = getSettings();
    this.bgmEnabled = settings.bgmEnabled;
    this.sfxEnabled = settings.sfxEnabled;

    this.bgmAudio = new Audio(BGM_FILE);
    this.bgmAudio.loop = true;
    this.bgmAudio.volume = BGM_VOLUME;
  }

  /**
   * Resumes the AudioContext if it is suspended.
   * Browsers require a user interaction (tap, click) before audio can play,
   * so this must be called from a user gesture handler (e.g., tile tap in Hub).
   */
  resume(): void {
    if (this.audioContext?.state === "suspended") {
      this.audioContext.resume();
    }
  }

  /**
   * Starts BGM playback if BGM is enabled.
   * Does nothing if BGM is disabled or not initialized.
   */
  playBGM(): void {
    if (!this.bgmEnabled || !this.bgmAudio) return;
    this.bgmAudio.play().catch(() => {});
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
   * Plays a synthesized sound effect by name.
   * Does nothing if SFX is disabled or not initialized.
   * @param name - The name of the SFX to play (pop, correct, incorrect, wake, win, sticker).
   */
  playSFX(name: SfxName): void {
    switch (name) {
      case "pop":
        this.playPop();
        break;
      case "correct":
        this.playCorrect();
        break;
      case "incorrect":
        this.playIncorrect();
        break;
      case "wake":
        this.playWake();
        break;
      case "win":
        this.playWin();
        break;
      case "sticker":
        this.playSticker();
        break;
    }
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
   * Plays a pleasant ascending chime (C5, E5, G5) using the Web Audio API.
   * Does nothing if SFX is disabled or not initialized.
   */
  playCorrect(): void {
    if (!this.sfxEnabled || !this.audioContext) return;
    const ctx = this.audioContext;
    this.playTone(ctx, 523.25, 0, 0.15, 0.3);
    this.playTone(ctx, 659.25, 0.12, 0.15, 0.3);
    this.playTone(ctx, 783.99, 0.24, 0.2, 0.3);
  }

  /**
   * Plays a soft descending tone (G4, C4) using the Web Audio API.
   * Does nothing if SFX is disabled or not initialized.
   */
  playIncorrect(): void {
    if (!this.sfxEnabled || !this.audioContext) return;
    const ctx = this.audioContext;
    this.playTone(ctx, 392.0, 0, 0.15, 0.2);
    this.playTone(ctx, 261.63, 0.12, 0.2, 0.2);
  }

  /**
   * Plays a celebratory arpeggio (C5, E5, G5, C6) using the Web Audio API.
   * Does nothing if SFX is disabled or not initialized.
   */
  playWin(): void {
    if (!this.sfxEnabled || !this.audioContext) return;
    const ctx = this.audioContext;
    this.playTone(ctx, 523.25, 0, 0.12, 0.3);
    this.playTone(ctx, 659.25, 0.1, 0.12, 0.3);
    this.playTone(ctx, 783.99, 0.2, 0.12, 0.3);
    this.playTone(ctx, 1046.5, 0.3, 0.25, 0.3);
  }

  /**
   * Plays a sparkle tone (C6, E6) using the Web Audio API.
   * Does nothing if SFX is disabled or not initialized.
   */
  playSticker(): void {
    if (!this.sfxEnabled || !this.audioContext) return;
    const ctx = this.audioContext;
    this.playTone(ctx, 1046.5, 0, 0.1, 0.2);
    this.playTone(ctx, 1318.51, 0.08, 0.15, 0.2);
  }

  /**
   * Plays a short percussive pop blip using the Web Audio API.
   * Does nothing if SFX is disabled or not initialized.
   */
  playPop(): void {
    if (!this.sfxEnabled || !this.audioContext) return;
    const ctx = this.audioContext;
    this.playTone(ctx, 800, 0, 0.08, 0.3);
  }

  /**
   * Plays a soft rousing wake tone (E4, A4) using the Web Audio API.
   * Does nothing if SFX is disabled or not initialized.
   */
  playWake(): void {
    if (!this.sfxEnabled || !this.audioContext) return;
    const ctx = this.audioContext;
    this.playTone(ctx, 329.63, 0, 0.15, 0.2);
    this.playTone(ctx, 440.0, 0.12, 0.2, 0.2);
  }

  /**
   * Plays a gentle two-tone idle call (E5, G5) using the Web Audio API.
   * Softer than other SFX so it nudges attention without startling.
   * Does nothing if SFX is disabled or not initialized.
   */
  playIdleCall(): void {
    if (!this.sfxEnabled || !this.audioContext) return;
    const ctx = this.audioContext;
    this.playTone(ctx, 659.25, 0, 0.15, 0.12);
    this.playTone(ctx, 783.99, 0.15, 0.2, 0.12);
  }

  /**
   * Plays a single synthesized tone at a given frequency with staggered start.
   * @param ctx - The AudioContext to use for synthesis.
   * @param frequency - The frequency of the tone in Hz.
   * @param startOffset - Delay before the tone starts, in seconds.
   * @param duration - Duration of the tone in seconds.
   * @param gainValue - Volume level (0.0 to 1.0).
   */
  private playTone(
    ctx: AudioContext,
    frequency: number,
    startOffset: number,
    duration: number,
    gainValue: number,
  ): void {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = frequency;

    gainNode.gain.value = gainValue;

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    const now = ctx.currentTime;
    oscillator.start(now + startOffset);
    oscillator.stop(now + startOffset + duration);
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
  }
}
