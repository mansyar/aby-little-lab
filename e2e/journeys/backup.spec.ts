import { expect, type Page, test } from "@playwright/test";
import { holdCanvasUntil, tapCanvas } from "../fixtures/canvas";
import {
  collectErrors,
  launchGame,
  openHub,
  profileCount,
  returnToHub,
  settingsState,
  settleHub,
  stickerCount,
} from "../fixtures/game";
import { readStoredV2, STORAGE_KEY } from "../fixtures/shell";

/**
 * FR-11 / AC-3: the round trip a backup promises.
 *
 * The first test exports through the real download, then hands the file that
 * landed on disk to a *second browser context* — not a reload of the same one —
 * so the restore genuinely starts from empty storage. The file is never read
 * with `fs` and its bytes are never rebuilt: the picker receives the downloaded
 * path, so the export's own bytes are what the import has to accept. If the
 * export were malformed the import would refuse and the sticker assertion below
 * would fail with the parent's sentence rather than a parse error.
 *
 * The second test is the refusal side at the same layer: a file that is not a
 * backup is refused on the result line, no choice card opens and the save is
 * untouched. Its content is supplied in memory because a bad file needs no path
 * of its own.
 *
 * Every day key is computed inside the page from the local clock, for the reason
 * `insights.spec.ts` records: a literal `YYYY-MM-DD` stops matching "today" the
 * day after it was written.
 */

test.setTimeout(120_000);

/**
 * Seeds two profiles between them carrying two earned stickers each, real
 * progress on different games and a streak — the four kinds of record AC-3 says
 * a round trip must not lose. Two, not one: the empty device already has a
 * profile whose id is `p1`, so a second child is what makes the merge's
 * add-a-profile branch observable end to end.
 */
async function seedSaveWithTwoProfiles(page: Page): Promise<void> {
  await page.addInitScript((key: string) => {
    /** The local day key `offset` days from today, in the app's YYYY-MM-DD shape. */
    const dayKey = (offset: number): string => {
      const now = new Date();
      const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
      const month = String(day.getMonth() + 1).padStart(2, "0");
      const date = String(day.getDate()).padStart(2, "0");
      return `${day.getFullYear()}-${month}-${date}`;
    };
    /** An ISO timestamp on a local day, so no window can drift. */
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
          stickers: {
            "shape-sorter": { earned: true, earnedAt: at(-12, 10) },
            "color-match": { earned: true, earnedAt: at(-2, 11) },
          },
          playTime: { limitMinutes: 30, usedMinutes: 8, lastUsedDate: dayKey(0) },
          progress: {
            "shape-sorter": {
              plays: 3,
              wins: 2,
              correct: 14,
              wrong: 6,
              lastPlayedAt: at(-1, 15),
              recent: [],
            },
            "color-match": {
              plays: 2,
              wins: 2,
              correct: 11,
              wrong: 1,
              lastPlayedAt: at(0, 10),
              recent: [],
            },
          },
          activity: [
            { day: dayKey(0), plays: 2 },
            { day: dayKey(-1), plays: 3 },
          ],
          insights: {
            currentStreakDays: 3,
            bestStreakDays: 5,
            lastStreakDay: dayKey(0),
            limitHitDays: 1,
            lastLimitHitDay: dayKey(-1),
          },
        },
        {
          id: "p2",
          avatarId: "dog",
          createdAt: at(-20, 9),
          stickers: {
            "animal-trace": { earned: true, earnedAt: at(-8, 10) },
            "pop-freeze": { earned: true, earnedAt: at(-4, 12) },
          },
          playTime: { limitMinutes: 20, usedMinutes: 4, lastUsedDate: dayKey(0) },
          progress: {
            "animal-trace": {
              plays: 2,
              wins: 1,
              correct: 9,
              wrong: 3,
              lastPlayedAt: at(-3, 14),
              recent: [],
            },
          },
          activity: [{ day: dayKey(-3), plays: 2 }],
          insights: {
            currentStreakDays: 1,
            bestStreakDays: 2,
            lastStreakDay: dayKey(0),
            limitHitDays: 0,
            lastLimitHitDay: null,
          },
        },
      ],
      settings: {},
    };
    try {
      window.localStorage.setItem(key, JSON.stringify(payload));
    } catch {
      // An opaque origin has no storage to seed; the first poll then fails
      // loudly rather than here.
    }
  }, STORAGE_KEY);
}

/** Holds the parental gate until it opens, then taps the switch card onto page two. */
async function openBackupPage(page: Page): Promise<void> {
  const closed = await settingsState(page);
  if (!closed.gate) throw new Error("the hub should publish the settings gate");

  await holdCanvasUntil(page, closed.gate, async () => (await settingsState(page)).open);

  const opened = await settingsState(page);
  await tapCanvas(page, opened.switchPage);
  await expect
    .poll(async () => (await settingsState(page)).page, {
      message: "the switch card should open the backup page",
      timeout: 5_000,
    })
    .toBe(1);
}

/** Taps page two's named action row at the point the panel publishes for it. */
async function tapBackupRow(page: Page, id: "export" | "restore"): Promise<void> {
  const row = (await settingsState(page)).backupRows.find((candidate) => candidate.id === id);
  if (!row) throw new Error(`the backup page should publish its ${id} row`);
  await tapCanvas(page, row.point);
}

test("a save exported to a file restores into an empty browser and survives a reload", async ({
  page,
  browser,
}) => {
  const errors = collectErrors(page);
  await seedSaveWithTwoProfiles(page);
  await openHub(page);
  await openBackupPage(page);

  // Stage: the export. The wait is armed before the tap, because the download
  // starts inside the pointerdown handler.
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    tapBackupRow(page, "export"),
  ]);

  expect(
    download.suggestedFilename(),
    "the file should be named for the app and the local day",
  ).toMatch(/^aby-little-lab-backup-\d{4}-\d{2}-\d{2}\.json$/);
  const downloadPath = await download.path();
  if (!downloadPath) throw new Error("the export should land a file on disk");
  expect(await stickerCount(page), "the exporting device keeps its own save").toBe(2);

  // Stage: a second device. A fresh context has no storage and no service
  // worker of the first one's, so this is the "new tablet" case, not a reload.
  const origin = new URL(page.url()).origin;
  const second = await browser.newContext();
  try {
    const secondPage = await second.newPage();
    const secondErrors = collectErrors(secondPage);
    await secondPage.goto(`${origin}/?e2e=1`);
    await settleHub(secondPage);

    // The empty device: one default profile, nothing earned.
    expect(await profileCount(secondPage), "the new device starts with one profile").toBe(1);
    expect(await stickerCount(secondPage), "the new device starts with no stickers").toBe(0);

    await openBackupPage(secondPage);
    const [chooser] = await Promise.all([
      secondPage.waitForEvent("filechooser"),
      tapBackupRow(secondPage, "restore"),
    ]);
    // The file that was just downloaded, not a rebuilt copy of it.
    await chooser.setFiles(downloadPath);

    await expect
      .poll(async () => (await settingsState(secondPage)).choices.length, {
        message: "an accepted file should offer merge or replace",
        timeout: 10_000,
      })
      .toBe(2);
    const choices = (await settingsState(secondPage)).choices;
    expect(choices.map((choice) => choice.id)).toEqual(["merge", "replace"]);

    const merge = choices.find((choice) => choice.id === "merge");
    if (!merge) throw new Error("the choice card should publish its Merge button");
    // A completed import starts the app again; wait for that navigation rather
    // than sleeping past it, then for the same shell a player would see.
    await Promise.all([
      secondPage.waitForEvent("framenavigated"),
      tapCanvas(secondPage, merge.point),
    ]);
    await settleHub(secondPage);

    // AC-3: both children came across, each with its own record. The empty
    // device's `p1` is merged into and `p2` is appended — that append is the
    // branch a cross-device restore exists for.
    expect(await profileCount(secondPage), "the merge brings the second child too").toBe(2);
    // The bridge counts the ACTIVE profile's stickers, and a merge keeps this
    // device's active child (`p1`), so the chip is p1's two; the four across
    // both children are counted from storage below.
    expect(await stickerCount(secondPage), "the active child keeps both stickers").toBe(2);
    const restored = (await readStoredV2(secondPage)) as {
      profiles?: Array<{
        id?: string;
        stickers?: Record<string, { earned?: boolean }>;
        progress?: Record<string, { plays?: number }>;
        insights?: { currentStreakDays?: number; bestStreakDays?: number };
      }>;
    } | null;
    const profiles = restored?.profiles ?? [];
    const merged = profiles.find((profile) => profile.id === "p1");
    const appended = profiles.find((profile) => profile.id === "p2");
    if (!merged || !appended) throw new Error("the restored device should hold both children");
    expect(merged.progress?.["shape-sorter"]?.plays, "progress should survive the trip").toBe(3);
    expect(merged.insights?.currentStreakDays, "the streak should survive the trip").toBe(3);
    expect(
      appended.progress?.["animal-trace"]?.plays,
      "the appended child keeps its own progress",
    ).toBe(2);
    expect(appended.insights?.bestStreakDays, "the appended child keeps its own best streak").toBe(
      2,
    );
    const earned = profiles.reduce(
      (total, profile) =>
        total + Object.values(profile.stickers ?? {}).filter((sticker) => sticker.earned).length,
      0,
    );
    expect(earned, "all four earned stickers arrive, two per child").toBe(4);

    // And it is still a playable app, not just a repaired save: the hub takes a
    // tap and one game opens and closes.
    await launchGame(secondPage, 0, "ShapeSorter");
    await returnToHub(secondPage);

    expect(secondErrors, "the restoring device should log no page or console errors").toEqual([]);
  } finally {
    await second.close();
  }

  expect(errors, "the exporting device should log no page or console errors").toEqual([]);
});

test("a file that is not a backup is refused, and nothing is written", async ({ page }) => {
  const errors = collectErrors(page);
  await seedSaveWithTwoProfiles(page);
  await openHub(page);
  await openBackupPage(page);

  const before = await stickerCount(page);
  const [chooser] = await Promise.all([
    page.waitForEvent("filechooser"),
    tapBackupRow(page, "restore"),
  ]);
  // Bytes supplied in memory, so no fixture file has to exist on disk. A real
  // Buffer, not a Uint8Array: Playwright base64-encodes the bytes for the page
  // and a typed array does not survive that step.
  await chooser.setFiles({
    name: "not-a-backup.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("hello"),
  });

  // The sentence `backupFormat.ts` writes for `unreadable-json`, on the result
  // line where a parent reads it.
  const refusal =
    "The file could not be read. It may be damaged, or it may not be a backup at all.";
  await expect
    .poll(async () => (await settingsState(page)).backupResult, {
      message: "an unreadable file should be refused with the parent's sentence",
      timeout: 10_000,
    })
    .toBe(refusal);

  const after = await settingsState(page);
  expect(after.choices, "a refused file must not offer merge or replace").toEqual([]);
  expect(await stickerCount(page), "the refused file must not change the save").toBe(before);
  expect(await profileCount(page), "the refused file must not change the profiles").toBe(2);

  expect(errors).toEqual([]);
});
