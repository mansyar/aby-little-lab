import { describe, expect, it } from "vitest";
import {
  DEFAULT_NARRATION_PACE,
  NARRATION_PACES,
  NARRATION_RATES,
  normalizeNarrationPace,
  ratesForPace,
} from "../../game/narrationPace";
import { createDefaultProfile, normalizeV2 } from "../../game/profileLogic";
import type { NarrationPace, Profile } from "../../types";

const NOW = "2026-08-04T12:00:00.000Z";

describe("narrationPace rate table", () => {
  it("exposes the three approved presets in order", () => {
    expect(NARRATION_PACES).toEqual(["slower", "gentle", "standard"]);
  });

  it("defaults to Gentle", () => {
    expect(DEFAULT_NARRATION_PACE).toBe("gentle");
  });

  it("keeps Gentle byte-identical to the historical rates", () => {
    expect(NARRATION_RATES.gentle).toEqual({ general: 0.9, word: 0.8 });
  });

  it("maps Slower and Standard to the approved rates", () => {
    expect(NARRATION_RATES.slower).toEqual({ general: 0.7, word: 0.6 });
    expect(NARRATION_RATES.standard).toEqual({ general: 1, word: 1 });
  });

  it("keeps every preset rate inside the intelligible 0.5–1.0 platform band", () => {
    for (const pace of NARRATION_PACES) {
      const rates = ratesForPace(pace);
      expect(rates.general).toBeGreaterThanOrEqual(0.5);
      expect(rates.general).toBeLessThanOrEqual(1);
      expect(rates.word).toBeGreaterThanOrEqual(0.5);
      expect(rates.word).toBeLessThanOrEqual(1);
    }
  });
});

describe("normalizeNarrationPace", () => {
  it("keeps each valid preset", () => {
    for (const pace of NARRATION_PACES) {
      expect(normalizeNarrationPace(pace)).toBe(pace);
    }
  });

  it("falls back to Gentle for missing, unknown or mistyped values", () => {
    for (const value of [undefined, null, "", "SLOWER", "turbo", 7, {}, []]) {
      expect(normalizeNarrationPace(value)).toBe("gentle");
    }
  });

  it("also falls back to Gentle at the rate lookup boundary", () => {
    expect(ratesForPace("turbo" as NarrationPace)).toEqual({ general: 0.9, word: 0.8 });
  });
});

describe("per-profile narration pace persistence", () => {
  it("backfills Gentle on a freshly created profile", () => {
    expect(createDefaultProfile("p1", "cat", NOW).narrationPace).toBe("gentle");
  });

  it("keeps a stored Slower pace for the active profile across a reload", () => {
    const profile: Profile = { ...createDefaultProfile("p1", "cat", NOW), narrationPace: "slower" };

    const restored = normalizeV2({ activeProfileId: "p1", profiles: [profile] }, NOW);

    expect(restored.activeProfileId).toBe("p1");
    expect(restored.profiles[0].narrationPace).toBe("slower");
  });

  it("backfills Gentle for a legacy profile saved without the field", () => {
    const legacy = createDefaultProfile("p1", "cat", NOW);
    delete legacy.narrationPace;

    const restored = normalizeV2({ activeProfileId: "p1", profiles: [legacy] }, NOW);

    expect(restored.profiles[0].narrationPace).toBe("gentle");
  });

  it("normalises an unknown stored pace to Gentle", () => {
    const corrupt = {
      ...createDefaultProfile("p1", "cat", NOW),
      narrationPace: "turbo",
    } as unknown as Profile;

    const restored = normalizeV2({ activeProfileId: "p1", profiles: [corrupt] }, NOW);

    expect(restored.profiles[0].narrationPace).toBe("gentle");
  });

  it("keeps the pace of every profile, not just the active one", () => {
    const slower: Profile = { ...createDefaultProfile("p1", "cat", NOW), narrationPace: "slower" };
    const standard: Profile = {
      ...createDefaultProfile("p2", "dog", NOW),
      narrationPace: "standard",
    };

    const restored = normalizeV2({ activeProfileId: "p2", profiles: [slower, standard] }, NOW);

    expect(restored.profiles.map((p) => p.narrationPace)).toEqual(["slower", "standard"]);
  });
});
