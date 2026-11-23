/** BGM level at rest. */
export const BGM_VOLUME = 0.3;
/** BGM level while narration holds the foreground (8% of the normal level). */
export const BGM_DUCKED_VOLUME = BGM_VOLUME * 0.08;

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

/**
 * The two timers that own BGM volume transitions: the short duck/restore ramp
 * and the restore deadline for a narration that never reports its end. Kept
 * apart from `AudioManager` so the manager stays inside the module-size budget;
 * all timing values and the exact ramping math are unchanged.
 */
export class BgmVolumeRamp {
  private rampTimer: ReturnType<typeof setInterval> | null = null;
  private watchdog: ReturnType<typeof setTimeout> | null = null;

  /** Ramps the element's volume to `target` over the short fade. */
  rampTo(element: HTMLAudioElement, target: number): void {
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

  clearRamp(): void {
    if (this.rampTimer === null) return;
    clearInterval(this.rampTimer);
    this.rampTimer = null;
  }

  /**
   * Arms the restore deadline. A long utterance legitimately outlives the
   * window, so the check re-arms while the engine still reports speech and
   * only releases the BGM once the engine has gone quiet.
   */
  armWatchdog(onRestore: () => void, isSpeaking: () => boolean): void {
    this.clearWatchdog();
    this.watchdog = setTimeout(() => {
      this.watchdog = null;
      if (isSpeaking()) {
        this.armWatchdog(onRestore, isSpeaking);
        return;
      }
      onRestore();
    }, BGM_DUCK_WATCHDOG);
  }

  clearWatchdog(): void {
    if (this.watchdog === null) return;
    clearTimeout(this.watchdog);
    this.watchdog = null;
  }
}
