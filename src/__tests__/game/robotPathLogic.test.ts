import { describe, expect, it } from "vitest";
import {
  buildPlaythrough,
  buildRound,
  canPlace,
  type Direction,
  DIRECTIONS,
  firstDeviation,
  ghostPath,
  hintFor,
  isOnBoard,
  isRock,
  isSolved,
  MAX_COMMANDS,
  placeCommand,
  removeFrom,
  type RobotPathRound,
  ROUND_COUNT,
  ROUND_SPECS,
  runProgram,
  samePoint,
  step,
} from "../../game/robotPathLogic";
import { mulberry32 } from "../helpers/randomHelper";

/** A hand-built round with no rocks, used where the route is the assertion. */
function board(start: [number, number], star: [number, number], rocks: [number, number][] = []): RobotPathRound {
  return {
    band: 1,
    start: { col: start[0], row: start[1] },
    star: { col: star[0], row: star[1] },
    rocks: rocks.map(([col, row]) => ({ col, row })),
    solution: [],
  };
}

describe("the board and the four commands", () => {
  it("steps one tile per direction and knows the edges", () => {
    const middle = { col: 1, row: 1 };
    expect(step(middle, "up")).toEqual({ col: 1, row: 0 });
    expect(step(middle, "right")).toEqual({ col: 2, row: 1 });
    expect(step(middle, "down")).toEqual({ col: 1, row: 2 });
    expect(step(middle, "left")).toEqual({ col: 0, row: 1 });

    expect(isOnBoard({ col: 0, row: 0 })).toBe(true);
    expect(isOnBoard({ col: 2, row: 2 })).toBe(true);
    expect(isOnBoard({ col: -1, row: 1 })).toBe(false);
    expect(isOnBoard({ col: 3, row: 1 })).toBe(false);
    expect(isOnBoard({ col: 1, row: 3 })).toBe(false);
    expect(samePoint({ col: 1, row: 2 }, { col: 1, row: 2 })).toBe(true);
    expect(samePoint({ col: 1, row: 2 }, { col: 2, row: 1 })).toBe(false);
    expect(isRock({ col: 0, row: 1 }, [{ col: 0, row: 1 }])).toBe(true);
    expect(isRock({ col: 0, row: 1 }, [{ col: 1, row: 1 }])).toBe(false);
  });

  it("offers four commands in compass order", () => {
    // The palette draws in this order, so it is behaviour, not presentation.
    expect(DIRECTIONS).toEqual(["up", "right", "down", "left"]);
  });
});

describe("running a program", () => {
  const cross = board([0, 2], [2, 0]);

  it("walks the documented tiles and arrives", () => {
    const result = runProgram(cross, ["up", "right", "up", "right"]);
    expect(result.visited).toEqual([
      { col: 0, row: 2 },
      { col: 0, row: 1 },
      { col: 1, row: 1 },
      { col: 1, row: 0 },
      { col: 2, row: 0 },
    ]);
    expect(result.final).toEqual({ col: 2, row: 0 });
    expect(result.reachedStar).toBe(true);
    expect(result.refusedAt).toBeNull();
    expect(isSolved(cross, ["up", "right", "up", "right"])).toBe(true);
  });

  it("stops at the star and never runs the leftovers", () => {
    const result = runProgram(cross, ["up", "right", "up", "right", "down"]);
    expect(result.visited).toHaveLength(5);
    expect(result.reachedStar).toBe(true);
    expect(result.final).toEqual({ col: 2, row: 0 });
  });

  it("reports a refused step instead of throwing", () => {
    const offBoard = runProgram(cross, ["left", "up"]);
    expect(offBoard.refusedAt).toBe(0);
    expect(offBoard.final).toEqual({ col: 0, row: 2 });
    expect(offBoard.visited).toEqual([{ col: 0, row: 2 }]);

    const blocked = runProgram(board([0, 2], [2, 0], [[0, 1]]), ["up"]);
    expect(blocked.refusedAt).toBe(0);
    expect(blocked.reachedStar).toBe(false);
  });

  it("draws a ghost trail identical to the route it would take", () => {
    const commands = ["up", "right", "up"] as const;
    expect(ghostPath(cross, commands)).toEqual(runProgram(cross, commands).visited);
    expect(ghostPath(cross, ["up", "right", "up", "right", "down"])).toHaveLength(5);
    expect(ghostPath(cross, [])).toEqual([{ col: 0, row: 2 }]);
  });
});

describe("placing and removing commands", () => {
  const cross = board([0, 2], [2, 0]);

  it("refuses a step off the board or into a rock", () => {
    expect(canPlace(cross, [], "left")).toBe(false);
    expect(canPlace(cross, [], "up")).toBe(true);
    const blocked = board([0, 2], [2, 0], [[0, 1]]);
    expect(canPlace(blocked, [], "up")).toBe(false);
    expect(canPlace(blocked, [], "right")).toBe(true);
  });

  it("closes the strip at six commands", () => {
    const cap = board([0, 2], [2, 2]);
    let commands: Direction[] = [];
    for (const direction of ["up", "right", "up", "right", "down"] as const) {
      commands = placeCommand(cap, commands, direction);
    }
    // Five commands, none on the star yet: one more is allowed, the next is not.
    expect(commands).toHaveLength(5);
    const six = placeCommand(cap, commands, "up");
    expect(six).toHaveLength(MAX_COMMANDS);
    expect(canPlace(cap, six, "right")).toBe(false);
  });

  it("closes the strip once the program reaches the star", () => {
    const commands = ["up", "right", "up", "right"] as const;
    expect(isSolved(cross, commands)).toBe(true);
    expect(canPlace(cross, commands, "down")).toBe(false);
    expect(firstDeviation(commands, commands)).toBeNull();
  });

  it("returns a new array and keeps the old one intact", () => {
    const commands = ["up"];
    const placed = placeCommand(cross, commands, "right");
    expect(placed).toEqual(["up", "right"]);
    expect(commands).toEqual(["up"]);

    const refused = placeCommand(cross, commands, "left");
    expect(refused).toEqual(["up"]);
    expect(refused).not.toBe(commands);
  });

  it("removes a command and every command after it", () => {
    const commands = ["up", "right", "up", "right"];
    expect(removeFrom(commands, 2)).toEqual(["up", "right"]);
    expect(removeFrom(commands, 0)).toEqual([]);
    // Out-of-range taps leave the program alone rather than emptying it.
    expect(removeFrom(commands, 9)).toEqual(commands);
    expect(removeFrom(commands, -1)).toEqual(commands);

    expect(ghostPath(cross, removeFrom(commands, 2))).toHaveLength(3);
  });
});

describe("the repair cues", () => {
  const cross: RobotPathRound = {
    ...board([0, 2], [2, 0]),
    solution: ["up", "right", "up", "right"],
  };

  it("names the first command that leaves the route", () => {
    expect(firstDeviation(["up", "left"], cross.solution)).toBe(1);
    // A program that stops early blames the missing command, not a placed one.
    expect(firstDeviation(["up", "right"], cross.solution)).toBe(2);
    expect(firstDeviation(["up", "right", "up", "right"], cross.solution)).toBeNull();
    expect(firstDeviation([], cross.solution)).toBe(0);
  });

  it("offers the first solution command only from the second stopped run", () => {
    expect(hintFor(cross, 0)).toBeNull();
    expect(hintFor(cross, 1)).toBeNull();
    expect(hintFor(cross, 2)).toBe("up");
    expect(hintFor(cross, 5)).toBe("up");
    expect(hintFor({ ...cross, solution: [] }, 2)).toBeNull();
  });
});

describe("the six-round ladder", () => {
  const seeded = () => mulberry32(20261115);

  it("serves six rounds in easy-first band order", () => {
    const rounds = buildPlaythrough(seeded());
    expect(rounds).toHaveLength(ROUND_COUNT);
    expect(ROUND_COUNT).toBe(6);
    expect(rounds.map((round) => round.band)).toEqual([1, 1, 2, 2, 3, 3]);
  });

  it("keeps every round inside its own step range and rock count", () => {
    for (let seed = 1; seed <= 40; seed++) {
      const rounds = buildPlaythrough(mulberry32(seed));
      rounds.forEach((round, index) => {
        const spec = ROUND_SPECS[index];
        expect(round.solution.length).toBeGreaterThanOrEqual(spec.minSteps);
        expect(round.solution.length).toBeLessThanOrEqual(spec.maxSteps);
        expect(round.solution.length).toBeLessThanOrEqual(MAX_COMMANDS);
        expect(round.rocks).toHaveLength(spec.rocks);
      });
    }
  });

  it("starts on the bottom row and never parks the star under the robot", () => {
    for (let seed = 1; seed <= 20; seed++) {
      for (const round of buildPlaythrough(mulberry32(seed))) {
        expect(round.start.row).toBe(2);
        expect(round.start.col).toBeGreaterThanOrEqual(0);
        expect(round.start.col).toBeLessThan(3);
        expect(samePoint(round.start, round.star)).toBe(false);
        expect(isOnBoard(round.star)).toBe(true);
        expect(isRock(round.star, round.rocks)).toBe(false);
      }
    }
  });

  it("builds every round from a walk, so its solution is playable", () => {
    for (let seed = 1; seed <= 20; seed++) {
      for (const round of buildPlaythrough(mulberry32(seed))) {
        let commands: Direction[] = [];
        for (const direction of round.solution) {
          expect(canPlace(round, commands, direction)).toBe(true);
          commands = placeCommand(round, commands, direction);
        }
        expect(commands).toEqual([...round.solution]);
        expect(isSolved(round, commands)).toBe(true);
        expect(canPlace(round, commands, round.solution[0])).toBe(false);
      }
    }
  });

  it("keeps rocks off the route", () => {
    for (let seed = 1; seed <= 40; seed++) {
      for (const round of buildPlaythrough(mulberry32(seed))) {
        const { visited } = runProgram(round, round.solution);
        for (const rock of round.rocks) {
          expect(visited.some((tile) => samePoint(tile, rock))).toBe(false);
        }
      }
    }
  });

  it("replays the same rounds for the same seed and differs across seeds", () => {
    const a = buildPlaythrough(mulberry32(7));
    const b = buildPlaythrough(mulberry32(7));
    const c = buildPlaythrough(mulberry32(8));
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
  });

  it("still returns legal rounds when the generator is degenerate", () => {
    for (const value of [0, 0.999999]) {
      const rounds = buildPlaythrough(() => value);
      expect(rounds).toHaveLength(6);
      for (const round of rounds) {
        expect(isSolved(round, round.solution)).toBe(true);
      }
    }
  });

  it("draws a rock-detour round with the rock beside the route", () => {
    // FR-2: the last two rungs carry a rock, and it must be off the route.
    const rounds = buildPlaythrough(mulberry32(3));
    for (const round of rounds.slice(4)) {
      expect(round.rocks).toHaveLength(1);
      expect(round.band).toBe(3);
    }
  });

  it("builds a single round for a spec without the ladder around it", () => {
    const round = buildRound(ROUND_SPECS[0], mulberry32(11));
    expect(round.band).toBe(1);
    expect(round.solution.length).toBeGreaterThanOrEqual(2);
    expect(round.solution.length).toBeLessThanOrEqual(3);
    expect(round.rocks).toEqual([]);
  });
});
