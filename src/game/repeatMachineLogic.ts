/**
 * Pure logic for Repeat Machine (Game 25).
 *
 * The game's promise is that the machine does exactly what the child authors:
 * one move+sound action, repeated N times. So the rules live here, Phaser-free
 * and deterministic, and the scene only draws what these functions return.
 *
 * Three questions are answered here: which six rounds a playthrough serves
 * ({@link ROUND_SPECS}), what one run replays ({@link runProgram}), and how a
 * malformed or repeatedly wrong program is handled ({@link programIssue},
 * {@link nextAttempt}, {@link scoreFor}).
 *
 * Nothing here reads a clock, storage or the DOM. Every random decision flows
 * through the injected `Rng`, so a seeded generator replays a playthrough.
 */

import { type BandId, type BandShift, shiftLadder } from "./adaptiveLogic";
import { type Rng, shuffle } from "./random";

/** One of the mascot's existing moves, each paired with its sound cue. */
export type MoveAction = "wave" | "nod" | "cheer" | "curious";

/** A repeat count: at least two to be a loop, at most four to stay holdable. */
export type TargetCount = 2 | 3 | 4;

/** Every move, in palette order; no new art or sound is introduced. */
export const MOVE_ACTIONS: readonly MoveAction[] = ["wave", "nod", "cheer", "curious"];

/** A loop needs at least two repetitions; one is not a repeat-N program. */
export const MIN_COUNT = 2;

/** The longest repeat count a four-year-old needs to author. */
export const MAX_COUNT = 4;

/** How many rounds a playthrough serves. */
export const ROUND_COUNT = 6;

/** One authored round: the target count is fixed, the action is the child's. */
export interface RoundSpec {
  /** Dots the scene draws and the authored count must match. */
  readonly target: TargetCount;
}

/**
 * The six-round ladder 2, 2, 3, 3, 4, 4. Counting is authored rather than
 * drawn so every session ramps identically; only the action palette is seeded.
 */
export const ROUND_SPECS: readonly RoundSpec[] = [
  { target: 2 },
  { target: 2 },
  { target: 3 },
  { target: 3 },
  { target: 4 },
  { target: 4 },
];

/** One dealt round: the authored target plus the seeded action palette. */
export interface RepeatRound {
  /** Zero-based round index, matching `ROUND_SPECS`. */
  readonly round: number;
  /** Dots the scene draws, 2–4. */
  readonly target: TargetCount;
  /** The moves in a seeded order; the child picks one action from the palette. */
  readonly actions: readonly MoveAction[];
}

/** The child's program: one action and a count, either of which may be unset. */
export interface Program {
  /** The chosen move, or null while no action has been picked. */
  readonly action: MoveAction | null;
  /** The chosen repeat count, or null while no count has been picked. */
  readonly count: number | null;
}

/** A program that can actually be run: both fields are present and in range. */
interface ValidProgram {
  readonly action: MoveAction;
  readonly count: TargetCount;
}

/** What one run of a program did, and whether it won the round. */
export interface RunResult {
  /** False when a malformed program was refused, so Run was blocked safely. */
  readonly valid: boolean;
  /** Why a malformed program was refused, or null when it could run. */
  readonly issue: string | null;
  /** The move replayed on every pair, or null when the program could not run. */
  readonly action: MoveAction | null;
  /** One entry per performed move+sound pair: exactly the authored count. */
  readonly performed: readonly MoveAction[];
  /** Dots the round shows. */
  readonly target: TargetCount;
  /** True when the authored count equals the target. */
  readonly matched: boolean;
  /** One for the first run, incremented by `nextAttempt` on each retry. */
  readonly attempts: number;
  /** True only for a valid program whose count matched the target. */
  readonly won: boolean;
}

/** The band a target count sits at: 2 = easiest, 3 = middle, 4 = hardest. */
const BAND_FOR_COUNT: Readonly<Record<TargetCount, BandId>> = { 2: 1, 3: 2, 4: 3 };

/** The target count a band asks for. */
const COUNT_FOR_BAND: Readonly<Record<BandId, TargetCount>> = { 1: 2, 2: 3, 3: 4 };

/** True when `count` is an authored repeat count in 2–4. */
export function isValidCount(count: number | null): count is TargetCount {
  return count === MIN_COUNT || count === 3 || count === MAX_COUNT;
}

/** The dot count a round shows. */
export function targetDots(round: RoundSpec | RepeatRound): TargetCount {
  return round.target;
}

/** True when both authored fields are present and in range. */
function isAuthorable(program: Program): program is ValidProgram {
  return program.action !== null && isValidCount(program.count);
}

/**
 * Why the program cannot be run, or null when it can. A missing action or a
 * missing/out-of-range count is guidance for the authoring UI, never a throw.
 */
export function programIssue(program: Program): string | null {
  if (program.action === null) {
    return "Pick an action first.";
  }
  if (!isValidCount(program.count)) {
    return "Choose a repeat count from 2 to 4.";
  }
  return null;
}

/**
 * The target after one adaptive band shift. The ladder is shared with the
 * sibling games, so ±1 moves a count one step and never leaves 2–4.
 */
export function shiftedTarget(target: TargetCount, shift: BandShift): TargetCount {
  const [band] = shiftLadder([BAND_FOR_COUNT[target]], shift);
  return COUNT_FOR_BAND[band ?? 1];
}

/** Deals one round: the authored target plus a seeded move palette. */
export function buildRound(
  round: number,
  shift: BandShift = 0,
  rng: Rng = Math.random,
): RepeatRound {
  const spec = ROUND_SPECS[round];
  if (spec === undefined) {
    throw new Error(`no round spec for index: ${round}`);
  }
  return {
    round,
    target: shiftedTarget(spec.target, shift),
    actions: shuffle(MOVE_ACTIONS, rng),
  };
}

/** Deals a whole playthrough from one generator, in ladder order. */
export function buildPlaythrough(
  shift: BandShift = 0,
  rng: Rng = Math.random,
): readonly RepeatRound[] {
  return ROUND_SPECS.map((_, index) => buildRound(index, shift, rng));
}

/**
 * Runs `program` against `round`. A malformed program performs nothing and is
 * refused with guidance; a valid one replays exactly `count` move+sound pairs
 * and wins only when that count equals the target. A wrong count is still
 * replayed in full, so the child can see the mismatch and try again.
 */
export function runProgram(round: RepeatRound, program: Program, attempts = 1): RunResult {
  const issue = programIssue(program);
  if (!isAuthorable(program)) {
    return {
      valid: false,
      issue,
      action: null,
      performed: [],
      target: round.target,
      matched: false,
      attempts,
      won: false,
    };
  }
  const performed = Array.from({ length: program.count }, () => program.action);
  const matched = program.count === round.target;
  return {
    valid: true,
    issue: null,
    action: program.action,
    performed,
    target: round.target,
    matched,
    attempts,
    won: matched,
  };
}

/** The next attempt number after a wrong count; retries never soft-lock. */
export function nextAttempt(attempts: number): number {
  return attempts + 1;
}

/** Points for a run: two first try, one after a retry, none on a loss. */
export function scoreFor(result: RunResult): number {
  if (!result.won) {
    return 0;
  }
  return result.attempts <= 1 ? 2 : 1;
}

/** True when all six rounds of a session have been won. */
export function isSessionComplete(results: readonly RunResult[]): boolean {
  return results.length === ROUND_COUNT && results.every((result) => result.won);
}
