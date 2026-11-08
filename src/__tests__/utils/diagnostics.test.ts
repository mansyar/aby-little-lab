import { describe, expect, it } from "vitest";
import type { CrashEntry, CrashKind } from "../../types";
import type { DiagnosticsEnvironment } from "../../utils/diagnostics";
import {
  appendCrash,
  buildDiagnosticsReport,
  MAX_ENTRIES,
  MAX_MESSAGE_CHARS,
  MAX_STACK_CHARS,
  normalizeDiagnostics,
  toCrashEntry,
} from "../../utils/diagnostics";
import diagnosticsSource from "../../utils/diagnostics.ts?raw";

/**
 * Every instant here is an explicit local moment, and every timestamp the
 * module writes is that moment's ISO form. Nothing derives a value from the
 * wall clock, so the verdict is the same on any calendar day.
 */
const NOW = new Date(2026, 10, 8, 14, 20, 0);
const EARLIER = new Date(2026, 10, 8, 14, 19, 30);

/**
 * The measured size of a buffer of twenty maximal entries, in bytes of JSON.
 * Recorded here rather than only in prose so the ceiling in the documents can
 * only be restated by someone who ran this.
 */
const MEASURED_WORST_CASE = 13461;

const ENVIRONMENT: DiagnosticsEnvironment = {
  appVersion: "1.23.0",
  userAgent: "Mozilla/5.0 (Test Tablet)",
  viewport: "1280x720",
  profileCount: 2,
  playTime: "4 of 30 minutes used today",
  degraded: false,
};

/** A stored entry, for the tests that are about the buffer rather than coercion. */
function entryOf(at: Date, message: string, stack = ""): CrashEntry {
  return { at: at.toISOString(), kind: "error", message, stack };
}

/** A thrown object referencing itself, which `JSON.stringify` refuses to serialise. */
function circularReason(): Record<string, unknown> {
  const reason: Record<string, unknown> = {};
  reason.self = reason;
  return reason;
}

describe("toCrashEntry — whatever arrives becomes a readable entry (AC-1)", () => {
  const cases: ReadonlyArray<{
    readonly name: string;
    readonly kind: CrashKind;
    readonly reason: unknown;
    readonly message: string;
  }> = [
    { name: "an Error with a message", kind: "error", reason: new Error("Boom"), message: "Boom" },
    { name: "a rejected string", kind: "rejection", reason: "Nope", message: "Nope" },
    {
      name: "a rejection with no reason",
      kind: "rejection",
      reason: undefined,
      message: "Unhandled rejection with no reason",
    },
    {
      name: "a rejection with a null reason",
      kind: "rejection",
      reason: null,
      message: "Unhandled rejection with no reason",
    },
    {
      name: "a throw with no value",
      kind: "error",
      reason: undefined,
      message: "An unknown error was thrown",
    },
    {
      name: "a thrown plain object with a message",
      kind: "error",
      reason: { message: "Something went sideways" },
      message: "Something went sideways",
    },
    {
      name: "a thrown object with no message",
      kind: "error",
      reason: { code: 7 },
      message: '{"code":7}',
    },
    {
      name: "a thrown object whose message is not text",
      kind: "rejection",
      reason: { message: 7 },
      message: '{"message":7}',
    },
    {
      name: "a thrown object whose message is empty",
      kind: "error",
      reason: { message: "" },
      message: '{"message":""}',
    },
    {
      name: "a thrown value that cannot be serialised",
      kind: "error",
      reason: circularReason(),
      message: "An unreadable thrown value",
    },
    {
      name: "a rejected number",
      kind: "rejection",
      reason: 42,
      message: "Unhandled rejection with no reason",
    },
    {
      name: "a rejected empty string",
      kind: "rejection",
      reason: "",
      message: "Unhandled rejection with no reason",
    },
  ];

  for (const testCase of cases) {
    it(`coerces ${testCase.name} without throwing`, () => {
      const entry = toCrashEntry(testCase.kind, testCase.reason, NOW);

      expect(entry.at).toBe(NOW.toISOString());
      expect(entry.kind).toBe(testCase.kind);
      expect(entry.message).toBe(testCase.message);
      if (testCase.reason instanceof Error) {
        expect(entry.stack.startsWith("Error: Boom")).toBe(true);
        expect(entry.stack.length).toBeLessThanOrEqual(MAX_STACK_CHARS);
      } else {
        expect(entry.stack).toBe("");
      }
    });
  }

  it("names an Error that has no message of its own", () => {
    // `new Error("")` still carries a name, so the entry is never blank.
    expect(toCrashEntry("error", new Error(""), NOW).message).toBe("Error");
  });

  it("reads an Error that carries no stack as an entry with no stack", () => {
    // A runtime with stack capture off still throws `Error`; it just has no frames.
    const error = new Error("Boom");
    error.stack = undefined;

    expect(toCrashEntry("error", error, NOW).stack).toBe("");
  });

  it("trims a long stack to its first four hundred characters, from the front", () => {
    const error = new Error("Boom");
    error.stack = `Boom${"x".repeat(MAX_STACK_CHARS * 3)}`;

    const entry = toCrashEntry("error", error, NOW);

    expect(entry.stack).toHaveLength(MAX_STACK_CHARS);
    expect(entry.stack.startsWith("Boom")).toBe(true);
  });

  it("trims a long message to its first two hundred characters, from the front (F3)", () => {
    const entry = toCrashEntry("rejection", `Boom${"x".repeat(MAX_MESSAGE_CHARS * 5)}`, NOW);

    expect(entry.message).toHaveLength(MAX_MESSAGE_CHARS);
    expect(entry.message.startsWith("Boom")).toBe(true);
  });

  it("trims the message it makes from a rejected object, so JSON size is not the thrown size (F3)", () => {
    const huge = { payload: "x".repeat(100_000) };

    const entry = toCrashEntry("rejection", huge, NOW);

    // The stringified object is generated here, so this is the one branch where
    // an unbounded message could arrive without anybody writing one.
    expect(entry.message).toHaveLength(MAX_MESSAGE_CHARS);
    expect(entry.message.startsWith('{"payload":"xxxx')).toBe(true);
  });
});

describe("appendCrash — the newest twenty, oldest first out (AC-2)", () => {
  it("holds the spec's twenty entries, four hundred stack characters and two hundred of message", () => {
    expect([MAX_ENTRIES, MAX_STACK_CHARS, MAX_MESSAGE_CHARS]).toEqual([20, 400, 200]);
  });

  it("returns a new array and leaves the caller's alone", () => {
    const existing = [entryOf(NOW, "first")];

    const next = appendCrash(existing, entryOf(NOW, "second"));

    expect(next).not.toBe(existing);
    expect(existing).toHaveLength(1);
    expect(next.map((entry) => entry.message)).toEqual(["first", "second"]);
  });

  it("keeps exactly the newest twenty of twenty-five, in order", () => {
    const appended: CrashEntry[] = [];
    let buffer: CrashEntry[] = [];
    for (let index = 1; index <= 25; index += 1) {
      const entry = entryOf(NOW, `crash ${index}`);
      appended.push(entry);
      buffer = appendCrash(buffer, entry);
    }

    expect(buffer).toHaveLength(MAX_ENTRIES);
    // The sixth appended is the first kept; the twenty-fifth is the last.
    expect(buffer[0]).toBe(appended[5]);
    expect(buffer[MAX_ENTRIES - 1]).toBe(appended[24]);
    expect(buffer.map((entry) => entry.message)).toEqual(
      appended.slice(5).map((entry) => entry.message),
    );
  });

  it("keeps the serialised buffer bounded at the maximum message and stack (NFR-1)", () => {
    let buffer: CrashEntry[] = [];
    for (let index = 1; index <= MAX_ENTRIES; index += 1) {
      buffer = appendCrash(
        buffer,
        entryOf(NOW, "m".repeat(MAX_MESSAGE_CHARS), "s".repeat(MAX_STACK_CHARS)),
      );
    }

    const json = JSON.stringify(buffer);
    // NFR-1 asks for a ceiling that follows from the constants. With messages
    // genuinely at their maximum — the first version of this test used seven
    // characters, which made the bound a property of the fixture — the bound is
    // the constants times the per-entry room a timestamp, a kind and the JSON
    // keys need.
    const bound = MAX_ENTRIES * (MAX_MESSAGE_CHARS + MAX_STACK_CHARS + 200);
    expect(
      json.length,
      `the twenty-entry buffer measured ${json.length} bytes, over the ${bound} byte bound`,
    ).toBeLessThan(bound);
    expect(json.length).toBe(MEASURED_WORST_CASE);
  });

  it("does not let a hundred-kilobyte rejected object carry the buffer past the ceiling (F3)", () => {
    const reason = { payload: "x".repeat(100_000) };
    let buffer: CrashEntry[] = [];
    for (let index = 1; index <= MAX_ENTRIES; index += 1) {
      buffer = appendCrash(buffer, toCrashEntry("rejection", reason, NOW));
    }

    const json = JSON.stringify(buffer);
    const bound = MAX_ENTRIES * (MAX_MESSAGE_CHARS + MAX_STACK_CHARS + 200);
    expect(json.length).toBeLessThan(bound);
  });
});

describe("normalizeDiagnostics — an absent, pre-track or hand-edited log (AC-3)", () => {
  it("reads anything that is not an array as an empty log", () => {
    for (const raw of [undefined, null, {}, "[]", 42, true]) {
      expect(normalizeDiagnostics(raw)).toEqual([]);
    }
  });

  it("keeps an empty array empty", () => {
    expect(normalizeDiagnostics([])).toEqual([]);
  });

  it("drops every entry it cannot read, and keeps the two it can", () => {
    const first = entryOf(NOW, "Boom");
    const second: CrashEntry = {
      at: EARLIER.toISOString(),
      kind: "rejection",
      message: "Nope",
      stack: "",
    };
    const unreadable: unknown[] = [
      null,
      42,
      "text",
      {},
      { at: "", kind: "error", message: "x", stack: "" },
      { at: 7, kind: "error", message: "x", stack: "" },
      { at: EARLIER.toISOString(), kind: "warn", message: "x", stack: "" },
      { at: EARLIER.toISOString(), kind: "error", message: "", stack: "" },
      { at: EARLIER.toISOString(), kind: "error", message: 5, stack: "" },
    ];

    expect(normalizeDiagnostics([first, ...unreadable, second])).toEqual([first, second]);
  });

  it("coerces a non-string stack to an empty one rather than dropping the entry", () => {
    const raw = [{ at: NOW.toISOString(), kind: "error", message: "Boom", stack: 42 }];

    expect(normalizeDiagnostics(raw)).toEqual([entryOf(NOW, "Boom")]);
  });

  it("trims what it reads, so a hand-edited log cannot store more than the ceiling (F3)", () => {
    const raw = [
      {
        at: NOW.toISOString(),
        kind: "error",
        message: "m".repeat(5_000),
        stack: "s".repeat(5_000),
      },
    ];

    const [entry] = normalizeDiagnostics(raw);

    // `normalizeDiagnostics` caps the count; without this it left the size to
    // whatever already sat on disk, which is the same defect one layer down.
    expect(entry.message).toHaveLength(MAX_MESSAGE_CHARS);
    expect(entry.stack).toHaveLength(MAX_STACK_CHARS);
  });

  it("keeps only the newest twenty of a longer stored log", () => {
    const stored = Array.from({ length: 25 }, (_, index) => entryOf(NOW, `crash ${index + 1}`));

    const log = normalizeDiagnostics(stored);

    expect(log).toHaveLength(MAX_ENTRIES);
    expect(log[0].message).toBe("crash 6");
    expect(log[MAX_ENTRIES - 1].message).toBe("crash 25");
  });
});

describe("buildDiagnosticsReport — the file a parent downloads", () => {
  it("writes the header, then the entries newest-first", () => {
    const older = toCrashEntry("rejection", "Nope", EARLIER);
    const newer = toCrashEntry("error", new Error("Boom"), NOW);

    const report = buildDiagnosticsReport([older, newer], ENVIRONMENT, NOW);

    const expected = [
      "Aby's Little Lab diagnostics",
      `Exported: ${NOW.toISOString()}`,
      "App version: 1.23.0",
      "User agent: Mozilla/5.0 (Test Tablet)",
      "Viewport: 1280x720",
      "Profiles: 2",
      "Play time: 4 of 30 minutes used today",
      "Storage: OK",
      "",
      "2 crashes recorded, newest first.",
      "",
      `1. ${NOW.toISOString()}  error`,
      "   Boom",
      `   ${newer.stack}`,
      `2. ${EARLIER.toISOString()}  rejection`,
      "   Nope",
      "",
    ].join("\n");

    expect(report).toBe(expected);
  });

  it("says so in one sentence when nothing has crashed", () => {
    const expected = [
      "Aby's Little Lab diagnostics",
      `Exported: ${NOW.toISOString()}`,
      "App version: 1.23.0",
      "User agent: Mozilla/5.0 (Test Tablet)",
      "Viewport: 1280x720",
      "Profiles: 2",
      "Play time: 4 of 30 minutes used today",
      "Storage: OK",
      "",
      "No crashes have been recorded on this device.",
      "",
    ].join("\n");

    expect(buildDiagnosticsReport([], ENVIRONMENT, NOW)).toBe(expected);
  });

  it("carries every environment field and the degraded sentence", () => {
    const report = buildDiagnosticsReport(
      [entryOf(NOW, "Boom")],
      {
        ...ENVIRONMENT,
        profileCount: 3,
        degraded: true,
      },
      NOW,
    );

    expect(report).toContain("App version: 1.23.0");
    expect(report).toContain("User agent: Mozilla/5.0 (Test Tablet)");
    expect(report).toContain("Viewport: 1280x720");
    expect(report).toContain("Profiles: 3");
    expect(report).toContain("Play time: 4 of 30 minutes used today");
    expect(report).toContain("Storage: Progress cannot be saved on this device");
    expect(report).not.toContain("Storage: OK");
  });

  it("says one crash, not one crashes", () => {
    expect(buildDiagnosticsReport([entryOf(NOW, "Boom")], ENVIRONMENT, NOW)).toContain(
      "1 crash recorded, newest first.",
    );
  });

  it("keeps a multi-line stack as the throw wrote it", () => {
    const stack = "Error: Boom\n    at handler (app.js:1:1)";
    const report = buildDiagnosticsReport([entryOf(NOW, "Boom", stack)], ENVIRONMENT, NOW);

    expect(report).toContain(`   ${stack}`);
  });
});

describe("the module is pure (P1.T4.1)", () => {
  // Which module may name which global — the enumerated allowlist — is the
  // guard test's question in Phase 2, not this test's. This one asserts only
  // that the pure module names no browser global and reads no clock, so a
  // later edit that reaches for one fails here rather than in review.
  const FORBIDDEN: ReadonlyArray<{ readonly name: string; readonly pattern: RegExp }> = [
    {
      name: "a browser global",
      pattern: /\b(window|document|navigator|sessionStorage|localStorage)\s*\./,
    },
    { name: "Blob", pattern: /\bBlob\b/ },
    { name: "URL.", pattern: /\bURL\./ },
    { name: "Date.now()", pattern: /Date\.now\(/ },
    { name: "new Date() with no argument", pattern: /new Date\(\s*\)/ },
  ];

  for (const { name, pattern } of FORBIDDEN) {
    it(`names no ${name}`, () => {
      expect(pattern.test(diagnosticsSource)).toBe(false);
    });
  }
});
