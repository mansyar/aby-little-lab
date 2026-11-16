/**
 * Pure logic for Fix-It Machine (Game 24).
 *
 * The game's promise is that the machine does exactly what the tape says: one
 * card is wrong, the child finds it, and the tape is repaired without losing
 * anything. So the workshop's rules live here, Phaser-free and deterministic,
 * and the scene only draws what these functions return.
 *
 * Three questions are answered here: which six rounds a playthrough serves
 * ({@link ROUND_SPECS}), which tape and repair tray a round deals
 * ({@link buildRound}), and what a tap means ({@link isWrongCard},
 * {@link applyRepair}, {@link isSolved}, {@link hintLevelFor}).
 *
 * Every random decision flows through the injected `Rng`, so a seeded
 * generator replays a playthrough exactly.
 */

import { type Rng, shuffle } from "./random";

/** One of the six tools a card can show. */
export type ActionIcon = "spray" | "pour" | "paint" | "polish" | "lift" | "stack";

/**
 * A tool's family. Each family holds exactly two tools that a child could
 * plausibly reach for on the same job, which is what makes the hardest
 * distractor confusing without making it unfair.
 */
export type ActionFamily = "liquid" | "coat" | "move";

/** Every tool, in palette order: one row per family. */
export const ACTION_ICONS: readonly ActionIcon[] = [
  "spray",
  "pour",
  "paint",
  "polish",
  "lift",
  "stack",
];

/** Which family each tool belongs to. */
export const ACTION_FAMILY: Readonly<Record<ActionIcon, ActionFamily>> = {
  spray: "liquid",
  pour: "liquid",
  paint: "coat",
  polish: "coat",
  lift: "move",
  stack: "move",
};

/** The two tools of each family, in the order the palette draws them. */
export const ACTIONS_BY_FAMILY: Readonly<Record<ActionFamily, readonly [ActionIcon, ActionIcon]>> =
  {
    liquid: ["spray", "pour"],
    coat: ["paint", "polish"],
    move: ["lift", "stack"],
  };

/** How hard the round's wrong tool is to tell from the right one. */
export type SimilarityBand = "different" | "related" | "same-family";

/** The six toys the workshop repairs, one per round. */
export type ToyId = "teddy" | "car" | "duck" | "drum" | "robot" | "blocks";

/** Every toy, in round order. */
export const TOYS: readonly ToyId[] = ["teddy", "car", "duck", "drum", "robot", "blocks"];

/** Cards on the tape in the hardest round; the tape never grows past this. */
export const MAX_CARDS = 5;

/** How many rounds a playthrough serves. */
export const ROUND_COUNT = 6;

/** One authored round: the job, the correct tape, the one wrong card. */
export interface RoundSpec {
  /** The toy this round repairs. */
  readonly toy: ToyId;
  /** The correct program, in order. Every tool in it is distinct. */
  readonly program: readonly ActionIcon[];
  /** Which card is wrong. Never the first, so a correct step always plays. */
  readonly bugIndex: number;
  /** The wrong tool that sits at `bugIndex` on the tape. */
  readonly wrongAction: ActionIcon;
  /** How closely `wrongAction` resembles the tool it replaced. */
  readonly band: SimilarityBand;
}

/**
 * The six-round ladder: cards 3, 3, 4, 4, 5, 5 and bands foreign, foreign,
 * related, related, sibling, sibling. The data is authored rather than drawn so
 * every round is a plausible job with exactly one silly result; the seeded
 * generator below only deals the repair tray.
 */
export const ROUND_SPECS: readonly RoundSpec[] = [
  {
    toy: "teddy",
    program: ["lift", "spray", "stack"],
    bugIndex: 1,
    wrongAction: "paint",
    band: "different",
  },
  {
    toy: "car",
    program: ["lift", "paint", "polish"],
    bugIndex: 2,
    wrongAction: "pour",
    band: "different",
  },
  {
    toy: "duck",
    program: ["lift", "spray", "polish", "stack"],
    bugIndex: 2,
    wrongAction: "pour",
    band: "related",
  },
  {
    toy: "drum",
    program: ["lift", "paint", "spray", "stack"],
    bugIndex: 1,
    wrongAction: "pour",
    band: "related",
  },
  {
    toy: "robot",
    program: ["lift", "spray", "pour", "paint", "stack"],
    bugIndex: 3,
    wrongAction: "polish",
    band: "same-family",
  },
  {
    toy: "blocks",
    program: ["spray", "pour", "paint", "polish", "stack"],
    bugIndex: 4,
    wrongAction: "lift",
    band: "same-family",
  },
];

/** One dealt round: the authored job plus the tape and tray the child sees. */
export interface FixItRound {
  /** Zero-based round index, matching `ROUND_SPECS`. */
  readonly round: number;
  /** The toy the wish bubble shows. */
  readonly toy: ToyId;
  /** The correct program, in order. */
  readonly program: readonly ActionIcon[];
  /** What is on the tape: `program`, with `wrongAction` at `bugIndex`. */
  readonly tape: readonly ActionIcon[];
  /** Which card is wrong. */
  readonly bugIndex: number;
  /** The tool sitting on the wrong card. */
  readonly wrongAction: ActionIcon;
  /** How closely the wrong tool resembles the right one. */
  readonly band: SimilarityBand;
  /** Three tap targets, exactly one of which is the right tool, seeded order. */
  readonly candidates: readonly ActionIcon[];
}

/** The tool of the same family as `action`. */
export function familyPartner(action: ActionIcon): ActionIcon {
  const [first, second] = ACTIONS_BY_FAMILY[ACTION_FAMILY[action]];
  return action === first ? second : first;
}

/** True when both tools share a family. */
export function sameFamily(a: ActionIcon, b: ActionIcon): boolean {
  return ACTION_FAMILY[a] === ACTION_FAMILY[b];
}

/** The tool the round's wrong card should have shown. */
export function correctAction(round: RoundSpec | FixItRound): ActionIcon {
  return round.program[round.bugIndex];
}

/** Deals one round: the authored tape plus a seeded repair tray. */
export function buildRound(round: number, rng: Rng = Math.random): FixItRound {
  const spec = ROUND_SPECS[round];
  if (spec === undefined) {
    throw new Error(`no round spec for index: ${round}`);
  }
  const tape = spec.program.map((action, index) =>
    index === spec.bugIndex ? spec.wrongAction : action,
  );
  // The tray offers the right tool plus two others; the tool already proved
  // wrong is never offered back, so every pick is a real choice.
  const pools = ACTION_ICONS.filter(
    (action) => action !== spec.program[spec.bugIndex] && action !== spec.wrongAction,
  );
  const [first, second] = shuffle(pools, rng);
  const candidates = shuffle([spec.program[spec.bugIndex], first, second], rng);
  return {
    round,
    toy: spec.toy,
    program: spec.program,
    tape,
    bugIndex: spec.bugIndex,
    wrongAction: spec.wrongAction,
    band: spec.band,
    candidates,
  };
}

/** Deals a whole playthrough, one round at a time, from one generator. */
export function buildPlaythrough(rng: Rng = Math.random): readonly FixItRound[] {
  return ROUND_SPECS.map((_, index) => buildRound(index, rng));
}

/** True when `index` names the round's wrong card. */
export function isWrongCard(round: FixItRound, index: number): boolean {
  return index === round.bugIndex;
}

/** The tape after the lifted card is replaced with `action`. */
export function applyRepair(round: FixItRound, action: ActionIcon): readonly ActionIcon[] {
  return round.tape.map((card, index) => (index === round.bugIndex ? action : card));
}

/** True when the tape is the round's correct program. */
export function isSolved(round: FixItRound, tape: readonly ActionIcon[]): boolean {
  return (
    tape.length === round.program.length &&
    tape.every((card, index) => card === round.program[index])
  );
}

/**
 * The hint level a run of wrong diagnosis taps has earned:
 * 0 below two taps, 1 at two, 2 at four, 3 at six and beyond.
 */
export function hintLevelFor(wrongTaps: number): 0 | 1 | 2 | 3 {
  if (wrongTaps >= 6) return 3;
  if (wrongTaps >= 4) return 2;
  if (wrongTaps >= 2) return 1;
  return 0;
}
