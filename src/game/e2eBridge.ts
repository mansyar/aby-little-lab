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
 * Rounds finished in the active visit, read from the scene's own counter.
 *
 * `GameSceneBase` keeps `completedRounds`, advances it once in {@link
 * GameSceneBase.fillProgressDot}, and resets it when the dots are rebuilt or
 * the scene shuts down — so this reports 0 before the first round and one more
 * per finished round. Not inferred from the dots: a dot is dimmed with its
 * *fill* alpha, which leaves the game object's `alpha` at 1, so counting dots
 * by alpha would report every dot as filled.
 */
function completedRounds(probe: E2ESceneProbe | undefined): number {
  const count = probe?.completedRounds;
  return typeof count === "number" ? count : 0;
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
  };

  window.__abyE2E = Object.freeze(bridge);
}
