import { readFileSync } from "node:fs";
import { expect, type Page, test } from "@playwright/test";
import { holdCanvasUntil, tapCanvas } from "../fixtures/canvas";
import {
  activeSceneKey,
  collectErrors,
  launchGame,
  openHub,
  profileCount,
  recoverState,
  returnToHub,
  settingsState,
  settleHub,
} from "../fixtures/game";

/**
 * The crash path, end to end (FR-13, AC-10).
 *
 * Every other journey proves the app does something right. This one proves what
 * happens when it breaks: an error raised *inside the page* is recorded, the
 * broken scene is replaced by the card, a tap on that card reloads the app, and
 * the log the recovery wrote comes back out of Settings as a file a parent can
 * read. The crash is never injected through a test hook - the `?e2e=1` bridge is
 * read-only, and a bridge that could throw would be a crash button rather than a
 * mirror.
 *
 * The card's tap is also the *only* reload in the first test. Calling
 * `page.reload()` after the tap would pass whether or not `reloadOnce()` is
 * wired, which is the whole thing being proved.
 */

test.setTimeout(120_000);

/** The sentence the panel shows when there is nothing to write (FR-9). */
const NO_CRASHES = "No crashes have been recorded on this device.";

/** The message the page throws, asserted in the console and in the file. */
const PROBE = "journey crash probe";

/** Holds the parental gate and switches to the page carrying the crash log. */
async function openDiagnosticsPage(page: Page): Promise<void> {
  const closed = await settingsState(page);
  if (!closed.gate) throw new Error("the hub should publish the settings gate");
  await holdCanvasUntil(page, closed.gate, async () => (await settingsState(page)).open);

  const opened = await settingsState(page);
  await tapCanvas(page, opened.switchPage);
  await expect
    .poll(() => settingsState(page).then((state) => state.page), {
      message: "the switch card should open the backup page",
      timeout: 5_000,
    })
    .toBe(1);
}

/** Taps the diagnostics row from the panel's own published point. */
async function tapDiagnosticsRow(page: Page): Promise<void> {
  const state = await settingsState(page);
  const row = state.backupRows.find((candidate) => candidate.id === "diagnostics");
  if (!row) throw new Error("page two should publish the diagnostics row");
  await tapCanvas(page, row.point);
}

test("a crash shows the card, its tap restores the app, and the log downloads", async ({
  page,
}) => {
  const errors = collectErrors(page);
  await openHub(page);

  // A throw inside a timer reaches `window.onerror` as an `ErrorEvent`, which is
  // exactly the shape a real crash produces. Throwing directly inside
  // `page.evaluate` would reject the evaluate call in the runner instead of
  // reaching the page's own handler, and would prove nothing.
  await page.evaluate(() => {
    setTimeout(() => {
      throw new Error("journey crash probe");
    }, 0);
  });

  // The proof the handler ran, recorded, and replaced the broken scene: the
  // marker is the card being the scene Phaser is showing.
  await expect
    .poll(() => activeSceneKey(page), {
      message: "the crash handler should replace the broken scene with the recovery card",
      timeout: 10_000,
    })
    .toBe("Recover");

  const card = await recoverState(page);
  if (!card) throw new Error("the recovery card should publish the button it drew");

  // A parent's tap, from the card's own layout. The reload is the card's.
  await Promise.all([page.waitForEvent("framenavigated"), tapCanvas(page, card.button)]);
  await settleHub(page);

  // The app still works: one profile, a game launched and left, all after a real
  // crash and a real reload.
  expect(await profileCount(page)).toBe(1);
  await launchGame(page, 0, "ShapeSorter");
  await returnToHub(page);

  await openDiagnosticsPage(page);

  const [download] = await Promise.all([
    // Armed before the tap: the file starts inside the pointerdown handler.
    page.waitForEvent("download"),
    tapDiagnosticsRow(page),
  ]);

  const filename = download.suggestedFilename();
  expect(filename).toMatch(/^diagnostics-\d{4}-\d{2}-\d{2}\.txt$/);

  // Read the text the parent would read. The backup journey leans on the file
  // the picker accepted; there is no picker here, so the file's own words are
  // the only proof that what was downloaded is the crash history.
  const path = await download.path();
  if (!path) throw new Error("the diagnostics download should land a file on disk");
  const report = readFileSync(path, "utf8");

  expect(report).toContain(PROBE);
  expect(report).toContain("Aby's Little Lab diagnostics");
  expect(report).toContain("App version:");

  await expect
    .poll(async () => (await settingsState(page)).backupResult, {
      message: "the panel should report the file it wrote",
      timeout: 10_000,
    })
    .toBe(`Saved ${filename}`);

  // The crash is expected, so this file cannot assert a silent console. What it
  // asserts instead is that the crash was seen by the page's own handler.
  expect(errors.some((text) => text.includes(PROBE))).toBe(true);
});

test("an empty log writes nothing, and the row says so", async ({ page }) => {
  const errors = collectErrors(page);
  await openHub(page);
  await openDiagnosticsPage(page);

  // A context that never crashed. The download is armed before the tap because
  // "no event" is the assertion: awaiting the tap first would start the clock
  // after the only moment the file could have been produced.
  const download = page.waitForEvent("download", { timeout: 2_000 }).catch(() => null);
  await tapDiagnosticsRow(page);

  expect(await download).toBeNull();
  await expect
    .poll(async () => (await settingsState(page)).backupResult, {
      message: "an empty log should end on the panel's own sentence",
      timeout: 10_000,
    })
    .toBe(NO_CRASHES);

  expect(errors).toEqual([]);
});
