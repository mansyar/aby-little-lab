/**
 * Time-up dimming, extracted from the `hubGrid.ts` orchestrator: the locked
 * presentation applied to the currently-visible tiles once the daily play-time
 * limit is reached.
 *
 * Pure logic first (no runtime Phaser import — the dragBoard/gridLayout
 * precedent): tiles are a minimal structural surface so tests drive the lock
 * with plain mock objects. When the lock is applied (after each build and on
 * the scene's play-time events) and the tap guards that read the time-up flag
 * stay with the orchestrator, which owns input wiring and the tile lists.
 */

/** Alpha applied to Hub tiles while the daily limit locks them. */
export const TIME_UP_TILE_ALPHA = 0.45;

/** Static scale for locked tiles - a non-color "unavailable" size cue. */
export const TIME_UP_TILE_SCALE = 0.97;

/** Minimal tile surface the lock and its restore act on. */
export interface LockableTile {
  setAlpha(alpha: number): unknown;
  setScale(scale: number): unknown;
  disableInteractive(): unknown;
  setInteractive(): unknown;
}

/**
 * Dims, shrinks and disables every currently-visible game tile once the
 * daily play-time limit is reached (locked tiles swallow taps).
 */
export function applyTimeUpLock(tiles: Iterable<LockableTile>): void {
  for (const tile of tiles) {
    tile.setAlpha(TIME_UP_TILE_ALPHA);
    tile.setScale(TIME_UP_TILE_SCALE);
    tile.disableInteractive();
  }
}

/** Re-enables every tile after a time-up lock clears. */
export function restoreTiles(tiles: Iterable<LockableTile>): void {
  for (const tile of tiles) {
    tile.setAlpha(1);
    tile.setScale(1);
    tile.setInteractive();
  }
}
