import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import type { E2ESettingsState } from "../../src/game/e2eBridge";
import { holdCanvasUntil } from "../fixtures/canvas";
import {
  activeSceneKey,
  collectErrors,
  dismissHubToast,
  hubTiles,
  launchGame,
  openHub,
  reloadHub,
  roundIndex,
  settingsState,
  stickerCount,
  waitForHubReady,
  waitForScene,
} from "../fixtures/game";
import { traceCurrentPath } from "../fixtures/trace";

/**
 * FR-7 / AC-7: a device that cannot save still plays, and the parent is told.
 *
 * Only the two `Storage` methods the save layer calls are replaced, and on the
 * prototype rather than on `window.localStorage`: the preview server, the
 * service worker, Playwright's own instrumentation and every other storage
 * consumer keep working, so a failure here means the app's own degradation
 * rather than a broken page. Patching the instance instead would leave any
 * later-obtained `localStorage` reference — and `sessionStorage` — untouched.
 *
 * Console errors are excluded from the collected failures: a refused write is
 * the condition under test, the same way the offline journey excludes a failed
 * fetch. Only an uncaught page error is a defect here.
 */
test.describe("storage refusal", () => {
  test("a child finishes a game on a device that cannot save, and the parent is told", async ({
    page,
  }) => {
    test.setTimeout(180_000);
    const errors = collectErrors(page, { console: false });
    await refuseStorage(page, ["setItem"]);
    await openHub(page);

    // The device refuses from the first write, so the session is degraded
    // before a single tap — and the hub still boots to a playable board.
    expect(await activeSceneKey(page)).toBe("Hub");
    expect(await stickerCount(page), "a fresh profile starts with no stickers").toBe(0);

    await launchGame(page, 1, "AnimalTrace");
    expect(await roundIndex(page)).toBe(0);
    for (let round = 0; round < 3; round += 1) {
      await traceCurrentPath(page, round);
    }

    // AC-2 in a browser: the win is celebrated, the sticker is awarded in memory
    // and the game hands the child back on its own, because no refusal from the
    // store ever reaches the scene.
    await expect
      .poll(() => stickerCount(page), {
        message: "winning should award exactly one sticker even though nothing is saved",
        timeout: 10_000,
      })
      .toBe(1);
    await waitForScene(page, "Hub", 10_000);
    expect(
      await stickerCount(page),
      "the sticker is held for the session even though the write was refused",
    ).toBe(1);

    // The same device, a fresh load: blocked persistence must not blank the
    // canvas or fail the boot.
    await reloadHub(page);
    expect(await activeSceneKey(page)).toBe("Hub");
    expect((await hubTiles(page)).length).toBeGreaterThan(0);

    // The parent-facing half: the panel states the fact while the store refuses.
    const state = await openSettings(page);
    expect(state.degraded, "the panel should say progress is not being saved").toBe(true);

    expect(errors, "a device that cannot save should log no uncaught page errors").toEqual([]);
  });

  test("a device that blocks storage entirely still boots a playable hub", async ({ page }) => {
    test.setTimeout(120_000);
    const errors = collectErrors(page, { console: false });
    // A private window or blocked site data refuses every access, reads first.
    await refuseStorage(page, ["getItem", "setItem"]);
    await openHub(page);

    expect(await activeSceneKey(page)).toBe("Hub");
    expect((await hubTiles(page)).length).toBeGreaterThan(0);

    // A throwing read is the same degraded session as a throwing write, so the
    // parent is told here too.
    const state = await openSettings(page);
    expect(state.degraded, "a blocked read should raise the same notice").toBe(true);

    expect(errors, "blocked storage should log no uncaught page errors").toEqual([]);
  });

  test("a working device sees no notice", async ({ page }) => {
    test.setTimeout(120_000);
    const errors = collectErrors(page, { console: false });
    await openHub(page);

    const state = await openSettings(page);
    expect(state.open, "the panel should be up for a device that saves").toBe(true);
    expect(state.degraded, "nothing should be reported when the store accepts writes").toBe(false);

    expect(errors, "a working device should log no uncaught page errors").toEqual([]);
  });
});

/**
 * Replaces the named `Storage` prototype methods with a thrower that fails the
 * way a full quota does. Runs before every navigation, so a reload is refused
 * in exactly the same way.
 */
async function refuseStorage(page: Page, methods: Array<"getItem" | "setItem">): Promise<void> {
  await page.addInitScript((names: string[]) => {
    const refuse = () => {
      throw new DOMException("simulated quota", "QuotaExceededError");
    };
    for (const name of names) {
      if (name === "getItem") Storage.prototype.getItem = refuse;
      else Storage.prototype.setItem = refuse;
    }
  }, methods);
}

/**
 * Opens the parental panel the way a parent does: by holding the settings gate
 * until the panel itself reports it is up, never for a fixed duration.
 */
async function openSettings(page: Page): Promise<E2ESettingsState> {
  // A toast would sit over the gate and absorb the hold.
  await dismissHubToast(page);
  await waitForHubReady(page);
  const { gate } = await settingsState(page);
  if (!gate) throw new Error("the hub published no settings gate");
  await holdCanvasUntil(page, gate, async () => (await settingsState(page)).open);
  return settingsState(page);
}
