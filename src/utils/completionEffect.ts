import type Phaser from "phaser";

const RAY_COUNT = 8;
const RAY_COLOR = 0xffd166;
const CORE_COLOR = 0xfff3b0;
const STANDARD_DURATION = 420;
const REDUCED_MOTION_DURATION = 180;

/** Returns true when the user has requested reduced motion via OS settings. */
function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Shows one lightweight, self-cleaning ray-of-light splash for a successful action.
 * The effect uses one Graphics object instead of a particle emitter.
 */
export function createCompletionSplash(scene: Phaser.Scene, x: number, y: number): void {
  const reducedMotion = prefersReducedMotion();
  const innerRadius = reducedMotion ? 18 : 24;
  const outerRadius = reducedMotion ? 52 : 72;
  const lineWidth = reducedMotion ? 6 : 8;
  const duration = reducedMotion ? REDUCED_MOTION_DURATION : STANDARD_DURATION;
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
  graphics.fillCircle(0, 0, reducedMotion ? 14 : 20);

  scene.tweens.add({
    targets: graphics,
    alpha: 0,
    scaleX: reducedMotion ? 1 : 1.2,
    scaleY: reducedMotion ? 1 : 1.2,
    duration,
    ease: "Sine.out",
    onComplete: () => {
      graphics.destroy();
    },
  });
}
