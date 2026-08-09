import { describe, expect, it } from "vitest";
import { GAME_IDS } from "../../game/profileLogic";
import {
  addActivity,
  createDefaultProgress,
  createDefaultProgressMap,
  formatAccuracyPercent,
  getAccuracy,
  isMastered,
  MASTERY_WINS,
  normalizeProgress,
  normalizeProgressMap,
  pruneActivity,
  recordPlay,
  recordResult,
  relativeLastPlayed,
} from "../../game/progressLogic";
import type { DayActivity, GameProgress } from "../../types";

const DAY = new Date(2026, 7, 5, 10, 0, 0); // 2026-08-05 local
const NEXT_DAY = new Date(2026, 7, 6, 9, 0, 0); // 2026-08-06 local
const THREE_DAYS_LATER = new Date(2026, 7, 8, 18, 0, 0); // 2026-08-08 local

function gp(overrides: Partial<GameProgress> = {}): GameProgress {
  return {
    plays: 0,
    wins: 0,
    correct: 0,
    wrong: 0,
    lastPlayedAt: null,
    ...overrides,
  };
}

describe("progressLogic", () => {
  describe("createDefaultProgress", () => {
    it("creates zeroed stats with no last-played timestamp", () => {
      expect(createDefaultProgress()).toEqual({
        plays: 0,
        wins: 0,
        correct: 0,
        wrong: 0,
        lastPlayedAt: null,
      });
    });
  });

  describe("createDefaultProgressMap", () => {
    it("creates zeroed stats for every game id", () => {
      const map = createDefaultProgressMap();
      expect(Object.keys(map).sort()).toEqual([...GAME_IDS].sort());
      for (const gameId of GAME_IDS) {
        expect(map[gameId]).toEqual(gp());
      }
    });
  });

  describe("normalizeProgress", () => {
    it("keeps a valid progress unchanged", () => {
      const input = gp({
        plays: 4,
        wins: 3,
        correct: 20,
        wrong: 5,
        lastPlayedAt: "2026-08-05T10:00:00.000Z",
      });
      expect(normalizeProgress(input)).toEqual(input);
    });

    it("backfills missing fields with defaults", () => {
      const normalized = normalizeProgress({} as GameProgress);
      expect(normalized).toEqual(gp());
    });

    it("treats missing progress as a fresh default", () => {
      expect(normalizeProgress(undefined)).toEqual(gp());
    });

    it("ignores negative counts and coerces invalid numbers", () => {
      const normalized = normalizeProgress({
        plays: -3,
        wins: 1.5,
        correct: "12",
        wrong: 2,
        lastPlayedAt: 42,
      } as unknown as GameProgress);
      expect(normalized).toEqual(gp({ plays: 0, wins: 0, correct: 0, wrong: 2 }));
    });

    it("keeps a valid last-played timestamp", () => {
      const normalized = normalizeProgress({
        lastPlayedAt: "2026-08-05T10:00:00.000Z",
      } as GameProgress);
      expect(normalized.lastPlayedAt).toBe("2026-08-05T10:00:00.000Z");
    });
  });

  describe("normalizeProgressMap", () => {
    it("backfills missing game ids over saved stats", () => {
      const map = normalizeProgressMap({ "color-match": gp({ plays: 3 }) });
      expect(map["color-match"].plays).toBe(3);
      expect(map["shape-sorter"]).toEqual(gp());
      expect(Object.keys(map).sort()).toEqual([...GAME_IDS].sort());
    });

    it("treats a missing map as all-defaults", () => {
      const map = normalizeProgressMap(undefined);
      expect(Object.keys(map).sort()).toEqual([...GAME_IDS].sort());
    });
  });

  describe("recordPlay", () => {
    it("increments plays and stamps last-played, leaving other stats untouched", () => {
      const next = recordPlay(gp({ plays: 2, wins: 1, correct: 8, wrong: 2 }), DAY);
      expect(next.plays).toBe(3);
      expect(next.wins).toBe(1);
      expect(next.correct).toBe(8);
      expect(next.wrong).toBe(2);
      expect(next.lastPlayedAt).toBe(DAY.toISOString());
    });
  });

  describe("recordResult", () => {
    it("accumulates correct/wrong and increments wins on a win", () => {
      const next = recordResult(
        gp({ plays: 1, wins: 1, correct: 8, wrong: 2 }),
        { correct: 6, wrong: 1, win: true },
        DAY,
      );
      expect(next.wins).toBe(2);
      expect(next.correct).toBe(14);
      expect(next.wrong).toBe(3);
      expect(next.plays).toBe(1);
    });

    it("does not increment wins when win is false", () => {
      const next = recordResult(gp({ wins: 1 }), { correct: 4, wrong: 3, win: false }, DAY);
      expect(next.wins).toBe(1);
      expect(next.correct).toBe(4);
      expect(next.wrong).toBe(3);
    });

    it("ignores negative counts", () => {
      const next = recordResult(gp(), { correct: -2, wrong: 5, win: true }, DAY);
      expect(next.correct).toBe(0);
      expect(next.wrong).toBe(5);
    });
  });

  describe("getAccuracy", () => {
    it("returns the correct ratio", () => {
      expect(getAccuracy(gp({ correct: 18, wrong: 6 }))).toBe(0.75);
    });

    it("returns null when there are no taps", () => {
      expect(getAccuracy(gp())).toBeNull();
    });
  });

  describe("formatAccuracyPercent", () => {
    it("formats the ratio as a rounded percent", () => {
      expect(formatAccuracyPercent(gp({ correct: 18, wrong: 6 }))).toBe("75%");
    });

    it("returns an em dash when there are no taps", () => {
      expect(formatAccuracyPercent(gp())).toBe("—");
    });
  });

  describe("MASTERY_WINS", () => {
    it("is three wins", () => {
      expect(MASTERY_WINS).toBe(3);
    });
  });

  describe("isMastered", () => {
    it("is false below the mastery threshold", () => {
      expect(isMastered(gp({ wins: 2 }))).toBe(false);
    });

    it("is true at the threshold", () => {
      expect(isMastered(gp({ wins: 3 }))).toBe(true);
    });

    it("is true beyond the threshold", () => {
      expect(isMastered(gp({ wins: 7 }))).toBe(true);
    });
  });

  describe("addActivity", () => {
    it("creates today's entry when the day is new", () => {
      const next = addActivity([], DAY);
      expect(next).toEqual([{ day: "2026-08-05", plays: 1 }]);
    });

    it("increments an existing entry for the same day", () => {
      const existing: DayActivity[] = [{ day: "2026-08-05", plays: 2 }];
      const next = addActivity(existing, DAY);
      expect(next).toEqual([{ day: "2026-08-05", plays: 3 }]);
    });

    it("appends a new day and keeps prior entries", () => {
      const existing: DayActivity[] = [{ day: "2026-08-05", plays: 2 }];
      const next = addActivity(existing, NEXT_DAY);
      expect(next).toEqual([
        { day: "2026-08-05", plays: 2 },
        { day: "2026-08-06", plays: 1 },
      ]);
    });
  });

  describe("pruneActivity", () => {
    it("keeps entries from the last 7 days (today + 6 prior)", () => {
      const activity: DayActivity[] = [
        { day: "2026-07-29", plays: 1 }, // 7 days before 08-05 -> pruned
        { day: "2026-07-30", plays: 2 }, // 6 days before -> kept
        { day: "2026-08-02", plays: 3 },
        { day: "2026-08-05", plays: 4 },
      ];
      const next = pruneActivity(activity, DAY);
      expect(next).toEqual([
        { day: "2026-07-30", plays: 2 },
        { day: "2026-08-02", plays: 3 },
        { day: "2026-08-05", plays: 4 },
      ]);
    });

    it("sorts entries chronologically", () => {
      const next = pruneActivity(
        [
          { day: "2026-08-05", plays: 1 },
          { day: "2026-08-01", plays: 2 },
        ],
        DAY,
      );
      expect(next.map((a) => a.day)).toEqual(["2026-08-01", "2026-08-05"]);
    });

    it("returns an empty array for no activity", () => {
      expect(pruneActivity([], DAY)).toEqual([]);
      expect(pruneActivity(undefined, DAY)).toEqual([]);
    });
  });

  describe("relativeLastPlayed", () => {
    it("returns an em dash when never played", () => {
      expect(relativeLastPlayed(null, DAY)).toBe("—");
    });

    it("returns Today for the same calendar day", () => {
      expect(relativeLastPlayed(new Date(2026, 7, 5, 7).toISOString(), DAY)).toBe("Today");
    });

    it("returns Yesterday for the previous calendar day", () => {
      expect(relativeLastPlayed(new Date(2026, 7, 4, 22).toISOString(), DAY)).toBe("Yesterday");
    });

    it("returns N days ago beyond yesterday", () => {
      expect(relativeLastPlayed(new Date(2026, 7, 2, 10).toISOString(), DAY)).toBe("3d ago");
    });
  });

  describe("integration", () => {
    it("records a full play + result lifecycle across days", () => {
      let progress = gp();
      let activity: DayActivity[] = [];

      progress = recordPlay(progress, DAY);
      progress = recordResult(progress, { correct: 5, wrong: 1, win: true }, DAY);
      activity = pruneActivity(addActivity(activity, DAY), DAY);

      progress = recordPlay(progress, NEXT_DAY);
      progress = recordResult(progress, { correct: 4, wrong: 2, win: true }, NEXT_DAY);
      activity = pruneActivity(addActivity(activity, NEXT_DAY), NEXT_DAY);

      progress = recordPlay(progress, THREE_DAYS_LATER);
      progress = recordResult(progress, { correct: 6, wrong: 0, win: true }, THREE_DAYS_LATER);
      activity = pruneActivity(addActivity(activity, THREE_DAYS_LATER), THREE_DAYS_LATER);

      expect(progress).toEqual(
        gp({
          plays: 3,
          wins: 3,
          correct: 15,
          wrong: 3,
          lastPlayedAt: THREE_DAYS_LATER.toISOString(),
        }),
      );
      expect(isMastered(progress)).toBe(true);
      expect(getAccuracy(progress)).toBeCloseTo(15 / 18);
      expect(activity).toEqual([
        { day: "2026-08-05", plays: 1 },
        { day: "2026-08-06", plays: 1 },
        { day: "2026-08-08", plays: 1 },
      ]);
    });
  });
});
