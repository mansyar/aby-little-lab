import type Phaser from "phaser";
import {
  type BoardPiece,
  type BoardSlot,
  DragBoardEngine,
  type DragBoardOptions,
  type SlotCapacity,
} from "./dragBoardEngine";

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
} from "./dragBoardEngine";

/**
 * Parameterized drag-board shell extracted from Number Order and Story Order.
 *
 * Owns the scaffolding every board scene hand-rolled inline: slot/drop-zone
 * registration and hover detection, snap wiring over `snapToSlot`,
 * slot↔slot swap, tray↔slot displacement, tap-vs-drag discrimination with
 * tap-withdraw, and the two wrong-answer movement policies. Slots are single
 * or multi capacity; pieces may be Images or Containers — the shell is generic
 * over both. Validation itself belongs to the scene — the shell only reports
 * drop/withdraw events and fires the validation hook at the configured timing.
 *
 * The shell never touches visuals (outlines, fills, art): scenes draw their
 * own slot decoration and keep their piece records, which satisfy
 * {@link BoardPiece} structurally. The stateful implementation lives in
 * `dragBoardEngine.ts`; this façade keeps the original import path and API.
 */
export class DragBoard<TPiece extends BoardPiece> {
  private readonly engine: DragBoardEngine<TPiece>;
  private readonly scene: Phaser.Scene;
  private destroyed = false;
  private readonly handleShutdown = (): void => {
    this.destroy();
  };

  constructor(options: DragBoardOptions<TPiece>) {
    this.engine = new DragBoardEngine(options);
    this.scene = options.scene;
    // Same shutdown mechanism the GameSceneBase registry uses, so the shell
    // releases its state without the scene having to remember it.
    options.scene.events.on("shutdown", this.handleShutdown);
  }

  /**
   * Creates the interactive drop zone for a slot and registers it. Capacity
   * defaults to `"single"` — the exact one-piece-per-slot occupancy semantics
   * the adopting boards already run on.
   */
  addSlot(x: number, y: number, capacity: SlotCapacity = "single"): BoardSlot<TPiece> {
    return this.engine.addSlot(x, y, capacity);
  }

  /** Wires the gesture listeners of a scene-built piece onto the board. */
  addPiece(piece: TPiece): void {
    this.engine.addPiece(piece);
  }

  /** Whether any registered slot's hit square contains the point. */
  isOverAnyZone(x: number, y: number): boolean {
    return this.engine.isOverAnyZone(x, y);
  }

  /** Returns true when every registered slot is occupied. */
  isFull(): boolean {
    return this.engine.isFull();
  }

  /** The placed pieces in slot order. */
  placedPieces(): TPiece[] {
    return this.engine.placedPieces();
  }

  /**
   * The placed piece ids in slot order, null for an empty slot. A multi slot
   * contributes its occupants' ids in drop order joined with "," — the same
   * summary the validation hook receives.
   */
  placedIds(): (string | null)[] {
    return this.engine.placedIds();
  }

  /** All registered slots in registration order. */
  getSlots(): readonly BoardSlot<TPiece>[] {
    return this.engine.getSlots();
  }

  /** Returns a placed piece to its source position, freeing its slot. */
  withdraw(piece: TPiece): void {
    this.engine.withdraw(piece);
  }

  /**
   * Applies the configured wrong-answer movement policy. Call once the wrong
   * answer's wiggle has finished: `bounce-home` sends every placed piece back
   * to its source position and frees the board; `retry-in-place` keeps the
   * board exactly where the child put it.
   */
  applyWrongAnswer(): void {
    this.engine.applyWrongAnswer();
  }

  /** Releases the round: destroys the shell-owned zones and drops all state. */
  clear(): void {
    this.engine.clear();
  }

  /** Releases all state and detaches the shutdown listener. */
  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.engine.releaseState();
    this.scene.events.off("shutdown", this.handleShutdown);
  }
}
