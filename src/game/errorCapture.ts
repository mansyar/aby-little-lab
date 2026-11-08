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
  /** Returns the key of the scene currently running, or null before the first boot. */
  activeSceneKey?: () => string | null;
  /** The reload the first pre-canvas crash performs. Defaults to `reloadOnce`. */
  reload?: () => void;
}

/** One installation per page load; the listeners are never attached twice. */
let installed = false;

/**
 * The key of the scene Phaser is currently showing, or null before the first
 * boot. `main.ts` injects this as `activeSceneKey`, so recovery decides from
 * what is actually on screen rather than from what was started last.
 */
export function runningSceneKey(game: Phaser.Game): string | null {
  return game.scene.getScenes(true)[0]?.scene.key ?? null;
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

  const recover = (): void => {
    const key = deps.activeSceneKey?.() ?? null;
    // A crash inside the card must not restart it: the child is already looking
    // at the one thing that can get them out.
    if (key === RECOVER_SCENE_KEY) return;
    if (key !== null) {
      // Starting a scene replaces the running one, which is what stops a scene
      // that throws every frame from throwing every frame: it is removed before
      // its next update, and the card takes the display list. Overlaying a card
      // on top would leave the broken scene updating underneath it.
      game.scene.start(RECOVER_SCENE_KEY);
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
