import { describe, expect, it } from "vitest";
import { createDefaultInsights } from "../../game/insightsLogic";
import {
  type InsightsSummary,
  MIN_SUMMARY_TAPS,
  summariseInsights,
} from "../../game/insightsSummary";
import { createDefaultPlayTime, todayKey } from "../../game/playTimeLogic";
import { createDefaultProgressMap } from "../../game/progressLogic";
import type {
  DayActivity,
  GameId,
  GameProgress,
  Profile,
  ProfileInsights,
  StickerData,
} from "../../types";
import { GAME_IDS } from "../../types";

/**
 * Every instant is derived from this fixed local noon, so the week window, the
 * day counts and the strings mean the same thing on every calendar day and in
 * every timezone. No day key is ever written as a literal.
 */
const NOW = new Date(2026, 10, 8, 12, 0, 0);

/** The local noon `days` before `NOW`, for a `lastPlayedAt` timestamp. */
function daysAgo(days: number): Date {
  return new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() - days, 12, 0, 0);
}

/** An insights record over the zeros. */
function insightsOf(partial: Partial<ProfileInsights>): ProfileInsights {
  return { ...createDefaultInsights(), ...partial };
}

/** The activity the stamps of a profile imply: one entry per played day. */
function activityOf(entries: ReadonlyArray<readonly [number, number]>): DayActivity[] {
  return entries.map(([daysAgoPlayed, plays]) => ({
    day: todayKey(daysAgo(daysAgoPlayed)),
    plays,
  }));
}

/**
 * A profile with the given per-game stats, the given limit and history, and the
 * activity entries the 7-day strip draws.
 *
 * `activity` is given explicitly rather than derived from `lastPlayedAt`: the
 * day count the summary prints is read from these entries, so a case that left
 * them out would be testing a profile that never recorded a play.
 */
function profileOf(
  entries: ReadonlyArray<readonly [GameId, Partial<GameProgress>]>,
  options: {
    limitMinutes?: number | null;
    insights?: Partial<ProfileInsights>;
    activity?: ReadonlyArray<DayActivity>;
  } = {},
): Profile {
  const progress = createDefaultProgressMap();
  for (const [gameId, stats] of entries) {
    progress[gameId] = { ...progress[gameId], ...stats };
  }
  // Same construction as `createDefaultProgressMap`: every game id is listed,
  // so the `Object.fromEntries` result is the declared record.
  const stickers = Object.fromEntries(
    GAME_IDS.map((gameId) => [gameId, { earned: false, earnedAt: null }]),
  ) as Record<GameId, StickerData>;
  return {
    id: "profile-1",
    avatarId: "cat",
    createdAt: new Date(2026, 0, 1, 9, 0, 0).toISOString(),
    stickers,
    playTime: { ...createDefaultPlayTime(NOW), limitMinutes: options.limitMinutes ?? null },
    progress,
    activity: [...(options.activity ?? [])],
    insights: insightsOf(options.insights ?? {}),
  };
}

/**
 * A profile whose insights are whatever a hostile payload wrote.
 *
 * `ProfileInsights` is the declared shape, and this helper exists precisely to
 * hand the summary a value that is not one — the assertion is the point of the
 * test, not a shortcut around the types.
 */
function profileWithRawInsights(profile: Profile, raw: unknown): Profile {
  return { ...profile, insights: raw as ProfileInsights };
}

/**
 * Asserts that a value and everything under it is a finite number, a string free
 * of `NaN`/`Infinity`, or not a number at all. `toEqual` cannot catch these on
 * its own: `NaN` and `Infinity` survive a structural comparison as themselves,
 * but a page printing their string forms is the failure being guarded against.
 */
function expectTotal(value: unknown, path = "summary"): void {
  if (typeof value === "number") {
    expect(Number.isFinite(value), `${path} is ${String(value)}`).toBe(true);
    return;
  }
  if (typeof value === "string") {
    expect(value, path).not.toMatch(/NaN|Infinity/);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      expectTotal(item, `${path}[${index}]`);
    });
    return;
  }
  if (value !== null && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) expectTotal(item, `${path}.${key}`);
  }
}

/** Freezes a value and everything under it, so a mutation throws. */
function deepFreeze(value: object): void {
  for (const item of Object.values(value)) {
    if (item !== null && typeof item === "object") deepFreeze(item);
  }
  Object.freeze(value);
}

interface Case {
  name: string;
  profile: Profile;
  lines: readonly [string, string, string];
  activity: InsightsSummary["activity"];
  accuracy: InsightsSummary["accuracy"];
  routine: InsightsSummary["routine"];
}

const RICH_INSIGHTS = insightsOf({
  currentStreakDays: 4,
  bestStreakDays: 9,
  lastStreakDay: todayKey(daysAgo(1)),
  limitHitDays: 3,
});

/**
 * The five profiles AC-5 names, with the exact statement text and the numbers
 * behind each one. Asserting both halves is what keeps the page from having to
 * recompute anything: if the numbers moved without the sentence, this table
 * fails.
 */
const CASES: ReadonlyArray<Case> = [
  {
    name: "a profile with no games played",
    profile: profileOf([]),
    lines: [
      "No games yet this week · nothing completed yet",
      "Start playing to see how it is going",
      "No streak yet · no daily limit set",
    ],
    activity: { daysPlayed: 0, distinctGames: 0, completions: 0, completionPercent: null },
    accuracy: { overallPercent: null, strongest: null, hardest: null },
    routine: { streakDays: 0, bestStreakDays: 0, limitHitDays: 0, hasLimit: false },
  },
  {
    name: "a profile with games played but none completed",
    profile: profileOf(
      [
        [
          "shape-sorter",
          { plays: 2, wins: 0, correct: 6, wrong: 2, lastPlayedAt: daysAgo(1).toISOString() },
        ],
        [
          "pop-freeze",
          { plays: 1, wins: 0, correct: 4, wrong: 1, lastPlayedAt: daysAgo(2).toISOString() },
        ],
      ],
      // The two days those games were played, in the strip's own buckets.
      {
        limitMinutes: 20,
        activity: activityOf([
          [1, 2],
          [2, 1],
        ]),
      },
    ),
    lines: [
      "2 of 22 games · 2 days this week · nothing completed yet",
      "77% of answers correct · not enough play yet to name a strongest game",
      "No streak yet · cap not reached yet",
    ],
    activity: { daysPlayed: 2, distinctGames: 2, completions: 0, completionPercent: 0 },
    accuracy: { overallPercent: 77, strongest: null, hardest: null },
    routine: { streakDays: 0, bestStreakDays: 0, limitHitDays: 0, hasLimit: true },
  },
  {
    name: "a profile with fewer than MIN_SUMMARY_TAPS taps overall",
    profile: profileOf(
      [
        [
          "color-match",
          { plays: 1, wins: 1, correct: 5, wrong: 2, lastPlayedAt: daysAgo(0).toISOString() },
        ],
      ],
      { activity: activityOf([[0, 1]]) },
    ),
    lines: [
      "1 of 22 games · 1 day this week · 1 completion in all (100% of started games finished)",
      "71% of answers correct · not enough play yet to name a strongest game",
      "No streak yet · no daily limit set",
    ],
    activity: { daysPlayed: 1, distinctGames: 1, completions: 1, completionPercent: 100 },
    accuracy: { overallPercent: 71, strongest: null, hardest: null },
    routine: { streakDays: 0, bestStreakDays: 0, limitHitDays: 0, hasLimit: false },
  },
  {
    name: "a rich profile",
    profile: profileOf(
      [
        [
          "shape-sorter",
          { plays: 5, wins: 3, correct: 27, wrong: 3, lastPlayedAt: daysAgo(1).toISOString() },
        ],
        [
          "pop-freeze",
          { plays: 4, wins: 2, correct: 12, wrong: 8, lastPlayedAt: daysAgo(2).toISOString() },
        ],
        [
          "memory-match",
          { plays: 3, wins: 1, correct: 13, wrong: 7, lastPlayedAt: daysAgo(4).toISOString() },
        ],
        [
          "big-small",
          { plays: 2, wins: 0, correct: 6, wrong: 4, lastPlayedAt: daysAgo(8).toISOString() },
        ],
      ],
      {
        limitMinutes: 30,
        insights: RICH_INSIGHTS,
        // Three days the stamps account for, plus a fourth the strip drew from
        // a session whose game was played again later. The day count follows
        // the strip, so it is four while three games were last played inside
        // the window.
        activity: activityOf([
          [1, 5],
          [2, 4],
          [3, 2],
          [4, 3],
        ]),
      },
    ),
    lines: [
      "3 of 22 games · 4 days this week · 6 completions in all (43% of started games finished)",
      "73% of answers correct · strongest Shape Sorter (90%) · hardest Pop & Freeze (60%)",
      "4 days in a row · best 9 days · cap reached on 3 days",
    ],
    activity: { daysPlayed: 4, distinctGames: 3, completions: 6, completionPercent: 43 },
    accuracy: {
      overallPercent: 73,
      strongest: { gameId: "shape-sorter", label: "Shape Sorter", accuracyPercent: 90, taps: 30 },
      hardest: { gameId: "pop-freeze", label: "Pop & Freeze", accuracyPercent: 60, taps: 20 },
    },
    routine: { streakDays: 4, bestStreakDays: 9, limitHitDays: 3, hasLimit: true },
  },
  {
    name: "a profile without a daily limit",
    profile: profileOf(
      [
        [
          "story-order",
          { plays: 3, wins: 2, correct: 9, wrong: 1, lastPlayedAt: daysAgo(0).toISOString() },
        ],
      ],
      {
        limitMinutes: null,
        insights: insightsOf({
          currentStreakDays: 2,
          bestStreakDays: 5,
          limitHitDays: 4,
        }),
        activity: activityOf([[0, 3]]),
      },
    ),
    lines: [
      "1 of 22 games · 1 day this week · 2 completions in all (67% of started games finished)",
      "90% of answers correct · Story Order has the most answers so far (90%)",
      "2 days in a row · best 5 days · no daily limit set",
    ],
    activity: { daysPlayed: 1, distinctGames: 1, completions: 2, completionPercent: 67 },
    accuracy: {
      overallPercent: 90,
      strongest: { gameId: "story-order", label: "Story Order", accuracyPercent: 90, taps: 10 },
      hardest: { gameId: "story-order", label: "Story Order", accuracyPercent: 90, taps: 10 },
    },
    routine: { streakDays: 2, bestStreakDays: 5, limitHitDays: 4, hasLimit: false },
  },
];

describe("summariseInsights — the five AC-5 profiles", () => {
  for (const testCase of CASES) {
    it(`writes three statements and their numbers for ${testCase.name}`, () => {
      const summary = summariseInsights(testCase.profile, NOW);

      expect(summary.lines).toEqual(testCase.lines);
      expect(summary.activity).toEqual(testCase.activity);
      expect(summary.accuracy).toEqual(testCase.accuracy);
      expect(summary.routine).toEqual(testCase.routine);
    });
  }
});

describe("summariseInsights — the accuracy floor", () => {
  it(`ranks a game with exactly MIN_SUMMARY_TAPS taps and ignores one tap fewer`, () => {
    const profile = profileOf([
      // 10 taps at 90%: at the floor, so it can be named.
      ["pattern-builder", { plays: 2, wins: 1, correct: 9, wrong: 1 }],
      // 9 taps at 100%: one short, so its perfect record is not yet a verdict.
      ["more-less", { plays: 1, wins: 1, correct: 9, wrong: 0 }],
    ]);

    const summary = summariseInsights(profile, NOW);

    expect(MIN_SUMMARY_TAPS).toBe(10);
    expect(summary.accuracy.strongest).toMatchObject({
      gameId: "pattern-builder",
      accuracyPercent: 90,
      taps: MIN_SUMMARY_TAPS,
    });
    expect(summary.lines[1]).toContain("Pattern Builder");
    expect(summary.lines[1]).not.toContain("More or Less");
    // Overall accuracy still counts the short game's taps.
    expect(summary.accuracy.overallPercent).toBe(95);
  });

  it("never names a game hardest on a single wrong tap", () => {
    const profile = profileOf([
      // One wrong answer in one tap: 0%, but no evidence yet.
      ["odd-one-out", { plays: 1, wins: 0, correct: 0, wrong: 1 }],
      ["shape-sorter", { plays: 2, wins: 1, correct: 9, wrong: 1 }],
    ]);

    const summary = summariseInsights(profile, NOW);

    expect(summary.accuracy.hardest).toMatchObject({
      gameId: "shape-sorter",
      accuracyPercent: 90,
    });
    expect(summary.lines[1]).not.toContain("Odd One Out");
  });
});

describe("summariseInsights — the day count", () => {
  it("counts three days when one game was played on three of them", () => {
    // One game, one last-played stamp: the defect this test guards against
    // counted a single day here while the strip drew three bars.
    const profile = profileOf(
      [
        [
          "color-match",
          { plays: 3, wins: 1, correct: 8, wrong: 2, lastPlayedAt: daysAgo(0).toISOString() },
        ],
      ],
      {
        activity: activityOf([
          [0, 1],
          [1, 1],
          [2, 1],
        ]),
      },
    );

    const summary = summariseInsights(profile, NOW);

    expect(summary.activity.daysPlayed).toBe(3);
    expect(summary.activity.distinctGames).toBe(1);
    expect(summary.lines[0]).toBe(
      "1 of 22 games · 3 days this week · 1 completion in all (33% of started games finished)",
    );
  });

  it("prints completions without a share when a malformed record has wins but no plays", () => {
    const profile = profileOf([["story-order", { plays: 0, wins: 5 }]]);

    const summary = summariseInsights(profile, NOW);

    expect(summary.activity.completionPercent).toBeNull();
    expect(summary.lines[0]).toBe("No games yet this week · 5 completions in all");
  });

  it("counts the week from December when the moment is in early January", () => {
    const twoDaysIntoTheYear = new Date(2027, 0, 2, 12, 0, 0);
    const profile = profileOf(
      [
        [
          "color-match",
          {
            plays: 2,
            wins: 1,
            correct: 5,
            wrong: 2,
            lastPlayedAt: new Date(2026, 11, 31, 12, 0, 0).toISOString(),
          },
        ],
      ],
      {
        // The week that starts in January must reach back into December: the
        // window is stepped by calendar date, not by subtracting six times 24
        // hours across a year boundary.
        activity: [
          { day: todayKey(new Date(2026, 11, 31, 12, 0, 0)), plays: 1 },
          { day: todayKey(new Date(2027, 0, 1, 12, 0, 0)), plays: 1 },
        ],
      },
    );

    const summary = summariseInsights(profile, twoDaysIntoTheYear);

    expect(summary.activity.daysPlayed).toBe(2);
    expect(summary.activity.distinctGames).toBe(1);
    expect(summary.lines[0]).toContain("2 days this week");
  });
});

describe("summariseInsights — the week window", () => {
  it("drops a game played seven days ago from the week but keeps its completions", () => {
    const profile = profileOf(
      [
        [
          "shape-sorter",
          { plays: 2, wins: 1, correct: 5, wrong: 5, lastPlayedAt: daysAgo(6).toISOString() },
        ],
        [
          "pop-freeze",
          { plays: 3, wins: 2, correct: 5, wrong: 5, lastPlayedAt: daysAgo(7).toISOString() },
        ],
        [
          "big-small",
          { plays: 4, wins: 3, correct: 5, wrong: 5, lastPlayedAt: daysAgo(8).toISOString() },
        ],
      ],
      // The strip's own buckets, including the two days outside the window:
      // pruning, not the stamps, is what bounds the day count.
      {
        activity: activityOf([
          [6, 2],
          [7, 3],
          [8, 4],
        ]),
      },
    );

    const summary = summariseInsights(profile, NOW);

    // Only the sixth day back is inside the strip's window.
    expect(summary.activity.distinctGames).toBe(1);
    expect(summary.activity.daysPlayed).toBe(1);
    // Completions are lifetime, so both older games still count.
    expect(summary.activity.completions).toBe(6);
    expect(summary.lines[0]).toBe(
      "1 of 22 games · 1 day this week · 6 completions in all (67% of started games finished)",
    );
  });
});

describe("summariseInsights — totality and purity", () => {
  it("still produces three lines from a malformed insights record", () => {
    const profile = profileWithRawInsights(
      profileOf([["color-match", { plays: 1, wins: 1, correct: 5, wrong: 2, lastPlayedAt: null }]]),
      {
        currentStreakDays: "3",
        bestStreakDays: -1,
        limitHitDays: 2.5,
        lastStreakDay: 42,
        lastLimitHitDay: {},
      },
    );

    const summary = summariseInsights(profile, NOW);

    expect(summary.lines).toHaveLength(3);
    for (const line of summary.lines) expect(line.length).toBeGreaterThan(0);
    expect(summary.routine).toEqual({
      streakDays: 0,
      bestStreakDays: 0,
      limitHitDays: 0,
      hasLimit: false,
    });
    expectTotal(summary);
  });

  it("emits no NaN or Infinity for any of the profiles above", () => {
    const profiles = CASES.map((testCase) => testCase.profile);
    // A malformed record, and wins without plays, are the two shapes that could
    // divide by zero or contradict themselves.
    profiles.push(
      profileWithRawInsights(profileOf([["shape-sorter", { wins: 5 }]]), {
        bestStreakDays: Number.NaN,
      }),
      profileOf([["story-order", { plays: 0, wins: 5 }]]),
    );

    for (const profile of profiles) expectTotal(summariseInsights(profile, NOW));
  });

  it("returns equal output for equal arguments", () => {
    const profile = CASES[3].profile;

    expect(summariseInsights(profile, NOW)).toEqual(summariseInsights(profile, NOW));
  });

  it("does not mutate the profile it is given", () => {
    const profile = profileOf(
      [
        [
          "shape-sorter",
          { plays: 2, wins: 1, correct: 9, wrong: 1, lastPlayedAt: daysAgo(1).toISOString() },
        ],
      ],
      { limitMinutes: 20, insights: RICH_INSIGHTS },
    );
    deepFreeze(profile);

    expect(() => summariseInsights(profile, NOW)).not.toThrow();
    expect(profile.playTime.limitMinutes).toBe(20);
    expect(profile.progress["shape-sorter"].wins).toBe(1);
  });
});
