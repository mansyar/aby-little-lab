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

/** How many pieces a slot holds: exactly one, or several accumulating. */
export type SlotCapacity = "single" | "multi";

/**
 * Pointer travel (px) before a gesture counts as a drag. Phaser starts a drag
 * on the first pointermove (threshold 0), and a drag that ends over the
 * piece's own slot is indistinguishable from a drop — ten pixels of slack
 * keeps a preschooler's slightly wobbly tap a tap.
 */
export const DEFAULT_DRAG_DISTANCE_THRESHOLD = 10;

/** Default bounce-to-source tween duration (ms) — Story Order's timing. */
const BOUNCE_DURATION = 300;

/** Default bounce-to-source tween duration under reduced motion (ms). */
const BOUNCE_REDUCED_DURATION = 180;

/** Slot↔slot swap tween duration (ms). */
const SWAP_DURATION = 200;

/** Slot↔slot swap tween duration under reduced motion (ms). */
const SWAP_REDUCED_DURATION = 120;

/**
 * The draggable capability set a board piece's `container` field accepts —
 * the {@link DragTarget} capability set (transform + drag lifecycle + owning
 * scene, which both a plain `Phaser.GameObjects.Image` and a
 * `Phaser.GameObjects.Container` satisfy), extended with the pointer, drag,
 * and drop events the shell wires itself.
 */
export type BoardDraggable = DragTarget & {
  /** Register a pointer gesture handler (tap bookkeeping). */
  on(event: "pointerdown" | "pointerup", listener: () => void): void;
  /** Register the drag-move handler the shell positions the piece with. */
  on(event: "drag", listener: (pointer: unknown, dragX: number, dragY: number) => void): void;
  /** Register the drop handler the shell resolves occupancy with. */
  on(event: "drop", listener: (pointer: unknown, target: unknown) => void): void;
};

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
  /**
   * Draggable object the shell wires gesture listeners onto — any
   * {@link BoardDraggable}, so a piece may be a plain `Image` as well as a
   * `Container`.
   */
  container: BoardDraggable;
  /** Source (tray/row) position the piece returns to when unplaced. */
  originX: number;
  originY: number;
  /** Index of the slot the piece occupies, or null while in the source row. */
  slotIndex: number | null;
  /** True once the current gesture has become a drag or a drop. */
  justDropped: boolean;
}

/** One drop slot: its hit zone, position, and current occupancy. */
export interface BoardSlot<TPiece extends BoardPiece = BoardPiece> {
  readonly zone: Phaser.GameObjects.Zone;
  readonly x: number;
  readonly y: number;
  /** Whether the slot holds exactly one piece or several. */
  readonly capacity: SlotCapacity;
  /**
   * Single-capacity occupant: the placed piece, or null when free. Multi
   * slots keep this null and track occupancy in {@link BoardSlot.pieces}.
   */
  occupiedBy: TPiece | null;
  /** Multi-capacity occupants in drop order. Single slots keep it empty. */
  pieces: TPiece[];
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
   * occupant summaries: the piece's id for a single slot, its occupants' ids
   * in drop order joined with "," for a multi slot, and null for an empty
   * slot. (Piece ids are scene-owned and must not contain the separators.)
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
  /** Bounce-to-source tween duration (ms). Default 300 (Story Order's timing). */
  readonly bounceDuration?: number;
  /** Bounce-to-source tween duration under reduced motion (ms). Default 180. */
  readonly bounceReducedDuration?: number;
  /** Reads the scene's input lock, so the shell shares the scene's one lock. */
  readonly isLocked: () => boolean;
  /** Scene-owned reactions the shell reports into. */
  readonly callbacks?: DragBoardCallbacks<TPiece>;
}

/**
 * Parameterized drag-board shell extracted from Number Order and Story Order.
 *
 * Owns the scaffolding every board scene hand-rolled inline: slot/drop-zone
 * registration and hover detection, snap wiring over {@link snapToSlot},
 * slot↔slot swap, tray↔slot displacement, tap-vs-drag discrimination with
 * tap-withdraw, and the two wrong-answer movement policies. Slots are single
 * or multi capacity; pieces may be Images or Containers — the shell is generic
 * over both. Validation itself belongs to the scene — the shell only reports
 * drop/withdraw events and fires the validation hook at the configured timing.
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
  private readonly bounceDuration: number;
  private readonly bounceReducedDuration: number;
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
    this.bounceDuration = options.bounceDuration ?? BOUNCE_DURATION;
    this.bounceReducedDuration = options.bounceReducedDuration ?? BOUNCE_REDUCED_DURATION;
    this.isLocked = options.isLocked;
    this.callbacks = options.callbacks ?? {};
    this.scene.input.dragDistanceThreshold =
      options.dragDistanceThreshold ?? DEFAULT_DRAG_DISTANCE_THRESHOLD;
    // Same shutdown mechanism the GameSceneBase registry uses, so the shell
    // releases its state without the scene having to remember it.
    this.scene.events.on("shutdown", this.handleShutdown);
  }

  /**
   * Creates the interactive drop zone for a slot and registers it. Capacity
   * defaults to `"single"` — the exact one-piece-per-slot occupancy semantics
   * the adopting boards already run on.
   */
  addSlot(x: number, y: number, capacity: SlotCapacity = "single"): BoardSlot<TPiece> {
    const zone = this.scene.add.zone(x, y, this.zoneSize, this.zoneSize);
    zone.setInteractive({ dropZone: true });
    const slot: BoardSlot<TPiece> = { zone, x, y, capacity, occupiedBy: null, pieces: [] };
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
    return this.slots.every((slot) => this.isOccupied(slot));
  }

  /** The placed pieces in slot order. */
  placedPieces(): TPiece[] {
    return this.slots.flatMap((slot) => this.occupantsOf(slot));
  }

  /**
   * The placed piece ids in slot order, null for an empty slot. A multi slot
   * contributes its occupants' ids in drop order joined with "," — the same
   * summary the validation hook receives.
   */
  placedIds(): (string | null)[] {
    return this.slots.map((slot) => {
      const occupants = this.occupantsOf(slot);
      if (occupants.length === 0) return null;
      return occupants.map((piece) => piece.id).join(",");
    });
  }

  /** All registered slots in registration order. */
  getSlots(): readonly BoardSlot<TPiece>[] {
    return this.slots;
  }

  /** Returns a placed piece to its source position, freeing its slot. */
  withdraw(piece: TPiece): void {
    if (piece.slotIndex === null) return;
    this.detachPiece(piece);
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
      for (const piece of this.occupantsOf(slot)) {
        piece.slotIndex = null;
        this.tweenHome(piece);
      }
      this.freeSlot(slot);
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
      for (const piece of this.occupantsOf(slot)) piece.slotIndex = null;
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
    target: BoardDraggable,
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
      this.bounceDuration,
      this.bounceReducedDuration,
    );
  }

  private snap(piece: TPiece, slot: BoardSlot<TPiece>): void {
    // DragTarget is a structural shape (transform + scene + drag-event `on`)
    // any draggable container satisfies; the double cast only bridges Phaser's
    // EventEmitter `on` overloads, not a real type mismatch.
    snapToSlot(this.scene, piece.container as unknown as DragTarget, slot.x, slot.y);
  }

  /** Whether a slot currently holds at least one piece. */
  private isOccupied(slot: BoardSlot<TPiece>): boolean {
    return slot.capacity === "single" ? slot.occupiedBy !== null : slot.pieces.length > 0;
  }

  /** A slot's placed pieces in occupancy order, empty when free. */
  private occupantsOf(slot: BoardSlot<TPiece>): TPiece[] {
    if (slot.capacity === "single") return slot.occupiedBy ? [slot.occupiedBy] : [];
    return [...slot.pieces];
  }

  /** Whether the piece already occupies the slot. */
  private holdsPiece(slot: BoardSlot<TPiece>, piece: TPiece): boolean {
    return slot.capacity === "single" ? slot.occupiedBy === piece : slot.pieces.includes(piece);
  }

  /** Frees whichever slot currently holds the piece; the caller owns slotIndex. */
  private detachPiece(piece: TPiece): void {
    if (piece.slotIndex === null) return;
    const slot = this.slots[piece.slotIndex];
    if (!slot) return;
    if (slot.capacity === "single") {
      slot.occupiedBy = null;
    } else {
      slot.pieces = slot.pieces.filter((occupied) => occupied !== piece);
    }
  }

  /** Clears a slot's occupancy in both capacity modes. */
  private freeSlot(slot: BoardSlot<TPiece>): void {
    slot.occupiedBy = null;
    slot.pieces = [];
  }

  private handleDrop(piece: TPiece, zone: unknown): void {
    if (this.isLocked()) return;
    // A drop is never a tap, whatever the trailing pointerup looks like.
    piece.justDropped = true;
    const destIndex = this.slots.findIndex((slot) => slot.zone === zone);
    if (destIndex === -1) return;
    const destSlot = this.slots[destIndex];

    if (this.holdsPiece(destSlot, piece)) {
      // Dropped back onto its own slot — just snap.
      this.snap(piece, destSlot);
      return;
    }

    const sourceIndex = piece.slotIndex;

    if (destSlot.capacity === "multi") {
      // A multi slot accumulates: the piece joins its occupant list.
      this.detachPiece(piece);
      destSlot.pieces.push(piece);
      piece.slotIndex = destIndex;
      this.snap(piece, destSlot);
      this.callbacks.onDrop?.(piece, destIndex);
      this.refreshValidationGuard();
      return;
    }

    const occupant = destSlot.occupiedBy;
    if (occupant === null) {
      this.detachPiece(piece);
      destSlot.occupiedBy = piece;
      piece.slotIndex = destIndex;
      this.snap(piece, destSlot);
      this.callbacks.onDrop?.(piece, destIndex);
      this.refreshValidationGuard();
      return;
    }

    this.detachPiece(piece);
    const sourceSlot = sourceIndex !== null ? this.slots[sourceIndex] : null;
    destSlot.occupiedBy = piece;
    piece.slotIndex = destIndex;
    if (sourceSlot) {
      // Slot↔slot: the occupant slides to the dragging piece's source slot.
      if (sourceSlot.capacity === "single") {
        sourceSlot.occupiedBy = occupant;
      } else {
        sourceSlot.pieces.push(occupant);
      }
      occupant.slotIndex = sourceIndex;
      this.tweenTo(
        occupant.container,
        sourceSlot.x,
        sourceSlot.y,
        SWAP_DURATION,
        SWAP_REDUCED_DURATION,
      );
    } else {
      // Tray↔slot displacement: the occupant returns to its own source spot.
      occupant.slotIndex = null;
      this.tweenTo(
        occupant.container,
        occupant.originX,
        occupant.originY,
        this.bounceDuration,
        this.bounceReducedDuration,
      );
    }
    this.snap(piece, destSlot);
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
    this.tweenTo(container, slot.x, slot.y, this.bounceDuration, this.bounceReducedDuration);
  }

  /**
   * The signature guard only matters while the board stays full: a board that
   * opened up (withdraw, displacement, bounce home) must be free to
   * re-validate the same arrangement once it fills again.
   */
  private refreshValidationGuard(): void {
    if (this.slots.some((slot) => !this.isOccupied(slot))) {
      this.lastValidatedSignature = null;
    }
  }

  private tryAutoValidate(): void {
    if (this.isLocked()) return;
    const placedIds = this.placedIds();
    if (this.validationTiming === "round-full") {
      if (this.slots.some((slot) => !this.isOccupied(slot))) return;
      const signature = placedIds.join("|");
      if (signature === this.lastValidatedSignature) return;
      this.lastValidatedSignature = signature;
    }
    this.callbacks.onValidate?.(placedIds);
  }
}
