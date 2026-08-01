import type Phaser from "phaser";
import { motionDuration, motionScale } from "./motion";

/** Scale applied to a draggable object while it is being dragged. */
const DRAG_LIFT_SCALE = 1.1;

/** Drag lift scale under reduced motion. */
const DRAG_LIFT_REDUCED_SCALE = 1.05;

/** Tilt (degrees) applied to a draggable object while it is being dragged. */
const DRAG_LIFT_ANGLE = 4;

/** Tilt under reduced motion (no tilt). */
const DRAG_LIFT_REDUCED_ANGLE = 0;

/** Duration of the lift tween (ms). */
const LIFT_DURATION = 120;

/** Duration of the lift tween under reduced motion (ms). */
const LIFT_REDUCED_DURATION = 80;

/** Duration of the restore tween after drag end (ms). */
const RESTORE_DURATION = 150;

/** Duration of the restore tween under reduced motion (ms). */
const RESTORE_REDUCED_DURATION = 100;

/** Duration of the snap-to-slot tween (ms). */
const SNAP_DURATION = 200;

/** Duration of the snap tween under reduced motion (ms). */
const SNAP_REDUCED_DURATION = 120;

/** Color of the drop-zone highlight outline. */
const HIGHLIGHT_COLOR = 0x2b6cb0;

/** Alpha of the drop-zone highlight outline. */
const HIGHLIGHT_ALPHA = 0.9;

/** Line width of the drop-zone highlight outline. */
const HIGHLIGHT_WIDTH = 6;

/** Peak scale of the highlight pulse. */
const HIGHLIGHT_PULSE_SCALE = 1.06;

/** Peak scale of the highlight pulse under reduced motion. */
const HIGHLIGHT_PULSE_REDUCED_SCALE = 1.02;

/** Duration of one highlight pulse half-cycle (ms). */
const HIGHLIGHT_PULSE_DURATION = 400;

/** Duration of one highlight pulse half-cycle under reduced motion (ms). */
const HIGHLIGHT_PULSE_REDUCED_DURATION = 240;

/** Geometry of a drop zone used for the drag-over highlight. */
export interface DropZoneHighlightTarget {
  zone: Phaser.GameObjects.Zone;
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Options for {@link attachDragLift}. */
export interface DragLiftOptions {
  /**
   * When it returns true on drag end, the scale/angle restore tween is
   * skipped — used when a drop reaction (e.g. shrink-into-box) owns the
   * object's scale afterwards.
   */
  skipRestore?: () => boolean;
}

/**
 * Adds lift-and-tilt juice to a draggable object.
 *
 * On drag start the object scales up slightly and tilts; on drag end both are
 * restored. Amplitudes and durations are reduced under reduced motion.
 * Only the visual state is touched — drag/position logic is left untouched.
 */
export function attachDragLift(obj: Phaser.GameObjects.Image, options?: DragLiftOptions): void {
  const baseScaleX = obj.scaleX;
  const baseScaleY = obj.scaleY;

  obj.on("dragstart", () => {
    obj.scene.tweens.add({
      targets: obj,
      scaleX: baseScaleX * motionScale(DRAG_LIFT_SCALE, DRAG_LIFT_REDUCED_SCALE),
      scaleY: baseScaleY * motionScale(DRAG_LIFT_SCALE, DRAG_LIFT_REDUCED_SCALE),
      angle: motionScale(DRAG_LIFT_ANGLE, DRAG_LIFT_REDUCED_ANGLE),
      duration: motionDuration(LIFT_DURATION, LIFT_REDUCED_DURATION),
      ease: "Sine.out",
    });
  });

  obj.on("dragend", () => {
    if (options?.skipRestore?.()) {
      return;
    }
    obj.scene.tweens.add({
      targets: obj,
      scaleX: baseScaleX,
      scaleY: baseScaleY,
      angle: 0,
      duration: motionDuration(RESTORE_DURATION, RESTORE_REDUCED_DURATION),
      ease: "Sine.out",
    });
  });
}

/**
 * Adds soft pulsing outlines to drop zones while a drag hovers over them.
 *
 * The outline appears on dragenter, pulses gently until the drag leaves the
 * zone or ends, then destroys itself (Graphics-based, self-cleaning).
 */
export function attachDropZoneHighlight(
  scene: Phaser.Scene,
  zones: DropZoneHighlightTarget[],
): void {
  let active: Phaser.GameObjects.Graphics | undefined;

  const clear = (): void => {
    if (active) {
      active.destroy();
      active = undefined;
    }
  };

  const pulse = (target: DropZoneHighlightTarget): void => {
    clear();
    const graphics = scene.add.graphics();
    graphics.setPosition(target.x, target.y);
    graphics.lineStyle(HIGHLIGHT_WIDTH, HIGHLIGHT_COLOR, HIGHLIGHT_ALPHA);
    graphics.strokeRect(-target.width / 2, -target.height / 2, target.width, target.height);
    active = graphics;

    scene.tweens.add({
      targets: graphics,
      scaleX: motionScale(HIGHLIGHT_PULSE_SCALE, HIGHLIGHT_PULSE_REDUCED_SCALE),
      scaleY: motionScale(HIGHLIGHT_PULSE_SCALE, HIGHLIGHT_PULSE_REDUCED_SCALE),
      duration: motionDuration(HIGHLIGHT_PULSE_DURATION, HIGHLIGHT_PULSE_REDUCED_DURATION),
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });
  };

  scene.input.on("dragenter", (_pointer: unknown, _obj: unknown, zone: Phaser.GameObjects.Zone) => {
    const match = zones.find((z) => z.zone === zone);
    if (match) {
      pulse(match);
    }
  });

  scene.input.on("dragleave", (_pointer: unknown, _obj: unknown, zone: Phaser.GameObjects.Zone) => {
    const match = zones.find((z) => z.zone === zone);
    if (match) {
      clear();
    }
  });

  scene.input.on("dragend", () => {
    clear();
  });
}

/**
 * Tweens an object to the given slot position with a springy Back.out ease,
 * replacing an instant snap. Reduced motion shortens the tween.
 */
export function snapToSlot(
  scene: Phaser.Scene,
  obj: Phaser.GameObjects.Image,
  x: number,
  y: number,
): void {
  scene.tweens.add({
    targets: obj,
    x,
    y,
    duration: motionDuration(SNAP_DURATION, SNAP_REDUCED_DURATION),
    ease: "Back.out",
  });
}
