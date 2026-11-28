import { expect, type Page, test } from "@playwright/test";
import { holdCanvasUntil, tapCanvas } from "../fixtures/canvas";
import { collectErrors, openHub, reloadHub, settingsState } from "../fixtures/game";

/**
 * FR-1 / AC-1 and AC-4: the pace chip is a parent-facing control beside the
 * voice row, and the choice belongs to the active profile rather than the
 * current visit. The journey taps the chip's published centre — a layout
 * number copied into the test would stop being the control the parent sees.
 */

async function openSettings(page: Page): Promise<void> {
  await openHub(page);
  const initial = await settingsState(page);
  if (!initial.gate) throw new Error("the hub should publish its Settings control");
  await holdCanvasUntil(page, initial.gate, async () => (await settingsState(page)).open);
  expect(await settingsState(page), "the parental panel should be open").toMatchObject({
    open: true,
  });
}

test("the pace chip cycles presets and the choice survives a reload", async ({ page }) => {
  const errors = collectErrors(page);
  await openSettings(page);

  const initial = await settingsState(page);
  expect(initial.narrationPace, "a fresh profile starts at Gentle").toBe("gentle");
  if (!initial.pace) throw new Error("the open panel should publish its pace chip");

  await tapCanvas(page, initial.pace);
  await expect
    .poll(async () => (await settingsState(page)).narrationPace, {
      message: "tapping the chip should move to the next preset",
      timeout: 5_000,
    })
    .toBe("standard");

  // Everything in memory is gone; only what the active profile persisted
  // can make the rebuilt chip read "Standard" again.
  await reloadHub(page);
  await openSettings(page);
  expect(
    (await settingsState(page)).narrationPace,
    "the active profile's pace should follow the child across visits",
  ).toBe("standard");

  expect(errors, "changing pace and reloading should log no page or console errors").toEqual([]);
});
