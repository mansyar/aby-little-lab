import type Phaser from "phaser";
import type { CrashKind } from "../types";
import { toCrashEntry } from "../utils/diagnostics";
import { reloadOnce } from "../utils/reload";
import { recordCrash } from "../utils/storage";

/**
 * Turns an uncaught error into a recorded entry and a screen a child can leave
 * (FR-1, FR-4, FR-6, FR-7).
 *
 * This is the only production module the error-capture track adds that names a
 * browser global: the two events it listens for exist nowhere else, so the
 * listeners are attached here and everything that can be pure — coercion, the
 * ring buffer, the report text — lives in `utils/diagnostics.ts`.
 */
const RECOVER_SCENE_KEY = "Recover";

export interface ErrorCaptureDeps {
  /** Where the two listeners are attached. Defaults to `window`. */
  target?: Pick<Window, "addEventListener">;
  /** The clock. Defaults to `() => new Date()`. */
  now?: () => Date;
  /** Returns the scene currently running, or null before the first boot. */
  runningScene?: () => Phaser.Scene | null;
  /** The reload the first pre-canvas crash performs. Defaults to `reloadOnce`. */
  reload?: () => void;
}

/** One installation per page load; the listeners are never attached twice. */
let installed = false;

/**
 * The scene Phaser is currently showing, or null before the first boot.
 * `main.ts` injects this as `runningScene`, so recovery decides from what is
 * actually on screen rather than from what was started last — and the key it
 * reads comes from that scene, so "what is on screen" has one source of truth.
 */
export function runningScene(game: Phaser.Game): Phaser.Scene | null {
  return game.scene.getScenes(true)[0] ?? null;
}

/**
 * Installs both crash listeners and wires recovery to the running scene.
 *
 * Must be called as soon as the game object exists: a failure while the rest of
 * boot is being wired is exactly the failure nothing else can hear.
 */
export function installErrorCapture(game: Phaser.Game, deps: ErrorCaptureDeps = {}): void {
  if (installed) return;
  installed = true;

  const target = deps.target ?? window;
  const now = deps.now ?? (() => new Date());
  const reload = deps.reload ?? reloadOnce;
  // `main.ts` injects this explicitly, so boot reads as one line; the default
  // asks the same question of the game object it was handed, so a caller that
  // forgets the dep still recovers from what is on screen instead of reloading.
  const currentScene = deps.runningScene ?? (() => runningScene(game));

  const recover = (): void => {
    const scene = currentScene();
    // A crash inside the card must not restart it: the child is already looking
    // at the one thing that can get them out.
    if (scene?.scene.key === RECOVER_SCENE_KEY) return;
    if (scene !== null) {
      // Starting a scene replaces the running one, which is what stops a scene
      // that throws every frame from throwing every frame: it is removed before
      // its next update, and the card takes the display list. Overlaying a card
      // on top would leave the broken scene updating underneath it.
      //
      // Through the scene's own plugin, never `game.scene.start`: Phaser 4's
      // `SceneManager` exposes `getScenes`, `add`, `remove` and `update` and has
      // no `start` at all, while every transition this app makes goes through
      // `scene.scene.start` (`utils/sceneTransitions.ts`). Recovery takes the
      // same route so it behaves like every other scene change in the app —
      // and so it is not a call that typechecks against a loose fake and does
      // nothing in a browser.
      scene.scene.start(RECOVER_SCENE_KEY);
      return;
    }
    // No scene at all means the canvas never came up. There is nothing to draw
    // on, so the only recovery is one guarded reload (FR-7).
    reload();
  };

  /**
   * Recording first, recovery second, and never a throw of our own: an error
   * handler that throws turns one crash into two.
   */
  const capture = (kind: CrashKind, reason: unknown): void => {
    try {
      recordCrash(toCrashEntry(kind, reason, now()));
    } catch {
      // A recorder that throws must still produce the card (FR-4). Recovery is
      // the reason this handler exists, so the catch falls through to it.
    }
    recover();
  };

  const handleError = (event: ErrorEvent | Event): void => {
    // Reading `error`/`message` off a plain Event would be a lie; both shapes
    // reach this listener, and `toCrashEntry` knows how to read either.
    capture("error", event instanceof ErrorEvent ? (event.error ?? event.message) : event);
  };

  const handleRejection = (event: PromiseRejectionEvent): void => {
    capture("rejection", event.reason);
  };

  // No `preventDefault`: Phaser's own error reporting should still reach the
  // console, and a parent with devtools open is the last line of diagnosis.
  target.addEventListener("error", handleError);
  target.addEventListener("unhandledrejection", handleRejection);
}
