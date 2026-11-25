#!/usr/bin/env node

/**
 * Evidence and strict gate for the cross-engine Playwright smoke matrix.
 *
 * `probe` launches the selected Playwright-managed browser (never a system
 * channel) and records its exact version and emulation profile. `summarize`
 * validates the JSON report, publishes the evidence in the GitHub job summary,
 * and fails on missing, skipped, flaky/retried or unexpected results.
 */

import fs from "node:fs";
import { createRequire } from "node:module";
import { chromium, firefox, webkit } from "playwright-core";

const require = createRequire(import.meta.url);
const { version: playwrightVersion } = require("playwright-core/package.json");

const ENGINES = {
  webkit: {
    label: "WebKit",
    browserType: webkit,
    profile: {
      label: "Desktop 1280x720; isMobile=false; hasTouch=false",
      context: { viewport: { width: 1280, height: 720 } },
      mobile: false,
    },
  },
  firefox: {
    label: "Firefox",
    browserType: firefox,
    profile: {
      label: "Desktop 1280x720; isMobile=false; hasTouch=false",
      context: { viewport: { width: 1280, height: 720 } },
      mobile: false,
    },
  },
  "mobile-chromium": {
    label: "Mobile Chromium",
    browserType: chromium,
    profile: {
      label:
        "Mobile emulation 844x390; isMobile=true; hasTouch=true (not physical-device coverage)",
      context: {
        viewport: { width: 844, height: 390 },
        isMobile: true,
        hasTouch: true,
      },
      mobile: true,
    },
  },
};

function getEngine(value) {
  if (!Object.hasOwn(ENGINES, value)) {
    throw new Error(`unknown matrix engine: ${value}`);
  }
  return ENGINES[value];
}

function getOption(args, name) {
  const index = args.indexOf(name);
  if (index === -1 || !args[index + 1]) {
    throw new Error(`missing required option ${name}`);
  }
  return args[index + 1];
}

function appendLines(path, lines) {
  if (path) fs.appendFileSync(path, `${lines.join("\n")}\n`);
}

function publishSummary(lines) {
  const markdown = lines.join("\n");
  console.log(markdown);
  appendLines(process.env.GITHUB_STEP_SUMMARY, lines);
}

function tableCell(value) {
  return String(value).replaceAll("|", "\\|").replaceAll("\n", " ");
}

function flattenSpecs(suites) {
  return suites.flatMap((suite) => [
    ...(Array.isArray(suite.specs) ? suite.specs : []),
    ...flattenSpecs(Array.isArray(suite.suites) ? suite.suites : []),
  ]);
}

function inspectReport(report, engine) {
  if (!report || typeof report !== "object" || !Array.isArray(report.suites)) {
    throw new Error("JSON report has no suites array");
  }
  const { stats } = report;
  if (!stats || typeof stats !== "object") {
    throw new Error("JSON report has no stats object");
  }
  for (const key of ["expected", "unexpected", "flaky", "skipped"]) {
    if (!Number.isInteger(stats[key]) || stats[key] < 0) {
      throw new Error(`JSON report stats.${key} must be a non-negative integer`);
    }
  }
  if (!Number.isFinite(stats.duration) || stats.duration < 0) {
    throw new Error("JSON report stats.duration must be a non-negative number");
  }

  const specs = flattenSpecs(report.suites);
  const violations = [];
  if (Array.isArray(report.errors) && report.errors.length > 0) {
    violations.push(`JSON report contains ${report.errors.length} runner error(s)`);
  }
  const configuredRetries = report.config?.projects?.find(
    (project) => project.name === engine,
  )?.retries;
  if (!Number.isInteger(configuredRetries) || configuredRetries < 0) {
    violations.push(`JSON report has no valid retry configuration for project ${engine}`);
  }
  if (specs.length === 0) {
    violations.push("the JSON report contains no smoke tests");
  }

  let attempts = 0;
  let retriedAttempts = 0;
  let retryOnlyPasses = 0;
  for (const spec of specs) {
    const title = spec.title || "(untitled test)";
    if (spec.projectName && spec.projectName !== engine) {
      violations.push(`${title} belongs to project ${spec.projectName}, not ${engine}`);
    }
    if (spec.ok !== true) {
      violations.push(`${title} did not finish as an expected pass`);
    }
    const tests = Array.isArray(spec.tests) ? spec.tests : [];
    if (tests.length !== 1) {
      violations.push(`${title} must contain exactly one project test`);
      continue;
    }
    const test = tests[0];
    if (test.projectName !== engine) {
      violations.push(`${title} ran in project ${test.projectName}, not ${engine}`);
    }
    if (test.status !== "expected") {
      violations.push(`${title} has test outcome ${test.status}`);
    }
    if (test.status === "flaky") retryOnlyPasses++;
    const results = Array.isArray(test.results) ? test.results : [];
    attempts += results.length;
    retriedAttempts += results.filter((result) => result.retry > 0).length;
    if (results.length !== 1) {
      violations.push(`${title} needed ${results.length} attempts; CI retries expose flakiness`);
    }
    for (const result of results) {
      if (result.retry > 0) {
        violations.push(`${title} passed or failed only after retry ${result.retry}`);
      }
      if (result.status !== "passed") {
        violations.push(`${title} has attempt status ${result.status}`);
      }
    }
  }

  const counted = stats.expected + stats.unexpected + stats.flaky + stats.skipped;
  if (counted !== specs.length || stats.expected !== specs.length) {
    violations.push(
      `report counts ${counted} tests but expected ${specs.length} first-pass expected results`,
    );
  }
  for (const key of ["unexpected", "flaky", "skipped"]) {
    if (stats[key] > 0) violations.push(`report contains ${stats[key]} ${key} result(s)`);
  }

  return {
    stats,
    configuredRetries,
    specCount: specs.length,
    attempts,
    retriedAttempts,
    retryOnlyPasses,
    violations,
  };
}

async function probe(args) {
  const engineName = getOption(args, "--engine");
  const engine = getEngine(engineName);
  const browser = await engine.browserType.launch({ headless: true });
  try {
    const context = await browser.newContext(engine.profile.context);
    try {
      const page = await context.newPage();
      const viewport = page.viewportSize();
      const expected = engine.profile.context.viewport;
      if (viewport?.width !== expected.width || viewport?.height !== expected.height) {
        throw new Error(`unexpected viewport for ${engineName}: ${JSON.stringify(viewport)}`);
      }
      const maxTouchPoints = await page.evaluate(() => navigator.maxTouchPoints);
      if (engine.profile.mobile && maxTouchPoints < 1) {
        throw new Error(`mobile Chromium profile reported no touch points: ${maxTouchPoints}`);
      }
      const version = browser.version();
      if (!version) throw new Error(`bundled ${engine.label} returned an empty version`);

      const outputs = {
        version,
        profile: engine.profile.label,
        playwright_version: playwrightVersion,
      };
      appendLines(
        process.env.GITHUB_OUTPUT,
        Object.entries(outputs).map(([key, value]) => `${key}=${value}`),
      );
      console.log(`${engine.label}: bundled version ${version}; ${engine.profile.label}`);
    } finally {
      await context.close();
    }
  } finally {
    await browser.close();
  }
}

function summarize(args) {
  const engineName = getOption(args, "--engine");
  const engine = getEngine(engineName);
  const reportPath = getOption(args, "--report");
  const browserVersion = getOption(args, "--browser-version") || "unavailable";
  const configuredRetries = Number(getOption(args, "--configured-retries"));
  const failures = [];
  if (!Number.isInteger(configuredRetries) || configuredRetries < 0) {
    failures.push("configured CI retries must be a non-negative integer");
  }
  if (!browserVersion || browserVersion === "unavailable") {
    failures.push("bundled browser version was not recorded");
  }

  let evidence;
  try {
    const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
    evidence = inspectReport(report, engineName);
    if (evidence.configuredRetries !== configuredRetries) {
      evidence.violations.push(
        `report configured ${evidence.configuredRetries} retries, expected ${configuredRetries}`,
      );
    }
    failures.push(...evidence.violations);
  } catch (error) {
    failures.push(`JSON report is missing or invalid: ${error.message}`);
  }

  const { stats, specCount, attempts, retriedAttempts, retryOnlyPasses } = evidence ?? {};
  const duration = stats ? `${(stats.duration / 1000).toFixed(2)} s` : "unavailable";
  const retryStatus = evidence
    ? `${configuredRetries} configured; ${retriedAttempts} retried attempt(s); ` +
      `${retryOnlyPasses} retry-only pass test(s)`
    : "unavailable";
  const result = failures.length === 0 ? "PASS (strict first-attempt)" : "FAIL";
  const rows = [
    [`Playwright project`, engineName],
    [`Browser`, `${engine.label} ${browserVersion} (Playwright ${playwrightVersion})`],
    [`Profile`, engine.profile.label],
    [`Duration`, duration],
    [`Expected`, stats?.expected ?? "unavailable"],
    [`Unexpected`, stats?.unexpected ?? "unavailable"],
    [
      `Flaky / retry-only`,
      `${stats?.flaky ?? "unavailable"} / ${retryOnlyPasses ?? "unavailable"}`,
    ],
    [`Skipped`, stats?.skipped ?? "unavailable"],
    [`Attempts`, `${attempts ?? "unavailable"} across ${specCount ?? "unavailable"} test(s)`],
    [`CI retries`, retryStatus],
    [`JSON report`, `\`${reportPath}\``],
    [`Failure artifacts`, "`test-results/` (uploaded for every engine)"],
    [`Strict result`, result],
  ];

  publishSummary([
    `### ${engine.label} matrix smoke`,
    "",
    "| Evidence | Value |",
    "| --- | --- |",
    ...rows.map(([key, value]) => `| ${tableCell(key)} | ${tableCell(value)} |`),
  ]);
  if (failures.length > 0) {
    for (const failure of failures) console.error(`FAIL: ${failure}`);
    throw new Error(`${engineName} matrix failed its strict evidence policy`);
  }
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  if (command === "probe") {
    await probe(args);
  } else if (command === "summarize") {
    summarize(args);
  } else {
    throw new Error("usage: playwright-matrix-evidence.js probe|summarize ...");
  }
}

try {
  await main();
} catch (error) {
  console.error(`FAIL: ${error.message}`);
  process.exitCode = 1;
}
