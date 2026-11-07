import { normalizeV2 } from "../game/profileLogic";
import type {
  DayActivity,
  GameId,
  GameProgress,
  PlayTime,
  Profile,
  ProfileInsights,
  ProfileV2,
  StickerData,
} from "../types";
import { GAME_IDS, MAX_PROFILES } from "../types";

/**
 * The backup file format, as pure logic: an envelope around the whole
 * normalised save, a checksum over the payload, and the rules an import obeys.
 *
 * Nothing here touches the browser. There is no `document`, no `Blob`, no
 * `URL`, no `localStorage` and no clock read: the moment a backup was taken is
 * an argument (`now`), and the schema version this build understands is an
 * argument (`schemaVersion`) so this module never imports the save layer. That
 * keeps the format testable in a plain Node process and keeps the browser seam
 * in one place, as NFR-1 requires.
 */

/** The `format` tag every file from this app carries, so a foreign file is refused. */
export const BACKUP_FORMAT = "aby-little-lab-backup";

/** The envelope layout version. A higher one is refused rather than guessed at. */
export const BACKUP_FORMAT_VERSION = 1;

/** A save wrapped for travel: the whole normalised `ProfileV2` and how to trust it. */
export interface BackupEnvelope {
  format: string;
  formatVersion: number;
  /** The `SCHEMA_VERSION` of the save inside, so a future save is refused. */
  schemaVersion: number;
  appVersion: string;
  /** ISO timestamp of the export. */
  exportedAt: string;
  /** `checksumOf(JSON.stringify(payload))`. */
  checksum: string;
  payload: ProfileV2;
}

/**
 * Why a file was refused. Every code has exactly one sentence in
 * `REFUSAL_MESSAGES`, and callers show that sentence rather than the code.
 */
export type RefusalCode =
  | "unreadable-json"
  | "wrong-format"
  | "newer-format"
  | "newer-schema"
  | "checksum-mismatch"
  | "profile-cap"
  | "store-unavailable";

/** A refused file or import: the code for the caller, the sentence for the parent. */
export interface Refusal {
  code: RefusalCode;
  message: string;
}

/**
 * One calm sentence per refusal — what happened and what a parent can do about
 * it, with no error codes and no file-format jargon. The tests assert these
 * verbatim, so they are chosen once and never paraphrased at a call site.
 */
const REFUSAL_MESSAGES: Record<RefusalCode, string> = {
  "unreadable-json":
    "The file could not be read. It may be damaged, or it may not be a backup at all.",
  "wrong-format": "This file is not a backup from Aby's Little Lab.",
  "newer-format":
    "This backup was made by a newer version of the app. Update the app, then try opening it again.",
  "newer-schema":
    "This backup holds a newer kind of save than this version of the app can read. Update the app, then try again.",
  "checksum-mismatch":
    "This backup is damaged: part of the file is missing or changed, so nothing was restored.",
  "profile-cap": `This device has room for ${MAX_PROFILES} profiles, and this backup brings more. Delete a profile first, then try again.`,
  "store-unavailable":
    "This device cannot save at the moment, so nothing was restored. Free up some space, then try again.",
};

/**
 * The `{ code, message }` pair for a refusal. Exported so the save layer can
 * refuse a degraded import (FR-7) with the sentence from this table instead of
 * a second copy of it: `readBackup` never returns `store-unavailable`, because
 * whether this device can save is not a property of the file.
 */
export function refusalFor(code: RefusalCode): Refusal {
  return { code, message: REFUSAL_MESSAGES[code] };
}

/** FNV-1a 64-bit parameters: offset basis, prime and the 64-bit mask. */
const FNV1A_64_OFFSET_BASIS = 0xcbf29ce484222325n;
const FNV1A_64_PRIME = 0x100000001b3n;
const UINT64_MASK = 0xffffffffffffffffn;

/**
 * A 64-bit FNV-1a digest of `text`, as lower-case hex prefixed `fnv1a64:`.
 *
 * It detects **corruption and truncation, not tampering**: there is no secret,
 * so anyone who edits a backup can recompute the digest. That is the honest
 * promise the product makes — the file is a copy of a child's star counts, not
 * a signed archive.
 *
 * It is synchronous, dependency-free and works on a plain-http LAN origin where
 * `crypto.subtle` is absent. `BigInt` with a 64-bit mask per step keeps the
 * arithmetic exact rather than losing precision the way `Number` would.
 */
export function checksumOf(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let hash = FNV1A_64_OFFSET_BASIS;
  for (const byte of bytes) {
    hash = ((hash ^ BigInt(byte)) * FNV1A_64_PRIME) & UINT64_MASK;
  }
  return `fnv1a64:${hash.toString(16).padStart(16, "0")}`;
}

/** What a caller must supply to write a backup. */
export interface CreateBackupOptions {
  /** The running app's version, from `package.json` — read by the caller, never here. */
  appVersion: string;
  /** The moment of export; becomes `exportedAt`. */
  now: Date;
  /** This build's `SCHEMA_VERSION`, so a future build can refuse the file. */
  schemaVersion: number;
}

/**
 * Wraps a save in a verified envelope and returns the exact text to write.
 *
 * The payload is the save **normalised by `normalizeV2`** with `options.now`, so
 * a device that only ever held a v1 save exports a v2 payload (FR-3) and a
 * partially-filled save is backfilled rather than written out as-is. The text
 * is produced here, beside the object, so a caller cannot serialise the
 * envelope differently from the bytes the checksum described.
 */
export function createBackup(
  save: ProfileV2,
  options: CreateBackupOptions,
): { envelope: BackupEnvelope; json: string } {
  const timestamp = options.now.toISOString();
  const payload = normalizeV2(save, timestamp);
  const envelope: BackupEnvelope = {
    format: BACKUP_FORMAT,
    formatVersion: BACKUP_FORMAT_VERSION,
    schemaVersion: options.schemaVersion,
    appVersion: options.appVersion,
    exportedAt: timestamp,
    checksum: checksumOf(JSON.stringify(payload)),
    payload,
  };
  return { envelope, json: JSON.stringify(envelope) };
}

/** What a caller must supply to read a backup. */
export interface ReadBackupOptions {
  /** This build's `SCHEMA_VERSION`; a file above it is refused. */
  schemaVersion: number;
}

/** A JSON object, or null for anything else (arrays and primitives included). */
function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

/** A version field: a whole number, or null when it is missing or not one. */
function asVersion(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) ? value : null;
}

/**
 * Parses a candidate file into an envelope, or names the first thing wrong with
 * it. The order is deliberate: a file that is not JSON at all, then one that is
 * not ours (a missing or non-numeric version field is folded in here rather
 * than given a code of its own), then one from a newer layout, then one holding
 * a newer save, then the checksum, and last the payload's own shape — a
 * checksum can vouch for bytes that are not a save.
 *
 * A lower `formatVersion` or `schemaVersion` is accepted — an older file is
 * still readable. Only the payload is hashed, so the envelope's own metadata
 * can be read before the save is trusted.
 */
export function readBackup(
  text: string,
  options: ReadBackupOptions,
): { ok: true; envelope: BackupEnvelope } | { ok: false; refusal: Refusal } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, refusal: refusalFor("unreadable-json") };
  }

  const candidate = asRecord(parsed);
  if (candidate === null || candidate.format !== BACKUP_FORMAT) {
    return { ok: false, refusal: refusalFor("wrong-format") };
  }
  const formatVersion = asVersion(candidate.formatVersion);
  const schemaVersion = asVersion(candidate.schemaVersion);
  if (formatVersion === null || schemaVersion === null) {
    return { ok: false, refusal: refusalFor("wrong-format") };
  }
  if (formatVersion > BACKUP_FORMAT_VERSION) {
    return { ok: false, refusal: refusalFor("newer-format") };
  }
  if (schemaVersion > options.schemaVersion) {
    return { ok: false, refusal: refusalFor("newer-schema") };
  }

  // The payload is only ever the value whose serialisation was hashed, so a
  // missing payload and a changed one are the same failure: the file is damaged.
  const checksum = candidate.checksum;
  if (candidate.payload === undefined || typeof checksum !== "string") {
    return { ok: false, refusal: refusalFor("checksum-mismatch") };
  }
  if (checksum !== checksumOf(JSON.stringify(candidate.payload))) {
    return { ok: false, refusal: refusalFor("checksum-mismatch") };
  }

  // A verified checksum proves the payload is the bytes the file describes, not
  // that those bytes are a save. A payload that is not a save object — `{}`
  // included, which would otherwise normalise into an empty one — is refused
  // here rather than reaching `planImport`.
  const payload = asRecord(candidate.payload);
  if (payload === null || !Array.isArray(payload.profiles)) {
    return { ok: false, refusal: refusalFor("wrong-format") };
  }

  return {
    ok: true,
    envelope: {
      format: BACKUP_FORMAT,
      formatVersion,
      schemaVersion,
      appVersion: typeof candidate.appVersion === "string" ? candidate.appVersion : "",
      exportedAt: typeof candidate.exportedAt === "string" ? candidate.exportedAt : "",
      checksum,
      // The checksum proved this is the payload the file describes and the shape
      // check proved it is a save; `planImport` normalises it for both modes.
      payload: payload as unknown as ProfileV2,
    },
  };
}

/** How an import reconciles a file with what the device already holds. */
export type ImportMode = "merge" | "replace";

/**
 * The earlier of two ISO timestamps, treating a missing one as "not there".
 * ISO strings sort chronologically, so the comparison is a plain string one.
 */
function earlierStamp(left: string | null, right: string | null): string | null {
  if (left === null) return right;
  if (right === null) return left;
  return left <= right ? left : right;
}

/** The later of two ISO timestamps, treating a missing one as "not there". */
function laterStamp(left: string | null, right: string | null): string | null {
  if (left === null) return right;
  if (right === null) return left;
  return left >= right ? left : right;
}

/** The earlier of two stamps that are both known present. */
function earlierText(left: string, right: string): string {
  return left <= right ? left : right;
}

/** The later of two stamps that are both known present. */
function laterText(left: string, right: string): string {
  return left >= right ? left : right;
}

/**
 * One sticker across two saves: earned if either side earned it, stamped at the
 * first time it was earned. The union is why a second import of the same file
 * changes nothing — nothing is additive.
 */
function mergeSticker(local: StickerData, incoming: StickerData): StickerData {
  if (!local.earned && !incoming.earned) return { earned: false, earnedAt: null };
  return {
    earned: true,
    earnedAt: earlierStamp(
      local.earned ? local.earnedAt : null,
      incoming.earned ? incoming.earnedAt : null,
    ),
  };
}

/** One game's stats: each counter takes the higher, the stamp takes the later. */
function mergeProgress(local: GameProgress, incoming: GameProgress): GameProgress {
  return {
    plays: Math.max(local.plays, incoming.plays),
    wins: Math.max(local.wins, incoming.wins),
    correct: Math.max(local.correct, incoming.correct),
    wrong: Math.max(local.wrong, incoming.wrong),
    lastPlayedAt: laterStamp(local.lastPlayedAt, incoming.lastPlayedAt),
    // The longer window describes more play; on a tie the device's own is kept.
    recent: incoming.recent.length > local.recent.length ? incoming.recent : local.recent,
  };
}

/**
 * Play time across two saves. The limit is the device's policy and stays local;
 * the usage belongs to whichever side last recorded it, so the later day wins
 * outright and only the same day is settled by the larger number.
 */
function mergePlayTime(local: PlayTime, incoming: PlayTime): PlayTime {
  const localDay = local.lastUsedDate;
  const incomingDay = incoming.lastUsedDate;
  const usedMinutes =
    localDay === incomingDay
      ? Math.max(local.usedMinutes, incoming.usedMinutes)
      : incomingDay > localDay
        ? incoming.usedMinutes
        : local.usedMinutes;
  return {
    limitMinutes: local.limitMinutes,
    usedMinutes,
    lastUsedDate: laterText(localDay, incomingDay),
  };
}

/** Insights: each count takes the higher, each remembered day takes the later. */
function mergeInsights(local: ProfileInsights, incoming: ProfileInsights): ProfileInsights {
  return {
    currentStreakDays: Math.max(local.currentStreakDays, incoming.currentStreakDays),
    bestStreakDays: Math.max(local.bestStreakDays, incoming.bestStreakDays),
    lastStreakDay: laterStamp(local.lastStreakDay, incoming.lastStreakDay),
    limitHitDays: Math.max(local.limitHitDays, incoming.limitHitDays),
    lastLimitHitDay: laterStamp(local.lastLimitHitDay, incoming.lastLimitHitDay),
  };
}

/**
 * The 7-day activity strip: the union of both sides' days, each day keeping the
 * higher play count, in day order. Best-of rather than additive, so importing
 * the same file twice cannot inflate a bar.
 */
function mergeActivity(local: DayActivity[], incoming: DayActivity[]): DayActivity[] {
  const playsByDay = new Map<string, number>();
  for (const entry of [...local, ...incoming]) {
    playsByDay.set(entry.day, Math.max(playsByDay.get(entry.day) ?? 0, entry.plays));
  }
  return [...playsByDay.entries()]
    .map(([day, plays]) => ({ day, plays }))
    .sort((left, right) => left.day.localeCompare(right.day));
}

/**
 * Two saves of the same child, field by field. The face, the daily limit and
 * the settings stay on this device; everything the child earned is the better
 * of the two, so a restore cannot take a sticker or a count away.
 */
function mergeProfiles(local: Profile, incoming: Profile): Profile {
  const stickers = Object.fromEntries(
    GAME_IDS.map((gameId) => [
      gameId,
      mergeSticker(local.stickers[gameId], incoming.stickers[gameId]),
    ]),
  ) as Record<GameId, StickerData>;
  const progress = Object.fromEntries(
    GAME_IDS.map((gameId) => [
      gameId,
      mergeProgress(local.progress[gameId], incoming.progress[gameId]),
    ]),
  ) as Record<GameId, GameProgress>;
  return {
    id: local.id,
    avatarId: local.avatarId,
    createdAt: earlierText(local.createdAt, incoming.createdAt),
    stickers,
    playTime: mergePlayTime(local.playTime, incoming.playTime),
    progress,
    activity: mergeActivity(local.activity, incoming.activity),
    insights: mergeInsights(local.insights, incoming.insights),
  };
}

/**
 * Decides what an import would write, without writing anything.
 *
 * The incoming save is normalised by `normalizeV2` once, before the mode is
 * looked at, so both paths work with the shape the app produces: a partial or
 * malformed payload cannot reach `merge`'s `filter` or `replace`'s assignment
 * unnormalised.
 *
 * `replace` hands back that normalised save. `merge` matches profiles by **id**
 * and keeps the better of each field (FR-5), adds the profiles whose ids are
 * new while the device has room, and keeps this device's settings and active
 * profile.
 *
 * When the save carries more than `MAX_PROFILES` profiles — in either mode — or
 * an incoming profile cannot fit under the cap, the whole import is refused and
 * no `next` is returned: a partial restore would be worse than none. Note the
 * accepted limit the spec records — two devices that both named a profile `p1`
 * are treated as the same child.
 *
 * `now` is injectable so the normalisation is deterministic; production passes
 * the moment of the import.
 */
export function planImport(
  local: ProfileV2,
  incoming: ProfileV2,
  mode: ImportMode,
  now: Date = new Date(),
): { ok: true; next: ProfileV2 } | { ok: false; refusal: Refusal } {
  const moment = now.toISOString();
  const incomingSave = normalizeV2(incoming, moment);
  // The cap is a property of the save being installed, not of the mode: a
  // five-profile file would install five profiles under replace just as surely
  // as under merge, and this device has room for four.
  if (incomingSave.profiles.length > MAX_PROFILES) {
    return { ok: false, refusal: refusalFor("profile-cap") };
  }
  if (mode === "replace") {
    return { ok: true, next: incomingSave };
  }

  const localIds = new Set(local.profiles.map((profile) => profile.id));
  const added = incomingSave.profiles.filter((profile) => !localIds.has(profile.id));
  if (local.profiles.length + added.length > MAX_PROFILES) {
    return { ok: false, refusal: refusalFor("profile-cap") };
  }

  const incomingById = new Map(incomingSave.profiles.map((profile) => [profile.id, profile]));
  const merged = local.profiles.map((profile) => {
    const counterpart = incomingById.get(profile.id);
    return counterpart === undefined ? profile : mergeProfiles(profile, counterpart);
  });

  return {
    ok: true,
    next: normalizeV2(
      {
        // Kept when it survives; `normalizeV2` falls back to the first profile.
        activeProfileId: local.activeProfileId,
        profiles: [...merged, ...added],
        settings: local.settings,
      },
      moment,
    ),
  };
}
