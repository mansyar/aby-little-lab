import type Phaser from "phaser";
import type { DragTarget } from "../utils/dragJuice";

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
