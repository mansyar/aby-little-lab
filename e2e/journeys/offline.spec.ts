import { expect, test } from "@playwright/test";
import {
  activeSceneKey,
  collectErrors,
  hubTiles,
  launchGame,
  openHub,
  reloadHub,
} from "../fixtures/game";
import { serviceWorkerControlled, waitForServiceWorkerReady } from "../fixtures/shell";

/**
 * FR-8 / AC-8: once installed, the app relaunches with no network.
 *
 * The network is cut for the whole browser context, not for the page, so the
 * reload a player gets from a home-screen icon is the one exercised: nothing
 * can reach the preview server, and whatever the service worker precached is
 * all there is.
 *
 * Console errors are not asserted here, only uncaught page errors: an offline
 * relaunch may legitimately log a failed fetch for something optional, and the
 * claim under test is that the shell and a game still work — not that the
 * offline mode has no noisy edges.
 */

test("the hub and a game still relaunch with the network offline", async ({ page, context }) => {
  test.setTimeout(120_000);

  const failures = collectErrors(page, { console: false });
  await openHub(page);

  // Stage: the worker must be installed *and* driving this document before the
  // network is cut, or the reload below would simply fail to resolve.
  await waitForServiceWorkerReady(page);
  if (!(await serviceWorkerControlled(page))) {
    // A document navigated before the worker activated is uncontrolled until
    // the next navigation, which is the reload a relaunch would perform anyway.
    await reloadHub(page);
  }
  await expect
    .poll(() => serviceWorkerControlled(page), {
      message: "the service worker should control the page before the network is cut",
      timeout: 30_000,
    })
    .toBe(true);

  try {
    await context.setOffline(true);

    // Stage: relaunch offline.
    await reloadHub(page);
    expect(await activeSceneKey(page), "the hub should boot from the cache while offline").toBe(
      "Hub",
    );
    expect(
      (await hubTiles(page)).length,
      "the cached hub should still show its game tiles",
    ).toBeGreaterThan(0);

    // Stage: launch one game from the cache and prove the navigated scene.
    await launchGame(page, 1, "AnimalTrace");
    expect(await activeSceneKey(page), "a game should launch from the cache while offline").toBe(
      "AnimalTrace",
    );
  } finally {
    await context.setOffline(false);
  }

  expect(failures, "an offline relaunch should throw no uncaught page errors").toEqual([]);
});
