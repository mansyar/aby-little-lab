import type { CrashEntry, CrashKind } from "../types";

export type { CrashEntry, CrashKind };

/**
 * The crash log, as pure logic: what an entry is, how a thrown value becomes
 * one, the ring buffer that holds the newest twenty, and the plain text a
 * parent downloads from Settings.
 *
 * Nothing here touches the browser and nothing here reads a clock. The moment
 * is an argument (`now`), so this module is testable in a plain process, and
 * the one production module naming a browser global stays the capture seam
 * (`src/game/errorCapture.ts`). A test reads this file's own source and fails
 * if a browser global or a clock read appears in it, which is what keeps that
 * split from eroding one convenient edit at a time.
 */

/** How many entries the device keeps. Adding past this drops the oldest. */
export const MAX_ENTRIES = 20;

/** How much of a stack is kept: the front, where the message and frame are. */
export const MAX_STACK_CHARS = 400;

/** What a report says when this session has lost its store. */
const DEGRADED_NOTE = "Progress cannot be saved on this device";

/**
 * The body of a report written on a device that has never crashed, exported so
 * the Settings row says the same sentence the file would rather than growing a
 * second copy that could drift from it.
 */
export const NO_CRASHES = "No crashes have been recorded on this device.";

/** What a thrown value with no message and no name of its own reads as. */
const UNKNOWN_ERROR = "An unknown error was thrown";

/** What a promise rejected with nothing at all reads as. */
const NO_REASON = "Unhandled rejection with no reason";

/** What a thrown value that cannot even be serialised reads as. */
const UNREADABLE_VALUE = "An unreadable thrown value";

/**
 * What to say when the reason carries no text of its own. The two handlers are
 * told apart because "nothing was thrown" and "a promise rejected with nothing"
 * are different facts, and a parent reading the file should see which one fired.
 */
function noTextMessage(kind: CrashKind): string {
  return kind === "rejection" ? NO_REASON : UNKNOWN_ERROR;
}

/** At most `MAX_STACK_CHARS` of a stack, from the front; empty when there is none. */
function trimmedStack(stack: string | undefined): string {
  return (stack ?? "").slice(0, MAX_STACK_CHARS);
}

/** A non-empty `message` string carried by a thrown object, or null when it has none. */
function messageOfObject(reason: object): string | null {
  const message = (reason as { message?: unknown }).message;
  return typeof message === "string" && message !== "" ? message : null;
}

/**
 * Serialises a thrown object that carries no usable message. Wrapped because
 * `JSON.stringify` throws on a circular structure, and an error handler that
 * throws while describing a crash turns one crash into two.
 */
function serialisedReason(reason: object): string {
  try {
    // The `any` overload types as `string | undefined`, which only the
    // `undefined` value itself can produce — never an object.
    return JSON.stringify(reason) as string;
  } catch {
    return UNREADABLE_VALUE;
  }
}

/** The message and stack an entry carries for one thrown or rejected value. */
function describedReason(kind: CrashKind, reason: unknown): { message: string; stack: string } {
  if (reason instanceof Error) {
    // A `new Error("")` still names itself, so the entry is never blank.
    return { message: reason.message || reason.name, stack: trimmedStack(reason.stack) };
  }
  if (typeof reason === "string") {
    return { message: reason || noTextMessage(kind), stack: "" };
  }
  if (typeof reason === "object" && reason !== null) {
    const message = messageOfObject(reason);
    return { message: message ?? serialisedReason(reason), stack: "" };
  }
  return { message: noTextMessage(kind), stack: "" };
}

/**
 * Coerces whatever a handler received into one complete entry.
 *
 * Every branch returns a non-empty message and never throws: a rejection may
 * arrive as `undefined`, as a bare string, or as an object with no useful
 * fields, and a crash log must survive all three.
 */
export function toCrashEntry(kind: CrashKind, reason: unknown, now: Date): CrashEntry {
  const { message, stack } = describedReason(kind, reason);
  return { at: now.toISOString(), kind, message, stack };
}

/**
 * The buffer after one more crash: a new array, never the caller's, keeping the
 * newest `MAX_ENTRIES` entries with the newest last. Dropping happens at the
 * head, so a loop that throws every frame cannot consume the quota the guarded
 * save layer exists to survive.
 */
export function appendCrash(existing: readonly CrashEntry[], entry: CrashEntry): CrashEntry[] {
  return [...existing, entry].slice(-MAX_ENTRIES);
}

/** One stored value read as an entry, or null when it cannot be read as one. */
function readEntry(value: unknown): CrashEntry | null {
  if (typeof value !== "object" || value === null) return null;
  const { at, kind, message, stack } = value as {
    at?: unknown;
    kind?: unknown;
    message?: unknown;
    stack?: unknown;
  };
  if (typeof at !== "string" || at === "") return null;
  if (typeof message !== "string" || message === "") return null;
  if (kind !== "error" && kind !== "rejection") return null;
  return { at, kind, message, stack: typeof stack === "string" ? stack : "" };
}

/**
 * A stored value read as a crash log.
 *
 * Anything that is not an array is an empty log, and an unreadable entry is
 * dropped rather than repaired into a lie. This is what makes a payload written
 * before this track (no `diagnostics` field at all) and a hand-edited one both
 * safe to load, at the existing schema version and with no migration step.
 */
export function normalizeDiagnostics(raw: unknown): CrashEntry[] {
  if (!Array.isArray(raw)) return [];
  const entries: CrashEntry[] = [];
  for (const value of raw) {
    const entry = readEntry(value);
    if (entry !== null) entries.push(entry);
  }
  return entries.slice(-MAX_ENTRIES);
}

/**
 * The environment a report is written in, all of it read by the caller so this
 * module keeps its hands off the browser. `playTime` is a phrase the caller
 * composed rather than a shape this module parses: what a parent needs is the
 * state in words, not a number with no context.
 */
export interface DiagnosticsEnvironment {
  /** The build's version, e.g. "1.23.0". */
  appVersion: string;
  /** The device's user-agent string, already read by the caller. */
  userAgent: string;
  /** The viewport as `widthxheight`, e.g. "1280x720". */
  viewport: string;
  /** How many child profiles this device holds. */
  profileCount: number;
  /** One short phrase describing the play-time state, composed by the caller. */
  playTime: string;
  /** Whether this session has lost a storage access (`isPersistenceDegraded`). */
  degraded: boolean;
}

/**
 * The diagnostics file as plain text: a header built only from the passed
 * environment, then the log newest-first, because the crash a parent is
 * chasing is almost always the last one. An empty log says so in one sentence
 * rather than producing a file with nothing under the header.
 *
 * The whole text is built here, in one place, so the file a parent emails and
 * the file the tests assert are the same bytes with no call site free to
 * rearrange them.
 */
export function buildDiagnosticsReport(
  entries: readonly CrashEntry[],
  environment: DiagnosticsEnvironment,
  now: Date,
): string {
  const lines = [
    "Aby's Little Lab diagnostics",
    `Exported: ${now.toISOString()}`,
    `App version: ${environment.appVersion}`,
    `User agent: ${environment.userAgent}`,
    `Viewport: ${environment.viewport}`,
    `Profiles: ${environment.profileCount}`,
    `Play time: ${environment.playTime}`,
    `Storage: ${environment.degraded ? DEGRADED_NOTE : "OK"}`,
    "",
  ];
  if (entries.length === 0) {
    lines.push(NO_CRASHES);
  } else {
    const count = entries.length;
    lines.push(`${count} ${count === 1 ? "crash" : "crashes"} recorded, newest first.`, "");
    // The buffer stores oldest-first; a reader wants the newest at the top.
    for (const [index, entry] of [...entries].reverse().entries()) {
      lines.push(`${index + 1}. ${entry.at}  ${entry.kind}`, `   ${entry.message}`);
      if (entry.stack !== "") lines.push(`   ${entry.stack}`);
    }
  }
  return `${lines.join("\n")}\n`;
}
