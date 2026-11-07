import { describe, expect, it } from "vitest";

import workflowRaw from "../../../.github/workflows/ci.yml?raw";
import nodeVersionRaw from "../../../.node-version?raw";
import dockerfileRaw from "../../../Dockerfile?raw";
import pkgRaw from "../../../package.json?raw";
import readmeRaw from "../../../README.md?raw";

/**
 * Guard over the toolchain declaration.
 *
 * A version stated in five places is a version owned by none. Before
 * 2026-11-07 the same project asserted pnpm 11.17.0 in one table, 11.7.0 in
 * two more, 11.7.0 in CI and the image, 12.16.1 on the machine that wrote the
 * code, and "pnpm 11+" in the README — with no file that could be called
 * wrong and no check that compared them. Node had the same shape: 22 in CI and
 * the image, 24 on the machine.
 *
 * The declaration is now `packageManager` and `engines` in `package.json` plus
 * `.node-version`; the Dockerfile, both CI jobs and the README consume it.
 * This test derives the truth from `package.json` and `.node-version` and makes
 * every consumer answer to it, so drifting one file turns exactly one
 * assertion red instead of passing review. It reads files only — no network,
 * no timers, no shell, no Docker — and runs in milliseconds.
 *
 * The sources are static `?raw` imports, which typecheck because
 * `src/vite-env.d.ts` references `vite/client`; that is the existing raw-source
 * precedent (`assets/letterNumeralFonts.test.ts`, `utils/pwaInstall.test.ts`).
 * They are not read with `node:fs` because the project ships no Node type
 * declarations, and the dotfiles are not collected with `import.meta.glob`
 * because that collector does not pick up dot-prefixed paths.
 *
 * The accepted limit follows from the same cause: there is no directory
 * listing, so a second workflow file would escape this guard until it is added
 * to the import list by hand. The spec records that limit; the job-name and
 * action assertions below are what make the escape loud for `ci.yml` itself.
 */

/** The reviewed action set. A new third-party action fails here, not review. */
const ALLOWED_ACTIONS: readonly string[] = [
  "actions/checkout",
  "actions/setup-node",
  "actions/upload-artifact",
  "pnpm/action-setup",
];

/** `pnpm@12.16.1` — an exact version. A range lets two installs disagree. */
const EXACT_PNPM = /^pnpm@\d+\.\d+\.\d+$/;

/** `24`, `24.22` or `24.22.2` — the three forms `actions/setup-node` accepts. */
const BARE_NODE = /^\d+(\.\d+){0,2}$/;

const WORKFLOW_LINES = workflowRaw.split(/\r?\n/);

/** The `packageManager` string exactly as declared, or `""` when absent. */
function declaredPackageManager(): string {
  return /"packageManager"\s*:\s*"([^"]*)"/.exec(pkgRaw)?.[1] ?? "";
}

/** The `engines.node` range exactly as declared, or `""` when absent. */
function declaredNodeRange(): string {
  const engines = /"engines"\s*:\s*\{([^}]*)\}/.exec(pkgRaw)?.[1] ?? "";
  return /"node"\s*:\s*"([^"]*)"/.exec(engines)?.[1] ?? "";
}

/** The pnpm version inside `packageManager`, or `""` when it is not a pnpm pin. */
function declaredPnpm(): string {
  const declared = declaredPackageManager();
  return declared.startsWith("pnpm@") ? declared.slice("pnpm@".length) : "";
}

/** `.node-version` as the single bare version it must be, or `""` when malformed. */
function declaredNode(): string {
  const lines = nodeVersionRaw.split(/\r?\n/).filter((line) => line.trim() !== "");
  return lines.length === 1 ? lines[0].trim() : "";
}

/** The Node major every consumer must agree on, e.g. `24`. */
function declaredNodeMajor(): string {
  return declaredNode().split(".")[0];
}

/** Column of the first non-space character, so a nested key is told from its parent. */
function indentOf(line: string): number {
  return line.length - line.trimStart().length;
}

/**
 * The lines nested under the first line whose trimmed text starts with
 * `header`, judged by indentation alone. The workflow is scanned, never parsed,
 * so no YAML dependency enters the suite and a `run:` block of shell stays
 * text.
 */
function blockUnder(header: string): string[] {
  const start = WORKFLOW_LINES.findIndex((line) => line.trimStart().startsWith(header));
  if (start === -1) {
    return [];
  }
  const base = indentOf(WORKFLOW_LINES[start]);
  const body: string[] = [];
  for (let index = start + 1; index < WORKFLOW_LINES.length; index += 1) {
    const line = WORKFLOW_LINES[index];
    if (line.trim() !== "" && indentOf(line) <= base) {
      break;
    }
    body.push(line);
  }
  return body;
}

/**
 * Every step that contains `needle`, not just the first one. Two jobs install
 * pnpm, and a check that looked only at the first would leave the second free to
 * pin a literal pnpm the declaration never names — the exact drift this guard
 * exists to stop.
 */
function stepsContaining(needle: string): string[][] {
  return WORKFLOW_LINES.map((line, index) => (line.includes(needle) ? index : -1))
    .filter((index) => index !== -1)
    .map((anchor) => {
      let start = anchor;
      while (start > 0 && !WORKFLOW_LINES[start].trimStart().startsWith("- ")) {
        start -= 1;
      }
      const base = indentOf(WORKFLOW_LINES[start]);
      const body: string[] = [WORKFLOW_LINES[start]];
      for (let index = start + 1; index < WORKFLOW_LINES.length; index += 1) {
        const line = WORKFLOW_LINES[index];
        if (line.trimStart().startsWith("- ") && indentOf(line) <= base) {
          break;
        }
        if (line.trim() !== "" && indentOf(line) < base) {
          break;
        }
        body.push(line);
      }
      return body;
    });
}

function parseVersion(text: string): readonly number[] | null {
  const match = /^(\d+)(?:\.(\d+))?(?:\.(\d+))?$/.exec(text.trim());
  if (match === null) {
    return null;
  }
  return [Number(match[1]), Number(match[2] ?? 0), Number(match[3] ?? 0)];
}

function compareVersions(left: readonly number[], right: readonly number[]): number {
  for (let index = 0; index < 3; index += 1) {
    const difference = (left[index] ?? 0) - (right[index] ?? 0);
    if (difference !== 0) {
      return difference;
    }
  }
  return 0;
}

/**
 * Whether `version` satisfies a range written as space-separated comparators
 * (`>=`, `>`, `<=`, `<`) — the shape `engines.node` is declared in here.
 *
 * Anything else (`||`, `^`, `~`, `x`) answers `false` on purpose: a range the
 * guard cannot read is a range nothing checks, and a substring test would say
 * the opposite. `">=22.0.0 <24"` contains the characters "24" while excluding
 * Node 24 entirely, which is precisely the drift this pin removes.
 */
function satisfiesComparators(version: string, range: string): boolean {
  const typed = parseVersion(version);
  const parts = range
    .trim()
    .split(/\s+/)
    .filter((part) => part !== "");
  if (typed === null || parts.length === 0) {
    return false;
  }
  return parts.every((part) => {
    const match = /^(>=|>|<=|<)(\S+)$/.exec(part);
    if (match === null) {
      return false;
    }
    const bound = parseVersion(match[2] ?? "");
    if (bound === null) {
      return false;
    }
    const difference = compareVersions(typed, bound);
    switch (match[1]) {
      case ">=":
        return difference >= 0;
      case ">":
        return difference > 0;
      case "<=":
        return difference <= 0;
      case "<":
        return difference < 0;
      default:
        return false;
    }
  });
}

describe("toolchain guard", () => {
  it("declares one exact pnpm version", () => {
    const declared = declaredPackageManager();
    expect(
      declared,
      `package.json declares packageManager as "${declared}", which is not an exact pnpm pin. ` +
        "Write pnpm@<major>.<minor>.<patch>: a range lets each machine resolve the lockfile " +
        "with a different pnpm.",
    ).toMatch(EXACT_PNPM);
  });

  it("declares a Node engine that .node-version satisfies", () => {
    const major = declaredNodeMajor();
    const range = declaredNodeRange();
    expect(
      major,
      ".node-version must name a Node major before the engine can be compared",
    ).not.toBe("");
    expect(range, `package.json declares no engines.node; .node-version says ${major}`).not.toBe(
      "",
    );
    expect(
      satisfiesComparators(`${major}.0.0`, range),
      `package.json allows node "${range}" but .node-version says ${major}: a range that does ` +
        "not admit the pinned major is the drift this pin removes. Write plain space-separated " +
        "comparators (>=24.0.0 <25); anything else fails here rather than passing unread.",
    ).toBe(true);
  });

  it("keeps .node-version a bare version the runner accepts", () => {
    const lines = nodeVersionRaw.split(/\r?\n/).filter((line) => line.trim() !== "");
    expect(
      lines.length,
      `.node-version must hold one version; it holds ${lines.length} lines`,
    ).toBe(1);
    const [line = ""] = lines;
    expect(line, `.node-version must be trimmed; it holds "${line}"`).toBe(line.trim());
    const pinned = line.trim();
    expect(
      pinned.startsWith("v"),
      `.node-version must not carry a "v" prefix, which actions/setup-node rejects; it holds ` +
        `"${pinned}"`,
    ).toBe(false);
    expect(
      pinned,
      `.node-version must be 24, 24.22 or 24.22.2 — a form the runner accepts; it holds ` +
        `"${pinned}"`,
    ).toMatch(BARE_NODE);
  });

  it("builds the image on the declared Node and installs the declared pnpm", () => {
    const nodeMajor = declaredNodeMajor();
    const dockerMajor = /^FROM node:(\d+)-alpine AS build$/m.exec(dockerfileRaw)?.[1] ?? "";
    expect(
      dockerMajor,
      `Dockerfile builds on node:${dockerMajor || "<no node build stage>"} but .node-version ` +
        `says ${nodeMajor}`,
    ).toBe(nodeMajor);

    const dockerPnpm = /corepack prepare pnpm@(\d+\.\d+\.\d+)/.exec(dockerfileRaw)?.[1] ?? "";
    const declared = declaredPnpm();
    expect(
      dockerPnpm,
      `Dockerfile installs pnpm@${dockerPnpm || "<none>"} but packageManager declares ` +
        `pnpm@${declared}`,
    ).toBe(declared);
  });

  it("takes both versions from the declaration and keeps both required checks", () => {
    const pnpmSteps = stepsContaining("uses: pnpm/action-setup");
    expect(
      pnpmSteps.length,
      `ci.yml installs pnpm in ${pnpmSteps.length} step(s); both jobs need it, and a step that ` +
        "disappears must fail here rather than quietly shrink this check",
    ).toBe(2);
    const pnpmLiteral = pnpmSteps.flat().filter((line) => /^\s*version:/.test(line));
    expect(
      pnpmLiteral,
      "pnpm/action-setup must read packageManager, not a literal that can drift from it:\n" +
        pnpmLiteral.join("\n"),
    ).toEqual([]);

    const nodeLiteral = WORKFLOW_LINES.filter((line) => /^\s*node-version:/.test(line));
    expect(
      nodeLiteral,
      "ci.yml pins a Node literal instead of reading .node-version, the file the developer's " +
        `toolchain also reads:\n${nodeLiteral.join("\n")}`,
    ).toEqual([]);

    const versionFile = workflowRaw.match(/node-version-file: \.node-version/g) ?? [];
    expect(
      versionFile.length,
      `ci.yml should read .node-version in both jobs; found ${versionFile.length} reference(s)`,
    ).toBe(2);

    const jobs: readonly (readonly [string, string])[] = [
      ["quality-gates", "Quality Gates"],
      ["e2e", "Browser Journeys"],
    ];
    for (const [job, display] of jobs) {
      const body = blockUnder(`${job}:`);
      expect(body.length, `ci.yml has no "${job}" job`).toBeGreaterThan(0);
      expect(
        body,
        `ci.yml job "${job}" must keep the display name "${display}": branch protection ` +
          "matches these names by string, so a rename silently weakens the required checks",
      ).toContain(`    name: ${display}`);
      expect(
        body.some((line) => line.trim() === "- name: Classify the change"),
        `ci.yml job "${job}" must classify the change before it spends minutes on the suite`,
      ).toBe(true);
    }

    // The classifier is written out once per job. Two copies of a rule is how
    // one of them drifts: compare the bodies so an edit to one job cannot pass.
    const classifyBodies = stepsContaining("- name: Classify the change").map((step) =>
      step
        .filter((line) => !line.includes("- name: Classify the change"))
        .join("\n")
        .trim(),
    );
    expect(
      classifyBodies.length,
      `ci.yml has ${classifyBodies.length} classification step(s); each job needs one`,
    ).toBe(2);
    expect(
      new Set(classifyBodies).size,
      "the two Classify the change steps differ: the tier rules must be identical in both jobs, " +
        "or a documentation-only change is cheap in one and full price in the other",
    ).toBe(1);
    expect(
      classifyBodies.every((body) => body.length > 0),
      "a Classify the change step has no body, so the comparison above proved nothing",
    ).toBe(true);

    const pullRequest = blockUnder("pull_request:");
    expect(
      pullRequest.some((line) => line.trimStart().startsWith("paths-ignore")),
      "on.pull_request must not carry paths-ignore: both required checks must always report, " +
        "or a documentation-only change leaves them pending forever",
    ).toBe(false);
    expect(
      pullRequest.filter((line) => line.trim() !== "").length,
      "on.pull_request disappeared from ci.yml, so the filter assertion proved nothing",
    ).toBeGreaterThan(0);
  });

  it("states the same versions in the README prerequisites", () => {
    const nodeMajor = declaredNodeMajor();
    const pnpm = declaredPnpm();
    const readmeNode = /^-\s+Node\.js\s+(\d+)/m.exec(readmeRaw)?.[1] ?? "";
    expect(
      readmeNode,
      `README prerequisites say Node.js ${readmeNode || "<nothing>"} but .node-version says ` +
        `${nodeMajor}`,
    ).toBe(nodeMajor);
    const readmePnpm = /^-\s+pnpm\s+(\d+\.\d+\.\d+)/m.exec(readmeRaw)?.[1] ?? "";
    expect(
      readmePnpm,
      `README prerequisites say pnpm ${readmePnpm || "<nothing>"} but packageManager declares ` +
        `pnpm@${pnpm}`,
    ).toBe(pnpm);
  });

  it("uses only reviewed GitHub actions", () => {
    const used = [...workflowRaw.matchAll(/^\s*uses:\s*(\S+)/gm)].map((match) =>
      (match[1] ?? "").replace(/@.*$/, ""),
    );
    expect(
      used.length,
      "ci.yml declares no actions at all, so the allowlist could not be checked",
    ).toBeGreaterThan(0);
    const unexpected = used.filter((action) => !ALLOWED_ACTIONS.includes(action));
    expect(
      unexpected,
      `ci.yml uses actions outside the reviewed set (${ALLOWED_ACTIONS.join(", ")}), and a new ` +
        `third-party action is a supply-chain decision that must not arrive as a review detail:\n` +
        unexpected.join("\n"),
    ).toEqual([]);
  });

  it("reads every file it guards", () => {
    // Non-vacuity: an empty import would make every `not.toContain` above pass.
    const sources: readonly (readonly [string, string])[] = [
      ["package.json", pkgRaw],
      [".node-version", nodeVersionRaw],
      ["Dockerfile", dockerfileRaw],
      [".github/workflows/ci.yml", workflowRaw],
      ["README.md", readmeRaw],
    ];
    for (const [name, raw] of sources) {
      expect(
        raw.length,
        `${name} arrived empty, so every assertion about it would pass vacuously`,
      ).toBeGreaterThan(0);
    }
  });
});
