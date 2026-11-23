import type { BandShift } from "../game/adaptiveLogic";
import { bandShiftFor } from "../game/adaptiveLogic";
import { advanceStreak, normalizeInsights } from "../game/insightsLogic";
import {
  addPlayTime,
  normalizePlayTime,
  setLimit,
  setPlaySessionSink,
  todayKey,
} from "../game/playTimeLogic";
import {
  addActivity,
  normalizeProgressMap,
  pruneActivity,
  recordPlay,
  recordResult,
  recordTaps,
} from "../game/progressLogic";
import type { GameId, GameProgress, PlayTime } from "../types";
import { ensureV2, mutate } from "./storageEngine";
import { getSettings } from "./storageProfiles";

/** Normalized play time for the active profile (or the profile with the given id). */
export function getPlayTime(profileId?: string): PlayTime {
  const v2 = ensureV2();
  const id = profileId ?? v2.activeProfileId;
  const profile = v2.profiles.find((p) => p.id === id) ?? v2.profiles[0];
  return normalizePlayTime(profile.playTime);
}

/** Sets (or clears with null) a profile's daily play-time limit. */
export function setPlayTimeLimit(profileId: string, limitMinutes: number | null): void {
  mutate((v2) => ({
    ...v2,
    profiles: v2.profiles.map((p) =>
      p.id === profileId ? { ...p, playTime: setLimit(p.playTime, limitMinutes) } : p,
    ),
  }));
}

/** Adds minutes to a profile's usage for today. */
export function recordPlayTime(profileId: string, minutes: number): void {
  mutate((v2) => ({
    ...v2,
    profiles: v2.profiles.map((p) =>
      p.id === profileId ? { ...p, playTime: addPlayTime(p.playTime, minutes) } : p,
    ),
  }));
}

/** Records a started play on the ACTIVE profile: plays++, last-played stamp, today's activity. */
export function recordGamePlay(gameId: GameId): void {
  mutate((v2) => {
    const now = new Date();
    return {
      ...v2,
      profiles: v2.profiles.map((p) =>
        p.id === v2.activeProfileId
          ? {
              ...p,
              progress: {
                ...p.progress,
                [gameId]: recordPlay(p.progress[gameId], now),
              },
              activity: pruneActivity(addActivity(p.activity, now), now),
            }
          : p,
      ),
    };
  });
}

/**
 * Records a completed session on the ACTIVE profile: win + correct/wrong taps,
 * and the day's streak advance. Folded into the one `mutate` so a completion is
 * still one write (NFR-2), and the streak advances at most once per local day
 * because `advanceStreak` leaves a same-day record unchanged.
 */
export function recordGameResult(gameId: GameId, correct: number, wrong: number, probes = 0): void {
  mutate((v2) => {
    const now = new Date();
    return {
      ...v2,
      profiles: v2.profiles.map((p) =>
        p.id === v2.activeProfileId
          ? {
              ...p,
              progress: {
                ...p.progress,
                [gameId]: recordResult(p.progress[gameId], { correct, wrong, probes, win: true }),
              },
              insights: advanceStreak(p.insights, now),
            }
          : p,
      ),
    };
  });
}

/**
 * Records that a profile reached its daily play-time cap on the day containing
 * `now`. One increment per local day: a second hit on the same day declines the
 * mutation, so `mutate` short-circuits and nothing is written (NFR-2). A profile
 * with no limit never increments here either, so FR-3 holds even if a future
 * caller forgets the call-site guard.
 */
export function recordLimitHit(profileId: string, now: Date = new Date()): void {
  mutate((v2) => {
    const profile = v2.profiles.find((p) => p.id === profileId);
    if (profile === undefined) return null;
    if (normalizePlayTime(profile.playTime, now).limitMinutes === null) return null;
    const insights = normalizeInsights(profile.insights);
    const today = todayKey(now);
    if (insights.lastLimitHitDay === today) return null;
    return {
      ...v2,
      profiles: v2.profiles.map((p) =>
        p.id === profileId
          ? {
              ...p,
              insights: {
                ...insights,
                limitHitDays: insights.limitHitDays + 1,
                lastLimitHitDay: today,
              },
            }
          : p,
      ),
    };
  });
}

/**
 * Records an abandoned session's taps on the ACTIVE profile: the rolling
 * window only. The cumulative counters and the win count describe completed
 * sessions and stay untouched; the play count is not touched either, because
 * it counts every game the child starts, abandoned or not.
 */
export function recordGameTaps(gameId: GameId, correct: number, wrong: number, probes = 0): void {
  mutate((v2) => ({
    ...v2,
    profiles: v2.profiles.map((p) =>
      p.id === v2.activeProfileId
        ? {
            ...p,
            progress: {
              ...p.progress,
              [gameId]: recordTaps(p.progress[gameId], { correct, wrong, probes }),
            },
          }
        : p,
    ),
  }));
}

/** Normalized per-game progress for the active profile (or the profile with the given id). */
export function getProgress(profileId?: string): Record<GameId, GameProgress> {
  const v2 = ensureV2();
  const id = profileId ?? v2.activeProfileId;
  const profile = v2.profiles.find((p) => p.id === id) ?? v2.profiles[0];
  return normalizeProgressMap(profile.progress);
}

/**
 * Band shift (-1 | 0 | 1) for the active profile's recent performance in a game,
 * derived from the rolling tap window. Returns 0 when the adaptive difficulty
 * toggle is off or the window holds too few taps to judge.
 */
export function getAdaptiveBandShift(gameId: GameId): BandShift {
  if (!getSettings().adaptiveDifficulty) return 0;
  return bandShiftFor(getProgress()[gameId].recent);
}

// The play-session module banks through a sink so it can stay free of a storage
// import (and the cycle that would follow). `recordPlayTime` is its writer.
setPlaySessionSink(recordPlayTime);
