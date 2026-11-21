/**
 * Phase 3 no-repeat proof: every game's playthrough draw is unique across the
 * whole session, for degenerate and varied seeds and for every adaptive band.
 * The rules themselves are untouched; these tests only pin the guarantee the
 * expanded pools must keep.
 */

import { drawScenarios, EMOTIONS } from "../../game/feelingsFacesLogic";
import { generatePlaythrough, poolFor } from "../../game/shapeSorterLogic";
import { buildPlaythrough } from "../../game/storyOrderLogic";
import { generateWordBuildPlaythrough, generateWordPlaythrough } from "../../game/wordLogic";
import { mulberry32 } from "../helpers/randomHelper";

const SHIFTS = [-1, 0, 1] as const;

// Seeds that used to expose degenerate shuffle behaviour (0, 1, boundaries),
// plus a deterministic LCG sweep standing in for random play sessions.
const DEGENERATE_SEEDS = [0, 1, 2, 0x7fffffff, 0xffffffff];
const RANDOM_SEEDS: number[] = [];
let sweep = 0x9e3779b9;
for (let i = 0; i < 128; i++) {
  sweep = (Math.imul(sweep, 1664525) + 1013904223) >>> 0;
  RANDOM_SEEDS.push(sweep);
}
const SEEDS = [...DEGENERATE_SEEDS, ...RANDOM_SEEDS];

function expectUnique(label: string, values: readonly (string | number)[], count: number): void {
  expect(values, `${label}: expected ${count} draws`).toHaveLength(count);
  expect(new Set(values).size, `${label}: repeated item`).toBe(values.length);
}

describe("no-repeat scheduling across seeded degenerate and random sessions", () => {
  it("draws each Decode/Word target at most once per playthrough", () => {
    for (const shift of SHIFTS) {
      for (const seed of SEEDS) {
        const rng = mulberry32(seed);
        const targets = generateWordPlaythrough(6, shift, rng).map((round) => round.target);
        expectUnique(`word playthrough seed=${seed} shift=${shift}`, targets, 6);

        // A near-pool-sized session must still never repeat a word.
        const long = generateWordPlaythrough(50, shift, rng).map((round) => round.target);
        expectUnique(`word long playthrough seed=${seed} shift=${shift}`, long, 50);
      }
    }
  });

  it("draws each Build-the-Word entry at most once per playthrough", () => {
    for (const shift of SHIFTS) {
      for (const seed of SEEDS) {
        const rng = mulberry32(seed);
        const words = generateWordBuildPlaythrough(3, shift, rng).map((word) => word.word);
        expectUnique(`word build seed=${seed} shift=${shift}`, words, 3);

        const long = generateWordBuildPlaythrough(30, shift, rng).map((word) => word.word);
        expectUnique(`word build long seed=${seed} shift=${shift}`, long, 30);
      }
    }
  });

  it("draws each Shape Sorter shape at most once per playthrough", () => {
    for (const shift of SHIFTS) {
      const bandSize = poolFor(shift).length;
      for (const seed of SEEDS) {
        const rng = mulberry32(seed);
        // A full-band session (3 shapes × roundCount) exhausts the pool once.
        // The easy band holds only 12 shapes, so cap the short session there.
        const fullRounds = Math.floor(bandSize / 3);
        for (const roundCount of new Set([Math.min(6, fullRounds), fullRounds])) {
          const shapes = generatePlaythrough(roundCount, shift, rng).flat();
          expectUnique(
            `shape playthrough seed=${seed} shift=${shift} rounds=${roundCount}`,
            shapes,
            roundCount * 3,
          );
        }
      }
    }
  });

  it("draws each Story Order story at most once per playthrough", () => {
    for (const shift of SHIFTS) {
      for (const seed of SEEDS) {
        const rounds = buildPlaythrough(mulberry32(seed), shift);
        const ids = rounds.map((round) => round.storyId);
        expectUnique(`story playthrough seed=${seed} shift=${shift}`, ids, 6);
        // The three panels of one story are a permutation, never a repeat.
        for (const round of rounds) {
          expect(new Set(round.shuffled).size, `repeated panel in ${round.storyId}`).toBe(3);
        }
      }
    }
  });

  it("draws each Feelings & Faces scenario at most once per playthrough", () => {
    for (const seed of SEEDS) {
      const drawn = drawScenarios(mulberry32(seed));
      expectUnique(
        `scenario playthrough seed=${seed}`,
        drawn.map((s) => s.id),
        6,
      );
      const emotions = new Set(drawn.map((s) => s.emotion));
      for (const emotion of EMOTIONS) {
        expect(emotions.has(emotion), `seed=${seed} missing ${emotion}`).toBe(true);
      }
    }
  });
});
