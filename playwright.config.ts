import { defineConfig } from "@playwright/test";

/**
 * Browser journey suite configuration.
 *
 * Chromium only. WebKit and Firefox are roadmap §10.7 work, deliberately
 * deferred until this suite is proven in one engine.
 *
 * The suite drives the production build through `vite preview` on the port
 * `scripts/validate-boot.js` already assumes, so what it exercises is the
 * artifact users download rather than the dev server.
 */
const PREVIEW_URL = "http://127.0.0.1:4173";

const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: "./e2e",
  // These tests boot a Phaser game. A 5 s expect timeout is the classic source
  // of false reds on a loaded host, so both budgets are deliberately generous.
  timeout: 60_000,
  expect: { timeout: 10_000 },
  // The suite shares one preview server and one service worker. Parallelism
  // buys nothing here and costs determinism.
  workers: 1,
  fullyParallel: false,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  reporter: isCI ? "github" : "list",
  use: {
    baseURL: PREVIEW_URL,
    // A 16:9 viewport so the letterboxing path is the one exercised: the game
    // renders 1024x768 with Scale.FIT, so the canvas is pillarboxed here.
    viewport: { width: 1280, height: 720 },
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [
    // One project, not a browser matrix: `--project=chromium` in the
    // `test:e2e` script names it.
    { name: "chromium", use: { browserName: "chromium" } },
  ],
  webServer: {
    // `--host 127.0.0.1` is not decoration: on Windows `localhost` resolves to
    // `::1` first, so vite binds the IPv6 loopback only and a probe of
    // `http://127.0.0.1:4173` is refused. Pinning both sides to the literal v4
    // address keeps local and CI identical.
    command: "node node_modules/vite/bin/vite.js preview --port 4173 --strictPort --host 127.0.0.1",
    url: PREVIEW_URL,
    reuseExistingServer: !isCI,
    // A cold preview start on a loaded CI host takes seconds, not milliseconds.
    timeout: 120_000,
  },
});
