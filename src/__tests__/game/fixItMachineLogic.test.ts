import { describe, expect, it } from "vitest";
import {
  ACTION_FAMILY,
  ACTION_ICONS,
  ACTIONS_BY_FAMILY,
  type ActionIcon,
  applyRepair,
  buildPlaythrough,
  buildRound,
  correctAction,
  familyPartner,
  hintLevelFor,
  isSolved,
  isWrongCard,
  MAX_CARDS,
  ROUND_COUNT,
  ROUND_SPECS,
  sameFamily,
  TOYS,
} from "../../game/fixItMachineLogic";
import { mulberry32 } from "../helpers/randomHelper";

/** Every family a program's tools belong to. */
function familiesOf(program: readonly ActionIcon[]): Set<string> {
  return new Set(program.map((action) => ACTION_FAMILY[action]));
}

describe("the six tools and their families", () => {
  it("offers six tools in three families of two", () => {
    expect(ACTION_ICONS).toEqual(["spray", "pour", "paint", "polish", "lift", "stack"]);
    expect(Object.values(ACTIONS_BY_FAMILY)).toHaveLength(3);
    for (const pair of Object.values(ACTIONS_BY_FAMILY)) {
      expect(pair).toHaveLength(2);
      expect(ACTION_FAMILY[pair[0]]).toBe(ACTION_FAMILY[pair[1]]);
      expect(sameFamily(pair[0], pair[1])).toBe(true);
    }
    // Every tool is in exactly one family, and the families cover all six.
    const fromFamilies = Object.values(ACTIONS_BY_FAMILY).flat();
    expect([...fromFamilies].sort()).toEqual([...ACTION_ICONS].sort());
  });

  it("pairs each tool with exactly one sibling, and pairing twice returns it", () => {
    for (const action of ACTION_ICONS) {
      const partner = familyPartner(action);
      expect(partner).not.toBe(action);
      expect(familyPartner(partner)).toBe(action);
      expect(sameFamily(action, partner)).toBe(true);
    }
    expect(familyPartner("spray")).toBe("pour");
    expect(familyPartner("paint")).toBe("polish");
    expect(familyPartner("lift")).toBe("stack");
  });
});

describe("the six-round ladder", () => {
  it("serves six rounds over six toys", () => {
    expect(ROUND_COUNT).toBe(6);
    expect(ROUND_SPECS).toHaveLength(ROUND_COUNT);
    expect(ROUND_SPECS.map((spec) => spec.toy)).toEqual(TOYS);
  });

  it("grows the tape 3, 3, 4, 4, 5, 5 and hardens the band in that order", () => {
    expect(ROUND_SPECS.map((spec) => spec.program.length)).toEqual([3, 3, 4, 4, 5, 5]);
    expect(ROUND_SPECS.map((spec) => spec.band)).toEqual([
      "different",
      "different",
      "related",
      "related",
      "same-family",
      "same-family",
    ]);
    for (const spec of ROUND_SPECS) {
      expect(spec.program.length).toBeLessThanOrEqual(MAX_CARDS);
    }
  });

  it("keeps every correct program distinct and every bug card present but not first", () => {
    for (const spec of ROUND_SPECS) {
      expect(new Set(spec.program).size, `${spec.toy} repeats a tool`).toBe(spec.program.length);
      expect(spec.bugIndex, `${spec.toy} blames the first card`).toBeGreaterThanOrEqual(1);
      expect(spec.bugIndex, `${spec.toy} blames a card that is not there`).toBeLessThan(
        spec.program.length,
      );
      // The wrong tool must not also appear on the tape: two identical tools
      // would make "which card is wrong" ambiguous.
      expect(spec.program).not.toContain(spec.wrongAction);
    }
  });

  it("draws each band's wrong tool by that band's rule", () => {
    for (const spec of ROUND_SPECS) {
      const right = spec.program[spec.bugIndex];
      const families = familiesOf(spec.program);
      if (spec.band === "different") {
        expect(families.has(ACTION_FAMILY[spec.wrongAction]), `${spec.toy} is too close`).toBe(
          false,
        );
      } else if (spec.band === "related") {
        // A tool from a family the routine already uses, but not the sibling of
        // the card that is wrong.
        expect(families.has(ACTION_FAMILY[spec.wrongAction]), `${spec.toy} is too foreign`).toBe(
          true,
        );
        expect(spec.wrongAction).not.toBe(familyPartner(right));
      } else {
        expect(spec.wrongAction, `${spec.toy} did not use the sibling`).toBe(familyPartner(right));
      }
      expect(spec.wrongAction).not.toBe(right);
    }
  });
});

describe("dealing a round", () => {
  it("puts the wrong tool on the wrong card and nothing else out of place", () => {
    const round = buildRound(0, mulberry32(1234));
    expect(round.round).toBe(0);
    expect(round.toy).toBe("teddy");
    expect(round.tape).toHaveLength(round.program.length);
    expect(round.tape[round.bugIndex]).toBe(round.wrongAction);
    round.tape.forEach((card, index) => {
      if (index !== round.bugIndex) expect(card).toBe(round.program[index]);
    });
    expect(correctAction(round)).toBe(round.program[round.bugIndex]);
    expect(isSolved(round, round.tape)).toBe(false);
  });

  it("offers three tray candidates: the right tool, never the wrong one, no repeats", () => {
    for (let index = 0; index < ROUND_COUNT; index++) {
      const round = buildRound(index, mulberry32(77));
      expect(round.candidates).toHaveLength(3);
      expect(new Set(round.candidates).size).toBe(3);
      expect(round.candidates).toContain(correctAction(round));
      expect(round.candidates).not.toContain(round.wrongAction);
      expect(round.candidates.every((action) => ACTION_ICONS.includes(action))).toBe(true);
    }
  });

  it("deals the same round for the same seed and a different tray for another", () => {
    const a = buildRound(2, mulberry32(2026));
    const b = buildRound(2, mulberry32(2026));
    expect(a).toEqual(b);
    const trays = new Set(
      [1, 2, 3, 4, 5, 6, 7, 8].map((seed) => buildRound(2, mulberry32(seed)).candidates.join(",")),
    );
    // A seeded generator still varies the tray, so repeat play is not identical.
    expect(trays.size).toBeGreaterThan(1);
  });

  it("refuses a round index the ladder does not have", () => {
    expect(() => buildRound(ROUND_COUNT, mulberry32(1))).toThrow(/no round spec/);
  });

  it("deals a whole playthrough in ladder order, reproducibly", () => {
    const first = buildPlaythrough(mulberry32(1234));
    expect(first).toHaveLength(ROUND_COUNT);
    expect(first.map((round) => round.toy)).toEqual(TOYS);
    expect(buildPlaythrough(mulberry32(1234))).toEqual(first);
  });
});

describe("diagnosis and repair", () => {
  it("names exactly the one card that is wrong", () => {
    const round = buildRound(0, mulberry32(1234));
    for (let index = 0; index < round.tape.length; index++) {
      expect(isWrongCard(round, index)).toBe(index === round.bugIndex);
    }
    expect(isWrongCard(round, -1)).toBe(false);
    expect(isWrongCard(round, round.tape.length)).toBe(false);
  });

  it("repairs in place and solves only with the right tool", () => {
    const round = buildRound(4, mulberry32(9));
    const repaired = applyRepair(round, correctAction(round));
    expect(repaired).toEqual(round.program);
    expect(isSolved(round, repaired)).toBe(true);

    const distractor = round.candidates.find((action) => action !== correctAction(round));
    expect(distractor).toBeDefined();
    if (distractor !== undefined) {
      const wrong = applyRepair(round, distractor);
      expect(isSolved(round, wrong)).toBe(false);
      // The repair never shortens the tape or moves another card.
      expect(wrong).toHaveLength(round.tape.length);
      wrong.forEach((card, index) => {
        if (index !== round.bugIndex) expect(card).toBe(round.tape[index]);
      });
    }
  });

  it("does not call a short or padded tape solved", () => {
    const round = buildRound(1, mulberry32(5));
    expect(isSolved(round, round.program.slice(0, -1))).toBe(false);
    expect(isSolved(round, [...round.program, "lift"])).toBe(false);
  });
});

describe("the hint ladder", () => {
  it("escalates at two, four and six wrong taps and nowhere else", () => {
    const levels = [0, 1, 2, 3, 4, 5, 6, 7, 12].map((taps) => hintLevelFor(taps));
    expect(levels).toEqual([0, 0, 1, 1, 2, 2, 3, 3, 3]);
  });
});
