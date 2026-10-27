import { describe, expect, it, vi } from "vitest";
import {
  createHubPrewarm,
  type HubPrewarmDeps,
  PREWARM_START_DELAY,
} from "../../../game/hub/hubPrewarm";
import {
  ART_KEYS_BY_GAME,
  type ArtKeyEntry,
  type IdleScheduler,
  type PrewarmProgress,
  type StartArtPrewarmOptions,
  type StartPrewarmOptions,
} from "../../../game/hub/prewarm";

/**
 * Seeded unit fixtures for the prewarm orchestration. Real pass engines run
 * behind manual schedulers unless a test overrides the starters; all fixtures
 * are plain deterministic values — no randomness.
 */

/** Minimal structural progress record builder (timestamps are ISO strings). */
const progressWith = (stamps: Record<string, string | null>): PrewarmProgress =>
  Object.fromEntries(Object.entries(stamps).map(([key, lastPlayedAt]) => [key, { lastPlayedAt }]));

/** Manual idle scheduler the test drains slot by slot. */
class FakeScheduler implements IdleScheduler {
  private nextHandle = 1;
  readonly pending = new Map<number, () => void>();

  request(callback: () => void): number {
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
    scheduler.fireNext();
    await settle();
  }
}

/** Controllable deps harness: gates, progress, loaders, and engine handles. */
function createHarness() {
  const chunkScheduler = new FakeScheduler();
  const artScheduler = new FakeScheduler();
  const chunkCalls: string[] = [];
  const queuedSvg: Array<{ key: string; dataUri: string }> = [];
  const settledHandlers: Array<() => void> = [];
  const delays: Array<{ ms: number; callback: () => void; removed: boolean }> = [];
  let progress: PrewarmProgress = {};
  let timeUp = false;
  let launching = false;
  let hidden = false;
  let svgImpl: (entry: ArtKeyEntry) => Promise<string | undefined> = () =>
    Promise.resolve("<svg></svg>");
  const present = new Set<string>();

  const deps: HubPrewarmDeps = {
    tiles: [
      { sceneKey: "Alpha", gameId: "g-a" },
      { sceneKey: "Beta", gameId: "g-b" },
      { sceneKey: "Gamma", gameId: "g-c" },
      { sceneKey: "Delta", gameId: "g-x" },
    ],
    getSceneLoaders: () => ({
      Alpha: () => {
        chunkCalls.push("Alpha");
        return Promise.resolve("Alpha");
      },
      Beta: () => {
        chunkCalls.push("Beta");
        return Promise.resolve("Beta");
      },
      Gamma: () => {
        chunkCalls.push("Gamma");
        return Promise.resolve("Gamma");
      },
    }),
    getProgress: () => progress,
    isTimeUp: () => timeUp,
    isLaunching: () => launching,
    isHidden: () => hidden,
    resolveArtSvg: (entry) => svgImpl(entry),
    isPresent: (key) => present.has(key),
    queueSvg: (entry, dataUri) => {
      queuedSvg.push({ key: entry.key, dataUri });
    },
    onLoadSettled: (done) => {
      settledHandlers.push(done);
    },
    offLoadSettled: (done) => {
      const index = settledHandlers.indexOf(done);
      if (index >= 0) settledHandlers.splice(index, 1);
    },
    startLoad: () => {},
    delayStart: (ms, callback) => {
      const rec = { ms, callback, removed: false };
      delays.push(rec);
      return {
        remove: () => {
          rec.removed = true;
        },
      };
    },
    chunkScheduler,
    artScheduler,
  };

  return {
    deps,
    chunkScheduler,
    artScheduler,
    chunkCalls,
    queuedSvg,
    settledHandlers,
    delays,
    present,
    setProgress: (next: PrewarmProgress) => {
      progress = next;
    },
    setTimeUp: (next: boolean) => {
      timeUp = next;
    },
    setLaunching: (next: boolean) => {
      launching = next;
    },
    setHidden: (next: boolean) => {
      hidden = next;
    },
    setSvgImpl: (next: (entry: ArtKeyEntry) => Promise<string | undefined>) => {
      svgImpl = next;
    },
    fireDelay: () => {
      const armed = delays.filter((delay) => !delay.removed).at(-1);
      if (!armed) throw new Error("the controller armed no prewarm start");
      armed.callback();
    },
    fireSettled: () => {
      const handler = settledHandlers.at(-1);
      if (!handler) throw new Error("the controller registered no load handler");
      handler();
    },
  };
}

describe("createHubPrewarm", () => {
  it("waits out the entrance delay, then starts both passes together", () => {
    expect(PREWARM_START_DELAY).toBe(1200);
    const harness = createHarness();
    const controller = createHubPrewarm(harness.deps);

    controller.syncPrewarm();
    expect(harness.delays).toHaveLength(1);
    expect(harness.delays[0]?.ms).toBe(1200);
    expect(harness.chunkScheduler.size).toBe(0);
    expect(harness.artScheduler.size).toBe(0);

    // A second sync while armed does not arm again.
    controller.syncPrewarm();
    expect(harness.delays).toHaveLength(1);

    harness.fireDelay();
    expect(harness.chunkScheduler.size).toBe(1);
    expect(harness.artScheduler.size).toBe(1);

    // A sync while the passes run does not re-arm the delay.
    controller.syncPrewarm();
    expect(harness.delays).toHaveLength(1);
  });

  it.each([
    ["play-time lock", (harness: ReturnType<typeof createHarness>) => harness.setTimeUp(true)],
    ["hidden tab", (harness: ReturnType<typeof createHarness>) => harness.setHidden(true)],
    ["launch in flight", (harness: ReturnType<typeof createHarness>) => harness.setLaunching(true)],
  ])("starts nothing under the %s", (_name, applyGate) => {
    const harness = createHarness();
    applyGate(harness);
    const controller = createHubPrewarm(harness.deps);

    controller.syncPrewarm();

    expect(harness.delays).toHaveLength(0);
    expect(harness.chunkScheduler.size).toBe(0);
    expect(harness.artScheduler.size).toBe(0);
  });

  it("stops the armed start when a gate arrives, and the late start warms nothing", () => {
    const harness = createHarness();
    const startChunks = vi.fn(() => ({ cancel: vi.fn() }));
    const startRaster = vi.fn(() => ({ cancel: vi.fn() }));
    const controller = createHubPrewarm({
      ...harness.deps,
      startChunkPass: startChunks,
      startRasterPass: startRaster,
    });

    controller.syncPrewarm();
    expect(harness.delays).toHaveLength(1);

    harness.setTimeUp(true);
    controller.syncPrewarm();
    expect(harness.delays[0]?.removed).toBe(true);

    // The removed timer's callback still runs to completion in the worst case,
    // but the gates refuse both passes.
    harness.delays[0]?.callback();
    expect(startChunks).not.toHaveBeenCalled();
    expect(startRaster).not.toHaveBeenCalled();
  });

  it("orders chunk entries recency-first and skips tiles without a loader", () => {
    const harness = createHarness();
    harness.setProgress(progressWith({ "g-b": "2026-10-20", "g-c": "2026-10-10" }));
    const startChunks = vi.fn((_options: StartPrewarmOptions) => ({ cancel: vi.fn() }));
    const controller = createHubPrewarm({
      ...harness.deps,
      startChunkPass: startChunks,
      startRasterPass: () => ({ cancel: vi.fn() }),
    });

    controller.syncPrewarm();
    harness.fireDelay();

    const options = startChunks.mock.calls[0]?.[0];
    if (!options) throw new Error("no chunk pass was started");
    // g-b then g-c by recency; never-played g-a follows in grid order; g-x
    // has no loader (Delta) so there is nothing to warm for it.
    expect(options.entries.map((entry) => entry.key)).toEqual(["Beta", "Gamma", "Alpha"]);
    expect(options.imported).toBeInstanceOf(Set);
  });

  it("passes the art source by reference with a shared queued set", () => {
    const harness = createHarness();
    const startRaster = vi.fn((_options: StartArtPrewarmOptions) => ({ cancel: vi.fn() }));
    const controller = createHubPrewarm({
      ...harness.deps,
      startChunkPass: () => ({ cancel: vi.fn() }),
      startRasterPass: startRaster,
    });

    controller.syncPrewarm();
    harness.fireDelay();

    const options = startRaster.mock.calls[0]?.[0];
    if (!options) throw new Error("no art pass was started");
    expect(options.keysByGame).toBe(ART_KEYS_BY_GAME);
    expect(options.gridOrder).toEqual(["g-a", "g-b", "g-c", "g-x"]);
    expect(options.queued).toBeInstanceOf(Set);
  });

  it("cancel bumps the generation so a late resolution queues nothing", async () => {
    const harness = createHarness();
    let releaseSvg: ((svg: string | undefined) => void) | undefined;
    harness.setSvgImpl(
      () =>
        new Promise<string | undefined>((resolve) => {
          releaseSvg = resolve;
        }),
    );
    const controller = createHubPrewarm({
      ...harness.deps,
      keysByGame: { "g-a": [{ gameId: "g-a", key: "k1", size: 256 }] },
    });

    controller.syncPrewarm();
    harness.fireDelay();
    harness.artScheduler.fireNext();
    await settle();
    expect(harness.queuedSvg).toHaveLength(0);

    controller.cancelPrewarm();
    // The pending chunk slot is dropped with the pass.
    expect(harness.chunkScheduler.size).toBe(0);

    releaseSvg?.("<svg></svg>");
    await settle();
    await settle();
    expect(harness.queuedSvg).toHaveLength(0);
    expect(harness.settledHandlers).toHaveLength(0);
  });

  it("queues one key per settled load at the key's tier", async () => {
    const harness = createHarness();
    const controller = createHubPrewarm({
      ...harness.deps,
      keysByGame: {
        "g-a": [
          { gameId: "g-a", key: "k1", size: 256 },
          { gameId: "g-a", key: "k2", size: 160 },
        ],
      },
    });

    controller.syncPrewarm();
    harness.fireDelay();
    harness.artScheduler.fireNext();
    await settle();

    expect(harness.queuedSvg).toHaveLength(1);
    expect(harness.queuedSvg[0]?.key).toBe("k1");
    expect(harness.queuedSvg[0]?.dataUri.startsWith("data:image/svg+xml;base64,")).toBe(true);

    // The engine holds the next tick until the loader reports the file done.
    harness.fireSettled();
    await settle();
    harness.artScheduler.fireNext();
    await settle();

    expect(harness.queuedSvg.map((entry) => entry.key)).toEqual(["k1", "k2"]);
  });

  it("restart resumes with already-warm keys skipped", async () => {
    const harness = createHarness();
    const startRaster = vi.fn(() => ({ cancel: vi.fn() }));
    const controller = createHubPrewarm({ ...harness.deps, startRasterPass: startRaster });

    controller.syncPrewarm();
    harness.fireDelay();
    await runToCompletion(harness.chunkScheduler);
    expect(harness.chunkCalls).toEqual(["Alpha", "Beta", "Gamma"]);

    controller.restartPrewarm();
    expect(startRaster).toHaveBeenCalledTimes(2);
    await runToCompletion(harness.chunkScheduler);

    // The shared imported set skips what already landed: no reloads.
    expect(harness.chunkCalls).toEqual(["Alpha", "Beta", "Gamma"]);
  });
});
