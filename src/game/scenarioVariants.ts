import { SCENARIO_POOL, type Scenario } from "./feelingsFacesLogic";

/**
 * A themed slide of the scenario pool. Variants are data only: `drawScenarios`
 * keeps drawing from the full `SCENARIO_POOL` unless a caller opts in explicitly.
 */
export interface ScenarioVariant {
  readonly id: "outdoors-and-play" | "home-and-friends";
  readonly label: string;
  readonly scenarios: readonly Scenario[];
}

/** Scenarios set outside or around shared play. */
const OUTDOOR_IDS: ReadonlySet<string> = new Set([
  "happy-ladybug",
  "happy-bubbles",
  "happy-plant",
  "happy-truck",
  "happy-ducks",
  "happy-parade",
  "happy-rainbow",
  "sad-boat",
  "sad-rain",
  "sad-balloon",
  "sad-kite",
  "sad-cloud",
  "angry-turn",
  "angry-line",
  "angry-slide",
  "scared-dog",
  "scared-swing",
  "scared-owl",
  "scared-wind",
  "scared-moth",
  "scared-flash",
]);

/** The two signature scenario variants, derived from the full pool. */
export const SCENARIO_VARIANTS: readonly ScenarioVariant[] = Object.freeze([
  Object.freeze({
    id: "outdoors-and-play",
    label: "Outdoors & Play",
    scenarios: SCENARIO_POOL.filter((scenario) => OUTDOOR_IDS.has(scenario.id)),
  }),
  Object.freeze({
    id: "home-and-friends",
    label: "Home & Friends",
    scenarios: SCENARIO_POOL.filter((scenario) => !OUTDOOR_IDS.has(scenario.id)),
  }),
]);

/** Pure selector: returns a variant's scenarios without touching any rule pool. */
export function scenarioVariantPool(id: ScenarioVariant["id"]): readonly Scenario[] {
  const variant = SCENARIO_VARIANTS.find((candidate) => candidate.id === id);
  if (variant === undefined) throw new Error(`unknown scenario variant: ${id}`);
  return variant.scenarios;
}
