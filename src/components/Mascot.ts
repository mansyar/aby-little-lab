import type Phaser from "phaser";
import { isReducedMotion, motionDuration, motionScale } from "../utils/motion";

const IDLE_TEXTURE = "mascot_idle";
const CELEBRATE_TEXTURE = "mascot_celebrate";

const WAVE_ANGLE = 8;
const WAVE_REDUCED_ANGLE = 4;
const WAVE_DURATION = 200;
const WAVE_REDUCED_DURATION = 120;

const NOD_ANGLE = 6;
const NOD_REDUCED_ANGLE = 3;
const NOD_DURATION = 150;
const NOD_REDUCED_DURATION = 90;

const CHEER_SCALE = 1.1;
const CHEER_DURATION = 180;
const CHEER_REDUCED_DURATION = 120;
const CHEER_BIG_SCALE = 1.2;
const CHEER_BIG_DURATION = 260;
const CHEER_BIG_REDUCED_DURATION = 160;

const SPARKLE_RADIUS = 36;
const SPARKLE_BIG_RADIUS = 48;
const SPARKLE_COLOR = 0xffd166;
const SPARKLE_ALPHA = 0.9;
const SPARKLE_DURATION = 400;
const SPARKLE_GROW = 1.3;

const BOB_AMOUNT = 3;
const BOB_DURATION = 2500;
const BLINK_SCALE = 0.92;
const BLINK_DURATION = 150;
const BLINK_REPEAT_DELAY = 3700;

const MASCOT_DEPTH = -1;
const SPARKLE_DEPTH = 0;

/** Default mascot scale for scene placement. */
export const MASCOT_SCALE = 0.2;

/** Corner inset used so the mascot never blocks gameplay or controls. */
export const MASCOT_CORNER_MARGIN = 90;

/**
 * Places a non-interactive mascot in the bottom-right corner of a scene,
 * behind gameplay z-order. Used by the Hub and all six game scenes.
 */
export function createCornerMascot(scene: Phaser.Scene): Mascot {
  return new Mascot(
    scene,
    scene.scale.width - MASCOT_CORNER_MARGIN,
    scene.scale.height - MASCOT_CORNER_MARGIN,
    MASCOT_SCALE,
  );
}

/**
 * Professor Hoot — the friendly teacher mascot.
 *
 * A tween-only companion rendered from two static SVG poses
 * (`mascot_idle`, `mascot_celebrate`). Non-interactive, placed behind
 * gameplay z-order, and destroyed on scene shutdown. All motion honors
 * the user's `prefers-reduced-motion` preference.
 */
export class Mascot {
  private readonly scene: Phaser.Scene;
  private readonly image: Phaser.GameObjects.Image;
  private readonly baseScale: number;
  private readonly reduced: boolean;
  private readonly tweens: Phaser.Tweens.Tween[] = [];
  private sparkle: Phaser.GameObjects.Graphics | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number, scale: number) {
    this.scene = scene;
    this.reduced = isReducedMotion();
    this.baseScale = scale;
    this.image = scene.add.image(x, y, IDLE_TEXTURE);
    this.image.setScale(scale);
    this.image.setDepth(MASCOT_DEPTH);
  }

  /** Gentle wing/body sway — used on Hub load. */
  wave(): void {
    this.addTween({
      targets: this.image,
      angle: { from: 0, to: motionScale(WAVE_ANGLE, WAVE_REDUCED_ANGLE) },
      duration: motionDuration(WAVE_DURATION, WAVE_REDUCED_DURATION),
      yoyo: true,
      repeat: 1,
      ease: "Sine.inOut",
    });
  }

  /** Gentle rotate — pairs with the soft incorrect tone (no negative connotation). */
  nod(): void {
    this.addTween({
      targets: this.image,
      angle: { from: 0, to: motionScale(NOD_ANGLE, NOD_REDUCED_ANGLE) },
      duration: motionDuration(NOD_DURATION, NOD_REDUCED_DURATION),
      yoyo: true,
      repeat: 1,
      ease: "Sine.inOut",
    });
  }

  /** Bounce + sparkle ring while wearing the celebrate pose, then back to idle. */
  cheer(big = false): void {
    this.image.setTexture(CELEBRATE_TEXTURE);
    this.addTween({
      targets: this.image,
      scale: this.baseScale * motionScale(big ? CHEER_BIG_SCALE : CHEER_SCALE, 1),
      duration: motionDuration(
        big ? CHEER_BIG_DURATION : CHEER_DURATION,
        big ? CHEER_BIG_REDUCED_DURATION : CHEER_REDUCED_DURATION,
      ),
      yoyo: true,
      repeat: 1,
      ease: "Sine.inOut",
      onComplete: () => {
        this.image.setTexture(IDLE_TEXTURE);
      },
    });
    if (!this.reduced) {
      this.spawnSparkle(big ? SPARKLE_BIG_RADIUS : SPARKLE_RADIUS);
    }
  }

  /** Slow bob with a periodic squash-blink. Disabled under reduced motion. */
  idleLoop(): void {
    if (this.reduced) {
      return;
    }
    this.addTween({
      targets: this.image,
      y: this.image.y - BOB_AMOUNT,
      duration: BOB_DURATION,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });
    this.addTween({
      targets: this.image,
      scaleY: this.baseScale * BLINK_SCALE,
      duration: BLINK_DURATION,
      yoyo: true,
      repeat: -1,
      repeatDelay: BLINK_REPEAT_DELAY,
      ease: "Sine.inOut",
    });
  }

  /** Stops all tweens and removes the image and any sparkle ring. */
  destroy(): void {
    for (const tween of this.tweens) {
      tween.remove();
    }
    this.tweens.length = 0;
    this.sparkle?.destroy();
    this.sparkle = null;
    this.image.destroy();
  }

  private addTween(config: Phaser.Types.Tweens.TweenBuilderConfig): void {
    const tween = this.scene.tweens.add(config);
    this.tweens.push(tween);
  }

  private spawnSparkle(radius: number): void {
    const sparkle = this.scene.add.graphics();
    this.sparkle = sparkle;
    sparkle.setDepth(SPARKLE_DEPTH);
    sparkle.fillStyle(SPARKLE_COLOR, SPARKLE_ALPHA);
    sparkle.fillCircle(this.image.x, this.image.y, radius);
    this.addTween({
      targets: sparkle,
      scale: SPARKLE_GROW,
      alpha: 0,
      duration: SPARKLE_DURATION,
      ease: "Sine.out",
      onComplete: () => {
        sparkle.destroy();
        if (this.sparkle === sparkle) {
          this.sparkle = null;
        }
      },
    });
  }
}
