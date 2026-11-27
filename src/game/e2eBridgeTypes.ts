import type { ActionIcon } from "./fixItMachineLogic";
import type { MoveAction, Program, TargetCount } from "./repeatMachineLogic";
import type { Direction } from "./robotPathLogic";

/** One canvas-space point the browser suite may act on. */
export interface E2ERoundTarget {
  /**
   * Scene-owned identity. Equal ids pair a draggable target with the slot it
   * belongs in, and equal ids on a memory board are a pair.
   */
  id: string;
  /** X in the 1024x768 canvas space. */
  x: number;
  /** Y in the 1024x768 canvas space. */
  y: number;
}

/** A canvas-space point with no identity: a card, a button, a row's centre. */
export interface GamePoint {
  /** X in the 1024x768 canvas space. */
  x: number;
  /** Y in the 1024x768 canvas space. */
  y: number;
}

/** A read-only description of the round the active scene is showing. */
export interface E2ERoundGeometry {
  /** Zero-based round index, matching the scene's progress dots. */
  round: number;
  /** The correct answers for this round. */
  targets: E2ERoundTarget[];
  /** Drop positions, drag games only. */
  slots?: E2ERoundTarget[];
}

/** A hub overlay that sits over the tiles until it is dismissed. */
export interface E2EHubToast {
  /** Canvas-space centre of the button that closes the toast. */
  button: { x: number; y: number };
}

/**
 * The recovery card's one control, as the card is drawing it.
 *
 * A journey that has just crashed cannot read a comment to find the button: the
 * card is the only thing on screen and its position is a drawn number. Publishing
 * the centre means the tap is the card's own layout rather than a copied
 * coordinate, exactly as `E2EHubToast` does for the toast.
 */
export interface E2ERecoverState {
  /** The card's button centre in canvas coordinates. */
  readonly button: GamePoint;
}

/** One settings row the parental panel publishes for the browser suite. */
export interface E2ESettingsToggle {
  /** Stable setting key: `bgm`, `sfx` or `adaptive`. */
  id: string;
  /** Canvas-space X of the row's tap band - the whole card is live. */
  x: number;
  /** Canvas-space Y of the row's tap band centre. */
  y: number;
  /** The toggle's state right now, read from the row's own flag. */
  on: boolean;
}

/** The Learning Progress overlay, as the overlay itself is drawing it. */
export interface E2EProgressState {
  /** Zero-based page index; page 0 is the Overview. */
  page: number;
  /** The Overview plus the per-game pages, as the overlay computes it. */
  pageCount: number;
  /**
   * The Overview statements in the order they were drawn on page 0, or `[]` on
   * any later page. Captured when the text objects are created, so a journey
   * asserts the strings the page printed rather than a second derivation.
   */
  lines: string[];
  /** Canvas centre of the back chevron. */
  prev: { x: number; y: number };
  /** Canvas centre of the forward chevron. */
  next: { x: number; y: number };
}

/** The Parent Help overlay exactly as it is drawing itself. */
export interface E2EHelpState {
  /** The topic menu or one topic's detail page. */
  screen: "topics" | "topic";
  /** Stable topic id from `helpContent`, or null on the menu. */
  topicId: string | null;
  /** Zero-based index of the open topic, or -1 on the menu. */
  topicIndex: number;
  /** Number of topics in the menu. */
  topicCount: number;
  /** The heading currently drawn. */
  title: string;
  /** The text lines currently drawn, in draw order. */
  lines: string[];
  /** The eight menu cards, in draw order, with the centres a tap answers to. */
  topics: { id: string; title: string; x: number; y: number }[];
  /** Drawn controls; `back`, `prev` and `next` are null on inactive boundaries. */
  controls: {
    close: GamePoint;
    back: GamePoint | null;
    prev: GamePoint | null;
    next: GamePoint | null;
  };
}

/**
 * The second Settings page — backup, restore and the crash log — as the panel
 * is showing it.
 *
 * A journey moves between the pages with `switchPage` and taps the action rows
 * with `backupRows`, then reads `backupResult` rather than a pixel: the result
 * line is the app's own sentence about what happened.
 */
export interface E2EBackupState {
  /** The page on screen: 0 is the settings rows, 1 is backup and restore. */
  page: 0 | 1;
  /**
   * Canvas centre of the card that switches pages. `{ x: 0, y: 0 }` when no
   * panel is open — there is no card to tap, and the origin is outside every
   * panel object.
   */
  switchPage: GamePoint;
  /** Page two's tappable rows, in the order they are drawn; empty off page 1. */
  backupRows: { id: "export" | "restore" | "diagnostics"; point: GamePoint }[];
  /** The result line's current text, `""` when nothing has happened yet. */
  backupResult: string;
  /**
   * The merge-or-replace card's two buttons, in the order they are drawn, each
   * with the centre its own band answers to. Empty while no card is open, which
   * is how a journey tells "the file was accepted" apart from "it was refused":
   * a refusal ends on the result line and never opens the card.
   */
  choices: { id: "merge" | "replace"; point: GamePoint }[];
}

/** The parental gate and the settings panel as the hub currently holds them. */
export interface E2ESettingsState extends E2EBackupState {
  /** Canvas centre of the settings control, or null in a scene that is not the hub. */
  gate: { x: number; y: number } | null;
  /** Whether the panel is up; false in any other scene and after it closes. */
  open: boolean;
  /** The panel's toggle rows while it is open, empty otherwise. */
  toggles: E2ESettingsToggle[];
  /**
   * Canvas centre of the "Progress" row while the panel is up, so a journey
   * opens the overlay from the row's own layout rather than a copied number.
   * Null when the panel is closed.
   */
  progressRow: { x: number; y: number } | null;
  /** The Progress overlay while it is open; null when it is closed. */
  progress: E2EProgressState | null;
  /** The persistent header Help control's centre while the panel is open. */
  helpButton: GamePoint | null;
  /** The Parent Help overlay while it is open; null when Help or Settings is closed. */
  help: E2EHelpState | null;
  /**
   * Whether the panel was built while the device could not persist — the same
   * snapshot that decides whether its notice is on screen. False when the panel
   * is closed and in any scene that publishes no panel.
   */
  degraded: boolean;
}

/** One group chip the hub is drawing, with the centre its hit zone answers to. */
export interface E2EHubChip {
  /** `all` or one of the five group ids. */
  id: string;
  /** Canvas-space X of the chip's centre. */
  x: number;
  /** Canvas-space Y of the chip's centre. */
  y: number;
}

/**
 * The hub's chip row and the selection it is filtering by.
 *
 * Read from the live row, so a journey drives the chip the child sees instead of
 * a copied layout number, and can tell which group's board it is looking at.
 */
export interface E2EHubGroups {
  /** The selection the board is filtered by — `all` when nothing is filtered. */
  selected: string;
  /** The six chips, in draw order (All first), from the live objects. */
  chips: E2EHubChip[];
}

/** One palette arrow and the canvas point its button answers to. */
export interface E2ERobotPathPalette {
  /** The absolute direction this arrow appends. */
  dir: Direction;
  /** X in the 1024x768 canvas space. */
  x: number;
  /** Y in the 1024x768 canvas space. */
  y: number;
}

/** One command slot: where it is, and whether it holds an arrow right now. */
export interface E2ERobotPathSlot {
  /** Zero-based slot index. */
  index: number;
  /** X in the 1024x768 canvas space. */
  x: number;
  /** Y in the 1024x768 canvas space. */
  y: number;
  /** True when this slot holds a command in the current program. */
  filled: boolean;
}

/**
 * Robot Path's live board (FR-16): the round, the program being built, the
 * intended route, and the geometry a journey taps.
 *
 * `solution` mirrors how the other games publish their correct answers; `runs`
 * counts finished runs this round (a stopped run and a solved run each count
 * once) and `solved` says whether one of them reached the star, so a journey can
 * tell "the wrong program is still on the strip" from "the round has moved on"
 * without inferring it from a timer.
 */
export interface E2ERobotPathState {
  /** Zero-based round index, matching the scene's progress dots. */
  round: number;
  /** The round's intended route, step by step. */
  solution: Direction[];
  /** The program in the strip right now. */
  commands: Direction[];
  /** The four palette arrows, in draw order. */
  palette: E2ERobotPathPalette[];
  /** The six command slots, in draw order. */
  slots: E2ERobotPathSlot[];
  /** The Go button's centre. */
  go: GamePoint;
  /** The robot's current tile centre. */
  robot: GamePoint;
  /** The star's tile centre. */
  star: GamePoint;
  /** Runs finished this round, both outcomes. */
  runs: number;
  /** Whether one of those runs reached the star. */
  solved: boolean;
}

/** One tape card and the canvas point its slot answers to. */
export interface E2EFixItMachineCard {
  /** Zero-based card index on the tape. */
  index: number;
  /** X in the 1024x768 canvas space. */
  x: number;
  /** Y in the 1024x768 canvas space. */
  y: number;
}

/** One open repair-tray slot: the tool it offers and where it is. */
export interface E2EFixItMachineTraySlot {
  /** Zero-based tray index. */
  index: number;
  /** The tool this slot offers. */
  action: ActionIcon;
  /** X in the 1024x768 canvas space. */
  x: number;
  /** Y in the 1024x768 canvas space. */
  y: number;
}

/**
 * Fix-It Machine's workshop (FR-15): the round, the tape as drawn, the one
 * wrong card, and the geometry a journey taps.
 *
 * `solution` mirrors how the other games publish their correct answers; `tape`
 * is what is on screen right now, so a journey can tell a repaired tape from an
 * untouched one. `wrongTaps` and `hintLevel` come from the scene's own counters
 * rather than being inferred from how the hints look, and `failedRuns` counts
 * runs this round that stopped at the wrong card.
 */
export interface E2EFixItMachineState {
  /** Zero-based round index, matching the scene's progress dots. */
  round: number;
  /** The round's correct program, card by card. */
  solution: ActionIcon[];
  /** The tape on screen right now. */
  tape: ActionIcon[];
  /** Index of the card that does not belong, or -1 when there is no round. */
  bugIndex: number;
  /** Whether the toy came out right this round. */
  solved: boolean;
  /** Taps that missed the wrong card or the right tool. */
  wrongTaps: number;
  /** The hint level those taps have earned: 0, 1, 2 or 3. */
  hintLevel: number;
  /** Runs this round that stopped at the wrong card. */
  failedRuns: number;
  /** Whether the repair tray is open. */
  trayOpen: boolean;
  /** The cards the tape is showing, in draw order. */
  cards: E2EFixItMachineCard[];
  /** The open tray's candidates, in draw order; empty while it is shut. */
  tray: E2EFixItMachineTraySlot[];
  /** The Go button's centre. */
  go: GamePoint;
  /** The machine's centre. */
  machine: GamePoint;
  /** The goal bubble's centre. */
  goal: GamePoint;
}

/** A move card the journey can tap, with the canvas point it occupies. */
export interface E2ERepeatMachineChoice {
  index: number;
  action: MoveAction;
  x: number;
  y: number;
}

/** A repeat-count card the journey can tap. */
export interface E2ERepeatMachineCount {
  index: number;
  count: number;
  x: number;
  y: number;
}

/**
 * Repeat Machine's authoring board (FR-15): the target, the chosen program,
 * the performed replay and the geometry a journey taps. Counters are read from
 * the scene, never inferred from how the hints look.
 */
export interface E2ERepeatMachineState {
  /** Zero-based round index, matching the scene's progress dots. */
  round: number;
  /** Dots the child must match this round. */
  target: TargetCount;
  /** The round's moves in their authored order. */
  actions: readonly MoveAction[];
  /** The four move cards on screen. */
  actionOptions: E2ERepeatMachineChoice[];
  /** The three count cards on screen, in count order. */
  countOptions: E2ERepeatMachineCount[];
  /** What the child authored, or nulls while a field is unset. */
  program: Program;
  /** The last replay's move+sound pairs, exactly count long. */
  performed: readonly MoveAction[];
  /** Target dot centres, one per dot shown. */
  dots: GamePoint[];
  /** Whether the last replay matched the target. */
  solved: boolean;
  /** Runs this round whose count missed the target. */
  wrongRuns: number;
  /** Misses this round, including wrong replays. */
  wrongTaps: number;
  /** The visual help earned so far: 0, 1 or 2. */
  hintLevel: number;
  /** Attempt number of the last replay, starting at one. */
  attempts: number;
  /** Points the last replay earned from the rule module. */
  lastScore: number;
  /** The Go button's centre. */
  go: GamePoint;
  /** The machine's centre. */
  machine: GamePoint;
}

/** The hub's play-time state, as the hub itself sees it. */
export interface E2EHubPlayTime {
  /** Whether the active profile's daily budget is spent, so every tile is locked. */
  timeUp: boolean;
  /** Whether the pre-game nudge overlay is on screen right now. */
  nudging: boolean;
}

/** The window the browser suite polls; every member is a live read. */
export interface E2EBridge {
  activeSceneKey(): string | null;
  profileCount(): number;
  stickerCount(): number;
  /**
   * Rounds finished in the active visit: 0 before the first round, one more
   * per completed round, reset when the scene is left. Read from the scene's
   * own counter, never inferred from how the progress dots look.
   */
  roundIndex(): number;
  roundGeometry(): E2ERoundGeometry | null;
  /**
   * The hub's game tiles that are on screen right now, in creation order, with
   * each tile's registry index as its id. Empty in any scene that is not the
   * hub. A paged viewport publishes only the current page's tiles.
   */
  hubTiles(): E2ERoundTarget[];
  /**
   * The PWA toast covering the hub right now, if any, with the canvas position
   * of the button that dismisses it. Null in any scene that is not the hub, and
   * null when no toast is showing — so a journey can tell "nothing to dismiss"
   * apart from "dismissed" and cannot accidentally tap a tile through a panel.
   */
  hubToast(): E2EHubToast | null;
  /**
   * Whether the hub's tiles are tappable yet. False before the grid is built
   * and while its entrance tweens run — a tile scaled to nothing cannot be hit —
   * and true once every visible tile has finished entering. Always false in a
   * scene that is not the hub, because nothing there publishes it.
   */
  hubReady(): boolean;
  /**
   * The parental settings gate and panel. `gate` is the live canvas point a
   * parent presses to start the three-second hold; `open` is the panel's own
   * liveness, and `toggles` are the rows it is showing. A scene without a gate
   * reports `{ gate: null, open: false, toggles: [] }` rather than throwing.
   */
  settings(): E2ESettingsState;
  /**
   * The hub's daily-budget state: whether the cap locked the tiles, and whether
   * the pre-game nudge is on screen. False in any other scene.
   */
  hubPlayTime(): E2EHubPlayTime;
  /**
   * The chip row and the current selection. A scene that is not the hub, or a
   * hub whose row is not built yet, publishes `{ selected: "all", chips: [] }`
   * rather than throwing, so a journey can wait for the row the same way it
   * waits for the board.
   */
  hubGroups(): E2EHubGroups;
  /**
   * The recovery card's button, while that card is the active scene. Null in
   * every other scene, so a journey can only tap the card while the card is
   * actually what it is looking at.
   */
  recover(): E2ERecoverState | null;
  /**
   * Robot Path's board while that scene is active. Null in every other scene,
   * so a journey can only program the robot while the robot is what it sees.
   */
  robotPath(): E2ERobotPathState | null;
  /**
   * Fix-It Machine's workshop while that scene is active. Null in every other
   * scene, so a journey can only repair the tape while the tape is what it sees.
   */
  fixItMachine(): E2EFixItMachineState | null;
  /**
   * Repeat Machine's authoring board while that scene is active. Null in every
   * other scene, so a journey can only author a program while it sees one.
   */
  repeatMachine(): E2ERepeatMachineState | null;
}

declare global {
  interface Window {
    __abyE2E?: E2EBridge;
  }
}
