/**
 * Parent-facing viewport zoom helpers.
 *
 * The game locks pinch-zoom (viewport `user-scalable=no`) so toddler taps never
 * accidentally zoom. But the Settings panel is small on phones, so parents need
 * to zoom in while it is open. These helpers relax the viewport only while the
 * Settings panel exists and restore the lock on close.
 */

/** The locked viewport content the game ships with. */
export const RESTORED_VIEWPORT =
  "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no";

/** The relaxed viewport content used while the Settings panel is open. */
export const PINCH_ZOOM_VIEWPORT = "width=device-width, initial-scale=1.0";

/** Returns the viewport meta tag, or null when it is missing. */
function getViewportMeta(): HTMLMetaElement | null {
  return document.querySelector('meta[name="viewport"]');
}

/** Allows pinch-zoom until restorePinchZoom() is called (idempotent). */
export function allowPinchZoom(): void {
  const viewport = getViewportMeta();
  if (viewport) {
    viewport.content = PINCH_ZOOM_VIEWPORT;
  }
}

/** Restores the locked viewport used by the rest of the game (idempotent). */
export function restorePinchZoom(): void {
  const viewport = getViewportMeta();
  if (viewport) {
    viewport.content = RESTORED_VIEWPORT;
  }
}
