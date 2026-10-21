import type Phaser from "phaser";
import { type DragTarget, snapToSlot } from "../utils/dragJuice";
import { motionDuration } from "../utils/motion";

/** What happens to placed pieces after a wrong answer. */
export type WrongAnswerBehavior = "bounce-home" | "retry-in-place";

/**
 * When the validation hook fires. `"per-drop"` reports after every drag end
 * (the scene decides what a single placement means); `"round-full"` reports
 * only once every slot is filled, guarded so an unchanged arrangement is not
 * re-validated.
 */
export type ValidationTiming = "per-drop" | "round-full";

/**
 * Pointer travel (px) before a gesture counts as a drag. Phaser starts a drag
 * on the first pointermove (threshold 0), and a drag that ends over the
 * piece's own slot is indistinguishable from a drop — ten pixels of slack
 * keeps a preschooler's slightly wobbly tap a tap.
 */
export const DEFAULT_DRAG_DISTANCE_THRESHOLD = 10;

/** Bounce-to-source tween duration (ms) — shared by both current boards. */
const BOUNCE_DURATION = 300;

/** Bounce-to-source tween duration under reduced motion (ms). */
const BOUNCE_REDUCED_DURATION = 180;

/** Slot↔slot swap tween duration (ms). */
const SWAP_DURATION = 200;

/** Slot↔slot swap tween duration under reduced motion (ms). */
const SWAP_REDUCED_DURATION = 120;

/**
 * Minimal piece record the shell manages. Scenes keep richer records (art,
 * fills, payloads) that structurally satisfy this shape, so a scene's own
 * card/panel interface can be handed to the shell directly.
 */
export interface BoardPiece {
  /**
   * Stable identity — the round-full signature guard joins these with "|"
   * (Story Order's `key|key|key` guard).
   */
  readonly id: string;
  /** Draggable container the shell wires gesture listeners onto. */
  container: Phaser.GameObjects.Container;
  /** Source (tray/row) position the piece returns to when unplaced. */
  originX: number;
  originY: number;
  /** Index of the slot the piece occupies, or null while in the source row. */
  slotIndex: number | null;
  /** True once the current gesture has become a drag or a drop. */
  justDropped: boolean;
}

/** One drop slot: its hit zone, position, and current occupant. */
export interface BoardSlot<TPiece extends BoardPiece = BoardPiece> {
  readonly zone: Phaser.GameObjects.Zone;
  readonly x: number;
  readonly y: number;
  occupiedBy: TPiece | null;
}

/** Scene-owned reactions the shell reports into; it never validates itself. */
export interface DragBoardCallbacks<TPiece extends BoardPiece> {
  /** A tap began on an unlocked piece (e.g. speak the piece). */
  onTap?: (piece: TPiece) => void;
  /** A drop changed slot occupancy; the piece now occupies `slotIndex`. */
  onDrop?: (piece: TPiece, slotIndex: number) => void;
  /** Tap-withdraw returned a placed piece to its source position. */
  onWithdraw?: (piece: TPiece) => void;
  /**
   * Validation hook, fired per the configured timing. Entries are slot-indexed
   * piece ids, null for an empty slot.
   */
  onValidate?: (placedIds: readonly (string | null)[]) => void;
}

/** Construction options for {@link DragBoard}. */
export interface DragBoardOptions<TPiece extends BoardPiece> {
  /** Owning scene — provides add/input/tweens/children/events. */
  readonly scene: Phaser.Scene;
  /** Square drop-zone hit size in px (both current boards use squares). */
  readonly zoneSize: number;
  /** What happens to placed pieces after a wrong answer. */
  readonly wrongAnswerBehavior: WrongAnswerBehavior;
  /** When the validation hook fires. */
  readonly validationTiming: ValidationTiming;
  /** Whether tapping a placed piece withdraws it to its source position. */
  readonly tapWithdraw: boolean;
  /** Pointer travel (px) before a gesture counts as a drag. Default 10. */
  readonly dragDistanceThreshold?: number;
  /** Reads the scene's input lock, so the shell shares the scene's one lock. */
  readonly isLocked: () => boolean;
  /** Scene-owned reactions the shell reports into. */
  readonly callbacks?: DragBoardCallbacks<TPiece>;
}

/**
 * Parameterized drag-board shell extracted from Number Order and Story Order.
 *
 * Owns the scaffolding both scenes hand-rolled inline: slot/drop-zone
 * registration and hover detection, snap wiring over {@link snapToSlot},
 * slot↔slot swap, tray↔slot displacement, tap-vs-drag discrimination with
 * tap-withdraw, and the two wrong-answer movement policies. Validation itself
 * belongs to the scene — the shell only reports drop/withdraw events and fires
 * the validation hook at the configured timing.
 *
 * The shell never touches visuals (outlines, fills, art): scenes draw their
 * own slot decoration and keep their piece records, which satisfy
 * {@link BoardPiece} structurally.
 */
export class DragBoard<TPiece extends BoardPiece> {
  private readonly scene: Phaser.Scene;
  private readonly zoneSize: number;
  private readonly wrongAnswerBehavior: WrongAnswerBehavior;
  private readonly validationTiming: ValidationTiming;
  private readonly tapWithdraw: boolean;
  private readonly isLocked: () => boolean;
  private readonly callbacks: DragBoardCallbacks<TPiece>;
  private slots: BoardSlot<TPiece>[] = [];
  private pieces: TPiece[] = [];
  private lastValidatedSignature: string | null = null;
  private destroyed = false;
  private readonly handleShutdown = (): void => {
    this.destroy();
  };

  constructor(options: DragBoardOptions<TPiece>) {
    this.scene = options.scene;
    this.zoneSize = options.zoneSize;
    this.wrongAnswerBehavior = options.wrongAnswerBehavior;
    this.validationTiming = options.validationTiming;
    this.tapWithdraw = options.tapWithdraw;
    this.isLocked = options.isLocked;
    this.callbacks = options.callbacks ?? {};
    this.scene.input.dragDistanceThreshold =
      options.dragDistanceThreshold ?? DEFAULT_DRAG_DISTANCE_THRESHOLD;
    // Same shutdown mechanism the GameSceneBase registry uses, so the shell
    // releases its state without the scene having to remember it.
    this.scene.events.on("shutdown", this.handleShutdown);
  }

  /** Creates the interactive drop zone for a slot and registers it. */
  addSlot(x: number, y: number): BoardSlot<TPiece> {
    const zone = this.scene.add.zone(x, y, this.zoneSize, this.zoneSize);
    zone.setInteractive({ dropZone: true });
    const slot: BoardSlot<TPiece> = { zone, x, y, occupiedBy: null };
    this.slots.push(slot);
    return slot;
  }

  /** Wires the gesture listeners of a scene-built piece onto the board. */
  addPiece(piece: TPiece): void {
    this.pieces.push(piece);
    const container = piece.container;
    this.scene.input.setDraggable(container);

    container.on("pointerdown", () => {
      // A new gesture begins as a potential tap; only movement or a drop
      // marks it as a drag.
      piece.justDropped = false;
      if (this.isLocked()) return;
      this.callbacks.onTap?.(piece);
    });

    container.on("pointerup", () => {
      const justDropped = piece.justDropped;
      piece.justDropped = false;
      if (this.isLocked()) return;
      // Tap-to-withdraw: the trailing pointerup of a drag or drop is not a tap.
      if (!justDropped && piece.slotIndex !== null && this.tapWithdraw) {
        this.withdraw(piece);
        this.callbacks.onWithdraw?.(piece);
      }
    });

    container.on("dragstart", () => {
      if (this.isLocked()) return;
      this.scene.children.bringToTop(container);
    });

    container.on("drag", (_pointer: unknown, dragX: number, dragY: number) => {
      if (this.isLocked()) return;
      // Movement makes this gesture a drag, so its pointerup is not a tap.
      piece.justDropped = true;
      container.setPosition(dragX, dragY);
    });

    container.on("drop", (_pointer: unknown, target: unknown) => {
      this.handleDrop(piece, target);
    });

    container.on("dragend", () => {
      // The pointerup that follows belongs to the drag, not a tap.
      piece.justDropped = true;
      if (this.isLocked()) return;
      // Validation/wiggle owns the board while locked — positions stay put.
      this.correctMissedDrop(piece);
      this.tryAutoValidate();
    });
  }

  /** Whether any registered slot's hit square contains the point. */
  isOverAnyZone(x: number, y: number): boolean {
    const half = this.zoneSize / 2;
    return this.slots.some(
      (slot) =>
        x >= slot.x - half && x <= slot.x + half && y >= slot.y - half && y <= slot.y + half,
    );
  }

  /** Returns true when every registered slot is occupied. */
  isFull(): boolean {
    return this.slots.every((slot) => slot.occupiedBy !== null);
  }

  /** The placed pieces in slot order. */
  placedPieces(): TPiece[] {
    return this.slots.flatMap((slot) => (slot.occupiedBy ? [slot.occupiedBy] : []));
  }

  /** The placed piece ids in slot order, null for an empty slot. */
  placedIds(): (string | null)[] {
    return this.slots.map((slot) => slot.occupiedBy?.id ?? null);
  }

  /** All registered slots in registration order. */
  getSlots(): readonly BoardSlot<TPiece>[] {
    return this.slots;
  }

  /** Returns a placed piece to its source position, freeing its slot. */
  withdraw(piece: TPiece): void {
    if (piece.slotIndex === null) return;
    const slot = this.slots[piece.slotIndex];
    if (slot) slot.occupiedBy = null;
    piece.slotIndex = null;
    this.refreshValidationGuard();
    this.tweenHome(piece);
  }

  /**
   * Applies the configured wrong-answer movement policy. Call once the wrong
   * answer's wiggle has finished: `bounce-home` sends every placed piece back
   * to its source position and frees the board; `retry-in-place` keeps the
   * board exactly where the child put it.
   */
  applyWrongAnswer(): void {
    if (this.wrongAnswerBehavior === "retry-in-place") return;
    for (const slot of this.slots) {
      const piece = slot.occupiedBy;
      if (!piece) continue;
      slot.occupiedBy = null;
      piece.slotIndex = null;
      this.tweenHome(piece);
    }
    this.lastValidatedSignature = null;
  }

  /** Releases the round: destroys the shell-owned zones and drops all state. */
  clear(): void {
    for (const slot of this.slots) {
      try {
        slot.zone.destroy();
      } catch {
        // Already destroyed — keep going.
      }
      if (slot.occupiedBy) slot.occupiedBy.slotIndex = null;
    }
    this.slots = [];
    this.pieces = [];
    this.lastValidatedSignature = null;
  }

  /** Releases all state and detaches the shutdown listener. */
  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.scene.events.off("shutdown", this.handleShutdown);
    this.slots = [];
    this.pieces = [];
    this.lastValidatedSignature = null;
  }

  private tweenTo(
    target: Phaser.GameObjects.Container,
    x: number,
    y: number,
    normal: number,
    reduced: number,
  ): void {
    this.scene.tweens.add({
      targets: target,
      x,
      y,
      duration: motionDuration(normal, reduced),
      ease: "Back.out",
    });
  }

  private tweenHome(piece: TPiece): void {
    this.tweenTo(
      piece.container,
      piece.originX,
      piece.originY,
      BOUNCE_DURATION,
      BOUNCE_REDUCED_DURATION,
    );
  }

  private snap(piece: TPiece, slot: BoardSlot<TPiece>): void {
    snapToSlot(this.scene, piece.container as unknown as DragTarget, slot.x, slot.y);
  }

  private handleDrop(piece: TPiece, zone: unknown): void {
    if (this.isLocked()) return;
    // A drop is never a tap, whatever the trailing pointerup looks like.
    piece.justDropped = true;
    const destIndex = this.slots.findIndex((slot) => slot.zone === zone);
    if (destIndex === -1) return;
    const destSlot = this.slots[destIndex];
    const sourceIndex = piece.slotIndex;

    if (destSlot.occupiedBy === piece) {
      // Dropped back onto its own slot — just snap.
      this.snap(piece, destSlot);
      return;
    }

    if (destSlot.occupiedBy === null) {
      if (sourceIndex !== null) {
        this.slots[sourceIndex].occupiedBy = null;
      }
      destSlot.occupiedBy = piece;
      piece.slotIndex = destIndex;
      this.snap(piece, destSlot);
      this.callbacks.onDrop?.(piece, destIndex);
      this.refreshValidationGuard();
      return;
    }

    const occupant = destSlot.occupiedBy;
    if (sourceIndex !== null) {
      // Slot↔slot swap: the occupant slides to the dragging piece's slot.
      const sourceSlot = this.slots[sourceIndex];
      sourceSlot.occupiedBy = occupant;
      occupant.slotIndex = sourceIndex;
      destSlot.occupiedBy = piece;
      piece.slotIndex = destIndex;
      this.tweenTo(
        occupant.container,
        sourceSlot.x,
        sourceSlot.y,
        SWAP_DURATION,
        SWAP_REDUCED_DURATION,
      );
      this.snap(piece, destSlot);
    } else {
      // Tray↔slot displacement: the occupant returns to its own source spot.
      destSlot.occupiedBy = piece;
      piece.slotIndex = destIndex;
      occupant.slotIndex = null;
      this.tweenTo(
        occupant.container,
        occupant.originX,
        occupant.originY,
        BOUNCE_DURATION,
        BOUNCE_REDUCED_DURATION,
      );
      this.snap(piece, destSlot);
    }
    this.callbacks.onDrop?.(piece, destIndex);
    this.refreshValidationGuard();
  }

  private correctMissedDrop(piece: TPiece): void {
    const container = piece.container;
    if (piece.slotIndex === null) {
      // Unplaced and dropped on empty area: bounce back to the source row.
      if (!this.isOverAnyZone(container.x, container.y)) {
        this.tweenHome(piece);
      }
      return;
    }
    // Placed and missed every zone: return to the slot center it belongs to.
    const slot = this.slots[piece.slotIndex];
    if (!slot) return;
    if (container.x === slot.x && container.y === slot.y) return;
    if (this.isOverAnyZone(container.x, container.y)) return;
    this.tweenTo(container, slot.x, slot.y, BOUNCE_DURATION, BOUNCE_REDUCED_DURATION);
  }

  /**
   * The signature guard only matters while the board stays full: a board that
   * opened up (withdraw, displacement, bounce home) must be free to
   * re-validate the same arrangement once it fills again.
   */
  private refreshValidationGuard(): void {
    if (this.slots.some((slot) => slot.occupiedBy === null)) {
      this.lastValidatedSignature = null;
    }
  }

  private tryAutoValidate(): void {
    if (this.isLocked()) return;
    const placedIds = this.placedIds();
    if (this.validationTiming === "round-full") {
      if (this.slots.some((slot) => slot.occupiedBy === null)) return;
      const signature = placedIds.join("|");
      if (signature === this.lastValidatedSignature) return;
      this.lastValidatedSignature = signature;
    }
    this.callbacks.onValidate?.(placedIds);
  }
}
