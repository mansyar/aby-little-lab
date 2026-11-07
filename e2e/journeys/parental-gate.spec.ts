import { expect, test } from "@playwright/test";
import { holdCanvas, holdCanvasUntil, tapCanvas } from "../fixtures/canvas";
import {
  activeSceneKey,
  collectErrors,
  hubTiles,
  openHub,
  reloadHub,
  SETTINGS_SHORT_PRESS_MS,
  settingsState,
} from "../fixtures/game";
import { readStoredSettings } from "../fixtures/shell";

/**
 * FR-5 / AC-5 and FR-6 / AC-6: the parental gate and the settings it guards.
 *
 * Both journeys hold the *published* control, which is where a parent's finger
 * actually goes — the label the gate is armed on — rather than a layout number
 * copied out of the settings code.
 */

test("a three-second hold opens settings and a one-second press does not", async ({ page }) => {
  const errors = collectErrors(page);
  await openHub(page);

  const initial = await settingsState(page);
  if (!initial.gate) throw new Error("the hub should publish its Settings control");
  expect(initial.open, "the settings panel should start closed").toBe(false);

  // Stage: a one-second press. The watch runs past the three-second mark from
  // the press, so a hold timer that was never cancelled would be seen firing
  // late instead of passing as "it must not have opened by now".
  await holdCanvas(page, initial.gate, SETTINGS_SHORT_PRESS_MS);

  const openedAfterShortPress: boolean[] = [];
  for (let sample = 0; sample < 12; sample += 1) {
    openedAfterShortPress.push((await settingsState(page)).open);
    await page.waitForTimeout(250);
  }
  expect(
    openedAfterShortPress.some(Boolean),
    `a one-second press must never open the parental panel; sampled open=${openedAfterShortPress.join(",")}`,
  ).toBe(false);
  expect(await activeSceneKey(page), "a one-second press must leave the hub in place").toBe("Hub");
  expect((await settingsState(page)).gate, "the gate should still be armed afterwards").toEqual(
    initial.gate,
  );

  // Stage: the full hold, on the same point, in the same visit.
  await holdCanvasUntil(page, initial.gate, async () => (await settingsState(page)).open);
  expect(
    (await settingsState(page)).open,
    "a three-second hold on the Settings control should open the parental panel",
  ).toBe(true);

  const opened = await settingsState(page);
  expect(
    opened.toggles.map((toggle) => toggle.id),
    "the open panel should publish the toggle rows it is showing",
  ).toEqual(["bgm", "sfx", "adaptive"]);
  expect(await activeSceneKey(page), "the panel opens over the hub; it does not navigate").toBe(
    "Hub",
  );

  expect(errors, "the parental gate should log no page or console errors").toEqual([]);
});

test("a settings toggle survives a reload and the game still boots", async ({ page }) => {
  const errors = collectErrors(page);
  await openHub(page);

  const initial = await settingsState(page);
  if (!initial.gate) throw new Error("the hub should publish its Settings control");

  await holdCanvasUntil(page, initial.gate, async () => (await settingsState(page)).open);
  expect(
    (await settingsState(page)).open,
    "the parental panel should be open before its rows are touched",
  ).toBe(true);

  const row = (await settingsState(page)).toggles.find((toggle) => toggle.id === "adaptive");
  if (!row) throw new Error("the open panel should publish its Adaptive row");
  expect(row.on, "Adaptive is on by default, so flipping it to off is observable").toBe(true);

  // Stage: flip the switch through its published tap band.
  await tapCanvas(page, row);
  const readRow = async (): Promise<boolean | null> =>
    (await settingsState(page)).toggles.find((toggle) => toggle.id === "adaptive")?.on ?? null;
  await expect
    .poll(readRow, {
      message: "tapping the Adaptive row should flip the switch it publishes",
      timeout: 5_000,
    })
    .toBe(false);

  expect(
    (await readStoredSettings(page))?.adaptiveDifficulty,
    "the flip should be written to the app's own payload, not just drawn",
  ).toBe(false);

  // Stage: the reload AC-6 is about. Everything in memory is gone; only what
  // was persisted can come back.
  await reloadHub(page);
  expect(await activeSceneKey(page), "the reloaded page should boot back into the hub").toBe("Hub");
  expect(
    (await hubTiles(page)).length,
    "the reloaded hub should still show its game tiles",
  ).toBeGreaterThan(0);

  const afterReload = await settingsState(page);
  expect(afterReload.open, "the panel should not come back open across a reload").toBe(false);
  if (!afterReload.gate)
    throw new Error("the reloaded hub should publish its Settings control again");

  // Stage: read the value back through the app, not from storage.
  await holdCanvasUntil(page, afterReload.gate, async () => (await settingsState(page)).open);
  expect((await settingsState(page)).open, "the panel should reopen after the reload").toBe(true);

  const restored = (await settingsState(page)).toggles.find((toggle) => toggle.id === "adaptive");
  expect(
    restored?.on,
    "the switched-off setting should still be off after the reload, read from the panel it rebuilds",
  ).toBe(false);

  expect(errors, "opening settings and reloading should log no page or console errors").toEqual([]);
});
