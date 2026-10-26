import type { BandShift } from "./adaptiveLogic";
import { type Rng, shuffle } from "./random";

/** The six animal types used as sleeping-animal content in Pop & Freeze. */
export type AnimalType = "monkey" | "rabbit" | "cat" | "dog" | "elephant" | "pig";

/** Whether a bubble is poppable or a sleeping-animal decoy. */
export type BubbleType = "poppable" | "sleeping";

/** All six animal types, in canonical order. */
export const ALL_ANIMALS: readonly AnimalType[] = [
  "monkey",
  "rabbit",
  "cat",
  "dog",
  "elephant",
  "pig",
];

/** Number of pops required to win the round. */
export const WIN_TARGET = 6;

/** Number of concurrent bubbles on screen. */
export const CONCURRENT_BUBBLES = 5;

/** Minimum number of sleeping-animal bubbles in the initial spawn. */
export const MIN_SLEEPING = 1;

/** Maximum number of sleeping-animal bubbles in the initial spawn. */
export const MAX_SLEEPING = 2;

/** Sleeping-animal bounds maintained by one band's spawn guards. */
export interface SleepingBounds {
  min: number;
  max: number;
}

/** The shipped classic bounds: 1-2 sleeping-animal bubbles in play. */
const CLASSIC_SLEEPING_BOUNDS: SleepingBounds = { min: MIN_SLEEPING, max: MAX_SLEEPING };

/** Sleeping-bubble bounds for the band shift.
 *
 *  Easier bands open with fewer sleeping animals (the classic fixed wake flow
 *  never triggers on an all-poppable opening), harder bands keep more animals
 *  asleep. The classic band is the shipped 1-2 mix.
 */
export function sleepingBoundsFor(shift: BandShift = 0): SleepingBounds {
  if (shift < 0) return { min: 0, max: 1 };
  if (shift > 0) return { min: 2, max: 3 };
  return CLASSIC_SLEEPING_BOUNDS;
}

/** A spawn configuration for a single bubble. */
export interface BubbleConfig {
  type: BubbleType;
  animal?: AnimalType;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

/** Tracks the pop count and win target for a round. */
export interface RoundState {
  popCount: number;
  winTarget: number;
}

/** Creates a new round state with pop count 0 and win target 6. */
export function createRoundState(): RoundState {
  return { popCount: 0, winTarget: WIN_TARGET };
}

/**
 * Selects the bubble type for the next spawn, maintaining the band's sleeping bounds.
 *
 * `rng` must return a number in [0, 1); tests pass a seeded generator so a
 * draw is reproducible.
 */
export function selectBubbleType(
  sleepingCount: number,
  bounds: SleepingBounds = CLASSIC_SLEEPING_BOUNDS,
  rng: Rng = Math.random,
): BubbleType {
  if (sleepingCount < bounds.min) return "sleeping";
  if (sleepingCount >= bounds.max) return "poppable";
  return rng() < 0.5 ? "sleeping" : "poppable";
}

/**
 * Randomly selects one of the six sleeping animals.
 *
 * `rng` must return a number in [0, 1); tests pass a seeded generator so a
 * draw is reproducible.
 */
export function selectSleepingAnimal(rng: Rng = Math.random): AnimalType {
  return shuffle(ALL_ANIMALS, rng)[0];
}

/** Generates a randomized spawn config within world bounds.
 *
 *  Position is clamped so the bubble stays fully on-screen. Velocity is
 *  a random direction at a gentle speed suitable for floating motion.
 *
 *  `rng` must return a number in [0, 1); tests pass a seeded generator so a
 *  draw is reproducible.
 */
export function generateSpawnConfig(
  worldWidth: number,
  worldHeight: number,
  bubbleSize: number,
  type: BubbleType,
  rng: Rng = Math.random,
): BubbleConfig {
  const x = bubbleSize + rng() * (worldWidth - 2 * bubbleSize);
  const y = bubbleSize + rng() * (worldHeight - 2 * bubbleSize);
  const speed = 30 + rng() * 50; // 30–80 px/s gentle drift
  const angle = rng() * Math.PI * 2;
  const vx = Math.cos(angle) * speed;
  const vy = Math.sin(angle) * speed;
  return {
    type,
    animal: type === "sleeping" ? selectSleepingAnimal(rng) : undefined,
    x,
    y,
    vx,
    vy,
  };
}

/** Generates the initial set of concurrent bubbles (poppable + the band's sleeping mix).
 *
 *  `rng` must return a number in [0, 1); tests pass a seeded generator so a
 *  draw is reproducible.
 */
export function generateInitialBubbles(
  worldWidth: number,
  worldHeight: number,
  bubbleSize: number,
  bounds: SleepingBounds = CLASSIC_SLEEPING_BOUNDS,
  rng: Rng = Math.random,
): BubbleConfig[] {
  const bubbles: BubbleConfig[] = [];
  let sleepingCount = 0;
  for (let i = 0; i < CONCURRENT_BUBBLES; i++) {
    const type = selectBubbleType(sleepingCount, bounds, rng);
    if (type === "sleeping") sleepingCount++;
    bubbles.push(generateSpawnConfig(worldWidth, worldHeight, bubbleSize, type, rng));
  }
  return bubbles;
}

/** Registers a pop: increments count and returns win status.
 *
 *  Returns a new state object; the original is not mutated.
 */
export function registerPop(state: RoundState): { state: RoundState; isWin: boolean } {
  const newCount = state.popCount + 1;
  return {
    state: { ...state, popCount: newCount },
    isWin: newCount >= state.winTarget,
  };
}

/** Registers a wake: no penalty, returns the state unchanged. */
export function registerWake(state: RoundState): RoundState {
  return state;
}
