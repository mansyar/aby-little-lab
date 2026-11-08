import type Phaser from "phaser";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CrashEntry } from "../../types";

/**
 * `recordCrash` is the module under a `try` in the handler, so the test has to
 * own it: `vi.hoisted` keeps one stable spy across the per-test module resets
 * that give each case a fresh `installed` flag.
 */
const reportCrash = vi.hoisted(() => vi.fn());
vi.mock("../../utils/storage", () => ({ recordCrash: reportCrash }));

const FIXED_NOW = new Date("2026-08-05T12:00:00.000Z");

type Listener = (event: never) => void;

interface FakeTarget {
  addEventListener: ReturnType<typeof vi.fn>;
  target: Pick<Window, "addEventListener">;
  fire(type: string, event: unknown): void;
}

function makeTarget(): FakeTarget {
  const listeners = new Map<string, Listener>();
  const addEventListener = vi.fn((type: string, listener: Listener) => {
    listeners.set(type, listener);
  });
  return {
    addEventListener,
    // A `vi.fn` cannot express the overloaded DOM signature; the cast is the
    // narrowest one that keeps `installErrorCapture`'s parameter honest.
    target: { addEventListener } as unknown as Pick<Window, "addEventListener">,
    fire(type, event) {
      listeners.get(type)?.(event as never);
    },
  };
}

function makeGame(): { game: Phaser.Game; start: ReturnType<typeof vi.fn> } {
  const start = vi.fn();
  return { game: { scene: { start } } as unknown as Phaser.Game, start };
}

/** A fresh module instance, so each case starts with no installation. */
async function loadCapture(): Promise<typeof import("../../game/errorCapture")> {
  vi.resetModules();
  return import("../../game/errorCapture");
}

function errorEvent(error: unknown): ErrorEvent {
  return new ErrorEvent("error", { error, message: String(error) });
}

describe("installErrorCapture", () => {
  beforeEach(() => {
    reportCrash.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("attaches both listeners and records an uncaught error", async () => {
    const { installErrorCapture } = await loadCapture();
    const { game } = makeGame();
    const fake = makeTarget();

    installErrorCapture(game, {
      target: fake.target,
      now: () => FIXED_NOW,
      activeSceneKey: () => "Hub",
      reload: vi.fn(),
    });
    fake.fire("error", errorEvent(new Error("boom")));

    expect(fake.addEventListener).toHaveBeenCalledWith("error", expect.any(Function));
    expect(fake.addEventListener).toHaveBeenCalledWith("unhandledrejection", expect.any(Function));
    expect(reportCrash).toHaveBeenCalledWith({
      at: FIXED_NOW.toISOString(),
      kind: "error",
      message: "boom",
      stack: expect.stringContaining("Error: boom"),
    });
  });

  it("records a rejection with its reason and the rejection kind", async () => {
    const { installErrorCapture } = await loadCapture();
    const { game } = makeGame();
    const fake = makeTarget();

    installErrorCapture(game, {
      target: fake.target,
      now: () => FIXED_NOW,
      activeSceneKey: () => "Hub",
      reload: vi.fn(),
    });
    fake.fire("unhandledrejection", { reason: "something rejected" });

    expect(reportCrash).toHaveBeenCalledWith({
      at: FIXED_NOW.toISOString(),
      kind: "rejection",
      message: "something rejected",
      stack: "",
    });
  });

  it("records a plain error event, which carries no ErrorEvent fields", async () => {
    const { installErrorCapture } = await loadCapture();
    const { game } = makeGame();
    const fake = makeTarget();

    installErrorCapture(game, {
      target: fake.target,
      now: () => FIXED_NOW,
      activeSceneKey: () => "Hub",
      reload: vi.fn(),
    });
    fake.fire("error", new Event("error"));

    expect(reportCrash).toHaveBeenCalledTimes(1);
    expect(reportCrash).toHaveBeenCalledWith(expect.objectContaining({ kind: "error" }));
  });

  it("installs nothing on a second call", async () => {
    const { installErrorCapture } = await loadCapture();
    const { game } = makeGame();
    const first = makeTarget();
    const second = makeTarget();

    installErrorCapture(game, { target: first.target, activeSceneKey: () => "Hub" });
    installErrorCapture(game, { target: second.target, activeSceneKey: () => "Hub" });

    expect(first.addEventListener).toHaveBeenCalledTimes(2);
    expect(second.addEventListener).not.toHaveBeenCalled();
  });

  it("still starts the card, without throwing, when the recorder itself fails", async () => {
    const { installErrorCapture } = await loadCapture();
    const { game, start } = makeGame();
    const fake = makeTarget();
    reportCrash.mockImplementation(() => {
      throw new Error("the recorder is broken");
    });

    installErrorCapture(game, {
      target: fake.target,
      now: () => FIXED_NOW,
      activeSceneKey: () => "Hub",
      reload: vi.fn(),
    });

    expect(() => fake.fire("error", errorEvent(new Error("boom")))).not.toThrow();
    expect(start).toHaveBeenCalledWith("Recover");
  });

  it("replaces the running scene with the card, so a scene that throws every frame stops", async () => {
    const { installErrorCapture } = await loadCapture();
    const { game, start } = makeGame();
    const fake = makeTarget();
    const reload = vi.fn();

    installErrorCapture(game, {
      target: fake.target,
      now: () => FIXED_NOW,
      activeSceneKey: () => "ShapeSorter",
      reload,
    });
    fake.fire("error", errorEvent(new Error("boom")));

    expect(start).toHaveBeenCalledWith("Recover");
    expect(reload).not.toHaveBeenCalled();
  });

  it("does not restart the card when the crash came from inside it", async () => {
    const { installErrorCapture } = await loadCapture();
    const { game, start } = makeGame();
    const fake = makeTarget();
    const reload = vi.fn();

    installErrorCapture(game, {
      target: fake.target,
      now: () => FIXED_NOW,
      activeSceneKey: () => "Recover",
      reload,
    });
    fake.fire("error", errorEvent(new Error("boom")));

    expect(start).not.toHaveBeenCalled();
    expect(reload).not.toHaveBeenCalled();
  });

  it("reloads once when no scene ever came up, then only logs the second crash", async () => {
    const { installErrorCapture } = await loadCapture();
    const { game, start } = makeGame();
    const fake = makeTarget();
    const reload = vi.fn();
    const store = new Map<string, string>();
    vi.stubGlobal("window", {
      sessionStorage: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => {
          store.set(key, value);
        },
      },
      location: { reload },
    });

    // No `reload` dep: the default is the real one-shot guard (FR-7).
    installErrorCapture(game, {
      target: fake.target,
      now: () => FIXED_NOW,
      activeSceneKey: () => null,
    });
    fake.fire("error", errorEvent(new Error("first")));
    fake.fire("error", errorEvent(new Error("second")));

    expect(reload).toHaveBeenCalledTimes(1);
    expect(start).not.toHaveBeenCalled();
    // The second crash is still logged: it is the only record of the loop.
    expect(reportCrash).toHaveBeenCalledTimes(2);
  });

  it("reads the message when the event carries no error object", async () => {
    const { installErrorCapture } = await loadCapture();
    const { game } = makeGame();
    const fake = makeTarget();

    installErrorCapture(game, {
      target: fake.target,
      now: () => FIXED_NOW,
      activeSceneKey: () => "Hub",
      reload: vi.fn(),
    });
    fake.fire("error", new ErrorEvent("error", { message: "a message only" }));

    expect(reportCrash).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "error", message: "a message only" }),
    );
  });

  it("falls back to the real window, clock and reload guard when nothing is injected", async () => {
    const { installErrorCapture } = await loadCapture();
    const { game, start } = makeGame();
    const reload = vi.fn();
    const store = new Map<string, string>();
    const listeners = new Map<string, Listener>();
    vi.stubGlobal("window", {
      addEventListener: vi.fn((type: string, listener: Listener) => {
        listeners.set(type, listener);
      }),
      sessionStorage: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => {
          store.set(key, value);
        },
      },
      location: { reload },
    });

    // No deps at all: `main.ts` passes one, but the defaults are what a caller
    // that forgets them gets, and they must still work.
    installErrorCapture(game);
    listeners.get("error")?.(errorEvent(new Error("boom")) as never);

    expect(start).not.toHaveBeenCalled();
    expect(reload).toHaveBeenCalledTimes(1);
    const [entry] = reportCrash.mock.calls[0] as [CrashEntry];
    // The ambient clock rather than a stub: the stamp still parses as an instant.
    expect(Number.isNaN(Date.parse(entry.at))).toBe(false);
  });
});

describe("runningSceneKey", () => {
  it("is null before the first boot, when Phaser shows nothing", async () => {
    const { runningSceneKey } = await loadCapture();
    const game = { scene: { getScenes: () => [] } } as unknown as Phaser.Game;

    expect(runningSceneKey(game)).toBeNull();
  });

  it("reports the key of the scene that is on screen", async () => {
    const { runningSceneKey } = await loadCapture();
    const game = {
      scene: { getScenes: () => [{ scene: { key: "Hub" } }] },
    } as unknown as Phaser.Game;

    expect(runningSceneKey(game)).toBe("Hub");
  });
});
