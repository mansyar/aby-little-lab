import { defineConfig } from "@playwright/test";

/**
 * Browser journey suite configuration.
 *
 * Chromium keeps the full journey roster. WebKit, Firefox and mobile Chromium
 * run only the focused core smoke, so engine coverage does not triple the work.
 *
 * The suite drives the production build through `vite preview` on the port
 * `scripts/validate-boot.js` already assumes, so what it exercises is the
 * artifact users download rather than the dev server.
 */
const PREVIEW_URL = "http://127.0.0.1:4173";

/** Landscape desktop proxy viewport shared by Chromium, WebKit and Firefox. */
const LANDSCAPE_VIEWPORT = { width: 1280, height: 720 };

/** A phone-shaped landscape viewport for the genuine Chromium touch profile. */
const MOBILE_LANDSCAPE_VIEWPORT = { width: 844, height: 390 };

/** Existing journeys that make up the cross-engine core smoke. */
const CORE_SMOKE_TEST_MATCH = [
  "**/journeys/boot.spec.ts",
  "**/journeys/launch-all.spec.ts",
  "**/journeys/first-sounds.spec.ts",
  "**/journeys/shape-sorter.spec.ts",
  "**/journeys/offline.spec.ts",
  "**/smoke/sticker-persistence.spec.ts",
];

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
  // Three workers, not one and not two: the suite reached 4.9 min serially
  // against NFR-2's 5 min budget, and the excess is wall clock rather than work.
  // Files are the parallelism unit — `fullyParallel: false` keeps the tests
  // inside one file serial, except the `launch-all` halves, which opt into
  // `mode: "parallel"` — and every test gets a fresh browser context, so the
  // preview server is the only thing the workers share. Only `webServer` owns
  // that server: there is no per-worker port and no second server, so every
  // worker reads the same built `dist` over the same origin.
  //
  // Measured on the 2026-11-16 development host (wall clock):
  // serial 4.9 min, two workers 5.0-5.1 min, three workers 3.8-4.3 min. Two
  // workers no longer helped there once `launch-all` stopped being a 3.3 min
  // monolith — the suite's floor is its total work divided by workers, and 24
  // launches are ~200 s of that work.
  //
  // CI is a different machine and a different answer. Its runner has four
  // vCPUs, and three workers there put three Phaser canvases plus the preview
  // server on them: the journeys still passed, but the game loop fell far enough
  // behind that a parental hold, which the gate counts in frames, took minutes of
  // wall clock. On 2026-11-16 that showed up as the backup journey timing out on
  // CI while passing locally (runs 43932079796, 43943297292, 43947422301, the
  // last one ending in `Failed to find context` as the browser itself died).
  // CI therefore runs two workers, which leaves a core for the browser's own
  // compositor and the preview server; the development host keeps three.
  workers: isCI ? 2 : 3,
  fullyParallel: false,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  reporter: isCI ? "github" : "list",
  use: {
    baseURL: EXTERNAL_BASE_URL ?? PREVIEW_URL,
    // A 16:9 viewport so the letterboxing path is the one exercised: the game
    // renders 1024x768 with Scale.FIT, so the canvas is pillarboxed here.
    viewport: LANDSCAPE_VIEWPORT,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [
    // The full journey suite remains Chromium-only. Smoke-only checks live in
    // `e2e/smoke/` and are excluded here so this roster cannot grow by accident.
    {
      name: "chromium",
      use: { browserName: "chromium", viewport: LANDSCAPE_VIEWPORT },
      testIgnore: "**/smoke/**",
    },
    {
      name: "webkit",
      use: { browserName: "webkit", viewport: LANDSCAPE_VIEWPORT },
      testMatch: CORE_SMOKE_TEST_MATCH,
    },
    {
      name: "firefox",
      use: { browserName: "firefox", viewport: LANDSCAPE_VIEWPORT },
      testMatch: CORE_SMOKE_TEST_MATCH,
    },
    {
      name: "mobile-chromium",
      use: {
        browserName: "chromium",
        viewport: MOBILE_LANDSCAPE_VIEWPORT,
        isMobile: true,
        hasTouch: true,
      },
      testMatch: CORE_SMOKE_TEST_MATCH,
    },
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
