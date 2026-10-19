import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MockFn } from "../helpers/phaserMock";
import {
  completeFadeOuts,
  findLastAddedImage,
  getMockFn,
  getRectangles,
  mockSettingsPanel,
  triggerAllPointerdowns,
  triggerAllPointerups,
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

vi.mock("../../scenes/sceneRegistry", async () => {
  const { mockEnsureSceneLoaded } = await import("../helpers/sceneFlowHarness");
  return { ensureSceneLoaded: mockEnsureSceneLoaded };
});

import { endPlaySession, startPlaySession } from "../../game/playTimeLogic";
import { HubScene } from "../../scenes/HubScene";
import { ensureSceneLoaded } from "../../scenes/sceneRegistry";
import {
  addProfile,
  getActiveProfile,
  getPlayTime,
  recordPlayTime,
  setPlayTimeLimit,
  switchProfile,
} from "../../utils/storage";

beforeEach(() => {
  vi.stubGlobal("screen", {
    orientation: {
      lock: vi.fn().mockResolvedValue(undefined),
      unlock: vi.fn(),
    },
  });
  localStorage.clear();
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Hub play-time enforcement", () => {
  /** The hint arc / moon badge colors mirrored from HubScene. */
  const HINT_COOL_COLOR = 0x68d391;
  const HINT_WARM_COLOR = 0xed8936;
  const TIME_UP_TILE_ALPHA = 0.45;

  beforeEach(() => {
    endPlaySession();
  });

  /** Returns the LAST graphics object created (hint arc, moon, or hourglass). */
  function getLastGraphics(scene: unknown): Record<string, MockFn> {
    const graphicsMock = getMockFn((scene as { add: Record<string, unknown> }).add.graphics);
    const result = graphicsMock.mock.results.at(-1)?.value as Record<string, MockFn> | undefined;
    if (!result) throw new Error("No graphics object created");
    return result;
  }

  /** Returns only play-time indicator graphics (slice/fillStyle based), excluding dashed empty slots. */
  function getPlayTimeGraphics(scene: unknown): Array<Record<string, MockFn>> {
    const graphicsMock = getMockFn((scene as { add: Record<string, unknown> }).add.graphics);
    const result: Array<Record<string, MockFn>> = [];
    for (let i = 0; i < graphicsMock.mock.results.length; i++) {
      const obj = graphicsMock.mock.results[i].value as Record<string, MockFn>;
      const hasFill = getMockFn(obj.fillStyle).mock.calls.length > 0;
      const hasSlice = getMockFn(obj.slice).mock.calls.length > 0;
      if (hasFill || hasSlice) result.push(obj);
    }
    return result;
  }

  it("records the elapsed session minutes on return to the hub", () => {
    startPlaySession("p1", Date.now() - 3 * 60 * 1000);
    const scene = new HubScene();
    scene.create();

    expect(getPlayTime("p1").usedMinutes).toBe(3);
  });

  it("does not record play time when no game session was started", () => {
    const scene = new HubScene();
    scene.create();

    expect(getPlayTime("p1").usedMinutes).toBe(0);
  });

  it("records against the profile that started the session", () => {
    addProfile("dog"); // p2 becomes active.
    startPlaySession("p2", Date.now() - 2 * 60 * 1000);
    const scene = new HubScene();
    scene.create();

    expect(getPlayTime("p2").usedMinutes).toBe(2);
    expect(getPlayTime("p1").usedMinutes).toBe(0);
  });

  it("locks and dims tiles when the daily limit is reached", () => {
    setPlayTimeLimit("p1", 30);
    recordPlayTime("p1", 30);
    const scene = new HubScene();
    scene.create();

    // Game tiles are 144×116 rectangles; smaller rectangles are decorative
    // rings/markers outside the locked-tile treatment.
    const tiles = getRectangles(scene).filter(
      (r) => ((r as unknown as { args?: number[] }).args?.[2] ?? 0) >= 140,
    );
    expect(tiles.length).toBeGreaterThanOrEqual(10);
    for (const tile of tiles) {
      expect(getMockFn(tile.setAlpha)).toHaveBeenCalledWith(TIME_UP_TILE_ALPHA);
      expect(getMockFn(tile.disableInteractive)).toHaveBeenCalled();
    }
  });

  it("does not navigate when tiles are locked", async () => {
    setPlayTimeLimit("p1", 30);
    recordPlayTime("p1", 30);
    const scene = new HubScene();
    scene.create();

    triggerAllPointerups(scene);
    await new Promise((resolve) => setTimeout(resolve, 0));
    completeFadeOuts(scene);

    expect(ensureSceneLoaded).not.toHaveBeenCalled();
    expect(getMockFn(scene.scene.start)).not.toHaveBeenCalled();
  });

  it("draws a textless moon badge when time is up", () => {
    setPlayTimeLimit("p1", 15);
    recordPlayTime("p1", 15);
    const scene = new HubScene();
    scene.create();

    const moon = getLastGraphics(scene);
    expect(getMockFn(moon.fillCircle)).toHaveBeenCalled();
    expect(getMockFn(moon.slice)).not.toHaveBeenCalled();
  });

  it("shows no play-time graphics when no limit is set", () => {
    const scene = new HubScene();
    scene.create();

    // Empty-slot outlines are allowed; the play-time indicator must not exist.
    expect(getPlayTimeGraphics(scene)).toHaveLength(0);
  });

  it("draws a hint arc showing remaining budget when a limit is set", () => {
    setPlayTimeLimit("p1", 30);
    recordPlayTime("p1", 15);
    const scene = new HubScene();
    scene.create();

    const arc = getLastGraphics(scene);
    expect(getMockFn(arc.fillCircle)).toHaveBeenCalled();
    expect(getMockFn(arc.slice)).toHaveBeenCalled();
    expect(getMockFn(arc.fillPath)).toHaveBeenCalled();
  });

  it("colors the hint arc warm when 5 minutes or fewer remain", () => {
    setPlayTimeLimit("p1", 15);
    recordPlayTime("p1", 10);
    const scene = new HubScene();
    scene.create();

    const arc = getLastGraphics(scene);
    expect(getMockFn(arc.fillStyle)).toHaveBeenCalledWith(HINT_WARM_COLOR, 1);
  });

  it("colors the hint arc cool green when plenty of time remains", () => {
    setPlayTimeLimit("p1", 30);
    recordPlayTime("p1", 5);
    const scene = new HubScene();
    scene.create();

    const arc = getLastGraphics(scene);
    expect(getMockFn(arc.fillStyle)).toHaveBeenCalledWith(HINT_COOL_COLOR, 1);
  });

  it("shows a nudge overlay before launching when 5 minutes or fewer remain", async () => {
    setPlayTimeLimit("p1", 15);
    recordPlayTime("p1", 10);
    const scene = new HubScene();
    scene.create();

    triggerAllPointerups(scene);
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Navigation deferred until the nudge dismisses.
    expect(ensureSceneLoaded).not.toHaveBeenCalled();

    const nudgeCalls = getMockFn(scene.time.delayedCall).mock.calls.filter(
      (call) => call[0] === 2000,
    );
    expect(nudgeCalls.length).toBeGreaterThan(0);
    for (const call of nudgeCalls) {
      (call[1] as () => void)();
    }
    await new Promise((resolve) => setTimeout(resolve, 0));
    completeFadeOuts(scene);

    expect(ensureSceneLoaded).toHaveBeenCalled();
  });

  it("launches games immediately when more than 5 minutes remain", async () => {
    setPlayTimeLimit("p1", 60);
    recordPlayTime("p1", 30);
    const scene = new HubScene();
    scene.create();

    triggerAllPointerups(scene);
    await new Promise((resolve) => setTimeout(resolve, 0));
    completeFadeOuts(scene);

    expect(ensureSceneLoaded).toHaveBeenCalled();
    expect(getMockFn(scene.time.delayedCall).mock.calls.some((call) => call[0] === 2000)).toBe(
      false,
    );
  });

  it("shows the nudge overlay under reduced motion without animating it", () => {
    vi.stubGlobal("window", {
      matchMedia: vi.fn(() => ({ matches: true })),
    });
    setPlayTimeLimit("p1", 15);
    recordPlayTime("p1", 10);
    const scene = new HubScene();
    scene.create();

    triggerAllPointerups(scene);

    const hourglass = getLastGraphics(scene);
    const tweenCalls = getMockFn(scene.tweens.add).mock.calls;
    expect(tweenCalls.some((call) => call[0]?.targets === hourglass)).toBe(false);
    const nudgeCalls = getMockFn(scene.time.delayedCall).mock.calls.filter(
      (call) => call[0] === 2000,
    );
    expect(nudgeCalls.length).toBeGreaterThan(0);
  });

  it("unlocks the hub when switching to an unlimited profile", () => {
    setPlayTimeLimit("p1", 15);
    recordPlayTime("p1", 15);
    addProfile("dog");
    switchProfile("p1");
    const scene = new HubScene();
    scene.create();

    // p1 active -> locked and dimmed from the start. Only game tiles
    // (144×116) participate; decorative rectangles are excluded.
    const tiles = getRectangles(scene).filter(
      (r) => ((r as unknown as { args?: number[] }).args?.[2] ?? 0) >= 140,
    );
    for (const tile of tiles) {
      expect(getMockFn(tile.disableInteractive)).toHaveBeenCalled();
    }

    // The moon badge is created for the limited profile, then destroyed
    // and not replaced once the switch to the unlimited profile happens.
    const moons = getPlayTimeGraphics(scene);
    expect(moons).toHaveLength(1);
    const moon = moons[0];

    const chip = findLastAddedImage(scene, "animal_cat");
    if (!chip) throw new Error("chip not created");
    triggerPointerupOn(chip);
    const dogAvatar = findLastAddedImage(scene, "animal_dog");
    if (!dogAvatar) throw new Error("picker avatar not created");
    triggerPointerupOn(dogAvatar);

    expect(getActiveProfile().id).toBe("p2");
    for (const tile of tiles) {
      expect(getMockFn(tile.setAlpha)).toHaveBeenCalledWith(1);
      expect(getMockFn(tile.setInteractive)).toHaveBeenCalled();
    }
    expect(getMockFn(moon.destroy)).toHaveBeenCalled();
    expect(
      getPlayTimeGraphics(scene).filter((o) => getMockFn(o.destroy).mock.calls.length === 0),
    ).toHaveLength(0);
  });

  it("re-renders the hint when settings change", () => {
    const scene = new HubScene();
    scene.create();
    expect(getPlayTimeGraphics(scene)).toHaveLength(0);

    triggerAllPointerdowns(scene);
    const holdCallback = getMockFn(scene.time.delayedCall).mock.calls.find(
      (call) => call[0] === 3000,
    )?.[1] as () => void;
    holdCallback();
    const settingsArgs = mockSettingsPanel.mock.calls.at(-1) as unknown[];
    const onProgressReset = settingsArgs[2] as () => void;

    setPlayTimeLimit("p1", 30);
    onProgressReset();

    expect(
      getPlayTimeGraphics(scene).filter((o) => getMockFn(o.destroy).mock.calls.length === 0),
    ).toHaveLength(1);
  });
});
