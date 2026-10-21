import { describe, expect, it } from "vitest";
import {
  AUDIO_IDENTITIES,
  type AudioIdentity,
  DEFAULT_IDENTITY,
  identityForGameId,
  MAX_CONTOUR_OFFSET_SEMITONES,
  MAX_PITCH_OFFSET_SEMITONES,
  MAX_TEMPO,
  MIN_TEMPO,
  normalizeIdentity,
} from "../../game/audioIdentity";
import { GAME_REGISTRY } from "../../game/gameRegistry";
import type { GameId } from "../../types";

describe("audio identity table", () => {
  it("covers the documented registry size", () => {
    expect(GAME_REGISTRY).toHaveLength(22);
  });

  /**
   * AC-1: every registered game resolves to a non-default identity. Iterating
   * GAME_REGISTRY (not the table) is the point: a game added to the registry
   * without an identity row fails here instead of silently playing the
   * default voice forever.
   */
  it("resolves every registered game to a non-default identity", () => {
    for (const entry of GAME_REGISTRY) {
      const identity = identityForGameId(entry.gameId);
      expect(identity, `missing identity for ${entry.gameId}`).not.toEqual(DEFAULT_IDENTITY);
    }
  });

  it("keeps the table keys aligned with the registry game ids", () => {
    const registryIds = GAME_REGISTRY.map((entry) => entry.gameId).sort();
    expect(Object.keys(AUDIO_IDENTITIES).sort()).toEqual(registryIds);
  });

  it("keeps every table entry inside the documented ranges", () => {
    for (const [gameId, identity] of Object.entries(AUDIO_IDENTITIES)) {
      expect(identity, `${gameId} has no identity row`).toBeDefined();
      if (!identity) continue; // narrows after the assertion above
      expect(identity.pitchOffsetSemitones).toBeGreaterThanOrEqual(-MAX_PITCH_OFFSET_SEMITONES);
      expect(identity.pitchOffsetSemitones).toBeLessThanOrEqual(MAX_PITCH_OFFSET_SEMITONES);
      expect(identity.tempo).toBeGreaterThanOrEqual(MIN_TEMPO);
      expect(identity.tempo).toBeLessThanOrEqual(MAX_TEMPO);
      for (const contour of [
        identity.contours.correct,
        identity.contours.incorrect,
        identity.contours.win,
      ]) {
        expect(contour[0]).toBe(0);
        for (const offset of contour) {
          expect(offset).toBeGreaterThanOrEqual(-MAX_CONTOUR_OFFSET_SEMITONES);
          expect(offset).toBeLessThanOrEqual(MAX_CONTOUR_OFFSET_SEMITONES);
        }
      }
    }
  });
});

describe("identity resolution", () => {
  it("returns the table entry for sampled games", () => {
    expect(identityForGameId("shape-sorter")).toEqual(AUDIO_IDENTITIES["shape-sorter"]);
    expect(identityForGameId("more-less")).toEqual(AUDIO_IDENTITIES["more-less"]);
  });

  it("pins the formula-derived values of a sampled entry", () => {
    // Hub order index 0: sine, pitch -5, tempo 0.75, first contour variants.
    expect(identityForGameId("shape-sorter")).toEqual({
      pitchOffsetSemitones: -5,
      waveform: "sine",
      tempo: 0.75,
      contours: { correct: [0, 4, 7], incorrect: [0, -7], win: [0, 4, 7, 12] },
    });
  });

  /**
   * AC-2 fallback half: unknown runtime ids, and the no-context case, must
   * degrade to the default voice without throwing.
   */
  it("falls back to the default identity for unknown, null, and undefined ids", () => {
    // Deliberate wrong type: proves unknown runtime ids fall back safely.
    expect(identityForGameId("not-a-game" as GameId)).toEqual(DEFAULT_IDENTITY);
    expect(identityForGameId(null)).toEqual(DEFAULT_IDENTITY);
    expect(identityForGameId(undefined)).toEqual(DEFAULT_IDENTITY);
  });

  it("pins the documented default voice", () => {
    expect(DEFAULT_IDENTITY).toEqual({
      pitchOffsetSemitones: 0,
      waveform: "sine",
      tempo: 1,
      contours: { correct: [0, 4, 7], incorrect: [0, -7], win: [0, 4, 7, 12] },
    });
  });
});

describe("identity normalization", () => {
  it("clamps out-of-range parameters instead of rejecting them", () => {
    const clamped = normalizeIdentity({
      pitchOffsetSemitones: 9,
      waveform: "square",
      tempo: 3,
      contours: { correct: [0, 20], incorrect: [0, -40], win: [0, 4, 7, 12] },
    });
    expect(clamped.pitchOffsetSemitones).toBe(MAX_PITCH_OFFSET_SEMITONES);
    expect(clamped.tempo).toBe(MAX_TEMPO);
    expect(clamped.contours.correct).toEqual([0, MAX_CONTOUR_OFFSET_SEMITONES]);
    expect(clamped.contours.incorrect).toEqual([0, -MAX_CONTOUR_OFFSET_SEMITONES]);
    expect(clamped.contours.win).toEqual([0, 4, 7, 12]);
  });

  it("leaves in-range identities untouched", () => {
    const identity: AudioIdentity = identityForGameId("big-small");
    expect(normalizeIdentity(identity)).toEqual(identity);
  });
});
