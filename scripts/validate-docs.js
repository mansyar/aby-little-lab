#!/usr/bin/env node

/**
 * Document Validation Script for Aby's Little Lab
 *
 * This script asserts the durable invariants between the documentation and the
 * code: the release-note index is complete, every relative link and every
 * anchor resolves, the three game lists agree with `GAME_REGISTRY`, the
 * roadmap carries both of its sections, and no document points at a Conductor
 * path that does not exist.
 *
 * The two scans over prose differ in what they blank. The link check blanks
 * inline code spans as well as fenced blocks, because a backticked word is not
 * an anchor. The Conductor-path check keeps inline code spans, because that
 * is how the documents write their Conductor paths, and a check that cannot
 * read them would pass vacuously.
 *
 * A link to a directory counts as resolved only when the directory holds at
 * least one file: git cannot track an empty directory, so a link to one is
 * dead in a fresh checkout even though it resolves on the machine that wrote
 * it.
 *
 * It checks invariants, never snapshots. A number that moves - a new chunk, a
 * new release - never fails this script; only the documents and the code
 * genuinely parting company does. One check is deliberately carved out:
 * checkTestCounts derives the test-suite truth (the number of test files and
 * of test cases) from one collect-only `vitest list` run at validation time,
 * and fails when a living document disagrees with it. Count drift in the
 * living docs is exactly the failure that check exists to catch, so its
 * snapshot is derived fresh on every run rather than baked in.
 *
 * Run it on its own, or after `pnpm run build`:
 *   node scripts/validate-docs.js
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.join(__dirname, "..");
const DOCS_DIR = path.join(ROOT, "docs");
const CONDUCTOR_DIR = path.join(ROOT, "conductor");
const README_FILE = path.join(ROOT, "README.md");
const PRD_FILE = path.join(DOCS_DIR, "PRD.md");
const TDD_FILE = path.join(DOCS_DIR, "TDD.md");
const ROADMAP_FILE = path.join(DOCS_DIR, "roadmap.md");
const PERF_BASELINE_FILE = path.join(DOCS_DIR, "perf-baseline.md");
const REGISTRY_FILE = path.join(ROOT, "src", "game", "gameRegistry.ts");

/** A Markdown link: `[text](target)`, with its line number in the source file. */
const LINK_RE = /!?\[[^\]]*\]\(([^()\s]+)(?:\s+"[^"]*")?\)/g;
/** A fenced code block delimiter. */
const FENCE_RE = /^\s*(?:```|~~~)/;
/**
 * A Conductor path anywhere in the prose, backticked ones included:
 * `conductor/tracks/…` or `conductor/archive/…`.
 *
 * The path part is optional, so a path written without its trailing segment -
 * `conductor/tracks/20261022-docs-roadmap-truth` rather than
 * `conductor/tracks/20261022-docs-roadmap-truth/` - is seen as well. The group
 * is greedy, so a path that ends in a slash still matches whole.
 */
const CONDUCTOR_PATH_RE =
  /(?:[A-Za-z0-9_.-]+\/)*conductor\/(?:tracks|archive)(?:\/[^\s`<>()[\]"',;|!?]*)?/g;

// ---------------------------------------------------------------------------
// Reading helpers
// ---------------------------------------------------------------------------

function readLines(file) {
  return fs.readFileSync(file, "utf8").split(/\r?\n/);
}

/** The repository-relative path of a file, for the report. */
function relative(file) {
  return path.relative(ROOT, file).split(path.sep).join("/");
}

/**
 * The lines of a Markdown file with its fenced code blocks blanked out.
 *
 * A fenced code block is an example rather than a reference, so every line of
 * one is nulled. Inline code spans are left intact: the Conductor-path check
 * has to see the paths the documents write inside backticks.
 */
function unfencedLines(file) {
  const lines = [];
  let inFence = false;
  for (const line of readLines(file)) {
    if (FENCE_RE.test(line)) {
      inFence = !inFence;
      lines.push(null);
      continue;
    }
    lines.push(inFence ? null : line);
  }
  return lines;
}

/**
 * The lines of a Markdown file as a reader sees them: fenced code blocks and
 * inline code spans are blanked out, because neither is rendered as text and
 * neither may be read as a link.
 */
function renderedLines(file) {
  return unfencedLines(file).map((line) => (line === null ? null : line.replace(/`[^`]*`/g, "")));
}

/** The headings of a Markdown file, in order, with their text and line numbers. */
function headingsOf(file) {
  const headings = [];
  let inFence = false;
  readLines(file).forEach((line, index) => {
    if (FENCE_RE.test(line)) {
      inFence = !inFence;
      return;
    }
    if (inFence) return;
    const match = /^(#{1,6})\s+(.*?)\s*#*\s*$/.exec(line);
    if (match) headings.push({ text: match[2], line: index + 1 });
  });
  return headings;
}

/**
 * The GitHub anchor slug of a heading.
 *
 * Lowercase it, drop everything that is not a letter, a digit, a space, a
 * hyphen or an underscore, then turn every space into a hyphen. Inline code
 * backticks and emphasis markers are stripped as part of that, so
 * `### 2.2 The \`src/\` tree` slugifies to `22-the-src-tree` and
 * `### 3.6 Big & Small` to `36-big--small`.
 */
function slugify(text) {
  return text
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/`/g, "")
    .replace(/\*/g, "")
    .replace(/^_+|_+$/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N} _-]/gu, "")
    .replace(/ /g, "-");
}

/**
 * Every anchor a file offers, including the `-1`, `-2` suffixes GitHub gives
 * to repeated headings.
 */
function anchorSet(file) {
  const anchors = new Set();
  const seen = new Map();
  for (const heading of headingsOf(file)) {
    const base = slugify(heading.text);
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    anchors.add(count === 0 ? base : `${base}-${count}`);
  }
  return anchors;
}

/** Every Markdown link in a file, with the line it sits on. */
function linksOf(file) {
  const links = [];
  renderedLines(file).forEach((line, index) => {
    if (line === null) return;
    for (const match of line.matchAll(LINK_RE)) {
      links.push({ target: match[1], line: index + 1 });
    }
  });
  return links;
}

/** The documents this script governs: the README, `docs/*.md` and `conductor/*.md`. */
function governedFiles() {
  const files = [README_FILE];
  for (const dir of [DOCS_DIR, CONDUCTOR_DIR]) {
    for (const name of fs.readdirSync(dir)) {
      const file = path.join(dir, name);
      if (name.endsWith(".md") && fs.statSync(file).isFile()) files.push(file);
    }
  }
  return files;
}

// ---------------------------------------------------------------------------
// Target resolution
// ---------------------------------------------------------------------------

function isExternal(target) {
  return /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(target);
}

/** A template placeholder (`<track-id>`), not a path. */
function isTemplate(target) {
  return target.includes("<") || target.includes(">");
}

/**
 * Split a link target into the file it points at and the anchor inside it.
 * The path resolves relative to the file that holds the link, never relative
 * to the repository root.
 */
function resolveTarget(fromFile, target) {
  const hash = target.indexOf("#");
  const pathPart = hash === -1 ? target : target.slice(0, hash);
  const anchor = hash === -1 ? null : decodeURIComponent(target.slice(hash + 1));
  const resolved =
    pathPart === "" ? fromFile : path.resolve(path.dirname(fromFile), decodeURIComponent(pathPart));
  return { resolved, anchor };
}

/** A path as it would sit under the repository root, without `.` or `..` steps. */
function repoRelative(target) {
  const parts = target.split("/").filter((part) => part !== "" && part !== ".");
  while (parts.length > 0 && parts[0] === "..") parts.shift();
  return parts.join("/");
}

/**
 * Whether a Conductor path exists.
 *
 * A track's directory moves from `conductor/tracks/` to `conductor/archive/`
 * when the track completes, so a path that names the live location is also
 * accepted when it names the archived one.
 */
function conductorPathExists(target) {
  const relativePath = repoRelative(target);
  if (relativePath === "") return true;
  if (fs.existsSync(path.join(ROOT, relativePath))) return true;
  const archived = relativePath.replace(/^conductor\/tracks\//, "conductor/archive/");
  return archived !== relativePath && fs.existsSync(path.join(ROOT, archived));
}

// ---------------------------------------------------------------------------
// Failure reporting
// ---------------------------------------------------------------------------

const failures = [];

function fail(file, line, expected, found) {
  failures.push({ file: relative(file), line, expected, found });
}

// ---------------------------------------------------------------------------
// Check 1 - the release-note index is complete
// ---------------------------------------------------------------------------

function checkReleaseNoteIndex() {
  const notes = fs
    .readdirSync(DOCS_DIR)
    .filter((name) => /^release-notes-v.*\.md$/.test(name))
    .sort();
  const linked = new Set(
    linksOf(README_FILE).map((link) =>
      path.normalize(resolveTarget(README_FILE, link.target).resolved),
    ),
  );
  const indexLine =
    headingsOf(README_FILE).find((heading) => heading.text === "Documentation")?.line ?? 1;
  for (const note of notes) {
    const file = path.join(DOCS_DIR, note);
    if (!linked.has(path.normalize(file))) {
      fail(
        README_FILE,
        indexLine,
        `docs/${note} to be linked from the README's Documentation index`,
        "the README links no such file",
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Check 2 - every relative link resolves, and every anchor matches a heading
//
// A link to a directory counts as resolved only when the directory holds at
// least one file. Git cannot track an empty directory, so a link to one is
// dead in a fresh checkout even though it resolves on the machine that wrote
// it - a failure a local run cannot see on its own.
// ---------------------------------------------------------------------------

function checkLinks() {
  for (const file of governedFiles()) {
    for (const link of linksOf(file)) {
      if (isExternal(link.target) || isTemplate(link.target)) continue;
      const { resolved, anchor } = resolveTarget(file, link.target);
      if (!fs.existsSync(resolved)) {
        fail(
          file,
          link.line,
          `the link "${link.target}" to resolve to an existing file or directory`,
          `no such path: ${relative(resolved)}`,
        );
        continue;
      }
      if (fs.statSync(resolved).isDirectory()) {
        // Git cannot track an empty directory, so a link to one is dead in a
        // fresh checkout even though it resolves on the machine that wrote it.
        if (fs.readdirSync(resolved).length === 0) {
          fail(
            file,
            link.line,
            `the directory the link "${link.target}" points at to hold at least one file`,
            `the directory is empty, and git cannot track an empty directory, so the link is dead in a fresh checkout: ${relative(resolved)}`,
          );
        }
        continue;
      }
      if (anchor && !anchorSet(resolved).has(anchor)) {
        fail(
          file,
          link.line,
          `the anchor "#${anchor}" to match a heading in ${relative(resolved)}`,
          `no heading in ${relative(resolved)} has that slug`,
        );
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Check 3 - the three game lists agree with the code
// ---------------------------------------------------------------------------

/**
 * The games as the code declares them, in file order: the stable id, the
 * Phaser scene key and the shipped tile label.
 */
function registryEntries() {
  const text = fs.readFileSync(REGISTRY_FILE, "utf8");
  const chunks = text.split(/gameId:\s*"/).slice(1);
  return chunks.map((chunk) => ({
    gameId: chunk.slice(0, chunk.indexOf('"')),
    sceneKey: /sceneKey:\s*"([^"]+)"/.exec(chunk)?.[1] ?? "",
    label: /label:\s*"([^"]+)"/.exec(chunk)?.[1] ?? "",
  }));
}

/** The README's `## Mini-Games` list: the link text and the anchor, in order. */
function readmeGames() {
  const lines = readLines(README_FILE);
  const start = lines.findIndex((line) => line.trim() === "## Mini-Games");
  if (start === -1) return [];
  const games = [];
  for (const line of lines.slice(start + 1)) {
    if (/^##\s/.test(line)) break;
    const match = /^- \[([^\]]+)\]\(([^)]+)\)/.exec(line);
    if (!match) continue;
    const hash = match[2].indexOf("#");
    games.push({ label: match[1], anchor: hash === -1 ? null : match[2].slice(hash + 1) });
  }
  return games;
}

/** The PRD's `### 3.N` game headings: the section number and its slug, in order. */
function prdGames() {
  return headingsOf(PRD_FILE)
    .filter((heading) => /^3\.\d+\s/.test(heading.text))
    .map((heading) => {
      const number = Number.parseInt(/^3\.(\d+)/.exec(heading.text)[1], 10);
      return { number, slug: slugify(heading.text) };
    });
}

/** The TDD's §4.5 table: one row per game, in order. */
function tddGameRows() {
  const lines = readLines(TDD_FILE);
  const start = lines.findIndex((line) => line.trim() === "### 4.5 Which game extends what");
  if (start === -1) return [];
  const rows = [];
  for (const line of lines.slice(start + 1)) {
    if (/^#{1,6}\s/.test(line)) break;
    const cells = line.split("|");
    if (cells.length < 4) continue;
    const number = Number.parseInt(cells[1].trim(), 10);
    if (!Number.isInteger(number)) continue;
    const scene = /`([A-Za-z0-9_]+)`/.exec(cells[3])?.[1] ?? "";
    rows.push({ number, scene });
  }
  return rows;
}

/** The scene key a TDD row names, with the class suffix the table uses. */
function sceneKeyOf(sceneClass) {
  return sceneClass.replace(/Scene$/, "").toLowerCase();
}

/** The line of the README's Mini-Games list item at `index`. */
function miniGamesLine(index) {
  const lines = readLines(README_FILE);
  const start = lines.findIndex((line) => line.trim() === "## Mini-Games");
  const offset = lines.slice(start + 1).findIndex((line) => /^- \[/.test(line));
  return start + 2 + offset + index;
}

function checkGameLists() {
  const registry = registryEntries();
  const readme = readmeGames();
  const prd = prdGames();
  const tdd = tddGameRows();

  const counts = {
    registry: registry.length,
    readme: readme.length,
    prd: prd.length,
    tdd: tdd.length,
  };
  if (new Set(Object.values(counts)).size > 1) {
    fail(
      REGISTRY_FILE,
      1,
      "the registry, the README list, the PRD headings and the TDD table to have the same number of games",
      `registry ${counts.registry}, README ${counts.readme}, PRD ${counts.prd}, TDD ${counts.tdd}`,
    );
    return;
  }

  for (const [index, entry] of registry.entries()) {
    const item = readme[index];
    if (item && item.label !== entry.label) {
      fail(
        README_FILE,
        miniGamesLine(index),
        `the README item ${index + 1} to be labelled "${entry.label}"`,
        `it reads "${item.label}"`,
      );
    }
    const heading = prd.find((game) => game.number === index + 1);
    if (item && heading && item.anchor !== heading.slug) {
      fail(
        README_FILE,
        miniGamesLine(index),
        `the README item ${index + 1} to link to the PRD anchor "#${heading.slug}"`,
        `it links to "#${item.anchor ?? "(no anchor)"}"`,
      );
    }
    const row = tdd[index];
    if (row && sceneKeyOf(row.scene) !== entry.sceneKey.toLowerCase()) {
      fail(
        TDD_FILE,
        1,
        `the TDD §4.5 row ${index + 1} to name the scene of "${entry.label}" (${entry.sceneKey})`,
        `it names "${row.scene}"`,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Check 4 - the roadmap has both sections
// ---------------------------------------------------------------------------

function checkRoadmap() {
  const headings = new Set(headingsOf(ROADMAP_FILE).map((heading) => heading.text));
  for (const section of ["Known Issues", "Future Work / Roadmap"]) {
    if (!headings.has(section)) {
      fail(ROADMAP_FILE, 1, `a "## ${section}" section`, "the section is missing");
    }
  }
}

// ---------------------------------------------------------------------------
// Check 5 - no document points at a Conductor path that does not exist
// ---------------------------------------------------------------------------

function checkConductorPaths() {
  for (const file of governedFiles()) {
    unfencedLines(file).forEach((line, index) => {
      if (line === null) return;
      for (const match of line.matchAll(CONDUCTOR_PATH_RE)) {
        const target = match[0].replace(/[.:]+$/, "");
        if (isTemplate(target)) continue;
        if (!conductorPathExists(target)) {
          fail(
            file,
            index + 1,
            `"${target}" to exist under conductor/tracks/ or conductor/archive/`,
            "no such path in the repository",
          );
        }
      }
    });
  }
}

// ---------------------------------------------------------------------------
// Check 6 - the living docs state the current test-suite truth
//
// The one snapshot-style check, and deliberately so. It derives the true
// suite numbers from a single collect-only `vitest list` run - no tests are
// executed, nothing is watched - and then fails every count claim a living
// document (README, TDD, perf baseline) makes that disagrees with that truth.
// When it fails, the DOCUMENT is stale: refresh the document to the current
// suite truth; do not change the code to match the document.
//
// The derivation parses `vitest list` output defensively. A test-case line
// has the shape `<file path> > <suite...> > <test name>`; the file count is
// the number of distinct first segments ending in `.test.ts`, the test count
// the number of such lines. Headers, blank lines and progress noise do not
// match the shape and are ignored. If nothing matches, the derivation
// failed - the check says so instead of passing vacuously or blaming the
// docs.
// ---------------------------------------------------------------------------

/** The three living documents whose count claims this check guards. */
const SUITE_DOCS = [README_FILE, TDD_FILE, PERF_BASELINE_FILE];

/**
 * ANSI escape sequences `vitest list` may emit before or inside a line.
 * Built through the RegExp constructor because a regex literal cannot hold
 * the escape character (ESC) without tripping the control-character rule.
 */
const ANSI_RE = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*[A-Za-z]`, "g");

/** A count claim: `2,729 tests`, `2,729 test cases`, `125 test files`, `125 files`. */
const TESTS_CLAIM_RE = /\b\d[\d,]*\s+tests\b/g;
const TEST_CASES_CLAIM_RE = /\b\d[\d,]*\s+test\s+cases\b/g;
const TEST_FILES_CLAIM_RE = /\b\d[\d,]*\s+test\s+files\b/g;
const FILES_CLAIM_RE = /\b\d[\d,]*\s+files\b/g;

/**
 * A bare `<N> files` claim is suite-shaped only when the same line also
 * claims a test count: "125 files / 2,729 tests" guards both numbers, while
 * "components/ # 17 files" in a tree diagram describes a directory and is
 * left alone.
 */

/**
 * The suite truth derived from one collect-only `vitest list` run, or the
 * reason the derivation failed. One spawn, no retries.
 */
function deriveSuiteTruth() {
  // `--no-staticParse` matters: since vitest 5 the `list` command AST-parses
  // test files instead of importing them, and dynamically registered tests
  // (loops over imported data, conditionally created suites) never appear in
  // its output. Static parsing under-counted the suite by 305 tests, so the
  // derivation collects the way the runner itself does.
  const result = spawnSync("pnpm", ["exec", "vitest", "list", "--no-staticParse"], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
    // `vitest list` is collect-only by definition: it collects the suite and
    // exits, never watching. CI=1 keeps the run non-interactive and plain.
    env: { ...process.env, CI: "1" },
    // pnpm is a .cmd shim on Windows, which spawnSync cannot execute without
    // a shell; the arguments carry no spaces or metacharacters.
    shell: process.platform === "win32",
  });
  if (result.error) {
    return {
      error: `spawning "pnpm exec vitest list --no-staticParse" failed: ${result.error.message}`,
    };
  }
  if (result.status !== 0) {
    return {
      error: `"pnpm exec vitest list --no-staticParse" exited with status ${result.status}`,
    };
  }
  const files = new Set();
  let tests = 0;
  for (const rawLine of `${result.stdout ?? ""}\n${result.stderr ?? ""}`.split(/\r?\n/)) {
    const line = rawLine.replace(ANSI_RE, "");
    const separator = line.indexOf(" > ");
    if (separator === -1) continue;
    const file = /(\S+\.test\.ts)$/.exec(line.slice(0, separator))?.[1];
    if (!file) continue;
    files.add(file.replace(/\\/g, "/"));
    tests += 1;
  }
  return { files: files.size, tests };
}

/** Whether a documented number agrees with the derived truth behind it. */
function claimAgrees(claim, derived) {
  return Number(claim.match(/\d[\d,]*/)[0].replace(/,/g, "")) === derived;
}

function checkTestCounts() {
  const truth = deriveSuiteTruth();
  if (truth.error || truth.files === 0) {
    fail(
      README_FILE,
      1,
      'the suite truth to be derivable from one collect-only "vitest list" run',
      `the derivation failed (${truth.error ?? "the output named no test files"}), so no count claim was checked`,
    );
    return;
  }
  const expected = `the documented suite counts to match the derived truth (${truth.files} files / ${truth.tests} tests) - refresh the document to the current suite truth; do not change the code`;
  for (const file of SUITE_DOCS) {
    unfencedLines(file).forEach((line, index) => {
      if (line === null) return;
      const testClaims = [...line.matchAll(TESTS_CLAIM_RE), ...line.matchAll(TEST_CASES_CLAIM_RE)];
      for (const claim of testClaims) {
        if (!claimAgrees(claim[0], truth.tests)) {
          fail(file, index + 1, expected, `"${claim[0]}"`);
        }
      }
      for (const claim of line.matchAll(TEST_FILES_CLAIM_RE)) {
        if (!claimAgrees(claim[0], truth.files)) {
          fail(file, index + 1, expected, `"${claim[0]}"`);
        }
      }
      if (testClaims.length > 0) {
        for (const claim of line.matchAll(FILES_CLAIM_RE)) {
          if (!claimAgrees(claim[0], truth.files)) {
            fail(file, index + 1, expected, `"${claim[0]}"`);
          }
        }
      }
    });
  }
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

const checks = [
  { name: "The release-note index is complete", run: checkReleaseNoteIndex },
  {
    name: "Every relative link resolves, and every anchor matches a heading",
    run: checkLinks,
  },
  { name: "The README, the PRD and the TDD agree with GAME_REGISTRY", run: checkGameLists },
  { name: "The roadmap carries both of its sections", run: checkRoadmap },
  {
    name: "No document points at a Conductor path that does not exist",
    run: checkConductorPaths,
  },
  {
    name: "The living docs state the current test-suite truth",
    run: checkTestCounts,
  },
];

console.log("Document Validation for Aby's Little Lab\n");
console.log("=".repeat(50));

let passed = 0;
let failed = 0;

for (const check of checks) {
  const before = failures.length;
  check.run();
  const broken = failures.length - before;
  if (broken === 0) {
    console.log(`✓ ${check.name}`);
    passed++;
    continue;
  }
  console.log(`✗ ${check.name}`);
  failed++;
  for (const failure of failures.slice(before)) {
    console.log(
      `  ✗ ${failure.file}:${failure.line} — expected ${failure.expected}; found ${failure.found}`,
    );
  }
}

console.log("=".repeat(50));
console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failures.length > 0) console.log(`Failures: ${failures.length}\n`);
else console.log("\n");

if (failed > 0) {
  console.log("The documents and the code have parted company. Review the failures above.");
  process.exit(1);
} else {
  console.log("All document validation checks passed!");
  process.exit(0);
}
