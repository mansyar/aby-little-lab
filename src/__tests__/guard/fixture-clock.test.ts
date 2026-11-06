import { describe, expect, it } from "vitest";

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
 * against the current date. Scanned over the whole file so a key written across
 * two lines still matches, and the quote may be `'`, `"` or a backtick.
 *
 * An indirect value (`lastUsedDate: SOME_CONST`) is not a literal and is not
 * matched. That limit is accepted and recorded in the spec.
 */
const LITERAL_DAY_KEY = /\blastUsedDate\b\s*:\s*["'`]\d{4}-\d{2}-\d{2}["'`]/g;

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

/** One-based line number of `index` inside `source`. */
function lineAt(source: string, index: number): number {
  let line = 1;
  for (let cursor = 0; cursor < index; cursor += 1) {
    if (source[cursor] === "\n") {
      line += 1;
    }
  }
  return line;
}

/**
 * True when the match sits on comment prose rather than code, so a comment that
 * documents the historical bug does not fail a green tree.
 */
function isCommentLine(source: string, index: number): boolean {
  const start = source.lastIndexOf("\n", index) + 1;
  const end = source.indexOf("\n", index);
  const text = source.slice(start, end === -1 ? source.length : end).trimStart();
  return text.startsWith("//") || text.startsWith("/*") || text.startsWith("*");
}

/** All offending sites in one source, as `path:line`. */
function sitesIn(source: string, path: string): string[] {
  const sites: string[] = [];
  for (const match of source.matchAll(LITERAL_DAY_KEY)) {
    const index = match.index ?? 0;
    if (isCommentLine(source, index)) {
      continue;
    }
    sites.push(`${path}:${lineAt(source, index)}`);
  }
  return sites;
}

/** All offending sites as `path:line`, so one failure reports every hit. */
function literalDayKeySites(): string[] {
  return testSources().flatMap((file) => sitesIn(file.source, file.path));
}

describe("fixture clock guard", () => {
  it("finds no bare day key assigned to lastUsedDate", () => {
    const sites = literalDayKeySites();
    expect(
      sites,
      `A test fixture hardcodes a day key in lastUsedDate, which production compares against today:\n${sites.join("\n")}\nDerive the date from an explicit clock instead, e.g. todayKey(FIXED_NOW).`,
    ).toEqual([]);
  });

  it("rejects the shape it documents, and only that shape", () => {
    // Same line, double quotes.
    expect(sitesIn('const fixture = { lastUsedDate: "2026-10-27" };', "probe.ts")).toEqual([
      "probe.ts:1",
    ]);
    // Key and value split across lines.
    expect(
      sitesIn('const fixture = {\n  lastUsedDate:\n    "2026-10-27",\n};', "probe.ts"),
    ).toEqual(["probe.ts:2"]);
    // Single quotes and template quotes.
    expect(sitesIn("const a = { lastUsedDate: '2026-10-27' };", "probe.ts")).toEqual([
      "probe.ts:1",
    ]);
    expect(sitesIn("const a = { lastUsedDate: `2026-10-27` };", "probe.ts")).toEqual([
      "probe.ts:1",
    ]);
    // Comment prose that documents the bug is not a fixture.
    expect(sitesIn('// was lastUsedDate: "2026-10-27"', "probe.ts")).toEqual([]);
    expect(sitesIn(' * was lastUsedDate: "2026-10-27"', "probe.ts")).toEqual([]);
    // Accepted limit: an indirect value is not a literal.
    expect(
      sitesIn('const key = "2026-10-27";\nconst a = { lastUsedDate: key };', "probe.ts"),
    ).toEqual([]);
  });

  it("excludes only its own file from the scan", () => {
    // The guard's probes are literal by necessity: they are the violation being
    // demonstrated. Self-exclusion is what keeps them from failing the tree, so
    // it is asserted directly rather than inferred.
    expect(isGuardKey("./guard/fixture-clock.test.ts")).toBe(true);
    expect(isGuardKey("./game/hub/gameLaunch.test.ts")).toBe(false);
    expect(testSources().map((file) => file.path)).not.toContain("guard/fixture-clock.test.ts");
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
