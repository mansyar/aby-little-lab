import type Phaser from "phaser";
import type { BandShift } from "../game/adaptiveLogic";
import { items } from "../game/art/items";
import { shadows } from "../game/art/shadows";
import { type BoardPiece, DragBoard } from "../game/dragBoard";
import type { Rng } from "../game/random";
import { generateRound, isMatch, isWin, type ObjectType } from "../game/shadowMatchLogic";
import { createCompletionSplash } from "../utils/completionEffect";
import { attachDragLift, attachDropZoneHighlight } from "../utils/dragJuice";
import { motionDuration, motionScale } from "../utils/motion";
import { sceneEntrance } from "../utils/sceneTransitions";
import { getAdaptiveBandShift } from "../utils/storage";
import { GameSceneBase } from "./GameSceneBase";

/** Y position for shadow silhouettes (top area). */
const SHADOW_Y = 200;

/** Y position for draggable objects (bottom area). */
const OBJECT_Y = 600;

/** Display size for objects and shadows (ideal 96x96px touch target per spec). */
const DISPLAY_SIZE = 112;

/** Drop zone size (inflated for generous snap radius per touch-ergonomics). */
const DROP_ZONE_SIZE = 160;

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

/** Tracks a draggable object registered with the shared drag board. */
interface ObjectData extends BoardPiece {
  container: Phaser.GameObjects.Image;
  type: ObjectType;
  matched: boolean;
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
 * Round initialization generates 6 of 12 object-silhouette pairs, drawn by the
 * profile's adaptive band shift: the easy band takes one object per confusable
 * cluster, the hard band three full clusters, and the classic band any 6 of
 * the pool. The shared {@link DragBoard} shell owns the gesture wiring, the
 * snap, and the bounce home; this scene keeps its visuals and the per-drop
 * validation, so a correct drop snaps to center with the shadow-stamp pulse
 * and bounded splash/ray feedback, and an incorrect drop bounces back gently
 * with a soft tone.
 */
export class ShadowMatchScene extends GameSceneBase {
  private board: DragBoard<ObjectData> | null = null;
  private round: { objects: ObjectType[]; shadows: ObjectType[] } = {
    objects: [],
    shadows: [],
  };
  private objectData: ObjectData[] = [];
  private shadowSlots: ShadowSlotData[] = [];
  private matchedCount = 0;

  constructor(rng: Rng = Math.random) {
    super("ShadowMatch", rng);
  }

  preload(): void {
    this.preloadArt([items, shadows]);
  }

  create(): void {
    sceneEntrance(this);
    this.createCornerMascot();
    this.createBackButton();
    this.createSpokenInstruction("Drag each picture onto its shadow.");

    // completeGame locks input for the auto-return; a relaunched session
    // (Phaser reuses the scene instance) must start unlocked, and the shell
    // consults this lock on every gesture.
    this.inputLocked = false;

    this.board?.destroy();
    this.board = new DragBoard<ObjectData>({
      scene: this,
      zoneSize: DROP_ZONE_SIZE,
      // Per-drop validation lives in the onDrop callback below, so the
      // shell's validation-reporting hook stays unused; a wrong drop bounces
      // just that object home through the shell's withdraw (300/180 ms).
      wrongAnswerBehavior: "bounce-home",
      validationTiming: "per-drop",
      // A tap never lifts a placed object in this game.
      tapWithdraw: false,
      isLocked: () => this.inputLocked,
      callbacks: {
        onDrop: (data, slotIndex) => this.handleBoardDrop(data, slotIndex),
      },
    });

    this.initRound(getAdaptiveBandShift("shadow-match"));

    this.registerShutdownCleanup();
  }

  /** Initializes a new round: generates pairs, shuffles positions, renders shadows and objects. */
  private initRound(shift: BandShift = 0): void {
    this.round = generateRound(shift, this.rng);
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

  /** Creates shadow silhouette images and board-registered drop zones at the top of the screen. */
  private createShadowSlots(): void {
    const board = this.board;
    if (!board) return;

    const spacing = this.scale.width / (this.round.shadows.length + 1);
    for (let i = 0; i < this.round.shadows.length; i++) {
      const x = spacing * (i + 1);
      const shadowType = this.round.shadows[i];
      const shadowObj = this.add.image(x, SHADOW_Y, `sm_shadow_${shadowType}`);
      shadowObj.setDisplaySize(DISPLAY_SIZE, DISPLAY_SIZE);

      const registered = board.addSlot(x, SHADOW_Y);
      this.shadowSlots.push({
        zone: registered.zone,
        type: shadowType,
        x,
        y: SHADOW_Y,
        obj: shadowObj,
      });
    }
  }

  /** Creates interactive draggable object images at the bottom of the screen. */
  private createObjects(): void {
    const board = this.board;
    if (!board) return;

    const spacing = this.scale.width / (this.round.objects.length + 1);
    for (let i = 0; i < this.round.objects.length; i++) {
      const x = spacing * (i + 1);
      const objectType = this.round.objects[i];
      const obj = this.add
        .image(x, OBJECT_Y, `sm_${objectType}`)
        .setDisplaySize(DISPLAY_SIZE, DISPLAY_SIZE)
        .setInteractive();

      const data: ObjectData = {
        id: objectType,
        container: obj,
        type: objectType,
        originX: x,
        originY: OBJECT_Y,
        slotIndex: null,
        justDropped: false,
        matched: false,
      };

      // The lift juice stays scene-called; the shell owns the gesture wiring.
      attachDragLift(obj);
      board.addPiece(data);

      this.objectData.push(data);
    }
  }

  /** Validates one board drop: a match stamps the shadow, a miss bounces the object home. */
  private handleBoardDrop(data: ObjectData, slotIndex: number): void {
    const board = this.board;
    const slot = this.shadowSlots[slotIndex];
    if (!board || !slot) return;

    if (!isMatch(data.type, slot.type)) {
      // The soft tone first, then the shell bounces just this object home.
      this.reactWrong();
      board.withdraw(data);
      return;
    }

    // A matched object is locked, so a later drop must never displace it:
    // release its board occupancy while it visually stays in the slot.
    board.getSlots()[slotIndex].occupiedBy = null;
    data.slotIndex = null;
    this.stampShadow(slot);
    this.tweens.add({
      targets: data.container,
      alpha: DIM_ALPHA,
      duration: motionDuration(DIM_DURATION, DIM_REDUCED_DURATION),
      ease: "Sine.out",
    });
    data.container.disableInteractive();
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
}
