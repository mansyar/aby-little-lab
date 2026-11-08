import type Phaser from "phaser";
import { getActiveProfile, getProfiles } from "../utils/storage";

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
  /**
   * Whether the panel was built while the device could not persist — the same
   * snapshot that decides whether its notice is on screen. False when the panel
   * is closed and in any scene that publishes no panel.
   */
  degraded: boolean;
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
   * The recovery card's button, while that card is the active scene. Null in
   * every other scene, so a journey can only tap the card while the card is
   * actually what it is looking at.
   */
  recover(): E2ERecoverState | null;
}

declare global {
  interface Window {
    __abyE2E?: E2EBridge;
  }
}

/**
 * What the bridge reaches for on a scene at runtime.
 *
 * `GameSceneBase` declares the geometry hook `protected`, so TypeScript hides it
 * from outside the class even though it is a plain prototype method at runtime.
 * This shape plus one cast is how the bridge reads it without importing a scene
 * (the dependency stays one-way: scenes -> bridge types, bridge -> nothing) and
 * without widening the scene's public surface for production code.
 */
interface E2ESceneProbe {
  completedRounds?: number;
  e2eRoundGeometry?: () => E2ERoundGeometry | null;
  e2eHubTiles?: () => E2ERoundTarget[];
  e2eHubToast?: () => E2EHubToast | null;
  e2eHubReady?: () => boolean;
  e2eSettings?: () => E2ESettingsState;
  e2eHubPlayTime?: () => E2EHubPlayTime;
  e2eRecoverButton?: () => E2ERecoverState | null;
}

/** True when the page was opened by the browser suite. */
function bridgeRequested(): boolean {
  return new URLSearchParams(location.search).get("e2e") === "1";
}

/** The scene Phaser is currently showing, or undefined before the first boot. */
function activeScene(game: Phaser.Game): Phaser.Scene | undefined {
  return game.scene.getScenes(true)[0];
}

function probeOf(scene: Phaser.Scene | undefined): E2ESceneProbe | undefined {
  return scene as unknown as E2ESceneProbe | undefined;
}

/**
 * Rounds finished in the active visit, read from the scene's own counter, or
 * `-1` when the active scene publishes no counter at all.
 *
 * `GameSceneBase` keeps `completedRounds`, advances it once in {@link
 * GameSceneBase.fillProgressDot}, and resets it when the dots are rebuilt or
 * the scene shuts down - so this reports 0 before the first round and one more
 * per finished round. Not inferred from the dots: a dot is dimmed with its
 * *fill* alpha, which leaves the game object's `alpha` at 1, so counting dots
 * by alpha would report every dot as filled.
 *
 * The `-1` default matches the other counters (`profileCount`, `stickerCount`):
 * a caller asserting "the game is on round 0" then fails loudly if a scene
 * stops publishing a counter, instead of passing on a coincidental zero.
 */
function completedRounds(probe: E2ESceneProbe | undefined): number {
  const count = probe?.completedRounds;
  return typeof count === "number" ? count : -1;
}

/** The active profile's earned stickers. */
function earnedStickers(): number {
  const stickers = getActiveProfile().stickers;
  return Object.values(stickers).filter((sticker) => sticker.earned).length;
}

/**
 * Installs the read-only test window when the page URL asks for it.
 *
 * Inert without `?e2e=1`: nothing is assigned and the game instance is only
 * held by the caller. When it is installed every accessor reads live state at
 * call time — there is no cache, no setter and no storage write — so the suite
 * can poll the round without the bridge ever steering it.
 *
 * The bridge is deliberately the same code in the shipped artifact: the gate is
 * the query string, not a build-time flag, so what CI exercises is what users
 * download.
 */
export function initE2EBridge(game: Phaser.Game): void {
  if (!bridgeRequested()) return;

  const bridge: E2EBridge = {
    activeSceneKey: () => activeScene(game)?.scene.key ?? null,
    profileCount: () => getProfiles().length,
    stickerCount: earnedStickers,
    roundIndex: () => completedRounds(probeOf(activeScene(game))),
    roundGeometry: () => {
      const probe = probeOf(activeScene(game));
      const hook = probe?.e2eRoundGeometry;
      if (typeof hook !== "function") return null;
      return hook.call(probe);
    },
    hubTiles: () => {
      const probe = probeOf(activeScene(game));
      const hook = probe?.e2eHubTiles;
      if (typeof hook !== "function") return [];
      return hook.call(probe);
    },
    hubToast: () => {
      const probe = probeOf(activeScene(game));
      const hook = probe?.e2eHubToast;
      if (typeof hook !== "function") return null;
      return hook.call(probe);
    },
    hubReady: () => {
      const probe = probeOf(activeScene(game));
      const hook = probe?.e2eHubReady;
      if (typeof hook !== "function") return false;
      return hook.call(probe);
    },
    settings: () => {
      const probe = probeOf(activeScene(game));
      const hook = probe?.e2eSettings;
      if (typeof hook !== "function") {
        return {
          gate: null,
          open: false,
          toggles: [],
          progressRow: null,
          progress: null,
          degraded: false,
          page: 0,
          switchPage: { x: 0, y: 0 },
          backupRows: [],
          backupResult: "",
          choices: [],
        };
      }
      return hook.call(probe);
    },
    hubPlayTime: () => {
      const probe = probeOf(activeScene(game));
      const hook = probe?.e2eHubPlayTime;
      if (typeof hook !== "function") return { timeUp: false, nudging: false };
      return hook.call(probe);
    },
    recover: () => {
      // The card is only readable while it is what Phaser is showing: after the
      // tap the page is reloading and after a normal launch this scene is not
      // running at all, so there is no button a journey could honestly tap.
      const scene = activeScene(game);
      if (scene?.scene.key !== "Recover") return null;
      const probe = probeOf(scene);
      const hook = probe?.e2eRecoverButton;
      if (typeof hook !== "function") return null;
      return hook.call(probe);
    },
  };

  window.__abyE2E = Object.freeze(bridge);
}
