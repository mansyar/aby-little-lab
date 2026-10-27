import { describe, expect, it, vi } from "vitest";
import {
  createGameLaunch,
  type GameLaunchController,
  type GameLaunchCue,
  type GameLaunchDeps,
} from "../../../game/hub/gameLaunch";
import type { PlayTime } from "../../../types";

/** Retry cue fake: records every show and counts destroys. */
class FakeCue implements GameLaunchCue {
  shown: { x: number; y: number; onRetry: () => void }[] = [];
  destroyed = 0;
  show(deps: { x: number; y: number; onRetry: () => void }): void {
    this.shown.push(deps);
  }
  isActive(): boolean {
    return this.shown.length > this.destroyed;
  }
  destroy(): void {
    this.destroyed += 1;
  }
}

/** Resolvable promise the test settles to control a load in flight. */
function createDeferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
} {
  let resolve = (_value: T): void => {};
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

/** Play-time record with the given minutes used against a 60-minute limit. */
const playTimeWith = (usedMinutes: number): PlayTime => ({
  limitMinutes: 60,
  usedMinutes,
  lastUsedDate: "2026-10-27",
});

interface Harness {
  controller: GameLaunchController;
  deps: GameLaunchDeps;
  cues: FakeCue[];
}

/** Launcher wired to spies; two tiles keep the single-flight test honest. */
function setup(overrides: Partial<GameLaunchDeps> = {}): Harness {
  const cues: FakeCue[] = [];
  const deps: GameLaunchDeps = {
    tiles: [
      { sceneKey: "scene-a", gameId: "shape-sorter" },
      { sceneKey: "scene-b", gameId: "animal-trace" },
    ],
    loadScene: vi.fn(async () => true),
    cancelPrewarm: vi.fn(),
    syncPrewarm: vi.fn(),
    isTimeUp: vi.fn(() => false),
    setNavLocked: vi.fn(),
    startSession: vi.fn(),
    recordPlay: vi.fn(),
    getActiveProfileId: vi.fn(() => "profile-1"),
    getPlayTime: vi.fn(() => playTimeWith(0)),
    transition: vi.fn(),
    showNudge: vi.fn(),
    createCue: vi.fn(() => {
      const cue = new FakeCue();
      cues.push(cue);
      return cue;
    }),
    getFallbackCenter: vi.fn(() => ({ x: 400, y: 300 })),
    startAudio: vi.fn(),
    ...overrides,
  };
  return { controller: createGameLaunch(deps), deps, cues };
}

describe("gameLaunch", () => {
  it("opens the game on a successful load", async () => {
    const { controller, deps } = setup();
    await controller.openGame(0);

    expect(deps.loadScene).toHaveBeenCalledTimes(1);
    expect(deps.loadScene).toHaveBeenCalledWith("scene-a");
    expect(deps.startSession).toHaveBeenCalledWith("profile-1");
    expect(deps.recordPlay).toHaveBeenCalledWith("shape-sorter");
    expect(deps.transition).toHaveBeenCalledWith("scene-a");
    expect(deps.showNudge).not.toHaveBeenCalled();
    expect(controller.cue).toBeUndefined();
    // Navigating away: the in-flight flag stays set until shutdown.
    expect(controller.isLaunching()).toBe(true);
  });

  it("ignores a second launch while one is in flight", async () => {
    const deferred = createDeferred<boolean>();
    const { controller, deps } = setup({
      loadScene: vi.fn(() => deferred.promise),
    });

    const flight = controller.openGame(0);
    void controller.openGame(1);
    deferred.resolve(true);
    await flight;

    expect(deps.loadScene).toHaveBeenCalledTimes(1);
    expect(deps.transition).toHaveBeenCalledTimes(1);
    expect(deps.transition).toHaveBeenCalledWith("scene-a");
    expect(deps.recordPlay).toHaveBeenCalledTimes(1);
  });

  it("renders a load inert after the visit ends", async () => {
    const deferred = createDeferred<boolean>();
    const { controller, deps } = setup({
      loadScene: vi.fn(() => deferred.promise),
    });

    const flight = controller.openGame(0);
    controller.endVisit();
    deferred.resolve(true);
    await flight;

    expect(deps.transition).not.toHaveBeenCalled();
    expect(deps.startSession).not.toHaveBeenCalled();
    expect(deps.recordPlay).not.toHaveBeenCalled();
    expect(deps.showNudge).not.toHaveBeenCalled();
    expect(controller.cue).toBeUndefined();
  });

  it("starts a fresh visit that launches again", async () => {
    const { controller, deps } = setup();
    controller.endVisit();
    expect(controller.isLaunching()).toBe(false);

    controller.beginVisit();
    await controller.openGame(1);

    expect(deps.loadScene).toHaveBeenCalledWith("scene-b");
    expect(deps.transition).toHaveBeenCalledWith("scene-b");
  });

  it("blocks the launch when time is up", async () => {
    const { controller, deps } = setup({ isTimeUp: () => true });
    await controller.openGame(0);

    expect(deps.loadScene).toHaveBeenCalledWith("scene-a");
    expect(deps.transition).not.toHaveBeenCalled();
    expect(deps.startSession).not.toHaveBeenCalled();
    expect(deps.recordPlay).not.toHaveBeenCalled();
    expect(deps.showNudge).not.toHaveBeenCalled();
    expect(deps.setNavLocked).toHaveBeenCalledWith(false);
    expect(controller.cue).toBeUndefined();
    expect(controller.isLaunching()).toBe(false);
  });

  it("shows the retry cue and resumes prewarm when the load fails", async () => {
    const { controller, deps, cues } = setup({
      loadScene: vi.fn(async () => false),
    });
    await controller.openGame(0, { x: 111, y: 222 });

    expect(cues).toHaveLength(1);
    expect(cues[0].shown).toHaveLength(1);
    expect(cues[0].shown[0].x).toBe(111);
    expect(cues[0].shown[0].y).toBe(222);
    expect(deps.setNavLocked).toHaveBeenCalledWith(false);
    expect(deps.syncPrewarm).toHaveBeenCalledTimes(1);
    expect(deps.transition).not.toHaveBeenCalled();
    expect(deps.startSession).not.toHaveBeenCalled();
    expect(deps.recordPlay).not.toHaveBeenCalled();
    expect(controller.isLaunching()).toBe(false);
  });

  it("anchors the cue at the scene centre when the tap carried no tile", () => {
    const { controller, cues } = setup();
    controller.showLoadCue(0);

    expect(cues).toHaveLength(1);
    expect(cues[0].shown[0].x).toBe(400);
    expect(cues[0].shown[0].y).toBe(300);
  });

  it("retries through the cue with the tap lock held", async () => {
    const { controller, deps, cues } = setup({
      loadScene: vi.fn().mockResolvedValueOnce(false).mockResolvedValue(true),
    });
    await controller.openGame(0);

    const retry = cues[0].shown[0].onRetry;
    retry();
    await vi.waitFor(() => {
      expect(deps.transition).toHaveBeenCalledWith("scene-a");
    });

    expect(deps.setNavLocked).toHaveBeenCalledWith(true);
    expect(deps.loadScene).toHaveBeenCalledTimes(2);
    expect(deps.startSession).toHaveBeenCalledWith("profile-1");
    expect(deps.recordPlay).toHaveBeenCalledWith("shape-sorter");
  });

  it("shows the play-time nudge instead of transitioning near the limit", async () => {
    const { controller, deps } = setup({
      getPlayTime: () => playTimeWith(59),
    });
    await controller.openGame(0);

    expect(deps.startSession).toHaveBeenCalledWith("profile-1");
    expect(deps.recordPlay).toHaveBeenCalledWith("shape-sorter");
    expect(deps.showNudge).toHaveBeenCalledWith(0);
    expect(deps.transition).not.toHaveBeenCalled();
  });

  it("unlocks audio on the tap gesture before opening", async () => {
    const { controller, deps } = setup();
    controller.activateTile(0, { x: 10, y: 20 });
    await vi.waitFor(() => {
      expect(deps.transition).toHaveBeenCalledWith("scene-a");
    });

    expect(deps.startAudio).toHaveBeenCalledTimes(1);
    expect(deps.loadScene).toHaveBeenCalledWith("scene-a");
  });
});
