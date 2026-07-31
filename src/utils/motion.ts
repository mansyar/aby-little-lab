/**
 * Central motion helpers honoring the user's `prefers-reduced-motion`
 * preference. All gameplay and UI tweens should consult these helpers so
 * reduced-motion users get shorter durations and smaller amplitudes.
 */

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/** Returns true when the user has requested reduced motion via OS settings. */
export function isReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/** Selects a tween duration based on the reduced-motion preference. */
export function motionDuration(normal: number, reduced: number): number {
  return isReducedMotion() ? reduced : normal;
}

/** Selects a tween amplitude/scale based on the reduced-motion preference. */
export function motionScale(normal: number, reduced: number): number {
  return isReducedMotion() ? reduced : normal;
}
