import { normalizeNarrationPace } from "../game/narrationPace";
import type {
  DayActivity,
  GameId,
  GameProgress,
  PlayTime,
  Profile,
  ProfileInsights,
  StickerData,
} from "../types";
import { GAME_IDS } from "../types";

/**
 * Field-by-field best-of merging for two saves of the same child. Split out of
 * `backupFormat.ts` so the format module stays small; every helper is pure and
 * keeps the exact best-of (never additive) semantics the backup tests pin.
 */

/**
 * The earlier of two ISO timestamps, treating a missing one as "not there".
 * ISO strings sort chronologically, so the comparison is a plain string one.
 */
function earlierStamp(left: string | null, right: string | null): string | null {
  if (left === null) return right;
  if (right === null) return left;
  return left <= right ? left : right;
}

/** The later of two ISO timestamps, treating a missing one as "not there". */
function laterStamp(left: string | null, right: string | null): string | null {
  if (left === null) return right;
  if (right === null) return left;
  return left >= right ? left : right;
}

/** The earlier of two stamps that are both known present. */
function earlierText(left: string, right: string): string {
  return left <= right ? left : right;
}

/** The later of two stamps that are both known present. */
function laterText(left: string, right: string): string {
  return left >= right ? left : right;
}

/**
 * One sticker across two saves: earned if either side earned it, stamped at the
 * first time it was earned. The union is why a second import of the same file
 * changes nothing — nothing is additive.
 */
function mergeSticker(local: StickerData, incoming: StickerData): StickerData {
  if (!local.earned && !incoming.earned) return { earned: false, earnedAt: null };
  return {
    earned: true,
    earnedAt: earlierStamp(
      local.earned ? local.earnedAt : null,
      incoming.earned ? incoming.earnedAt : null,
    ),
  };
}

/** One game's stats: each counter takes the higher, the stamp takes the later. */
function mergeProgress(local: GameProgress, incoming: GameProgress): GameProgress {
  return {
    plays: Math.max(local.plays, incoming.plays),
    wins: Math.max(local.wins, incoming.wins),
    correct: Math.max(local.correct, incoming.correct),
    wrong: Math.max(local.wrong, incoming.wrong),
    probes: Math.max(local.probes, incoming.probes),
    lastPlayedAt: laterStamp(local.lastPlayedAt, incoming.lastPlayedAt),
    // The longer window describes more play; on a tie the device's own is kept.
    recent: incoming.recent.length > local.recent.length ? incoming.recent : local.recent,
  };
}

/**
 * Play time across two saves. The limit is the device's policy and stays local;
 * the usage belongs to whichever side last recorded it, so the later day wins
 * outright and only the same day is settled by the larger number.
 */
function mergePlayTime(local: PlayTime, incoming: PlayTime): PlayTime {
  const localDay = local.lastUsedDate;
  const incomingDay = incoming.lastUsedDate;
  const usedMinutes =
    localDay === incomingDay
      ? Math.max(local.usedMinutes, incoming.usedMinutes)
      : incomingDay > localDay
        ? incoming.usedMinutes
        : local.usedMinutes;
  return {
    limitMinutes: local.limitMinutes,
    usedMinutes,
    lastUsedDate: laterText(localDay, incomingDay),
  };
}

/** Insights: each count takes the higher, each remembered day takes the later. */
function mergeInsights(local: ProfileInsights, incoming: ProfileInsights): ProfileInsights {
  return {
    currentStreakDays: Math.max(local.currentStreakDays, incoming.currentStreakDays),
    bestStreakDays: Math.max(local.bestStreakDays, incoming.bestStreakDays),
    lastStreakDay: laterStamp(local.lastStreakDay, incoming.lastStreakDay),
    limitHitDays: Math.max(local.limitHitDays, incoming.limitHitDays),
    lastLimitHitDay: laterStamp(local.lastLimitHitDay, incoming.lastLimitHitDay),
  };
}

/**
 * The 7-day activity strip: the union of both sides' days, each day keeping the
 * higher play count, in day order. Best-of rather than additive, so importing
 * the same file twice cannot inflate a bar.
 */
function mergeActivity(local: DayActivity[], incoming: DayActivity[]): DayActivity[] {
  const playsByDay = new Map<string, number>();
  for (const entry of [...local, ...incoming]) {
    playsByDay.set(entry.day, Math.max(playsByDay.get(entry.day) ?? 0, entry.plays));
  }
  return [...playsByDay.entries()]
    .map(([day, plays]) => ({ day, plays }))
    .sort((left, right) => left.day.localeCompare(right.day));
}

/**
 * Two saves of the same child, field by field. The face, the daily limit and
 * the settings stay on this device; everything the child earned is the better
 * of the two, so a restore cannot take a sticker or a count away.
 */
export function mergeProfiles(local: Profile, incoming: Profile): Profile {
  const stickers = Object.fromEntries(
    GAME_IDS.map((gameId) => [
      gameId,
      mergeSticker(local.stickers[gameId], incoming.stickers[gameId]),
    ]),
  ) as Record<GameId, StickerData>;
  const progress = Object.fromEntries(
    GAME_IDS.map((gameId) => [
      gameId,
      mergeProgress(local.progress[gameId], incoming.progress[gameId]),
    ]),
  ) as Record<GameId, GameProgress>;
  return {
    id: local.id,
    avatarId: local.avatarId,
    createdAt: earlierText(local.createdAt, incoming.createdAt),
    stickers,
    playTime: mergePlayTime(local.playTime, incoming.playTime),
    progress,
    activity: mergeActivity(local.activity, incoming.activity),
    insights: mergeInsights(local.insights, incoming.insights),
    // Like the face and the daily limit, pace is a device setting: merging
    // another device's progress must not silently change how this one reads.
    narrationPace: normalizeNarrationPace(local.narrationPace),
  };
}
