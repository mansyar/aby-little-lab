import { expect, type Page, test } from "@playwright/test";
import { holdCanvasUntil, tapCanvas } from "../fixtures/canvas";
import { collectErrors, openHub, progressState, settingsState } from "../fixtures/game";
import { STORAGE_KEY } from "../fixtures/shell";

/**
 * The Overview page a parent reaches: hub → three-second gate → Progress →
 * three statements on the first page, with no paging step and nothing to read
 * twice.
 *
 * The profile is seeded through the real storage layer rather than played in,
 * because the statements are derived from a week of history that a journey
 * cannot produce quickly. The seeding follows the storage journey's shape:
 * `addInitScript` writes an `abby-little-lab:v2` payload before the app boots,
 * and every day key is computed in the page from the local clock — a literal
 * `YYYY-MM-DD` would stop matching "this week" the day after it was written.
 */

/** Taps the Learning Progress row and waits for the overlay to publish page 0. */
async function openProgress(page: Page): Promise<void> {
  const closed = await settingsState(page);
  if (!closed.gate) throw new Error("the hub should publish the settings gate");

  await holdCanvasUntil(page, closed.gate, async () => (await settingsState(page)).open);

  const opened = await settingsState(page);
  if (!opened.progressRow) throw new Error("the open panel should publish the Progress row");
  await tapCanvas(page, opened.progressRow);

  await expect
    .poll(async () => (await progressState(page))?.page ?? -1, {
      message: "the Progress overlay should open on the Overview page",
      timeout: 10_000,
    })
    .toBe(0);
}

/**
 * Seeds one profile with two completed days (a streak of 2), three games —
 * one strong, one weak, one below the ten-tap floor — and a 30-minute cap with
 * one cap-day behind it.
 *
 * Accuracy is built to make the ranking unambiguous: Color Match answers 18 of
 * 20 correctly (90%), Shape Sorter 5 of 14 (36%), and Memory Match 4 of 8 sits
 * under `MIN_SUMMARY_TAPS` so it can be neither strongest nor hardest.
 *
 * The two days are also written into `activity`, the buckets the 7-day strip
 * draws: the Overview's day count is read from there, so a seed that left it
 * empty would be asserting against a profile with no recorded play at all.
 */
async function seedInsightProfile(page: Page): Promise<void> {
  await page.addInitScript((key: string) => {
    /** The local day key `offset` days from today, in the app's YYYY-MM-DD shape. */
    const dayKey = (offset: number): string => {
      const now = new Date();
      const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
      const month = String(day.getMonth() + 1).padStart(2, "0");
      const date = String(day.getDate()).padStart(2, "0");
      return `${day.getFullYear()}-${month}-${date}`;
    };
    /** An ISO timestamp on a local day, so the week window cannot drift. */
    const at = (offset: number, hour: number): string => {
      const now = new Date();
      return new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + offset,
        hour,
      ).toISOString();
    };
    const payload = {
      schemaVersion: 1,
      activeProfileId: "p1",
      profiles: [
        {
          id: "p1",
          avatarId: "cat",
          createdAt: at(-30, 9),
          stickers: {},
          playTime: { limitMinutes: 30, usedMinutes: 12, lastUsedDate: dayKey(0) },
          progress: {
            "color-match": {
              plays: 4,
              wins: 3,
              correct: 18,
              wrong: 2,
              lastPlayedAt: at(0, 10),
              recent: [],
            },
            "shape-sorter": {
              plays: 3,
              wins: 2,
              correct: 5,
              wrong: 9,
              lastPlayedAt: at(-1, 15),
              recent: [],
            },
            "memory-match": {
              plays: 1,
              wins: 0,
              correct: 4,
              wrong: 4,
              lastPlayedAt: at(-10, 11),
              recent: [],
            },
          },
          // The days the stamps above imply, in the strip's own buckets: the
          // summary counts its days from these entries, so a seed without them
          // tests a profile that never recorded a play.
          activity: [
            { day: dayKey(0), plays: 4 },
            { day: dayKey(-1), plays: 3 },
          ],
          insights: {
            currentStreakDays: 2,
            bestStreakDays: 2,
            lastStreakDay: dayKey(0),
            limitHitDays: 1,
            lastLimitHitDay: dayKey(-1),
          },
        },
      ],
      settings: {},
    };
    try {
      window.localStorage.setItem(key, JSON.stringify(payload));
    } catch {
      // An opaque origin has no storage to seed; the app then boots its
      // defaults, and the journey's first poll fails loudly rather than here.
    }
  }, STORAGE_KEY);
}

test("a parent reads the three insight statements on the first Progress page", async ({ page }) => {
  const errors = collectErrors(page);
  await seedInsightProfile(page);
  await openHub(page);

  await openProgress(page);

  const overview = await progressState(page);
  if (!overview) throw new Error("the Progress overlay closed before it was read");
  expect(overview.pageCount).toBe(5);

  const lines = overview.lines;
  expect(lines, "the Overview should print all three statements").toHaveLength(3);
  for (const line of lines) {
    expect(line.trim(), "no statement may be blank").not.toBe("");
  }

  // Reach: two games played inside the seven-day window, on the two days the
  // seeded activity draws, with five lifetime wins of eight started sessions.
  expect(lines[0]).toContain("2 of 22 games");
  expect(lines[0]).toContain("2 days this week");
  expect(lines[0]).toContain("5 completions in all");
  expect(lines[0]).toContain("63% of started games finished");
  // Accuracy: overall share, then the two games above the ten-tap floor.
  expect(lines[1]).toContain("64% of answers correct");
  expect(lines[1]).toContain("strongest Color Match");
  expect(lines[1]).toContain("hardest Shape Sorter");
  // Habit: the streak the seed recorded, and the cap-day behind it.
  expect(lines[2]).toContain("2 days in a row");
  expect(lines[2]).toContain("cap reached on 1 day");

  // Forward a page: the game rows replace the statements.
  await tapCanvas(page, overview.next);
  await expect
    .poll(async () => (await progressState(page))?.page ?? -1, {
      message: "the forward chevron should move to the first game page",
      timeout: 5_000,
    })
    .toBe(1);
  expect((await progressState(page))?.lines).toEqual([]);

  // And back: the statements are page 0's own, not a one-time capture.
  const paged = await progressState(page);
  if (!paged) throw new Error("the Progress overlay closed before it was paged back");
  await tapCanvas(page, paged.prev);
  await expect
    .poll(async () => (await progressState(page))?.page ?? -1, {
      message: "the back chevron should return to the Overview",
      timeout: 5_000,
    })
    .toBe(0);
  expect((await progressState(page))?.lines).toEqual(lines);

  expect(errors).toEqual([]);
});
