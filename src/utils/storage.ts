import type { BandShift } from "../game/adaptiveLogic";
import { bandShiftFor } from "../game/adaptiveLogic";
import {
  addPlayTime,
  normalizePlayTime,
  setLimit,
  setPlaySessionSink,
} from "../game/playTimeLogic";
import {
  addProfile as addProfileToV2,
  availableAvatarIds,
  createDefaultStickers,
  deleteProfile as deleteProfileFromV2,
  migrateV1,
  normalizeV2,
  switchActiveProfile,
} from "../game/profileLogic";
import {
  addActivity,
  normalizeProgressMap,
  pruneActivity,
  recordPlay,
  recordResult,
  recordTaps,
} from "../game/progressLogic";
import type {
  AppStorage,
  AvatarId,
  GameId,
  GameProgress,
  PlayTime,
  Profile,
  ProfileV2,
  Settings,
} from "../types";

const V1_KEY = "abby-little-lab:v1";
const V2_KEY = "abby-little-lab:v2";

/**
 * The schema version stamped on every v2 payload write (FR-1). Payloads
 * without the field predate stamping and classify as the implicit version 1;
 * payloads carrying any other number are future versions this build cannot
 * read, and any non-number version field is corrupt.
 */
const SCHEMA_VERSION = 1;

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
function classifyStoredV2(raw: string | null): StoredV2Kind {
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
function ensureV2(): ProfileV2 {
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

function saveV2(v2: ProfileV2): void {
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
      return;
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
function mutate(mutator: (v2: ProfileV2) => ProfileV2 | null): ProfileV2 | null {
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

/** Marks a sticker as earned on the ACTIVE profile and persists. */
export function earnSticker(gameId: GameId): void {
  mutate((v2) => ({
    ...v2,
    profiles: v2.profiles.map((p) =>
      p.id === v2.activeProfileId
        ? {
            ...p,
            stickers: {
              ...p.stickers,
              [gameId]: { earned: true, earnedAt: new Date().toISOString() },
            },
          }
        : p,
    ),
  }));
}

/** Whether the ACTIVE profile has earned the sticker. */
export function hasSticker(gameId: GameId): boolean {
  return getActiveProfile().stickers[gameId].earned;
}

/** The device-global settings block of the current v2 state. */
export function getSettings(): Settings {
  return ensureV2().settings;
}

export function updateSettings(partial: Partial<Settings>): void {
  mutate((v2) => ({ ...v2, settings: { ...v2.settings, ...partial } }));
}

/** Clears the ACTIVE profile's stickers, keeping settings and other profiles. */
export function resetProgress(): void {
  mutate((v2) => ({
    ...v2,
    profiles: v2.profiles.map((p) =>
      p.id === v2.activeProfileId ? { ...p, stickers: createDefaultStickers() } : p,
    ),
  }));
}

export function getProfiles(): Profile[] {
  return ensureV2().profiles;
}

export function getActiveProfile(): Profile {
  const v2 = ensureV2();
  return v2.profiles.find((p) => p.id === v2.activeProfileId) ?? v2.profiles[0];
}

/** Adds a profile with the given avatar (becomes active). Null when full or avatar taken. */
export function addProfile(avatarId: AvatarId): Profile | null {
  const next = mutate((v2) => addProfileToV2(v2, avatarId));
  return next ? (next.profiles.find((p) => p.id === next.activeProfileId) ?? null) : null;
}

export function deleteProfile(profileId: string): void {
  mutate((v2) => deleteProfileFromV2(v2, profileId));
}

/** Switches the active profile; returns false for an unknown profile id. */
export function switchProfile(profileId: string): boolean {
  const next = mutate((v2) => switchActiveProfile(v2, profileId));
  return next !== null && next.activeProfileId === profileId;
}

export function getAvailableAvatars(): AvatarId[] {
  return availableAvatarIds(ensureV2());
}

/** Normalized play time for the active profile (or the profile with the given id). */
export function getPlayTime(profileId?: string): PlayTime {
  const v2 = ensureV2();
  const id = profileId ?? v2.activeProfileId;
  const profile = v2.profiles.find((p) => p.id === id) ?? v2.profiles[0];
  return normalizePlayTime(profile.playTime);
}

/** Sets (or clears with null) a profile's daily play-time limit. */
export function setPlayTimeLimit(profileId: string, limitMinutes: number | null): void {
  mutate((v2) => ({
    ...v2,
    profiles: v2.profiles.map((p) =>
      p.id === profileId ? { ...p, playTime: setLimit(p.playTime, limitMinutes) } : p,
    ),
  }));
}

/** Adds minutes to a profile's usage for today. */
export function recordPlayTime(profileId: string, minutes: number): void {
  mutate((v2) => ({
    ...v2,
    profiles: v2.profiles.map((p) =>
      p.id === profileId ? { ...p, playTime: addPlayTime(p.playTime, minutes) } : p,
    ),
  }));
}

/** Records a started play on the ACTIVE profile: plays++, last-played stamp, today's activity. */
export function recordGamePlay(gameId: GameId): void {
  mutate((v2) => {
    const now = new Date();
    return {
      ...v2,
      profiles: v2.profiles.map((p) =>
        p.id === v2.activeProfileId
          ? {
              ...p,
              progress: {
                ...p.progress,
                [gameId]: recordPlay(p.progress[gameId], now),
              },
              activity: pruneActivity(addActivity(p.activity, now), now),
            }
          : p,
      ),
    };
  });
}

/** Records a completed session on the ACTIVE profile: win + correct/wrong taps. */
export function recordGameResult(gameId: GameId, correct: number, wrong: number): void {
  mutate((v2) => ({
    ...v2,
    profiles: v2.profiles.map((p) =>
      p.id === v2.activeProfileId
        ? {
            ...p,
            progress: {
              ...p.progress,
              [gameId]: recordResult(p.progress[gameId], { correct, wrong, win: true }),
            },
          }
        : p,
    ),
  }));
}

/**
 * Records an abandoned session's taps on the ACTIVE profile: the rolling
 * window only. The cumulative counters and the win count describe completed
 * sessions and stay untouched; the play count is not touched either, because
 * it counts every game the child starts, abandoned or not.
 */
export function recordGameTaps(gameId: GameId, correct: number, wrong: number): void {
  mutate((v2) => ({
    ...v2,
    profiles: v2.profiles.map((p) =>
      p.id === v2.activeProfileId
        ? {
            ...p,
            progress: {
              ...p.progress,
              [gameId]: recordTaps(p.progress[gameId], { correct, wrong }),
            },
          }
        : p,
    ),
  }));
}

/** Normalized per-game progress for the active profile (or the profile with the given id). */
export function getProgress(profileId?: string): Record<GameId, GameProgress> {
  const v2 = ensureV2();
  const id = profileId ?? v2.activeProfileId;
  const profile = v2.profiles.find((p) => p.id === id) ?? v2.profiles[0];
  return normalizeProgressMap(profile.progress);
}

/**
 * Band shift (-1 | 0 | 1) for the active profile's recent performance in a game,
 * derived from the rolling tap window. Returns 0 when the adaptive difficulty
 * toggle is off or the window holds too few taps to judge.
 */
export function getAdaptiveBandShift(gameId: GameId): BandShift {
  if (!getSettings().adaptiveDifficulty) return 0;
  return bandShiftFor(getProgress()[gameId].recent);
}

// The play-session module banks through a sink so it can stay free of a storage
// import (and the cycle that would follow). `recordPlayTime` is its writer.
setPlaySessionSink(recordPlayTime);
