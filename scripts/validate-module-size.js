#!/usr/bin/env node

/**
 * Module-size Guard for Aby's Little Lab
 *
 * Counts physical lines in production TypeScript modules and enforces the
 * strict budget with no allowlist or grandfathering:
 *   1. warn when a module exceeds 400 lines (FR-4 budget);
 *   2. fail (exit 1) when a module exceeds 600 lines (FR-5 hard limit).
 *
 * Production means TypeScript files below `src` in any subdirectory;
 * `src/__tests__`, e2e and declaration files are not shipped modules and are
 * not counted.
 *
 * `MODULE_GUARD_FIXTURE_DIR` may point at a directory of `.ts` files to run the
 * guard against a synthetic tree (used to prove the failure path).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC_ROOT = process.env.MODULE_GUARD_FIXTURE_DIR
  ? path.resolve(process.env.MODULE_GUARD_FIXTURE_DIR)
  : path.join(__dirname, "..", "src");

const WARN_LINES = 400;
const FAIL_LINES = 600;

function collectTypeScriptFiles(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "__tests__") files.push(...collectTypeScriptFiles(full));
    } else if (entry.name.endsWith(".ts") && !entry.name.endsWith(".d.ts")) {
      files.push(full);
    }
  }
  return files;
}

function countLines(file) {
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  // A trailing newline terminates the last line; it is not a line of its own.
  if (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();
  return lines.length;
}

if (!fs.existsSync(SRC_ROOT)) {
  console.error(`FAIL: TypeScript source directory not found: ${SRC_ROOT}`);
  process.exit(1);
}

const files = collectTypeScriptFiles(SRC_ROOT).sort();
if (files.length === 0) {
  console.error(`FAIL: no TypeScript files found under ${SRC_ROOT}`);
  process.exit(1);
}

console.log(
  `Module-size guard: ${files.length} TypeScript files under ${SRC_ROOT} (warn >${WARN_LINES}, fail >${FAIL_LINES})`,
);

const warnings = [];
const failures = [];
for (const file of files) {
  const lineCount = countLines(file);
  const display = path.relative(SRC_ROOT, file);
  if (lineCount > FAIL_LINES) {
    failures.push({ display, lineCount, limit: FAIL_LINES });
  } else if (lineCount > WARN_LINES) {
    warnings.push({ display, lineCount, limit: WARN_LINES });
  }
}

for (const { display, lineCount, limit } of warnings) {
  console.warn(`WARN: ${display} — ${lineCount} lines (> ${limit})`);
}
for (const { display, lineCount, limit } of failures) {
  console.error(`FAIL: ${display} — ${lineCount} lines (> ${limit})`);
}

if (failures.length > 0) {
  console.error(
    `\nModule-size validation failed: ${failures.length} file(s) over ${FAIL_LINES} lines.`,
  );
  process.exit(1);
}
if (warnings.length > 0) {
  console.log(`\nModule-size validation passed with ${warnings.length} warning(s).`);
} else {
  console.log("\nAll module-size validation checks passed — zero warnings.");
}
process.exit(0);
