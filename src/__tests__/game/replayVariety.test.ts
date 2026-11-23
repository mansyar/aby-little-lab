import { describe, expect, it, vi } from "vitest";
import { GAME_REGISTRY } from "../../game/gameRegistry";
import {
  createReplayVisit,
  getVisitPlayed,
  hasPlayedThisVisit,
  recordVisitPlay,
  recordVisitSuggestion,
  type Stamps,
  selectSuggestion,
  setReplayVisitProfile,
} from "../../game/replayVariety";
import type { GameId } from "../../types";

const GAMES: readonly GameId[] = GAME_REGISTRY.map((entry) => entry.gameId);
const A: GameId = "shape-sorter";
const B: GameId = "animal-trace";
const C: GameId = "pop-freeze";
const D: GameId = "shadow-match";

const T0 = "2020-01-01T00:00:00.000Z";
const T1 = "2021-01-01T00:00:00.000Z";
const T2 = "2022-01-01T00:00:00.000Z";

/** Deterministic mulberry32 PRNG local to this test — no faker, no dependency. */
function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 0x100000000;
  };
}

describe("visit state — FR-1 / AC-1", () => {
  it("starts empty and never touches storage", () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => undefined);
    const state = createReplayVisit();

    expect(state.profileId).toBeNull();
    expect(state.played.size).toBe(0);
    expect(state.lastPlayed).toBeNull();
    expect(state.lastSuggested).toBeNull();
    expect(getVisitPlayed(state).size).toBe(0);
    expect(setItem).not.toHaveBeenCalled();
    setItem.mockRestore();
  });

  it("records a played game idempotently and exposes a read-only view", () => {
    let state = createReplayVisit("kid-1");
    state = recordVisitPlay(state, A);
    state = recordVisitPlay(state, A);
    state = recordVisitPlay(state, B);

    expect(getVisitPlayed(state)).toEqual(new Set([A, B]));
    expect(state.lastPlayed).toBe(B);
    expect(hasPlayedThisVisit(state, A)).toBe(true);
    expect(hasPlayedThisVisit(state, D)).toBe(false);
  });

  it("records the last suggestion without changing the last play", () => {
    const played = recordVisitPlay(createReplayVisit(), A);
    const suggested = recordVisitSuggestion(played, C);

    expect(suggested.lastSuggested).toBe(C);
    expect(suggested.lastPlayed).toBe(A);
    expect(played.lastSuggested).toBeNull();
  });

  it("resets the visit on profile switch and keeps the id when omitted", () => {
    const used = recordVisitPlay(createReplayVisit("kid-1"), A);

    const switched = setReplayVisitProfile(used, "kid-2");
    expect(switched.profileId).toBe("kid-2");
    expect(switched.played.size).toBe(0);
    expect(switched.lastPlayed).toBeNull();
    expect(switched.lastSuggested).toBeNull();

    const sameProfile = setReplayVisitProfile(used);
    expect(sameProfile.profileId).toBe("kid-1");
    expect(sameProfile.played.size).toBe(0);

    const anonymous = setReplayVisitProfile(createReplayVisit());
    expect(anonymous.profileId).toBeNull();
  });
});

describe("no-repeat selector — FR-2 / AC-2", () => {
  it("excludes the game just played", () => {
    const state = recordVisitPlay(createReplayVisit(), A);
    const result = selectSuggestion(state, [A, B, C], {});

    expect(result.gameId).not.toBe(A);
    expect(result.forcedRepeat).toBe(false);
  });

  it("excludes the previous suggestion", () => {
    const state = recordVisitSuggestion(createReplayVisit(), C);
    const result = selectSuggestion(state, [A, B, C], {});

    expect(result.gameId).not.toBe(C);
    expect(result.forcedRepeat).toBe(false);
  });

  it("excludes both markers and honours extra exclusions", () => {
    let state = createReplayVisit();
    state = recordVisitPlay(state, A);
    state = recordVisitSuggestion(state, B);

    expect(selectSuggestion(state, [A, B, C, D], {}).gameId).toBe(C);
    const withExtra = selectSuggestion(state, [A, B, C, D], {}, { exclude: [C] });
    expect(withExtra.gameId).toBe(D);
    expect(withExtra.forcedRepeat).toBe(false);
  });

  it("forces a repeat when the pool has one game", () => {
    const state = recordVisitPlay(createReplayVisit(), A);
    const result = selectSuggestion(state, [A], {});

    expect(result).toEqual({ gameId: A, forcedRepeat: true });
  });

  it("forces a repeat when exclusions empty the pool", () => {
    let state = createReplayVisit();
    state = recordVisitPlay(state, A);
    state = recordVisitSuggestion(state, B);
    const result = selectSuggestion(state, [A, B], {});

    expect([A, B]).toContain(result.gameId);
    expect(result.forcedRepeat).toBe(true);
  });

  it("does not mutate progress or visit state until a suggestion is recorded", () => {
    const progress: Stamps = { [A]: T0, [B]: T2 };
    const before = { ...progress };
    const state = createReplayVisit();

    const result = selectSuggestion(state, GAMES, progress);

    expect(progress).toEqual(before);
    expect(state.lastSuggested).toBeNull();
    const advanced = recordVisitSuggestion(state, result.gameId);
    expect(advanced.lastSuggested).toBe(result.gameId);
  });

  it("rejects an empty game list", () => {
    expect(() => selectSuggestion(createReplayVisit(), [], {})).toThrow(
      "selectSuggestion needs at least one game",
    );
  });
});

describe("deterministic ordering — FR-3 / AC-3", () => {
  it("puts unplayed-this-visit games before played ones", () => {
    const state = recordVisitPlay(createReplayVisit(), A);
    // A was played this visit and has an old stamp; C is unplayed and unstamped.
    const result = selectSuggestion(state, [A, B, C], { [A]: T0, [B]: T2 });

    expect(result.gameId).toBe(C);
  });

  it("orders older lastPlayed stamps before newer ones", () => {
    const result = selectSuggestion(createReplayVisit(), [A, B, C], {
      [A]: T2,
      [B]: T0,
      [C]: T1,
    });

    expect(result.gameId).toBe(B);
  });

  it("treats null and invalid stamps as never played", () => {
    const result = selectSuggestion(createReplayVisit(), [A, B, C], {
      [A]: "not-a-date",
      [B]: null,
      [C]: T0,
    });

    expect(result.gameId).toBe(A);
  });

  it("breaks identical stamps by registry order", () => {
    const progress: Partial<Record<GameId, string | null>> = {};
    for (const gameId of GAMES) progress[gameId] = T1;
    const result = selectSuggestion(createReplayVisit(), GAMES, progress);

    expect(result.gameId).toBe(A);
  });
});

describe("seeded session metric — FR-8 / AC-8", () => {
  it("keeps median distinct >= 4 with zero unexpected repeats over 1,000+ visits", () => {
    const VISITS = 1200;
    const PLAYS_PER_VISIT = 8;
    const random = seededRandom(0x5eed2026);
    const distinctCounts: number[] = [];
    let unexpectedRepeats = 0;
    let forcedRepeats = 0;

    for (let visit = 0; visit < VISITS; visit += 1) {
      const progress: Partial<Record<GameId, string | null>> = {};
      for (const gameId of GAMES) {
        progress[gameId] =
          random() < 0.25
            ? null
            : new Date(
                Date.UTC(2019 + Math.floor(random() * 6), Math.floor(random() * 12), 1),
              ).toISOString();
      }

      let state = createReplayVisit(`kid-${visit}`);
      const distinct = new Set<GameId>();

      for (let play = 0; play < PLAYS_PER_VISIT; play += 1) {
        const decision = selectSuggestion(state, GAMES, progress);

        if (decision.forcedRepeat) {
          forcedRepeats += 1;
        } else if (
          decision.gameId === state.lastPlayed ||
          decision.gameId === state.lastSuggested
        ) {
          unexpectedRepeats += 1;
        }

        const played =
          random() < 0.7 ? decision.gameId : GAMES[Math.floor(random() * GAMES.length)];
        state = recordVisitPlay(state, played);
        state = recordVisitSuggestion(state, decision.gameId);
        distinct.add(played);
      }

      distinctCounts.push(distinct.size);
    }

    distinctCounts.sort((left, right) => left - right);
    const median = distinctCounts[Math.floor(distinctCounts.length / 2)];

    expect(GAMES).toHaveLength(24);
    expect(median).toBeGreaterThanOrEqual(4);
    expect(unexpectedRepeats).toBe(0);
    expect(forcedRepeats).toBe(0);
  });
});
