import { afterEach, describe, expect, it, vi } from "vitest";
import { animals } from "../../../game/art/animals";
import { cutouts } from "../../../game/art/cutouts";
import { faces } from "../../../game/art/faces";
import { food } from "../../../game/art/food";
import { glyphs } from "../../../game/art/glyphs";
import { items } from "../../../game/art/items";
import { letters } from "../../../game/art/letters";
import { music } from "../../../game/art/music";
import { numerals } from "../../../game/art/numerals";
import { shadows } from "../../../game/art/shadows";
import { shapes } from "../../../game/art/shapes";
import { toys } from "../../../game/art/toys";
import { GAME_REGISTRY } from "../../../game/gameRegistry";
import {
  ART_KEYS_BY_GAME,
  type ArtKeyEntry,
  artKeysInRecencyOrder,
  defaultIdleScheduler,
  type IdleScheduler,
  type PrewarmEntry,
  type PrewarmProgress,
  recencyFirstOrder,
  startArtPrewarm,
  startPrewarm,
} from "../../../game/hub/prewarm";
import { STORY_PANEL_ASSETS } from "../../../game/storyOrderArt";
import { textureSizeFor } from "../../../utils/textureTiers";

/**
 * Seeded unit fixtures for the idle-paced prewarm engine. All fixtures are
 * plain deterministic values — no randomness, so no `mulberry32` is needed.
 */

/** Minimal structural progress record builder (timestamps are ISO strings). */
const progressWith = (stamps: Record<string, string | null>): PrewarmProgress =>
  Object.fromEntries(Object.entries(stamps).map(([key, lastPlayedAt]) => [key, { lastPlayedAt }]));

/** Resolvable/rejectable promise the test controls directly. */
function createDeferred(): { promise: Promise<void>; resolve: () => void; reject: () => void } {
  let resolve: () => void = () => {};
  let reject: () => void = () => {};
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/** Manual idle scheduler the test drains slot by slot. */
class FakeScheduler implements IdleScheduler {
  private nextHandle = 1;
  readonly pending = new Map<number, () => void>();
  /** Total slots ever requested — proves skipped keys consume no slot. */
  requested = 0;

  request(callback: () => void): number {
    this.requested += 1;
    const handle = this.nextHandle;
    this.nextHandle += 1;
    this.pending.set(handle, callback);
    return handle;
  }

  cancel(handle: number): void {
    this.pending.delete(handle);
  }

  get size(): number {
    return this.pending.size;
  }

  /** Fires the oldest pending slot (removing it first, like a real scheduler). */
  fireNext(): void {
    const entry = this.pending.entries().next();
    if (entry.done) {
      return;
    }
    this.pending.delete(entry.value[0]);
    entry.value[1]();
  }

  fireAll(): void {
    while (this.pending.size > 0) {
      this.fireNext();
    }
  }
}

/** Lets already-queued microtasks (import settle → next slot request) run. */
const settle = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
};

/** Drains every slot the engine will ever request for the current fixtures. */
async function runToCompletion(scheduler: FakeScheduler): Promise<void> {
  for (let guard = 0; guard < 100 && scheduler.size > 0; guard += 1) {
    scheduler.fireAll();
    await settle();
  }
}

/** Ordered entries whose loaders resolve immediately, recording their key. */
function immediateEntries(keys: string[], calls: string[]): PrewarmEntry[] {
  return keys.map((key) => ({
    key,
    load: () => {
      calls.push(key);
      return Promise.resolve(key);
    },
  }));
}

describe("recencyFirstOrder", () => {
  const GRID = ["a", "b", "c", "d"];

  it("orders played games by lastPlayedAt descending", () => {
    const progress = progressWith({
      a: "2026-01-03T00:00:00.000Z",
      b: "2026-01-01T00:00:00.000Z",
      c: "2026-01-02T00:00:00.000Z",
      d: null,
    });
    expect(recencyFirstOrder(progress, GRID, GRID)).toEqual(["a", "c", "b", "d"]);
  });

  it("places never-played games last preserving grid order", () => {
    const progress = progressWith({
      a: "2026-01-02T00:00:00.000Z",
      b: null,
      c: null,
      d: "2026-01-01T00:00:00.000Z",
    });
    expect(recencyFirstOrder(progress, GRID, GRID)).toEqual(["a", "d", "b", "c"]);
  });

  it("breaks timestamp ties by grid order", () => {
    const stamp = "2026-01-01T00:00:00.000Z";
    const progress = progressWith({ a: stamp, b: null, c: stamp, d: null });
    expect(recencyFirstOrder(progress, GRID, GRID)).toEqual(["a", "c", "b", "d"]);
  });

  it("returns pure grid order when nothing has been played (first visit)", () => {
    const progress = progressWith({ a: null, b: null, c: null, d: null });
    expect(recencyFirstOrder(progress, GRID, GRID)).toEqual(GRID);
  });

  it("treats missing and unparseable timestamps as never-played", () => {
    const progress = progressWith({ a: "not-a-date", b: "2026-01-01T00:00:00.000Z", c: null });
    expect(recencyFirstOrder(progress, GRID, ["a", "b", "c"])).toEqual(["b", "a", "c"]);
  });

  it("does not mutate its inputs", () => {
    const progress = progressWith({ a: "2026-01-01T00:00:00.000Z", b: null });
    const allKeys = ["b", "a"];
    const result = recencyFirstOrder(progress, GRID, allKeys);
    expect(result).toEqual(["a", "b"]);
    expect(allKeys).toEqual(["b", "a"]);
    expect(progress.a?.lastPlayedAt).toBe("2026-01-01T00:00:00.000Z");
  });
});

describe("startPrewarm — idle pacing (AC-1)", () => {
  it("imports chunks in recency-first order, one idle slot per chunk", async () => {
    const GRID = ["a", "b", "c", "d"];
    const progress = progressWith({
      a: "2026-01-03T00:00:00.000Z",
      b: null,
      c: "2026-01-02T00:00:00.000Z",
      d: null,
    });
    const calls: string[] = [];
    const byRecency = recencyFirstOrder(progress, GRID, GRID);
    const entries = immediateEntries(byRecency, calls);
    const scheduler = new FakeScheduler();
    const imported = new Set<string>();

    startPrewarm({ entries, scheduler, imported });
    await runToCompletion(scheduler);

    expect(calls).toEqual(["a", "c", "b", "d"]);
    expect(scheduler.requested).toBe(4);
    expect(imported).toEqual(new Set(["a", "b", "c", "d"]));
  });

  it("keeps exactly one import in flight until it settles", async () => {
    const first = createDeferred();
    const second = createDeferred();
    const loaders = [vi.fn(() => first.promise), vi.fn(() => second.promise)];
    const entries: PrewarmEntry[] = loaders.map((load, index) => ({
      key: `k${index}`,
      load: () => load(),
    }));
    const scheduler = new FakeScheduler();

    startPrewarm({ entries, scheduler });

    expect(loaders[0]).not.toHaveBeenCalled();
    scheduler.fireAll();
    expect(loaders[0]).toHaveBeenCalledTimes(1);
    expect(loaders[1]).not.toHaveBeenCalled();
    expect(scheduler.size).toBe(0);

    first.resolve();
    await settle();
    expect(scheduler.size).toBe(1);
    scheduler.fireAll();
    expect(loaders[1]).toHaveBeenCalledTimes(1);
    expect(loaders[0]).toHaveBeenCalledTimes(1);

    second.resolve();
    await settle();
    expect(scheduler.size).toBe(0);
  });

  it("requests no idle slot while an import is in flight or after the queue drains", async () => {
    const deferreds = [createDeferred(), createDeferred()];
    const loaders = deferreds.map((d) => vi.fn(() => d.promise));
    const entries: PrewarmEntry[] = loaders.map((load, index) => ({
      key: `k${index}`,
      load: () => load(),
    }));
    const scheduler = new FakeScheduler();

    startPrewarm({ entries, scheduler });

    scheduler.fireNext();
    expect(scheduler.requested).toBe(1);

    deferreds[0].resolve();
    await settle();
    expect(scheduler.requested).toBe(2);
    scheduler.fireNext();

    deferreds[1].resolve();
    await settle();
    expect(scheduler.requested).toBe(2);
    expect(scheduler.size).toBe(0);
  });

  it("skips already-imported keys without consuming an idle slot", async () => {
    const calls: string[] = [];
    const entries = immediateEntries(["a", "b", "c"], calls);
    const scheduler = new FakeScheduler();
    const imported = new Set(["b"]);

    startPrewarm({ entries, scheduler, imported });
    await runToCompletion(scheduler);

    expect(calls).toEqual(["a", "c"]);
    expect(scheduler.requested).toBe(2);
  });
});

describe("startPrewarm — cancellation (AC-2)", () => {
  it("cancels a pending slot so no further imports fire", async () => {
    const calls: string[] = [];
    const entries = immediateEntries(["a", "b", "c"], calls);
    const scheduler = new FakeScheduler();

    const controller = startPrewarm({ entries, scheduler });
    scheduler.fireNext();
    await settle();
    expect(calls).toEqual(["a"]);

    controller.cancel();
    expect(scheduler.size).toBe(0);
    scheduler.fireAll();
    await runToCompletion(scheduler);
    expect(calls).toEqual(["a"]);
  });

  it("cancelling during an in-flight import discards the outcome", async () => {
    const inFlight = createDeferred();
    const loaders = [vi.fn(() => inFlight.promise)];
    const entries: PrewarmEntry[] = loaders.map((load, index) => ({
      key: `k${index}`,
      load: () => load(),
    }));
    const scheduler = new FakeScheduler();
    const imported = new Set<string>();

    const controller = startPrewarm({ entries, scheduler, imported });
    scheduler.fireNext();
    controller.cancel();

    inFlight.resolve();
    await settle();
    expect(scheduler.requested).toBe(1);
    expect(scheduler.size).toBe(0);
    expect(imported).toEqual(new Set());
  });

  it("leaves a cancelled loader perfectly usable for a direct call", async () => {
    const inFlight = createDeferred();
    const load = vi.fn(() => inFlight.promise);
    const scheduler = new FakeScheduler();
    const controller = startPrewarm({ entries: [{ key: "k", load }], scheduler });
    scheduler.fireNext();
    controller.cancel();

    inFlight.resolve();
    await expect(load()).resolves.toBeUndefined();
    expect(load).toHaveBeenCalledTimes(2);
  });
});

describe("startPrewarm — failure handling (AC-4)", () => {
  it("swallows a rejected import and continues with the next key", async () => {
    const failing = vi.fn(() => Promise.reject(new Error("chunk fetch failed")));
    const calls: string[] = [];
    const entries: PrewarmEntry[] = [
      { key: "a", load: () => failing() },
      ...immediateEntries(["b", "c"], calls),
    ];
    const scheduler = new FakeScheduler();
    const imported = new Set<string>();

    startPrewarm({ entries, scheduler, imported });
    await runToCompletion(scheduler);

    expect(calls).toEqual(["b", "c"]);
    expect(imported).toEqual(new Set(["b", "c"]));
  });

  it("retries a failed key on the next run and skips imported ones", async () => {
    const imported = new Set<string>();
    const firstRun = new FakeScheduler();
    const failing = vi.fn(() => Promise.reject(new Error("offline")));
    const okCalls: string[] = [];
    startPrewarm({
      entries: [{ key: "a", load: () => failing() }, ...immediateEntries(["b"], okCalls)],
      scheduler: firstRun,
      imported,
    });
    await runToCompletion(firstRun);
    expect(imported).toEqual(new Set(["b"]));

    const secondRun = new FakeScheduler();
    const retryCalls: string[] = [];
    startPrewarm({
      entries: [
        {
          key: "a",
          load: () => {
            retryCalls.push("a");
            return Promise.resolve("a");
          },
        },
        ...immediateEntries(["b"], retryCalls),
      ],
      scheduler: secondRun,
      imported,
    });
    await runToCompletion(secondRun);

    expect(retryCalls).toEqual(["a"]);
    expect(secondRun.requested).toBe(1);
    expect(imported).toEqual(new Set(["a", "b"]));
  });
});

describe("defaultIdleScheduler", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("prefers requestIdleCallback when the platform provides it", () => {
    const rIC = vi.fn(() => 7);
    const cIC = vi.fn();
    vi.stubGlobal("requestIdleCallback", rIC);
    vi.stubGlobal("cancelIdleCallback", cIC);

    const callback = vi.fn();
    const handle = defaultIdleScheduler.request(callback);
    expect(handle).toBe(7);
    expect(rIC).toHaveBeenCalledTimes(1);
    expect(callback).not.toHaveBeenCalled();

    defaultIdleScheduler.cancel(handle);
    expect(cIC).toHaveBeenCalledWith(7);
  });

  it("falls back to a low-priority setTimeout when requestIdleCallback is absent", () => {
    vi.stubGlobal("requestIdleCallback", undefined);
    vi.useFakeTimers();

    const callback = vi.fn();
    defaultIdleScheduler.request(callback);
    expect(callback).not.toHaveBeenCalled();
    vi.advanceTimersByTime(16);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("cancels the fallback slot through clearTimeout", () => {
    vi.stubGlobal("requestIdleCallback", undefined);
    vi.stubGlobal("cancelIdleCallback", undefined);
    vi.useFakeTimers();

    const callback = vi.fn();
    const handle = defaultIdleScheduler.request(callback);
    defaultIdleScheduler.cancel(handle);
    vi.advanceTimersByTime(16);
    expect(callback).not.toHaveBeenCalled();
  });
});

describe("ART_KEYS_BY_GAME — per-game art-key source (P1.T1)", () => {
  /**
   * Each game's declared art source, transcribed from its scene's `preload`
   * (`preloadArt([...])` groups, except `StoryOrder`, which rasterizes its
   * story panels through `preloadStoryOrderArt`). Key-only shape keeps this
   * suite decoupled from the SVG markup while still pinning key-for-key
   * equality against the live tables.
   */
  interface DeclaredSource {
    readonly assets: readonly { readonly key: string }[];
  }
  const EXPECTED_GROUPS: Readonly<Record<string, readonly DeclaredSource[]>> = {
    "shape-sorter": [cutouts, shapes],
    "animal-trace": [animals, food],
    "pop-freeze": [animals, glyphs],
    "shadow-match": [items, shadows],
    "musical-memory": [music],
    "big-small": [toys],
    "pattern-builder": [shapes],
    "alphabet-match": [letters],
    "word-match": [animals, food, items, letters, music, shapes, toys],
    "word-builder": [animals, food, items, letters, music, shapes, toys],
    "how-many": [food, items, numerals, shapes],
    "first-sounds": [animals, food, items, letters, music, shapes, toys],
    "more-less": [food, glyphs, items, shapes],
    "odd-one-out": [animals, music, shapes, toys],
    "color-match": [music, shapes],
    "add-it-up": [food, glyphs, items, shapes],
    "take-away": [food, glyphs, items, shapes],
    "memory-match": [animals, glyphs, items, toys],
    "decode-it": [animals, food, items, letters, music, shapes, toys],
    "number-order": [numerals],
    "feelings-faces": [faces],
    "story-order": [{ assets: STORY_PANEL_ASSETS }],
  };

  it("covers all 22 registry games and nothing else", () => {
    const registryIds = GAME_REGISTRY.map((entry) => entry.gameId).sort();
    expect(Object.keys(ART_KEYS_BY_GAME).sort()).toEqual(registryIds);
    expect(Object.keys(EXPECTED_GROUPS).sort()).toEqual(registryIds);
  });

  it("matches each game's declared groups key-for-key in order", () => {
    for (const [gameId, groups] of Object.entries(EXPECTED_GROUPS)) {
      const expected = groups.flatMap((group) => group.assets.map((asset) => asset.key));
      const actual = (ART_KEYS_BY_GAME[gameId] ?? []).map((entry) => entry.key);
      expect(actual, gameId).toEqual(expected);
    }
  });

  it("pins every size to textureSizeFor and excludes shell-owned keys", () => {
    for (const entries of Object.values(ART_KEYS_BY_GAME)) {
      for (const entry of entries) {
        expect(textureSizeFor(entry.key)).toBe(entry.size);
        expect(entry.key.startsWith("tile_")).toBe(false);
        expect(entry.key.startsWith("sticker_")).toBe(false);
      }
    }
  });

  it("tags every entry with its own game and holds no in-game duplicates", () => {
    for (const [gameId, entries] of Object.entries(ART_KEYS_BY_GAME)) {
      const keys = entries.map((entry) => entry.key);
      expect(new Set(keys).size, gameId).toBe(keys.length);
      for (const entry of entries) {
        expect(entry.gameId).toBe(gameId);
      }
    }
  });

  it("uses only the icon and card tiers", () => {
    const sizes = new Set(
      Object.values(ART_KEYS_BY_GAME).flatMap((entries) => entries.map((entry) => entry.size)),
    );
    expect(sizes).toEqual(new Set([160, 256]));
  });
});

describe("artKeysInRecencyOrder (P1.T1)", () => {
  const entryFor = (gameId: string, key: string): ArtKeyEntry => ({ gameId, key, size: 256 });

  it("flattens recency-first, deduping shared keys at their most recent game", () => {
    const keysByGame: Record<string, ArtKeyEntry[]> = {
      a: [entryFor("a", "shared"), entryFor("a", "a-only")],
      b: [entryFor("b", "shared"), entryFor("b", "b-only")],
    };
    const progress = progressWith({
      a: "2026-01-02T00:00:00.000Z",
      b: "2026-01-01T00:00:00.000Z",
    });
    const flat = artKeysInRecencyOrder(keysByGame, progress, ["a", "b"]);
    expect(flat.map((entry) => entry.key)).toEqual(["shared", "a-only", "b-only"]);
    expect(flat[0]?.gameId).toBe("a");
  });

  it("falls back to grid order on a first visit and ignores unknown grid ids", () => {
    const keysByGame: Record<string, ArtKeyEntry[]> = {
      b: [entryFor("b", "kb")],
      a: [entryFor("a", "ka")],
    };
    const progress = progressWith({ a: null, b: null });
    const flat = artKeysInRecencyOrder(keysByGame, progress, ["a", "ghost", "b"]);
    expect(flat.map((entry) => entry.key)).toEqual(["ka", "kb"]);
  });
});

describe("startArtPrewarm — idle art queue (AC-1)", () => {
  const artSource = (): Record<string, ArtKeyEntry[]> => ({
    a: [
      { gameId: "a", key: "ka1", size: 256 },
      { gameId: "a", key: "ka2", size: 256 },
    ],
    b: [{ gameId: "b", key: "kb1", size: 160 }],
  });

  const recentFirst = (): PrewarmProgress =>
    progressWith({ a: "2026-01-02T00:00:00.000Z", b: "2026-01-01T00:00:00.000Z" });

  interface ArtHarness {
    queuedKeys: string[];
    queuedSet: Set<string>;
    scheduler: FakeScheduler;
  }

  const harnessWith = (
    queueKey: (entry: ArtKeyEntry) => Promise<unknown> | unknown,
    isPresent: (key: string) => boolean = () => false,
  ): ArtHarness => {
    const harness: ArtHarness = {
      queuedKeys: [],
      queuedSet: new Set(),
      scheduler: new FakeScheduler(),
    };
    startArtPrewarm({
      keysByGame: artSource(),
      gridOrder: ["a", "b"],
      getProgress: recentFirst,
      isPresent,
      queueKey: (entry) => {
        harness.queuedKeys.push(entry.key);
        return queueKey(entry);
      },
      queued: harness.queuedSet,
      scheduler: harness.scheduler,
    });
    return harness;
  };

  it("queues keys in recency order, one raster per idle slot", async () => {
    const harness = harnessWith(() => Promise.resolve());
    expect(harness.scheduler.size).toBe(1);

    harness.scheduler.fireNext();
    await settle();
    expect(harness.queuedKeys).toEqual(["ka1"]);
    expect(harness.scheduler.size).toBe(1);

    harness.scheduler.fireNext();
    await settle();
    expect(harness.queuedKeys).toEqual(["ka1", "ka2"]);
    expect(harness.scheduler.size).toBe(1);

    await runToCompletion(harness.scheduler);
    expect(harness.queuedKeys).toEqual(["ka1", "ka2", "kb1"]);
    expect(harness.scheduler.size).toBe(0);
    expect(harness.queuedSet).toEqual(new Set(["ka1", "ka2", "kb1"]));
  });

  it("skips present keys without queueing them", async () => {
    const queuedKeys: string[] = [];
    const queued = new Set<string>();
    const scheduler = new FakeScheduler();
    startArtPrewarm({
      keysByGame: artSource(),
      gridOrder: ["a", "b"],
      getProgress: recentFirst,
      isPresent: (key) => key === "ka1" || key === "kb1",
      queueKey: (entry) => {
        queuedKeys.push(entry.key);
        return Promise.resolve();
      },
      queued,
      scheduler,
    });

    await runToCompletion(scheduler);
    expect(queuedKeys).toEqual(["ka2"]);
    expect(queued).toEqual(new Set(["ka1", "ka2", "kb1"]));
  });

  it("recomputes the order each tick so a profile switch reorders mid-cycle", async () => {
    const queuedKeys: string[] = [];
    const scheduler = new FakeScheduler();
    let calls = 0;
    startArtPrewarm({
      keysByGame: {
        a: [{ gameId: "a", key: "ka", size: 256 }],
        b: [{ gameId: "b", key: "kb", size: 256 }],
        c: [{ gameId: "c", key: "kc", size: 256 }],
      },
      gridOrder: ["a", "b", "c"],
      getProgress: () => {
        calls += 1;
        return calls === 1
          ? progressWith({ a: "2026-01-02T00:00:00.000Z", b: null, c: null })
          : progressWith({ c: "2026-01-03T00:00:00.000Z", a: null, b: null });
      },
      isPresent: () => false,
      queueKey: (entry) => {
        queuedKeys.push(entry.key);
        return Promise.resolve();
      },
      scheduler,
    });

    await runToCompletion(scheduler);
    expect(queuedKeys).toEqual(["ka", "kc", "kb"]);
  });

  it("keeps exactly one queueKey in flight until it settles", async () => {
    const first = createDeferred();
    const firstLoad = vi.fn(() => first.promise);
    const secondLoad = vi.fn(() => Promise.resolve());
    const keysByGame: Record<string, ArtKeyEntry[]> = {
      a: [{ gameId: "a", key: "ka", size: 256 }],
      b: [{ gameId: "b", key: "kb", size: 256 }],
    };
    const scheduler = new FakeScheduler();
    startArtPrewarm({
      keysByGame,
      gridOrder: ["a", "b"],
      getProgress: () => progressWith({ a: null, b: null }),
      isPresent: () => false,
      queueKey: (entry) => (entry.key === "ka" ? firstLoad() : secondLoad()),
      scheduler,
    });

    scheduler.fireNext();
    expect(firstLoad).toHaveBeenCalledTimes(1);
    expect(secondLoad).not.toHaveBeenCalled();
    expect(scheduler.size).toBe(0);

    first.resolve();
    await settle();
    expect(scheduler.size).toBe(1);
  });
});

describe("startArtPrewarm — cancellation (AC-2)", () => {
  it("cancels a pending slot so no further keys queue", async () => {
    const queuedKeys: string[] = [];
    const scheduler = new FakeScheduler();
    const controller = startArtPrewarm({
      keysByGame: {
        a: [{ gameId: "a", key: "ka", size: 256 }],
        b: [{ gameId: "b", key: "kb", size: 256 }],
      },
      gridOrder: ["a", "b"],
      getProgress: () => progressWith({ a: null, b: null }),
      isPresent: () => false,
      queueKey: (entry) => {
        queuedKeys.push(entry.key);
        return Promise.resolve();
      },
      scheduler,
    });

    scheduler.fireNext();
    await settle();
    expect(queuedKeys).toEqual(["ka"]);

    controller.cancel();
    expect(scheduler.size).toBe(0);
    await runToCompletion(scheduler);
    expect(queuedKeys).toEqual(["ka"]);
    controller.cancel();
  });

  it("cancelling during an in-flight queue discards the outcome", async () => {
    const inFlight = createDeferred();
    const load = vi.fn(() => inFlight.promise);
    const scheduler = new FakeScheduler();
    const queued = new Set<string>();
    const controller = startArtPrewarm({
      keysByGame: { a: [{ gameId: "a", key: "ka", size: 256 }] },
      gridOrder: ["a"],
      getProgress: () => progressWith({ a: null }),
      isPresent: () => false,
      queueKey: () => load(),
      queued,
      scheduler,
    });

    scheduler.fireNext();
    controller.cancel();

    inFlight.resolve();
    await settle();
    expect(scheduler.size).toBe(0);
    expect(queued).toEqual(new Set());
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("leaves a cancelled key perfectly usable for a direct tap load", async () => {
    const inFlight = createDeferred();
    const load = vi.fn(() => inFlight.promise);
    const scheduler = new FakeScheduler();
    const controller = startArtPrewarm({
      keysByGame: { a: [{ gameId: "a", key: "ka", size: 256 }] },
      gridOrder: ["a"],
      getProgress: () => progressWith({ a: null }),
      isPresent: () => false,
      queueKey: () => load(),
      scheduler,
    });
    scheduler.fireNext();
    controller.cancel();

    inFlight.resolve();
    await expect(load()).resolves.toBeUndefined();
    expect(load).toHaveBeenCalledTimes(2);
  });
});

describe("startArtPrewarm — failure handling (AC-4)", () => {
  it("swallows a rejected queue, continues, and retries it on the next pass", async () => {
    const queuedKeys: string[] = [];
    const queued = new Set<string>();
    const attempts = new Map<string, number>();
    const fallible = (entry: ArtKeyEntry): Promise<void> => {
      queuedKeys.push(entry.key);
      const seen = (attempts.get(entry.key) ?? 0) + 1;
      attempts.set(entry.key, seen);
      if (entry.key === "ka1" && seen === 1) {
        return Promise.reject(new Error("raster failed"));
      }
      return Promise.resolve();
    };

    const firstRun = new FakeScheduler();
    startArtPrewarm({
      keysByGame: {
        a: [
          { gameId: "a", key: "ka1", size: 256 },
          { gameId: "a", key: "ka2", size: 256 },
        ],
      },
      gridOrder: ["a"],
      getProgress: () => progressWith({ a: null }),
      isPresent: () => false,
      queueKey: fallible,
      queued,
      scheduler: firstRun,
    });
    await runToCompletion(firstRun);

    expect(queuedKeys).toEqual(["ka1", "ka2"]);
    expect(queued).toEqual(new Set(["ka2"]));

    const secondRun = new FakeScheduler();
    startArtPrewarm({
      keysByGame: {
        a: [
          { gameId: "a", key: "ka1", size: 256 },
          { gameId: "a", key: "ka2", size: 256 },
        ],
      },
      gridOrder: ["a"],
      getProgress: () => progressWith({ a: null }),
      isPresent: () => false,
      queueKey: fallible,
      queued,
      scheduler: secondRun,
    });
    await runToCompletion(secondRun);

    expect(queuedKeys).toEqual(["ka1", "ka2", "ka1"]);
    expect(queued).toEqual(new Set(["ka1", "ka2"]));
  });

  it("swallows a synchronous queue throw with no retry storm in the pass", async () => {
    const queuedKeys: string[] = [];
    const scheduler = new FakeScheduler();
    startArtPrewarm({
      keysByGame: {
        a: [
          { gameId: "a", key: "ka", size: 256 },
          { gameId: "a", key: "kb", size: 256 },
        ],
      },
      gridOrder: ["a"],
      getProgress: () => progressWith({ a: null }),
      isPresent: () => false,
      queueKey: (entry) => {
        queuedKeys.push(entry.key);
        if (entry.key === "ka") {
          throw new Error("sync raster failure");
        }
        return Promise.resolve();
      },
      scheduler,
    });

    await runToCompletion(scheduler);
    expect(queuedKeys).toEqual(["ka", "kb"]);
    expect(scheduler.size).toBe(0);
  });

  it("supports a synchronous queueKey and drains silently when everything is present", async () => {
    const queuedKeys: string[] = [];
    const scheduler = new FakeScheduler();
    startArtPrewarm({
      keysByGame: { a: [{ gameId: "a", key: "ka", size: 256 }] },
      gridOrder: ["a", "ghost"],
      getProgress: () => progressWith({ a: null }),
      isPresent: () => true,
      queueKey: (entry: ArtKeyEntry) => {
        queuedKeys.push(entry.key);
      },
      scheduler,
    });

    await runToCompletion(scheduler);
    expect(queuedKeys).toEqual([]);
    expect(scheduler.size).toBe(0);
  });
});
