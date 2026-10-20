import { onSpeechLifecycle, type SpeechLifecycleEvent } from "../utils/speech";
import { getSettings, updateSettings } from "../utils/storage";

const SFX_NAMES = ["pop", "correct", "incorrect", "wake", "win", "sticker"] as const;

export type SfxName = (typeof SFX_NAMES)[number];

const BGM_FILE = "/audio/bgm.mp3";
const BGM_VOLUME = 0.3;
/** BGM level while narration holds the foreground (8% of the normal level). */
const BGM_DUCKED_VOLUME = BGM_VOLUME * 0.08;
/** Duck/restore fade length (ms). */
const BGM_RAMP_DURATION = 120;
/** Ramp tick (ms): 120 ms in six steps reads as a fade rather than a jump. */
const BGM_RAMP_STEP = 20;
/**
 * Restore deadline after a `speech:start` that never reports its terminal
 * event (ms). Some engines swallow `onend` after a cancel — a scene shutdown,
 * a superseded utterance, a hidden tab — and a BGM parked at 8% is far worse
 * than one that comes back a little early.
 */
const BGM_DUCK_WATCHDOG = 15000;

const FROG_NOTE_DURATION = 0.5;
const FROG_NOTE_GAIN = 0.3;

/**
 * Manages all audio for the application: BGM loop, synthesized SFX, and frog notes.
 * Uses HTML5 Audio for BGM playback and Web Audio API for oscillator synthesis.
 *
 * Owns the app-wide audio-focus policy: narration ducks the BGM, and a hidden
 * document silences it. Both are wired once in `init()` because this is a
 * singleton whose audio state outlives every scene.
 */
export class AudioManager {
  private static instance: AudioManager | null = null;
  private audioContext: AudioContext | null = null;
  private bgmAudio: HTMLAudioElement | null = null;
  private bgmEnabled = true;
  private sfxEnabled = true;
  /** True while the BGM is held down for narration. */
  private ducked = false;
  /** Active volume-ramp interval, cleared when the ramp lands or is replaced. */
  private rampTimer: ReturnType<typeof setInterval> | null = null;
  /** Restore deadline for a narration that never reports its end. */
  private speechWatchdog: ReturnType<typeof setTimeout> | null = null;
  /** Speech subscription, held so a re-init cannot subscribe twice. */
  private unsubscribeSpeech: (() => void) | null = null;
  /** True while the document visibility listener is attached. */
  private watchingVisibility = false;
  /** True when the BGM was audible at the moment the document was hidden. */
  private resumeBGMWhenVisible = false;

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

    // Narration owns the foreground everywhere, so the duck subscription lives
    // here (once per page session) instead of in each scene that speaks.
    this.unsubscribeSpeech?.();
    this.unsubscribeSpeech = onSpeechLifecycle((event) => {
      this.handleSpeechEvent(event);
    });
    this.watchVisibility();
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
   * Lowers the BGM to the ducked level so narration reads clearly.
   * Idempotent: a re-entrant utterance (one started before the previous ended)
   * simply re-aims at the same floor instead of restoring early.
   */
  duckBGM(): void {
    if (!this.sfxEnabled || !this.bgmEnabled || !this.bgmAudio) return;
    this.ducked = true;
    this.rampBGMTo(BGM_DUCKED_VOLUME);
    this.restartDuckWatchdog();
  }

  /**
   * Returns the BGM to its normal level. Safe to call on every exit path —
   * utterance end, error, cancel, hidden document, settings change, teardown —
   * because a manager that is not ducked leaves the element untouched.
   */
  restoreBGM(): void {
    this.clearDuckWatchdog();
    if (!this.ducked) return;
    this.ducked = false;
    this.rampBGMTo(BGM_VOLUME);
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
    // Disabling mid-narration must not park the element at the ducked level for
    // whatever plays it next.
    this.restoreBGM();
    if (!enabled) {
      this.pauseBGM();
    }
  }

  /**
   * Enables or disables SFX playback. Persists the setting to localStorage.
   * Releases any narration duck, because SFX off means nothing is speaking.
   * @param enabled - Whether SFX should be enabled.
   */
  setSFXEnabled(enabled: boolean): void {
    this.sfxEnabled = enabled;
    updateSettings({ sfxEnabled: enabled });
    if (!enabled) {
      this.restoreBGM();
    }
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
   * Mirrors the speech lifecycle onto the BGM: start ducks, any terminal event
   * (end or error) restores. `speech.ts` only reports the latest utterance, so
   * a superseded utterance can never restore while the new one is speaking.
   */
  private handleSpeechEvent(event: SpeechLifecycleEvent): void {
    if (event.kind === "speech:start") {
      this.duckBGM();
    } else {
      this.restoreBGM();
    }
  }

  /**
   * A hidden document is not audio time: pause the BGM (remembering whether it
   * was really playing), drop any in-flight narration, and release the duck so
   * nothing resumes quiet.
   */
  private handleVisibilityChange = (): void => {
    if (this.isDocumentHidden()) {
      this.pauseForHiddenDocument();
    } else {
      this.resumeForVisibleDocument();
    }
  };

  private pauseForHiddenDocument(): void {
    this.resumeBGMWhenVisible = this.bgmAudio !== null && !this.bgmAudio.paused;
    this.cancelSpeech();
    this.restoreBGM();
    this.pauseBGM();
  }

  /** Resumes only what the hide interrupted, and only if BGM is still wanted. */
  private resumeForVisibleDocument(): void {
    const shouldResume = this.resumeBGMWhenVisible && this.bgmEnabled;
    this.resumeBGMWhenVisible = false;
    if (shouldResume) {
      this.playBGM();
    }
  }

  /** Stops the utterance in flight so a hidden tab never keeps talking. */
  private cancelSpeech(): void {
    if (!this.isSpeechAvailable()) return;
    window.speechSynthesis.cancel();
  }

  private isSpeechAvailable(): boolean {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }

  private isDocumentHidden(): boolean {
    return typeof document !== "undefined" && document.visibilityState === "hidden";
  }

  /**
   * Attaches the visibility listener once. Platforms without a
   * `document.visibilityState` (older WebViews, non-DOM test hosts) keep the
   * feature inert instead of throwing.
   */
  private watchVisibility(): void {
    if (this.watchingVisibility) return;
    if (typeof document === "undefined" || typeof document.visibilityState !== "string") return;
    document.addEventListener("visibilitychange", this.handleVisibilityChange);
    this.watchingVisibility = true;
  }

  /** Ramps the element's volume to `target` over the short fade. */
  private rampBGMTo(target: number): void {
    const element = this.bgmAudio;
    if (!element) return;
    this.clearRamp();
    const from = element.volume;
    const steps = Math.max(1, Math.round(BGM_RAMP_DURATION / BGM_RAMP_STEP));
    let step = 0;
    this.rampTimer = setInterval(() => {
      step += 1;
      if (step >= steps) {
        element.volume = target;
        this.clearRamp();
        return;
      }
      element.volume = from + ((target - from) * step) / steps;
    }, BGM_RAMP_STEP);
  }

  private clearRamp(): void {
    if (this.rampTimer === null) return;
    clearInterval(this.rampTimer);
    this.rampTimer = null;
  }

  /**
   * Arms the restore deadline. A long utterance legitimately outlives the
   * window, so the check re-arms while the engine still reports speech and
   * only releases the BGM once the engine has gone quiet.
   */
  private restartDuckWatchdog(): void {
    this.clearDuckWatchdog();
    this.speechWatchdog = setTimeout(() => {
      this.speechWatchdog = null;
      if (this.isEngineSpeaking()) {
        this.restartDuckWatchdog();
        return;
      }
      this.restoreBGM();
    }, BGM_DUCK_WATCHDOG);
  }

  private clearDuckWatchdog(): void {
    if (this.speechWatchdog === null) return;
    clearTimeout(this.speechWatchdog);
    this.speechWatchdog = null;
  }

  private isEngineSpeaking(): boolean {
    return this.isSpeechAvailable() && window.speechSynthesis.speaking;
  }

  /**
   * Cleans up audio resources: pauses BGM, closes AudioContext, and clears references.
   * Also releases the duck state and both app-wide listeners so a torn-down
   * manager can never leave the shared audio environment altered.
   */
  destroy(): void {
    this.clearRamp();
    this.clearDuckWatchdog();
    this.unsubscribeSpeech?.();
    this.unsubscribeSpeech = null;
    if (this.watchingVisibility && typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", this.handleVisibilityChange);
    }
    this.watchingVisibility = false;
    this.resumeBGMWhenVisible = false;
    this.ducked = false;
    this.pauseBGM();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.bgmAudio = null;
  }
}
