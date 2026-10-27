import { createPlayTimeIndicator, PlayTimeNudge } from "../../components/PlayTimeIndicator";

/**
 * True where the document exposes a visibility state. Mirrors the guard the
 * HubScene used to carry, so a headless host (no document, or no
 * `visibilityState`) stays inert instead of throwing on the visibility hook.
 */
export function canObserveVisibility(): boolean {
  return typeof document !== "undefined" && typeof document.visibilityState === "string";
}

/**
 * True only where the document reports itself hidden. Built on the same guard
 * as `canObserveVisibility`, so a host with no visibility surface counts as
 * visible and keeps the prewarm active instead of silently disabling it.
 */
export function isDocumentHidden(): boolean {
  return canObserveVisibility() && document.visibilityState === "hidden";
}

/**
 * Engine handles the HubScene owns and passes in. The controller owns the
 * lock flag, the indicator graphics, the nudge, and the visibility hook; the
 * scene owns everything Phaser-bound or stored (grid locks, mascot, prewarm,
 * transitions).
 */
export interface PlayTimeUiDeps {
  /** Scene the indicator and nudge draw into. */
  readonly scene: Phaser.Scene;
  /** Dims and locks the tiles once the daily limit is reached. */
  applyTimeUpLock(): void;
  /** Restores the tiles before a refresh re-reads the lock state. */
  restoreTiles(): void;
  /** Waves the mascot once when the cap is first reached. */
  waveMascot(): void;
  /** Follows a lock change in both directions (no imports while locked). */
  syncPrewarm(): void;
  /** Launches the tile at the nudge's index after the overlay delay. */
  launchTile(tileIndex: number): void;
}

/**
 * Play-time UI: the daily-limit indicator, the pre-game nudge, and the
 * foreground-return re-read. The HubScene keeps only delegation plus the
 * `create()`/`shutdown` lifecycle wiring.
 */
export interface PlayTimeUiController {
  /** True while the active profile's daily play-time limit is reached. */
  isTimeUp(): boolean;
  /** Resets the lock and the nudge for a new visit. */
  beginVisit(): void;
  /** Creates the indicator for the active profile (no-op without a limit). */
  createPlayTimeIndicator(wasTimeUp?: boolean): void;
  /** Rebuilds the indicator and tile lock state after a switch or refresh. */
  refreshPlayTimeState(): void;
  /** Re-reads the budget on foreground return; detaches on shutdown. */
  watchPlayTimeVisibility(): void;
  /** Shows the textless pre-game nudge before launching the tile. */
  showPlayTimeNudge(tileIndex: number): void;
  /** Current nudge; a test-compat read for suites that inspect it via cast. */
  readonly nudge: PlayTimeNudge;
  /** Destroys the indicator graphics for the shutdown hook. */
  destroy(): void;
}

/**
 * Creates the play-time UI controller. All logic is a verbatim move of the
 * HubScene slice: no timing, copy, or motion tweaks, and the reduced-motion
 * behavior stays in the components that own it.
 */
export function createPlayTimeUi(deps: PlayTimeUiDeps): PlayTimeUiController {
  const { scene } = deps;
  let timeUp = false;
  let playTimeGraphics: Phaser.GameObjects.Graphics | undefined;
  let nudge = new PlayTimeNudge();

  /**
   * Creates the play-time indicator for the active profile: a hint arc under
   * the grid while time remains, or a textless moon badge with dimmed, locked
   * tiles once the daily limit is reached. No-op without a limit set.
   *
   * `wasTimeUp` is the lock state before the refresh that called this, so the
   * mascot waves once when the cap is first reached rather than on every
   * foreground return the cap is re-read on. The lock itself is applied
   * unconditionally — the visuals must converge whatever the call site.
   */
  function createIndicator(wasTimeUp = false): void {
    playTimeGraphics =
      createPlayTimeIndicator({
        scene,
        onLimitReached: () => {
          timeUp = true;
          deps.applyTimeUpLock();
          if (!wasTimeUp) {
            deps.waveMascot();
          }
        },
      }) ?? undefined;
  }

  /**
   * Rebuilds the play-time indicator and tile lock state after a profile
   * switch or a parental settings change.
   */
  function refreshPlayTimeState(): void {
    playTimeGraphics?.destroy();
    playTimeGraphics = undefined;
    const wasTimeUp = timeUp;
    if (timeUp) {
      deps.restoreTiles();
      timeUp = false;
    }
    createIndicator(wasTimeUp);
    // The lock can arrive or clear with this refresh, so the prewarm follows
    // it in both directions: no imports while locked, a fresh pass once it
    // clears (FR-2).
    deps.syncPrewarm();
  }

  /**
   * Document-visibility handler: re-reads the budget when the page returns to
   * the foreground and parks the chunk prewarm while it is in the background.
   */
  function handleVisibilityChange(): void {
    if (document.visibilityState === "visible") {
      refreshPlayTimeState();
      return;
    }
    // Background imports buy the child nothing and cost battery, so the pass
    // stops here; the foreground return above re-arms it (FR-2).
    deps.syncPrewarm();
  }

  return {
    isTimeUp: () => timeUp,
    beginVisit: () => {
      timeUp = false;
      nudge = new PlayTimeNudge();
    },
    createPlayTimeIndicator: (wasTimeUp = false) => {
      createIndicator(wasTimeUp);
    },
    refreshPlayTimeState,
    watchPlayTimeVisibility: () => {
      if (!canObserveVisibility()) return;
      document.addEventListener("visibilitychange", handleVisibilityChange);
      scene.events.once("shutdown", () => {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      });
    },
    showPlayTimeNudge: (tileIndex) => {
      nudge.show({ scene, onLaunch: (i) => deps.launchTile(i) }, tileIndex);
    },
    get nudge(): PlayTimeNudge {
      return nudge;
    },
    destroy: () => {
      playTimeGraphics?.destroy();
      playTimeGraphics = undefined;
    },
  };
}
