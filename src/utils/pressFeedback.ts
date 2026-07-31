import type Phaser from "phaser";
import { isReducedMotion } from "./motion";

const PRESS_SCALE = 0.95;
const SPRING_DURATION = 150;

/** Options for {@link attachPressFeedback}. */
export interface PressFeedbackOptions {
  /**
   * Spring the control back to its base scale with a slight overshoot
   * (`Back.out` tween) instead of restoring the scale instantly.
   */
  spring?: boolean;
}

/**
 * Attaches tactile press feedback to an interactive control: it squishes to
 * 95% of its base scale while pressed and springs back on release, pointer
 * out, or cancel. The base scale is captured at attach time. No-op under
 * reduced motion.
 * @param obj - The interactive control (text, shape, image, ...).
 * @param options - Optional behavior tweaks.
 */
export function attachPressFeedback(
  obj: Phaser.GameObjects.Text | Phaser.GameObjects.Rectangle,
  options?: PressFeedbackOptions,
): void {
  if (isReducedMotion()) return;

  const baseScale = obj.scaleX;
  obj.on("pointerdown", () => {
    obj.setScale(baseScale * PRESS_SCALE);
  });
  for (const event of ["pointerup", "pointerout", "pointercancel"] as const) {
    obj.on(event, () => {
      if (options?.spring) {
        obj.scene.tweens.add({
          targets: obj,
          scaleX: baseScale,
          scaleY: baseScale,
          duration: SPRING_DURATION,
          ease: "Back.out",
        });
      } else {
        obj.setScale(baseScale);
      }
    });
  }
}
