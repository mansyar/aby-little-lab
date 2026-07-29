import Phaser from "phaser";
import { AudioManager } from "../audio/AudioManager";
import { ParentLock } from "../components/ParentLock";
import { generateRound, isMatch, isWin, type ObjectType } from "../game/shadowMatchLogic";

/** Y position for shadow silhouettes (top area). */
const SHADOW_Y = 200;

/** Y position for draggable objects (bottom area). */
const OBJECT_Y = 600;

/** Display size for objects and shadows (ideal 96x96px touch target per spec). */
const DISPLAY_SIZE = 96;

/** Drop zone size (inflated for generous snap radius per touch-ergonomics). */
const DROP_ZONE_SIZE = 120;

/** Tween duration for bounce-back animation (ms). */
const BOUNCE_DURATION = 300;

/** Texture key used for particle bursts. */
const PARTICLE_TEXTURE = "shape_circle";

/** Particle count for celebration bursts (reduced when prefers-reduced-motion). */
const PARTICLE_COUNT = 12;
const PARTICLE_COUNT_REDUCED = 6;

/** Tracks a draggable object's state during the round. */
interface ObjectData {
  obj: Phaser.GameObjects.Image;
  type: ObjectType;
  originX: number;
  originY: number;
  matched: boolean;
}

/** Tracks a shadow slot's drop zone and position. */
interface ShadowSlotData {
  zone: Phaser.GameObjects.Zone;
  type: ObjectType;
  x: number;
  y: number;
}

/**
 * Shadow Match scene — drag colored objects to matching dark silhouettes.
 *
 * Round initialization generates 6 object-silhouette pairs with independently
 * shuffled positions. Objects are dragged via Phaser Pointer Drag to matching
 * shadow silhouettes. Correct drops snap to center with SFX + particles;
 * incorrect drops bounce back gently with a soft tone.
 */
export class ShadowMatchScene extends Phaser.Scene {
  private parentLock?: ParentLock;
  private round: { objects: ObjectType[]; shadows: ObjectType[] } = {
    objects: [],
    shadows: [],
  };
  private objectData: ObjectData[] = [];
  private shadowSlots: ShadowSlotData[] = [];
  private matchedCount = 0;
  private readonly audioManager: AudioManager;

  constructor() {
    super({ key: "ShadowMatch" });
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

  /** Initializes a new round: generates pairs, shuffles positions, renders shadows and objects. */
  private initRound(): void {
    this.round = generateRound();
    this.shadowSlots = [];
    this.objectData = [];
    this.matchedCount = 0;
    this.createShadowSlots();
    this.createObjects();
  }

  /** Creates shadow silhouette images and drop zones at the top of the screen. */
  private createShadowSlots(): void {
    const spacing = this.scale.width / (this.round.shadows.length + 1);
    for (let i = 0; i < this.round.shadows.length; i++) {
      const x = spacing * (i + 1);
      const shadowType = this.round.shadows[i];
      this.add
        .image(x, SHADOW_Y, `sm_shadow_${shadowType}`)
        .setDisplaySize(DISPLAY_SIZE, DISPLAY_SIZE);

      const zone = this.add.zone(x, SHADOW_Y, DROP_ZONE_SIZE, DROP_ZONE_SIZE);
      zone.setInteractive({ dropZone: true });

      this.shadowSlots.push({ zone, type: shadowType, x, y: SHADOW_Y });
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

      this.objectData.push(data);
    }
  }

  /** Handles an object being dropped on a zone. Snaps on correct match, otherwise no-ops. */
  private handleDrop(data: ObjectData, target: unknown): void {
    const slot = this.shadowSlots.find((s) => s.zone === target);
    if (!slot) return;

    if (isMatch(data.type, slot.type)) {
      data.obj.setPosition(slot.x, slot.y);
      data.obj.disableInteractive();
      data.matched = true;
      this.matchedCount++;
      this.audioManager.playCorrect();
      this.createParticleBurst(slot.x, slot.y);

      if (isWin(this.matchedCount)) {
        this.handleComplete();
      }
    }
  }

  /** Handles drag end. Bounces object back to origin with wobble if not matched. */
  private handleDragEnd(data: ObjectData): void {
    if (!data.matched) {
      this.audioManager.playIncorrect();
      this.tweens.add({
        targets: data.obj,
        x: data.originX,
        y: data.originY,
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

  /** Handles round completion. (Phase 4: win animation, sticker award, auto-return) */
  private handleComplete(): void {
    // Phase 4 will implement: playWin + win animation + sticker + auto-return
  }
}
