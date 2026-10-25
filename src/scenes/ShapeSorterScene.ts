import type Phaser from "phaser";
import { cutouts } from "../game/art/cutouts";
import { shapes } from "../game/art/shapes";
import { type BoardPiece, DragBoard } from "../game/dragBoard";
import { generatePlaythrough, isMatch, type ShapeType, shuffle } from "../game/shapeSorterLogic";
import { createCompletionSplash } from "../utils/completionEffect";
import { attachDragLift, attachDropZoneHighlight } from "../utils/dragJuice";
import { sceneEntrance } from "../utils/sceneTransitions";
import { getAdaptiveBandShift } from "../utils/storage";
import { GameSceneBase } from "./GameSceneBase";

/** Y position for cutout slots (top area). */
const SLOT_Y = 200;

/** Y position for draggable shapes (bottom area). */
const SHAPE_Y = 600;

/** Display size for shapes and slots (exceeds 96px ideal touch target). */
const SHAPE_DISPLAY_SIZE = 128;

/** Drop zone size (inflated for generous snap radius per touch-ergonomics). */
const DROP_ZONE_SIZE = 160;

/** Number of rounds per play session. */
const ROUND_COUNT = 3;

/** Tracks a draggable shape registered with the shared drag board. */
interface ShapeData extends BoardPiece {
  container: Phaser.GameObjects.Image;
  type: ShapeType;
  placed: boolean;
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
 * round; progress dots fill above the slots. The shared {@link DragBoard}
 * shell owns the gesture wiring, the snap, and the bounce home; this scene
 * keeps only its visuals and the per-drop validation, so a correct drop snaps
 * to center with SFX + bounded splash/ray feedback and an incorrect drop
 * bounces back gently with a soft tone. Win celebration + sticker award
 * happen after the final round.
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

  private board: DragBoard<ShapeData> | null = null;
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

  preload(): void {
    this.preloadArt([cutouts, shapes]);
  }

  create(): void {
    sceneEntrance(this);
    this.createCornerMascot();
    this.createBackButton();
    // Progress dots sit at y=100 here, so the instruction line drops below them
    // and above the shape slots (y=200).
    this.createSpokenInstruction("Drag each shape into its hole.", { y: 126 });

    // completeGame locks input for the auto-return; a relaunched session
    // (Phaser reuses the scene instance) must start unlocked, and the shell
    // consults this lock on every gesture.
    this.inputLocked = false;

    this.board?.destroy();
    this.board = new DragBoard<ShapeData>({
      scene: this,
      zoneSize: DROP_ZONE_SIZE,
      // Per-drop validation lives in the onDrop callback below, so the
      // shell's validation-reporting hook stays unused; a wrong drop bounces
      // just that shape home through the shell's withdraw (300/180 ms).
      wrongAnswerBehavior: "bounce-home",
      validationTiming: "per-drop",
      // A tap never lifts a placed shape in this game.
      tapWithdraw: false,
      isLocked: () => this.inputLocked,
      callbacks: {
        onDrop: (shape, slotIndex) => this.handleBoardDrop(shape, slotIndex),
      },
    });

    this.playthrough = generatePlaythrough(ROUND_COUNT, getAdaptiveBandShift("shape-sorter"));
    this.roundIndex = 0;
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

  /** Creates cutout slot images and board-registered drop zones at the top of the screen. */
  private createSlots(): void {
    const board = this.board;
    if (!board) return;

    const spacing = this.scale.width / (this.selectedShapes.length + 1);
    for (let i = 0; i < this.slotOrder.length; i++) {
      const x = spacing * (i + 1);
      const slotType = this.slotOrder[i];
      const img = this.add
        .image(x, SLOT_Y, `cutout_${slotType}`)
        .setDisplaySize(SHAPE_DISPLAY_SIZE, SHAPE_DISPLAY_SIZE);

      const registered = board.addSlot(x, SLOT_Y);
      this.slots.push({ zone: registered.zone, img, type: slotType, x, y: SLOT_Y });
    }
  }

  /** Creates interactive draggable shape images at the bottom of the screen. */
  private createShapes(): void {
    const board = this.board;
    if (!board) return;

    const spacing = this.scale.width / (this.selectedShapes.length + 1);
    for (let i = 0; i < this.shapeOrder.length; i++) {
      const x = spacing * (i + 1);
      const shapeType = this.shapeOrder[i];
      const obj = this.add
        .image(x, SHAPE_Y, `shape_${shapeType}`)
        .setDisplaySize(SHAPE_DISPLAY_SIZE, SHAPE_DISPLAY_SIZE)
        .setInteractive();

      const shapeData: ShapeData = {
        id: shapeType,
        container: obj,
        type: shapeType,
        originX: x,
        originY: SHAPE_Y,
        slotIndex: null,
        justDropped: false,
        placed: false,
      };

      // The lift juice stays scene-called; the shell owns the gesture wiring.
      attachDragLift(obj);
      board.addPiece(shapeData);

      this.shapes.push(shapeData);
    }
  }

  /** Validates one board drop: a match locks the shape in its slot, a miss bounces it home. */
  private handleBoardDrop(shape: ShapeData, slotIndex: number): void {
    const board = this.board;
    const slot = this.slots[slotIndex];
    if (!board || !slot) return;

    if (!isMatch(shape.type, slot.type)) {
      // The soft tone first, then the shell bounces just this shape home.
      this.reactWrong();
      board.withdraw(shape);
      return;
    }

    // A placed shape is locked, so a later drop must never displace it:
    // release its board occupancy while it visually stays in the slot.
    board.getSlots()[slotIndex].occupiedBy = null;
    shape.slotIndex = null;
    shape.container.disableInteractive();
    shape.placed = true;
    this.audioManager.playCorrect();
    this.recordCorrect();
    this.mascot?.cheer();
    createCompletionSplash(this, slot.x, slot.y);

    if (this.shapes.every((s) => s.placed)) {
      this.handleRoundComplete();
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

  /** Removes the current round's shapes and slot images; the shell drops its zones. */
  private teardownRound(): void {
    for (const shape of this.shapes) {
      shape.container.destroy();
    }
    for (const slot of this.slots) {
      slot.img.destroy();
    }
    this.board?.clear();
    this.shapes = [];
    this.slots = [];
  }
}
