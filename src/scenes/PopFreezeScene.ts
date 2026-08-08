import type Phaser from "phaser";
import {
  type BubbleConfig,
  createRoundState,
  generateInitialBubbles,
  generateSpawnConfig,
  type RoundState,
  registerPop,
  registerWake,
  selectBubbleType,
} from "../game/popFreezeLogic";
import { createCompletionSplash } from "../utils/completionEffect";
import { isReducedMotion, motionDuration, motionScale } from "../utils/motion";
import { sceneEntrance } from "../utils/sceneTransitions";
import { GameSceneBase } from "./GameSceneBase";

/** Display size for each bubble (exceeds 96px ideal touch target). */
const BUBBLE_DISPLAY_SIZE = 96;

/** Base scale factor: display size divided by SVG raster size (512px). */
const BUBBLE_BASE_SCALE = BUBBLE_DISPLAY_SIZE / 512;

/** Duration of the pop shrink animation (ms). */
const POP_DURATION = 200;

/** Duration of the pop shrink under reduced motion (ms). */
const POP_REDUCED_DURATION = 120;

/** Duration of the wake wobble animation (ms). */
const WOBBLE_DURATION = 300;

/** Duration of the wake wobble under reduced motion (ms). */
const WOBBLE_REDUCED_DURATION = 180;

/** Number of droplet circles emitted when a bubble pops. */
const DROPLET_COUNT = 3;

/** Color of the pop droplets. */
const DROPLET_COLOR = 0x4fd1c5;

/** Alpha of the pop droplets. */
const DROPLET_ALPHA = 0.9;

/** Radius of each pop droplet circle. */
const DROPLET_RADIUS = 12;

/** Distance from the pop point to each droplet center. */
const DROPLET_OFFSET = 44;

/** Duration of the droplet fade-out (ms). */
const DROPLET_DURATION = 300;

/** Reduced-motion droplet fade-out duration (ms). */
const DROPLET_REDUCED_DURATION = 180;

/** Scale the droplet burst grows to while fading. */
const DROPLET_GROW_SCALE = 1.2;

/** Reduced-motion droplet burst growth. */
const DROPLET_GROW_REDUCED_SCALE = 1.05;

/** Duration of one breathing phase (half of the ~1.5s loop). */
const BREATHE_DURATION = 750;

/** Breathing scale multiplier (1.0 → 1.03 per phase). */
const BREATHE_SCALE = 1.03;

/** Display size for the sleep glyph on sleeping bubbles. */
const ZZZ_DISPLAY_SIZE = 40;

/** Tracks a bubble's runtime state: physics body, spawn config, and sleeping-animal overlays. */
interface BubbleData {
  obj: Phaser.Physics.Arcade.Image;
  config: BubbleConfig;
  animalImage?: Phaser.GameObjects.Image;
  zzzImage?: Phaser.GameObjects.Image;
}

/**
 * Pop & Freeze scene — pop bubbles while avoiding waking sleeping animals.
 *
 * Bubbles float via Arcade Physics with world-bounds bouncing. Tapping a
 * poppable bubble pops it (SFX + bounded splash/ray feedback + respawn). Tapping a sleeping
 * bubble triggers a gentle wobble with no penalty. After 6 pops the round
 * is complete.
 */
export class PopFreezeScene extends GameSceneBase {
  private roundState: RoundState = createRoundState();
  private bubbles: BubbleData[] = [];
  private roundComplete = false;

  constructor() {
    super("PopFreeze");
  }

  create(): void {
    sceneEntrance(this);
    this.createCornerMascot();
    this.createBackButton();

    this.initRound();

    this.registerShutdownCleanup();
  }

  /** Initializes a new round: resets state, configures physics, spawns initial bubbles. */
  private initRound(): void {
    this.roundState = createRoundState();
    this.roundComplete = false;
    this.bubbles = [];

    this.physics.world.setBoundsCollision(true, true, true, true);

    const configs = generateInitialBubbles(
      this.scale.width,
      this.scale.height,
      BUBBLE_DISPLAY_SIZE,
    );

    for (const config of configs) {
      this.spawnBubble(config);
    }
  }

  /** Creates a physics bubble from a spawn config and registers its tap handler. */
  private spawnBubble(config: BubbleConfig): BubbleData {
    const bubble = this.physics.add.image(config.x, config.y, "bubble");
    bubble.setDisplaySize(BUBBLE_DISPLAY_SIZE, BUBBLE_DISPLAY_SIZE);
    // Size the Arcade body to the 96px display, not the 512px SVG frame —
    // otherwise bubbles bounce ~208px short of walls and overlap tap areas.
    bubble.setCircle(BUBBLE_DISPLAY_SIZE / 2);
    bubble.setVelocity(config.vx, config.vy);
    bubble.setCollideWorldBounds(true);
    bubble.setBounce(1, 1);
    bubble.setInteractive();

    let animalImage: Phaser.GameObjects.Image | undefined;
    let zzzImage: Phaser.GameObjects.Image | undefined;

    if (config.type === "sleeping" && config.animal) {
      animalImage = this.add
        .image(config.x, config.y, `animal_${config.animal}`)
        .setDisplaySize(BUBBLE_DISPLAY_SIZE * 0.6, BUBBLE_DISPLAY_SIZE * 0.6);

      zzzImage = this.add
        .image(config.x, config.y - BUBBLE_DISPLAY_SIZE * 0.5, "sleep_zzz")
        .setDisplaySize(ZZZ_DISPLAY_SIZE, ZZZ_DISPLAY_SIZE);

      this.breatheAnimal(animalImage);
    }

    const data: BubbleData = { obj: bubble, config, animalImage, zzzImage };

    bubble.on("pointerdown", () => {
      this.handleTap(data);
    });

    this.bubbles.push(data);
    return data;
  }

  /** Syncs sleeping-animal overlay positions with their parent bubble each frame. */
  update(): void {
    for (const data of this.bubbles) {
      if (data.animalImage && data.zzzImage) {
        data.animalImage.setPosition(data.obj.x, data.obj.y);
        data.zzzImage.setPosition(data.obj.x, data.obj.y - BUBBLE_DISPLAY_SIZE * 0.5);
      }
    }
  }

  /** Routes a tap to pop or wake handling based on bubble type. */
  private handleTap(data: BubbleData): void {
    if (this.roundComplete) return;

    if (data.config.type === "poppable") {
      this.handlePop(data);
    } else {
      this.handleWake(data);
    }
  }

  /** Pops a poppable bubble: SFX, bounded feedback, shrink animation, register pop, respawn or complete. */
  private handlePop(data: BubbleData): void {
    const index = this.bubbles.indexOf(data);
    if (index < 0) return;
    this.bubbles.splice(index, 1);

    this.audioManager.playPop();
    this.mascot?.cheer();
    createCompletionSplash(this, data.obj.x, data.obj.y);
    this.emitPopDroplets(data.obj.x, data.obj.y);

    this.tweens.add({
      targets: data.obj,
      scaleX: 0,
      scaleY: 0,
      duration: motionDuration(POP_DURATION, POP_REDUCED_DURATION),
      ease: "Back.in",
      onComplete: () => {
        data.obj.destroy();
      },
    });

    const { state: newState, isWin } = registerPop(this.roundState);
    this.roundState = newState;

    if (isWin) {
      this.roundComplete = true;
      this.completeGame("pop-freeze");
    } else {
      this.respawnBubble();
    }
  }

  /** Emits droplet circles radiating from the pop point (self-cleaning). */
  private emitPopDroplets(x: number, y: number): void {
    const droplets = this.add.graphics();
    for (let i = 0; i < DROPLET_COUNT; i++) {
      const angle = (Math.PI * 2 * i) / DROPLET_COUNT + Math.PI / 2;
      droplets.fillStyle(DROPLET_COLOR, DROPLET_ALPHA);
      droplets.fillCircle(
        x + Math.cos(angle) * DROPLET_OFFSET,
        y + Math.sin(angle) * DROPLET_OFFSET,
        DROPLET_RADIUS,
      );
    }

    this.tweens.add({
      targets: droplets,
      alpha: 0,
      scaleX: motionScale(DROPLET_GROW_SCALE, DROPLET_GROW_REDUCED_SCALE),
      scaleY: motionScale(DROPLET_GROW_SCALE, DROPLET_GROW_REDUCED_SCALE),
      duration: motionDuration(DROPLET_DURATION, DROPLET_REDUCED_DURATION),
      ease: "Sine.out",
      onComplete: () => {
        droplets.destroy();
      },
    });
  }

  /** Starts a gentle breathing scale loop on a sleeping animal (skipped under reduced motion). */
  private breatheAnimal(animalImage: Phaser.GameObjects.Image): void {
    if (isReducedMotion()) return;
    const base = animalImage.scaleX;
    const tween = this.tweens.add({
      targets: animalImage,
      scaleX: base * BREATHE_SCALE,
      scaleY: base * BREATHE_SCALE,
      duration: BREATHE_DURATION,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });
    this.events.once("shutdown", () => tween?.remove());
  }

  /** Wakes a sleeping bubble: SFX, gentle wobble, no penalty. */
  private handleWake(data: BubbleData): void {
    this.audioManager.playWake();
    this.mascot?.nod();
    this.roundState = registerWake(this.roundState);

    this.tweens.add({
      targets: data.obj,
      scaleX: motionScale(BUBBLE_BASE_SCALE * 1.15, BUBBLE_BASE_SCALE * 1.05),
      scaleY: motionScale(BUBBLE_BASE_SCALE * 1.15, BUBBLE_BASE_SCALE * 1.05),
      duration: motionDuration(WOBBLE_DURATION, WOBBLE_REDUCED_DURATION),
      yoyo: true,
      ease: "Quad.easeInOut",
    });
  }

  /** Spawns a replacement bubble to maintain concurrent count (1-2 sleeping maintained). */
  private respawnBubble(): void {
    const sleepingCount = this.bubbles.filter((b) => b.config.type === "sleeping").length;
    const type = selectBubbleType(sleepingCount);
    const config = generateSpawnConfig(
      this.scale.width,
      this.scale.height,
      BUBBLE_DISPLAY_SIZE,
      type,
    );
    this.spawnBubble(config);
  }
}
