import { describe, expect, it } from "vitest";
import { WINDOW_SIZE } from "../../game/adaptiveLogic";
import { createDefaultInsights } from "../../game/insightsLogic";
import { todayKey } from "../../game/playTimeLogic";
import { createDefaultProfile, migrateV1, normalizeV2 } from "../../game/profileLogic";
import { createDefaultProgressMap } from "../../game/progressLogic";
import type { GameId, GameProgress, Profile, ProfileV2, Settings, StickerData } from "../../types";
import { GAME_IDS, MAX_PROFILES } from "../../types";
import type { BackupEnvelope, Refusal, RefusalCode } from "../../utils/backupFormat";
import {
  BACKUP_FORMAT,
  BACKUP_FORMAT_VERSION,
  checksumOf,
  createBackup,
  planImport,
  readBackup,
  refusalFor,
} from "../../utils/backupFormat";

/**
 * Every instant here derives from one fixed local noon, and every day key is
 * `todayKey(...)` of such an instant — never a literal that would pass on one
 * calendar day and fail the next. The export and import seams take the moment
 * as an argument, so the whole file is deterministic on any machine.
 */
const NOW = new Date(2026, 10, 8, 12, 0, 0);
const NOW_ISO = NOW.toISOString();
const TODAY = todayKey(NOW);
const YESTERDAY = todayKey(new Date(2026, 10, 7, 12, 0, 0));
const TWO_DAYS_AGO = todayKey(new Date(2026, 10, 6, 12, 0, 0));
const EARLY = new Date(2026, 0, 5, 9, 0, 0).toISOString();
const EARLIER = new Date(2025, 11, 1, 9, 0, 0).toISOString();
const LATER = new Date(2026, 5, 1, 9, 0, 0).toISOString();
const SCHEMA_VERSION = 1;

const SETTINGS: Settings = {
  bgmEnabled: true,
  sfxEnabled: true,
  preferredVoiceURI: null,
  adaptiveDifficulty: true,
};

/** A profile with a fixed creation stamp, so no fixture reads the wall clock. */
function profileOf(id: string, overrides: Partial<Profile> = {}): Profile {
  return { ...createDefaultProfile(id, "cat", EARLY), ...overrides };
}

/** A full sticker record with only the named games earned. */
function stickersOf(earned: Partial<Record<GameId, string>>): Record<GameId, StickerData> {
  return Object.fromEntries(
    GAME_IDS.map((gameId) => {
      const earnedAt = earned[gameId] ?? null;
      return [gameId, { earned: earnedAt !== null, earnedAt }];
    }),
  ) as Record<GameId, StickerData>;
}

/** A full progress record over the defaults, with the named games overridden. */
function progressOf(
  entries: Partial<Record<GameId, Partial<GameProgress>>>,
): Record<GameId, GameProgress> {
  const base = createDefaultProgressMap();
  for (const gameId of GAME_IDS) {
    base[gameId] = { ...base[gameId], ...(entries[gameId] ?? {}) };
  }
  return base;
}

function saveOf(profiles: Profile[], overrides: Partial<ProfileV2> = {}): ProfileV2 {
  return { activeProfileId: profiles[0].id, profiles, settings: SETTINGS, ...overrides };
}

/** The envelope JSON a file would hold, with a checksum that matches `payload`. */
function fileOf(payload: unknown, overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    format: BACKUP_FORMAT,
    formatVersion: BACKUP_FORMAT_VERSION,
    schemaVersion: SCHEMA_VERSION,
    appVersion: "1.23.0",
    exportedAt: NOW_ISO,
    checksum: checksumOf(JSON.stringify(payload)),
    payload,
    ...overrides,
  });
}

function openedOrFail(text: string, schemaVersion = SCHEMA_VERSION): BackupEnvelope {
  const result = readBackup(text, { schemaVersion });
  if (!result.ok) throw new Error(`expected the file to open, refused ${result.refusal.code}`);
  return result.envelope;
}

function refusalOf(text: string, schemaVersion = SCHEMA_VERSION): Refusal {
  const result = readBackup(text, { schemaVersion });
  if (result.ok) throw new Error("expected the file to be refused");
  return result.refusal;
}

function mergedOnce(local: ProfileV2, incoming: ProfileV2): ProfileV2 {
  const result = planImport(local, incoming, "merge", NOW);
  if (!result.ok) throw new Error(`expected a merge, refused ${result.refusal.code}`);
  return result.next;
}

function backupOf(save: ProfileV2): { envelope: BackupEnvelope; json: string } {
  return createBackup(save, { appVersion: "1.23.0", now: NOW, schemaVersion: SCHEMA_VERSION });
}

const SAMPLE_PAYLOAD = saveOf([profileOf("p1")]);
const OTHER_PAYLOAD = saveOf([profileOf("p1", { avatarId: "dog" })]);

describe("checksumOf — FNV-1a 64", () => {
  it("matches the published FNV-1a 64-bit vectors", () => {
    expect(checksumOf("")).toBe("fnv1a64:cbf29ce484222325");
    expect(checksumOf("a")).toBe("fnv1a64:af63dc4c8601ec8c");
  });

  it("is stable for the same payload text", () => {
    const text = JSON.stringify(SAMPLE_PAYLOAD);
    expect(checksumOf(text)).toBe(checksumOf(text));
    expect(checksumOf(text)).toMatch(/^fnv1a64:[0-9a-f]{16}$/);
  });

  it("changes when a single character changes", () => {
    const text = JSON.stringify(SAMPLE_PAYLOAD);
    const changed = text.replace('"cat"', '"dog"');
    expect(changed).not.toBe(text);
    expect(checksumOf(changed)).not.toBe(checksumOf(text));
  });

  it("distinguishes a payload from its truncation", () => {
    const text = JSON.stringify(SAMPLE_PAYLOAD);
    expect(checksumOf(text.slice(0, text.length - 1))).not.toBe(checksumOf(text));
  });
});

describe("createBackup and readBackup — the envelope (AC-1)", () => {
  it("wraps a two-profile save in a format-tagged envelope with a verifying checksum", () => {
    const ana = profileOf("p1", {
      stickers: stickersOf({ "shape-sorter": EARLY, "pop-freeze": LATER }),
      progress: progressOf({ "pop-freeze": { plays: 4, wins: 2, correct: 18, wrong: 3 } }),
      playTime: { limitMinutes: 20, usedMinutes: 12, lastUsedDate: TODAY },
      insights: { ...createDefaultInsights(), currentStreakDays: 3, bestStreakDays: 5 },
    });
    const ben = profileOf("p2", { avatarId: "dog" });
    const save = saveOf([ana, ben], { activeProfileId: "p2" });

    const { envelope, json } = backupOf(save);

    expect(envelope.format).toBe(BACKUP_FORMAT);
    expect(envelope.formatVersion).toBe(BACKUP_FORMAT_VERSION);
    expect(envelope.schemaVersion).toBe(SCHEMA_VERSION);
    expect(envelope.appVersion).toBe("1.23.0");
    expect(envelope.exportedAt).toBe(NOW_ISO);
    expect(envelope.checksum).toBe(checksumOf(JSON.stringify(envelope.payload)));

    expect(envelope.payload.activeProfileId).toBe("p2");
    expect(envelope.payload.profiles.map((profile) => profile.id)).toEqual(["p1", "p2"]);
    expect(envelope.payload.profiles[0].stickers["shape-sorter"]).toEqual({
      earned: true,
      earnedAt: EARLY,
    });
    expect(envelope.payload.profiles[0].progress["pop-freeze"]).toMatchObject({
      plays: 4,
      wins: 2,
      correct: 18,
      wrong: 3,
    });
    expect(envelope.payload.profiles[0].playTime).toEqual({
      limitMinutes: 20,
      usedMinutes: 12,
      lastUsedDate: TODAY,
    });
    expect(envelope.payload.profiles[0].insights.currentStreakDays).toBe(3);

    expect(openedOrFail(json)).toEqual(envelope);
  });

  it("writes the exact text the checksum described, so a caller cannot reserialise it", () => {
    const { envelope, json } = backupOf(SAMPLE_PAYLOAD);
    const reparsed = JSON.parse(json) as BackupEnvelope;
    expect(reparsed.payload).toEqual(envelope.payload);
    expect(checksumOf(JSON.stringify(reparsed.payload))).toBe(envelope.checksum);
  });

  it("exports a v1-shaped save as a normalised v2 payload (AC-2)", () => {
    const v1 = {
      stickers: stickersOf({ "shape-sorter": EARLY, "pop-freeze": LATER }),
      settings: { ...SETTINGS, bgmEnabled: false },
    };
    const migrated = migrateV1(v1, NOW_ISO);

    const { envelope } = backupOf(migrated);

    expect(envelope.payload).toEqual(normalizeV2(migrated, NOW_ISO));
    expect(envelope.payload.profiles).toHaveLength(1);
    expect(envelope.payload.profiles[0].id).toBe("p1");
    expect(envelope.payload.profiles[0].stickers["shape-sorter"]).toEqual({
      earned: true,
      earnedAt: EARLY,
    });
    // Every game the v1 save never knew about is backfilled, not dropped.
    expect(Object.keys(envelope.payload.profiles[0].stickers)).toEqual(GAME_IDS);
    expect(envelope.payload.profiles[0].stickers["color-match"]).toEqual({
      earned: false,
      earnedAt: null,
    });
    expect(envelope.payload.settings.bgmEnabled).toBe(false);

    // Normalisation happens inside `createBackup` (`normalizeV2` with `now`):
    // the migrated profile was created in January, so its day key has rolled to
    // the export day rather than being copied through untouched.
    expect(envelope.payload.profiles[0].playTime.lastUsedDate).toBe(TODAY);
  });
});

describe("readBackup — the five refusals (AC-6)", () => {
  const REFUSALS: ReadonlyArray<{
    name: string;
    text: string;
    code: RefusalCode;
    message: string;
  }> = [
    {
      name: "a file that is not JSON",
      text: '{"format":"aby-little-lab-backup",',
      code: "unreadable-json",
      message: "The file could not be read. It may be damaged, or it may not be a backup at all.",
    },
    {
      name: "a file from another app",
      text: fileOf(SAMPLE_PAYLOAD, { format: "someone-else-backup" }),
      code: "wrong-format",
      message: "This file is not a backup from Aby's Little Lab.",
    },
    {
      name: "a newer envelope layout",
      text: fileOf(SAMPLE_PAYLOAD, { formatVersion: BACKUP_FORMAT_VERSION + 1 }),
      code: "newer-format",
      message:
        "This backup was made by a newer version of the app. Update the app, then try opening it again.",
    },
    {
      name: "a newer save schema",
      text: fileOf(SAMPLE_PAYLOAD, { schemaVersion: SCHEMA_VERSION + 1 }),
      code: "newer-schema",
      message:
        "This backup holds a newer kind of save than this version of the app can read. Update the app, then try again.",
    },
    {
      name: "a changed payload",
      text: fileOf(OTHER_PAYLOAD, { checksum: checksumOf(JSON.stringify(SAMPLE_PAYLOAD)) }),
      code: "checksum-mismatch",
      message:
        "This backup is damaged: part of the file is missing or changed, so nothing was restored.",
    },
  ];

  for (const testCase of REFUSALS) {
    it(`refuses ${testCase.name} with its own sentence`, () => {
      const result = readBackup(testCase.text, { schemaVersion: SCHEMA_VERSION });

      expect(result).toEqual({
        ok: false,
        refusal: { code: testCase.code, message: testCase.message },
      });
      // AC-6's "the save is untouched" half cannot be shown from here and is not
      // claimed: `readBackup` is pure — it takes a string and returns a verdict,
      // with no write path at all. The byte-identity proof belongs to the storage
      // layer, where a write is possible, and `storage.test.ts` makes it for
      // `profile-cap` and `store-unavailable`.
    });
  }

  it("gives every refusal a distinct sentence", () => {
    const sentences = new Set(REFUSALS.map((testCase) => testCase.message));
    expect(sentences.size).toBe(REFUSALS.length);
  });

  it("gives the degraded store its own sentence, outside the read path", () => {
    // `store-unavailable` is FR-7's refusal, and it is not a property of the
    // file: `readBackup` never returns it, so it cannot sit in the table above.
    // The sentence still lives in the same table, so no call site writes its own.
    const refusal = refusalFor("store-unavailable");
    expect(refusal.code).toBe("store-unavailable");
    expect(refusal.message).toBe(
      "This device cannot save at the moment, so nothing was restored. Free up some space, then try again.",
    );
    // Every sentence is still distinct across all seven codes.
    const sentences = new Set([...REFUSALS.map((testCase) => testCase.message), refusal.message]);
    expect(sentences.size).toBe(REFUSALS.length + 1);
  });

  it("folds a missing or non-numeric version field into wrong-format", () => {
    const noVersions = JSON.stringify({
      format: BACKUP_FORMAT,
      checksum: "fnv1a64:0000000000000000",
      payload: {},
    });
    for (const text of [
      noVersions,
      fileOf(SAMPLE_PAYLOAD, { formatVersion: "1" }),
      fileOf(SAMPLE_PAYLOAD, { schemaVersion: null }),
      fileOf(SAMPLE_PAYLOAD, { formatVersion: 1.5 }),
    ]) {
      expect(refusalOf(text).code).toBe("wrong-format");
    }
  });

  it("refuses anything that is not an object, under the same wrong-format sentence", () => {
    for (const text of ["null", "[]", "42", '"aby-little-lab-backup"']) {
      expect(refusalOf(text)).toEqual({
        code: "wrong-format",
        message: "This file is not a backup from Aby's Little Lab.",
      });
    }
  });

  it("refuses a verifying checksum on a payload that is not a save", () => {
    // A checksum proves the payload is the bytes the file describes, not that
    // those bytes are a save: `{}` would otherwise normalise into a default
    // device under replace, and merge as an empty save.
    expect(refusalOf(fileOf({}))).toEqual({
      code: "wrong-format",
      message: "This file is not a backup from Aby's Little Lab.",
    });
    expect(refusalOf(fileOf({ profiles: "nope" })).code).toBe("wrong-format");
  });

  it("checks the layout version before the save version", () => {
    const text = fileOf(SAMPLE_PAYLOAD, {
      formatVersion: BACKUP_FORMAT_VERSION + 1,
      schemaVersion: SCHEMA_VERSION + 1,
    });
    expect(refusalOf(text).code).toBe("newer-format");
  });

  it("checks the versions before the checksum, so a newer file says so rather than 'damaged'", () => {
    const text = fileOf(SAMPLE_PAYLOAD, {
      schemaVersion: SCHEMA_VERSION + 1,
      checksum: "fnv1a64:0000000000000000",
    });
    expect(refusalOf(text).code).toBe("newer-schema");
  });

  it("refuses a file whose payload is missing or whose checksum is not text", () => {
    const withoutPayload = JSON.stringify({
      format: BACKUP_FORMAT,
      formatVersion: BACKUP_FORMAT_VERSION,
      schemaVersion: SCHEMA_VERSION,
      checksum: checksumOf("undefined"),
    });
    expect(refusalOf(withoutPayload).code).toBe("checksum-mismatch");
    expect(refusalOf(fileOf(SAMPLE_PAYLOAD, { checksum: 7 })).code).toBe("checksum-mismatch");
    expect(refusalOf(fileOf(SAMPLE_PAYLOAD, { checksum: undefined })).code).toBe(
      "checksum-mismatch",
    );
  });

  it("refuses a file truncated inside the payload as damaged", () => {
    const json = fileOf(SAMPLE_PAYLOAD);
    const cut = json.slice(0, json.indexOf('"payload"'));
    expect(refusalOf(cut).code).toBe("unreadable-json");
  });

  it("accepts an older layout and an older save", () => {
    const text = fileOf(SAMPLE_PAYLOAD, { formatVersion: 0, schemaVersion: 0 });
    const envelope = openedOrFail(text);
    expect(envelope.formatVersion).toBe(0);
    expect(envelope.schemaVersion).toBe(0);
  });

  it("fills empty metadata rather than refusing a file that verifies", () => {
    const envelope = openedOrFail(
      fileOf(SAMPLE_PAYLOAD, { appVersion: undefined, exportedAt: undefined }),
    );
    expect(envelope.appVersion).toBe("");
    expect(envelope.exportedAt).toBe("");
  });

  it("accepts a save version equal to this build's", () => {
    expect(openedOrFail(fileOf(SAMPLE_PAYLOAD), SCHEMA_VERSION).schemaVersion).toBe(SCHEMA_VERSION);
  });
});

describe("planImport — replace", () => {
  it("returns the file's own save, settings included", () => {
    const local = saveOf([profileOf("p1", { avatarId: "frog" })], {
      settings: { ...SETTINGS, bgmEnabled: false },
    });
    const incoming = saveOf([profileOf("p7", { avatarId: "duck" })], {
      activeProfileId: "p7",
      settings: { ...SETTINGS, sfxEnabled: false },
    });

    const result = planImport(local, incoming, "replace", NOW);

    if (!result.ok) throw new Error("expected a replacement");
    expect(result.next.profiles.map((profile) => profile.id)).toEqual(["p7"]);
    expect(result.next.activeProfileId).toBe("p7");
    expect(result.next.settings.sfxEnabled).toBe(false);
    expect(result.next.settings.bgmEnabled).toBe(true);
  });

  it("normalises the incoming save before handing it back", () => {
    const partial = saveOf([
      profileOf("p1", { playTime: { limitMinutes: 30, usedMinutes: 9, lastUsedDate: YESTERDAY } }),
    ]);
    const result = planImport(saveOf([profileOf("p1")]), partial, "replace", NOW);
    if (!result.ok) throw new Error("expected a replacement");
    expect(result.next.profiles[0].playTime.lastUsedDate).toBe(TODAY);
  });

  it("refuses a file with more profiles than this device can hold (AC-8)", () => {
    // Replace is not exempt from the cap: a five-profile file would install five
    // profiles just as surely as a merge would exceed it.
    const incoming = saveOf(["p1", "p2", "p3", "p4", "p5"].map((id) => profileOf(id)));
    expect(planImport(saveOf([profileOf("p1")]), incoming, "replace", NOW)).toEqual({
      ok: false,
      refusal: refusalFor("profile-cap"),
    });
  });
});

describe("planImport — a partial payload", () => {
  it("is normalised before merging, so it cannot throw from the panel's tap", () => {
    // A file can verify its checksum and still be short of fields: merging it
    // straight from the payload would read `incoming.stickers[gameId].earned`
    // off undefined. The normalise step at the top of `planImport` is what makes
    // that impossible, for both modes.
    const partial = {
      activeProfileId: "p9",
      profiles: [{ id: "p9" }],
      settings: {},
    } as unknown as ProfileV2;

    const result = planImport(saveOf([profileOf("p1")]), partial, "merge", NOW);

    if (!result.ok) throw new Error(`expected a merge, refused ${result.refusal.code}`);
    expect(result.next.profiles.map((profile) => profile.id)).toEqual(["p1", "p9"]);
    expect(Object.keys(result.next.profiles[1].stickers)).toEqual(GAME_IDS);
  });
});

describe("planImport — merge, one field at a time", () => {
  it("earns a sticker if either side earned it, stamped at the first time it was earned", () => {
    const local = saveOf([
      profileOf("p1", { stickers: stickersOf({ "shape-sorter": EARLY, "color-match": LATER }) }),
    ]);
    const incoming = saveOf([
      profileOf("p1", { stickers: stickersOf({ "color-match": EARLY, "pop-freeze": LATER }) }),
    ]);

    const merged = mergedOnce(local, incoming).profiles[0].stickers;

    expect(merged["shape-sorter"]).toEqual({ earned: true, earnedAt: EARLY });
    expect(merged["color-match"]).toEqual({ earned: true, earnedAt: EARLY });
    expect(merged["pop-freeze"]).toEqual({ earned: true, earnedAt: LATER });
    expect(merged["big-small"]).toEqual({ earned: false, earnedAt: null });
  });

  it("keeps an earned sticker when only the incoming save has it", () => {
    const local = saveOf([profileOf("p1")]);
    const incoming = saveOf([
      profileOf("p1", { stickers: stickersOf({ "alphabet-match": LATER }) }),
    ]);
    const merged = mergedOnce(local, incoming);
    expect(merged.profiles[0].stickers["alphabet-match"]).toEqual({
      earned: true,
      earnedAt: LATER,
    });
  });

  it("takes the higher of every progress counter", () => {
    const local = saveOf([
      profileOf("p1", {
        progress: progressOf({ "pop-freeze": { plays: 3, wins: 1, correct: 10, wrong: 2 } }),
      }),
    ]);
    const incoming = saveOf([
      profileOf("p1", {
        progress: progressOf({ "pop-freeze": { plays: 5, wins: 0, correct: 4, wrong: 9 } }),
      }),
    ]);

    const merged = mergedOnce(local, incoming).profiles[0].progress["pop-freeze"];

    expect(merged).toMatchObject({ plays: 5, wins: 1, correct: 10, wrong: 9 });
  });

  it("takes the later lastPlayedAt, surviving a null on either side", () => {
    const cases: ReadonlyArray<{
      local: string | null;
      incoming: string | null;
      expected: string | null;
    }> = [
      { local: null, incoming: LATER, expected: LATER },
      { local: LATER, incoming: null, expected: LATER },
      { local: EARLY, incoming: LATER, expected: LATER },
      { local: LATER, incoming: EARLY, expected: LATER },
      { local: null, incoming: null, expected: null },
    ];
    for (const testCase of cases) {
      const local = saveOf([
        profileOf("p1", {
          progress: progressOf({ "pop-freeze": { lastPlayedAt: testCase.local } }),
        }),
      ]);
      const incoming = saveOf([
        profileOf("p1", {
          progress: progressOf({ "pop-freeze": { lastPlayedAt: testCase.incoming } }),
        }),
      ]);
      expect(mergedOnce(local, incoming).profiles[0].progress["pop-freeze"].lastPlayedAt).toBe(
        testCase.expected,
      );
    }
  });

  it("takes the longer recent window, and the local one on a tie", () => {
    const local = saveOf([
      profileOf("p1", { progress: progressOf({ "pop-freeze": { recent: [true] } }) }),
    ]);
    const longer = saveOf([
      profileOf("p1", { progress: progressOf({ "pop-freeze": { recent: [true, false, true] } }) }),
    ]);
    expect(mergedOnce(local, longer).profiles[0].progress["pop-freeze"].recent).toEqual([
      true,
      false,
      true,
    ]);

    const shorter = saveOf([
      profileOf("p1", { progress: progressOf({ "pop-freeze": { recent: [false] } }) }),
    ]);
    expect(mergedOnce(longer, shorter).profiles[0].progress["pop-freeze"].recent).toEqual([
      true,
      false,
      true,
    ]);
    expect(mergedOnce(longer, shorter).profiles[0].progress["pop-freeze"].recent).toEqual(
      longer.profiles[0].progress["pop-freeze"].recent,
    );
  });

  it("keeps the device's own daily limit", () => {
    const local = saveOf([
      profileOf("p1", { playTime: { limitMinutes: 20, usedMinutes: 0, lastUsedDate: TODAY } }),
    ]);
    const incoming = saveOf([
      profileOf("p1", { playTime: { limitMinutes: 30, usedMinutes: 0, lastUsedDate: TODAY } }),
    ]);
    expect(mergedOnce(local, incoming).profiles[0].playTime.limitMinutes).toBe(20);

    const unlimited = saveOf([
      profileOf("p1", { playTime: { limitMinutes: null, usedMinutes: 0, lastUsedDate: TODAY } }),
    ]);
    expect(mergedOnce(unlimited, incoming).profiles[0].playTime.limitMinutes).toBeNull();
  });

  it("takes usedMinutes from the later day, and the higher number on the same day", () => {
    const local = saveOf([
      profileOf("p1", { playTime: { limitMinutes: 30, usedMinutes: 5, lastUsedDate: YESTERDAY } }),
    ]);
    const incoming = saveOf([
      profileOf("p1", { playTime: { limitMinutes: 30, usedMinutes: 3, lastUsedDate: TODAY } }),
    ]);
    expect(mergedOnce(local, incoming).profiles[0].playTime).toEqual({
      limitMinutes: 30,
      usedMinutes: 3,
      lastUsedDate: TODAY,
    });

    const freshLocal = saveOf([
      profileOf("p1", { playTime: { limitMinutes: 30, usedMinutes: 5, lastUsedDate: TODAY } }),
    ]);
    const staleIncoming = saveOf([
      profileOf("p1", { playTime: { limitMinutes: 30, usedMinutes: 3, lastUsedDate: YESTERDAY } }),
    ]);
    expect(mergedOnce(freshLocal, staleIncoming).profiles[0].playTime.usedMinutes).toBe(5);

    const sameDayIncoming = saveOf([
      profileOf("p1", { playTime: { limitMinutes: 30, usedMinutes: 8, lastUsedDate: TODAY } }),
    ]);
    expect(mergedOnce(freshLocal, sameDayIncoming).profiles[0].playTime.usedMinutes).toBe(8);
  });

  it("takes the higher insight counts and the later remembered day", () => {
    const local = saveOf([
      profileOf("p1", {
        insights: {
          currentStreakDays: 2,
          bestStreakDays: 5,
          lastStreakDay: TWO_DAYS_AGO,
          limitHitDays: 1,
          lastLimitHitDay: null,
        },
      }),
    ]);
    const incoming = saveOf([
      profileOf("p1", {
        insights: {
          currentStreakDays: 4,
          bestStreakDays: 3,
          lastStreakDay: TODAY,
          limitHitDays: 3,
          lastLimitHitDay: TWO_DAYS_AGO,
        },
      }),
    ]);

    expect(mergedOnce(local, incoming).profiles[0].insights).toEqual({
      currentStreakDays: 4,
      bestStreakDays: 5,
      lastStreakDay: TODAY,
      limitHitDays: 3,
      lastLimitHitDay: TWO_DAYS_AGO,
    });
  });

  it("keeps an insight day that only one side remembers", () => {
    const local = saveOf([
      profileOf("p1", { insights: { ...createDefaultInsights(), lastLimitHitDay: null } }),
    ]);
    const incoming = saveOf([
      profileOf("p1", {
        insights: { ...createDefaultInsights(), lastLimitHitDay: TWO_DAYS_AGO },
      }),
    ]);
    expect(mergedOnce(local, incoming).profiles[0].insights.lastLimitHitDay).toBe(TWO_DAYS_AGO);
  });

  it("unions the activity strip, keeping the higher count per day", () => {
    const local = saveOf([profileOf("p1", { activity: [{ day: TWO_DAYS_AGO, plays: 2 }] })]);
    const incoming = saveOf([
      profileOf("p1", {
        activity: [
          { day: TODAY, plays: 1 },
          { day: TWO_DAYS_AGO, plays: 5 },
        ],
      }),
    ]);

    expect(mergedOnce(local, incoming).profiles[0].activity).toEqual([
      { day: TWO_DAYS_AGO, plays: 5 },
      { day: TODAY, plays: 1 },
    ]);
  });

  it("keeps the earlier createdAt, the local avatar and the local settings", () => {
    const local = saveOf(
      [
        profileOf("p1", {
          avatarId: "frog",
          createdAt: EARLY,
          stickers: stickersOf({ "shape-sorter": EARLY }),
        }),
      ],
      { settings: { ...SETTINGS, bgmEnabled: false, preferredVoiceURI: "voice-local" } },
    );
    const incoming = saveOf(
      [
        profileOf("p1", {
          avatarId: "dog",
          createdAt: EARLIER,
          stickers: stickersOf({ "pop-freeze": LATER }),
        }),
      ],
      { settings: { ...SETTINGS, bgmEnabled: true } },
    );

    const merged = mergedOnce(local, incoming);

    expect(merged.profiles[0].createdAt).toBe(EARLIER);
    expect(merged.profiles[0].avatarId).toBe("frog");
    expect(merged.settings.bgmEnabled).toBe(false);
    expect(merged.settings.preferredVoiceURI).toBe("voice-local");
  });

  it("keeps the local profile untouched when the file does not mention it", () => {
    const local = saveOf([profileOf("p1"), profileOf("p2", { avatarId: "dog" })], {
      activeProfileId: "p2",
    });
    const incoming = saveOf([profileOf("p1", { stickers: stickersOf({ "shape-sorter": EARLY }) })]);

    const merged = mergedOnce(local, incoming);

    expect(merged.profiles.map((profile) => profile.id)).toEqual(["p1", "p2"]);
    expect(merged.activeProfileId).toBe("p2");
    expect(merged.profiles[1]).toEqual(normalizeV2(local, NOW_ISO).profiles[1]);
  });

  it("activates the first profile when the local active one is gone from the file", () => {
    const local = saveOf([profileOf("p1"), profileOf("p2", { avatarId: "dog" })], {
      activeProfileId: "ghost",
    });
    const incoming = saveOf([profileOf("p1")]);
    expect(mergedOnce(local, incoming).activeProfileId).toBe("p1");
  });

  it("appends profiles whose ids are new, normalised", () => {
    const local = saveOf([profileOf("p1")]);
    const incoming = saveOf([
      profileOf("p1"),
      profileOf("p9", { avatarId: "duck", stickers: stickersOf({ "word-match": LATER }) }),
    ]);

    const merged = mergedOnce(local, incoming);

    expect(merged.profiles.map((profile) => profile.id)).toEqual(["p1", "p9"]);
    expect(merged.profiles[1].avatarId).toBe("duck");
    expect(merged.profiles[1].stickers["word-match"]).toEqual({ earned: true, earnedAt: LATER });
    expect(Object.keys(merged.profiles[1].progress)).toEqual(GAME_IDS);
  });
});

describe("planImport — the profile cap (AC-8)", () => {
  const FOUR_LOCAL = saveOf([
    profileOf("p1"),
    profileOf("p2", { avatarId: "dog" }),
    profileOf("p3", { avatarId: "pig" }),
    profileOf("p4", { avatarId: "frog" }),
  ]);

  it("refuses a fifth profile and returns no save to write", () => {
    expect(FOUR_LOCAL.profiles).toHaveLength(MAX_PROFILES);
    const local = saveOf(FOUR_LOCAL.profiles, { activeProfileId: "p3" });
    const incoming = saveOf([profileOf("p5", { avatarId: "duck" })]);
    const before = JSON.stringify(local);

    const result = planImport(local, incoming, "merge", NOW);

    expect(result).toEqual({
      ok: false,
      refusal: {
        code: "profile-cap",
        message: `This device has room for ${MAX_PROFILES} profiles, and this backup brings more. Delete a profile first, then try again.`,
      },
    });
    expect("next" in result).toBe(false);
    expect(JSON.stringify(local)).toBe(before);
  });

  it("refuses when only one of several incoming profiles cannot fit", () => {
    const incoming = saveOf([profileOf("p1"), profileOf("p4"), profileOf("p6")]);
    const local = saveOf([profileOf("p1"), profileOf("p2"), profileOf("p3"), profileOf("p4")]);
    const result = planImport(local, incoming, "merge", NOW);
    expect(result.ok).toBe(false);
  });

  it("accepts the last free slot", () => {
    const local = saveOf([profileOf("p1"), profileOf("p2"), profileOf("p3")]);
    const incoming = saveOf([profileOf("p4", { avatarId: "duck" })]);
    const merged = mergedOnce(local, incoming);
    expect(merged.profiles.map((profile) => profile.id)).toEqual(["p1", "p2", "p3", "p4"]);
  });

  it("never refuses a file that only repeats profiles the device already has", () => {
    const local = saveOf([profileOf("p1"), profileOf("p2"), profileOf("p3"), profileOf("p4")]);
    const incoming = saveOf([
      profileOf("p1", { stickers: stickersOf({ "story-order": LATER }) }),
      profileOf("p4", { avatarId: "bear" }),
    ]);
    const merged = mergedOnce(local, incoming);
    expect(merged.profiles).toHaveLength(MAX_PROFILES);
    expect(merged.profiles[0].stickers["story-order"]).toEqual({ earned: true, earnedAt: LATER });
  });
});

describe("planImport — idempotence (AC-4)", () => {
  it("merging the same file twice equals merging it once", () => {
    const local = saveOf(
      [
        profileOf("p1", {
          avatarId: "frog",
          stickers: stickersOf({ "shape-sorter": EARLY, "color-match": LATER }),
          progress: progressOf({ "pop-freeze": { plays: 3, wins: 1, recent: [true, false] } }),
          playTime: { limitMinutes: 25, usedMinutes: 6, lastUsedDate: TODAY },
          activity: [{ day: TWO_DAYS_AGO, plays: 2 }],
          insights: {
            currentStreakDays: 2,
            bestStreakDays: 4,
            lastStreakDay: TWO_DAYS_AGO,
            limitHitDays: 1,
            lastLimitHitDay: TWO_DAYS_AGO,
          },
        }),
        profileOf("p2", { avatarId: "dog" }),
      ],
      { activeProfileId: "p2" },
    );
    const incoming = saveOf(
      [
        profileOf("p1", {
          avatarId: "cat",
          stickers: stickersOf({ "shape-sorter": LATER, "pop-freeze": EARLY }),
          progress: progressOf({
            "pop-freeze": { plays: 5, wins: 0, recent: [true, false, true] },
          }),
          playTime: { limitMinutes: 40, usedMinutes: 9, lastUsedDate: YESTERDAY },
          activity: [
            { day: TODAY, plays: 3 },
            { day: TWO_DAYS_AGO, plays: 1 },
          ],
          insights: {
            currentStreakDays: 5,
            bestStreakDays: 5,
            lastStreakDay: TODAY,
            limitHitDays: 2,
            lastLimitHitDay: TODAY,
          },
        }),
        profileOf("p3", { avatarId: "pig" }),
      ],
      { activeProfileId: "p1" },
    );

    const once = mergedOnce(local, incoming);
    const twice = mergedOnce(once, incoming);

    expect(twice).toEqual(once);
  });
});

describe("planImport and readBackup — the whole round trip", () => {
  it("restores a backup into a fresh device and reads the same file twice unchanged", () => {
    const ana = profileOf("p1", {
      stickers: stickersOf({ "shape-sorter": EARLY }),
      progress: progressOf({ "pop-freeze": { plays: 7, wins: 7 } }),
    });
    const origin = saveOf([ana], { activeProfileId: "p1" });
    const { json } = backupOf(origin);

    const freshDevice = migrateV1(null, NOW_ISO);
    const incoming = openedOrFail(json).payload;

    const restored = mergedOnce(freshDevice, incoming);
    expect(restored.profiles[0].stickers["shape-sorter"]).toEqual({
      earned: true,
      earnedAt: EARLY,
    });
    expect(restored.profiles[0].progress["pop-freeze"].plays).toBe(7);

    expect(mergedOnce(restored, incoming)).toEqual(restored);
  });
});

describe("the envelope a real save produces (NFR-6)", () => {
  /**
   * What a device that has played everything actually holds: four children, all
   * 22 games with counters and a full adaptive window, a 7-day activity strip, a
   * streak and both play-time fields. Measured through the same `createBackup`
   * an export calls, so the number is the file a parent would get.
   */
  function fourFullProfiles(): Profile[] {
    const avatars: ReadonlyArray<Profile["avatarId"]> = ["cat", "dog", "pig", "frog"];
    const allEarned = Object.fromEntries(
      GAME_IDS.map((gameId, index) => [
        gameId,
        { earned: true, earnedAt: index % 2 === 0 ? EARLY : LATER },
      ]),
    ) as Record<GameId, StickerData>;
    const fullProgress = progressOf(
      Object.fromEntries(
        GAME_IDS.map((gameId) => [
          gameId,
          {
            plays: 30,
            wins: 22,
            correct: 140,
            wrong: 41,
            lastPlayedAt: LATER,
            recent: Array.from({ length: WINDOW_SIZE }, (_, index) => index % 2 === 0),
          },
        ]),
      ),
    );
    const activity = [0, 1, 2, 3, 4, 5, 6].map((offset) => ({
      day: todayKey(new Date(2026, 10, 8 - offset, 12, 0, 0)),
      plays: 3,
    }));

    return avatars.map((avatarId, index) =>
      profileOf(`p${index + 1}`, {
        avatarId,
        stickers: allEarned,
        progress: fullProgress,
        activity,
        insights: {
          currentStreakDays: 9,
          bestStreakDays: 21,
          lastStreakDay: TODAY,
          limitHitDays: 2,
          lastLimitHitDay: YESTERDAY,
        },
      }),
    );
  }

  it("stays in kilobytes with four full profiles", () => {
    const profiles = fourFullProfiles();
    const { json } = backupOf(saveOf(profiles, { activeProfileId: "p1" }));

    expect(profiles).toHaveLength(4);
    // The bound NFR-6 promises: kilobytes, not megabytes. The message carries the
    // measured size so a regression reports the number it reached.
    expect(
      json.length,
      `a four-profile backup measured ${json.length} bytes, over the ${64 * 1024} byte bound`,
    ).toBeLessThan(64 * 1024);
  });
});
