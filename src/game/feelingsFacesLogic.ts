/**
 * Pure logic for Feelings Faces (Game 21).
 *
 * Owns the scenario pool, the per-playthrough draw, the easy-first contrast
 * ladder, and round scoring. No Phaser, DOM, storage, or timers live here;
 * every random decision is injectable so the scene and the tests stay
 * deterministic.
 */

/** The four emotions Aby can show. */
export type Emotion = "happy" | "sad" | "angry" | "scared";

/** The four emotions, in display order. */
export const EMOTIONS: readonly Emotion[] = ["happy", "sad", "angry", "scared"];

/** One spoken everyday situation that points at a single emotion. */
export interface Scenario {
  /** Stable id, used to prove a playthrough never repeats a scenario. */
  id: string;
  /** The emotion the situation should evoke. */
  emotion: Emotion;
  /** The spoken one-liner, at most 60 characters. */
  text: string;
}

/**
 * The 16-entry scenario pool: four situations per emotion. Every entry is a
 * gentle, everyday, resolvable moment — thunder, a loud vacuum, a dropped ice
 * cream, a friend taking a toy — with no injury, loss, or violence.
 */
export const SCENARIO_POOL: readonly Scenario[] = [
  { id: "happy-ladybug", emotion: "happy", text: "Aby finds a ladybug on a leaf." },
  { id: "happy-hug", emotion: "happy", text: "Aby's friend gives a big hug." },
  { id: "happy-sticker", emotion: "happy", text: "Aby gets a sticker for helping." },
  { id: "happy-truck", emotion: "happy", text: "Aby hears the ice cream truck coming." },
  { id: "sad-blocks", emotion: "sad", text: "Aby's block tower falls down." },
  { id: "sad-ice-cream", emotion: "sad", text: "Aby drops the ice cream cone." },
  { id: "sad-boat", emotion: "sad", text: "Aby's paper boat sinks in the puddle." },
  { id: "sad-home", emotion: "sad", text: "Aby has to stop playing to go home." },
  { id: "angry-toy", emotion: "angry", text: "Aby's friend takes the toy Aby had." },
  { id: "angry-crayon", emotion: "angry", text: "Aby's little brother grabs the crayon." },
  { id: "angry-turn", emotion: "angry", text: "Aby has to wait a long turn." },
  { id: "angry-line", emotion: "angry", text: "Someone cuts in front of Aby in line." },
  { id: "scared-thunder", emotion: "scared", text: "Thunder booms during the bedtime story." },
  { id: "scared-vacuum", emotion: "scared", text: "The vacuum roars in the next room." },
  { id: "scared-hallway", emotion: "scared", text: "The hallway is dark at bedtime." },
  { id: "scared-dog", emotion: "scared", text: "A big dog barks behind the fence." },
];

/** How many rounds one playthrough presents. */
export const ROUND_COUNT = 6;

/** Returns a shuffled copy of `items` using the injected RNG (Fisher-Yates). */
function shuffleWith<T>(items: readonly T[], rng: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Draws one playthrough of six scenarios: one per emotion first, so all four
 * emotions always appear, then two more from the unused pool, then shuffles
 * the six into presentation order. No scenario repeats within a run.
 *
 * `rng` must return a number in [0, 1); tests pass a seeded generator so a
 * draw is reproducible.
 */
export function drawScenarios(rng: () => number = Math.random): Scenario[] {
  const guaranteed = EMOTIONS.map((emotion) => {
    const scenarios = SCENARIO_POOL.filter((scenario) => scenario.emotion === emotion);
    return shuffleWith(scenarios, rng)[0];
  });
  const drawnIds = new Set(guaranteed.map((scenario) => scenario.id));
  const extras = shuffleWith(
    SCENARIO_POOL.filter((scenario) => !drawnIds.has(scenario.id)),
    rng,
  ).slice(0, ROUND_COUNT - EMOTIONS.length);
  return shuffleWith([...guaranteed, ...extras], rng);
}
