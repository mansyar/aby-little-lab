import type Phaser from "phaser";
import {
  type AnimalFoodPair,
  advancePath,
  createPathProgress,
  generatePathPoints,
  isPathComplete,
  isRoundComplete,
  type PathProgress,
  selectThreePairs,
} from "../game/animalTraceLogic";
import { createCompletionSplash } from "../utils/completionEffect";
import { isReducedMotion, motionDuration, motionScale } from "../utils/motion";
import { sceneEntrance } from "../utils/sceneTransitions";
import { GameSceneBase } from "./GameSceneBase";

/** X position for the animal sprite (left side). */
const ANIMAL_X = 200;

/** X position for the food sprite (right side). */
const FOOD_X = 824;

/** Y position for both sprites (vertical center). */
const SPRITE_Y = 384;

/** Display size for animal and food sprites. */
const SPRITE_SIZE = 128;

/** Number of waypoints per path. */
const PATH_POINTS = 6;

/** Proximity tolerance for tracing (generous, per touch-ergonomics). */
const TRACE_TOLERANCE = 60;

/** Radius of each dot in the dotted path. */
const DOT_RADIUS = 6;

/** Color of dots the child has already visited. */
const VISITED_COLOR = 0x68d391;

/** Color and styling of the next-waypoint ring. */
const NEXT_RING_COLOR = 0x2b6cb0;
const NEXT_RING_WIDTH = 4;
const NEXT_RING_ALPHA = 0.9;

/** Base radius of the next-waypoint ring. */
const NEXT_RING_RADIUS = 14;

/** How large the ring pulses (radius multiplier) and how fast (ms). */
const RING_PULSE_SCALE = 1.6;
const RING_PULSE_DURATION = 700;

/** Delay before advancing to the next pair after path completion (ms). */
const NEXT_PAIR_DELAY = 1000;

/** Vertical arc (px) of the animal's hop between waypoints. */
const HOP_ARC_Y = 6;

/** Duration of one hop phase (apex up or landing down), total hop ~120ms. */
const HOP_HALF_DURATION = 60;

/** Reduced-motion duration of one hop phase. */
const HOP_HALF_REDUCED_DURATION = 36;

/** Food wiggle rotation amplitude (degrees) on path arrival. */
const FOOD_WIGGLE_ANGLE = 4;

/** Reduced-motion food wiggle rotation amplitude (degrees). */
const FOOD_WIGGLE_REDUCED_ANGLE = 2;

/** Food wiggle duration (ms). */
const FOOD_WIGGLE_DURATION = 200;

/** Reduced-motion food wiggle duration (ms). */
const FOOD_WIGGLE_REDUCED_DURATION = 120;

/** Number of yoyo repeats for the food wiggle. */
const FOOD_WIGGLE_REPEAT = 3;

/** Tracks the state of the current pair being traced. */
interface PairState {
  pair: AnimalFoodPair;
  pathPoints: Array<{ x: number; y: number }>;
  progress: PathProgress;
  animalSprite: Phaser.GameObjects.Image;
  foodSprite: Phaser.GameObjects.Image;
  pathGraphics: Phaser.GameObjects.Graphics;
  complete: boolean;
}

/**
 * Animal Trace scene — trace a dotted path from an animal to its food.
 *
 * Toddler traces a dotted curve from animal sprite to food sprite using
 * pointer proximity. Finger lift/stray pauses (no reset, no penalty).
 * Reaching the food triggers a completion chime + bounded splash/ray feedback. Three
 * pairs are traced per round (3 of 6 animal-food pairs randomly selected).
 */
export class AnimalTraceScene extends GameSceneBase {
  private pairs: AnimalFoodPair[] = [];
  private currentPairIndex = 0;
  private completedPaths = 0;
  private currentPair?: PairState;
  private isPointerDown = false;
  private ringRadius = NEXT_RING_RADIUS;
  private pathPulseTween?: { stop(): void };

  constructor() {
    super("AnimalTrace");
  }

  create(): void {
    sceneEntrance(this);
    this.createCornerMascot();
    this.createBackButton();

    // Reset all per-session state so a relaunch starts a fresh round.
    this.currentPairIndex = 0;
    this.completedPaths = 0;
    this.currentPair = undefined;
    this.progressDots = [];
    this.ringRadius = NEXT_RING_RADIUS;
    this.pathPulseTween = undefined;

    this.pairs = selectThreePairs();
    this.createProgressDots(3);
    this.renderPair(0);

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.isPointerDown = true;
      this.checkProximity(pointer.x, pointer.y);
    });

    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (this.isPointerDown) {
        this.checkProximity(pointer.x, pointer.y);
      }
    });

    this.input.on("pointerup", () => {
      this.isPointerDown = false;
    });

    this.registerShutdownCleanup();
  }

  /** Renders the pair at the given index: animal, food, dotted path, and curve. */
  private renderPair(index: number): void {
    if (this.currentPair) {
      this.currentPair.animalSprite.destroy();
      this.currentPair.foodSprite.destroy();
      this.currentPair.pathGraphics.destroy();
    }

    const pair = this.pairs[index];
    const pathPoints = generatePathPoints(ANIMAL_X, SPRITE_Y, FOOD_X, SPRITE_Y, PATH_POINTS);

    const animalSprite = this.add
      .image(ANIMAL_X, SPRITE_Y, `animal_${pair.animal}`)
      .setDisplaySize(SPRITE_SIZE, SPRITE_SIZE);

    const foodSprite = this.add
      .image(FOOD_X, SPRITE_Y, `food_${pair.food}`)
      .setDisplaySize(SPRITE_SIZE, SPRITE_SIZE);

    const pathGraphics = this.drawDottedPath(pathPoints);

    this.currentPair = {
      pair,
      pathPoints,
      progress: createPathProgress(PATH_POINTS),
      animalSprite,
      foodSprite,
      pathGraphics,
      complete: false,
    };

    this.startRingPulse();
  }

  /** Restarts the looping pulse on the next-waypoint ring (normal motion only). */
  private startRingPulse(): void {
    this.pathPulseTween?.stop();
    this.pathPulseTween = undefined;
    this.ringRadius = NEXT_RING_RADIUS;

    if (isReducedMotion()) return;

    const pulseTarget = { r: NEXT_RING_RADIUS };
    this.pathPulseTween = this.tweens.add({
      targets: pulseTarget,
      r: NEXT_RING_RADIUS * RING_PULSE_SCALE,
      duration: RING_PULSE_DURATION,
      yoyo: true,
      repeat: -1,
      onUpdate: () => {
        this.ringRadius = pulseTarget.r;
        if (this.currentPair) {
          this.redrawPathGuide(this.currentPair.pathGraphics, this.currentPair.pathPoints);
        }
      },
    });
  }

  /** Draws a dotted path through the given waypoints using Graphics. */
  private drawDottedPath(points: Array<{ x: number; y: number }>): Phaser.GameObjects.Graphics {
    const graphics = this.add.graphics();
    this.redrawPathGuide(graphics, points, 0);
    return graphics;
  }

  /**
   * Redraws the path guide: pending dots in ink, visited dots lit, and a
   * ring around the next waypoint.
   */
  private redrawPathGuide(
    graphics: Phaser.GameObjects.Graphics,
    points: Array<{ x: number; y: number }>,
    visited: number,
  ): void {
    graphics.clear();

    for (let i = 1; i < points.length - 1; i++) {
      if (i <= visited) {
        graphics.fillStyle(VISITED_COLOR, 1);
        graphics.fillCircle(points[i].x, points[i].y, DOT_RADIUS);
      } else {
        graphics.fillStyle(0x2d3748, 1);
        graphics.fillCircle(points[i].x, points[i].y, DOT_RADIUS);
      }
    }

    const nextIndex = visited + 1;
    // The path is complete once the animal sits on the final waypoint.
    if (visited < points.length - 1 && nextIndex < points.length) {
      graphics.lineStyle(NEXT_RING_WIDTH, NEXT_RING_COLOR, NEXT_RING_ALPHA);
      graphics.strokeCircle(points[nextIndex].x, points[nextIndex].y, this.ringRadius);
    }
  }

  /** Checks pointer proximity to the next path point and advances if within tolerance. */
  private checkProximity(x: number, y: number): void {
    if (!this.currentPair || this.currentPair.complete) return;
    if (isPathComplete(this.currentPair.progress)) return;

    const nextIndex = this.currentPair.progress.currentPoint + 1;
    const target = this.currentPair.pathPoints[nextIndex];
    const dist = Math.hypot(x - target.x, y - target.y);

    if (dist <= TRACE_TOLERANCE) {
      this.currentPair.progress = advancePath(this.currentPair.progress);
      const pos = this.currentPair.pathPoints[this.currentPair.progress.currentPoint];
      this.hopAnimalTo(pos);
      this.redrawPathGuide(
        this.currentPair.pathGraphics,
        this.currentPair.pathPoints,
        this.currentPair.progress.currentPoint,
      );

      if (isPathComplete(this.currentPair.progress)) {
        this.handlePathComplete();
      }
    }
  }

  /** Animates the animal hopping to the next waypoint with a small arc. */
  private hopAnimalTo(pos: { x: number; y: number }): void {
    const sprite = this.currentPair?.animalSprite;
    if (!sprite) return;

    const halfDuration = motionDuration(HOP_HALF_DURATION, HOP_HALF_REDUCED_DURATION);
    const apexY = pos.y - motionScale(HOP_ARC_Y, 0);

    this.tweens.add({
      targets: sprite,
      x: pos.x,
      y: apexY,
      duration: halfDuration,
      ease: "Sine.inOut",
      onComplete: () => {
        this.tweens.add({
          targets: sprite,
          y: pos.y,
          duration: halfDuration,
          ease: "Sine.inOut",
        });
      },
    });
  }

  /** Handles a single path completion: SFX, bounded feedback, advance to next pair. */
  private handlePathComplete(): void {
    if (!this.currentPair) return;
    this.currentPair.complete = true;
    this.audioManager.playCorrect();
    this.recordCorrect();
    this.mascot?.cheer();
    this.wiggleFood();
    createCompletionSplash(this, FOOD_X, SPRITE_Y);
    this.completedPaths++;
    this.fillProgressDot(this.completedPaths - 1);

    if (isRoundComplete(this.completedPaths)) {
      this.completeGame("animal-trace");
    } else {
      this.time.delayedCall(NEXT_PAIR_DELAY, () => {
        this.currentPairIndex++;
        this.renderPair(this.currentPairIndex);
      });
    }
  }

  /** Wiggles the food sprite when the animal reaches it. */
  private wiggleFood(): void {
    const food = this.currentPair?.foodSprite;
    if (!food) return;
    this.tweens.add({
      targets: food,
      angle: motionScale(FOOD_WIGGLE_ANGLE, FOOD_WIGGLE_REDUCED_ANGLE),
      duration: motionDuration(FOOD_WIGGLE_DURATION, FOOD_WIGGLE_REDUCED_DURATION),
      yoyo: true,
      repeat: FOOD_WIGGLE_REPEAT,
      ease: "Sine.inOut",
    });
  }
}
