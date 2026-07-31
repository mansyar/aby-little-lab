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

const DIST_DIR = path.join(__dirname, '..', 'dist');

// Validation checks
const checks = [
  {
    name: 'Manifest exists',
    test: () => fs.existsSync(path.join(DIST_DIR, 'manifest.webmanifest')),
  },
  {
    name: 'Service worker exists',
    test: () => fs.existsSync(path.join(DIST_DIR, 'sw.js')),
  },
  {
    name: 'Workbox file exists',
    test: () => {
      const files = fs.readdirSync(DIST_DIR);
      return files.some(f => f.startsWith('workbox-') && f.endsWith('.js'));
    },
  },
  {
    name: 'Icon exists',
    test: () => fs.existsSync(path.join(DIST_DIR, 'icons', 'icon-512.png')),
  },
  {
    name: 'BGM audio exists',
    test: () => fs.existsSync(path.join(DIST_DIR, 'audio', 'bgm.mp3')),
  },
  {
    name: 'Index.html exists',
    test: () => fs.existsSync(path.join(DIST_DIR, 'index.html')),
  },
  {
    name: 'Manifest has correct name',
    test: () => {
      const manifest = JSON.parse(fs.readFileSync(path.join(DIST_DIR, 'manifest.webmanifest'), 'utf8'));
      return manifest.name === "Aby's Little Lab";
    },
  },
  {
    name: 'Manifest has landscape orientation',
    test: () => {
      const manifest = JSON.parse(fs.readFileSync(path.join(DIST_DIR, 'manifest.webmanifest'), 'utf8'));
      return manifest.orientation === 'landscape';
    },
  },
  {
    name: 'Manifest has standalone display',
    test: () => {
      const manifest = JSON.parse(fs.readFileSync(path.join(DIST_DIR, 'manifest.webmanifest'), 'utf8'));
      return manifest.display === 'standalone';
    },
  },
  {
    name: 'Service worker has precache entries',
    test: () => {
      const swContent = fs.readFileSync(path.join(DIST_DIR, 'sw.js'), 'utf8');
      return swContent.includes('precacheAndRoute');
    },
  },
  {
    name: 'Service worker includes BGM in precache',
    test: () => {
      const swContent = fs.readFileSync(path.join(DIST_DIR, 'sw.js'), 'utf8');
      return swContent.includes('audio/bgm.mp3');
    },
  },
  {
    name: 'Service worker includes navigation route',
    test: () => {
      const swContent = fs.readFileSync(path.join(DIST_DIR, 'sw.js'), 'utf8');
      return swContent.includes('NavigationRoute');
    },
  },
];

// Run validation
console.log('PWA Validation for Aby\'s Little Lab\n');
console.log('='.repeat(50));

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
  } catch (error) {
    console.log(`✗ ${check.name} (Error: ${error.message})`);
    failed++;
  }
}

console.log('='.repeat(50));
console.log(`\nResults: ${passed} passed, ${failed} failed\n`);

if (failed > 0) {
  console.log('Some checks failed. Please review the PWA configuration.');
  process.exit(1);
} else {
  console.log('All PWA validation checks passed!');
  process.exit(0);
}
