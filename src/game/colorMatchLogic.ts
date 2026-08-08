import { shuffle } from "./shapeSorterLogic";

/** Named colors used in Color Match rounds. */
export type ColorId = "red" | "blue" | "yellow" | "green" | "orange" | "purple";

/** One color: its answer-card texture, prompt swatch fill, and spoken name. */
export interface ColorCard {
  colorId: ColorId;
  /** PreloadScene texture key of the object shown as the answer card. */
  texture: string;
  /** Hex fill of the prompt swatch — MUST equal the texture's SVG fill. */
  fill: string;
  /** Spoken color name for the TTS prompt. */
  name: string;
}

/** The six color cards. Swatch fills equal the source SVG fills. */
export const COLOR_CARDS: readonly ColorCard[] = [
  { colorId: "red", texture: "shape_heart", fill: "#E53E3E", name: "red" },
  { colorId: "blue", texture: "frog_blue", fill: "#3182CE", name: "blue" },
  { colorId: "yellow", texture: "shape_crescent", fill: "#ECC94B", name: "yellow" },
  { colorId: "green", texture: "shape_rectangle", fill: "#48BB78", name: "green" },
  { colorId: "orange", texture: "shape_circle", fill: "#F6AD55", name: "orange" },
  { colorId: "purple", texture: "shape_square", fill: "#9F7AEA", name: "purple" },
];

/**
 * Difficulty bands: easy rounds draw from 4 basic colors, hard rounds from
 * all 6. Difficulty is fixed across replays per the replay-variety principle.
 */
export const COLOR_POOLS: {
  readonly easy: readonly ColorId[];
  readonly hard: readonly ColorId[];
} = {
  easy: ["red", "blue", "yellow", "green"],
  hard: ["red", "blue", "yellow", "green", "orange", "purple"],
};

/**
 * A single Color Match round: four distinct-color cards plus the color the
 * child must find. The target is always one of the four cards.
 */
export interface ColorMatchRound {
  /** The four answer cards (distinct colors, shuffled order). */
  cards: readonly ColorCard[];
  /** The color to find — matches the prompt swatch. */
  targetColorId: ColorId;
}

/** Builds one round by sampling 4 distinct colors from the pool. */
export function buildRound(pool: readonly ColorId[]): ColorMatchRound {
  const colors = shuffle(pool).slice(0, 4);
  const cards = colors.map((colorId) => {
    const card = COLOR_CARDS.find((candidate) => candidate.colorId === colorId);
    if (!card) {
      // Only reachable if a caller passes a color id outside COLOR_CARDS.
      throw new Error(`Unknown color ${colorId}`);
    }
    return card;
  });
  const targetColorId = cards[Math.floor(Math.random() * cards.length)].colorId;
  return { cards, targetColorId };
}

/**
 * Generates a playthrough of 6 rounds, easy-first: 3 rounds from the
 * 4-color pool, then 3 from the 6-color pool. Difficulty is fixed across
 * replays.
 */
export function buildPlaythrough(): ColorMatchRound[] {
  const rounds: ColorMatchRound[] = [];
  for (let i = 0; i < 3; i++) {
    rounds.push(buildRound(COLOR_POOLS.easy));
  }
  for (let i = 0; i < 3; i++) {
    rounds.push(buildRound(COLOR_POOLS.hard));
  }
  return rounds;
}

/** Returns whether the card at `selectedIndex` matches the target color. */
export function isCorrect(
  cards: readonly ColorCard[],
  selectedIndex: number,
  targetColorId: ColorId,
): boolean {
  return cards[selectedIndex]?.colorId === targetColorId;
}

/** Returns the spoken color name for a color id (falls back to the id). */
export function promptFor(colorId: ColorId): string {
  return COLOR_CARDS.find((card) => card.colorId === colorId)?.name ?? colorId;
}
