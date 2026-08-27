import type { DayActivity, GameId, GameProgress } from "../types";
import { GAME_IDS } from "../types";
import { updateRecentWindow, WINDOW_SIZE } from "./adaptiveLogic";
import { todayKey } from "./playTimeLogic";

/**
 * Pure logic for per-profile learning progress. Each profile tracks, per
 * game: how many sessions were started (plays), how many were completed
 * (wins — every completed session is a win by design), correct/wrong answer
 * taps, the last time the game was played, and a rolling window of recent
 * tap results driving adaptive difficulty. A separate activity list
 * aggregates plays per day (pruned to the last 7 days) for the report's
 * activity strip.
 */

/** Wins required for a game to count as "mastered". */
export const MASTERY_WINS = 3;

/** Number of days kept in the activity strip (today + 6 prior). */
export const ACTIVITY_DAYS = 7;

/** Fresh per-game progress: zeroed stats and no last-played timestamp. */
export function createDefaultProgress(): GameProgress {
  return { plays: 0, wins: 0, correct: 0, wrong: 0, lastPlayedAt: null, recent: [] };
}

/** Fresh progress map: zeroed stats for every game id. */
export function createDefaultProgressMap(): Record<GameId, GameProgress> {
  return Object.fromEntries(GAME_IDS.map((id) => [id, createDefaultProgress()])) as Record<
    GameId,
    GameProgress
  >;
}

/** Backfills a raw progress entry: invalid counts become 0, timestamps must be strings. */
export function normalizeProgress(raw: Partial<GameProgress> | null | undefined): GameProgress {
  const count = (value: unknown): number =>
    typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : 0;
  const stamp = (value: unknown): string | null =>
    typeof value === "string" && value !== "" ? value : null;
  const window = (value: unknown): boolean[] =>
    Array.isArray(value) ? value.filter((tap) => typeof tap === "boolean").slice(-WINDOW_SIZE) : [];
  return {
    plays: count(raw?.plays),
    wins: count(raw?.wins),
    correct: count(raw?.correct),
    wrong: count(raw?.wrong),
    lastPlayedAt: stamp(raw?.lastPlayedAt),
    recent: window(raw?.recent),
  };
}

/** Merges raw saved progress over defaults, backfilling any missing game ids. */
export function normalizeProgressMap(
  raw: Partial<Record<GameId, GameProgress>> | null | undefined,
): Record<GameId, GameProgress> {
  const merged = { ...createDefaultProgressMap(), ...raw };
  return Object.fromEntries(GAME_IDS.map((id) => [id, normalizeProgress(merged[id])])) as Record<
    GameId,
    GameProgress
  >;
}

/** Records a started play: increments plays and stamps the last-played time. */
export function recordPlay(
  progress: Partial<GameProgress> | null | undefined,
  now = new Date(),
): GameProgress {
  const p = normalizeProgress(progress);
  return { ...p, plays: p.plays + 1, lastPlayedAt: now.toISOString() };
}

/**
 * Records a completed session result: accumulates correct/wrong taps and
 * increments wins when the session was a win. Negative counts are ignored.
 * The per-session aggregate is also folded into the rolling recent-tap
 * window (correct taps first) that drives adaptive band shifts.
 */
export function recordResult(
  progress: Partial<GameProgress> | null | undefined,
  result: { correct: number; wrong: number; win: boolean },
): GameProgress {
  const p = normalizeProgress(progress);
  const correct = Math.max(0, result.correct);
  const wrong = Math.max(0, result.wrong);
  return {
    ...p,
    wins: p.wins + (result.win ? 1 : 0),
    correct: p.correct + correct,
    wrong: p.wrong + wrong,
    recent: updateRecentWindow(p.recent, { correct, wrong }),
  };
}

/** Correct-answer ratio (0..1), or null when no taps have been recorded. */
export function getAccuracy(progress: Partial<GameProgress> | null | undefined): number | null {
  const p = normalizeProgress(progress);
  const taps = p.correct + p.wrong;
  if (taps === 0) return null;
  return p.correct / taps;
}

/** Accuracy as a rounded percent label, or an em dash when there are no taps. */
export function formatAccuracyPercent(progress: Partial<GameProgress> | null | undefined): string {
  const accuracy = getAccuracy(progress);
  return accuracy === null ? "—" : `${Math.round(accuracy * 100)}%`;
}

/** True when the game has been completed at least `MASTERY_WINS` times. */
export function isMastered(progress: Partial<GameProgress> | null | undefined): boolean {
  return normalizeProgress(progress).wins >= MASTERY_WINS;
}

/** Adds one play to today's activity entry, creating it when missing. */
export function addActivity(
  activity: DayActivity[] | null | undefined,
  now = new Date(),
): DayActivity[] {
  const day = todayKey(now);
  const existing = (activity ?? []).map((a) => ({
    day: typeof a?.day === "string" ? a.day : "",
    plays: typeof a?.plays === "number" && a.plays > 0 ? a.plays : 0,
  }));
  const todayEntry = existing.find((a) => a.day === day);
  if (todayEntry) {
    return existing.map((a) => (a.day === day ? { ...a, plays: a.plays + 1 } : a));
  }
  return [...existing, { day, plays: 1 }];
}

/** Keeps only the last `ACTIVITY_DAYS` entries (today + 6 prior), sorted by day. */
export function pruneActivity(
  activity: DayActivity[] | null | undefined,
  now = new Date(),
): DayActivity[] {
  const cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (ACTIVITY_DAYS - 1));
  const cutoffKey = todayKey(cutoff);
  return (activity ?? [])
    .filter((a) => typeof a?.day === "string" && a.day >= cutoffKey)
    .map((a) => ({
      day: a.day,
      plays: typeof a?.plays === "number" && a.plays > 0 ? a.plays : 0,
    }))
    .sort((a, b) => a.day.localeCompare(b.day));
}

/**
 * Human-friendly "last played" label: "—" when never played, "Today",
 * "Yesterday", or "N d ago" for older dates (calendar-day based).
 */
export function relativeLastPlayed(
  lastPlayedAt: string | null | undefined,
  now = new Date(),
): string {
  if (typeof lastPlayedAt !== "string" || lastPlayedAt === "") return "—";
  const played = new Date(lastPlayedAt);
  if (Number.isNaN(played.getTime())) return "—";
  const key = todayKey(now);
  const playedKey = todayKey(played);
  const days =
    (Date.UTC(Number(key.slice(0, 4)), Number(key.slice(5, 7)) - 1, Number(key.slice(8, 10))) -
      Date.UTC(
        Number(playedKey.slice(0, 4)),
        Number(playedKey.slice(5, 7)) - 1,
        Number(playedKey.slice(8, 10)),
      )) /
    86_400_000;
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}
