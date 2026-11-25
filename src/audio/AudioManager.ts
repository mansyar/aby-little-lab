import { type AudioIdentity, identityForGameId } from "../game/audioIdentity";
import type { GameId } from "../types";
import { onSpeechLifecycle, type SpeechLifecycleEvent } from "../utils/speech";
import { getSettings, updateSettings } from "../utils/storage";
import { BGM_DUCKED_VOLUME, BGM_VOLUME, BgmVolumeRamp } from "./bgmRamp";
import {
  playCorrect,
  playFrogNote,
  playIdleCall,
  playIncorrect,
  playPop,
  playSticker,
  playWake,
  playWin,
  type SfxName,
} from "./sfxSynthesis";

export type { SfxName } from "./sfxSynthesis";

const BGM_FILE = "/audio/bgm.mp3";

/**
 * Manages BGM, synthesized SFX and the app-wide audio-focus policy (narration
 * ducks BGM; a hidden document silences it). Voices and ramp timers live in
 * `sfxSynthesis.ts` / `bgmRamp.ts`; visibility handling stays here so this
 * remains the single production module that names `document`.
 */
export class AudioManager {
  private static instance: AudioManager | null = null;
  private audioContext: AudioContext | null = null;
  private bgmAudio: HTMLAudioElement | null = null;
  private bgmEnabled = true;
  private sfxEnabled = true;
  /** True while the BGM is held down for narration. */
  private ducked = false;
  /** The duck/restore ramp and the stalled-narration deadline. */
  private readonly bgmRamp = new BgmVolumeRamp();
  /** Speech subscription, held so a re-init cannot subscribe twice. */
  private unsubscribeSpeech: (() => void) | null = null;
  /** True while the document visibility listener is attached. */
  private watchingVisibility = false;
  /** True when the BGM was audible at the moment the document was hidden. */
  private resumeBGMWhenVisible = false;
  /** Game id of the scene currently on stage; null when no game context is registered. */
  private gameContext: GameId | null = null;

  /** Returns the shared AudioManager singleton instance. */
  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  /** Creates the AudioContext, loads settings and the looping BGM element. */
  init(): void {
    this.audioContext = typeof AudioContext === "undefined" ? null : new AudioContext();

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

  /** Resumes a suspended AudioContext; must be called from a user gesture. */
  resume(): void {
    if (this.audioContext?.state === "suspended") {
      this.audioContext.resume();
    }
  }

  /** Starts BGM playback if enabled and initialized. */
  playBGM(): void {
    if (!this.bgmEnabled || !this.bgmAudio) return;
    this.bgmAudio.play().catch(() => {});
  }

  /** Pauses BGM playback if initialized. */
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
   * Sets the game context whose audio identity colors the feedback trio
   * (correct / incorrect / win). Called by `GameSceneBase.init()` when a
   * game scene comes on stage; non-game scenes never set a context, so the
   * trio keeps its default voice there.
   */
  setGameContext(gameId: GameId): void {
    this.gameContext = gameId;
  }

  /** Clears the game context; the trio falls back to the default voice. */
  clearGameContext(): void {
    this.gameContext = null;
  }

  /**
   * Resolves the trio's identity from the registered game context. Unregistered
   * game ids and a missing context resolve to the default voice, so this is
   * total and never throws. The correct/incorrect/win synth reads the resolved
   * identity to voice its notes; `pop`, `wake`, `sticker`, and frog notes stay
   * universal.
   */
  resolveTrioIdentity(): AudioIdentity {
    return identityForGameId(this.gameContext);
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
    playFrogNote(this.audioContext, frequency);
  }

  /**
   * Plays a pleasant ascending chime using the Web Audio API, voiced by the
   * registered game's audio identity (pitch, timbre, tempo, contour). Does
   * nothing if SFX is disabled or not initialized.
   */
  playCorrect(): void {
    if (!this.sfxEnabled || !this.audioContext) return;
    playCorrect(this.audioContext, this.resolveTrioIdentity());
  }

  /**
   * Plays a soft descending tone using the Web Audio API, voiced by the
   * registered game's audio identity (pitch, timbre, contour). The
   * no-fail guard keeps the cue gently descending for every identity
   * (NFR-1). Does nothing if SFX is disabled or not initialized.
   */
  playIncorrect(): void {
    if (!this.sfxEnabled || !this.audioContext) return;
    playIncorrect(this.audioContext, this.resolveTrioIdentity());
  }

  /**
   * Plays a celebratory arpeggio using the Web Audio API, voiced by the
   * registered game's audio identity (pitch, timbre, contour, and a tempo
   * clamped so the celebration always ends inside the 300–800 ms budget,
   * NFR-2). Does nothing if SFX is disabled or not initialized.
   */
  playWin(): void {
    if (!this.sfxEnabled || !this.audioContext) return;
    playWin(this.audioContext, this.resolveTrioIdentity());
  }

  /**
   * Plays a sparkle tone (C6, E6) using the Web Audio API.
   * Does nothing if SFX is disabled or not initialized.
   */
  playSticker(): void {
    if (!this.sfxEnabled || !this.audioContext) return;
    playSticker(this.audioContext);
  }

  /**
   * Plays a short percussive pop blip using the Web Audio API.
   * Does nothing if SFX is disabled or not initialized.
   */
  playPop(): void {
    if (!this.sfxEnabled || !this.audioContext) return;
    playPop(this.audioContext);
  }

  /**
   * Plays a soft rousing wake tone (E4, A4) using the Web Audio API.
   * Does nothing if SFX is disabled or not initialized.
   */
  playWake(): void {
    if (!this.sfxEnabled || !this.audioContext) return;
    playWake(this.audioContext);
  }

  /**
   * Plays a gentle two-tone idle call (E5, G5) using the Web Audio API.
   * Softer than other SFX so it nudges attention without startling.
   * Does nothing if SFX is disabled or not initialized.
   */
  playIdleCall(): void {
    if (!this.sfxEnabled || !this.audioContext) return;
    playIdleCall(this.audioContext);
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
    if (!this.bgmAudio) return;
    this.bgmRamp.rampTo(this.bgmAudio, target);
  }

  private clearRamp(): void {
    this.bgmRamp.clearRamp();
  }

  /** Re-arms the stalled-narration deadline on every duck. */
  private restartDuckWatchdog(): void {
    this.bgmRamp.armWatchdog(
      () => this.restoreBGM(),
      () => this.isEngineSpeaking(),
    );
  }

  private clearDuckWatchdog(): void {
    this.bgmRamp.clearWatchdog();
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
    this.gameContext = null;
    this.pauseBGM();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.bgmAudio = null;
  }
}
