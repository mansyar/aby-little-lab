import { expect, type Page } from "@playwright/test";

/**
 * Shell-level primitives: the app's own persistence and its service worker.
 *
 * Both are driven from the outside on purpose. A journey that seeded play time
 * by calling the app's storage API would prove nothing about a real relaunch —
 * the point is that the payload on disk is what the next boot reads. Likewise
 * the offline journey cuts the network for the browser context, not for the
 * page, because that is what losing wifi does.
 */

/** The app's own profile-and-settings key (`src/utils/storage.ts`). */
export const STORAGE_KEY = "abby-little-lab:v2";

/** One profile's daily budget, in the shape the app persists. */
export interface StoredPlayTime {
  /** Daily limit in minutes; null means unlimited. */
  limitMinutes: number | null;
  /** Minutes used on `lastUsedDate`. */
  usedMinutes: number;
  /** Local `YYYY-MM-DD` key the usage belongs to. */
  lastUsedDate: string;
}

/** Reads the whole v2 payload the app has persisted, or null before it writes one. */
export function readStoredV2(page: Page): Promise<Record<string, unknown> | null> {
  return page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    return raw === null ? null : (JSON.parse(raw) as Record<string, unknown>);
  }, STORAGE_KEY);
}

/**
 * The settings block the app has persisted.
 *
 * Read from storage, not from the panel: a toggle that moves without writing
 * would look identical in the UI and be gone after a reload.
 */
export async function readStoredSettings(page: Page): Promise<Record<string, unknown> | null> {
  const stored = await readStoredV2(page);
  if (!stored) return null;
  const settings = stored.settings;
  return typeof settings === "object" && settings !== null
    ? (settings as Record<string, unknown>)
    : null;
}

/**
 * Puts the first stored profile's daily budget at the given usage, in place.
 *
 * The payload is edited, never rebuilt: the app's own `schemaVersion`, profiles
 * and settings survive, and only the one block under test changes. The day is
 * reused from what the app stamped (`normalizePlayTime` zeroes `usedMinutes`
 * when the stored day is not today, so re-deriving it here could silently seed
 * a reset instead of a spent budget).
 *
 * Call it after a boot has written the payload, then reload: the point is what
 * the *next* boot makes of it.
 */
export async function seedPlayTime(
  page: Page,
  budget: { limitMinutes: number; usedMinutes: number },
): Promise<void> {
  const outcome = await page.evaluate(
    ({ key, budget }) => {
      const raw = localStorage.getItem(key);
      if (raw === null) return "no payload";
      const stored = JSON.parse(raw) as {
        profiles?: Array<{ id?: string; playTime?: StoredPlayTime }>;
      };
      const profile = stored.profiles?.[0];
      if (!profile) return "no profile";
      const day = profile.playTime?.lastUsedDate;
      if (typeof day !== "string" || day === "") return "no day stamp";
      profile.playTime = {
        limitMinutes: budget.limitMinutes,
        usedMinutes: budget.usedMinutes,
        lastUsedDate: day,
      };
      localStorage.setItem(key, JSON.stringify(stored));
      return "seeded";
    },
    { key: STORAGE_KEY, budget },
  );

  if (outcome !== "seeded") {
    throw new Error(`the app's v2 payload should be seedable, but it had ${outcome}`);
  }
}

/** Whether a service worker controls this document right now. */
export function serviceWorkerControlled(page: Page): Promise<boolean> {
  return page.evaluate(() => Boolean(navigator.serviceWorker?.controller));
}

/**
 * Waits for the app's service worker to finish installing and activate.
 *
 * `ready` resolves with an active registration — the worker that will answer a
 * navigation with the precache. It never rejects, so the inner deadline keeps a
 * registration that never completes from hanging the journey past its timeout.
 */
export async function waitForServiceWorkerReady(page: Page): Promise<void> {
  await expect
    .poll(
      () =>
        page.evaluate(async () => {
          if (!("serviceWorker" in navigator)) return "unsupported";
          const registration = await Promise.race([
            navigator.serviceWorker.ready,
            new Promise<null>((resolve) => {
              window.setTimeout(() => resolve(null), 5_000);
            }),
          ]);
          return registration === null ? "installing" : "active";
        }),
      {
        message: "the app should install and activate its service worker before the network is cut",
        timeout: 45_000,
      },
    )
    .toBe("active");
}
