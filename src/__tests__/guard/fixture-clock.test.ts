import { describe, expect, it } from "vitest";
import guardSource from "./fixture-clock.test.ts?raw";

/**
 * Guard over the test tree: no fixture may stand in for "today" with a bare
 * quoted day key.
 *
 * `normalizePlayTime` zeroes `usedMinutes` whenever the stored `lastUsedDate`
 * disagrees with `todayKey()`, so a fixture that hardcodes that field silently
 * changes meaning at midnight. `gameLaunch.test.ts` passed on 2026-10-27 and
 * failed on every day after: the fixture wrote a literal, the calendar moved,
 * and the assertion inverted itself with no code change.
 *
 * A fixture date is only safe when it is derived from an explicit clock
 * (`todayKey(FIXED_NOW)`, an injected `now`, or `vi.setSystemTime`). The shape
 * below is the one this guard rejects; the accepted limit is that a date built
 * by concatenation or interpolation is not literal and therefore not matched.
 *
 * The sources are read through `import.meta.glob` with `?raw` rather than
 * `node:fs`: the project ships no Node type declarations, and this is the
 * existing raw-source precedent (`game/art/shellOwnership.test.ts`). It is
 * still a full recursive walk of every `.ts` file in the tree, with no glob
 * dependency, no network and no timers.
 */

/** Every `.ts` file under `src/__tests__`, keyed relative to this directory. */
const SOURCES = import.meta.glob<string>("../**/*.ts", {
  query: "?raw",
  import: "default",
  eager: true,
});

/**
 * The suffix `import.meta.glob` gives this file. It arrives under the recursive
 * pattern (`../guard/...`), so the match is on the tail rather than the key.
 */
const GUARD_SUFFIX = "guard/fixture-clock.test.ts";

/**
 * The rejected shape: a day key assigned to the field production compares
 * against the current date. Matched per line so a failure can name its line.
 */
const LITERAL_DAY_KEY = /\blastUsedDate\b\s*:\s*["']\d{4}-\d{2}-\d{2}["']/;

interface RawSource {
  readonly path: string;
  readonly source: string;
}

/** True for this guard's own source, so it is never treated as a fixture. */
function isGuardKey(key: string): boolean {
  return key.endsWith(GUARD_SUFFIX);
}

/** Every scanned file as a repo-relative path (from `src/__tests__`) and text. */
function testSources(): RawSource[] {
  const files: RawSource[] = [];
  for (const [key, source] of Object.entries(SOURCES)) {
    if (isGuardKey(key)) {
      continue;
    }
    files.push({ path: key.replace(/^\.\.\//, ""), source });
  }
  return files.sort((left, right) => {
    if (left.path === right.path) {
      return 0;
    }
    return left.path < right.path ? -1 : 1;
  });
}

/** All offending sites as `path:line`, so one failure reports every hit. */
function literalDayKeySites(): string[] {
  const sites: string[] = [];
  for (const file of testSources()) {
    const lines = file.source.split(/\r?\n/);
    for (let index = 0; index < lines.length; index += 1) {
      if (LITERAL_DAY_KEY.test(lines[index])) {
        sites.push(`${file.path}:${index + 1}`);
      }
    }
  }
  return sites;
}

describe("fixture clock guard", () => {
  it("finds no bare day key assigned to lastUsedDate", () => {
    const sites = literalDayKeySites();
    expect(
      sites,
      `A test fixture hardcodes a day key in lastUsedDate, which production compares against today:\n${sites.join("\n")}\nDerive the date from an explicit clock instead, e.g. todayKey(FIXED_NOW).`,
    ).toEqual([]);
  });

  it("cannot match its own source", () => {
    // The guard's comments and pattern are prose, not fixtures. If this ever
    // fails, the doc comment grew an example the scan would have flagged.
    expect(guardSource.length).toBeGreaterThan(0);
    expect(LITERAL_DAY_KEY.test(guardSource)).toBe(false);
  });

  it("scans the whole test tree", () => {
    // Non-vacuity: a walk that lost the tree would report nothing wrong.
    const scanned = testSources().map((file) => file.path);
    expect(scanned.length).toBeGreaterThan(0);
    expect(scanned).toContain("game/hub/gameLaunch.test.ts");
    expect(scanned).toContain("utils/storage.test.ts");
    expect(scanned).toContain("game/art/shellOwnership.test.ts");
  });
});
