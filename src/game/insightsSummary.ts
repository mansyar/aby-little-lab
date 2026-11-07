import type { GameId, Profile, ProfileInsights } from "../types";
import { GAME_REGISTRY } from "./gameRegistry";
import { normalizeInsights } from "./insightsLogic";
import { normalizePlayTime, todayKey } from "./playTimeLogic";
import { ACTIVITY_DAYS, normalizeProgressMap, pruneActivity } from "./progressLogic";

/**
 * Turns a profile and a moment into the three statements the Progress
 * overlay's Overview page prints, plus the numbers behind each one.
 *
 * Everything here is derived from fields that already exist on the profile:
 * nothing is stored, nothing is read from the device, and the clock is an
 * argument rather than a call to `new Date()`. That is what makes the summary
 * total — every ratio guards its denominator, every stored record is passed
 * through the same normaliser the storage layer uses, and a malformed profile
 * still yields three readable sentences.
 */

/**
 * Answer taps a game needs before it can be named strongest or hardest.
 *
 * The adaptive window settles after `MIN_SAMPLE` (6) taps, so a game the
 * difficulty has just started to follow is still moving. Ten taps is one
 * round's worth above that floor: enough that a single slip cannot invert the
 * ranking, few enough that a preschooler reaches it within a session or two.
 */
export const MIN_SUMMARY_TAPS = 10;

/** One game's standing in the accuracy comparison. */
export interface GameSummary {
  gameId: GameId;
  /** The game's tile label, read from `GAME_REGISTRY`. */
  label: string;
  /** Correct-answer share, rounded to a whole percent (0..100). */
  accuracyPercent: number;
  /** Answer taps behind the percentage (`correct + wrong`). */
  taps: number;
}

/** The three statements and the numbers each was built from. */
export interface InsightsSummary {
  /** The three statements, in the order the page prints them. */
  lines: readonly [string, string, string];
  /** The numbers behind each line, so the page never recomputes. */
  activity: {
    daysPlayed: number;
    distinctGames: number;
    completions: number;
    /** Completed sessions as a share of started ones, or null with no plays. */
    completionPercent: number | null;
  };
  accuracy: {
    overallPercent: number | null;
    strongest: GameSummary | null;
    hardest: GameSummary | null;
  };
  routine: {
    streakDays: number;
    bestStreakDays: number;
    limitHitDays: number;
    hasLimit: boolean;
  };
}

/**
 * Game labels by id, derived once from the registry so no second table of game
 * names exists. The map is a lookup over `GAME_REGISTRY`, not a copy of it.
 */
const LABELS: ReadonlyMap<GameId, string> = new Map(
  GAME_REGISTRY.map(({ gameId, label }) => [gameId, label]),
);

/** The registry order index of a game, used as the last tie-break. */
const REGISTRY_ORDER: ReadonlyMap<GameId, number> = new Map(
  GAME_REGISTRY.map(({ gameId }, index) => [gameId, index]),
);

/** `n` with its noun in the right number: "1 day", "3 days". */
function plural(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

/**
 * The local day key `ACTIVITY_DAYS - 1` days before `now`: the first day the
 * 7-day strip covers. Stepping the calendar date, rather than subtracting
 * hours, keeps a daylight-saving change from shortening the window.
 */
function weekStartKey(now: Date): string {
  return todayKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - (ACTIVITY_DAYS - 1)));
}

/**
 * The local day key of a stored play timestamp, or null when it is missing or
 * unparseable. A timestamp is the only shape `lastPlayedAt` ever stores, so an
 * unreadable one is "no play", never a thrown error.
 */
function playedDayKey(lastPlayedAt: string | null): string | null {
  if (lastPlayedAt === null) return null;
  const played = new Date(lastPlayedAt);
  return Number.isNaN(played.getTime()) ? null : todayKey(played);
}

/** A whole-percent share, guarded so a zero denominator is null and never NaN. */
function percentOf(part: number, whole: number): number | null {
  return whole <= 0 ? null : Math.round((part / whole) * 100);
}

/** The accuracy line: what the answers say, then what they are not yet enough for. */
function accuracyLine(accuracy: InsightsSummary["accuracy"]): string {
  if (accuracy.overallPercent === null) return "Start playing to see how it is going";
  const head = `${accuracy.overallPercent}% of answers correct`;
  const { strongest, hardest } = accuracy;
  if (strongest === null || hardest === null) {
    return `${head} · not enough play yet to name a strongest game`;
  }
  // One game alone (or a dead heat its tap count settles) has no second
  // endpoint to compare against; naming it "hardest" as well would be a
  // judgement the data does not make.
  if (strongest.gameId === hardest.gameId) {
    return `${head} · ${strongest.label} has the most answers so far (${strongest.accuracyPercent}%)`;
  }
  return `${head} · strongest ${strongest.label} (${strongest.accuracyPercent}%) · hardest ${hardest.label} (${hardest.accuracyPercent}%)`;
}

/** The activity line: this week's reach, then lifetime completions. */
function activityLine(activity: InsightsSummary["activity"]): string {
  const reach =
    activity.distinctGames === 0
      ? "No games yet this week"
      : `${activity.distinctGames} of ${GAME_REGISTRY.length} games · ${plural(activity.daysPlayed, "day", "days")} this week`;
  // A completion count with no share is only possible for a malformed record
  // (`wins` without `plays`), where there is no denominator to divide by; the
  // sentence still has to read, so the share is simply left off.
  const completions =
    activity.completions === 0
      ? "nothing completed yet"
      : activity.completionPercent === null
        ? `${plural(activity.completions, "completion", "completions")} in all`
        : `${plural(activity.completions, "completion", "completions")} in all (${activity.completionPercent}% of started games finished)`;
  return `${reach} · ${completions}`;
}

/** The routine line: the streak as stored, then the cap setting or its history. */
function routineLine(routine: InsightsSummary["routine"]): string {
  const streak =
    routine.streakDays > 0
      ? `${plural(routine.streakDays, "day", "days")} in a row · best ${plural(routine.bestStreakDays, "day", "days")}`
      : routine.bestStreakDays > 0
        ? `No current streak · best ${plural(routine.bestStreakDays, "day", "days")}`
        : "No streak yet";
  // With no limit set, cap-days are history rather than a reprimand, so the
  // line names the setting the family chose instead of printing a zero.
  const cap = !routine.hasLimit
    ? "no daily limit set"
    : routine.limitHitDays > 0
      ? `cap reached on ${plural(routine.limitHitDays, "day", "days")}`
      : "cap not reached yet";
  return `${streak} · ${cap}`;
}

/**
 * Sums a profile into the Overview's three statements.
 *
 * "This week" is the same window the 7-day strip draws — today and the six
 * days before it — compared by local day key, so the two surfaces can never
 * disagree about which plays count. The day count is read from the same
 * activity entries the strip draws, because a game's `lastPlayedAt` holds only
 * its latest play: one game played on three days would otherwise count as one
 * day while the strip beneath the sentence drew three bars. Lifetime
 * completions are every game's `wins` summed, whether or not the game was
 * played this week.
 */
export function summariseInsights(profile: Profile, now: Date = new Date()): InsightsSummary {
  const progress = normalizeProgressMap(profile.progress);
  const insights: ProfileInsights = normalizeInsights(profile.insights);
  const limitMinutes = normalizePlayTime(profile.playTime, now).limitMinutes;
  const weekStart = weekStartKey(now);
  const today = todayKey(now);

  const daysPlayed = pruneActivity(profile.activity, now).filter(
    (entry) => entry.plays > 0 && entry.day >= weekStart && entry.day <= today,
  ).length;

  let distinctGames = 0;
  let completions = 0;
  let plays = 0;
  let correct = 0;
  let wrong = 0;
  const ranked: Array<{ summary: GameSummary; ratio: number }> = [];

  for (const { gameId } of GAME_REGISTRY) {
    const game = progress[gameId];
    completions += game.wins;
    plays += game.plays;
    correct += game.correct;
    wrong += game.wrong;

    // `distinctGames` stays on the last-played stamp, which is what "distinct
    // games played this week" means: the day count above answers a different
    // question and may be larger than this one.
    const playedDay = playedDayKey(game.lastPlayedAt);
    if (playedDay !== null && playedDay >= weekStart) {
      distinctGames += 1;
    }

    const taps = game.correct + game.wrong;
    // The floor is on taps, not on plays: a game can be opened once and answer
    // far more questions than a game opened ten times and abandoned at the
    // first round.
    if (taps >= MIN_SUMMARY_TAPS) {
      ranked.push({
        summary: {
          gameId,
          label: LABELS.get(gameId) ?? gameId,
          accuracyPercent: Math.round((game.correct / taps) * 100),
          taps,
        },
        ratio: game.correct / taps,
      });
    }
  }

  /**
   * The first game in `direction` order: highest accuracy for strongest,
   * lowest for hardest. Ties go to the game with more taps (a firmer reading),
   * then to registry order, so the same profile always names the same game.
   */
  const pick = (direction: 1 | -1): GameSummary | null => {
    let best: { summary: GameSummary; ratio: number } | null = null;
    for (const candidate of ranked) {
      if (best === null) {
        best = candidate;
        continue;
      }
      const byAccuracy = (candidate.ratio - best.ratio) * direction;
      const byTaps = candidate.summary.taps - best.summary.taps;
      const wins =
        byAccuracy > 0 ||
        (byAccuracy === 0 && byTaps > 0) ||
        (byAccuracy === 0 &&
          byTaps === 0 &&
          (REGISTRY_ORDER.get(candidate.summary.gameId) ?? 0) <
            (REGISTRY_ORDER.get(best.summary.gameId) ?? 0));
      if (wins) best = candidate;
    }
    return best === null ? null : best.summary;
  };

  const activity: InsightsSummary["activity"] = {
    daysPlayed,
    distinctGames,
    completions,
    // `wins` and `plays` are independent counters, so a malformed record can
    // report more completions than starts; the share is clamped rather than
    // printed above 100%.
    completionPercent: percentOf(Math.min(completions, plays), plays),
  };

  const answerTaps = correct + wrong;
  const accuracy: InsightsSummary["accuracy"] = {
    overallPercent: percentOf(correct, answerTaps),
    strongest: pick(1),
    hardest: pick(-1),
  };

  const routine: InsightsSummary["routine"] = {
    streakDays: insights.currentStreakDays,
    bestStreakDays: insights.bestStreakDays,
    limitHitDays: insights.limitHitDays,
    hasLimit: limitMinutes !== null,
  };

  return {
    lines: [activityLine(activity), accuracyLine(accuracy), routineLine(routine)],
    activity,
    accuracy,
    routine,
  };
}
