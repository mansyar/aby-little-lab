import type Phaser from "phaser";

/** Options for configuring a ParentLock instance. */
interface ParentLockOptions {
  /** The Phaser scene that owns the time system. */
  scene: Phaser.Scene;
  /** The interactive game object to listen for pointer events on. */
  target: Phaser.GameObjects.GameObject;
  /** Hold duration in milliseconds before unlocking. Defaults to 3000. */
  holdDuration?: number;
  /** Radius of the circular progress indicator in px. Defaults to 48. */
  radius?: number;
  /** Called when the hold completes successfully. */
  onSuccess: () => void;
  /** Called when the hold is released before completing. */
  onFailure: () => void;
}

/** Default hold duration: 3 seconds. */
const DEFAULT_HOLD_DURATION = 3000;

/** Default radius of the circular progress indicator (px). */
const DEFAULT_RADIUS = 48;

/** Fill color of the circular progress indicator. */
const RING_COLOR = 0x68d391;

/** Fill alpha of the circular progress indicator. */
const RING_ALPHA = 0.6;

/** Render depth of the progress ring, above other scene UI. */
const RING_DEPTH = 10000;

/**
 * Parental lock component that requires a sustained hold on a target
 * game object for a configurable duration (default 3 seconds) before
 * triggering the success callback. Gates settings access and app exit
 * to prevent accidental interactions by toddlers.
 *
 * Only one hold operation runs at a time: duplicate pointer-down events
 * are ignored while a hold is active, and the hold is cancelled on
 * release, pointer leaving the control, pointer cancellation, or
 * destroy(). While held, a circular progress fill is drawn around the
 * target and removed on cancel, completion, or cleanup.
 */
export class ParentLock {
  private readonly scene: Phaser.Scene;
  private readonly target: Phaser.GameObjects.GameObject;
  private readonly holdDuration: number;
  private readonly radius: number;
  private readonly onSuccess: () => void;
  private readonly onFailure: () => void;
  private timer: Phaser.Time.TimerEvent | null;
  private holdActive: boolean;
  private progress: Phaser.GameObjects.Graphics | null;
  private progressState: { value: number } | null;
  private progressTween: Phaser.Tweens.Tween | null;

  /**
   * Starts the hold timer and progress ring when the user presses down
   * on the target. Duplicate pointer-down events are ignored while a
   * hold is active. Arrow function property to preserve `this` binding
   * when used as an event callback.
   */
  private handlePointerDown = (): void => {
    if (this.holdActive) return;
    this.holdActive = true;
    this.timer = this.scene.time.delayedCall(this.holdDuration, () => {
      if (!this.holdActive) return;
      this.holdActive = false;
      this.timer = null;
      this.resetProgress();
      this.onSuccess();
    });
    this.startProgress();
  };

  /**
   * Cancels the hold timer and progress ring when the user releases,
   * leaves, or cancels the pointer. Fires the failure callback only if
   * a hold was in progress. Arrow function property to preserve `this`
   * binding when used as an event callback.
   */
  private handlePointerUp = (): void => {
    if (!this.holdActive) return;
    this.holdActive = false;
    if (this.timer) {
      this.timer.remove();
      this.timer = null;
    }
    this.resetProgress();
    this.onFailure();
  };

  /**
   * Creates a ParentLock and registers pointer event listeners on the target.
   *
   * @param options - Configuration for the parental lock.
   */
  constructor(options: ParentLockOptions) {
    this.scene = options.scene;
    this.target = options.target;
    this.holdDuration = options.holdDuration ?? DEFAULT_HOLD_DURATION;
    this.radius = options.radius ?? DEFAULT_RADIUS;
    this.onSuccess = options.onSuccess;
    this.onFailure = options.onFailure;
    this.timer = null;
    this.holdActive = false;
    this.progress = null;
    this.progressState = null;
    this.progressTween = null;

    this.target.on("pointerdown", this.handlePointerDown);
    this.target.on("pointerup", this.handlePointerUp);
    this.target.on("pointerout", this.handlePointerUp);
    this.target.on("pointercancel", this.handlePointerUp);
  }

  /**
   * Removes all event listeners, cancels any active timer, and destroys
   * the progress indicator. Call this when the ParentLock is no longer
   * needed (e.g., on scene shutdown).
   */
  destroy(): void {
    this.target.off("pointerdown", this.handlePointerDown);
    this.target.off("pointerup", this.handlePointerUp);
    this.target.off("pointerout", this.handlePointerUp);
    this.target.off("pointercancel", this.handlePointerUp);
    this.holdActive = false;
    if (this.timer) {
      this.timer.remove();
      this.timer = null;
    }
    this.resetProgress();
  }

  /** Creates the circular progress ring and animates it over the hold duration. */
  private startProgress(): void {
    const center = this.getTargetCenter();
    this.progressState = { value: 0 };
    this.progress = this.scene.add.graphics().setDepth(RING_DEPTH);
    this.redrawProgress(center, 0);
    this.progressTween = this.scene.tweens.add({
      targets: this.progressState,
      value: 1,
      duration: this.holdDuration,
      onUpdate: () => this.redrawProgress(center, this.progressState?.value ?? 0),
    });
  }

  /** Draws the progress ring filled from 12 o'clock by the given fraction (0..1). */
  private redrawProgress(center: { x: number; y: number }, value: number): void {
    if (!this.progress) return;
    this.progress.clear();
    this.progress.fillStyle(RING_COLOR, RING_ALPHA);
    this.progress.slice(
      center.x,
      center.y,
      this.radius,
      -Math.PI / 2,
      -Math.PI / 2 + value * Math.PI * 2,
    );
    this.progress.fillPath();
  }

  /** Returns the center point of the target's bounds for ring positioning. */
  private getTargetCenter(): { x: number; y: number } {
    return (
      this.target as unknown as {
        getCenter: () => { x: number; y: number };
      }
    ).getCenter();
  }

  /** Stops the progress tween and destroys the ring so no display objects remain. */
  private resetProgress(): void {
    if (this.progressTween) {
      this.progressTween.stop();
      this.progressTween = null;
    }
    if (this.progress) {
      this.progress.destroy();
      this.progress = null;
    }
    this.progressState = null;
  }
}
