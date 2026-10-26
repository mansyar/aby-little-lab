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
 *   node scripts/measure-first-tap.mjs [--json] [--warm-aware]
 *
 *   # or let this script own the preview server (evidence suite: validate-boot,
 *   # 4x-throttled boot, then first tap — always stops the server it started)
 *   node scripts/measure-first-tap.mjs --with-preview [--warm-aware]
 *
 * `--warm-aware` adds the tap kind the Hub's idle prewarm creates. Before the
 * tap it inspects the requests already issued for the tapped scene's chunk
 * (`<Scene>Scene-<hash>.js`), which gives three cases:
 *
 *   - `imported` — the chunk body had arrived. The tap pays no network and no
 *     module eval, so the cold stages A and B do not exist for it (reported 0)
 *     and waiting for a chunk request would only time out. Such a tap is
 *     verified by the launch commit instead (below) and reported as `warm`,
 *     with stage C = tap -> first frame after that commit.
 *   - `in-flight` — the prewarm's request was out but had not finished. The
 *     tap's `import()` joins that same fetch, so the remaining download is real
 *     waiting the child does: the tap is measured as `cold` (conservative) and
 *     its A/B stages are read from that in-flight request.
 *   - `none` — nothing was requested: an ordinary cold tap, measured exactly as
 *     without the flag.
 *
 * The launch commit is observed without touching app code: an init script
 * wraps `Storage.prototype.setItem`, and a commit is the v2 payload
 * (`abby-little-lab:v2`) carrying a non-empty `lastPlayedAt` for the tapped
 * game — the record `recordGamePlay` writes inside `openGame` after the load
 * resolves and before the fade. Its first animation frame after the write is
 * the warm stage C, measured from the same tap anchor the cold stages use.
 *
 * Headless note: headless Chromium on this host never delivers an idle period
 * once Phaser's game loop is running, so `requestIdleCallback` never fires and
 * the prewarm imports nothing (measured: one request, no callback in 20 s).
 * A headed browser fires it ~14 ms later and imports all 22 chunks in ~0.5 s.
 * Set `TAP_HEADED=1` to run headed; a warm-aware comparison must run headed on
 * BOTH builds or the prewarm side measures nothing.
 *
 * `HUB_SETTLE_MS` (default 2000) overrides the wait between the canvas and the
 * tap, so a run can model a child who taps at once or one who idles first.
 *
 * `TAP_INERT_IDLE=1` neutralises the page's idle scheduler before the app boots
 * (`requestIdleCallback` returns a handle and never calls back, `cancelIdleCallback`
 * is a no-op), so the prewarm can never import and every tap is cold. It is the
 * cold-vs-cold control: it measures the prewarm build's own tap path against the
 * baseline's without the prewarm being able to help, which is the only way to
 * show the tap path itself did not regress. It changes nothing in the build, so
 * it works on either one.
 *
 * Without the flag nothing changes: cold taps keep their three-stage
 * measurement, and the exit code still gates the worst cold total. With the
 * flag the budget is still applied to cold taps only — a warm tap is a
 * different quantity and must never mask a cold failure. A run in which every
 * tap was already warm therefore exits 0 and says the cold budget was not
 * exercised.
 *
 * Exits non-zero only when the worst cold tap's TOTAL exceeds TOTAL_BUDGET_MS
 * (or when a measurement cannot run at all).
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
const HUB_SETTLE_MS = Number(process.env.HUB_SETTLE_MS ?? 2000);
/** Boot settles 5x1000 ms before sampling, as in docs/perf-baseline.md. */
const BOOT_SETTLE_MS = 5000;
const BOOT_SAMPLES = 3;
/** A missing chunk within this window means the tap did not navigate. */
const CHUNK_TIMEOUT_MS = 8000;
/** The v2 payload key the app writes its profiles (and the play record) to. */
const STORAGE_KEY = "abby-little-lab:v2";

/**
 * Tile indexes are positions in `GAME_TILES` (src/game/hubTiles.ts). The set
 * spans three different art-group declarations plus Find the Word, the widest
 * union: seven groups and 83 keys (Word Builder, Decode It and First Sounds
 * declare the same seven). The budget is applied to the worst game, not to the
 * median across games, so one slow union cannot hide behind three fast ones.
 */
const TARGETS = [
  { name: "Shape Sorter", scene: "ShapeSorter", gameId: "shape-sorter", tileIndex: 0 },
  { name: "Find the Letter", scene: "Alphabet", gameId: "alphabet-match", tileIndex: 7 },
  { name: "Find the Word", scene: "WordMatch", gameId: "word-match", tileIndex: 8 },
  { name: "Add It Up", scene: "AddItUp", gameId: "add-it-up", tileIndex: 15 },
  { name: "Memory Match", scene: "MemoryMatch", gameId: "memory-match", tileIndex: 17 },
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
  // Headless Chromium on this host never delivers an idle period once Phaser's
  // game loop is running, so `requestIdleCallback` starves and the Hub's idle
  // prewarm imports nothing (measured: one request, no callback, 20 s). The
  // prewarm is only observable in a headed browser, so the comparison runs
  // headed for BOTH builds — same environment, back-to-back.
  const headless = process.env.TAP_HEADED !== "1";
  const attempts = [{ headless }, { channel: "chrome", headless }, { channel: "msedge", headless }];
  if (process.env.TAP_BROWSER_PATH) {
    attempts.push({ executablePath: process.env.TAP_BROWSER_PATH, headless });
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

/**
 * Page-side tap detector: records the moment the app writes a play record for
 * `gameId` into the v2 payload, plus the first frame after that write. Installed
 * as an init script so it is in place before the bundle runs, and used only with
 * `--warm-aware`.
 */
function tapDetector({ key, gameId }) {
  const original = Storage.prototype.setItem;
  window.__tapLaunch = null;
  Storage.prototype.setItem = function setItem(storageKey, value) {
    const result = original.call(this, storageKey, value);
    if (storageKey !== key || window.__tapLaunch !== null) return result;
    try {
      const parsed = JSON.parse(value);
      const profile = (parsed.profiles ?? []).find((entry) => entry.id === parsed.activeProfileId);
      const stamp = profile?.progress?.[gameId]?.lastPlayedAt;
      if (typeof stamp === "string" && stamp !== "") {
        const record = { at: performance.now(), firstFrame: null };
        window.__tapLaunch = record;
        requestAnimationFrame(() => {
          record.firstFrame = performance.now();
        });
      }
    } catch {
      // A payload this shape does not describe is not a launch record.
    }
    return result;
  };
}

async function measureGame(browser, target, warmAware = false) {
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
    serviceWorkers: "block",
  });
  const page = await context.newPage();
  if (process.env.TAP_INERT_IDLE === "1") {
    // Cold-vs-cold control: neutralise the Hub's idle scheduler so the prewarm
    // can never import, while leaving the rest of the build untouched. Without
    // this a tap on a prewarm build may or may not find its chunk warm, so the
    // build's own cold path could not be compared with the baseline's.
    await page.addInitScript(() => {
      window.requestIdleCallback = () => 1;
      window.cancelIdleCallback = () => {};
    });
  }
  if (warmAware) {
    await page.addInitScript(tapDetector, { key: STORAGE_KEY, gameId: target.gameId });
  }
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
    // Warm-aware only: did the Hub already ask for this scene's chunk? Checked
    // on request URLs, so a chunk still in flight also counts. Three states:
    //   "imported"  the chunk body had arrived before the tap (no network paid)
    //   "in-flight" the prewarm's request was out; the tap joins that same fetch
    //   "none"      nothing was requested: an ordinary cold tap
    const sceneChunk = new RegExp(`/${target.scene}Scene-[^/]+\\.js$`);
    const preTapRequestId =
      [...requestUrls.entries()].find(([, url]) => sceneChunk.test(url))?.[0] ?? null;
    const chunkBeforeTap = !warmAware
      ? null
      : preTapRequestId === null
        ? "none"
        : finishedAt.has(preTapRequestId)
          ? "imported"
          : "in-flight";
    const prefetched = chunkBeforeTap === "imported";

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

    /** The tapped scene's own chunk response, started by the tap itself. */
    const sceneChunkResponse = () =>
      responses.find(
        (entry) =>
          entry.type === "Script" &&
          !alreadyStarted.has(entry.requestId) &&
          sceneChunk.test(entry.url),
      );
    /** The original cold matcher: any script response the tap started. */
    const anyChunkResponse = () =>
      responses.find(
        (entry) =>
          entry.type === "Script" &&
          !alreadyStarted.has(entry.requestId) &&
          entry.url.endsWith(".js"),
      );
    /**
     * The prewarm's own request for the tapped chunk, when it was still in
     * flight at tap time. The tap's `import()` joins that same fetch, so its
     * remaining download is part of what the child waits for and belongs in the
     * cold reading rather than being written off as warm.
     */
    const inFlightResponse = () =>
      preTapRequestId === null
        ? undefined
        : responses.find(
            (entry) =>
              entry.requestId === preTapRequestId &&
              entry.type === "Script" &&
              sceneChunk.test(entry.url),
          );

    let tapKind = "cold";
    let chunkResponse = null;
    let chunkFinished = null;
    let firstFrame = null;
    let settledMs = 0;

    if (warmAware && prefetched) {
      // A warm tap issues no chunk request at all, so the cold stages cannot be
      // recorded and waiting for one would only time out. The tap is verified
      // instead by the play record the Hub writes inside `openGame` after the
      // load resolves and before the fade: that write is proof the scene was
      // registered and the launch committed. Stage C is then tap -> first frame
      // after that write, the warm analogue of "first frame after the chunk
      // settled"; A and B are 0 because neither is paid.
      const launch = await page.evaluate(
        (budget) =>
          new Promise((resolve) => {
            const deadline = Date.now() + budget;
            const read = () => {
              const record = window.__tapLaunch;
              if (record !== null && record.firstFrame !== null) {
                resolve(record);
                return;
              }
              if (Date.now() > deadline) {
                resolve(null);
                return;
              }
              requestAnimationFrame(read);
            };
            read();
          }),
        CHUNK_TIMEOUT_MS,
      );
      if (launch === null) {
        throw new Error(
          `${target.scene} was already imported but the tap never reached the Hub's play record`,
        );
      }
      tapKind = "warm";
      settledMs = launch.at - anchorEntry.startTime;
      firstFrame = launch.firstFrame;
      chunkResponse = responses.find((entry) => sceneChunk.test(entry.url)) ?? null;
    } else if (chunkBeforeTap === "in-flight") {
      chunkResponse = await until(
        inFlightResponse,
        CHUNK_TIMEOUT_MS,
        `${target.scene} in-flight chunk response`,
      );
    } else {
      chunkResponse = await until(
        anyChunkResponse,
        CHUNK_TIMEOUT_MS,
        `${target.scene} chunk response`,
      );
    }

    if (tapKind === "cold") {
      chunkFinished = await until(
        () => finishedAt.get(chunkResponse.requestId),
        CHUNK_TIMEOUT_MS,
        `${target.scene} chunk loadingFinished`,
      );
      firstFrame = await page.evaluate(
        () =>
          new Promise((resolve) => {
            requestAnimationFrame(() => resolve(performance.now()));
          }),
      );
      settledMs = (chunkFinished - tap.timestamp) * 1000;
    }

    const totalMs = firstFrame - anchorEntry.startTime;
    // An in-flight prewarm request may already have its headers when the tap
    // lands, so A can be <= 0 there; clamping keeps the stage a duration.
    const responseMs =
      tapKind === "warm" ? 0 : Math.max(0, (chunkResponse.timestamp - tap.timestamp) * 1000);

    return {
      game: target.name,
      scene: target.scene,
      gameId: target.gameId,
      chunk: chunkResponse === null ? "(no request)" : chunkResponse.url.split("/").pop(),
      ...(warmAware ? { tapKind, chunkBeforeTap } : {}),
      responseMs,
      finishedMs: tapKind === "warm" ? 0 : settledMs,
      totalMs,
      clockSkewMs: totalMs - settledMs,
    };
  } finally {
    await context.close();
  }
}

async function measureFirstTap(warmAware = false) {
  const browser = await launchBrowser();
  const runs = [];
  try {
    for (const target of TARGETS) {
      runs.push(await measureGame(browser, target, warmAware));
    }
  } finally {
    await browser.close();
  }

  // The budget gates a cold tap only. A warm tap is a different quantity (it
  // pays no fetch and no module eval), so letting one win the "worst" slot
  // would hide a cold failure behind the very optimisation being measured.
  const coldRuns = warmAware ? runs.filter((run) => run.tapKind === "cold") : runs;
  const warmRuns = warmAware ? runs.filter((run) => run.tapKind === "warm") : [];
  // A warm tap is a different quantity (no fetch, no module eval), so the
  // budget's "worst" slot only ever holds a cold tap; a run with no cold tap
  // reports null and the exit code stays 0, saying the budget was not exercised.
  const worstCold =
    coldRuns.length === 0
      ? null
      : coldRuns.reduce((current, run) => (run.totalMs > current.totalMs ? run : current));
  return {
    stages: {
      responseMs: "tap -> game chunk responseReceived (headers only)",
      finishedMs: "tap -> game chunk loadingFinished (body downloaded)",
      totalMs: "tap -> first frame after the chunk settled (budgeted)",
      ...(warmAware
        ? {
            warmTotalMs:
              "tap -> first frame after the Hub's play record (warm tap: A and B are 0)",
          }
        : {}),
    },
    budgetMs: TOTAL_BUDGET_MS,
    ...(warmAware ? { warmAware: true } : {}),
    runs: runs.map((run) => ({
      ...run,
      responseMs: round(run.responseMs),
      finishedMs: round(run.finishedMs),
      totalMs: round(run.totalMs),
      clockSkewMs: round(run.clockSkewMs),
    })),
    medians: {
      responseMs: coldRuns.length === 0 ? null : round(median(coldRuns.map((run) => run.responseMs))),
      finishedMs: coldRuns.length === 0 ? null : round(median(coldRuns.map((run) => run.finishedMs))),
      totalMs: coldRuns.length === 0 ? null : round(median(coldRuns.map((run) => run.totalMs))),
    },
    ...(warmAware
      ? {
          warmMedians:
            warmRuns.length === 0
              ? null
              : { totalMs: round(median(warmRuns.map((run) => run.totalMs))) },
          coldCount: coldRuns.length,
          warmCount: warmRuns.length,
        }
      : {}),
    worst: worstCold === null ? null : { game: worstCold.game, totalMs: round(worstCold.totalMs) },
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
async function runEvidenceSuite(log, warmAware = false) {
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
    suite.taps = await measureBudget("first tap", measureFirstTap(warmAware));
    log(
      `first tap worst cold game ${suite.taps.worst === null ? "(none)" : suite.taps.worst.game} at ` +
        `${suite.taps.worst === null ? "—" : suite.taps.worst.totalMs} ms` +
        (suite.taps.medians.totalMs === null
          ? ""
          : ` (cold median across games ${suite.taps.medians.totalMs} ms)`),
    );
  } finally {
    stopPreview(server);
  }
  return suite;
}

function printTapTable(taps) {
  const cold = taps.warmAware === true;
  console.log(
    `${cold ? "First tap per game (fresh context each run, service worker blocked)" : "Cold first tap per game (fresh context each run, service worker blocked)"}\n`,
  );
  console.log("  A = tap -> chunk responseReceived (headers)");
  console.log("  B = tap -> chunk loadingFinished (body downloaded)");
  console.log("  C = tap -> first frame after the chunk settled (budgeted; NOT fully rendered)");
  if (cold) {
    console.log(
      "  A warm tap pays neither A nor B: the Hub's idle prewarm imported the chunk, so C is\n" +
        "  tap -> first frame after the Hub's play record (a different quantity from a cold C).",
    );
  }
  console.log("");
  console.log(
    `  game              scene chunk                     A ms    B ms    C ms${cold ? "  kind" : ""}`,
  );
  for (const run of taps.runs) {
    console.log(
      `  ${run.game.padEnd(16)}  ${String(run.chunk).padEnd(28)}  ` +
        `${run.responseMs.toFixed(1).padStart(5)}  ` +
        `${run.finishedMs.toFixed(1).padStart(6)}  ` +
        `${run.totalMs.toFixed(1).padStart(6)}` +
        (cold ? `  ${run.tapKind}` : ""),
    );
  }
  if (taps.medians.totalMs !== null) {
    console.log(
      `\n  cold median       ${"".padEnd(28)}  ${taps.medians.responseMs.toFixed(1).padStart(5)}` +
        `  ${taps.medians.finishedMs.toFixed(1).padStart(6)}` +
        `  ${taps.medians.totalMs.toFixed(1).padStart(6)}`,
    );
  }
  if (taps.warmMedians !== null && taps.warmMedians !== undefined) {
    console.log(
      `  warm median       ${"".padEnd(28)}  ${"—".padStart(5)}  ${"—".padStart(6)}` +
        `  ${taps.warmMedians.totalMs.toFixed(1).padStart(6)}`,
    );
  }
  if (taps.worst !== null) {
    console.log(`\n  worst cold game: ${taps.worst.game} at ${taps.worst.totalMs.toFixed(1)} ms (C)`);
  } else {
    console.log("\n  no cold tap in this run: every tapped chunk was already imported");
  }
  if (cold) {
    console.log(
      `  tap kinds: ${taps.coldCount} cold / ${taps.warmCount} warm`,
    );
  }
  console.log(`  budget: worst cold game C <= ${taps.budgetMs} ms`);
}

/** Shared budget gate: returns the exit code for a finished tap pass. */
function tapExitCode(taps) {
  if (taps.worst === null) {
    console.log("\nPASS: no cold tap in this run — the cold budget was not exercised");
    return 0;
  }
  if (taps.worst.totalMs > taps.budgetMs) {
    console.error(
      `\nFAIL: worst game ${taps.worst.game} total ${taps.worst.totalMs} ms ` +
        `exceeds ${taps.budgetMs} ms`,
    );
    return 1;
  }
  const medianText =
    taps.medians.totalMs === null ? "" : ` (cold median across games ${taps.medians.totalMs} ms)`;
  console.log(`\nPASS: worst cold game ${taps.worst.game} total ${taps.worst.totalMs} ms${medianText}`);
  return 0;
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const asJson = args.has("--json");
  const warmAware = args.has("--warm-aware");

  if (args.has("--with-preview")) {
    const suite = await runEvidenceSuite(asJson ? () => {} : (line) => console.log(line), warmAware);
    if (asJson) {
      console.log(JSON.stringify({ bootBudgetMs: BOOT_BUDGET_MS, ...suite }, null, 2));
    } else {
      console.log("");
      printTapTable(suite.taps);
    }
    process.exitCode = tapExitCode(suite.taps);
    return;
  }

  const taps = await measureFirstTap(warmAware);
  if (asJson) console.log(JSON.stringify(taps, null, 2));
  else printTapTable(taps);
  process.exitCode = tapExitCode(taps);
}

main().catch((error) => {
  console.error(`FAIL: first-tap measurement could not run: ${error.message}`);
  process.exitCode = 1;
});
