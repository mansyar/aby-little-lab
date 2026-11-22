import { migrateV1, normalizeV2 } from "../game/profileLogic";
import type { AppStorage, ProfileV2 } from "../types";

const V1_KEY = "abby-little-lab:v1";
const V2_KEY = "abby-little-lab:v2";

/**
 * The schema version stamped on every v2 payload write (FR-1). Payloads
 * without the field predate stamping and classify as the implicit version 1;
 * payloads carrying any other number are future versions this build cannot
 * read, and any non-number version field is corrupt.
 *
 * Exported because a backup envelope has to record the schema version it was
 * written at, and the caller that builds one is the settings panel.
 */
export const SCHEMA_VERSION = 1;

/** Classification of a stored v2 payload by its top-level `schemaVersion`. */
type StoredV2Kind = "known" | "missing" | "unknown" | "unusable";

/**
 * Classifies a stored v2 payload before anything is normalized or rewritten:
 * - `missing` — no `schemaVersion` field: implicit version 1.
 * - `known` — `schemaVersion` equals `SCHEMA_VERSION`.
 * - `unknown` — any other number: a future version; write-protected (FR-4).
 * - `unusable` — unparseable JSON or a non-number version field (A4):
 *   handled exactly as corrupt payloads were before stamping existed.
 */
export function classifyStoredV2(raw: string | null): StoredV2Kind {
  if (raw === null) return "missing";
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return "unusable";
  }
  const version =
    typeof parsed === "object" && parsed !== null
      ? (parsed as { schemaVersion?: unknown }).schemaVersion
      : undefined;
  if (version === undefined) return "missing";
  if (version === SCHEMA_VERSION) return "known";
  if (typeof version === "number") return "unknown";
  return "unusable";
}

/**
 * The version-1 migrate step — the identity, since version 1 is the current
 * schema. Kept as the template for future versions: each new version adds a
 * step that accepts its stored shape and returns the current one, without
 * touching the stored bytes (FR-3; no speculative registry).
 */
function migrateFromVersion1(v2: ProfileV2): ProfileV2 {
  return v2;
}

/**
 * The store, or null when this context has none. Some engines present the
 * global and still throw on access (blocked or partitioned site data), so the
 * absence and the access are both guarded — no path may raise a
 * `ReferenceError` or a `SecurityError` just by looking for the store.
 */
function getStorage(): Storage | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

/**
 * Whether this session is running without a store it can use. Set by any
 * failed read or write, cleared by a write the store accepted; the two
 * deliberate memory-only paths (a future-version payload and a declined
 * mutator) are not failures and leave it alone.
 */
let persistenceDegraded = false;

/**
 * Whether this session cannot read the store. An unreadable store is not an
 * empty one — it may hold a real save this build cannot see — so while this is
 * true nothing is written and memory is the only authority.
 */
let readsBlocked = false;

/**
 * The raw v2 string this session last knew the store to hold: the last one it
 * read, or the one a write was accepted with. A later read returning it is the
 * evidence that heals a blocked session — the store did not change while it
 * could not be seen, so memory is strictly newer than it.
 */
let lastKnownRaw: string | null = null;

/** True while this session has lost at least one storage access (FR-4). */
export function isPersistenceDegraded(): boolean {
  return persistenceDegraded;
}

/** The outcome of a read: the value, and whether the store refused to answer. */
interface StorageRead {
  /** True when the store could not be read — distinct from holding nothing. */
  failed: boolean;
  /** The stored string, or null when there is nothing there (or the read failed). */
  raw: string | null;
}

/**
 * Reads a key, reporting a store that refuses access separately from an empty
 * one. Folding the two together is what let a blocked device overwrite a save
 * it could not see, because every caller read `null` as "nothing stored".
 */
function readStorage(key: string): StorageRead {
  const storage = getStorage();
  if (storage === null) {
    persistenceDegraded = true;
    readsBlocked = true;
    return { failed: true, raw: null };
  }
  try {
    return { failed: false, raw: storage.getItem(key) };
  } catch {
    persistenceDegraded = true;
    readsBlocked = true;
    return { failed: true, raw: null };
  }
}

function readV1(): Partial<AppStorage> | null {
  const { failed, raw } = readStorage(V1_KEY);
  if (failed || raw === null) return null;
  try {
    return JSON.parse(raw) as Partial<AppStorage>;
  } catch {
    return null;
  }
}

/**
 * Reads the v2 payload and decides whether a successful read heals a blocked
 * session. Healing needs evidence, not optimism: only a read returning the raw
 * this session last knew — or an empty store, which has nothing to destroy —
 * proves that writing cannot overwrite bytes this build never saw.
 */
function readV2Raw(): StorageRead {
  const read = readStorage(V2_KEY);
  if (read.failed) return read;
  if (readsBlocked && (read.raw === lastKnownRaw || read.raw === null)) {
    readsBlocked = false;
  }
  if (!readsBlocked) lastKnownRaw = read.raw;
  return read;
}

/**
 * Module-scope memo of the last parsed/normalized v2 state, keyed by the raw
 * localStorage string. `getItem` + a string comparison is far cheaper than
 * `JSON.parse` + `normalizeV2`, which per-tap call sites were paying on every
 * read. The guard keeps external `localStorage` writes (and `clear()`) correct:
 * any raw change — external edit, removal, or corruption — forces a re-parse.
 *
 * `provisional` marks the placeholder a blocked boot builds before any read has
 * ever succeeded: it is memory the session invented, not a state the store was
 * seen to hold, so it must never satisfy the cache comparison. A boot that
 * failed every read keys it with `lastKnownRaw`, which is `null`; an empty store
 * then heals the read and answers `null` too, so a plain comparison would serve
 * the placeholder forever and never reach `migrateV1(readV1())` — shadowing a
 * legacy save permanently. A provisional entry lets the healed read fall
 * through to the ordinary path.
 *
 * Precedence once it does, deliberately: the persisted payload wins over
 * anything the session earned while blind. The session was already telling the
 * parent it could not save, so those earnings were never promised to survive;
 * merging the two states would need a rule for two versions of the same sticker,
 * and the spec has none.
 */
let v2Cache: { provisional: boolean; raw: string | null; state: ProfileV2 } | null = null;

function parseV2(raw: string | null): ProfileV2 | null {
  if (raw === null) return null;
  // Only `known` and `missing` (implicit v1) payloads may be normalized; an
  // `unknown` version must never reach here (it is write-protected, FR-4),
  // and `unusable` falls back to the corrupt path like before stamping.
  const kind = classifyStoredV2(raw);
  if (kind === "unknown" || kind === "unusable") return null;
  try {
    return normalizeV2(JSON.parse(raw) as Partial<ProfileV2>);
  } catch {
    return null;
  }
}

/** Returns the current v2 state, migrating a v1 save (or fresh install) on first access. */
export function ensureV2(): ProfileV2 {
  const { failed, raw } = readV2Raw();
  if (failed || readsBlocked) {
    // F1: an unreadable store is not an empty one. Serve what this session
    // already holds — the cache if there is one, otherwise the same defaults a
    // fresh install builds — and write nothing: the store may hold a real save
    // this build cannot see. The cache is keyed so the next accessor hits it,
    // and marked provisional so a later healed read cannot mistake this
    // invented placeholder for a state the store was seen to hold.
    if (v2Cache === null) {
      v2Cache = { provisional: true, raw: lastKnownRaw, state: migrateV1(null) };
    }
    return v2Cache.state;
  }

  if (v2Cache !== null && !v2Cache.provisional && v2Cache.raw === raw) return v2Cache.state;

  if (classifyStoredV2(raw) === "unknown") {
    // FR-4: a future version's payload is write-protected — its raw bytes are
    // never rewritten. The session serves fresh defaults from memory only
    // (A2: mutations are discarded on the next load). The cache is keyed by
    // the protected raw string, so it can never overwrite those bytes.
    const defaults = migrateV1(null);
    v2Cache = { provisional: false, raw, state: defaults };
    return defaults;
  }

  const existing = parseV2(raw);
  if (existing !== null) {
    const v2 = migrateFromVersion1(existing);
    v2Cache = { provisional: false, raw, state: v2 };
    return v2;
  }
  const v2 = migrateV1(readV1());
  saveV2(v2);
  return v2;
}

/**
 * The single write path. Returns whether the store accepted the bytes: `true`
 * only on the accepted-write path, `false` when the payload stayed in memory.
 */
function saveV2(v2: ProfileV2): boolean {
  // FR-1: the single write path stamps every payload with the schema version.
  const raw = JSON.stringify({ ...v2, schemaVersion: SCHEMA_VERSION });
  const storage = getStorage();
  if (storage !== null && !readsBlocked) {
    try {
      storage.setItem(V2_KEY, raw);
      // FR-2/FR-4: an accepted write stores the whole state — no delta — and
      // proves the store works again, so it clears the degraded flag.
      persistenceDegraded = false;
      lastKnownRaw = raw;
      v2Cache = { provisional: false, raw, state: v2 };
      return true;
    } catch {
      // A full quota refuses the write; the change still applies to this
      // session below, so play is never interrupted by a failed save.
    }
  }
  persistenceDegraded = true;
  // F1: while the store cannot be read it may hold a real save, so a blocked
  // session never writes over bytes it cannot see. The mutation stays in
  // memory and the memo keeps pointing at it for the rest of the session.
  //
  // Otherwise the persisted bytes did not move. Key the memo with the raw the
  // store still holds next to the new state, so the next read hits the cache
  // and serves what the child just earned; keying it with the rejected JSON
  // would miss the cache, re-read stale bytes and take the sticker back off
  // screen.
  v2Cache = { provisional: false, raw: storedRaw(), state: v2 };
  return false;
}

/** The raw the store holds: a fresh read where it answers, the last known raw otherwise. */
function storedRaw(): string | null {
  if (readsBlocked) return lastKnownRaw;
  const read = readV2Raw();
  return read.failed ? lastKnownRaw : read.raw;
}

/**
 * Applies a pure transform to the v2 state and persists it.
 * Returns null when the mutator declines (nothing is persisted).
 */
export function mutate(mutator: (v2: ProfileV2) => ProfileV2 | null): ProfileV2 | null {
  const next = mutator(ensureV2());
  if (next === null) return null;
  const stored = readV2Raw();
  if (!stored.failed && classifyStoredV2(stored.raw) === "unknown") {
    // FR-4: the stored payload is a future version and write-protected, so
    // the mutation applies to the in-memory state only (A2) — the raw bytes
    // stay untouched and the cache is re-keyed to the unchanged raw string.
    v2Cache = { provisional: false, raw: stored.raw, state: next };
    return next;
  }
  saveV2(next);
  return next;
}

/**
 * Applies a pure transform to the v2 state and reports whether the result
 * reached the store.
 *
 * The same walk `mutate` takes — the transform, then the write-protection
 * check — but with the one answer `mutate` throws away: a caller that must not
 * claim success needs to know whether the bytes landed. The unknown-version
 * branch answers `false` because it is memory-only by design (FR-4): those
 * bytes are never rewritten, so nothing was persisted.
 *
 * No caller's transform declines, which is why the signature has no `null`:
 * an unexercised branch would be a branch no test could fail.
 */
export function mutatePersisted(mutator: (v2: ProfileV2) => ProfileV2): boolean {
  const next = mutator(ensureV2());
  const stored = readV2Raw();
  if (!stored.failed && classifyStoredV2(stored.raw) === "unknown") {
    // FR-4: the stored payload is a future version and write-protected, so
    // the mutation applies to the in-memory state only (A2) — the raw bytes
    // stay untouched and the cache is re-keyed to the unchanged raw string.
    v2Cache = { provisional: false, raw: stored.raw, state: next };
    return false;
  }
  return saveV2(next);
}
