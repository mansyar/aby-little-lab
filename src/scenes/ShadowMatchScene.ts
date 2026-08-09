import type Phaser from "phaser";
import { generateRound, isMatch, isWin, type ObjectType } from "../game/shadowMatchLogic";
import { createCompletionSplash } from "../utils/completionEffect";
import { attachDragLift, attachDropZoneHighlight, snapToSlot } from "../utils/dragJuice";
import { motionDuration, motionScale } from "../utils/motion";
import { sceneEntrance } from "../utils/sceneTransitions";
import { GameSceneBase } from "./GameSceneBase";

/** Y position for shadow silhouettes (top area). */
const SHADOW_Y = 200;

/** Y position for draggable objects (bottom area). */
const OBJECT_Y = 600;

/** Display size for objects and shadows (ideal 96x96px touch target per spec). */
const DISPLAY_SIZE = 112;

/** Drop zone size (inflated for generous snap radius per touch-ergonomics). */
const DROP_ZONE_SIZE = 160;

/** Tween duration for bounce-back animation (ms). */
const BOUNCE_DURATION = 300;

/** Duration of the bounce-back under reduced motion (ms). */
const BOUNCE_REDUCED_DURATION = 180;

/** Shadow stamp scale pulse on a correct drop. */
const STAMP_SCALE = 1.1;

/** Shadow stamp scale pulse under reduced motion. */
const STAMP_REDUCED_SCALE = 1.05;

/** Duration of the shadow stamp pulse (ms). */
const STAMP_DURATION = 200;

/** Duration of the shadow stamp pulse under reduced motion (ms). */
const STAMP_REDUCED_DURATION = 120;

/** Color of the brief fill flash behind the shadow on a match. */
const FLASH_COLOR = 0xffffff;

/** Alpha of the fill flash on a match. */
const FLASH_ALPHA = 0.7;

/** Duration of the fill flash fade-out (ms). */
const FLASH_DURATION = 150;

/** Duration of the fill flash fade-out under reduced motion (ms). */
const FLASH_REDUCED_DURATION = 90;

/** Target alpha for a matched object (dims to reveal the shadow beneath). */
const DIM_ALPHA = 0.5;

/** Duration of the matched-object dim tween (ms). */
const DIM_DURATION = 200;

/** Duration of the matched-object dim under reduced motion (ms). */
const DIM_REDUCED_DURATION = 120;

/** Tracks a draggable object's state during the round. */
interface ObjectData {
  obj: Phaser.GameObjects.Image;
  type: ObjectType;
  originX: number;
  originY: number;
  matched: boolean;
  droppedOnZone: boolean;
}

/** Tracks a shadow slot's drop zone and position. */
interface ShadowSlotData {
  zone: Phaser.GameObjects.Zone;
  type: ObjectType;
  x: number;
  y: number;
  obj: Phaser.GameObjects.Image;
}

/**
 * Shadow Match scene — drag colored objects to matching dark silhouettes.
 *
 * Round initialization generates 6 of 8 object-silhouette pairs with independently
 * shuffled positions. Objects are dragged via Phaser Pointer Drag to matching
 * shadow silhouettes. Correct drops snap to center with SFX + bounded splash/ray feedback;
 * incorrect drops bounce back gently with a soft tone.
 */
export class ShadowMatchScene extends GameSceneBase {
  private round: { objects: ObjectType[]; shadows: ObjectType[] } = {
    objects: [],
    shadows: [],
  };
  private objectData: ObjectData[] = [];
  private shadowSlots: ShadowSlotData[] = [];
  private matchedCount = 0;

  constructor() {
    super("ShadowMatch");
  }

  create(): void {
    sceneEntrance(this);
    this.createCornerMascot();
    this.createBackButton();

    this.initRound();

    this.registerShutdownCleanup();
  }

  /** Initializes a new round: generates pairs, shuffles positions, renders shadows and objects. */
  private initRound(): void {
    this.round = generateRound();
    this.shadowSlots = [];
    this.objectData = [];
    this.matchedCount = 0;
    this.createShadowSlots();
    attachDropZoneHighlight(
      this,
      this.shadowSlots.map((s) => ({
        zone: s.zone,
        x: s.x,
        y: s.y,
        width: DROP_ZONE_SIZE,
        height: DROP_ZONE_SIZE,
      })),
    );
    this.createObjects();
  }

  /** Creates shadow silhouette images and drop zones at the top of the screen. */
  private createShadowSlots(): void {
    const spacing = this.scale.width / (this.round.shadows.length + 1);
    for (let i = 0; i < this.round.shadows.length; i++) {
      const x = spacing * (i + 1);
      const shadowType = this.round.shadows[i];
      const shadowObj = this.add.image(x, SHADOW_Y, `sm_shadow_${shadowType}`);
      shadowObj.setDisplaySize(DISPLAY_SIZE, DISPLAY_SIZE);

      const zone = this.add.zone(x, SHADOW_Y, DROP_ZONE_SIZE, DROP_ZONE_SIZE);
      zone.setInteractive({ dropZone: true });

      this.shadowSlots.push({ zone, type: shadowType, x, y: SHADOW_Y, obj: shadowObj });
    }
  }

  /** Creates interactive draggable object images at the bottom of the screen. */
  private createObjects(): void {
    const spacing = this.scale.width / (this.round.objects.length + 1);
    for (let i = 0; i < this.round.objects.length; i++) {
      const x = spacing * (i + 1);
      const objectType = this.round.objects[i];
      const obj = this.add
        .image(x, OBJECT_Y, `sm_${objectType}`)
        .setDisplaySize(DISPLAY_SIZE, DISPLAY_SIZE)
        .setInteractive();

      this.input.setDraggable(obj);

      const data: ObjectData = {
        obj,
        type: objectType,
        originX: x,
        originY: OBJECT_Y,
        matched: false,
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

      attachDragLift(obj);

      this.objectData.push(data);
    }
  }

  /** Handles an object being dropped on a zone. Snaps on correct match, otherwise no-ops. */
  private handleDrop(data: ObjectData, target: unknown): void {
    const slot = this.shadowSlots.find((s) => s.zone === target);
    if (!slot) return;

    data.droppedOnZone = true;

    if (isMatch(data.type, slot.type)) {
      snapToSlot(this, data.obj, slot.x, slot.y);
      this.stampShadow(slot);
      this.tweens.add({
        targets: data.obj,
        alpha: DIM_ALPHA,
        duration: motionDuration(DIM_DURATION, DIM_REDUCED_DURATION),
        ease: "Sine.out",
      });
      data.obj.disableInteractive();
      data.matched = true;
      this.matchedCount++;
      this.audioManager.playCorrect();
      this.recordCorrect();
      this.mascot?.cheer();
      createCompletionSplash(this, slot.x, slot.y);

      if (isWin(this.matchedCount)) {
        this.completeGame("shadow-match");
      }
    }
  }

  /** Stamps the shadow slot: a scale pulse plus a brief self-cleaning fill flash. */
  private stampShadow(slot: ShadowSlotData): void {
    const shadow = slot.obj;
    const baseScaleX = shadow.scaleX;
    const baseScaleY = shadow.scaleY;

    this.tweens.add({
      targets: shadow,
      scaleX: baseScaleX * motionScale(STAMP_SCALE, STAMP_REDUCED_SCALE),
      scaleY: baseScaleY * motionScale(STAMP_SCALE, STAMP_REDUCED_SCALE),
      duration: motionDuration(STAMP_DURATION, STAMP_REDUCED_DURATION),
      yoyo: true,
      ease: "Sine.inOut",
    });

    const flash = this.add.graphics();
    flash.setPosition(slot.x, slot.y);
    flash.fillStyle(FLASH_COLOR, FLASH_ALPHA);
    flash.fillCircle(0, 0, DROP_ZONE_SIZE / 2);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: motionDuration(FLASH_DURATION, FLASH_REDUCED_DURATION),
      ease: "Sine.out",
      onComplete: () => {
        flash.destroy();
      },
    });
  }

  /** Handles drag end. Bounces object back to origin; plays incorrect SFX only if dropped on a zone. */
  private handleDragEnd(data: ObjectData): void {
    if (!data.matched) {
      if (data.droppedOnZone) {
        this.audioManager.playIncorrect();
        this.recordWrong();
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
}
