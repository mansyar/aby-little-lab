import type Phaser from "phaser";
import { isReducedMotion, motionDuration, motionScale } from "./motion";

const RAY_COUNT = 8;
const RAY_COLOR = 0xffd166;
const CORE_COLOR = 0xfff3b0;
const STANDARD_DURATION = 420;
const REDUCED_MOTION_DURATION = 180;

/**
 * Shows one lightweight, self-cleaning ray-of-light splash for a successful action.
 * The effect uses one Graphics object instead of a particle emitter.
 */
export function createCompletionSplash(scene: Phaser.Scene, x: number, y: number): void {
  const reducedMotion = isReducedMotion();
  const innerRadius = motionScale(24, 18);
  const outerRadius = motionScale(72, 52);
  const lineWidth = motionScale(8, 6);
  const duration = motionDuration(STANDARD_DURATION, REDUCED_MOTION_DURATION);
  const graphics = scene.add.graphics();

  graphics.setPosition(x, y);
  graphics.lineStyle(lineWidth, RAY_COLOR, 1);

  for (let i = 0; i < RAY_COUNT; i++) {
    const angle = (i / RAY_COUNT) * Math.PI * 2;
    graphics.beginPath();
    graphics.moveTo(Math.cos(angle) * innerRadius, Math.sin(angle) * innerRadius);
    graphics.lineTo(Math.cos(angle) * outerRadius, Math.sin(angle) * outerRadius);
    graphics.strokePath();
  }

  graphics.fillStyle(CORE_COLOR, 1);
  graphics.fillCircle(0, 0, motionScale(20, 14));

  scene.tweens.add({
    targets: graphics,
    alpha: 0,
    scaleX: motionScale(1.2, 1),
    scaleY: motionScale(1.2, 1),
    duration,
    ease: "Sine.out",
    onComplete: () => {
      graphics.destroy();
    },
  });
}
