import Phaser from "phaser";
import { AudioManager } from "../audio/AudioManager";
import { ParentLock } from "../components/ParentLock";
import { isMatch, type ShapeType, selectThreeShapes, shuffle } from "../game/shapeSorterLogic";
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

/** Texture key used for particle bursts. */
const PARTICLE_TEXTURE = "shape_circle";

/** Display size for the sticker unlock animation. */
const STICKER_DISPLAY_SIZE = 256;

/** Particle count for celebration bursts (reduced when prefers-reduced-motion). */
const PARTICLE_COUNT = 12;
const PARTICLE_COUNT_REDUCED = 6;

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
 * to matching cutout slots. Correct drops snap to center with SFX + particles;
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
      this.createParticleBurst(slot.x, slot.y);

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

  /** Returns true if the user has requested reduced motion via OS settings. */
  private prefersReducedMotion(): boolean {
    return (
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  /** Creates a soft particle burst at the given position. */
  private createParticleBurst(x: number, y: number): void {
    this.add.particles(x, y, PARTICLE_TEXTURE, {
      speed: { min: 50, max: 150 },
      lifespan: 800,
      quantity: this.prefersReducedMotion() ? PARTICLE_COUNT_REDUCED : PARTICLE_COUNT,
      scale: { start: 0.3, end: 0 },
    });
  }

  /** Handles round completion: win animation, sticker award, and auto-return to Hub. */
  private handleComplete(): void {
    this.audioManager.playWin();

    for (const shape of this.shapes) {
      this.tweens.add({
        targets: shape.obj,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 300,
        yoyo: true,
      });
    }

    if (!hasSticker("shape-sorter")) {
      earnSticker("shape-sorter");
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
      .image(this.cameras.main.centerX, this.cameras.main.centerY, "sticker_shape_sorter")
      .setDisplaySize(STICKER_DISPLAY_SIZE, STICKER_DISPLAY_SIZE)
      .setScale(0);

    this.tweens.add({
      targets: stickerImage,
      scaleX: 1,
      scaleY: 1,
      duration: 300,
      ease: "Back.out",
    });
  }
}
