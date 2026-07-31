import type Phaser from "phaser";
import { isReducedMotion, motionDuration, motionScale } from "./motion";

const RAY_COUNT = 8;
const RAY_COLOR = 0xffd166;
const CORE_COLOR = 0xfff3b0;
const STANDARD_DURATION = 420;
const REDUCED_MOTION_DURATION = 180;

const WIN_RAY_COUNT = 10;
const WIN_REDUCED_RAY_COUNT = 6;
const WIN_RAY_COLOR = 0xffd166;
const WIN_CORE_COLOR = 0xfff3b0;
const WIN_CONFETTI_COUNT = 10;
const WIN_CONFETTI_COLORS = [0x68d391, 0x4fd1c5, 0xf687b3, 0xf6ad55, 0x9f7aea];
const WIN_STANDARD_DURATION = 700;
const WIN_REDUCED_DURATION = 300;

/**
 * Shows one lightweight, self-cleaning ray-of-light splash for a successful action.
 * The effect uses one Graphics object instead of a particle emitter.
 */
export function createCompletionSplash(scene: Phaser.Scene, x: number, y: number): void {
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

/**
 * Shows a choreographed win celebration: a star-burst of rays around a bright
 * core plus small colored confetti bits that drift and spin outward. Uses
 * Graphics objects and tweens only (no particle emitter). Every object
 * self-destructs when its tween completes. Under reduced motion the confetti
 * is skipped and the ray burst is shorter and gentler.
 */
export function createWinCelebration(scene: Phaser.Scene, x: number, y: number): void {
  const reducedMotion = isReducedMotion();
  const duration = motionDuration(WIN_STANDARD_DURATION, WIN_REDUCED_DURATION);

  const rays = scene.add.graphics();
  rays.setPosition(x, y);
  rays.lineStyle(motionScale(8, 6), WIN_RAY_COLOR, 1);

  const rayCount = reducedMotion ? WIN_REDUCED_RAY_COUNT : WIN_RAY_COUNT;
  const innerRadius = motionScale(30, 24);
  const outerRadius = motionScale(90, 60);
  for (let i = 0; i < rayCount; i++) {
    const angle = (i / rayCount) * Math.PI * 2;
    rays.beginPath();
    rays.moveTo(Math.cos(angle) * innerRadius, Math.sin(angle) * innerRadius);
    rays.lineTo(Math.cos(angle) * outerRadius, Math.sin(angle) * outerRadius);
    rays.strokePath();
  }

  rays.fillStyle(WIN_CORE_COLOR, 1);
  rays.fillCircle(0, 0, motionScale(22, 16));

  scene.tweens.add({
    targets: rays,
    alpha: 0,
    scaleX: motionScale(1.25, 1),
    scaleY: motionScale(1.25, 1),
    duration,
    ease: "Sine.out",
    onComplete: () => {
      rays.destroy();
    },
  });

  if (reducedMotion) return;

  for (let i = 0; i < WIN_CONFETTI_COUNT; i++) {
    const bit = scene.add.graphics();
    bit.fillStyle(WIN_CONFETTI_COLORS[i % WIN_CONFETTI_COLORS.length], 1);
    bit.fillCircle(0, 0, motionScale(5, 4));
    bit.setPosition(x + (Math.random() - 0.5) * 80, y + (Math.random() - 0.5) * 60);

    scene.tweens.add({
      targets: bit,
      x: bit.x + (Math.random() - 0.5) * 140,
      y: bit.y + 90 + Math.random() * 80,
      angle: (Math.random() - 0.5) * 720,
      alpha: 0,
      duration: duration + Math.random() * 250,
      ease: "Quad.out",
      onComplete: () => {
        bit.destroy();
      },
    });
  }
}
