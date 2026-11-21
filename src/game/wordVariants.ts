import { type FirstWord, WORD_POOL } from "./wordLogic";

/**
 * A themed slide of the word pool. Variants are data only: every rule function
 * keeps drawing from `WORD_POOL` unless a caller opts in explicitly.
 */
export interface WordVariant {
  readonly id: "animals-and-food" | "everyday-objects";
  readonly label: string;
  readonly words: readonly FirstWord[];
}

/** Words whose prompt picture comes from the named art-group prefixes. */
function fromGroups(groups: readonly string[]): readonly FirstWord[] {
  return WORD_POOL.filter((entry) =>
    groups.some((group) => entry.promptTexture.startsWith(`${group}_`)),
  );
}

/** The two signature word variants, derived from the full pool. */
export const WORD_VARIANTS: readonly WordVariant[] = Object.freeze([
  Object.freeze({
    id: "animals-and-food",
    label: "Animals & Food",
    words: fromGroups(["animal", "food"]),
  }),
  Object.freeze({
    id: "everyday-objects",
    label: "Everyday Objects",
    words: fromGroups(["sm", "toy"]),
  }),
]);

/** Pure selector: returns a variant's words without touching any rule pool. */
export function wordVariantPool(id: WordVariant["id"]): readonly FirstWord[] {
  const variant = WORD_VARIANTS.find((candidate) => candidate.id === id);
  if (variant === undefined) throw new Error(`unknown word variant: ${id}`);
  return variant.words;
}
