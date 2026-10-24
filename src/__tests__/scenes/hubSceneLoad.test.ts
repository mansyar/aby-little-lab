import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MockFn, MockObject } from "../helpers/phaserMock";
import {
  completeFadeOuts,
  fireAllObjectEvents,
  getMockFn,
  getRectangles,
  getTextObject,
  mockEnsureSceneLoaded,
  settleLoad,
  triggerPointerupOn,
  triggerShutdown,
} from "../helpers/sceneFlowHarness";

/**
 * Every module the scene flows touch is replaced with a shared double from
 * `sceneFlowHarness`. The `vi.mock` calls must stay in this file: Vitest hoists
 * them above the imports, so the factories load the harness dynamically.
 */
vi.mock("../../utils/fonts", async () => {
  const { mockEnsureGlyphFontLoaded } = await import("../helpers/sceneFlowHarness");
  return { ensureGlyphFontLoaded: mockEnsureGlyphFontLoaded };
});

vi.mock("phaser", async () => {
  const { createPhaserModuleMock } = await import("../helpers/phaserMock");
  return createPhaserModuleMock().module;
});

vi.mock("../../utils/storage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../utils/storage")>();
  const { mockStorageHasSticker, mockStorageEarnSticker, storageActual } = await import(
    "../helpers/sceneFlowHarness"
  );
  storageActual.hasSticker = actual.hasSticker;
  storageActual.earnSticker = actual.earnSticker;
  mockStorageHasSticker.mockImplementation(actual.hasSticker);
  mockStorageEarnSticker.mockImplementation(actual.earnSticker);
  return {
    ...actual,
    hasSticker: mockStorageHasSticker,
    earnSticker: mockStorageEarnSticker,
    // Wrapped rather than replaced: the record still lands, and the test can
    // see whether the Hub charged a play at all.
    recordGamePlay: vi.fn(actual.recordGamePlay),
  };
});

vi.mock("../../audio/AudioManager", async () => {
  const { mockAudio } = await import("../helpers/sceneFlowHarness");
  return { AudioManager: { getInstance: () => mockAudio } };
});

vi.mock("../../utils/speech", async () => {
  const { mockSpeech } = await import("../helpers/sceneFlowHarness");
  return mockSpeech;
});

vi.mock("../../components/SettingsPanel", async () => {
  const { MockSettingsPanel } = await import("../helpers/sceneFlowHarness");
  return { SettingsPanel: MockSettingsPanel };
});

vi.mock("../../components/PwaToast", async () => {
  const { MockPwaToast } = await import("../helpers/sceneFlowHarness");
  return { PwaToast: MockPwaToast };
});

vi.mock("../../utils/pwaBridge", async () => {
  const { mockBridge } = await import("../helpers/sceneFlowHarness");
  return { getPwaBridge: () => mockBridge };
});

vi.mock("../../game/playTimeLogic", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../game/playTimeLogic")>();
  return {
    ...actual,
    // Wrapped, not replaced: the session is still real, and the test can see
    // whether the Hub started one.
    startPlaySession: vi.fn(actual.startPlaySession),
  };
});

vi.mock("../../scenes/sceneRegistry", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../scenes/sceneRegistry")>();
  const { mockEnsureSceneLoaded } = await import("../helpers/sceneFlowHarness");
  return {
    ensureSceneLoaded: mockEnsureSceneLoaded,
    // Drives the real retry loop through its injected loader map, so these tests
    // exercise one genuine retry without a real dynamic import (NFR-2).
    loadSceneWithRetry: vi.fn((scene: never, key: string) => {
      const loader = async (): Promise<never> => {
        await mockEnsureSceneLoaded(scene, key);
        return undefined as never;
      };
      return actual.loadSceneWithRetry(scene, key, { [key]: loader });
    }),
  };
});

import { GAME_TILES } from "../../game/hubTiles";
import { endPlaySession, startPlaySession } from "../../game/playTimeLogic";
import { HubScene } from "../../scenes/HubScene";
import { loadSceneWithRetry } from "../../scenes/sceneRegistry";
import {
  getActiveProfile,
  getPlayTime,
  recordGamePlay,
  recordPlayTime,
  setPlayTimeLimit,
} from "../../utils/storage";

describe("Hub scene load", () => {
  /** The first tile of the wide grid: the tile every case taps. */
  const tile = GAME_TILES[0];

  beforeEach(() => {
    vi.stubGlobal("screen", {
      orientation: {
        lock: vi.fn().mockResolvedValue(undefined),
        unlock: vi.fn(),
      },
    });
    endPlaySession();
    localStorage.clear();
    vi.clearAllMocks();
    // One attempt resolves as a passed load; tests override it per case.
    mockEnsureSceneLoaded.mockReset();
    mockEnsureSceneLoaded.mockResolvedValue(undefined);
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  /** The grid, as the production scene holds it. */
  function gridOf(scene: HubScene): { navLocked: boolean; flipTo: (page: number) => void } {
    return (scene as unknown as { grid: { navLocked: boolean; flipTo: (page: number) => void } })
      .grid;
  }

  /** The nudge overlay, as the production scene holds it. */
  function nudgeOf(scene: HubScene): { isActive: () => boolean } {
    return (scene as unknown as { nudge: { isActive: () => boolean } }).nudge;
  }

  /**
   * Makes the next load hang until the returned function is called, so a test
   * can act while a launch is genuinely still in flight.
   */
  function holdNextLoad(): () => void {
    let release: () => void = () => {};
    mockEnsureSceneLoaded.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          release = resolve;
        }),
    );
    return () => release();
  }

  /** The retry cue the scene is holding, or undefined when none is due. */
  function cueOf(scene: HubScene): { isActive: () => boolean } | undefined {
    return (scene as unknown as { loadCue?: { isActive: () => boolean } }).loadCue;
  }

  /** The cue's 96x96 hit floor: the only rectangle of that size the Hub adds. */
  function cueRectOf(scene: HubScene): MockObject | undefined {
    return getRectangles(scene)
      .map((rect) => rect as unknown as MockObject)
      .find((rect) => rect.args?.[2] === 96 && rect.args?.[3] === 96);
  }

  /** Taps the retry cue the way a child would. */
  function tapCue(scene: HubScene): void {
    const cue = cueRectOf(scene);
    if (!cue) throw new Error("retry cue not on screen");
    cue.handlers.pointerup?.();
  }

  /**
   * Gives a mocked tile the runtime centre a real Phaser Rectangle carries.
   * The double records its constructor args but does not copy them to x/y.
   */
  function placeTile(rect: Record<string, unknown>, x: number, y: number): void {
    rect.x = x;
    rect.y = y;
  }

  /** The profile chip's avatar image: the Hub draws it at (68, 68). */
  function chipOf(scene: HubScene): Record<string, MockFn> {
    const images = getMockFn((scene as unknown as { add: Record<string, unknown> }).add.image);
    for (let i = 0; i < images.mock.calls.length; i += 1) {
      const [x, y] = images.mock.calls[i] as [number, number];
      if (x === 68 && y === 68) return images.mock.results[i].value as Record<string, MockFn>;
    }
    throw new Error("profile chip image not found");
  }

  /** The Settings label the parental lock guards. */
  function settingsButtonOf(scene: HubScene): Record<string, MockFn> {
    const button = getTextObject(scene, "Settings");
    if (!button) throw new Error("settings button not found");
    return button;
  }

  /** The runtime a timer created by `delayedCall(delay, ...)` is due to fire. */
  function fireTimer(scene: HubScene, delay: number): void {
    const timer = getMockFn(scene.time.delayedCall).mock.calls.find((call) => call[0] === delay);
    if (!timer) throw new Error(`no ${delay}ms timer scheduled`);
    (timer[1] as () => void)();
  }

  /** Every stored key and value, for "the failure path persisted nothing". */
  function storageSnapshot(): string {
    return JSON.stringify(
      Object.keys(localStorage)
        .sort()
        .map((key) => [key, localStorage.getItem(key)]),
    );
  }

  it("charges nothing and releases the grid when the load fails twice", async () => {
    mockEnsureSceneLoaded.mockRejectedValue(new Error("offline"));
    const scene = new HubScene();
    scene.create();
    const grid = gridOf(scene);

    triggerPointerupOn(getRectangles(scene)[0]);
    // The tap takes the lock before the load starts, exactly as production does.
    expect(grid.navLocked).toBe(true);

    await settleLoad(loadSceneWithRetry);

    expect(mockEnsureSceneLoaded).toHaveBeenCalledTimes(2);
    expect(mockEnsureSceneLoaded.mock.calls[0][1]).toBe(tile.sceneKey);
    // Nothing was charged for a game that never opened.
    expect(startPlaySession).not.toHaveBeenCalled();
    expect(recordGamePlay).not.toHaveBeenCalled();
    expect(getPlayTime("p1").usedMinutes).toBe(0);
    expect(endPlaySession()).toBeNull();
    // No nudge, no transition.
    expect(nudgeOf(scene).isActive()).toBe(false);
    expect(getMockFn(scene.time.delayedCall).mock.calls.some((call) => call[0] === 2000)).toBe(
      false,
    );
    completeFadeOuts(scene);
    expect(getMockFn(scene.scene.start)).not.toHaveBeenCalled();
    // And the rest of the Hub stays tappable.
    expect(grid.navLocked).toBe(false);
  });

  it("opens the game once when the retry succeeds, without ever raising a cue", async () => {
    mockEnsureSceneLoaded
      .mockRejectedValueOnce(new Error("chunk blip"))
      .mockResolvedValueOnce(undefined);
    const scene = new HubScene();
    scene.create();
    // Nothing is drawn for a load that has not failed yet: the cue's hit floor
    // is the only 96x96 rectangle the Hub builds.
    expect(cueRectOf(scene)).toBeUndefined();

    triggerPointerupOn(getRectangles(scene)[0]);
    await settleLoad(loadSceneWithRetry);

    expect(mockEnsureSceneLoaded).toHaveBeenCalledTimes(2);
    // AC-1's "no cue ever appears": one attempt did fail, and the surface a
    // failure raises still never existed — not raised and hidden again.
    expect(cueOf(scene)).toBeUndefined();
    expect(cueRectOf(scene)).toBeUndefined();
    expect(startPlaySession).toHaveBeenCalledTimes(1);
    expect(recordGamePlay).toHaveBeenCalledTimes(1);
    expect(recordGamePlay).toHaveBeenCalledWith(tile.gameId);
    expect(getMockFn(scene.cameras.main.fadeOut)).toHaveBeenCalled();

    completeFadeOuts(scene);
    expect(getMockFn(scene.scene.start)).toHaveBeenCalledWith(tile.sceneKey);
  });

  it("keeps the play-time nudge on the success path without loading twice", async () => {
    setPlayTimeLimit("p1", 15);
    recordPlayTime("p1", 10);
    const scene = new HubScene();
    scene.create();

    triggerPointerupOn(getRectangles(scene)[0]);
    await settleLoad(loadSceneWithRetry);

    expect(mockEnsureSceneLoaded).toHaveBeenCalledTimes(1);
    expect(startPlaySession).toHaveBeenCalledTimes(1);
    expect(recordGamePlay).toHaveBeenCalledTimes(1);

    const nudgeCalls = getMockFn(scene.time.delayedCall).mock.calls.filter(
      (call) => call[0] === 2000,
    );
    expect(nudgeCalls).toHaveLength(1);
    (nudgeCalls[0][1] as () => void)();

    // The nudge launches the already-loaded scene: no second load, no second
    // session, one play record.
    expect(mockEnsureSceneLoaded).toHaveBeenCalledTimes(1);
    expect(startPlaySession).toHaveBeenCalledTimes(1);
    expect(recordGamePlay).toHaveBeenCalledTimes(1);

    completeFadeOuts(scene);
    expect(getMockFn(scene.scene.start)).toHaveBeenCalledWith(tile.sceneKey);
  });

  it("puts one cue over the tapped tile and leaves the rest of the Hub tappable", async () => {
    mockEnsureSceneLoaded.mockRejectedValue(new Error("offline"));
    const scene = new HubScene();
    scene.create();
    const grid = gridOf(scene);
    const firstTile = getRectangles(scene)[0];
    placeTile(firstTile, 146, 268);

    triggerPointerupOn(firstTile);
    await settleLoad(loadSceneWithRetry);

    // The cue is visible, centred on the tile the child actually tapped.
    const cue = cueOf(scene);
    expect(cue?.isActive()).toBe(true);
    expect(cueRectOf(scene)?.args?.slice(0, 4)).toEqual([146, 268, 96, 96]);
    // And the grid is unlocked, so a different tile still reaches the Hub.
    expect(grid.navLocked).toBe(false);

    triggerPointerupOn(getRectangles(scene)[1]);
    expect(grid.navLocked).toBe(true);

    await settleLoad(loadSceneWithRetry);

    // Four attempts: two tiles, two attempts each — the second tap was heard.
    expect(mockEnsureSceneLoaded).toHaveBeenCalledTimes(4);
    expect(grid.navLocked).toBe(false);
  });

  it("retries from the cue, destroys it, then opens the game", async () => {
    mockEnsureSceneLoaded.mockRejectedValue(new Error("offline"));
    const scene = new HubScene();
    scene.create();

    triggerPointerupOn(getRectangles(scene)[0]);
    await settleLoad(loadSceneWithRetry);

    const cue = cueOf(scene);
    expect(cue?.isActive()).toBe(true);
    expect(mockEnsureSceneLoaded).toHaveBeenCalledTimes(2);

    // The chunk is reachable again: the cue's tap is the whole retry.
    mockEnsureSceneLoaded.mockResolvedValue(undefined);
    tapCue(scene);

    // Gone before the retry resolves, so a success cannot leave it on screen.
    expect(cue?.isActive()).toBe(false);
    expect(cueOf(scene)).toBeUndefined();
    expect(cueRectOf(scene)?.destroy).toHaveBeenCalled();

    await settleLoad(loadSceneWithRetry);

    // Exactly one extra attempt, then the usual first-time success path.
    expect(mockEnsureSceneLoaded).toHaveBeenCalledTimes(3);
    expect(startPlaySession).toHaveBeenCalledTimes(1);
    expect(recordGamePlay).toHaveBeenCalledTimes(1);
    expect(getMockFn(scene.cameras.main.fadeOut)).toHaveBeenCalled();

    completeFadeOuts(scene);
    expect(getMockFn(scene.scene.start)).toHaveBeenCalledWith(tile.sceneKey);
  });

  it("refuses a second launch while the cue's retry is in flight", async () => {
    mockEnsureSceneLoaded.mockRejectedValue(new Error("offline"));
    const scene = new HubScene();
    scene.create();
    const grid = gridOf(scene);

    triggerPointerupOn(getRectangles(scene)[0]);
    await settleLoad(loadSceneWithRetry);
    expect(cueOf(scene)?.isActive()).toBe(true);
    expect(mockEnsureSceneLoaded).toHaveBeenCalledTimes(2);

    // The chunk is reachable again, but the retry hangs: this is the window in
    // which a second tile used to start a parallel chain.
    const release = holdNextLoad();
    tapCue(scene);
    // The retry is a tap, so it takes the grid's tap lock back.
    expect(grid.navLocked).toBe(true);

    // A second tile during the retry reaches the grid and is refused: the lock
    // it checks, and the launch flag behind it, are both held.
    triggerPointerupOn(getRectangles(scene)[1]);
    expect(mockEnsureSceneLoaded).toHaveBeenCalledTimes(3);

    release();
    await settleLoad(loadSceneWithRetry);

    // One chain, one charge, one game opened.
    expect(mockEnsureSceneLoaded).toHaveBeenCalledTimes(3);
    expect(startPlaySession).toHaveBeenCalledTimes(1);
    expect(recordGamePlay).toHaveBeenCalledTimes(1);
    completeFadeOuts(scene);
    expect(getMockFn(scene.scene.start)).toHaveBeenCalledTimes(1);
    expect(getMockFn(scene.scene.start)).toHaveBeenCalledWith(tile.sceneKey);
  });

  it("warns once per failed attempt, naming the key, and persists nothing", async () => {
    mockEnsureSceneLoaded.mockRejectedValue(new Error("offline"));
    const scene = new HubScene();
    scene.create();
    const before = storageSnapshot();

    triggerPointerupOn(getRectangles(scene)[0]);
    await settleLoad(loadSceneWithRetry);

    expect(console.warn).toHaveBeenCalledTimes(2);
    for (const call of vi.mocked(console.warn).mock.calls) {
      expect(String(call[0])).toContain(tile.sceneKey);
    }
    // Nothing about the failure is stored: no key, no value, no play record.
    expect(storageSnapshot()).toBe(before);
  });

  it("keeps one cue across repeated failing taps", async () => {
    mockEnsureSceneLoaded.mockRejectedValue(new Error("offline"));
    const scene = new HubScene();
    scene.create();

    triggerPointerupOn(getRectangles(scene)[0]);
    await settleLoad(loadSceneWithRetry);
    const cue = cueOf(scene);
    expect(cue?.isActive()).toBe(true);

    triggerPointerupOn(getRectangles(scene)[1]);
    await settleLoad(loadSceneWithRetry);

    // The second failure reuses the cue instead of stacking another.
    expect(cueOf(scene)).toBe(cue);
    expect(cue?.isActive()).toBe(true);
    expect(mockEnsureSceneLoaded).toHaveBeenCalledTimes(4);
    const cueFloors = getRectangles(scene)
      .map((rect) => rect as unknown as MockObject)
      .filter((rect) => rect.args?.[2] === 96);
    expect(cueFloors).toHaveLength(1);
  });

  it("hides the cue when a page flip rebuilds the board under it", async () => {
    mockEnsureSceneLoaded.mockRejectedValue(new Error("offline"));
    const scene = new HubScene();
    // A narrow viewport makes the Hub build the paged board, whose slot centres
    // repeat on every page.
    (scene.scale as unknown as { displaySize: { width: number; height: number } }).displaySize = {
      width: 844,
      height: 390,
    };
    scene.create();

    triggerPointerupOn(getRectangles(scene)[0]);
    await settleLoad(loadSceneWithRetry);
    const cue = cueOf(scene);
    const cueRect = cueRectOf(scene);
    expect(cue?.isActive()).toBe(true);

    gridOf(scene).flipTo(1);

    // The tile the cue was anchored to went with the page, so the cue goes with
    // it: left in place it would sit over the next page's tile in the same slot.
    expect(cue?.isActive()).toBe(false);
    expect(cueOf(scene)).toBeUndefined();
    expect(cueRect?.destroy).toHaveBeenCalled();
  });

  it("clears the cue when the profile picker opens", async () => {
    mockEnsureSceneLoaded.mockRejectedValue(new Error("offline"));
    const scene = new HubScene();
    scene.create();

    triggerPointerupOn(getRectangles(scene)[0]);
    await settleLoad(loadSceneWithRetry);
    const cue = cueOf(scene);
    const cueRect = cueRectOf(scene);
    expect(cue?.isActive()).toBe(true);

    // The chip opens the picker on pointerup, exactly as a child opens it.
    fireAllObjectEvents(chipOf(scene), "pointerup");

    expect(cue?.isActive()).toBe(false);
    expect(cueOf(scene)).toBeUndefined();
    expect(cueRect?.destroy).toHaveBeenCalled();
  });

  it("clears the cue when the Settings hold unlocks the panel", async () => {
    mockEnsureSceneLoaded.mockRejectedValue(new Error("offline"));
    const scene = new HubScene();
    scene.create();

    triggerPointerupOn(getRectangles(scene)[0]);
    await settleLoad(loadSceneWithRetry);
    const cue = cueOf(scene);
    const cueRect = cueRectOf(scene);
    expect(cue?.isActive()).toBe(true);

    fireAllObjectEvents(settingsButtonOf(scene), "pointerdown");
    // The parental lock completes its three-second hold through the scene timer.
    fireTimer(scene, 3000);

    expect(cue?.isActive()).toBe(false);
    expect(cueOf(scene)).toBeUndefined();
    expect(cueRect?.destroy).toHaveBeenCalled();
  });

  it("does not open a game whose chunk lands after the Hub shut down", async () => {
    mockEnsureSceneLoaded.mockResolvedValue(undefined);
    const scene = new HubScene();
    scene.create();

    triggerPointerupOn(getRectangles(scene)[0]);
    expect(() => triggerShutdown(scene)).not.toThrow();

    // The load still settles quietly; the Hub has nothing left to do with it.
    await expect(settleLoad(loadSceneWithRetry)).resolves.toBeUndefined();

    completeFadeOuts(scene);
    expect(getMockFn(scene.scene.start)).not.toHaveBeenCalled();
    expect(getMockFn(scene.cameras.main.fadeOut)).not.toHaveBeenCalled();
    expect(startPlaySession).not.toHaveBeenCalled();
    expect(recordGamePlay).not.toHaveBeenCalled();
    expect(cueOf(scene)).toBeUndefined();
  });

  it("discards a failed load that settles after the Hub shut down", async () => {
    mockEnsureSceneLoaded.mockRejectedValue(new Error("offline"));
    const scene = new HubScene();
    scene.create();

    triggerPointerupOn(getRectangles(scene)[0]);
    expect(() => triggerShutdown(scene)).not.toThrow();

    await expect(settleLoad(loadSceneWithRetry)).resolves.toBeUndefined();

    // No cue is hung over a screen that is already gone.
    expect(cueOf(scene)).toBeUndefined();
    expect(cueRectOf(scene)).toBeUndefined();
    completeFadeOuts(scene);
    expect(getMockFn(scene.scene.start)).not.toHaveBeenCalled();
    expect(startPlaySession).not.toHaveBeenCalled();
    expect(recordGamePlay).not.toHaveBeenCalled();
  });

  it("discards a load that settles after the Hub was recreated for a new visit", async () => {
    const release = holdNextLoad();
    const scene = new HubScene();
    scene.create();

    triggerPointerupOn(getRectangles(scene)[0]);
    triggerShutdown(scene);
    // Phaser reuses the instance: the next visit runs `create()` again, which
    // is exactly what used to reset a shutdown boolean and let a stale load
    // charge the new visit.
    scene.create();

    release();
    await settleLoad(loadSceneWithRetry);

    expect(startPlaySession).not.toHaveBeenCalled();
    expect(recordGamePlay).not.toHaveBeenCalled();
    completeFadeOuts(scene);
    expect(getMockFn(scene.scene.start)).not.toHaveBeenCalled();
    expect(cueOf(scene)).toBeUndefined();
  });

  it("refuses a cue retry once the daily cap has been reached", async () => {
    mockEnsureSceneLoaded.mockRejectedValue(new Error("offline"));
    const scene = new HubScene();
    scene.create();
    const grid = gridOf(scene);

    triggerPointerupOn(getRectangles(scene)[0]);
    await settleLoad(loadSceneWithRetry);
    const cue = cueOf(scene);
    expect(cue?.isActive()).toBe(true);

    // The cap is reached while the cue is up, and the Hub re-reads it the way
    // it does in the browser: a foreground return (see hubPlayTime.test.ts).
    const profileId = getActiveProfile().id;
    setPlayTimeLimit(profileId, 15);
    recordPlayTime(profileId, 15);
    document.dispatchEvent(new Event("visibilitychange"));

    mockEnsureSceneLoaded.mockResolvedValue(undefined);
    tapCue(scene);
    await settleLoad(loadSceneWithRetry);

    // The lock outranks the retry: no session, no play record and no game.
    expect(startPlaySession).not.toHaveBeenCalled();
    expect(recordGamePlay).not.toHaveBeenCalled();
    completeFadeOuts(scene);
    expect(getMockFn(scene.scene.start)).not.toHaveBeenCalled();

    // The cue offers nothing at the cap, so it is gone — not left on screen
    // inviting a tap that cannot work.
    expect(cue?.isActive()).toBe(false);
    expect(cueOf(scene)).toBeUndefined();
    expect(grid.navLocked).toBe(false);
  });

  it("fails loudly when asked to settle a load the Hub never started", async () => {
    // The harness guard: a `if (pending) await pending` that no-ops would let a
    // case settle the wrong thing and still pass while asserting nothing.
    await expect(settleLoad(loadSceneWithRetry)).rejects.toThrow(/found no load to settle/);
  });
});
