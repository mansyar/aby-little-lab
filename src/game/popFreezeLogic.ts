/** The four animal types used as sleeping-animal content in Pop & Freeze. */
export type AnimalType = "monkey" | "rabbit" | "cat" | "dog";

/** Whether a bubble is poppable or a sleeping-animal decoy. */
export type BubbleType = "poppable" | "sleeping";

/** All four animal types, in canonical order. */
export const ALL_ANIMALS: readonly AnimalType[] = ["monkey", "rabbit", "cat", "dog"];

/** Number of pops required to win the round. */
export const WIN_TARGET = 6;

/** Number of concurrent bubbles on screen. */
export const CONCURRENT_BUBBLES = 5;

/** Minimum number of sleeping-animal bubbles in the initial spawn. */
export const MIN_SLEEPING = 1;

/** Maximum number of sleeping-animal bubbles in the initial spawn. */
export const MAX_SLEEPING = 2;

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

/** Returns a shuffled copy of the input array using the Fisher-Yates algorithm. */
export function shuffle<T>(array: readonly T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Selects the bubble type for the next spawn, maintaining 1-2 sleeping bubbles. */
export function selectBubbleType(sleepingCount: number): BubbleType {
  if (sleepingCount < MIN_SLEEPING) return "sleeping";
  if (sleepingCount >= MAX_SLEEPING) return "poppable";
  return Math.random() < 0.5 ? "sleeping" : "poppable";
}

/** Randomly selects one of the four sleeping animals. */
export function selectSleepingAnimal(): AnimalType {
  return shuffle(ALL_ANIMALS)[0];
}

/** Generates a randomized spawn config within world bounds.
 *
 *  Position is clamped so the bubble stays fully on-screen. Velocity is
 *  a random direction at a gentle speed suitable for floating motion.
 */
export function generateSpawnConfig(
  worldWidth: number,
  worldHeight: number,
  bubbleSize: number,
  type: BubbleType,
): BubbleConfig {
  const x = bubbleSize + Math.random() * (worldWidth - 2 * bubbleSize);
  const y = bubbleSize + Math.random() * (worldHeight - 2 * bubbleSize);
  const speed = 30 + Math.random() * 50; // 30–80 px/s gentle drift
  const angle = Math.random() * Math.PI * 2;
  const vx = Math.cos(angle) * speed;
  const vy = Math.sin(angle) * speed;
  return {
    type,
    animal: type === "sleeping" ? selectSleepingAnimal() : undefined,
    x,
    y,
    vx,
    vy,
  };
}

/** Generates the initial set of concurrent bubbles (mix of poppable + 1-2 sleeping). */
export function generateInitialBubbles(
  worldWidth: number,
  worldHeight: number,
  bubbleSize: number,
): BubbleConfig[] {
  const bubbles: BubbleConfig[] = [];
  let sleepingCount = 0;
  for (let i = 0; i < CONCURRENT_BUBBLES; i++) {
    const type = selectBubbleType(sleepingCount);
    if (type === "sleeping") sleepingCount++;
    bubbles.push(generateSpawnConfig(worldWidth, worldHeight, bubbleSize, type));
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
