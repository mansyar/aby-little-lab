#!/usr/bin/env node

/**
 * Cold first-tap cost per game (NFR-1 / AC-8 evidence, not a CI gate).
 *
 * For each target game this opens a FRESH browser context (so the game chunk is
 * not cached), loads the Hub from a production preview, taps one tile and
 * records three stages on one tap:
 *
 *   A  tap -> game-chunk `responseReceived`   (chunk headers arrived)
 *   B  tap -> game-chunk `loadingFinished`    (chunk body fully downloaded)
 *   C  tap -> first animation frame after B   (total: this is the budgeted one)
 *
 * Stage C is NOT "the game is fully rendered": it is the chunk being on the
 * main thread plus one paint opportunity. The scene's own `preload` art work
 * and its first `create()` happen after that frame.
 *
 * Service workers are blocked in the measurement context so the tap's chunk
 * fetch is a real network request that CDP can see (the PWA precaches every
 * art chunk, which would otherwise satisfy the import from cache and make the
 * cold first tap unobservable).
 *
 * Timing detail: stages A and B are differences of CDP `Network` timestamps;
 * stage C is a difference of page `performance.now()` values. The tap instant
 * is anchored by a tiny `fetch` issued between `mousedown` and `mouseup` (the
 * tile only navigates on `pointerup`), so the anchor can never precede the tap.
 * The A/B vs C clock skew is printed as a diagnostic.
 *
 * Usage:
 *   pnpm preview --port 4173
 *   node scripts/measure-first-tap.mjs [--json]
 *
 *   # or let this script own the preview server (evidence suite: validate-boot,
 *   # 4x-throttled boot, then first tap — always stops the server it started)
 *   node scripts/measure-first-tap.mjs --with-preview
 *
 * Exits non-zero only when the worst game's TOTAL exceeds TOTAL_BUDGET_MS (or
 * when a measurement cannot run at all).
 */

import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const PREVIEW_PORT = 4173;
const URL_UNDER_TEST = process.env.PREVIEW_URL ?? `http://localhost:${PREVIEW_PORT}/`;
/** NFR-1: cold first tap adds <= 400 ms over the pre-track tap. */
const TOTAL_BUDGET_MS = 400;
/** NFR-5: the CI boot gate (validate-boot.js enforces this one). */
const BOOT_BUDGET_MS = 3000;
/** Perf-baseline proxy for a low-end device. */
const THROTTLE_RATE = 4;
const VIEWPORT = { width: 1024, height: 768 };
/** The game's fixed logical canvas size (see src/main.ts). */
const GAME_WIDTH = 1024;
const GAME_HEIGHT = 768;
/** Hub grid geometry, mirrored from src/game/hubGrid.ts. */
const GRID_COLS = 6;
const GRID_ROWS = 4;
const TILE_WIDTH = 144;
const TILE_HEIGHT = 116;
const TILE_SPACING = 22;
/** Let the Hub's entrance tweens settle before tapping. */
const HUB_SETTLE_MS = 2000;
/** Boot settles 5x1000 ms before sampling, as in docs/perf-baseline.md. */
const BOOT_SETTLE_MS = 5000;
const BOOT_SAMPLES = 3;
/** A missing chunk within this window means the tap did not navigate. */
const CHUNK_TIMEOUT_MS = 8000;

/**
 * Tile indexes are positions in `GAME_TILES` (src/game/hubTiles.ts). The set
 * spans three different art-group declarations plus Find the Word, the widest
 * union: seven groups and 83 keys (Word Builder, Decode It and First Sounds
 * declare the same seven). The budget is applied to the worst game, not to the
 * median across games, so one slow union cannot hide behind three fast ones.
 */
const TARGETS = [
  { name: "Shape Sorter", scene: "ShapeSorter", tileIndex: 0 },
  { name: "Find the Letter", scene: "Alphabet", tileIndex: 7 },
  { name: "Find the Word", scene: "WordMatch", tileIndex: 8 },
  { name: "Add It Up", scene: "AddItUp", tileIndex: 15 },
  { name: "Memory Match", scene: "MemoryMatch", tileIndex: 17 },
];

/** Resolves once `predicate()` returns a truthy value, polling every 5 ms. */
async function until(predicate, timeoutMs, label) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const value = await predicate();
    if (value) return value;
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${label}`);
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
}

/** Launch order matches scripts/validate-boot.js: bundled, Chrome, then Edge. */
async function launchBrowser() {
  const attempts = [{}, { channel: "chrome" }, { channel: "msedge" }];
  if (process.env.TAP_BROWSER_PATH) {
    attempts.push({ executablePath: process.env.TAP_BROWSER_PATH });
  }
  const failures = [];
  for (const options of attempts) {
    try {
      return await chromium.launch(options);
    } catch (error) {
      failures.push(`${JSON.stringify(options)}: ${error.message.split("\n")[0]}`);
    }
  }
  throw new Error(`no usable browser:\n  ${failures.join("\n  ")}`);
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

const round = (value) => Math.round(value * 10) / 10;

/** Logical tile centre -> client coordinates inside the letterboxed canvas. */
async function tilePoint(page, tileIndex) {
  const gridWidth = GRID_COLS * TILE_WIDTH + (GRID_COLS - 1) * TILE_SPACING;
  const gridHeight = GRID_ROWS * TILE_HEIGHT + (GRID_ROWS - 1) * TILE_SPACING;
  const startX = (GAME_WIDTH - gridWidth) / 2;
  const startY = (GAME_HEIGHT - gridHeight) / 2;
  const col = tileIndex % GRID_COLS;
  const row = Math.floor(tileIndex / GRID_COLS);
  const logicalX = startX + col * (TILE_WIDTH + TILE_SPACING) + TILE_WIDTH / 2;
  const logicalY = startY + row * (TILE_HEIGHT + TILE_SPACING) + TILE_HEIGHT / 2;

  const box = await page.evaluate(() => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  });
  if (!box) throw new Error("canvas disappeared");
  return {
    x: box.x + (logicalX / GAME_WIDTH) * box.width,
    y: box.y + (logicalY / GAME_HEIGHT) * box.height,
  };
}

async function measureGame(browser, target) {
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
    serviceWorkers: "block",
  });
  const page = await context.newPage();
  const client = await context.newCDPSession(page);

  /** requestId -> url, for every request started on this page. */
  const requestUrls = new Map();
  /** requestId -> { url, type, timestamp } for every response. */
  const responses = [];
  /** requestId -> loadingFinished timestamp (seconds). */
  const finishedAt = new Map();
  let onRequest = () => {};

  await client.send("Network.enable");
  client.on("Network.requestWillBeSent", (event) => {
    requestUrls.set(event.requestId, event.request.url);
    onRequest(event);
  });
  client.on("Network.responseReceived", (event) => {
    responses.push({
      requestId: event.requestId,
      url: event.response.url,
      type: event.type,
      timestamp: event.timestamp,
    });
  });
  client.on("Network.loadingFinished", (event) => {
    finishedAt.set(event.requestId, event.timestamp);
  });

  try {
    await page.goto(URL_UNDER_TEST, { waitUntil: "load", timeout: 60000 });
    await page.waitForSelector("canvas");
    await page.waitForTimeout(HUB_SETTLE_MS);

    const point = await tilePoint(page, target.tileIndex);
    const alreadyStarted = new Set(requestUrls.keys());

    // Tap: the anchor request is issued between down and up, so it can never
    // follow the pointerup that starts navigation.
    const anchor = `__tap_anchor_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    let anchorEvent = null;
    onRequest = (event) => {
      if (event.request.url.includes(anchor)) anchorEvent = event;
    };
    await page.mouse.move(point.x, point.y);
    await page.mouse.down();
    page
      .evaluate((mark) => {
        void fetch(`/?${mark}`, { cache: "no-store" }).catch(() => {});
      }, anchor)
      .catch(() => {});
    const tap = await until(() => anchorEvent, CHUNK_TIMEOUT_MS, "tap anchor request");
    // The resource-timing entry name the anchor fetch will publish.
    const anchorUrl = await page.evaluate(
      (mark) => new URL(`/?${mark}`, location.href).href,
      anchor,
    );
    await page.mouse.up();

    const chunkResponse = await until(
      () =>
        responses.find(
          (entry) =>
            entry.type === "Script" &&
            !alreadyStarted.has(entry.requestId) &&
            entry.url.endsWith(".js"),
        ),
      CHUNK_TIMEOUT_MS,
      `${target.scene} chunk response`,
    );
    const chunkFinished = await until(
      () => finishedAt.get(chunkResponse.requestId),
      CHUNK_TIMEOUT_MS,
      `${target.scene} chunk loadingFinished`,
    );

    const anchorEntry = await page.evaluate(
      (probe) =>
        new Promise((resolve, reject) => {
          const deadline = Date.now() + 2000;
          const find = () => {
            const entries = performance.getEntriesByName(probe);
            if (entries.length > 0) {
              resolve({ startTime: entries[0].startTime });
              return;
            }
            if (Date.now() > deadline) {
              reject(new Error("anchor resource timing entry never appeared"));
              return;
            }
            setTimeout(find, 5);
          };
          find();
        }),
      anchorUrl,
    );

    const firstFrame = await page.evaluate(
      () =>
        new Promise((resolve) => {
          requestAnimationFrame(() => resolve(performance.now()));
        }),
    );

    const responseMs = (chunkResponse.timestamp - tap.timestamp) * 1000;
    const finishedMs = (chunkFinished - tap.timestamp) * 1000;
    const totalMs = firstFrame - anchorEntry.startTime;

    return {
      game: target.name,
      scene: target.scene,
      chunk: chunkResponse.url.split("/").pop(),
      responseMs,
      finishedMs,
      totalMs,
      clockSkewMs: totalMs - finishedMs,
    };
  } finally {
    await context.close();
  }
}

async function measureFirstTap() {
  const browser = await launchBrowser();
  const runs = [];
  try {
    for (const target of TARGETS) {
      runs.push(await measureGame(browser, target));
    }
  } finally {
    await browser.close();
  }

  const worst = runs.reduce((current, run) => (run.totalMs > current.totalMs ? run : current));
  return {
    stages: {
      responseMs: "tap -> game chunk responseReceived (headers only)",
      finishedMs: "tap -> game chunk loadingFinished (body downloaded)",
      totalMs: "tap -> first frame after the chunk settled (budgeted)",
    },
    budgetMs: TOTAL_BUDGET_MS,
    runs: runs.map((run) => ({
      ...run,
      responseMs: round(run.responseMs),
      finishedMs: round(run.finishedMs),
      totalMs: round(run.totalMs),
      clockSkewMs: round(run.clockSkewMs),
    })),
    medians: {
      responseMs: round(median(runs.map((run) => run.responseMs))),
      finishedMs: round(median(runs.map((run) => run.finishedMs))),
      totalMs: round(median(runs.map((run) => run.totalMs))),
    },
    worst: { game: worst.game, totalMs: round(worst.totalMs) },
  };
}

/** One cold load: fresh context, `settle` then Navigation Timing `duration`. */
async function bootSample(browser, throttleRate) {
  const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1 });
  const page = await context.newPage();
  try {
    if (throttleRate > 1) {
      const client = await context.newCDPSession(page);
      await client.send("Emulation.setCPUThrottlingRate", { rate: throttleRate });
    }
    await page.goto(URL_UNDER_TEST, { waitUntil: "load", timeout: 60000 });
    await page.waitForSelector("canvas");
    await page.waitForTimeout(BOOT_SETTLE_MS);
    return await page.evaluate(
      () => performance.getEntriesByType("navigation")[0].duration,
    );
  } finally {
    await context.close();
  }
}

/** Median cold boot with an optional CPU throttle (perf-baseline method). */
async function measureBoot(throttleRate, samples = BOOT_SAMPLES) {
  const browser = await launchBrowser();
  const durations = [];
  try {
    for (let index = 0; index < samples; index++) {
      durations.push(await bootSample(browser, throttleRate));
    }
  } finally {
    await browser.close();
  }
  return {
    throttleRate,
    samplesMs: durations.map(round),
    medianMs: round(median(durations)),
  };
}

function portAnswers(url) {
  return fetch(url, { signal: AbortSignal.timeout(1000) })
    .then((response) => response.ok)
    .catch(() => false);
}

/** Starts `vite preview` on the measurement port; resolves the child process. */
async function startPreview() {
  if (await portAnswers(URL_UNDER_TEST)) {
    throw new Error(`port ${PREVIEW_PORT} is already serving — stop it, or run without --with-preview`);
  }
  const server = spawn(
    process.execPath,
    ["node_modules/vite/bin/vite.js", "preview", "--port", String(PREVIEW_PORT), "--strictPort"],
    { cwd: ROOT, stdio: "ignore", windowsHide: true },
  );
  await until(() => portAnswers(URL_UNDER_TEST), 60000, `preview on ${URL_UNDER_TEST}`);
  return server;
}

function stopPreview(server) {
  if (server.exitCode !== null || server.pid === undefined) return;
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(server.pid), "/T", "/F"], { stdio: "ignore" });
    return;
  }
  server.kill("SIGTERM");
}

function runValidateBoot() {
  const child = spawnSync(process.execPath, ["scripts/validate-boot.js"], {
    cwd: ROOT,
    encoding: "utf8",
  });
  return {
    exitCode: child.status ?? 1,
    output: `${child.stdout ?? ""}${child.stderr ?? ""}`.trim(),
  };
}

async function measureBudget(stage, promise) {
  try {
    return await promise;
  } catch (error) {
    throw new Error(`${stage} could not be measured: ${error.message}`);
  }
}

/** `--with-preview`: own the server, measure boot + tap, always stop it. */
async function runEvidenceSuite(log) {
  const server = await startPreview();
  const suite = { phases: {}, taps: null, boot: null, throttledBoot: null };
  try {
    suite.phases.validateBoot = runValidateBoot();
    log(suite.phases.validateBoot.output);
    suite.boot = await measureBudget("cold boot", measureBoot(1));
    log(`cold boot median ${suite.boot.medianMs} ms: ${suite.boot.samplesMs.join(" / ")}`);
    suite.throttledBoot = await measureBudget(
      `${THROTTLE_RATE}x-throttled boot`,
      measureBoot(THROTTLE_RATE),
    );
    log(
      `${THROTTLE_RATE}x-throttled boot median ${suite.throttledBoot.medianMs} ms: ` +
        suite.throttledBoot.samplesMs.join(" / "),
    );
    suite.taps = await measureBudget("first tap", measureFirstTap());
    log(
      `first tap worst game ${suite.taps.worst.game} at ${suite.taps.worst.totalMs} ms ` +
        `(median across games ${suite.taps.medians.totalMs} ms)`,
    );
  } finally {
    stopPreview(server);
  }
  return suite;
}

function printTapTable(taps) {
  console.log("Cold first tap per game (fresh context each run, service worker blocked)\n");
  console.log("  A = tap -> chunk responseReceived (headers)");
  console.log("  B = tap -> chunk loadingFinished (body downloaded)");
  console.log("  C = tap -> first frame after the chunk settled (budgeted; NOT fully rendered)\n");
  console.log("  game              scene chunk                     A ms    B ms    C ms");
  for (const run of taps.runs) {
    console.log(
      `  ${run.game.padEnd(16)}  ${String(run.chunk).padEnd(28)}  ` +
        `${run.responseMs.toFixed(1).padStart(5)}  ` +
        `${run.finishedMs.toFixed(1).padStart(6)}  ` +
        `${run.totalMs.toFixed(1).padStart(6)}`,
    );
  }
  console.log(
    `\n  median            ${"".padEnd(28)}  ${taps.medians.responseMs.toFixed(1).padStart(5)}` +
      `  ${taps.medians.finishedMs.toFixed(1).padStart(6)}` +
      `  ${taps.medians.totalMs.toFixed(1).padStart(6)}`,
  );
  console.log(`\n  worst game: ${taps.worst.game} at ${taps.worst.totalMs.toFixed(1)} ms (C)`);
  console.log(`  budget: worst game C <= ${taps.budgetMs} ms`);
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const asJson = args.has("--json");

  if (args.has("--with-preview")) {
    const suite = await runEvidenceSuite(asJson ? () => {} : (line) => console.log(line));
    if (asJson) {
      console.log(JSON.stringify({ bootBudgetMs: BOOT_BUDGET_MS, ...suite }, null, 2));
    } else {
      console.log("");
      printTapTable(suite.taps);
    }
    if (suite.taps.worst.totalMs > TOTAL_BUDGET_MS) {
      console.error(
        `\nFAIL: worst game ${suite.taps.worst.game} total ${suite.taps.worst.totalMs} ms ` +
          `exceeds ${TOTAL_BUDGET_MS} ms`,
      );
      process.exitCode = 1;
      return;
    }
    console.log(
      `\nPASS: worst game ${suite.taps.worst.game} total ${suite.taps.worst.totalMs} ms ` +
        `(median across games ${suite.taps.medians.totalMs} ms)`,
    );
    return;
  }

  const taps = await measureFirstTap();
  if (asJson) console.log(JSON.stringify(taps, null, 2));
  else printTapTable(taps);

  if (taps.worst.totalMs > TOTAL_BUDGET_MS) {
    console.error(
      `\nFAIL: worst game ${taps.worst.game} total ${taps.worst.totalMs} ms ` +
        `exceeds ${TOTAL_BUDGET_MS} ms`,
    );
    process.exitCode = 1;
    return;
  }
  console.log(
    `\nPASS: worst game ${taps.worst.game} total ${taps.worst.totalMs} ms ` +
      `(median across games ${taps.medians.totalMs} ms)`,
  );
}

main().catch((error) => {
  console.error(`FAIL: first-tap measurement could not run: ${error.message}`);
  process.exitCode = 1;
});
