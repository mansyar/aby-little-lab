import Phaser from "phaser";
import { AudioManager } from "../audio/AudioManager";
import { createCornerMascot, type Mascot } from "../components/Mascot";
import { ParentLock } from "../components/ParentLock";
import {
  type BoxInstance,
  generateRound,
  isMatch,
  isWin,
  type ScaleCategory,
  type ToyInstance,
} from "../game/bigSmallLogic";
import { createCompletionSplash, createWinCelebration } from "../utils/completionEffect";
import { attachDragLift, attachDropZoneHighlight, snapToSlot } from "../utils/dragJuice";
import { motionDuration, motionScale } from "../utils/motion";
import { attachPressFeedback } from "../utils/pressFeedback";
import { sceneEntrance, transitionToScene } from "../utils/sceneTransitions";
import { earnSticker, hasSticker } from "../utils/storage";

/** Y position for boxes (top area). */
const BOX_Y = 200;

/** Y position for toys (bottom area). */
const TOY_Y = 580;

/** Base display size for toys before scale is applied (ideal 96x96px). */
const TOY_BASE_SIZE = 96;

/** Base display size for boxes before scale is applied. */
const BOX_BASE_SIZE = 128;

/** Drop zone size (inflated for generous snap radius per touch-ergonomics). */
const DROP_ZONE_SIZE = 160;

/** Tween duration for bounce-back animation (ms). */
const BOUNCE_DURATION = 300;

/** Duration of the bounce-back under reduced motion (ms). */
const BOUNCE_REDUCED_DURATION = 180;

/** Display size for the sticker unlock animation. */
const STICKER_DISPLAY_SIZE = 256;

/** Delay before auto-returning to Hub after round completion (ms). */
const AUTO_RETURN_DELAY = 3000;

/** Texture size for SVG assets (used to calculate base scale). */
const TEXTURE_SIZE = 512;

/** Duration of the shrink-into-box tween on a correct drop (ms). */
const SHRINK_DURATION = 150;

/** Duration of the shrink-into-box tween under reduced motion (ms). */
const SHRINK_REDUCED_DURATION = 90;

/** Box lid wiggle angle (degrees) on a correct drop. */
const BOX_WIGGLE_ANGLE = 3;

/** Duration of one box lid wiggle half-cycle (ms). */
const BOX_WIGGLE_DURATION = 200;

/** Duration of one box lid wiggle half-cycle under reduced motion (ms). */
const BOX_WIGGLE_REDUCED_DURATION = 120;

/** Number of wiggle half-cycles (yoyo repeat); even count ends upright. */
const BOX_WIGGLE_REPEAT = 3;

/** Brief box scale bump on a correct drop. */
const BOX_BUMP_SCALE = 1.05;

/** Box scale bump under reduced motion. */
const BOX_BUMP_REDUCED_SCALE = 1.02;

/** Duration of the box scale bump (ms). */
const BOX_BUMP_DURATION = 250;

/** Duration of the box scale bump under reduced motion (ms). */
const BOX_BUMP_REDUCED_DURATION = 150;

/** Tracks a draggable toy's state during the round. */
interface ToyData {
  obj: Phaser.GameObjects.Image;
  scaleCategory: ScaleCategory;
  baseScale: number;
  originX: number;
  originY: number;
  sorted: boolean;
  droppedOnZone: boolean;
}

/** Tracks a box's drop zone and position. */
interface BoxSlotData {
  zone: Phaser.GameObjects.Zone;
  scaleCategory: ScaleCategory;
  x: number;
  y: number;
  obj: Phaser.GameObjects.Image;
}

/**
 * Big vs. Small Cleaner scene — drag toys into matching big/small boxes.
 *
 * Round initialization generates 6 toy instances (3 big + 3 small) and 2 boxes.
 * Toys are dragged via Phaser Pointer Drag to matching scale-category boxes.
 * Correct drops snap to box center with SFX + bounded splash/ray feedback; incorrect drops
 * bounce back gently with a soft tone.
 */
export class BigSmallScene extends Phaser.Scene {
  private parentLock?: ParentLock;
  private mascot?: Mascot;
  private round: { toys: ToyInstance[]; boxes: BoxInstance[] } = {
    toys: [],
    boxes: [],
  };
  private toyData: ToyData[] = [];
  private boxSlots: BoxSlotData[] = [];
  private sortedCount = 0;
  private readonly audioManager: AudioManager;

  constructor() {
    super({ key: "BigSmall" });
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

    this.initRound();

    this.events.on("shutdown", () => {
      this.parentLock?.destroy();
      this.mascot?.destroy();
      this.mascot = undefined;
    });
  }

  /** Initializes a new round: generates toys and boxes, renders them on screen. */
  private initRound(): void {
    this.round = generateRound();
    this.boxSlots = [];
    this.toyData = [];
    this.sortedCount = 0;
    this.createBoxSlots();
    attachDropZoneHighlight(
      this,
      this.boxSlots.map((s) => ({
        zone: s.zone,
        x: s.x,
        y: s.y,
        width: DROP_ZONE_SIZE,
        height: DROP_ZONE_SIZE,
      })),
    );
    this.createToys();
  }

  /** Creates box images and drop zones at the top of the screen. */
  private createBoxSlots(): void {
    const spacing = this.scale.width / (this.round.boxes.length + 1);
    for (let i = 0; i < this.round.boxes.length; i++) {
      const x = spacing * (i + 1);
      const box = this.round.boxes[i];
      const displaySize = BOX_BASE_SIZE * box.scale;
      const boxObj = this.add.image(x, BOX_Y, "toy_box");
      boxObj.setDisplaySize(displaySize, displaySize);

      const zone = this.add.zone(x, BOX_Y, DROP_ZONE_SIZE, DROP_ZONE_SIZE);
      zone.setInteractive({ dropZone: true });

      this.boxSlots.push({ zone, scaleCategory: box.scaleCategory, x, y: BOX_Y, obj: boxObj });
    }
  }

  /** Creates interactive draggable toy images at the bottom of the screen. */
  private createToys(): void {
    const spacing = this.scale.width / (this.round.toys.length + 1);
    for (let i = 0; i < this.round.toys.length; i++) {
      const x = spacing * (i + 1);
      const toy = this.round.toys[i];
      const displaySize = TOY_BASE_SIZE * toy.scale;
      const baseScale = displaySize / TEXTURE_SIZE;
      const obj = this.add
        .image(x, TOY_Y, `toy_${toy.type}`)
        .setDisplaySize(displaySize, displaySize)
        .setInteractive();

      this.input.setDraggable(obj);

      const data: ToyData = {
        obj,
        scaleCategory: toy.scaleCategory,
        baseScale,
        originX: x,
        originY: TOY_Y,
        sorted: false,
        droppedOnZone: false,
      };

      obj.on("drag", (_pointer: unknown, dragX: number, dragY: number) => {
        obj.setPosition(dragX, dragY);
      });

      obj.on("drop", (_pointer: unknown, target: unknown) => {
        this.handleDrop(data, target);
      });

      obj.on("dragend", () => {
        this.handleDragEnd(data);
      });

      attachDragLift(obj, { skipRestore: () => data.sorted });

      this.toyData.push(data);
    }
  }

  /** Handles a toy being dropped on a zone. Snaps on correct match, otherwise no-ops. */
  private handleDrop(data: ToyData, target: unknown): void {
    const slot = this.boxSlots.find((s) => s.zone === target);
    if (!slot) return;

    data.droppedOnZone = true;

    if (isMatch(data.scaleCategory, slot.scaleCategory)) {
      snapToSlot(this, data.obj, slot.x, slot.y);
      this.tweens.add({
        targets: data.obj,
        scaleX: 0,
        scaleY: 0,
        duration: motionDuration(SHRINK_DURATION, SHRINK_REDUCED_DURATION),
        ease: "Sine.in",
      });
      this.reactBox(slot);
      data.obj.disableInteractive();
      data.sorted = true;
      this.sortedCount++;
      this.audioManager.playCorrect();
      this.mascot?.cheer();
      createCompletionSplash(this, slot.x, slot.y);

      if (isWin(this.sortedCount)) {
        this.handleComplete();
      }
    }
  }

  /** Adds the box drop reaction: lid wiggle and a brief scale bump. */
  private reactBox(slot: BoxSlotData): void {
    const box = slot.obj;
    const baseScaleX = box.scaleX;
    const baseScaleY = box.scaleY;

    this.tweens.add({
      targets: box,
      angle: BOX_WIGGLE_ANGLE,
      duration: motionDuration(BOX_WIGGLE_DURATION, BOX_WIGGLE_REDUCED_DURATION),
      yoyo: true,
      repeat: BOX_WIGGLE_REPEAT,
      ease: "Sine.inOut",
    });

    this.tweens.add({
      targets: box,
      scaleX: baseScaleX * motionScale(BOX_BUMP_SCALE, BOX_BUMP_REDUCED_SCALE),
      scaleY: baseScaleY * motionScale(BOX_BUMP_SCALE, BOX_BUMP_REDUCED_SCALE),
      duration: motionDuration(BOX_BUMP_DURATION, BOX_BUMP_REDUCED_DURATION),
      yoyo: true,
      ease: "Sine.inOut",
    });
  }

  /** Handles drag end. Bounces toy back to origin; plays incorrect SFX only if dropped on a zone. */
  private handleDragEnd(data: ToyData): void {
    if (!data.sorted) {
      if (data.droppedOnZone) {
        this.audioManager.playIncorrect();
        this.mascot?.nod();
      }
      this.tweens.add({
        targets: data.obj,
        x: data.originX,
        y: data.originY,
        duration: motionDuration(BOUNCE_DURATION, BOUNCE_REDUCED_DURATION),
        ease: "Back.out",
      });
      data.droppedOnZone = false;
    }
  }

  /** Handles round completion: win animation, sticker award, and auto-return to Hub. */
  private handleComplete(): void {
    this.audioManager.playWin();
    this.mascot?.cheer(true);

    createWinCelebration(this, this.cameras.main.centerX, this.cameras.main.centerY);

    const earnedNow = !hasSticker("big-small");
    if (earnedNow) {
      earnSticker("big-small");
      this.audioManager.playSticker();
      this.createStickerAnimation();
    }

    this.time.delayedCall(AUTO_RETURN_DELAY, () => {
      transitionToScene(this, "Hub", earnedNow ? { justEarned: "big-small" } : undefined);
    });
  }

  /** Shows a sticker unlock animation at the center of the screen. */
  private createStickerAnimation(): void {
    const stickerScale = STICKER_DISPLAY_SIZE / TEXTURE_SIZE;
    const stickerImage = this.add
      .image(this.cameras.main.centerX, this.cameras.main.centerY, "sticker_big_small")
      .setScale(0);

    this.tweens.add({
      targets: stickerImage,
      scaleX: stickerScale,
      scaleY: stickerScale,
      duration: motionDuration(300, 180),
      ease: "Back.out",
    });
  }
}
