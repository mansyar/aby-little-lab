/**
 * Persistence façade.
 *
 * The guarded-save engine, profile/settings, play-time/progress and
 * backup/import domains live in sibling modules; this file re-exports their
 * public API so every existing import path (including the many test mocks that
 * wrap this module) keeps resolving exactly as before. Module-level state lives
 * in `storageEngine.ts`, so all domains share one v2 cache and one degraded flag.
 */

export { applyImport, exportSave } from "./storageBackup";
export { isPersistenceDegraded, SCHEMA_VERSION } from "./storageEngine";
export {
  getAdaptiveBandShift,
  getPlayTime,
  getProgress,
  recordGamePlay,
  recordGameResult,
  recordGameTaps,
  recordLimitHit,
  recordPlayTime,
  setPlayTimeLimit,
} from "./storagePlay";
export {
  addProfile,
  deleteProfile,
  earnSticker,
  getActiveProfile,
  getAvailableAvatars,
  getDiagnostics,
  getProfiles,
  getSettings,
  hasSticker,
  recordCrash,
  resetProgress,
  switchProfile,
  updateSettings,
} from "./storageProfiles";
