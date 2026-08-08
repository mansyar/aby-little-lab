import type Phaser from "phaser";
import { generatePlaythrough, isMatch, type ShapeType, shuffle } from "../game/shapeSorterLogic";
import { createCompletionSplash } from "../utils/completionEffect";
import { attachDragLift, attachDropZoneHighlight, snapToSlot } from "../utils/dragJuice";
import { motionDuration } from "../utils/motion";
import { sceneEntrance } from "../utils/sceneTransitions";
import { GameSceneBase } from "./GameSceneBase";

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

/** Number of rounds per play session. */
const ROUND_COUNT = 3;

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
export class ShapeSorterScene extends GameSceneBase {
  // Shape Sorter's larger dots sit above the slots, with a shorter pop and a
  // longer inter-round delay than the shared defaults.
  protected readonly PROGRESS_DOT_Y = 100;
  protected readonly PROGRESS_DOT_RADIUS = 18;
  protected readonly PROGRESS_DOT_SPACING = 64;
  protected readonly DOT_POP_REDUCED_SCALE = 1.15;
  protected readonly DOT_POP_DURATION = 220;
  protected readonly DOT_POP_REDUCED_DURATION = 140;
  protected readonly NEXT_ROUND_DELAY = 1200;

  private playthrough: ShapeType[][] = [];
  private roundIndex = 0;
  private selectedShapes: ShapeType[] = [];
  private slotOrder: ShapeType[] = [];
  private shapeOrder: ShapeType[] = [];
  private shapes: ShapeData[] = [];
  private slots: SlotData[] = [];

  constructor() {
    super("ShapeSorter");
  }

  create(): void {
    sceneEntrance(this);
    this.createCornerMascot();
    this.createBackButton();

    this.playthrough = generatePlaythrough(ROUND_COUNT);
    this.roundIndex = 0;
    this.progressDots = [];
    this.createProgressDots(ROUND_COUNT);
    this.initRound();

    this.registerShutdownCleanup();
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
    this.fillProgressDot(this.roundIndex);

    if (this.roundIndex < this.playthrough.length - 1) {
      this.time.delayedCall(this.NEXT_ROUND_DELAY, () => {
        this.teardownRound();
        this.roundIndex += 1;
        this.initRound();
      });
    } else {
      this.completeGame("shape-sorter");
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
}
