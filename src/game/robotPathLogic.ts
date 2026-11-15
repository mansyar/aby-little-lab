/**
 * Pure logic for Robot Path (Game 23).
 *
 * The game's whole promise is that the robot does exactly what the strip says:
 * so the rules of the board live here, Phaser-free and deterministic, and the
 * scene only draws what these functions return. Three questions are answered
 * here — where a program goes ({@link runProgram}), whether a command may be
 * added at all ({@link canPlace}), and which six rounds a playthrough serves
 * ({@link buildPlaythrough}) — plus the two repair cues the scene shows after a
 * stopped run ({@link firstDeviation}, {@link hintFor}).
 *
 * Nothing here reads a clock, storage or the DOM. Every random draw flows
 * through the injected `Rng`, so a seeded generator replays a playthrough.
 */

import type { Rng } from "./random";

/** One of the four absolute directions a command can send the robot. */
export type Direction = "up" | "right" | "down" | "left";

/** A tile on the board: `col` 0 is the left edge, `row` 0 the top edge. */
export interface GridPoint {
  readonly col: number;
  readonly row: number;
}

/** The board is square; three tiles a side is what fits a 768-high canvas. */
export const GRID_SIZE = 3;

/** How many commands the strip holds — enough for the hardest round (six). */
export const MAX_COMMANDS = 6;

/** Palette order: up, right, down, left, so the cluster reads like a compass. */
export const DIRECTIONS: readonly Direction[] = ["up", "right", "down", "left"];

/** The tile delta one step in `direction` produces. */
export const DIRECTION_DELTA: Readonly<Record<Direction, GridPoint>> = {
  up: { col: 0, row: -1 },
  right: { col: 1, row: 0 },
  down: { col: 0, row: 1 },
  left: { col: -1, row: 0 },
};

/** One generated round: where the robot starts, where it must end, and the route. */
export interface RobotPathRound {
  /** Difficulty band the round was drawn for, for tests and evidence only. */
  readonly band: 1 | 2 | 3;
  /** The tile the robot stands on before the first command. */
  readonly start: GridPoint;
  /** The tile holding the star. */
  readonly star: GridPoint;
  /** Tiles the program may never enter. Empty in the first four rounds. */
  readonly rocks: readonly GridPoint[];
  /**
   * The intended route. Every round is built from a walk, so a solution of
   * exactly this many commands always exists; it is not necessarily unique.
   */
  readonly solution: readonly Direction[];
}

/** What a program did, whether it arrived or not. */
export interface ProgramResult {
  /** Every tile the robot stood on, starting tile first. */
  readonly visited: readonly GridPoint[];
  /** The tile the robot ended on. */
  readonly final: GridPoint;
  /** True when the route touched the star, which ends the run immediately. */
  readonly reachedStar: boolean;
  /**
   * Index of the first command the board refused, or null when every command
   * ran. The strip cannot hold a refused command, so this only reports a
   * program assembled elsewhere — a journey, or a future edit path.
   */
  readonly refusedAt: number | null;
}

/** The tile one step from `point` in `direction`; may be off the board. */
export function step(point: GridPoint, direction: Direction): GridPoint {
  const delta = DIRECTION_DELTA[direction];
  return { col: point.col + delta.col, row: point.row + delta.row };
}

/** True when both points name the same tile. */
export function samePoint(a: GridPoint, b: GridPoint): boolean {
  return a.col === b.col && a.row === b.row;
}

/** True when the point is inside the GRID_SIZE × GRID_SIZE board. */
export function isOnBoard(point: GridPoint): boolean {
  return point.col >= 0 && point.col < GRID_SIZE && point.row >= 0 && point.row < GRID_SIZE;
}

/** True when `point` is one of `rocks`. */
export function isRock(point: GridPoint, rocks: readonly GridPoint[]): boolean {
  return rocks.some((rock) => samePoint(rock, point));
}

/**
 * Runs `commands` from the round's start.
 *
 * A command that would leave the board or enter a rock is refused and the walk
 * stops there; touching the star stops it too, because the round is over and
 * any remaining commands are never executed (spec FR-8). `visited` always holds
 * the start tile first, so the scene can draw the ghost trail from it.
 */
export function runProgram(round: RobotPathRound, commands: readonly Direction[]): ProgramResult {
  const visited: GridPoint[] = [round.start];
  let current = round.start;

  for (const [index, command] of commands.entries()) {
    const next = step(current, command);
    if (!isOnBoard(next) || isRock(next, round.rocks)) {
      return { visited, final: current, reachedStar: false, refusedAt: index };
    }
    visited.push(next);
    current = next;
    if (samePoint(next, round.star)) {
      return { visited, final: current, reachedStar: true, refusedAt: null };
    }
  }

  return { visited, final: current, reachedStar: false, refusedAt: null };
}

/**
 * The tiles the dotted trail covers for the current program: exactly the tiles a
 * run would visit. Presentation only — nothing moves until Go is pressed
 * (spec FR-6).
 */
export function ghostPath(
  round: RobotPathRound,
  commands: readonly Direction[],
): readonly GridPoint[] {
  return runProgram(round, commands).visited;
}

/**
 * Whether `direction` may be appended to `commands`.
 *
 * Three refusals, in the order they matter to a child: the strip is full, the
 * step would leave the board, the step would enter a rock. A fourth, quieter
 * one: once the program already reaches the star there is nothing left to add,
 * so the strip closes rather than collecting commands that never run.
 */
export function canPlace(
  round: RobotPathRound,
  commands: readonly Direction[],
  direction: Direction,
): boolean {
  if (commands.length >= MAX_COMMANDS) return false;
  const current = runProgram(round, commands);
  if (current.reachedStar || current.refusedAt !== null) return false;
  const next = step(current.final, direction);
  return isOnBoard(next) && !isRock(next, round.rocks);
}

/**
 * Appends `direction` when {@link canPlace} allows it.
 *
 * Returns a new array either way, so a caller can assign unconditionally; the
 * input is never mutated and a refused command leaves the program unchanged.
 */
export function placeCommand(
  round: RobotPathRound,
  commands: readonly Direction[],
  direction: Direction,
): Direction[] {
  return canPlace(round, commands, direction) ? [...commands, direction] : [...commands];
}

/**
 * Removes the command at `index` and everything after it.
 *
 * A program is a prefix, never a sequence with a hole in it (spec FR-5), so
 * tapping slot 2 of a four-command strip leaves two commands.
 */
export function removeFrom(commands: readonly Direction[], index: number): Direction[] {
  if (!Number.isInteger(index) || index < 0 || index >= commands.length) {
    return [...commands];
  }
  return commands.slice(0, index);
}

/**
 * The index of the command that first leaves the route the round intends, or
 * null when the program is a prefix of it or equals it.
 *
 * A program that stops early reports its own length: the missing command is the
 * one the scene should pulse, and there is no placed command to blame.
 */
export function firstDeviation(
  commands: readonly Direction[],
  solution: readonly Direction[],
): number | null {
  const shared = Math.min(commands.length, solution.length);
  for (let index = 0; index < shared; index++) {
    if (commands[index] !== solution[index]) return index;
  }
  if (commands.length < solution.length) return commands.length;
  return null;
}

/** True when `commands` reaches the star. */
export function isSolved(round: RobotPathRound, commands: readonly Direction[]): boolean {
  return runProgram(round, commands).reachedStar;
}

/**
 * The hint a stopped round offers: its first solution command, and only from the
 * second stopped run onwards (spec FR-10).
 *
 * The scene pulses this arrow in the palette rather than placing it, so the
 * child keeps authorship of the program; a single stopped run is treated as
 * exploration, not as being stuck.
 */
export function hintFor(round: RobotPathRound, stoppedRuns: number): Direction | null {
  if (stoppedRuns < 2) return null;
  return round.solution[0] ?? null;
}

/** One rung of the easy-first ladder (spec D5). */
export interface RoundSpec {
  readonly band: 1 | 2 | 3;
  /** Fewest commands the round's route uses, inclusive. */
  readonly minSteps: number;
  /** Most commands the round's route uses, inclusive — never above MAX_COMMANDS. */
  readonly maxSteps: number;
  /** How many rocks the board carries. */
  readonly rocks: number;
}

/**
 * The six rungs, easiest first: two straight runs, two with one corner, one
 * rock detour, one with two corners. Read by position — the scene's progress
 * dots and this table must agree, which the tests assert.
 */
export const ROUND_SPECS: readonly RoundSpec[] = [
  { band: 1, minSteps: 2, maxSteps: 3, rocks: 0 },
  { band: 1, minSteps: 2, maxSteps: 3, rocks: 0 },
  { band: 2, minSteps: 3, maxSteps: 4, rocks: 0 },
  { band: 2, minSteps: 3, maxSteps: 4, rocks: 0 },
  { band: 3, minSteps: 4, maxSteps: 5, rocks: 1 },
  { band: 3, minSteps: 5, maxSteps: 6, rocks: 1 },
];

/** Rounds in one playthrough, derived so the table stays the single source. */
export const ROUND_COUNT = ROUND_SPECS.length;

/** Every tile on the board, row by row. */
const ALL_TILES: readonly GridPoint[] = Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => ({
  col: i % GRID_SIZE,
  row: Math.floor(i / GRID_SIZE),
}));

/** Picks one element of a non-empty list. */
function pick<T>(items: readonly T[], rng: Rng): T {
  return items[Math.floor(rng() * items.length)];
}

/** A tiny deterministic generator, used only when a draw cannot be satisfied. */
function fallbackRng(): Rng {
  let seed = 0x9e37;
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0x100000000;
  };
}

/**
 * Walks a route of exactly `steps` moves from `start`, never revisiting a tile.
 *
 * Distinct tiles keep the trail readable and make the rock placement easy: a
 * rock may sit on any tile the route does not use. Returns null when the walk
 * paints itself into a corner, and the caller retries.
 */
function walkRoute(
  start: GridPoint,
  steps: number,
  rng: Rng,
): { visited: GridPoint[]; commands: Direction[] } | null {
  const visited: GridPoint[] = [start];
  const commands: Direction[] = [];
  let current = start;

  while (commands.length < steps) {
    const options = DIRECTIONS.filter((direction) => {
      const next = step(current, direction);
      return isOnBoard(next) && !visited.some((tile) => samePoint(tile, next));
    });
    if (options.length === 0) return null;
    const direction = pick(options, rng);
    commands.push(direction);
    current = step(current, direction);
    visited.push(current);
  }

  return { visited, commands };
}

/**
 * Builds one round for `spec`: a route of the band's length from a bottom-row
 * tile, the star on its last tile, and the band's rocks on unused tiles.
 *
 * Retries a bounded number of times, then finishes with a deterministic
 * generator so a pathological `Rng` still yields a legal round. Every route is
 * built from a walk, so `solution` is always playable.
 */
export function buildRound(spec: RoundSpec, rng: Rng = Math.random): RobotPathRound {
  for (let attempt = 0; attempt < 40; attempt++) {
    const span = spec.maxSteps - spec.minSteps + 1;
    const steps = spec.minSteps + Math.floor(rng() * span);
    const start: GridPoint = { col: Math.floor(rng() * GRID_SIZE), row: GRID_SIZE - 1 };
    const route = walkRoute(start, steps, rng);
    if (route === null) continue;

    const star = route.visited[route.visited.length - 1];
    const free = ALL_TILES.filter((tile) => !route.visited.some((tile2) => samePoint(tile, tile2)));
    if (free.length < spec.rocks) continue;

    const rocks: GridPoint[] = [];
    const pool = [...free];
    while (rocks.length < spec.rocks) {
      const index = Math.floor(rng() * pool.length);
      rocks.push(pool[index]);
      pool.splice(index, 1);
    }

    return { band: spec.band, start, star, rocks, solution: route.commands };
  }

  return buildRound(spec, fallbackRng());
}

/**
 * The six rounds of one playthrough, in ladder order.
 *
 * Each rung draws its own route, so two visits differ while the difficulty of
 * each position is fixed (spec D5). No adaptive shift is applied: this game has
 * no per-tap right or wrong for the adaptive system to read (spec D6).
 */
export function buildPlaythrough(rng: Rng = Math.random): RobotPathRound[] {
  return ROUND_SPECS.map((spec) => buildRound(spec, rng));
}
