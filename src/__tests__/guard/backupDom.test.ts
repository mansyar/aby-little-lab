import { describe, expect, it } from "vitest";

/**
 * Guard over the production tree: only the backup seam may name a DOM global,
 * and nothing in `src/` may reach the network.
 *
 * The app runs on a canvas with pointer input, so `document`, `Blob`, `URL`,
 * `crypto`, `FileReader` and `navigator.clipboard` were never part of it. This
 * track adds the first of them on purpose, for one feature — writing a backup
 * file and reading one back — and NFR-1 requires that they stay in one module.
 * A second module reaching for a DOM global would be an unnoticed browser
 * dependency in code that has to keep working headless.
 *
 * The tree already named `document` in five modules (audio visibility, the font
 * probe, viewport zoom, play-time accrual and the play-time banner), so the
 * guard pins those five with the reason each needs it. Its claim is therefore
 * the true one: no OTHER module names a DOM global, and the list cannot grow
 * without this file failing.
 *
 * The sources are read through `import.meta.glob` with `?raw` rather than
 * `node:fs`: the project ships no Node type declarations, and this is the
 * existing raw-source precedent (`guard/fixture-clock.test.ts`). It reads files
 * only — no network, no timers, no shell. Comment prose is skipped, so the seam
 * and the format module may document what they deliberately do not touch.
 */

/** Every `.ts` file under `src`, keyed relative to `src/__tests__/guard`. */
const SOURCES = import.meta.glob<string>("../../**/*.ts", {
  query: "?raw",
  import: "default",
  eager: true,
});

/** The one module this track added that is allowed to name a DOM global. */
const SEAM = "utils/backupFile.ts";

interface AllowedUser {
  /** Path relative to `src/`. */
  readonly path: string;
  /** Why this module needs a browser global the app otherwise avoids. */
  readonly reason: string;
}

/**
 * The modules that named a DOM global before this track. Each is here because
 * the thing it does cannot be done without one, not because it slipped through.
 */
const PRE_EXISTING: readonly AllowedUser[] = [
  {
    path: "audio/AudioManager.ts",
    reason: "pauses the music while the page is hidden (visibilitychange)",
  },
  {
    path: "game/hub/playTimeUi.ts",
    reason: "shows and hides the play-time banner on visibilitychange",
  },
  {
    path: "game/playTimeLogic.ts",
    reason: "accrues play time only while the page is visible (visibilitychange)",
  },
  {
    path: "utils/fonts.ts",
    reason: "awaits document.fonts.load before the first letters are drawn",
  },
  {
    path: "utils/viewportZoom.ts",
    reason: "reads the viewport meta tag to size the canvas",
  },
];

const ALLOWED = new Set<string>([SEAM, ...PRE_EXISTING.map((user) => user.path)]);

/** The browser globals this guard forbids outside the seam, by source name. */
const DOM_GLOBALS: ReadonlyArray<{ readonly name: string; readonly pattern: RegExp }> = [
  { name: "document", pattern: /\bdocument\b/g },
  { name: "Blob", pattern: /\bBlob\b/g },
  { name: "URL.", pattern: /\bURL\./g },
  // NFR-1 names crypto too: the seam may reach for `crypto.subtle`, and nothing
  // else may. No production file matches it today, so no module is allowed it.
  { name: "crypto", pattern: /\bcrypto\./g },
  { name: "FileReader", pattern: /\bFileReader\b/g },
  { name: "navigator.clipboard", pattern: /\bnavigator\.clipboard\b/g },
];

/** The only network shape this app could plausibly grow: a bare `fetch(` call. */
const NETWORK = /\bfetch\(/g;

interface RawSource {
  /** Path relative to `src/`. */
  readonly path: string;
  readonly source: string;
}

/** One offending site: what was named, and where. */
interface Site {
  readonly name: string;
  readonly site: string;
}

/** This guard's own directory, used to turn a glob key into a repo path. */
const GUARD_DIR = "src/__tests__/guard";

/** Where the tests start, so the scan can skip its own tree. */
const TEST_TREE = "src/__tests__/";

/** Resolves a glob key (relative to this file's directory) to a repo path. */
function repoPath(key: string): string {
  const segments: string[] = [];
  for (const segment of `${GUARD_DIR}/${key}`.split("/")) {
    if (segment === "..") {
      segments.pop();
    } else if (segment !== "." && segment !== "") {
      segments.push(segment);
    }
  }
  return segments.join("/");
}

/** Every scanned file under `src` except the tests, sorted by path. */
function productionSources(): RawSource[] {
  const files: RawSource[] = [];
  for (const [key, source] of Object.entries(SOURCES)) {
    const repo = repoPath(key);
    if (repo.startsWith(TEST_TREE)) {
      continue;
    }
    files.push({ path: repo.slice("src/".length), source });
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
 * True when the match sits on comment prose rather than code, so a module may
 * document the globals it deliberately avoids without failing this guard.
 */
function isCommentLine(source: string, index: number): boolean {
  const start = source.lastIndexOf("\n", index) + 1;
  const end = source.indexOf("\n", index);
  const text = source.slice(start, end === -1 ? source.length : end).trimStart();
  return text.startsWith("//") || text.startsWith("/*") || text.startsWith("*");
}

/** Every match of `pattern` in `source`, as `path:line` with the name it hit. */
function sitesIn(source: string, path: string, pattern: RegExp, name = ""): Site[] {
  const sites: Site[] = [];
  for (const match of source.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (isCommentLine(source, index)) {
      continue;
    }
    sites.push({ name, site: `${path}:${lineAt(source, index)}` });
  }
  return sites;
}

/** Every DOM-global site in one source. */
function domSitesIn(source: string, path: string): Site[] {
  return DOM_GLOBALS.flatMap((global) => sitesIn(source, path, global.pattern, global.name));
}

/** Every DOM-global site outside the allowed modules. */
function unexpectedDomSites(): Site[] {
  return productionSources()
    .filter((file) => !ALLOWED.has(file.path))
    .flatMap((file) => domSitesIn(file.source, file.path));
}

describe("backup DOM guard", () => {
  it("names no browser global outside the seam and the modules that already did", () => {
    const sites = unexpectedDomSites();
    expect(
      sites,
      `A production module names a browser global, which belongs in ${SEAM}:\n${sites
        .map((site) => `${site.site} (${site.name})`)
        .join("\n")}\nMove the browser call into the seam, or add an allowance with a reason.`,
    ).toEqual([]);
  });

  it("the seam really is the seam", () => {
    // Non-vacuity: without this, renaming or emptying the file would leave the
    // scan above passing while nothing in the app could export a save.
    const seam = productionSources().find((file) => file.path === SEAM);
    expect(seam, `The seam ${SEAM} was not found in the scan.`).toBeDefined();
    const names = new Set(domSitesIn(seam?.source ?? "", SEAM).map((site) => site.name));
    expect([...names].sort(), "The seam must name document, Blob and URL to be the seam.").toEqual([
      "Blob",
      "URL.",
      "document",
    ]);
  });

  it("keeps every allowance pointing at a file that still names its global", () => {
    // A renamed or deleted module would leave a silent hole in the allowance;
    // so would one that stopped using the global, since the allowance would
    // then exempt it for every other global too.
    const scanned = new Map(productionSources().map((file) => [file.path, file.source]));
    for (const path of ALLOWED) {
      const source = scanned.get(path);
      expect(source, `An allowed module is no longer in the scan: ${path}`).toBeDefined();
      expect(
        domSitesIn(source ?? "", path).length,
        `${path} is allowed to name a browser global but no longer does: remove its allowance.`,
      ).toBeGreaterThan(0);
    }
  });

  it("sends nothing over the network", () => {
    const sites = productionSources().flatMap((file) =>
      sitesIn(file.source, file.path, NETWORK, "fetch"),
    );
    expect(
      sites.map((site) => site.site),
      `A production module calls fetch, and nothing leaves the device (NFR-2):\n${sites
        .map((site) => site.site)
        .join("\n")}`,
    ).toEqual([]);
  });

  it("rejects the shape it documents, and only that shape", () => {
    // Code is caught, for every pattern, on the line it sits on.
    expect(domSitesIn('document.title = "x";', "probe.ts")).toEqual([
      { name: "document", site: "probe.ts:1" },
    ]);
    expect(domSitesIn("const blob = new Blob([]);", "probe.ts")).toEqual([
      { name: "Blob", site: "probe.ts:1" },
    ]);
    expect(domSitesIn("URL.revokeObjectURL(url);", "probe.ts")).toEqual([
      { name: "URL.", site: "probe.ts:1" },
    ]);
    expect(domSitesIn('await crypto.subtle.digest("SHA-256", bytes);', "probe.ts")).toEqual([
      { name: "crypto", site: "probe.ts:1" },
    ]);
    expect(domSitesIn("await navigator.clipboard.readText();", "probe.ts")).toEqual([
      { name: "navigator.clipboard", site: "probe.ts:1" },
    ]);
    // Comment prose is not code.
    expect(domSitesIn("// no document here", "probe.ts")).toEqual([]);
    expect(domSitesIn(" * It touches no Blob.", "probe.ts")).toEqual([]);
    // A word that merely contains the name is not the global.
    expect(domSitesIn("const documented = 1;", "probe.ts")).toEqual([]);
  });

  it("reads the whole production tree", () => {
    // Non-vacuity: a scan that lost its sources would report nothing wrong.
    const scanned = productionSources().map((file) => file.path);
    expect(scanned.length).toBeGreaterThan(60);
    expect(scanned).toContain("main.ts");
    expect(scanned).toContain("utils/storage.ts");
    expect(scanned).toContain(SEAM);
  });
});
