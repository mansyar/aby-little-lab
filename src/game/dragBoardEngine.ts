import type Phaser from "phaser";
import { type DragTarget, snapToSlot } from "../utils/dragJuice";
import { motionDuration } from "../utils/motion";
import {
  type BoardDraggable,
  type BoardPiece,
  type BoardSlot,
  DEFAULT_DRAG_DISTANCE_THRESHOLD,
  type DragBoardCallbacks,
  type DragBoardOptions,
  type SlotCapacity,
  type ValidationTiming,
  type WrongAnswerBehavior,
} from "./dragBoardTypes";

export {
  type BoardDraggable,
  type BoardPiece,
  type BoardSlot,
  DEFAULT_DRAG_DISTANCE_THRESHOLD,
  type DragBoardCallbacks,
  type DragBoardOptions,
  type SlotCapacity,
  type ValidationTiming,
  type WrongAnswerBehavior,
} from "./dragBoardTypes";

/** Default bounce-to-source tween duration (ms) — Story Order's timing. */
const BOUNCE_DURATION = 300;
/** Default bounce-to-source tween duration under reduced motion (ms). */
const BOUNCE_REDUCED_DURATION = 180;
/** Slot↔slot swap tween duration (ms). */
const SWAP_DURATION = 200;
/** Slot↔slot swap tween duration under reduced motion (ms). */
const SWAP_REDUCED_DURATION = 120;

/** Stateful core of {@link DragBoard}; the public shell only forwards calls. */
export class DragBoardEngine<TPiece extends BoardPiece> {
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
  // Live snap tweens; `tweenHome` stops the tracked snap so the bounce home is
  // the only positional tween (killTweensOf would also kill scale/angle restore).
  private snapTweens = new Map<TPiece, Phaser.Tweens.Tween>();

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
  }

  /** Creates the interactive drop zone for a slot and registers it. */
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
      // A new gesture is a potential tap until movement or a drop marks it a drag.
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

  /** Placed ids in slot order (multi slots joined with ","; empty = null). */
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

  /** Applies the wrong-answer policy after the wiggle (bounce home or retry in place). */
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

  /** Drops references without destroying zones (the shell's destroy path). */
  releaseState(): void {
    this.slots = [];
    this.pieces = [];
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
    this.snapTweens.clear();
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
    // A wrong drop snaps the piece toward the slot before the scene's onDrop
    // withdraws it, so a snap tween can still be live here; stop it so the
    // bounce home is the single positional tween, starting from the drop
    // point like the hand-rolled code this shell replaced.
    this.snapTweens.get(piece)?.stop();
    this.snapTweens.delete(piece);
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
    const tween = snapToSlot(this.scene, piece.container as unknown as DragTarget, slot.x, slot.y);
    this.snapTweens.set(piece, tween);
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
