import type { ProfileV2 } from "../types";
import type { ImportMode, Refusal } from "./backupFormat";
import { planImport, refusalFor } from "./backupFormat";
import { ensureV2, isPersistenceDegraded, mutatePersisted } from "./storageEngine";

/**
 * The whole save as the backup format wants it: normalised, so a v1-only device
 * exports v2 (FR-3).
 *
 * `ensureV2` is what makes that true — it migrates a v1-only store and
 * normalises a partial one before handing anything out, so the exported payload
 * is always the current shape, whatever the store happens to hold.
 */
export function exportSave(): ProfileV2 {
  return ensureV2();
}

/**
 * Plans an import against the live save and writes it in one mutation.
 *
 * The plan is computed from the normalised current save, so a merge keeps this
 * device's settings and profile ids and a replace overwrites the whole payload.
 * Either way the result lands through the mutating path — one write, the same
 * path every other change takes, so an import is guarded exactly as
 * `earnSticker` is and `v2Cache` is re-keyed for free.
 *
 * A degraded store refuses before anything is planned (FR-7): a restored save
 * would not survive the reload that makes it visible, so pretending is worse
 * than saying no. Export still works while degraded, because it only reads.
 *
 * A write the store refuses — a full quota, or a payload from a future version
 * that is never rewritten — also refuses rather than reporting success. An
 * import that cannot reach storage keeps its state in memory for the session,
 * the same choice the save layer already makes, but it reports
 * `store-unavailable` so the panel prints the sentence and does not reload: a
 * reload is the one thing that would destroy the restore without a word.
 */
export function applyImport(
  mode: ImportMode,
  incoming: ProfileV2,
  now?: Date,
): { ok: true } | { ok: false; refusal: Refusal } {
  if (isPersistenceDegraded()) {
    return { ok: false, refusal: refusalFor("store-unavailable") };
  }
  const planned = planImport(ensureV2(), incoming, mode, now ?? new Date());
  if (!planned.ok) return planned;
  if (!mutatePersisted(() => planned.next)) {
    return { ok: false, refusal: refusalFor("store-unavailable") };
  }
  return { ok: true };
}
