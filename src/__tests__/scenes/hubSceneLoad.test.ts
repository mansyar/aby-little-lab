import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  completeFadeOuts,
  getMockFn,
  getRectangles,
  mockEnsureSceneLoaded,
  triggerPointerupOn,
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
import { getPlayTime, recordGamePlay, recordPlayTime, setPlayTimeLimit } from "../../utils/storage";

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
  function gridOf(scene: HubScene): { navLocked: boolean } {
    return (scene as unknown as { grid: { navLocked: boolean } }).grid;
  }

  /** The nudge overlay, as the production scene holds it. */
  function nudgeOf(scene: HubScene): { isActive: () => boolean } {
    return (scene as unknown as { nudge: { isActive: () => boolean } }).nudge;
  }

  /**
   * Awaits the load the Hub is waiting on, so its continuation runs first: the
   * scene registered its `await` on this promise before the test did.
   */
  async function settleLoad(): Promise<void> {
    const pending = vi.mocked(loadSceneWithRetry).mock.results.at(-1)?.value as
      | Promise<boolean>
      | undefined;
    if (pending) await pending;
  }

  it("charges nothing and releases the grid when the load fails twice", async () => {
    mockEnsureSceneLoaded.mockRejectedValue(new Error("offline"));
    const scene = new HubScene();
    scene.create();
    const grid = gridOf(scene);

    triggerPointerupOn(getRectangles(scene)[0]);
    // The tap takes the lock before the load starts, exactly as production does.
    expect(grid.navLocked).toBe(true);

    await settleLoad();

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

  it("opens the game once when the retry succeeds", async () => {
    mockEnsureSceneLoaded
      .mockRejectedValueOnce(new Error("chunk blip"))
      .mockResolvedValueOnce(undefined);
    const scene = new HubScene();
    scene.create();

    triggerPointerupOn(getRectangles(scene)[0]);
    await settleLoad();

    expect(mockEnsureSceneLoaded).toHaveBeenCalledTimes(2);
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
    await settleLoad();

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
});
