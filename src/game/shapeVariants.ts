import { ALL_SHAPES, type ShapeType } from "./shapeSorterLogic";

/**
 * A themed slide of the shape pool. Variants are data only: `generatePlaythrough`
 * keeps drawing from the full `ALL_SHAPES` pool unless a caller opts in explicitly.
 */
export interface ShapeVariant {
  readonly id: "curvy" | "angular";
  readonly label: string;
  readonly shapes: readonly ShapeType[];
}

/** Shapes whose outline is dominated by curves rather than straight edges. */
const CURVY: ReadonlySet<ShapeType> = new Set<ShapeType>([
  "circle",
  "oval",
  "heart",
  "crescent",
  "semicircle",
  "teardrop",
  "ring",
  "capsule",
]);

/** The two signature shape variants, derived from the full pool. */
export const SHAPE_VARIANTS: readonly ShapeVariant[] = Object.freeze([
  Object.freeze({
    id: "curvy",
    label: "Curvy",
    shapes: ALL_SHAPES.filter((shape) => CURVY.has(shape)),
  }),
  Object.freeze({
    id: "angular",
    label: "Angular",
    shapes: ALL_SHAPES.filter((shape) => !CURVY.has(shape)),
  }),
]);

/** Pure selector: returns a variant's shapes without touching any rule pool. */
export function shapeVariantPool(id: ShapeVariant["id"]): readonly ShapeType[] {
  const variant = SHAPE_VARIANTS.find((candidate) => candidate.id === id);
  if (variant === undefined) throw new Error(`unknown shape variant: ${id}`);
  return variant.shapes;
}
