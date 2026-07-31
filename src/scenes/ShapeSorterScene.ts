import Phaser from "phaser";
import { AudioManager } from "../audio/AudioManager";
import { ParentLock } from "../components/ParentLock";
import { isMatch, type ShapeType, selectThreeShapes, shuffle } from "../game/shapeSorterLogic";
import { createCompletionSplash, createWinCelebration } from "../utils/completionEffect";
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

/** Display size for the sticker unlock animation. */
const STICKER_DISPLAY_SIZE = 256;

/** Delay before auto-returning to Hub after round completion (ms). */
const AUTO_RETURN_DELAY = 3000;

/** Tracks a draggable shape's state during the round. */
interface ShapeData {
  obj: Phaser.GameObjects.Image;
  type: ShapeType;
  originX: number;
  originY: number;
  placed: boolean;
}

/** Tracks a slot's drop zone and position. */
interface SlotData {
  zone: Phaser.GameObjects.Zone;
  type: ShapeType;
  x: number;
  y: number;
}

/**
 * Shape Sorter scene — drag geometric shapes to matching cut-out slots.
 *
 * Round initialization selects 3 of 4 shapes, shuffles slot positions and
 * shape positions independently. Shapes are dragged via Phaser Pointer Drag
 * to matching cutout slots. Correct drops snap to center with SFX + bounded splash/ray feedback;
 * incorrect drops bounce back gently with a soft tone.
 */
export class ShapeSorterScene extends Phaser.Scene {
  private parentLock?: ParentLock;
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

    this.initRound();

    this.events.on("shutdown", () => {
      this.parentLock?.destroy();
    });
  }

  /** Initializes a new round: selects shapes, shuffles positions, renders slots and shapes. */
  private initRound(): void {
    this.selectedShapes = selectThreeShapes();
    this.slotOrder = shuffle(this.selectedShapes);
    this.shapeOrder = shuffle(this.selectedShapes);

    this.createSlots();
    this.createShapes();
  }

  /** Creates cutout slot images and drop zones at the top of the screen. */
  private createSlots(): void {
    const spacing = this.scale.width / (this.selectedShapes.length + 1);
    for (let i = 0; i < this.slotOrder.length; i++) {
      const x = spacing * (i + 1);
      const slotType = this.slotOrder[i];
      this.add
        .image(x, SLOT_Y, `cutout_${slotType}`)
        .setDisplaySize(SHAPE_DISPLAY_SIZE, SHAPE_DISPLAY_SIZE);

      const zone = this.add.zone(x, SLOT_Y, DROP_ZONE_SIZE, DROP_ZONE_SIZE);
      zone.setInteractive({ dropZone: true });

      this.slots.push({ zone, type: slotType, x, y: SLOT_Y });
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

      this.shapes.push(shapeData);
    }
  }

  /** Handles a shape being dropped on a zone. Snaps on correct match, otherwise no-ops. */
  private handleDrop(shape: ShapeData, target: unknown): void {
    const slot = this.slots.find((s) => s.zone === target);
    if (!slot) return;

    if (isMatch(shape.type, slot.type)) {
      shape.obj.setPosition(slot.x, slot.y);
      shape.obj.disableInteractive();
      shape.placed = true;
      this.audioManager.playCorrect();
      createCompletionSplash(this, slot.x, slot.y);

      if (this.shapes.every((s) => s.placed)) {
        this.handleComplete();
      }
    }
  }

  /** Handles drag end. Bounces shape back to origin with wobble if not placed. */
  private handleDragEnd(shape: ShapeData): void {
    if (!shape.placed) {
      this.audioManager.playIncorrect();
      this.tweens.add({
        targets: shape.obj,
        x: shape.originX,
        y: shape.originY,
        duration: BOUNCE_DURATION,
        ease: "Back.out",
      });
    }
  }

  /** Handles round completion: win animation, sticker award, and auto-return to Hub. */
  private handleComplete(): void {
    this.audioManager.playWin();

    createWinCelebration(this, this.cameras.main.centerX, this.cameras.main.centerY);

    if (!hasSticker("shape-sorter")) {
      earnSticker("shape-sorter");
      this.audioManager.playSticker();
      this.createStickerAnimation();
    }

    this.time.delayedCall(AUTO_RETURN_DELAY, () => {
      transitionToScene(this, "Hub");
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
      duration: 300,
      ease: "Back.out",
    });
  }
}
