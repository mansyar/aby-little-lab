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

/** Whether a round contrasts distinct or deliberately confusable expressions. */
export type ContrastKind = "distinct" | "confusable";

/** One rung of the easy-first contrast ladder. */
export interface RoundContrast {
  /** The two emotions the round is designed to contrast. */
  pair: readonly [Emotion, Emotion];
  /** Third card used when the target is one of the pair. */
  third: Emotion;
  /** Which contrast family this rung belongs to. */
  kind: ContrastKind;
}

/** Rounds 1–3: happy vs angry, the most distinct pair of the four. */
const DISTINCT_ROUND: RoundContrast = { pair: ["happy", "angry"], third: "sad", kind: "distinct" };

/** Rounds 4–6: sad vs scared, both drawn with downturned features. */
const CONFUSABLE_ROUND: RoundContrast = {
  pair: ["sad", "scared"],
  third: "happy",
  kind: "confusable",
};

/**
 * The fixed easy-first ladder. Indexes 0–2 contrast the maximally distinct
 * happy/angry pair; indexes 3–5 contrast the easily confused sad/scared pair.
 */
export const ROUND_CONTRASTS: readonly RoundContrast[] = [
  DISTINCT_ROUND,
  DISTINCT_ROUND,
  DISTINCT_ROUND,
  CONFUSABLE_ROUND,
  CONFUSABLE_ROUND,
  CONFUSABLE_ROUND,
];

/**
 * Builds the three emotion cards for one round. Both emotions of the round's
 * contrast pair always appear; the third card is the target itself, or — when
 * the target is already in the pair — the ladder's designated extra. The
 * result is always three distinct emotions that include the target.
 */
export function buildRoundChoices(roundIndex: number, target: Emotion): Emotion[] {
  const contrast = ROUND_CONTRASTS[roundIndex];
  const cards: Emotion[] = [...contrast.pair];
  cards.push(cards.includes(target) ? contrast.third : target);
  return cards;
}

/** The state of one round: the scenario, the cards, and the taps so far. */
export interface RoundState {
  /** Zero-based round index, 0–5. */
  index: number;
  /** The scenario spoken this round. */
  scenario: Scenario;
  /** The three cards on screen; exactly one matches the scenario's emotion. */
  choices: Emotion[];
  /** Taps already recorded on this round, correct and wrong combined. */
  taps: number;
}

/** The outcome of one tap on a round. */
export interface AnswerResult {
  /** True when the tapped emotion matches the scenario's emotion. */
  correct: boolean;
  /** Round to show next: unchanged on a wrong tap, `index + 1` on a correct one. */
  nextRound: number;
  /** Taps recorded on this round after this answer, correct and wrong combined. */
  taps: number;
}

/**
 * Scores one tap. A correct tap advances the playthrough — `nextRound` is the
 * following index, and `ROUND_COUNT` means the playthrough is complete. A wrong
 * tap leaves `nextRound` at the current index, so the child stays on the same
 * round and can try again. The round state itself is never mutated.
 */
export function answer(round: RoundState, emotion: Emotion): AnswerResult {
  const correct = emotion === round.scenario.emotion;
  return {
    correct,
    nextRound: correct ? round.index + 1 : round.index,
    taps: round.taps + 1,
  };
}
