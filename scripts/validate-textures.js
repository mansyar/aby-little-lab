#!/usr/bin/env node

/**
 * Texture Budget Guard for Aby's Little Lab
 *
 * Enumerates every shipped SVG, resolves its raster tier with the same ordered
 * prefix rules as `src/utils/textureTiers.ts`, and checks the GPU-memory
 * budget after the content-depth pool expansion:
 *   1. typical tiered bytes (34 icon / 277 card / 2 hero on the shipped tree)
 *      stay within the re-baselined 80 MiB cap;
 *   2. full uniform 512² bytes stay within the re-baselined 320 MiB cap;
 *   3. tiering still buys at least a 2x saving (typical/full <= 0.5).
 *
 * The structural ratio is the real anti-bloat guard: the absolute caps are
 * re-baselined measurements with small round-number headroom, not the stale
 * 39/178 MiB figures from the 170-texture 2026-10-17 measurement.
 *
 * `TEXTURE_GUARD_FIXTURE_DIR` may point at a directory of SVG files to run the
 * guard against a synthetic tree (used to prove the failure path).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SVG_ROOT = process.env.TEXTURE_GUARD_FIXTURE_DIR
  ? path.resolve(process.env.TEXTURE_GUARD_FIXTURE_DIR)
  : path.join(__dirname, "..", "src", "assets", "svg");

const MIB = 1024 * 1024;
const BYTES_PER_PIXEL = 4; // RGBA
const SIZES = { icon: 160, card: 256, hero: 512 };
// Mirror of textureTiers.ts TIER_RULES — keep in sync with that module.
const TIER_RULES = [
  [/^tile_/, "icon"],
  [/^group_/, "icon"],
  [/^sm_shadow_/, "icon"],
  [/^(minus|plus|equals|sleep_zzz|icon_speaker)$/, "icon"],
  [/^mascot_/, "hero"],
];
const TYPICAL_CAP_MIB = 80;
const FULL_CAP_MIB = 320;
const RATIO_CAP = 0.5;

function tierForKey(key) {
  for (const [pattern, tier] of TIER_RULES) {
    if (pattern.test(key)) return tier;
  }
  return "card";
}

function collectSvgFiles(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...collectSvgFiles(full));
    else if (entry.name.endsWith(".svg")) files.push(full);
  }
  return files;
}

if (!fs.existsSync(SVG_ROOT)) {
  console.error(`FAIL: SVG directory not found: ${SVG_ROOT}`);
  process.exit(1);
}

const files = collectSvgFiles(SVG_ROOT);
if (files.length === 0) {
  console.error(`FAIL: no SVG files found under ${SVG_ROOT}`);
  process.exit(1);
}

// Texture keys are SVG basenames (the registry loads them by basename), so a
// duplicate basename across folders would be an ambiguous raster key.
const keys = new Set();
const duplicates = [];
for (const file of files) {
  const key = path.basename(file, ".svg");
  if (keys.has(key)) duplicates.push(key);
  else keys.add(key);
}
if (duplicates.length > 0) {
  console.error(`FAIL: duplicate SVG texture keys: ${duplicates.join(", ")}`);
  process.exit(1);
}

const counts = { icon: 0, card: 0, hero: 0 };
let typicalBytes = 0;
for (const key of keys) {
  const tier = tierForKey(key);
  const size = SIZES[tier];
  counts[tier]++;
  typicalBytes += size * size * BYTES_PER_PIXEL;
}
const fullBytes = keys.size * SIZES.hero * SIZES.hero * BYTES_PER_PIXEL;
const typicalMiB = typicalBytes / MIB;
const fullMiB = fullBytes / MIB;
const ratio = typicalBytes / fullBytes;

console.log(
  `Texture guard: ${keys.size} SVGs (${counts.icon} icon / ${counts.card} card / ${counts.hero} hero)`,
);

let failures = 0;
if (typicalMiB <= TYPICAL_CAP_MIB) {
  console.log(`PASS: typical tiered = ${typicalMiB.toFixed(2)} MiB (<= ${TYPICAL_CAP_MIB} MiB)`);
} else {
  console.error(`FAIL: typical tiered = ${typicalMiB.toFixed(2)} MiB (> ${TYPICAL_CAP_MIB} MiB)`);
  failures++;
}
if (fullMiB <= FULL_CAP_MIB) {
  console.log(`PASS: full uniform 512² = ${fullMiB.toFixed(2)} MiB (<= ${FULL_CAP_MIB} MiB)`);
} else {
  console.error(`FAIL: full uniform 512² = ${fullMiB.toFixed(2)} MiB (> ${FULL_CAP_MIB} MiB)`);
  failures++;
}
if (ratio <= RATIO_CAP) {
  console.log(`PASS: tier ratio = ${ratio.toFixed(3)} (<= ${RATIO_CAP.toFixed(3)})`);
} else {
  console.error(`FAIL: tier ratio = ${ratio.toFixed(3)} (> ${RATIO_CAP.toFixed(3)})`);
  failures++;
}

if (failures > 0) {
  console.error(`\nTexture validation failed: ${failures} check(s) failed.`);
  process.exit(1);
}
console.log("\nAll texture validation checks passed!");
process.exit(0);
