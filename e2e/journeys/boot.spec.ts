import { expect, test } from "@playwright/test";

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
  const failures: string[] = [];
  page.on("pageerror", (error) => {
    failures.push(`pageerror: ${error.message}`);
  });
  page.on("console", (message) => {
    if (message.type() === "error") failures.push(`console.error: ${message.text()}`);
  });

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

  // The bridge is what makes a canvas-only UI observable; no bridge means the
  // suite is testing nothing.
  await expect
    .poll(() => page.evaluate(() => typeof window.__abyE2E), {
      message: "?e2e=1 should install the read-only bridge",
      timeout: 15_000,
    })
    .toBe("object");

  // The bridge reports null during the boot transition (Boot -> Preload -> Hub),
  // so poll for the destination rather than sampling once.
  await expect
    .poll(() => page.evaluate(() => window.__abyE2E?.activeSceneKey() ?? null), {
      message: "the active scene should settle on the hub",
      timeout: 30_000,
    })
    .toBe("Hub");

  expect(failures, "a clean boot should log no page or console errors").toEqual([]);
});
