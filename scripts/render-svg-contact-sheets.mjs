/**
 * render-svg-contact-sheets.mjs
 *
 * Renders every SVG in src/assets/svg/ into per-category contact sheets
 * (HTML + optional PNG screenshots) for visual QA during asset work.
 *
 * Usage:
 *   node scripts/render-svg-contact-sheets.mjs            # HTML only
 *   node scripts/render-svg-contact-sheets.mjs --png      # HTML + PNGs (needs Chrome + playwright-core)
 *   node scripts/render-svg-contact-sheets.mjs --out docs/svg-contact-sheets
 */
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SVG_DIR = join(ROOT, 'src', 'assets', 'svg');
const DEFAULT_OUT = join(ROOT, 'docs', 'svg-contact-sheets');

const args = process.argv.slice(2);
const doPng = args.includes('--png');
const outIndex = args.indexOf('--out');
let OUT = outIndex !== -1 ? args[outIndex + 1] : DEFAULT_OUT;
if (!isAbsolute(OUT)) OUT = join(ROOT, OUT);

// ---- Category grouping (order matters for readability) --------------------
function list(relDir, filter = () => true) {
  const full = join(SVG_DIR, relDir);
  return readdirSync(full).filter((f) => f.endsWith('.svg') && filter(f)).map((f) => `${relDir}/${f}`);
}

const categories = {
  ui: list('ui'),
  animals: list('animals'),
  toys: list('toys'),
  items: list('items'),
  letters: list('letters'),
  numbers: list('numbers'),
  shadows: list('shadows'),
  shapes: list('shapes', (f) => f.startsWith('shape_')),
  cutouts: list('shapes', (f) => f.startsWith('cutout_')),
  stickers: list('stickers'),
  tiles: list('ui/tiles'),
};

mkdirSync(OUT, { recursive: true });

for (const [cat, files] of Object.entries(categories)) {
  const cells = files
    .map((rel) => {
      const content = readFileSync(join(SVG_DIR, rel), 'utf8');
      const base = rel.split('/').pop().replace('.svg', '');
      return `<div class="cell"><div class="art">${content}</div><div class="label">${base}</div></div>`;
    })
    .join('');

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  body { margin: 0; background: #FAF9F6; font-family: Arial, sans-serif; }
  h1 { font-size: 28px; padding: 12px 20px; margin: 0; color: #2D3748; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 10px; padding: 12px; }
  .cell { background: #FFF8E7; border: 2px solid #E2D8C8; border-radius: 12px; padding: 10px; text-align: center; }
  .art svg { width: 100%; height: auto; display: block; }
  .label { font-size: 11px; color: #4A5568; margin-top: 6px; font-weight: bold; }
</style></head><body>
<h1>${cat} (${files.length})</h1>
<div class="grid">${cells}</div>
</body></html>`;

  writeFileSync(join(OUT, `${cat}.html`), html);
  console.log(`${cat}: ${files.length} svgs -> ${cat}.html`);
}

// ---- Optional PNG rendering -------------------------------------------------
if (!doPng) process.exit(0);

function resolvePlaywright() {
  try {
    return createRequire(import.meta.url).resolve('playwright-core');
  } catch {
    try {
      const globalRoot = execSync('npm root -g', { encoding: 'utf8' }).trim();
      return createRequire(import.meta.url).resolve(
        join(globalRoot, '@playwright', 'cli', 'node_modules', 'playwright-core'),
      );
    } catch {
      return null;
    }
  }
}

const pwPath = resolvePlaywright();
if (!pwPath) {
  console.warn('playwright-core not found — skipping PNG rendering (HTML sheets only).');
  process.exit(0);
}

const { chromium } = createRequire(import.meta.url)(pwPath);
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

for (const cat of Object.keys(categories)) {
  await page.goto(`file:///${join(OUT, `${cat}.html`).replaceAll('\\', '/')}`, { waitUntil: 'load' });
  await page.waitForTimeout(400);
  const full = await page.evaluate(() => document.body.scrollHeight);
  await page.setViewportSize({ width: 1280, height: Math.max(full, 900) });
  await page.waitForTimeout(200);
  await page.screenshot({ path: join(OUT, `${cat}.png`), fullPage: true });
  console.log(`png: ${cat}.png (height ${full})`);
}

await browser.close();
console.log('done');
