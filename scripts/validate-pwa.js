#!/usr/bin/env node

/**
 * PWA Validation Script for Aby's Little Lab
 *
 * This script validates the PWA configuration and generated artifacts.
 * Run after `pnpm run build` to ensure all PWA requirements are met.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.join(__dirname, "..", "dist");
const ASSETS_DIR = path.join(DIST_DIR, "assets");

function readServiceWorker() {
  return fs.readFileSync(path.join(DIST_DIR, "sw.js"), "utf8");
}

function readPrecacheManifest() {
  const serviceWorker = readServiceWorker();
  const callStart = serviceWorker.indexOf("precacheAndRoute(");
  const start = serviceWorker.indexOf("[", callStart);
  if (callStart < 0 || start < 0) return "";

  let depth = 0;
  for (let index = start; index < serviceWorker.length; index++) {
    if (serviceWorker[index] === "[") depth++;
    if (serviceWorker[index] === "]") depth--;
    if (depth === 0) return serviceWorker.slice(start, index + 1);
  }
  return "";
}

/**
 * Chunks workbox itself refuses to precache, by bare file name.
 *
 * Empty on purpose: every emitted chunk is currently under workbox's default
 * `maximumFileSizeToCacheInBytes` (2 MiB), so every one of them is listed. Add
 * a name here only when workbox genuinely cannot take the file, and say why —
 * never to silence a chunk that is simply missing from the manifest.
 */
const PRECACHE_ALLOWLIST = new Set();

/**
 * The emitted JavaScript chunks and how many of them the service worker
 * precaches. Shared by the check and its printed note so the reader sees the
 * rule working (`N chunks, M precached`) on a pass as well as a failure.
 */
function precacheCoverage() {
  const manifest = readPrecacheManifest();
  const precached = new Set(Array.from(manifest.matchAll(/url:"([^"]+)"/g), (match) => match[1]));

  const chunks = fs.existsSync(ASSETS_DIR)
    ? fs
        .readdirSync(ASSETS_DIR)
        .filter((file) => file.endsWith(".js"))
        .sort()
    : [];

  return {
    chunks,
    precached: chunks.filter((file) => precached.has(`assets/${file}`)).length,
    missing: chunks.filter(
      (file) => !precached.has(`assets/${file}`) && !PRECACHE_ALLOWLIST.has(file),
    ),
  };
}

// Validation checks
const checks = [
  {
    name: "Manifest exists",
    test: () => fs.existsSync(path.join(DIST_DIR, "manifest.webmanifest")),
  },
  {
    name: "Service worker exists",
    test: () => fs.existsSync(path.join(DIST_DIR, "sw.js")),
  },
  {
    name: "Workbox file exists",
    test: () => {
      const files = fs.readdirSync(DIST_DIR);
      return files.some((f) => f.startsWith("workbox-") && f.endsWith(".js"));
    },
  },
  {
    name: "Icon exists",
    test: () => fs.existsSync(path.join(DIST_DIR, "icons", "icon-512.png")),
  },
  {
    name: "BGM audio exists",
    test: () => fs.existsSync(path.join(DIST_DIR, "audio", "bgm.mp3")),
  },
  {
    name: "Index.html exists",
    test: () => fs.existsSync(path.join(DIST_DIR, "index.html")),
  },
  {
    name: "Manifest has correct name",
    test: () => {
      const manifest = JSON.parse(
        fs.readFileSync(path.join(DIST_DIR, "manifest.webmanifest"), "utf8"),
      );
      return manifest.name === "Aby's Little Lab";
    },
  },
  {
    name: "Manifest has landscape orientation",
    test: () => {
      const manifest = JSON.parse(
        fs.readFileSync(path.join(DIST_DIR, "manifest.webmanifest"), "utf8"),
      );
      return manifest.orientation === "landscape";
    },
  },
  {
    name: "Manifest has standalone display",
    test: () => {
      const manifest = JSON.parse(
        fs.readFileSync(path.join(DIST_DIR, "manifest.webmanifest"), "utf8"),
      );
      return manifest.display === "standalone";
    },
  },
  {
    name: "Manifest requests fullscreen with standalone fallback",
    test: () => {
      const manifest = JSON.parse(
        fs.readFileSync(path.join(DIST_DIR, "manifest.webmanifest"), "utf8"),
      );
      return (
        Array.isArray(manifest.display_override) &&
        manifest.display_override.includes("fullscreen") &&
        manifest.display_override.includes("standalone")
      );
    },
  },
  {
    name: "Service worker has precache entries",
    test: () => {
      const swContent = fs.readFileSync(path.join(DIST_DIR, "sw.js"), "utf8");
      return swContent.includes("precacheAndRoute");
    },
  },
  {
    name: "Service worker includes BGM in precache",
    test: () => {
      const swContent = fs.readFileSync(path.join(DIST_DIR, "sw.js"), "utf8");
      return swContent.includes("audio/bgm.mp3");
    },
  },
  {
    // FR-7 / NFR-2: every emitted chunk — shell, vendor, and each game's lazy
    // art chunk — must be in the precache manifest, or the first offline play
    // of that game is a failed request on a child's device instead of a build
    // failure here. Entries are `{url:"assets/x.js",revision:…}`.
    name: "Service worker precaches every emitted JavaScript chunk",
    test: () => {
      const { chunks, missing } = precacheCoverage();
      return chunks.length > 0 && missing.length === 0;
    },
    note: () => {
      const { chunks, precached, missing } = precacheCoverage();
      const summary = `${chunks.length} chunks, ${precached} precached`;
      return missing.length > 0 ? `${summary}, missing: ${missing.join(", ")}` : summary;
    },
  },
  {
    // The Ligne engine was removed (tween/SVG-only mascot): no .ligne
    // animation asset may remain in the precache.
    name: "Service worker precache contains no Ligne animation asset",
    test: () => !readPrecacheManifest().includes(".ligne"),
  },
  {
    // The Ligne engine was removed (tween/SVG-only mascot): no WASM engine
    // may remain in the precache.
    name: "Service worker precache contains no Ligne WASM engine",
    test: () => !readPrecacheManifest().includes("ligne_wasm_bg"),
  },
  {
    name: "Service worker includes navigation route",
    test: () => {
      const swContent = fs.readFileSync(path.join(DIST_DIR, "sw.js"), "utf8");
      return swContent.includes("NavigationRoute");
    },
  },
];

// Run validation
console.log("PWA Validation for Aby's Little Lab\n");
console.log("=".repeat(50));

let passed = 0;
let failed = 0;

for (const check of checks) {
  try {
    const result = check.test();
    if (result) {
      console.log(`✓ ${check.name}`);
      passed++;
    } else {
      console.log(`✗ ${check.name}`);
      failed++;
    }
    if (check.note) {
      console.log(`  ${check.note()}`);
    }
  } catch (error) {
    console.log(`✗ ${check.name} (Error: ${error.message})`);
    failed++;
  }
}

console.log("=".repeat(50));
console.log(`\nResults: ${passed} passed, ${failed} failed\n`);

if (failed > 0) {
  console.log("Some checks failed. Please review the PWA configuration.");
  process.exit(1);
} else {
  console.log("All PWA validation checks passed!");
  process.exit(0);
}
