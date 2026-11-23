import type { GameId } from "../types";

/**
 * Last-played stamps for a set of games, injected by the caller.
 *
 * Phase 2 derives this from `getProgress()` (each `GameProgress.lastPlayedAt`).
 * Phase 1 keeps the module pure: it never imports storage, Phaser or localStorage.
 * A missing key, `null`, or an unparsable stamp all mean "never played".
 */
export type Stamps = Readonly<Partial<Record<GameId, string | null>>>;

/**
 * Memory-only record of the games opened during one profile's current app visit.
 * This is never persisted. Every field is readonly and every transition returns
 * a new object, so an old snapshot stays valid and no caller can mutate it.
 */
export interface ReplayVisit {
  readonly profileId: string | null;
  /** Games opened during this visit; inserting the same id twice is a no-op. */
  readonly played: ReadonlySet<GameId>;
  /** Most recently opened game, or null at the start of a visit. */
  readonly lastPlayed: GameId | null;
  /** Most recently suggested game, or null before the first suggestion. */
  readonly lastSuggested: GameId | null;
}

/** A selector decision, with the forced-repeat case made observable. */
export interface Suggestion {
  readonly gameId: GameId;
  readonly forcedRepeat: boolean;
}

/**
 * Optional extra exclusions. Phase 2 calls the selector a second time with the
 * first target excluded to pick a distinct idle-wiggle target, reusing these
 * rules rather than duplicating them.
 */
export interface SelectOptions {
  readonly exclude?: readonly GameId[];
}

/** Start a fresh, empty visit (optionally bound to a profile id). */
export function createReplayVisit(profileId?: string): ReplayVisit {
  return {
    profileId: profileId ?? null,
    played: new Set<GameId>(),
    lastPlayed: null,
    lastSuggested: null,
  };
}

/**
 * Discard the current visit and start a fresh one. With no explicit id the new
 * visit keeps the outgoing profile's id; a profile switch passes the new id.
 * Nothing here reads or writes storage — a later phase simply drops the old
 * state object.
 */
export function setReplayVisitProfile(state: ReplayVisit, profileId?: string): ReplayVisit {
  return createReplayVisit(profileId ?? state.profileId ?? undefined);
}

/** Record a game as played this visit and mark it as the just-played game. */
export function recordVisitPlay(state: ReplayVisit, gameId: GameId): ReplayVisit {
  const played = new Set(state.played);
  played.add(gameId);
  return { ...state, played, lastPlayed: gameId };
}

/** Record the game the suggestion cue pointed at. */
export function recordVisitSuggestion(state: ReplayVisit, gameId: GameId): ReplayVisit {
  return { ...state, lastSuggested: gameId };
}

/** True when `gameId` was opened earlier in this visit. */
export function hasPlayedThisVisit(state: ReplayVisit, gameId: GameId): boolean {
  return state.played.has(gameId);
}

/** Read-only view of the games opened this visit. */
export function getVisitPlayed(state: ReplayVisit): ReadonlySet<GameId> {
  return state.played;
}

/**
 * Parse a stamp into a comparable number. Never-played sorts first, so it maps
 * to negative infinity, as does an absent or invalid value.
 */
function stampRank(progress: Stamps, gameId: GameId): number {
  const stamp = progress[gameId];
  if (stamp == null) return Number.NEGATIVE_INFINITY;
  const parsed = Date.parse(stamp);
  return Number.isNaN(parsed) ? Number.NEGATIVE_INFINITY : parsed;
}

/**
 * Choose a suggestion for one play.
 *
 * Ordering (deterministic, NFR-1 / FR-3):
 *   1. games not yet played this visit first;
 *   2. then by `lastPlayedAt` ascending, with never-played first;
 *   3. then by the position in `games` — callers pass GAME_REGISTRY order.
 *
 * The immediately just-played and just-suggested games (and any `options.exclude`
 * ids) are removed first. If that empties the pool, the whole pool is allowed back
 * and `forcedRepeat` is true; it is also true when only one game exists at all.
 * The caller's progress map is never mutated — only an explicit later call to
 * `recordVisitSuggestion` advances the visit state.
 */
export function selectSuggestion(
  state: ReplayVisit,
  games: readonly GameId[],
  progress: Stamps,
  options: SelectOptions = {},
): Suggestion {
  if (games.length === 0) {
    throw new Error("selectSuggestion needs at least one game");
  }

  const excluded = new Set<GameId>();
  if (state.lastPlayed !== null) excluded.add(state.lastPlayed);
  if (state.lastSuggested !== null) excluded.add(state.lastSuggested);
  for (const gameId of options.exclude ?? []) excluded.add(gameId);

  let candidates = games.filter((gameId) => !excluded.has(gameId));
  const exhausted = candidates.length === 0;
  if (exhausted) {
    // Every game was just played or suggested: keep the cue alive by allowing
    // the pool back in, and surface the repeat through `forcedRepeat`.
    candidates = games.slice();
  }

  const order = new Map<GameId, number>();
  for (let index = 0; index < games.length; index += 1) {
    order.set(games[index], index);
  }

  candidates.sort((left, right) => {
    const leftPlayed = state.played.has(left) ? 1 : 0;
    const rightPlayed = state.played.has(right) ? 1 : 0;
    if (leftPlayed !== rightPlayed) return leftPlayed - rightPlayed;

    const leftStamp = stampRank(progress, left);
    const rightStamp = stampRank(progress, right);
    if (leftStamp !== rightStamp) return leftStamp - rightStamp;

    return (order.get(left) ?? 0) - (order.get(right) ?? 0);
  });

  const gameId = candidates[0];
  return {
    gameId,
    forcedRepeat: exhausted || games.length === 1 || excluded.has(gameId),
  };
}
