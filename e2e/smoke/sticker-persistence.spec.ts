import { expect, type Page, test } from "@playwright/test";
import { GAME_REGISTRY } from "../../src/game/gameRegistry";
import {
  collectErrors,
  launchGame,
  openHub,
  reloadHub,
  roundIndex,
  stickerCount,
  waitForPlayableRound,
  waitForScene,
} from "../fixtures/game";
import { readStoredV2 } from "../fixtures/shell";
import { traceCurrentPath } from "../fixtures/trace";

/**
 * Cross-engine persistence smoke: earn one sticker through real play, then
 * prove a normal reload restores it. Kept out of the full Chromium roster,
 * which already has a broader completion journey.
 */
test("an earned sticker survives a reload", async ({ page }, testInfo) => {
  test.setTimeout(180_000);

  const viewport = page.viewportSize();
  expect(viewport, "every browser project should declare a viewport").not.toBeNull();
  expect(viewport?.width ?? 0, "cross-engine smoke runs in landscape").toBeGreaterThan(
    viewport?.height ?? 0,
  );
  if (testInfo.project.name === "mobile-chromium") {
    expect(
      await page.evaluate(() => navigator.maxTouchPoints),
      "mobile Chromium should expose real touch input",
    ).toBeGreaterThan(0);
  }

  const errors = collectErrors(page);
  await openHub(page);
  expect(await stickerCount(page), "a fresh profile starts with no stickers").toBe(0);

  const animalTraceIndex = GAME_REGISTRY.findIndex((entry) => entry.sceneKey === "AnimalTrace");
  expect(animalTraceIndex, "Animal Trace should remain in the registry").toBeGreaterThanOrEqual(0);
  await launchGame(page, animalTraceIndex, "AnimalTrace");
  expect(await roundIndex(page)).toBe(0);

  for (let round = 0; round < 3; round += 1) {
    await waitForPlayableRound(page, round);
    await traceCurrentPath(page, round);
  }

  await expect
    .poll(() => stickerCount(page), {
      message: "winning should award exactly one sticker",
      timeout: 10_000,
    })
    .toBe(1);
  expect(await animalTraceStickerEarned(page), "the earned sticker should be on disk").toBe(true);

  await waitForScene(page, "Hub", 10_000);
  await reloadHub(page);
  expect(await stickerCount(page), "the earned sticker should survive a normal reload").toBe(1);
  expect(await animalTraceStickerEarned(page), "the reloaded profile should still own it").toBe(
    true,
  );

  expect(errors, "earning and restoring a sticker should log no page or console errors").toEqual(
    [],
  );
});

/** Reads the app's own persisted v2 payload rather than inferring from the UI. */
async function animalTraceStickerEarned(page: Page): Promise<boolean> {
  const stored = await readStoredV2(page);
  const profiles = stored?.profiles;
  if (!Array.isArray(profiles)) return false;
  const stickers = (profiles[0] as { stickers?: Record<string, { earned?: boolean }> } | undefined)
    ?.stickers;
  return stickers?.["animal-trace"]?.earned === true;
}
