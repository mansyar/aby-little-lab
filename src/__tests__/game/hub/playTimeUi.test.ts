import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  canObserveVisibility,
  createPlayTimeUi,
  isDocumentHidden,
  type PlayTimeUiController,
  type PlayTimeUiDeps,
} from "../../../game/hub/playTimeUi";
import { todayKey } from "../../../game/playTimeLogic";
import type { PlayTime } from "../../../types";
import { type MockFn, MockScene, mockRegistry } from "../../helpers/phaserMock";

/** normalizePlayTime resets usage on stale dates, so limit fixtures must be "today". */
const TODAY = todayKey();

vi.mock("../../../utils/storage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../utils/storage")>();
  return {
    ...actual,
    getPlayTime: vi.fn(
      (): PlayTime => ({
        limitMinutes: null,
        usedMinutes: 0,
        lastUsedDate: TODAY,
      }),
    ),
  };
});

const { getPlayTime } = await import("../../../utils/storage");

/** Casts the shared mock scene to the Phaser.Scene shape the module expects. */
function asScene(mock: MockScene): Phaser.Scene {
  return mock as unknown as Phaser.Scene;
}

interface Harness {
  controller: PlayTimeUiController;
  deps: PlayTimeUiDeps;
  scene: MockScene;
}

function setup(overrides: Partial<PlayTimeUiDeps> = {}): Harness {
  const scene = new MockScene();
  const deps: PlayTimeUiDeps = {
    scene: asScene(scene),
    applyTimeUpLock: vi.fn(),
    restoreTiles: vi.fn(),
    waveMascot: vi.fn(),
    syncPrewarm: vi.fn(),
    launchTile: vi.fn(),
    ...overrides,
  };
  return { controller: createPlayTimeUi(deps), deps, scene };
}

function limitReached(): PlayTime {
  return { limitMinutes: 30, usedMinutes: 30, lastUsedDate: TODAY };
}

function noLimit(): PlayTime {
  return { limitMinutes: null, usedMinutes: 0, lastUsedDate: TODAY };
}

beforeEach(() => {
  mockRegistry.length = 0;
  vi.mocked(getPlayTime).mockReset();
  vi.mocked(getPlayTime).mockReturnValue(noLimit());
});

describe("createPlayTimeIndicator", () => {
  it("locks the tiles and waves once when the cap is first reached", () => {
    vi.mocked(getPlayTime).mockReturnValue(limitReached());
    const { controller, deps } = setup();
    controller.createPlayTimeIndicator();
    expect(controller.isTimeUp()).toBe(true);
    expect(deps.applyTimeUpLock).toHaveBeenCalledTimes(1);
    expect(deps.waveMascot).toHaveBeenCalledTimes(1);
  });

  it("stays unlocked with no indicator when the profile has no limit", () => {
    const { controller, deps } = setup();
    controller.createPlayTimeIndicator();
    expect(controller.isTimeUp()).toBe(false);
    expect(deps.applyTimeUpLock).not.toHaveBeenCalled();
    expect(deps.waveMascot).not.toHaveBeenCalled();
  });
});

describe("refreshPlayTimeState", () => {
  it("restores the tiles, re-locks without a second wave, and follows the prewarm", () => {
    vi.mocked(getPlayTime).mockReturnValue(limitReached());
    const { controller, deps } = setup();
    controller.createPlayTimeIndicator();
    controller.refreshPlayTimeState();
    expect(deps.restoreTiles).toHaveBeenCalledTimes(1);
    expect(controller.isTimeUp()).toBe(true);
    expect(deps.applyTimeUpLock).toHaveBeenCalledTimes(2);
    expect(deps.waveMascot).toHaveBeenCalledTimes(1);
    expect(deps.syncPrewarm).toHaveBeenCalledTimes(1);
  });

  it("skips the restore when the lock was never held", () => {
    const { controller, deps } = setup();
    controller.refreshPlayTimeState();
    expect(deps.restoreTiles).not.toHaveBeenCalled();
    expect(controller.isTimeUp()).toBe(false);
    expect(deps.syncPrewarm).toHaveBeenCalledTimes(1);
  });

  it("clears the lock when the budget resets", () => {
    vi.mocked(getPlayTime).mockReturnValue(limitReached());
    const { controller, deps } = setup();
    controller.createPlayTimeIndicator();
    expect(controller.isTimeUp()).toBe(true);
    vi.mocked(getPlayTime).mockReturnValue(noLimit());
    controller.refreshPlayTimeState();
    expect(deps.restoreTiles).toHaveBeenCalledTimes(1);
    expect(controller.isTimeUp()).toBe(false);
  });
});

describe("beginVisit and destroy", () => {
  it("resets the lock and the nudge for a new visit", () => {
    vi.mocked(getPlayTime).mockReturnValue(limitReached());
    const { controller } = setup();
    controller.createPlayTimeIndicator();
    expect(controller.isTimeUp()).toBe(true);
    controller.beginVisit();
    expect(controller.isTimeUp()).toBe(false);
  });

  it("destroys the indicator graphics without touching the lock", () => {
    vi.mocked(getPlayTime).mockReturnValue(limitReached());
    const { controller, deps } = setup();
    controller.createPlayTimeIndicator();
    const graphics = mockRegistry.filter((obj) => obj.kind === "graphics");
    expect(graphics.length).toBeGreaterThan(0);
    controller.destroy();
    expect(graphics[graphics.length - 1].destroy).toHaveBeenCalled();
    expect(controller.isTimeUp()).toBe(true);
    expect(deps.syncPrewarm).not.toHaveBeenCalled();
  });
});

describe("showPlayTimeNudge", () => {
  it("launches the tile after the overlay delay and gates a second show", () => {
    const { controller, deps, scene } = setup();
    controller.showPlayTimeNudge(3);
    const delayedCall = scene.time.delayedCall as MockFn;
    expect(delayedCall).toHaveBeenCalledTimes(1);
    expect(delayedCall.mock.calls[0][0]).toBe(2000);
    controller.showPlayTimeNudge(1);
    expect(delayedCall).toHaveBeenCalledTimes(1);
    delayedCall.mock.calls[0][1]();
    expect(deps.launchTile).toHaveBeenCalledWith(3);
  });
});

describe("watchPlayTimeVisibility", () => {
  let visibility: DocumentVisibilityState;
  let descriptor: PropertyDescriptor | undefined;

  beforeEach(() => {
    visibility = "visible";
    descriptor = Object.getOwnPropertyDescriptor(document, "visibilityState");
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => visibility,
    });
  });

  afterEach(() => {
    if (descriptor) {
      Object.defineProperty(document, "visibilityState", descriptor);
    } else {
      Reflect.deleteProperty(document, "visibilityState");
    }
    vi.restoreAllMocks();
  });

  function setVisibility(next: DocumentVisibilityState): void {
    visibility = next;
    document.dispatchEvent(new Event("visibilitychange"));
  }

  it("re-reads the budget on foreground return and parks the prewarm in background", () => {
    const { controller, deps } = setup();
    controller.watchPlayTimeVisibility();
    vi.mocked(getPlayTime).mockReturnValue(limitReached());
    setVisibility("visible");
    expect(controller.isTimeUp()).toBe(true);
    const syncCalls = (deps.syncPrewarm as MockFn).mock.calls.length;
    setVisibility("hidden");
    expect(deps.syncPrewarm).toHaveBeenCalledTimes(syncCalls + 1);
  });

  it("detaches the hook on shutdown", () => {
    const { controller, scene } = setup();
    const addSpy = vi.spyOn(document, "addEventListener");
    const removeSpy = vi.spyOn(document, "removeEventListener");
    controller.watchPlayTimeVisibility();
    expect(addSpy).toHaveBeenCalledWith("visibilitychange", expect.any(Function));
    (scene.events.emit as MockFn)("shutdown");
    expect(removeSpy).toHaveBeenCalledWith("visibilitychange", expect.any(Function));
  });
});

describe("visibility guards", () => {
  it("counts a host with no visibility surface as visible and unobservable", () => {
    expect(canObserveVisibility()).toBe(true);
    expect(isDocumentHidden()).toBe(document.visibilityState === "hidden");
  });
});
