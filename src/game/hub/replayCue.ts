import type Phaser from "phaser";
import type { GameId, GameProgress } from "../../types";
import {
  createReplayVisit,
  type ReplayVisit,
  recordVisitPlay,
  recordVisitSuggestion,
  type Stamps,
  selectSuggestion,
  setReplayVisitProfile,
} from "../replayVariety";

/** One on-screen tile paired with the game its tap launches. */
export interface VisibleGameEntry {
  readonly gameId: GameId;
  readonly target: Phaser.GameObjects.Rectangle;
}

/** Injected inputs: storage and the board are owned by the scene, not this controller. */
export interface ReplayCueDeps {
  readonly scene: Phaser.Scene;
  /** Visible tiles in draw order; read lazily so page flips and filters count. */
  getVisibleGames(): readonly VisibleGameEntry[];
  getProgress(): Readonly<Record<GameId, GameProgress>>;
  /** Earned games for the active profile, in registry order. */
  getEarnedGames(): readonly GameId[];
  /** Publishes this visit's shelf spotlight target to the grid. */
  setSpotlight(gameId: GameId | null | undefined, slotIndex: number): void;
  /** The existing storage path, called only after a game actually opens. */
  recordGamePlay(gameId: GameId): void;
}

export interface ReplayCueController {
  /** Starts an empty visit and advances that profile's shelf spotlight cursor. */
  prepareVisit(profileId?: string): void;
  /** Points the suggestion cue at a game once the board exists. */
  beginVisit(): void;
  /** Discards the outgoing visit and re-derives both cues for the new profile. */
  resetForProfile(profileId: string): void;
  /** Records a play through storage and in the in-memory visit. */
  recordPlay(gameId: GameId): void;
  /** Selector-driven wiggle targets, distinct from each other and from recent games. */
  pickAttractTargets(count: number): readonly Phaser.GameObjects.Rectangle[];
  readonly visit: ReplayVisit;
  readonly suggestion: GameId | null;
  readonly ring: Phaser.GameObjects.Graphics | undefined;
  /** Destroys the cue object; call on scene shutdown. */
  destroy(): void;
}

/** Outline radius/width/colour of the textless suggestion ring. */
export const SUGGESTION_RING_RADIUS = 70;
export const SUGGESTION_RING_WIDTH = 4;
export const SUGGESTION_RING_COLOR = 0x2b6cb0;

/**
 * Memory-only shelf cursors, one per profile. Deliberately separate from the
 * per-visit state below: a visit reset starts a fresh suggestion session, but
 * the earned-sticker spotlight keeps advancing across Hub visits.
 */
const spotlightCursors = new Map<string, number>();

/** Builds the selector's `Stamps` view from stored per-game progress. */
function stampsOf(progress: Readonly<Record<GameId, GameProgress>>): Stamps {
  const stamps: Partial<Record<GameId, string | null>> = {};
  for (const gameId of Object.keys(progress) as GameId[]) {
    stamps[gameId] = progress[gameId].lastPlayedAt;
  }
  return stamps;
}

/**
 * Owns the memory-only replay visit, the textless suggestion ring, and the
 * selector-driven idle targets. Nothing here is persisted and the ring is
 * static in every motion mode (no tween, no input handler), so reduced motion
 * needs no special case and the tile tap path stays the only launch path.
 */
export function createReplayCue(deps: ReplayCueDeps): ReplayCueController {
  let visit = createReplayVisit();
  let suggestion: GameId | null = null;
  let ring: Phaser.GameObjects.Graphics | undefined;

  function clearRing(): void {
    ring?.destroy();
    ring = undefined;
  }

  function showCue(gameId: GameId): void {
    const visible = deps.getVisibleGames();
    const entry = visible.find((candidate) => candidate.gameId === gameId);
    if (!entry) {
      clearRing();
      return;
    }
    clearRing();
    ring = deps.scene.add.graphics();
    ring.lineStyle(SUGGESTION_RING_WIDTH, SUGGESTION_RING_COLOR, 0.9);
    ring.strokeCircle(entry.target.x, entry.target.y, SUGGESTION_RING_RADIUS);
    ring.setDepth(2);
  }

  /** Advances this profile's earned-sticker cursor and publishes the target. */
  function deriveSpotlight(): void {
    const profileId = visit.profileId ?? "default";
    const earned = deps.getEarnedGames();
    if (earned.length === 0) {
      deps.setSpotlight(null, 0);
      return;
    }
    const next = ((spotlightCursors.get(profileId) ?? -1) + 1) % earned.length;
    spotlightCursors.set(profileId, next);
    deps.setSpotlight(earned[next], 0);
  }

  function deriveSuggestion(): void {
    const visible = deps.getVisibleGames();
    if (visible.length === 0) {
      clearRing();
      suggestion = null;
      return;
    }
    const games = visible.map((entry) => entry.gameId);
    const decision = selectSuggestion(visit, games, stampsOf(deps.getProgress()));
    visit = recordVisitSuggestion(visit, decision.gameId);
    suggestion = decision.gameId;
    showCue(decision.gameId);
  }

  return {
    prepareVisit(profileId) {
      visit = createReplayVisit(profileId);
      deriveSpotlight();
    },
    beginVisit() {
      deriveSuggestion();
    },
    resetForProfile(profileId) {
      visit = setReplayVisitProfile(visit, profileId);
      deriveSpotlight();
      deriveSuggestion();
    },
    recordPlay(gameId) {
      visit = recordVisitPlay(visit, gameId);
      deps.recordGamePlay(gameId);
    },
    pickAttractTargets(count) {
      const visible = deps.getVisibleGames();
      if (visible.length === 0 || count <= 0) return [];
      const games = visible.map((entry) => entry.gameId);
      const progress = stampsOf(deps.getProgress());
      const excluded: GameId[] = [];
      const picked: Phaser.GameObjects.Rectangle[] = [];
      for (let index = 0; index < Math.min(count, visible.length); index += 1) {
        const decision = selectSuggestion(visit, games, progress, { exclude: excluded });
        const entry = visible.find((candidate) => candidate.gameId === decision.gameId);
        if (!entry || picked.includes(entry.target)) break;
        picked.push(entry.target);
        excluded.push(decision.gameId);
      }
      return picked;
    },
    get visit() {
      return visit;
    },
    get suggestion() {
      return suggestion;
    },
    get ring() {
      return ring;
    },
    destroy() {
      clearRing();
    },
  };
}
