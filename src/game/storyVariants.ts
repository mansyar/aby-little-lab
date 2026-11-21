import { STORY_POOL, type Story } from "./storyOrderLogic";

/**
 * A themed slide of the story pool. Variants are data only: `buildPlaythrough`
 * keeps drawing from the full `STORY_POOL` unless a caller opts in explicitly.
 */
export interface StoryVariant {
  readonly id: "growing-things" | "everyday-changes";
  readonly label: string;
  readonly stories: readonly Story[];
}

/** Stories about living things growing or the weather changing around them. */
const GROWING_IDS: ReadonlySet<string> = new Set([
  "seed",
  "duck",
  "banana",
  "rain",
  "sun",
  "caterpillar",
  "tadpole",
  "shadow",
  "bee",
]);

/** The two signature story variants, derived from the full pool. */
export const STORY_VARIANTS: readonly StoryVariant[] = Object.freeze([
  Object.freeze({
    id: "growing-things",
    label: "Growing Things",
    stories: STORY_POOL.filter((story) => GROWING_IDS.has(story.id)),
  }),
  Object.freeze({
    id: "everyday-changes",
    label: "Everyday Changes",
    stories: STORY_POOL.filter((story) => !GROWING_IDS.has(story.id)),
  }),
]);

/** Pure selector: returns a variant's stories without touching any rule pool. */
export function storyVariantPool(id: StoryVariant["id"]): readonly Story[] {
  const variant = STORY_VARIANTS.find((candidate) => candidate.id === id);
  if (variant === undefined) throw new Error(`unknown story variant: ${id}`);
  return variant.stories;
}
