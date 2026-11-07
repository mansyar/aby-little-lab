import { expect, test } from "@playwright/test";
import {
  collectErrors,
  dismissHubToast,
  hubReady,
  hubToast,
  waitForHubReady,
} from "../fixtures/game";

/**
 * The suite's smoke journey: the built artifact boots into the hub.
 *
 * Everything here polls state rather than waiting a fixed time. A loaded CI
 * host can take several seconds to start Phaser, and a fixed sleep would turn
 * that into a false red instead of a longer pass.
 */
test("boots the built artifact into the hub", async ({ page }) => {
  // Collected across the whole journey: a clean boot logs no error, and if
  // Phaser does write one we want the suite to say so rather than hide it.
  const failures = collectErrors(page);

  await page.goto("/?e2e=1");

  const canvas = page.locator("canvas");
  await expect(canvas).toBeVisible();

  const size = await canvas.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  });
  expect(size.width, "the canvas should have a non-zero width").toBeGreaterThan(0);
  expect(size.height, "the canvas should have a non-zero height").toBeGreaterThan(0);

  // 1024x768 with Scale.FIT: at a 16:9 viewport the canvas is letterboxed, and
  // the rendered box must still be 4:3 to within a pixel.
  expect(
    Math.abs(size.height - (size.width * 3) / 4),
    `canvas ${size.width}x${size.height} should be 4:3`,
  ).toBeLessThanOrEqual(1);

  await expect
    .poll(() => page.evaluate(() => typeof window.__abyE2E), {
      message: "?e2e=1 should install the read-only bridge",
      timeout: 15_000,
    })
    .toBe("object");

  // The first readiness sample is taken inside the page, at the instant the hub
  // becomes the active scene, so it is not lost to a round-trip delay: the
  // tiles' entrance tweens take about a second, and sampling from the driver
  // could arrive after they have already settled on a fast host.
  const readyOnArrival = await page.evaluate(
    () =>
      new Promise<"pending" | "ready" | "timeout">((resolve) => {
        const bridge = window.__abyE2E;
        if (!bridge) {
          resolve("timeout");
          return;
        }
        const deadline = performance.now() + 30_000;
        const sample = () => {
          if (performance.now() > deadline) {
            resolve("timeout");
            return;
          }
          if (bridge.activeSceneKey() !== "Hub") {
            window.setTimeout(sample, 5);
            return;
          }
          resolve(bridge.hubReady() ? "ready" : "pending");
        };
        sample();
      }),
  );

  expect(
    readyOnArrival,
    "the hub should report itself not ready for input on arrival, while its tiles enter",
  ).toBe("pending");

  await waitForHubReady(page);
  expect(
    await hubReady(page),
    "the hub should report ready once every tile has finished entering",
  ).toBe(true);

  // A first visit installs the service worker, so the hub announces offline
  // readiness with a toast drawn over the tiles. It arrives after the hub, so
  // poll for it rather than sampling once. It is left up on purpose: the
  // journey has to prove it is reported, or a panel that eats the next tap
  // would look like a dead tile.
  await expect
    .poll(() => hubToast(page), {
      message: "a first visit should report the offline-ready toast and its dismiss button",
      timeout: 20_000,
    })
    .not.toBeNull();

  await dismissHubToast(page);

  expect(
    await hubToast(page),
    "the toast should be gone once its published button is tapped",
  ).toBeNull();

  expect(failures, "a clean boot should log no page or console errors").toEqual([]);
});
