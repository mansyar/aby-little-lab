/**
 * Offline simulation of preschool answer streams and the band-shift curve
 * they produce. This module is pure and deterministic: a seeded RNG is the
 * only source of randomness, nothing touches Phaser, storage or the network,
 * and every threshold is injected. It is design tooling — no shipped scene
 * imports it — but it calls the real `bandShiftFor` so the curve it reports
 * cannot drift away from the game's shift rule.
 */
import { type BandShift, bandShiftFor, WINDOW_SIZE } from "./adaptiveLogic";
import type { Rng } from "./random";

/** Seed and sample size that make the published curve reproducible. */
export const SIMULATION_SEED = 20261124;
export const SIMULATION_PROFILES = 1000;

/** Every simulated profile answers a full window of taps. */
export const TAP_WINDOW = WINDOW_SIZE;

/** One latent-accuracy component of the simulated child population. */
export interface AccuracyComponent {
  readonly mean: number;
  readonly weight: number;
}

/**
 * Authored population mixture: most children are typical, with a minority
 * struggling or thriving. Weights sum to 1; the means are kept apart enough
 * that the tuned cut points separate the three bands.
 */
export const ACCURACY_COMPONENTS: readonly AccuracyComponent[] = [
  { mean: 0.35, weight: 0.15 },
  { mean: 0.62, weight: 0.7 },
  { mean: 0.85, weight: 0.15 },
];

/** The designed curve (FR-1) and its per-band tolerance, as fractions. */
export const TARGET_DISTRIBUTION = { down: 0.15, steady: 0.7, up: 0.15 } as const;
export const TARGET_TOLERANCE = 0.1;

/** Candidate cut points found by the grid search; Phase 2 pins these. */
export const CANDIDATE_UP = 0.9;
export const CANDIDATE_DOWN = 0.5;

/** Search domain used to derive the candidate pair. */
export const UP_GRID = [0.7, 0.75, 0.8, 0.85, 0.9, 0.95] as const;
export const DOWN_GRID = [0.4, 0.45, 0.5, 0.55, 0.6, 0.65] as const;

/** Observed -1 / 0 / +1 outcome counts and fractions over a simulated run. */
export interface BandShiftDistribution {
  readonly profiles: number;
  readonly counts: { readonly down: number; readonly steady: number; readonly up: number };
  readonly down: number;
  readonly steady: number;
  readonly up: number;
}

/** A cut-point pair whose simulated distribution meets the designed curve. */
export interface CutPointPair {
  readonly up: number;
  readonly down: number;
  readonly distribution: BandShiftDistribution;
}

/** Seeded mulberry32: cheap, dependency-free and reproducible for any seed. */
export function mulberry32(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 0x100000000;
  };
}

/** Draws one profile's latent accuracy from the seeded component mixture. */
export function sampleLatentAccuracy(rng: Rng): number {
  const draw = rng();
  let cumulative = 0;
  for (const component of ACCURACY_COMPONENTS) {
    cumulative += component.weight;
    if (draw < cumulative) {
      return component.mean;
    }
  }
  return ACCURACY_COMPONENTS[ACCURACY_COMPONENTS.length - 1].mean;
}

/** Simulates one full tap window as Bernoulli draws at the latent accuracy. */
export function simulateWindow(latentAccuracy: number, rng: Rng): boolean[] {
  const window: boolean[] = [];
  for (let i = 0; i < TAP_WINDOW; i++) {
    window.push(rng() < latentAccuracy);
  }
  return window;
}

/**
 * Runs `profiles` seeded answer streams through the real band shift rule and
 * returns the -1 / 0 / +1 distribution. The denominator is always the fixed
 * profile count, never a measured bucket, so a degenerate RNG cannot divide
 * by zero; an empty run is guarded explicitly.
 */
export function simulateDistribution(
  profiles: number,
  upThreshold: number,
  downThreshold: number,
  rng: Rng,
): BandShiftDistribution {
  const total = Math.max(0, Math.floor(profiles));
  const counts = { down: 0, steady: 0, up: 0 };
  for (let i = 0; i < total; i++) {
    const shift: BandShift = bandShiftFor(
      simulateWindow(sampleLatentAccuracy(rng), rng),
      upThreshold,
      downThreshold,
    );
    if (shift === -1) counts.down += 1;
    else if (shift === 1) counts.up += 1;
    else counts.steady += 1;
  }
  const fraction = (count: number): number => (total === 0 ? 0 : count / total);
  return {
    profiles: total,
    counts,
    down: fraction(counts.down),
    steady: fraction(counts.steady),
    up: fraction(counts.up),
  };
}

/** Reports whether all three bands sit inside the designed curve's tolerance. */
export function distributionMeetsTarget(distribution: BandShiftDistribution): boolean {
  return (
    Math.abs(distribution.down - TARGET_DISTRIBUTION.down) <= TARGET_TOLERANCE &&
    Math.abs(distribution.steady - TARGET_DISTRIBUTION.steady) <= TARGET_TOLERANCE &&
    Math.abs(distribution.up - TARGET_DISTRIBUTION.up) <= TARGET_TOLERANCE
  );
}

/**
 * Searches the cut-point grid. Each candidate gets a fresh RNG from the same
 * seed, so every pair is judged against the identical simulated population.
 */
export function findTunedCutPoints(seed: number, profiles: number): CutPointPair[] {
  const passing: CutPointPair[] = [];
  for (const up of UP_GRID) {
    for (const down of DOWN_GRID) {
      const distribution = simulateDistribution(profiles, up, down, mulberry32(seed));
      if (distributionMeetsTarget(distribution)) {
        passing.push({ up, down, distribution });
      }
    }
  }
  return passing;
}
