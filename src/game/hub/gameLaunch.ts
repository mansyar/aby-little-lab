import type { GameId, PlayTime } from "../../types";
import { isNearLimit } from "../playTimeLogic";

/**
 * Tile identity the launch flow needs: the scene key to load and the game id
 * to record once the game opens. Structural so tests pass plain fakes.
 */
export interface GameLaunchTile {
  readonly sceneKey: string;
  readonly gameId: GameId;
}

/** Tile anchor for the retry cue; absent when the tap carried no tile. */
export interface GameLaunchAnchor {
  readonly x: number;
  readonly y: number;
}

/**
 * Retry-cue surface the launch flow shows on a failed load. The structural
 * subset of `GameLoadCue` the flow touches, so tests pass fakes.
 */
export interface GameLaunchCue {
  show(deps: { x: number; y: number; onRetry: () => void }): void;
  isActive(): boolean;
  destroy(): void;
}

/**
 * Engine handles the HubScene owns and passes in. The launcher owns the flow
 * logic (single-flight, visit token, retry cue); the scene owns everything
 * Phaser-bound or stored (loads, transitions, cue construction, audio unlock,
 * prewarm, sessions).
 */
export interface GameLaunchDeps {
  readonly tiles: readonly GameLaunchTile[];
  loadScene(sceneKey: string): Promise<boolean>;
  cancelPrewarm(): void;
  syncPrewarm(): void;
  isTimeUp(): boolean;
  setNavLocked(locked: boolean): void;
  startSession(profileId: string): void;
  recordPlay(gameId: GameId): void;
  getActiveProfileId(): string;
  getPlayTime(): PlayTime;
  transition(sceneKey: string): void;
  showNudge(tileIndex: number): void;
  createCue(): GameLaunchCue;
  getFallbackCenter(): { x: number; y: number };
  startAudio(): void;
}

/**
 * Game-launch flow: tile activation, chunk load, and the retry cue. The HubScene
 * keeps only delegation plus a `loadCue` compat accessor; this controller owns
 * the single-flight flag, the visit token, and the cue.
 */
export interface GameLaunchController {
  activateTile(tileIndex: number, tile?: GameLaunchAnchor): void;
  openGame(tileIndex: number, tile?: GameLaunchAnchor): Promise<void>;
  showLoadCue(tileIndex: number, tile?: GameLaunchAnchor): void;
  hideLoadCue(): void;
  shouldNudge(): boolean;
  isLaunching(): boolean;
  /** Starts a visit: bumps the token, drops the in-flight flag, destroys the cue. */
  beginVisit(): void;
  /** Ends a visit: bumps the token and destroys the cue (flag stays set). */
  endVisit(): void;
  readonly cue: GameLaunchCue | undefined;
}

/**
 * Creates the launch-flow controller. Every side effect belongs to a game that
 * actually opened, so the play session, the game-play record, and the play-time
 * nudge all sit behind the resolved load — a tap whose chunk never arrives
 * charges neither time nor a play. One launch runs at a time: a launch already
 * in flight refuses a second one, and the resolution only acts on the visit
 * that started it (NFR-6).
 */
export function createGameLaunch(deps: GameLaunchDeps): GameLaunchController {
  let launching = false;
  /**
   * Identifies the current visit. `beginVisit` and `endVisit` each bump it,
   * and a launch compares the value it captured before its await with the
   * value it finds after it.
   */
  let visitToken = 0;
  let cue: GameLaunchCue | undefined;

  const hideLoadCue = (): void => {
    cue?.destroy();
    cue = undefined;
  };

  const openGame = async (tileIndex: number, tile?: GameLaunchAnchor): Promise<void> => {
    if (launching) return;
    // The tap always wins: pending prewarm work stops before the load is
    // awaited, so the tap's own fetch is never queued behind an idle import.
    deps.cancelPrewarm();
    const visit = visitToken;
    launching = true;
    const loaded = await deps.loadScene(deps.tiles[tileIndex].sceneKey);
    // The Hub can go away mid-load, so the resolution only acts on the visit
    // that started it: acting on any other would start a transition on a dead
    // scene, or hang a cue over a screen nobody sees.
    if (visit !== visitToken) return;
    // The cap outranks a retry: the grid checks time-up when a tile is tapped,
    // but a cue outlives that moment, so it is checked again before any charge.
    if (deps.isTimeUp()) {
      hideLoadCue();
      launching = false;
      deps.setNavLocked(false);
      return;
    }
    if (!loaded) {
      // Nothing opened, so the grid gets its tap lock back: one dead chunk must
      // not take every other tile with it. The launch itself is over, and the
      // idle pass may resume behind the retry cue.
      launching = false;
      deps.setNavLocked(false);
      showLoadCue(tileIndex, tile);
      deps.syncPrewarm();
      return;
    }
    // Navigating away now, so the in-flight flag stays set until shutdown.
    hideLoadCue();
    deps.startSession(deps.getActiveProfileId());
    deps.recordPlay(deps.tiles[tileIndex].gameId);
    if (shouldNudge()) {
      deps.showNudge(tileIndex);
    } else {
      deps.transition(deps.tiles[tileIndex].sceneKey);
    }
  };

  const showLoadCue = (tileIndex: number, tile?: GameLaunchAnchor): void => {
    cue ??= deps.createCue();
    const fallback = deps.getFallbackCenter();
    cue.show({
      x: tile?.x ?? fallback.x,
      y: tile?.y ?? fallback.y,
      onRetry: () => {
        // The retry is a tap on a live grid, so it takes the same tap lock a
        // tile tap does. Without it a second tile can start a parallel load and
        // charge a game that never opens.
        deps.setNavLocked(true);
        // Drop the cue before retrying so a success cannot leave it on screen.
        hideLoadCue();
        void openGame(tileIndex, tile);
      },
    });
  };

  const shouldNudge = (): boolean => isNearLimit(deps.getPlayTime());

  return {
    activateTile(tileIndex: number, tile?: GameLaunchAnchor): void {
      // The audio unlock stays on the gesture that triggered it, even when a
      // launch already in flight refuses the tap; everything that belongs to a
      // started game waits for the load (see `openGame`).
      deps.startAudio();
      void openGame(tileIndex, tile);
    },
    openGame,
    showLoadCue,
    hideLoadCue,
    shouldNudge,
    isLaunching: () => launching,
    beginVisit(): void {
      visitToken += 1;
      launching = false;
      hideLoadCue();
    },
    endVisit(): void {
      visitToken += 1;
      hideLoadCue();
    },
    get cue(): GameLaunchCue | undefined {
      return cue;
    },
  };
}
