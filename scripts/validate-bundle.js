#!/usr/bin/env node

/**
 * Bundle Validation Script for Aby's Little Lab
 *
 * Validates the production bundle shape after `pnpm run build`:
 *   1. A distinct Phaser vendor chunk exists (isolated engine, cached across
 *      releases so app updates download only the shell delta).
 *   2. The shell entry chunk (index-*.js) stays <= 200 kB minified, guarding
 *      against shell bloat regressions.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.join(__dirname, "..", "dist");
const ASSETS_DIR = path.join(DIST_DIR, "assets");
const SHELL_MAX_BYTES = 200 * 1024; // 200 kB minified
const PHASER_CHUNK_RE = /^phaser-[^.]+\.js$/;
const ENTRY_CHUNK_RE = /^index-[^.]+\.js$/;

if (!fs.existsSync(ASSETS_DIR)) {
  console.error(
    "FAIL: dist/assets not found — run 'pnpm run build' before validate-bundle.",
  );
  process.exit(1);
}

const jsFiles = fs
  .readdirSync(ASSETS_DIR)
  .filter((f) => f.endsWith(".js"));

let failures = 0;

// Check 1: exactly one Phaser vendor chunk exists
const phaserChunks = jsFiles.filter((f) => PHASER_CHUNK_RE.test(f));
if (phaserChunks.length === 0) {
  console.error(`FAIL: no Phaser vendor chunk (expected ${PHASER_CHUNK_RE})`);
  failures++;
} else if (phaserChunks.length > 1) {
  console.error(
    `FAIL: expected exactly one Phaser vendor chunk, found ${phaserChunks.length}: ${phaserChunks.join(", ")}`,
  );
  failures++;
} else {
  const sizeKb = (
    fs.statSync(path.join(ASSETS_DIR, phaserChunks[0])).size / 1024
  ).toFixed(1);
  console.log(`PASS: Phaser vendor chunk present: ${phaserChunks[0]} (${sizeKb} kB)`);
}

// Check 2: shell entry chunk(s) stay within the size budget
const entryChunks = jsFiles.filter((f) => ENTRY_CHUNK_RE.test(f));
if (entryChunks.length === 0) {
  console.error(`FAIL: no shell entry chunk (expected ${ENTRY_CHUNK_RE})`);
  failures++;
} else {
  for (const file of entryChunks) {
    const sizeBytes = fs.statSync(path.join(ASSETS_DIR, file)).size;
    const sizeKb = (sizeBytes / 1024).toFixed(1);
    if (sizeBytes <= SHELL_MAX_BYTES) {
      console.log(`PASS: shell entry ${file} = ${sizeKb} kB (<= 200 kB)`);
    } else {
      console.error(`FAIL: shell entry ${file} = ${sizeKb} kB (> 200 kB)`);
      failures++;
    }
  }
}

if (failures > 0) {
  console.error(`\nBundle validation failed: ${failures} check(s) failed.`);
  process.exit(1);
} else {
  console.log("\nAll bundle validation checks passed!");
  process.exit(0);
}
