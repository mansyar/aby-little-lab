#!/usr/bin/env node

/**
 * Header Validation Script for Aby's Little Lab
 *
 * Boots the built image (not the config text), waits for it to answer, and
 * asserts what every route class actually sends: the four security headers, and
 * the `Cache-Control` value that class had before the policy was added.
 *
 * It is a runtime check on purpose. The unit guard test in
 * `src/__tests__/guard/securityHeaders.test.ts` reads `nginx.conf` and the
 * snippet and can prove their shapes agree; only a container can prove that
 * nginx's inheritance rule, the image's COPY paths and `always` all behave as
 * the text claims.
 *
 * Determinism (NFR-4): the port is fixed (`HEADERS_PORT`, default 8080) and a
 * busy port is a failure, not a reason to pick another one — the previous track
 * lost time to a silently-colliding port. Readiness is polled with a bounded
 * wait and no fixed sleep. The container is removed in a `finally`, on every
 * path including failure. The *image* is kept: later phases re-run the suite
 * against it.
 *
 * Differences from `validate-pwa.js`: a check here returns a list of problems
 * rather than a boolean, because a header miss is only actionable if it names
 * the header. The output shape, the pass/fail tally and the exit code are the
 * same.
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST_ASSETS_DIR = path.join(ROOT, "dist", "assets");

const IMAGE = process.env.HEADERS_IMAGE ?? "aby-little-lab:headers";
const PORT = Number.parseInt(process.env.HEADERS_PORT ?? "8080", 10);
const CONTAINER = `aby-little-lab-headers-${process.pid}`;
const READY_TIMEOUT_MS = 30_000;
const READY_INTERVAL_MS = 250;

const REQUIRED_HEADERS = [
  "content-security-policy",
  "x-content-type-options",
  "referrer-policy",
  "permissions-policy",
];

// FR-1, in order. The policy is asserted directive by directive so a reworded or
// dropped directive is named rather than summarised as "CSP differs".
const CSP_DIRECTIVES = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "media-src 'self'",
  "connect-src 'self'",
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'",
];

// FR-4. `fullscreen` is absent on purpose: the installed PWA needs it.
const DENIED_FEATURES = [
  "camera",
  "microphone",
  "geolocation",
  "payment",
  "usb",
  "serial",
  "midi",
  "display-capture",
  "accelerometer",
  "gyroscope",
  "magnetometer",
];

function fatal(problem, hint) {
  console.error(`\n✗ ${problem}`);
  if (hint) {
    console.error(`  ${hint}`);
  }
  console.error("");
  process.exit(1);
}

function docker(args, extra = {}) {
  return spawnSync("docker", args, { encoding: "utf8", ...extra });
}

function assertImageAvailable() {
  const result = docker(["image", "inspect", IMAGE, "--format", "{{.Id}}"]);

  if (result.error !== undefined) {
    fatal(
      `Could not run docker (${result.error.code ?? result.error.message}).`,
      "Install Docker, or point HEADERS_IMAGE at an image that already exists.",
    );
  }

  if (result.status !== 0) {
    fatal(
      `Image ${IMAGE} is not available to docker.`,
      `Build it first: docker build -t ${IMAGE} . (HEADERS_IMAGE overrides the name.)`,
    );
  }
}

function assertPortFree(port) {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.unref();
    probe.once("error", (error) => {
      reject(
        new Error(
          error.code === "EADDRINUSE"
            ? `Port ${port} is already in use. Free it, or set HEADERS_PORT to a port that is free.`
            : `Could not test port ${port}: ${error.message}`,
        ),
      );
    });
    probe.listen({ host: "127.0.0.1", port }, () => {
      probe.close(() => resolve());
    });
  });
}

/**
 * The hashed asset class is served by `location ~* \.(css|js|png|svg|woff2)$`.
 * The shell entry chunk is chosen because Vite always emits exactly one, so the
 * probe is stable across builds where a game chunk may be renamed or dropped.
 */
function discoverHashedAsset() {
  if (!fs.existsSync(DIST_ASSETS_DIR)) {
    fatal("dist/assets not found — run 'pnpm run build' before validate-headers.");
  }

  const emitted = fs
    .readdirSync(DIST_ASSETS_DIR)
    .filter((name) => name.endsWith(".js"))
    .sort();
  const entry = emitted.find((name) => /^index-[^.]+\.js$/.test(name)) ?? emitted[0];

  if (entry === undefined) {
    fatal("No .js file in dist/assets — run 'pnpm run build' before validate-headers.");
  }

  return entry;
}

function startContainer() {
  const result = docker(["run", "--rm", "-d", "--name", CONTAINER, "-p", `${PORT}:80`, IMAGE]);

  if (result.status !== 0) {
    fatal(
      `Could not start ${IMAGE} on port ${PORT}.`,
      (result.stderr || result.stdout || "docker run produced no output").trim(),
    );
  }
}

function stopContainer() {
  docker(["rm", "--force", CONTAINER]);
}

function containerRunning() {
  const result = docker(["inspect", "--format", "{{.State.Running}}", CONTAINER]);
  return result.status === 0 && result.stdout.trim() === "true";
}

function containerLogs() {
  const result = docker(["logs", CONTAINER]);
  return `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Readiness is "the shell answered", polled until it does — never a fixed sleep.
 * A container that exits while we wait is reported with its own logs, which is
 * what a missing `include` or an unreadable snippet looks like: nginx refuses to
 * start rather than serve unprotected.
 */
async function waitForReadiness() {
  const deadline = Date.now() + READY_TIMEOUT_MS;

  while (Date.now() < deadline) {
    if (!containerRunning()) {
      fatal(
        `Container ${CONTAINER} exited before it answered on port ${PORT}.`,
        containerLogs() || "docker logs produced no output",
      );
    }

    try {
      const response = await fetch(`http://127.0.0.1:${PORT}/index.html`, {
        redirect: "manual",
      });
      await response.arrayBuffer();
      if (response.status < 500) {
        return;
      }
    } catch {
      // Connection refused while nginx is still starting; keep polling.
    }

    await sleep(READY_INTERVAL_MS);
  }

  fatal(
    `${IMAGE} did not answer on http://127.0.0.1:${PORT}/index.html within ${
      READY_TIMEOUT_MS / 1000
    }s.`,
    containerLogs() || "docker logs produced no output",
  );
}

function cacheControl(headers) {
  const value = headers.get("cache-control");
  return value === null ? null : value.trim();
}

function securityHeaderProblems(observed) {
  const problems = [];
  const { headers } = observed;

  for (const name of REQUIRED_HEADERS) {
    if (!headers.has(name)) {
      problems.push(`missing ${name}`);
    }
  }

  const csp = headers.get("content-security-policy");
  if (csp !== null) {
    const directives = csp.split(";").map((directive) => directive.trim());
    for (const directive of CSP_DIRECTIVES) {
      if (!directives.includes(directive)) {
        problems.push(`CSP does not contain "${directive}"`);
      }
    }
    if (csp.includes("unsafe-inline")) {
      problems.push("CSP allows unsafe-inline");
    }
    if (csp.includes("unsafe-eval")) {
      problems.push("CSP allows unsafe-eval");
    }
    if (csp.includes("*")) {
      problems.push("CSP contains a wildcard source");
    }
  }

  const contentTypeOptions = headers.get("x-content-type-options");
  if (contentTypeOptions !== null && contentTypeOptions.trim() !== "nosniff") {
    problems.push(`X-Content-Type-Options is "${contentTypeOptions.trim()}", not "nosniff"`);
  }

  const referrerPolicy = headers.get("referrer-policy");
  if (referrerPolicy !== null && referrerPolicy.trim() !== "no-referrer") {
    problems.push(`Referrer-Policy is "${referrerPolicy.trim()}", not "no-referrer"`);
  }

  const permissionsPolicy = headers.get("permissions-policy");
  if (permissionsPolicy !== null) {
    for (const feature of DENIED_FEATURES) {
      if (!permissionsPolicy.includes(`${feature}=()`)) {
        problems.push(`Permissions-Policy does not deny ${feature}`);
      }
    }
    if (permissionsPolicy.includes("fullscreen")) {
      problems.push("Permissions-Policy mentions fullscreen, which the installed PWA needs");
    }
  }

  return problems;
}

async function probe(probePath) {
  const response = await fetch(`http://127.0.0.1:${PORT}${probePath}`);
  const body = await response.text();
  return { path: probePath, status: response.status, headers: response.headers, body };
}

/**
 * Every `cache` here is the exact value observed before this track, so a change
 * in routing or in a cache rule fails the run. Two of them are produced by
 * nginx's own routing rather than by an `add_header`: `/` and the SPA fallback
 * are both resolved by `try_files`' internal redirect into
 * `location = /index.html`, which is why they serve its `no-cache` value.
 */
function probePlan(hashedAsset) {
  return [
    { label: "SPA root", path: "/", cache: "no-cache", expectStatus: 200 },
    {
      label: "shell",
      path: "/index.html",
      cache: "no-cache",
      expectStatus: 200,
    },
    {
      label: "service worker",
      path: "/sw.js",
      cache: "no-cache, no-store, must-revalidate",
      expectStatus: 200,
    },
    {
      label: "web manifest",
      path: "/manifest.webmanifest",
      cache: "no-cache",
      expectStatus: 200,
    },
    {
      label: "hashed asset",
      path: `/assets/${hashedAsset}`,
      cache: "public, max-age=31536000, immutable",
      expectStatus: 200,
    },
    {
      label: "unknown route (SPA fallback)",
      path: "/no-such-route",
      cache: "no-cache",
      expectStatus: 200,
    },
    {
      label: "missing hashed asset",
      path: "/assets/does-not-exist.js",
      cache: "public, max-age=31536000, immutable",
      expectStatus: 404,
    },
  ];
}

function printRouteMatrix(observations) {
  console.log("Observed route matrix\n");
  console.log(
    `  ${"class".padEnd(34)}${"path".padEnd(30)}${"status".padEnd(8)}${"security".padEnd(10)}cache-control`,
  );
  console.log(
    `  ${"-".repeat(34)}${"-".repeat(30)}${"-".repeat(8)}${"-".repeat(10)}${"-".repeat(44)}`,
  );

  for (const observed of observations) {
    const present = REQUIRED_HEADERS.filter((name) => observed.headers.has(name)).length;
    const cache = cacheControl(observed.headers) ?? "-";
    console.log(
      `  ${observed.planned.label.padEnd(34)}${observed.path.padEnd(30)}${String(
        observed.status,
      ).padEnd(8)}${`${present}/4`.padEnd(10)}${cache}`,
    );
  }

  const missingAsset = observations.find(
    (observed) => observed.path === "/assets/does-not-exist.js",
  );
  if (missingAsset !== undefined) {
    console.log(
      `\n  /assets/does-not-exist.js answered ${missingAsset.status} carrying ${
        cacheControl(missingAsset.headers) ?? "no Cache-Control"
      }. The 404 is expected; the immutable cache header on it is a\n  pre-existing quirk of the hashed-asset location (it matches the extension, not the\n  file), recorded here rather than changed in this phase.`,
    );
  }
}

function buildChecks(observations) {
  const checks = [];

  for (const observed of observations) {
    checks.push({
      name: `${observed.path} carries CSP, nosniff, no-referrer and the deny list`,
      problems: () => securityHeaderProblems(observed),
    });

    const planned = observed.planned;

    if (planned.expectStatus !== null) {
      checks.push({
        name: `${observed.path} answers ${planned.expectStatus}`,
        problems: () =>
          observed.status === planned.expectStatus
            ? []
            : [`status is ${observed.status}, expected ${planned.expectStatus}`],
      });
    }

    if (planned.cache !== "recorded") {
      checks.push({
        name: `${observed.path} keeps Cache-Control "${planned.cache}"`,
        problems: () => {
          const actual = cacheControl(observed.headers);
          return actual === planned.cache
            ? []
            : [
                `Cache-Control is ${actual === null ? "absent" : `"${actual}"`}, expected "${planned.cache}"`,
              ];
        },
      });
    }
  }

  // `/` and the SPA fallback each assert their own exact value above, which is
  // stronger than checking that the two agree; a routing change shows up as a
  // named failure on the class it changed.

  return checks;
}

function runChecks(checks) {
  let passed = 0;
  let failed = 0;

  for (const check of checks) {
    const problems = check.problems();
    if (problems.length === 0) {
      passed += 1;
      console.log(`✓ ${check.name}`);
      continue;
    }

    failed += 1;
    console.log(`✗ ${check.name}`);
    for (const problem of problems) {
      console.log(`    ${problem}`);
    }
  }

  return { passed, failed };
}

async function main() {
  if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65_535) {
    fatal(`HEADERS_PORT is not a port number: "${process.env.HEADERS_PORT}".`);
  }

  assertImageAvailable();
  const hashedAsset = discoverHashedAsset();

  try {
    await assertPortFree(PORT);
  } catch (error) {
    fatal(error.message);
  }

  console.log("Header Validation for Aby's Little Lab\n");
  console.log("=".repeat(70));

  const observations = [];
  let checks = [];

  startContainer();
  try {
    await waitForReadiness();

    for (const planned of probePlan(hashedAsset)) {
      const observed = await probe(planned.path);
      observed.planned = planned;
      observations.push(observed);
    }

    printRouteMatrix(observations);
    console.log(`\n${"=".repeat(70)}\n`);
    checks = buildChecks(observations);
  } finally {
    stopContainer();
  }

  const { passed, failed } = runChecks(checks);

  console.log("=".repeat(70));
  console.log(`\nResults: ${passed} passed, ${failed} failed\n`);

  if (failed > 0) {
    console.log("Some responses did not carry the policy or lost their cache semantics.");
    process.exitCode = 1;
    return;
  }

  console.log(
    "Every probed route carries the four security headers with its Cache-Control intact.",
  );
  process.exitCode = 0;
}

main().catch((error) => {
  console.error(`\n✗ Header validation aborted: ${error.message}\n`);
  process.exitCode = 1;
});
