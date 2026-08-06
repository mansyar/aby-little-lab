import Phaser from "phaser";
import { AudioManager } from "../audio/AudioManager";
import { createCornerMascot, type Mascot } from "../components/Mascot";
import { ParentLock } from "../components/ParentLock";
import { generatePlaythrough, isMatch, type ShapeType, shuffle } from "../game/shapeSorterLogic";
import { createCompletionSplash, createWinCelebration } from "../utils/completionEffect";
import { attachDragLift, attachDropZoneHighlight, snapToSlot } from "../utils/dragJuice";
import { motionDuration, motionScale } from "../utils/motion";
import { attachPressFeedback } from "../utils/pressFeedback";
import { sceneEntrance, transitionToScene } from "../utils/sceneTransitions";
import { earnSticker, hasSticker } from "../utils/storage";

/** Y position for cutout slots (top area). */
const SLOT_Y = 200;

/** Y position for draggable shapes (bottom area). */
const SHAPE_Y = 600;

/** Display size for shapes and slots (exceeds 96px ideal touch target). */
const SHAPE_DISPLAY_SIZE = 128;

/** Drop zone size (inflated for generous snap radius per touch-ergonomics). */
const DROP_ZONE_SIZE = 160;

/** Tween duration for bounce-back animation (ms). */
const BOUNCE_DURATION = 300;

/** Duration of the bounce-back under reduced motion (ms). */
const BOUNCE_REDUCED_DURATION = 180;

/** Display size for the sticker unlock animation. */
const STICKER_DISPLAY_SIZE = 256;

/** Delay before auto-returning to Hub after session completion (ms). */
const AUTO_RETURN_DELAY = 3000;

/** Number of rounds per play session. */
const ROUND_COUNT = 3;

/** Delay before advancing to the next round (ms). */
const NEXT_ROUND_DELAY = 1200;

/** Y position for round progress dots (above the slots). */
const PROGRESS_DOT_Y = 100;

/** Radius of round progress dots. */
const PROGRESS_DOT_RADIUS = 18;

/** Horizontal spacing between progress dots. */
const PROGRESS_DOT_SPACING = 64;

/** Alpha of unfilled progress dots. */
const PROGRESS_DOT_ALPHA = 0.3;

/** Pop scale for the progress dot fill animation. */
const DOT_POP_SCALE = 1.4;

/** Pop scale for the progress dot under reduced motion. */
const DOT_POP_REDUCED_SCALE = 1.15;

/** Pop tween duration (ms). */
const DOT_POP_DURATION = 220;

/** Pop tween duration under reduced motion (ms). */
const DOT_POP_REDUCED_DURATION = 140;

/** Tracks a draggable shape's state during the round. */
interface ShapeData {
  obj: Phaser.GameObjects.Image;
  type: ShapeType;
  originX: number;
  originY: number;
  placed: boolean;
  droppedOnZone: boolean;
}

/** Tracks a slot's drop zone, image, and position. */
interface SlotData {
  zone: Phaser.GameObjects.Zone;
  img: Phaser.GameObjects.Image;
  type: ShapeType;
  x: number;
  y: number;
}

/**
 * Shape Sorter scene — drag geometric shapes to matching cut-out slots.
 *
 * A session is 3 rounds of 3 shapes drawn without repeats from the 18-shape
 * pool. Slot positions and shape positions are shuffled independently each
 * round; progress dots fill above the slots. Correct drops snap to center
 * with SFX + bounded splash/ray feedback; incorrect drops bounce back gently
 * with a soft tone. Win celebration + sticker award happen after the final
 * round.
 */
export class ShapeSorterScene extends Phaser.Scene {
  private parentLock?: ParentLock;
  private mascot?: Mascot;
  private playthrough: ShapeType[][] = [];
  private roundIndex = 0;
  private progressDots: Phaser.GameObjects.Arc[] = [];
  private selectedShapes: ShapeType[] = [];
  private slotOrder: ShapeType[] = [];
  private shapeOrder: ShapeType[] = [];
  private shapes: ShapeData[] = [];
  private slots: SlotData[] = [];
  private readonly audioManager: AudioManager;

  constructor() {
    super({ key: "ShapeSorter" });
    this.audioManager = AudioManager.getInstance();
  }

  create(): void {
    sceneEntrance(this);
    this.mascot = createCornerMascot(this);

    const backButton = this.add.text(20, 20, "← Back", {
      fontSize: "24px",
      color: "#2d3748",
    });
    backButton.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(0, 0, 96, 96),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
    });

    this.parentLock = new ParentLock({
      scene: this,
      target: backButton,
      onSuccess: () => {
        transitionToScene(this, "Hub");
      },
      onFailure: () => {
        // No action needed on failure.
      },
    });
    attachPressFeedback(backButton);

    this.playthrough = generatePlaythrough(ROUND_COUNT);
    this.roundIndex = 0;
    this.createProgressDots();
    this.initRound();

    this.events.on("shutdown", () => {
      this.parentLock?.destroy();
      this.mascot?.destroy();
      this.mascot = undefined;
    });
  }

  /** Initializes the current round: selects its shapes, shuffles positions, renders slots and shapes. */
  private initRound(): void {
    const roundShapes = this.playthrough[this.roundIndex];
    this.selectedShapes = roundShapes;
    this.slotOrder = shuffle(roundShapes);
    this.shapeOrder = shuffle(roundShapes);
    this.shapes = [];
    this.slots = [];

    this.createSlots();
    attachDropZoneHighlight(
      this,
      this.slots.map((s) => ({
        zone: s.zone,
        x: s.x,
        y: s.y,
        width: DROP_ZONE_SIZE,
        height: DROP_ZONE_SIZE,
      })),
    );
    this.createShapes();
  }

  /** Creates cutout slot images and drop zones at the top of the screen. */
  private createSlots(): void {
    const spacing = this.scale.width / (this.selectedShapes.length + 1);
    for (let i = 0; i < this.slotOrder.length; i++) {
      const x = spacing * (i + 1);
      const slotType = this.slotOrder[i];
      const img = this.add
        .image(x, SLOT_Y, `cutout_${slotType}`)
        .setDisplaySize(SHAPE_DISPLAY_SIZE, SHAPE_DISPLAY_SIZE);

      const zone = this.add.zone(x, SLOT_Y, DROP_ZONE_SIZE, DROP_ZONE_SIZE);
      zone.setInteractive({ dropZone: true });

      this.slots.push({ zone, img, type: slotType, x, y: SLOT_Y });
    }
  }

  /** Creates interactive draggable shape images at the bottom of the screen. */
  private createShapes(): void {
    const spacing = this.scale.width / (this.selectedShapes.length + 1);
    for (let i = 0; i < this.shapeOrder.length; i++) {
      const x = spacing * (i + 1);
      const shapeType = this.shapeOrder[i];
      const obj = this.add
        .image(x, SHAPE_Y, `shape_${shapeType}`)
        .setDisplaySize(SHAPE_DISPLAY_SIZE, SHAPE_DISPLAY_SIZE)
        .setInteractive();

      this.input.setDraggable(obj);

      const shapeData: ShapeData = {
        obj,
        type: shapeType,
        originX: x,
        originY: SHAPE_Y,
        placed: false,
        droppedOnZone: false,
      };

      obj.on("drag", (_pointer: unknown, dragX: number, dragY: number) => {
        obj.setPosition(dragX, dragY);
      });

      obj.on("drop", (_pointer: unknown, target: unknown) => {
        this.handleDrop(shapeData, target);
      });

      obj.on("dragend", () => {
        this.handleDragEnd(shapeData);
      });

      attachDragLift(obj);

      this.shapes.push(shapeData);
    }
  }

  /** Handles a shape being dropped on a zone. Snaps on correct match, otherwise no-ops. */
  private handleDrop(shape: ShapeData, target: unknown): void {
    const slot = this.slots.find((s) => s.zone === target);
    if (!slot) return;

    shape.droppedOnZone = true;

    if (isMatch(shape.type, slot.type)) {
      snapToSlot(this, shape.obj, slot.x, slot.y);
      shape.obj.disableInteractive();
      shape.placed = true;
      this.audioManager.playCorrect();
      this.mascot?.cheer();
      createCompletionSplash(this, slot.x, slot.y);

      if (this.shapes.every((s) => s.placed)) {
        this.handleRoundComplete();
      }
    }
  }

  /**
   * Called when all three shapes of the current round are placed. Fills the
   * progress dot, then either advances to the next round or completes the
   * session when the final round is done.
   */
  private handleRoundComplete(): void {
    this.fillProgressDot();

    if (this.roundIndex < this.playthrough.length - 1) {
      this.time.delayedCall(NEXT_ROUND_DELAY, () => {
        this.teardownRound();
        this.roundIndex += 1;
        this.initRound();
      });
    } else {
      this.handleComplete();
    }
  }

  /** Removes the current round's shapes, slot images, and drop zones. */
  private teardownRound(): void {
    for (const shape of this.shapes) {
      shape.obj.destroy();
    }
    for (const slot of this.slots) {
      slot.img.destroy();
      slot.zone.destroy();
    }
    this.shapes = [];
    this.slots = [];
  }

  /** Creates the round progress dots above the slots. */
  private createProgressDots(): void {
    const startX = this.cameras.main.centerX - ((ROUND_COUNT - 1) * PROGRESS_DOT_SPACING) / 2;
    for (let i = 0; i < ROUND_COUNT; i++) {
      const dot = this.add
        .circle(startX + i * PROGRESS_DOT_SPACING, PROGRESS_DOT_Y, PROGRESS_DOT_RADIUS, 0x2d3748)
        .setAlpha(PROGRESS_DOT_ALPHA);
      this.progressDots.push(dot);
    }
  }

  /** Fills and pops the progress dot for the just-completed round. */
  private fillProgressDot(): void {
    const dot = this.progressDots[this.roundIndex];
    dot.setAlpha(1);
    this.tweens.add({
      targets: dot,
      scaleX: motionScale(DOT_POP_SCALE, DOT_POP_REDUCED_SCALE),
      scaleY: motionScale(DOT_POP_SCALE, DOT_POP_REDUCED_SCALE),
      duration: motionDuration(DOT_POP_DURATION, DOT_POP_REDUCED_DURATION),
      ease: "Back.out",
      yoyo: true,
    });
  }

  /** Handles drag end. Bounces shape back to origin with wobble if not placed. */
  private handleDragEnd(shape: ShapeData): void {
    if (!shape.placed) {
      if (shape.droppedOnZone) {
        this.audioManager.playIncorrect();
        this.mascot?.nod();
      }
      this.tweens.add({
        targets: shape.obj,
        x: shape.originX,
        y: shape.originY,
        duration: motionDuration(BOUNCE_DURATION, BOUNCE_REDUCED_DURATION),
        ease: "Back.out",
      });
      shape.droppedOnZone = false;
    }
  }

  /** Handles session completion: win animation, sticker award, and auto-return to Hub. */
  private handleComplete(): void {
    this.audioManager.playWin();
    this.mascot?.cheer(true);

    createWinCelebration(this, this.cameras.main.centerX, this.cameras.main.centerY);

    const earnedNow = !hasSticker("shape-sorter");
    if (earnedNow) {
      earnSticker("shape-sorter");
      this.audioManager.playSticker();
      this.createStickerAnimation();
    }

    this.time.delayedCall(AUTO_RETURN_DELAY, () => {
      transitionToScene(this, "Hub", earnedNow ? { justEarned: "shape-sorter" } : undefined);
    });
  }

  /** Shows a sticker unlock animation at the center of the screen. */
  private createStickerAnimation(): void {
    const stickerScale = STICKER_DISPLAY_SIZE / 512;
    const stickerImage = this.add
      .image(this.cameras.main.centerX, this.cameras.main.centerY, "sticker_shape_sorter")
      .setScale(0);

    this.tweens.add({
      targets: stickerImage,
      scaleX: stickerScale,
      scaleY: stickerScale,
      duration: motionDuration(300, 180),
      delay: motionDuration(400, 250),
      ease: "Back.out",
    });
  }
}
