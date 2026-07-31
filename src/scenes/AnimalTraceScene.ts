import Phaser from "phaser";
import { AudioManager } from "../audio/AudioManager";
import { ParentLock } from "../components/ParentLock";
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
import { earnSticker, hasSticker } from "../utils/storage";

/** X position for the animal sprite (left side). */
const ANIMAL_X = 200;

/** X position for the food sprite (right side). */
const FOOD_X = 824;

/** Y position for both sprites (vertical center). */
const SPRITE_Y = 384;

/** Display size for animal and food sprites. */
const SPRITE_SIZE = 128;

/** Base scale for sprites (display size / texture size). */
const SPRITE_BASE_SCALE = SPRITE_SIZE / 512;

/** Number of waypoints per path. */
const PATH_POINTS = 6;

/** Proximity tolerance for tracing (generous, per touch-ergonomics). */
const TRACE_TOLERANCE = 60;

/** Radius of each dot in the dotted path. */
const DOT_RADIUS = 6;

/** Delay before advancing to the next pair after path completion (ms). */
const NEXT_PAIR_DELAY = 1000;

/** Display size for the sticker unlock animation. */
const STICKER_DISPLAY_SIZE = 256;

/** Delay before auto-returning to Hub after round completion (ms). */
const AUTO_RETURN_DELAY = 3000;

/** Y position for the progress indicator dots. */
const PROGRESS_DOT_Y = 60;

/** Spacing between progress indicator dots. */
const PROGRESS_DOT_SPACING = 40;

/** Radius of each progress indicator dot. */
const PROGRESS_DOT_RADIUS = 8;

/** Tracks the state of the current pair being traced. */
interface PairState {
  pair: AnimalFoodPair;
  pathPoints: Array<{ x: number; y: number }>;
  path: Phaser.Curves.Path;
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
 * Reaching the food triggers a completion chime + particle burst. Three
 * pairs are traced per round (3 of 4 animal-food pairs randomly selected).
 */
export class AnimalTraceScene extends Phaser.Scene {
  private parentLock?: ParentLock;
  private pairs: AnimalFoodPair[] = [];
  private currentPairIndex = 0;
  private completedPaths = 0;
  private currentPair?: PairState;
  private isPointerDown = false;
  private progressDots: Phaser.GameObjects.Arc[] = [];
  private readonly audioManager: AudioManager;

  constructor() {
    super({ key: "AnimalTrace" });
    this.audioManager = AudioManager.getInstance();
  }

  create(): void {
    const backButton = this.add.text(20, 20, "← Back", {
      fontSize: "24px",
      color: "#2d3748",
    });
    backButton.setInteractive();

    this.parentLock = new ParentLock({
      scene: this,
      target: backButton,
      onSuccess: () => {
        this.scene.start("Hub");
      },
      onFailure: () => {
        // No action needed on failure.
      },
    });

    this.pairs = selectThreePairs();
    this.createProgressIndicator();
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

    this.events.on("shutdown", () => {
      this.parentLock?.destroy();
    });
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

    const path = new Phaser.Curves.Path(pathPoints[0].x, pathPoints[0].y);
    for (let i = 1; i < pathPoints.length; i++) {
      path.lineTo(pathPoints[i].x, pathPoints[i].y);
    }

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
      path,
      progress: createPathProgress(PATH_POINTS),
      animalSprite,
      foodSprite,
      pathGraphics,
      complete: false,
    };
  }

  /** Draws a dotted path through the given waypoints using Graphics. */
  private drawDottedPath(points: Array<{ x: number; y: number }>): Phaser.GameObjects.Graphics {
    const graphics = this.add.graphics();
    graphics.fillStyle(0x2d3748, 1);
    for (let i = 1; i < points.length - 1; i++) {
      graphics.fillCircle(points[i].x, points[i].y, DOT_RADIUS);
    }
    return graphics;
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
      this.currentPair.animalSprite.setPosition(pos.x, pos.y);

      if (isPathComplete(this.currentPair.progress)) {
        this.handlePathComplete();
      }
    }
  }

  /** Handles a single path completion: SFX, particle burst, advance to next pair. */
  private handlePathComplete(): void {
    if (!this.currentPair) return;
    this.currentPair.complete = true;
    this.audioManager.playCorrect();
    createCompletionSplash(this, FOOD_X, SPRITE_Y);
    this.completedPaths++;
    this.updateProgressIndicator();

    if (isRoundComplete(this.completedPaths)) {
      this.handleRoundComplete();
    } else {
      this.time.delayedCall(NEXT_PAIR_DELAY, () => {
        this.currentPairIndex++;
        this.renderPair(this.currentPairIndex);
      });
    }
  }

  /** Creates 3 progress indicator dots at the top of the screen. */
  private createProgressIndicator(): void {
    const startX = this.cameras.main.centerX - PROGRESS_DOT_SPACING;
    for (let i = 0; i < 3; i++) {
      const dot = this.add.circle(
        startX + i * PROGRESS_DOT_SPACING,
        PROGRESS_DOT_Y,
        PROGRESS_DOT_RADIUS,
        0x2d3748,
        0.3,
      );
      this.progressDots.push(dot);
    }
  }

  /** Highlights the progress dot for the most recently completed path. */
  private updateProgressIndicator(): void {
    const dot = this.progressDots[this.completedPaths - 1];
    if (dot) {
      dot.setAlpha(1);
    }
  }

  /** Handles round completion — win animation, sticker award, and auto-return. */
  private handleRoundComplete(): void {
    this.audioManager.playWin();

    if (this.currentPair) {
      this.tweens.add({
        targets: this.currentPair.animalSprite,
        scaleX: SPRITE_BASE_SCALE * 1.2,
        scaleY: SPRITE_BASE_SCALE * 1.2,
        duration: 300,
        yoyo: true,
      });
    }

    if (!hasSticker("animal-trace")) {
      earnSticker("animal-trace");
      this.audioManager.playSticker();
      this.createStickerAnimation();
    }

    this.time.delayedCall(AUTO_RETURN_DELAY, () => {
      this.scene.start("Hub");
    });
  }

  /** Shows a sticker unlock animation at the center of the screen. */
  private createStickerAnimation(): void {
    const stickerImage = this.add
      .image(this.cameras.main.centerX, this.cameras.main.centerY, "sticker_animal_trace")
      .setDisplaySize(STICKER_DISPLAY_SIZE, STICKER_DISPLAY_SIZE);

    const targetScaleX = stickerImage.scaleX;
    const targetScaleY = stickerImage.scaleY;
    stickerImage.setScale(0);

    this.tweens.add({
      targets: stickerImage,
      scaleX: targetScaleX,
      scaleY: targetScaleY,
      duration: 300,
      ease: "Back.out",
    });
  }
}
