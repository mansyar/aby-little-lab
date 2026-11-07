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

/**
 * An already-running origin to drive the journeys against, e.g. the built image
 * behind nginx: `E2E_BASE_URL=http://127.0.0.1:8080 pnpm test:e2e`.
 *
 * `vite preview` sets no security headers, so pointing the suite at the
 * container is the only way to prove the app under the enforced policy rather
 * than argue it. When the variable is set the suite owns no server and starts
 * nothing; when it is unset every value below is the preview default.
 */
const EXTERNAL_BASE_URL = process.env.E2E_BASE_URL || undefined;

const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: "./e2e",
  // These tests boot a Phaser game. A 5 s expect timeout is the classic source
  // of false reds on a loaded host, so both budgets are deliberately generous.
  timeout: 60_000,
  expect: { timeout: 10_000 },
  // Two workers, not one: the suite reached 4.9 min serially against NFR-2's
  // 5 min budget, and the excess is wall clock rather than work. Files are the
  // parallelism unit — `fullyParallel: false` keeps the tests inside one file
  // serial — and every test already gets a fresh browser context, so the
  // preview server is the only thing the workers share. Only `webServer` owns
  // that server: there is no per-worker port and no second server, so both
  // workers read the same built `dist` over the same origin. `launch-all` alone
  // is 2.6 min, so the critical path is that file plus the slower worker's
  // share of the rest: near 2.8 min, not the 2.5 min a clean halving predicts.
  workers: 2,
  fullyParallel: false,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  reporter: isCI ? "github" : "list",
  use: {
    baseURL: EXTERNAL_BASE_URL ?? PREVIEW_URL,
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
  // No server to start when `E2E_BASE_URL` names an origin: nginx must already
  // be listening. `vite preview` sends none of the headers under test, so the
  // real policy can only be exercised by pointing the suite at the container.
  webServer: EXTERNAL_BASE_URL
    ? undefined
    : {
        // `--host 127.0.0.1` is not decoration: on Windows `localhost` resolves to
        // `::1` first, so vite binds the IPv6 loopback only and a probe of
        // `http://127.0.0.1:4173` is refused. Pinning both sides to the literal v4
        // address keeps local and CI identical.
        command:
          "node node_modules/vite/bin/vite.js preview --port 4173 --strictPort --host 127.0.0.1",
        url: PREVIEW_URL,
        reuseExistingServer: !isCI,
        // A cold preview start on a loaded CI host takes seconds, not milliseconds.
        timeout: 120_000,
      },
});
