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

/** The window the browser suite polls; every member is a live read. */
export interface E2EBridge {
  activeSceneKey(): string | null;
  profileCount(): number;
  stickerCount(): number;
  roundIndex(): number;
  roundGeometry(): E2ERoundGeometry | null;
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
  progressDots?: Array<{ alpha: number }>;
  e2eRoundGeometry?: () => E2ERoundGeometry | null;
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
 * Completed rounds in the active visit, counted from the filled progress dots.
 *
 * Every game scene fills one dot per completed round in {@link
 * GameSceneBase.fillProgressDot}, so a filled dot is exactly a round the child
 * has finished — no second counter to keep in step. The dot's `alpha` is the
 * filled flag (0.3 dimmed, 1 filled); its scale is a pop tween and says nothing.
 */
function completedRounds(probe: E2ESceneProbe | undefined): number {
  const dots = probe?.progressDots;
  if (!Array.isArray(dots)) return 0;
  return dots.filter((dot) => dot.alpha === 1).length;
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
  };

  window.__abyE2E = Object.freeze(bridge);
}
