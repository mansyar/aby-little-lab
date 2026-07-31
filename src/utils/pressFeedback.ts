import type Phaser from "phaser";
import { isReducedMotion } from "./motion";

const PRESS_SCALE = 0.95;

/**
 * Attaches tactile press feedback to an interactive control: it squishes to
 * 95% of its base scale while pressed and springs back on release, pointer
 * out, or cancel. The base scale is captured at attach time. No-op under
 * reduced motion.
 */
export function attachPressFeedback(obj: Phaser.GameObjects.Text): void {
  if (isReducedMotion()) return;

  const baseScale = obj.scaleX;
  obj.on("pointerdown", () => {
    obj.setScale(baseScale * PRESS_SCALE);
  });
  for (const event of ["pointerup", "pointerout", "pointercancel"] as const) {
    obj.on(event, () => {
      obj.setScale(baseScale);
    });
  }
}
