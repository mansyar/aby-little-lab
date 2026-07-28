import type Phaser from "phaser";

/** Options for configuring a ParentLock instance. */
interface ParentLockOptions {
  /** The Phaser scene that owns the time system. */
  scene: Phaser.Scene;
  /** The interactive game object to listen for pointer events on. */
  target: Phaser.GameObjects.GameObject;
  /** Hold duration in milliseconds before unlocking. Defaults to 3000. */
  holdDuration?: number;
  /** Called when the hold completes successfully. */
  onSuccess: () => void;
  /** Called when the hold is released before completing. */
  onFailure: () => void;
}

/** Default hold duration: 3 seconds. */
const DEFAULT_HOLD_DURATION = 3000;

/**
 * Parental lock component that requires a sustained hold on a target
 * game object for a configurable duration (default 3 seconds) before
 * triggering the success callback. Gates settings access and app exit
 * to prevent accidental interactions by toddlers.
 */
export class ParentLock {
  private readonly scene: Phaser.Scene;
  private readonly target: Phaser.GameObjects.GameObject;
  private readonly holdDuration: number;
  private readonly onSuccess: () => void;
  private readonly onFailure: () => void;
  private timer: Phaser.Time.TimerEvent | null;

  /**
   * Starts the hold timer when the user presses down on the target.
   * Arrow function property to preserve `this` binding when used as
   * an event callback.
   */
  private handlePointerDown = (): void => {
    this.timer = this.scene.time.delayedCall(this.holdDuration, () => {
      this.timer = null;
      this.onSuccess();
    });
  };

  /**
   * Cancels the hold timer when the user releases or moves away from
   * the target. Fires the failure callback only if a hold was in progress.
   * Arrow function property to preserve `this` binding when used as
   * an event callback.
   */
  private handlePointerUp = (): void => {
    if (this.timer) {
      this.timer.remove();
      this.timer = null;
      this.onFailure();
    }
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
    this.onSuccess = options.onSuccess;
    this.onFailure = options.onFailure;
    this.timer = null;

    this.target.on("pointerdown", this.handlePointerDown);
    this.target.on("pointerup", this.handlePointerUp);
    this.target.on("pointerout", this.handlePointerUp);
  }

  /**
   * Removes all event listeners and cancels any active timer.
   * Call this when the ParentLock is no longer needed.
   */
  destroy(): void {
    this.target.off("pointerdown", this.handlePointerDown);
    this.target.off("pointerup", this.handlePointerUp);
    this.target.off("pointerout", this.handlePointerUp);
    if (this.timer) {
      this.timer.remove();
      this.timer = null;
    }
  }
}
