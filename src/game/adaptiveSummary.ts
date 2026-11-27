import type { GameId, GameProgress } from "../types";
import { bandShiftFor, MIN_SAMPLE } from "./adaptiveLogic";
import { GAME_REGISTRY } from "./gameRegistry";
import { normalizeProgressMap } from "./progressLogic";

/**
 * The current adaptive-band spread of one profile, as the Progress Overview
 * prints it. "Movement" here is the present easier / classic / harder mix, not
 * a transition over time: no stored history exists to support a longitudinal
 * claim, so this module never makes one.
 *
 * The inputs are explicit — a progress map and the adaptive switch — so the
 * helper is total and deterministic. It reads neither the clock nor storage,
 * nor the active profile: the caller decides whose progress to hand it. Every
 * stored record goes through the same normaliser the storage layer uses, and
 * a game only counts when its window holds at least MIN_SAMPLE answer taps.
 * Only games that actually adapt are assessed: Robot Path and Fix-It Machine
 * have fixed ladders, so a full window from either cannot place it in a band.
 */

/** The two games with fixed ladders: no band shift ever reaches them. */
const NON_ADAPTIVE_GAME_IDS: ReadonlySet<GameId> = new Set<GameId>([
  "robot-path",
  "fix-it-machine",
]);

/** The four mutually exclusive notes the Overview can print. */
export type AdaptiveSpreadState = "disabled" | "sparse" | "all-classic" | "mixed";

/** The note plus the counts behind it, so the page never recomputes. */
export interface AdaptiveSpread {
  state: AdaptiveSpreadState;
  line: string;
  assessed: number;
  easier: number;
  classic: number;
  harder: number;
}

/** Shown when the parent switch is off: no evidence claim at all. */
export const ADAPTIVE_DISABLED_LINE =
  "Adaptive difficulty is off · enable in Settings to see current bands";

/** Shown when no game has enough answers to place in a band yet. */
export const ADAPTIVE_SPARSE_LINE = "Not enough answers yet to show current bands · keep playing";

/** `n` with its noun in the right number: "1 game", "3 games". */
function games(count: number): string {
  return `${count} ${count === 1 ? "game" : "games"}`;
}

/**
 * Derives the current band spread from one profile's progress.
 *
 * Each adaptive game is classified with `bandShiftFor` (+1 harder, 0 classic,
 * -1 easier) once its rolling window reaches MIN_SAMPLE taps. Games below that
 * floor and the two non-adaptive games are skipped. The returned copy is fixed
 * for each state, so equal arguments always produce an equal line.
 */
export function summariseAdaptiveSpread(
  progress: Partial<Record<GameId, GameProgress>> | null | undefined,
  adaptiveEnabled: boolean,
): AdaptiveSpread {
  if (!adaptiveEnabled) {
    return {
      state: "disabled",
      line: ADAPTIVE_DISABLED_LINE,
      assessed: 0,
      easier: 0,
      classic: 0,
      harder: 0,
    };
  }

  const normalised = normalizeProgressMap(progress);
  let assessed = 0;
  let easier = 0;
  let classic = 0;
  let harder = 0;

  for (const { gameId } of GAME_REGISTRY) {
    if (NON_ADAPTIVE_GAME_IDS.has(gameId)) continue;
    const recent = normalised[gameId].recent;
    if (recent.length < MIN_SAMPLE) continue;
    assessed += 1;
    const shift = bandShiftFor(recent);
    if (shift > 0) harder += 1;
    else if (shift < 0) easier += 1;
    else classic += 1;
  }

  if (assessed === 0) {
    return {
      state: "sparse",
      line: ADAPTIVE_SPARSE_LINE,
      assessed,
      easier,
      classic,
      harder,
    };
  }

  if (easier === 0 && harder === 0) {
    return {
      state: "all-classic",
      line: `Current bands · ${games(assessed)} assessed, all at classic · from recent answers`,
      assessed,
      easier,
      classic,
      harder,
    };
  }

  return {
    state: "mixed",
    line: `Current bands · ${games(assessed)} assessed · ${easier} easier · ${classic} classic · ${harder} harder · from recent answers`,
    assessed,
    easier,
    classic,
    harder,
  };
}
