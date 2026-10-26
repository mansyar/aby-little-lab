import type Phaser from "phaser";
import { toys } from "../game/art/toys";
import {
  type BoxInstance,
  generateRound,
  isMatch,
  isWin,
  type ScaleCategory,
  type ScaleFactors,
  scaleFactorsFor,
  type ToyInstance,
} from "../game/bigSmallLogic";
import { type BoardPiece, DragBoard } from "../game/dragBoard";
import type { Rng } from "../game/random";
import { createCompletionSplash } from "../utils/completionEffect";
import { attachDragLift, attachDropZoneHighlight } from "../utils/dragJuice";
import { motionDuration, motionScale } from "../utils/motion";
import { sceneEntrance } from "../utils/sceneTransitions";
import { getAdaptiveBandShift } from "../utils/storage";
import { GameSceneBase } from "./GameSceneBase";

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

/** Tracks a draggable toy registered with the shared drag board. */
interface ToyData extends BoardPiece {
  container: Phaser.GameObjects.Image;
  scaleCategory: ScaleCategory;
  sorted: boolean;
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
 * The shared {@link DragBoard} shell owns the gesture wiring, the snap, and
 * the bounce home, with each box registered as a multi slot so sorted toys
 * accumulate; this scene keeps the sorted-vs-fit validation, so a correct
 * drop snaps to box center and shrinks into it with the lid wiggle and scale
 * bump, and an incorrect drop bounces back gently with a soft tone.
 */
export class BigSmallScene extends GameSceneBase {
  private board: DragBoard<ToyData> | null = null;
  private round: { toys: ToyInstance[]; boxes: BoxInstance[] } = {
    toys: [],
    boxes: [],
  };
  /** Scale factors for the session, sampled from the band once. */
  private factors: ScaleFactors = scaleFactorsFor(0);
  private toyData: ToyData[] = [];
  private boxSlots: BoxSlotData[] = [];
  private sortedCount = 0;

  constructor(rng: Rng = Math.random) {
    super("BigSmall", rng);
  }

  preload(): void {
    this.preloadArt([toys]);
  }

  create(): void {
    sceneEntrance(this);
    this.createCornerMascot();
    this.createBackButton();
    this.createSpokenInstruction("Put the big toys in the big box.");

    // completeGame locks input for the auto-return; a relaunched session
    // (Phaser reuses the scene instance) must start unlocked, and the shell
    // consults this lock on every gesture.
    this.inputLocked = false;

    this.board?.destroy();
    this.board = new DragBoard<ToyData>({
      scene: this,
      zoneSize: DROP_ZONE_SIZE,
      // Per-drop validation lives in the onDrop callback below, so the
      // shell's validation-reporting hook stays unused; a wrong drop bounces
      // just that toy home through the shell's withdraw (300/180 ms).
      wrongAnswerBehavior: "bounce-home",
      validationTiming: "per-drop",
      // A tap never lifts a sorted toy out of its box in this game.
      tapWithdraw: false,
      isLocked: () => this.inputLocked,
      callbacks: {
        onDrop: (data, slotIndex) => this.handleBoardDrop(data, slotIndex),
      },
    });

    this.factors = scaleFactorsFor(getAdaptiveBandShift("big-small"));
    this.initRound();

    this.registerShutdownCleanup();
  }

  /** Initializes a new round: generates toys and boxes, renders them on screen. */
  private initRound(): void {
    this.round = generateRound(this.factors, this.rng);
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

  /** Creates box images and board-registered multi-slot drop zones at the top of the screen. */
  private createBoxSlots(): void {
    const board = this.board;
    if (!board) return;

    const spacing = this.scale.width / (this.round.boxes.length + 1);
    for (let i = 0; i < this.round.boxes.length; i++) {
      const x = spacing * (i + 1);
      const box = this.round.boxes[i];
      const displaySize = BOX_BASE_SIZE * box.scale;
      const boxObj = this.add.image(x, BOX_Y, "toy_box");
      boxObj.setDisplaySize(displaySize, displaySize);

      const registered = board.addSlot(x, BOX_Y, "multi");
      this.boxSlots.push({
        zone: registered.zone,
        scaleCategory: box.scaleCategory,
        x,
        y: BOX_Y,
        obj: boxObj,
      });
    }
  }

  /** Creates interactive draggable toy images at the bottom of the screen. */
  private createToys(): void {
    const board = this.board;
    if (!board) return;

    const spacing = this.scale.width / (this.round.toys.length + 1);
    for (let i = 0; i < this.round.toys.length; i++) {
      const x = spacing * (i + 1);
      const toy = this.round.toys[i];
      const displaySize = TOY_BASE_SIZE * toy.scale;
      const obj = this.add
        .image(x, TOY_Y, `toy_${toy.type}`)
        .setDisplaySize(displaySize, displaySize)
        .setInteractive();

      const data: ToyData = {
        id: `${toy.scaleCategory}_${toy.type}`,
        container: obj,
        scaleCategory: toy.scaleCategory,
        originX: x,
        originY: TOY_Y,
        slotIndex: null,
        justDropped: false,
        sorted: false,
      };

      // The lift juice stays scene-called; the shell owns the gesture wiring.
      attachDragLift(obj, { skipRestore: () => data.sorted });
      board.addPiece(data);

      this.toyData.push(data);
    }
  }

  /** Validates one board drop: a matching toy shrinks into the box, a miss bounces home. */
  private handleBoardDrop(data: ToyData, slotIndex: number): void {
    const board = this.board;
    const slot = this.boxSlots[slotIndex];
    if (!board || !slot) return;

    if (!isMatch(data.scaleCategory, slot.scaleCategory)) {
      // The soft tone first, then the shell bounces just this toy home.
      this.reactWrong();
      board.withdraw(data);
      return;
    }

    // Sorted toys stay board occupants in the multi slot — multi slots
    // accumulate, so a later drop can never displace them.
    this.tweens.add({
      targets: data.container,
      scaleX: 0,
      scaleY: 0,
      duration: motionDuration(SHRINK_DURATION, SHRINK_REDUCED_DURATION),
      ease: "Sine.in",
    });
    this.reactBox(slot);
    data.container.disableInteractive();
    data.sorted = true;
    this.sortedCount++;
    this.audioManager.playCorrect();
    this.recordCorrect();
    this.mascot?.cheer();
    createCompletionSplash(this, slot.x, slot.y);

    if (isWin(this.sortedCount)) {
      this.completeGame("big-small");
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
}
