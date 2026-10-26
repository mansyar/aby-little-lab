import { afterEach, describe, expect, it, vi } from "vitest";
import {
  defaultIdleScheduler,
  type IdleScheduler,
  type PrewarmEntry,
  type PrewarmProgress,
  recencyFirstOrder,
  startPrewarm,
} from "../../../game/hub/prewarm";

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
