#!/usr/bin/env node

/**
 * Boot-Time Validation Script for Aby's Little Lab
 *
 * Measures the production boot time of the built app (dist/) in a real
 * headless Chromium and fails if the median cold-boot exceeds the 3 s
 * product budget (product.md NFR: boot < 3 s).
 *
 * Methodology (matches docs/perf-baseline.md):
 *   - Requires the production build to ALREADY be served at
 *     http://localhost:4173 (CI starts `vite preview` as its own step; the
 *     script does not spawn it — spawning the server from the measuring
 *     process destabilizes the CDP transport on Windows).
 *   - Run 3 cold loads, each in a FRESH browser context (in-context reloads
 *     are contaminated by the service worker + CDP overhead).
 *   - Metric: Navigation Timing `duration` sampled after the game canvas is
 *     live and settled, i.e. the same number recorded in perf-baseline.md.
 *   - The MEDIAN of the 3 samples gates the verdict.
 *
 * Browser resolution order (playwright-core ships no browsers):
 *   1. Default playwright registry (local dev machines with browsers
 *      installed, e.g. via the playwright CLI).
 *   2. System Chrome via channel "chrome" (GitHub ubuntu runners).
 *   3. System Edge via channel "msedge" (Windows fallback).
 *   4. BOOT_BROWSER_PATH environment variable (explicit executable).
 *
 * Usage: node scripts/validate-boot.js   (run `pnpm run build` first)
 */

import fs from "node:fs";
import { get } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);

const DIST_DIR = path.join(path.dirname(__filename), "..", "dist");
if (!fs.existsSync(path.join(DIST_DIR, "index.html"))) {
  console.error("FAIL: dist/index.html not found — run 'pnpm run build' before validate-boot.");
  process.exit(1);
}

const PORT = 4173;
const URL = `http://localhost:${PORT}/`;
/** Hard budget from product.md: boot < 3 s. */
const BOOT_BUDGET_MS = Number(process.env.BOOT_BUDGET_MS ?? 3000);
/** Cold-load samples; the median gates the verdict (per perf-baseline method). */
const SAMPLES = Number(process.env.BOOT_SAMPLES ?? 3);
/** How long to wait after `load` before reading Navigation Timing (ms). */
const SETTLE_MS = 5000;

async function waitForServer(url, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      await new Promise((resolve, reject) => {
        const req = get(url, (res) => {
          res.resume();
          resolve();
        });
        req.on("error", reject);
        req.setTimeout(2000, () => {
          req.destroy();
          reject(new Error("timeout"));
        });
      });
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  throw new Error(`preview server did not become ready at ${url}`);
}

async function launchBrowser() {
  const { chromium } = await import("playwright-core");
  const attempts = [
    {}, // Local dev: playwright-registry-managed browsers.
    { channel: "chrome" }, // GitHub ubuntu runners ship Google Chrome.
    { channel: "msedge" },
    ...(process.env.BOOT_BROWSER_PATH ? [{ executablePath: process.env.BOOT_BROWSER_PATH }] : []),
  ];
  let lastError;
  for (const options of attempts) {
    try {
      return await chromium.launch(options);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

/** One cold load in a fresh context; returns Navigation Timing duration (ms). */
async function measureOnce(browser) {
  const context = await browser.newContext({
    viewport: { width: 1024, height: 768 },
  });
  try {
    const page = await context.newPage();
    await page.goto(URL, { waitUntil: "load", timeout: 60000 });
    await page.waitForSelector("canvas", { timeout: 30000 });
    for (let waited = 0; waited < SETTLE_MS; waited += 1000) {
      await page.waitForTimeout(1000);
      if (process.env.BOOT_DEBUG) {
        console.log(
          `[debug] t+${waited + 1000}ms connected=${browser.isConnected()} pageClosed=${page.isClosed()}`,
        );
      }
    }
    return await page.evaluate(() => {
      const nav = performance.getEntriesByType("navigation")[0];
      return nav ? nav.duration : performance.now();
    });
  } finally {
    await context.close();
  }
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

let failures = 0;
try {
  await waitForServer(URL, 5000);
  let browser = await launchBrowser();
  const samples = [];
  const maxSamples = SAMPLES + 2; // tolerate transient context/transport flakes
  for (let i = 0; samples.length < SAMPLES && i < maxSamples; i++) {
    try {
      const ms = await measureOnce(browser);
      samples.push(ms);
      console.log(`sample ${samples.length}/${SAMPLES}: ${ms.toFixed(0)} ms`);
    } catch (error) {
      console.warn(
        `sample ${i + 1} failed (${String(error?.message ?? error).split("\n")[0]}); retrying with a fresh context`,
      );
      if (!browser.isConnected()) {
        console.warn("browser died — relaunching");
        await browser.close().catch(() => {});
        browser = await launchBrowser();
      }
    }
  }
  await browser.close();

  if (samples.length === 0) {
    console.error("FAIL: no successful boot sample could be measured.");
    failures++;
  } else {
    const med = median(samples);
    const medSec = (med / 1000).toFixed(2);
    if (med <= BOOT_BUDGET_MS) {
      console.log(
        `PASS: median boot ${medSec} s over ${samples.length} cold loads (<= ${(BOOT_BUDGET_MS / 1000).toFixed(1)} s budget)`,
      );
    } else {
      console.error(
        `FAIL: median boot ${medSec} s over ${samples.length} cold loads exceeds the ${(BOOT_BUDGET_MS / 1000).toFixed(1)} s budget`,
      );
      failures++;
    }
  }
} catch (error) {
  console.error(`FAIL: boot measurement could not run: ${error?.message ?? error}`);
  console.error(
    "Hint: serve dist/ first — `node node_modules/vite/bin/vite.js preview --port 4173 --strictPort` (or `pnpm exec vite preview ...`) — then re-run this script.",
  );
  failures++;
}

if (failures > 0) {
  console.error(`\nBoot validation failed: ${failures} check(s) failed.`);
  process.exit(1);
} else {
  console.log("\nAll boot validation checks passed!");
  process.exit(0);
}
