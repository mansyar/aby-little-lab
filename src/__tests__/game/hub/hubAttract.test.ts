import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ATTRACT_WIGGLE_COUNT,
  createHubAttract,
  DECORATION_COUNT,
  type HubAttractController,
  type HubAttractDeps,
  type HubAttractMascot,
  IDLE_ATTRACT_DELAY,
  IDLE_CALL_INTERVAL,
} from "../../../game/hub/hubAttract";
import { type MockFn, MockScene, mockRegistry } from "../../helpers/phaserMock";

/** Casts the shared mock scene to the Phaser.Scene shape the module expects. */
function asScene(mock: MockScene): Phaser.Scene {
  return mock as unknown as Phaser.Scene;
}

/** Mascot fake: records greetings, cheers, loops, waves, and destroys. */
class FakeMascot implements HubAttractMascot {
  greeted = 0;
  cheered = 0;
  looped = 0;
  waved = 0;
  destroyed = 0;
  flapGreeting(): void {
    this.greeted += 1;
  }
  cheer(): void {
    this.cheered += 1;
  }
  idleLoop(): void {
    this.looped += 1;
  }
  wave(): void {
    this.waved += 1;
  }
  destroy(): void {
    this.destroyed += 1;
  }
}

interface Harness {
  controller: HubAttractController;
  deps: HubAttractDeps;
  scene: MockScene;
  mascots: FakeMascot[];
  targets: Phaser.GameObjects.Rectangle[];
}

function setup(overrides: Partial<HubAttractDeps> = {}): Harness {
  const scene = new MockScene();
  const mascots: FakeMascot[] = [];
  const targets = [0, 1, 2].map(() => ({}) as unknown as Phaser.GameObjects.Rectangle);
  const deps: HubAttractDeps = {
    scene: asScene(scene),
    getAttractTargets: vi.fn((): readonly Phaser.GameObjects.Rectangle[] => targets),
    playIdleCall: vi.fn(),
    isReducedMotion: vi.fn((): boolean => false),
    createMascot: vi.fn((): HubAttractMascot => {
      const mascot = new FakeMascot();
      mascots.push(mascot);
      return mascot;
    }),
    ...overrides,
  };
  return { controller: createHubAttract(deps), deps, scene, mascots, targets };
}

/** Fires the most recent idle-attract timer callback. */
function fireLastTimer(scene: MockScene): void {
  const delayedCall = scene.time.delayedCall as MockFn;
  const calls = delayedCall.mock.calls as unknown[][];
  (calls[calls.length - 1][1] as () => void)();
}

beforeEach(() => {
  mockRegistry.length = 0;
});

describe("createMascot", () => {
  it("greets then settles into the idle loop without cheering", () => {
    const { controller, mascots } = setup();
    controller.createMascot();
    expect(mascots).toHaveLength(1);
    expect(mascots[0].greeted).toBe(1);
    expect(mascots[0].cheered).toBe(0);
    expect(mascots[0].looped).toBe(1);
  });

  it("cheers when the visit follows a newly earned sticker", () => {
    const { controller, mascots } = setup();
    controller.createMascot("shape-sorter");
    expect(mascots[0].cheered).toBe(1);
  });

  it("waves the placed mascot and stays silent before one is placed", () => {
    const { controller, mascots } = setup();
    expect(() => controller.waveMascot()).not.toThrow();
    controller.createMascot();
    controller.waveMascot();
    expect(mascots[0].waved).toBe(1);
  });
});

describe("idle attract", () => {
  it("plays the call, wiggles a rotating pick, and re-arms on the interval", () => {
    const { controller, deps, scene } = setup();
    controller.scheduleIdleAttract();
    expect(scene.time.delayedCall as MockFn).toHaveBeenCalledWith(
      IDLE_ATTRACT_DELAY,
      expect.any(Function),
    );
    fireLastTimer(scene);
    expect(deps.playIdleCall).toHaveBeenCalledTimes(1);
    expect(scene.tweens.add as MockFn).toHaveBeenCalledTimes(ATTRACT_WIGGLE_COUNT);
    expect(scene.time.delayedCall as MockFn).toHaveBeenLastCalledWith(
      IDLE_CALL_INTERVAL,
      expect.any(Function),
    );
  });

  it("starts the wiggle cue only once per idle period", () => {
    const { controller, deps, scene } = setup();
    controller.scheduleIdleAttract();
    fireLastTimer(scene);
    fireLastTimer(scene);
    expect(deps.playIdleCall).toHaveBeenCalledTimes(2);
    expect(scene.tweens.add as MockFn).toHaveBeenCalledTimes(ATTRACT_WIGGLE_COUNT);
  });

  it("re-arms the timer after any pointer input", () => {
    const { controller, scene } = setup();
    controller.scheduleIdleAttract();
    const timerCount = (scene.time.delayedCall as MockFn).mock.calls.length;
    controller.resetIdleAttract();
    expect(scene.time.delayedCall as MockFn).toHaveBeenCalledTimes(timerCount + 1);
    expect(scene.time.delayedCall as MockFn).toHaveBeenLastCalledWith(
      IDLE_ATTRACT_DELAY,
      expect.any(Function),
    );
  });

  it("stays inert when no timer is pending", () => {
    const { controller, deps, scene } = setup();
    controller.triggerIdleAttract();
    expect(deps.playIdleCall).not.toHaveBeenCalled();
    expect(scene.tweens.add as MockFn).not.toHaveBeenCalled();
  });

  it("skips the wiggle cue under reduced motion but still plays the call", () => {
    const { controller, deps, scene } = setup({
      isReducedMotion: vi.fn((): boolean => true),
    });
    controller.scheduleIdleAttract();
    fireLastTimer(scene);
    expect(deps.playIdleCall).toHaveBeenCalledTimes(1);
    expect(scene.tweens.add as MockFn).not.toHaveBeenCalled();
  });

  it("skips the wiggle cue when no tile targets exist", () => {
    const { controller, deps, scene } = setup({
      getAttractTargets: vi.fn((): readonly Phaser.GameObjects.Rectangle[] => []),
    });
    controller.scheduleIdleAttract();
    fireLastTimer(scene);
    expect(deps.playIdleCall).toHaveBeenCalledTimes(1);
    expect(scene.tweens.add as MockFn).not.toHaveBeenCalled();
  });

  it("clears the attract-active flag for a new visit", () => {
    const { controller, scene } = setup();
    controller.scheduleIdleAttract();
    fireLastTimer(scene);
    const wiggles = (scene.tweens.add as MockFn).mock.calls.length;
    controller.resetForVisit();
    controller.resetIdleAttract();
    fireLastTimer(scene);
    expect((scene.tweens.add as MockFn).mock.calls.length).toBeGreaterThan(wiggles);
  });
});

describe("createDecorations", () => {
  it("places low-contrast dots behind the grid with drift tweens", () => {
    const { controller, scene } = setup();
    controller.createDecorations();
    const circles = mockRegistry.filter((obj) => obj.kind === "circle");
    expect(circles).toHaveLength(DECORATION_COUNT);
    for (const circle of circles) {
      expect(circle.setDepth as MockFn).toHaveBeenCalledWith(-1);
    }
    expect(scene.tweens.add as MockFn).toHaveBeenCalledTimes(DECORATION_COUNT);
  });
});

describe("destroy", () => {
  it("drops the timer and destroys the mascot", () => {
    const { controller, deps, scene } = setup();
    controller.scheduleIdleAttract();
    controller.createMascot();
    const timer = { remove: vi.fn() };
    (scene.time.delayedCall as MockFn).mockReturnValueOnce(timer);
    controller.scheduleIdleAttract();
    controller.destroy();
    expect(timer.remove).toHaveBeenCalledTimes(1);
    controller.triggerIdleAttract();
    expect(deps.playIdleCall).not.toHaveBeenCalled();
  });
});
