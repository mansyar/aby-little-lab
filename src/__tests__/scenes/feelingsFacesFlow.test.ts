import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { stubMatchMedia } from "../helpers/matchMediaStub";
import type { MockFn } from "../helpers/phaserMock";
import {
  completeFadeOuts,
  completeHubEntrances,
  fireAllObjectEvents,
  getEmptySlots,
  getImageByKey,
  getMockFn,
  getRectangles,
  getStickerImageSafe,
  getTextObject,
  getTileIcons,
  mockAudio,
  mockEnsureSceneLoaded,
  mockSpeech,
} from "../helpers/sceneFlowHarness";

/**
 * Every module the flow touches is replaced with a shared double from
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

import { type Emotion, ROUND_COUNT, type Scenario } from "../../game/feelingsFacesLogic";
import { FeelingsFacesScene } from "../../scenes/FeelingsFacesScene";
import { HubScene } from "../../scenes/HubScene";
import { hasSticker } from "../../utils/storage";

/** The rule line the scene renders and speaks (`FeelingsFacesScene` constant). */
const RULE_LINE = "Tap the face that shows how Aby feels.";
/** Round-1 scenario speech is deferred past the rule line. */
const OPENING_SPEECH_DELAY = 2600;
/** Delay between a correct tap and the next round. */
const NEXT_ROUND_DELAY = 700;
/** Delay between the win celebration and the return to the Hub. */
const AUTO_RETURN_DELAY = 3000;
const TEST_VOICE = { voiceURI: "test-voice", lang: "en-US", name: "Test" };

/** The scene fields this flow drives; the scene owns the real values. */
interface SceneInternals {
  rounds: Scenario[];
  roundIndex: number;
  choices: Emotion[];
  add: Record<string, unknown>;
  time: Record<string, unknown>;
  scene: Record<string, unknown>;
}

function internals(scene: FeelingsFacesScene): SceneInternals {
  return scene as unknown as SceneInternals;
}

/** The three face cards currently on screen (destroyed cards are dropped). */
function getCards(scene: FeelingsFacesScene): Array<Record<string, MockFn>> {
  return getRectangles(scene).filter((card) => getMockFn(card.destroy).mock.calls.length === 0);
}

/** Texture keys of the face images still on screen, in card order. */
function getLiveFaceKeys(scene: FeelingsFacesScene): string[] {
  const imageMock = getMockFn(internals(scene).add.image);
  const keys: string[] = [];
  imageMock.mock.results.forEach((result, index) => {
    const key = imageMock.mock.calls[index][2] as string;
    if (typeof key !== "string" || !key.startsWith("face_")) return;
    const image = result.value as Record<string, MockFn>;
    if (getMockFn(image.destroy).mock.calls.length === 0) keys.push(key);
  });
  return keys;
}

/** Index of the card that matches the current scenario. */
function targetCardIndex(scene: FeelingsFacesScene): number {
  const state = internals(scene);
  return state.choices.indexOf(state.rounds[state.roundIndex].emotion);
}

/** Taps the card that matches the scenario. */
function tapTargetCard(scene: FeelingsFacesScene): void {
  const index = targetCardIndex(scene);
  if (index < 0) throw new Error("the current round has no matching card");
  fireAllObjectEvents(getCards(scene)[index], "pointerdown");
}

/** Fires the newest pending timer for `delay`, mirroring elapsed Phaser time. */
function fireDelayedCall(scene: FeelingsFacesScene, delay: number): void {
  const calls = getMockFn(internals(scene).time.delayedCall).mock.calls;
  const call = [...calls].reverse().find((entry) => entry[0] === delay);
  if (!call) throw new Error(`no ${delay} ms delayed call on FeelingsFacesScene`);
  (call[1] as () => void)();
}

/** Creates the scene and answers all six rounds correctly. */
function playThrough(scene: FeelingsFacesScene): void {
  scene.create();
  fireDelayedCall(scene, OPENING_SPEECH_DELAY);
  for (let round = 0; round < ROUND_COUNT; round++) {
    tapTargetCard(scene);
    fireDelayedCall(scene, NEXT_ROUND_DELAY);
  }
}

/** Completes the 3 s auto-return and lands on the Hub. */
function autoReturn(scene: FeelingsFacesScene): void {
  fireDelayedCall(scene, AUTO_RETURN_DELAY);
  completeFadeOuts(scene);
}

beforeEach(() => {
  vi.stubGlobal("screen", {
    orientation: {
      lock: vi.fn().mockResolvedValue(undefined),
      unlock: vi.fn(),
    },
  });
  vi.stubGlobal("speechSynthesis", { getVoices: () => [TEST_VOICE] });
  stubMatchMedia(false);
  localStorage.clear();
  vi.clearAllMocks();
  vi.spyOn(Math, "random").mockReturnValue(0.5);
  mockSpeech.isSpeechSupported.mockReturnValue(true);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("Feelings Faces hub entry", () => {
  it("renders 22 tiles with Feelings Faces as the 21st and Story Order as the 22nd", () => {
    const hub = new HubScene();
    hub.create();
    completeHubEntrances(hub);

    const tiles = getRectangles(hub).filter((obj) =>
      getMockFn(obj.on).mock.calls.some((call) => call[0] === "pointerup"),
    );
    expect(tiles).toHaveLength(22);
    const icons = getTileIcons(hub).map((icon) => icon.key);
    expect(icons).toHaveLength(22);
    expect(icons.at(-2)).toBe("tile_feelings_faces");
    expect(icons.at(-1)).toBe("tile_story_order");
    expect(getTextObject(hub, "Feelings Faces")).toBeDefined();
  });

  it("launches Feelings Faces when the 21st tile is released", async () => {
    const hub = new HubScene();
    hub.create();
    completeHubEntrances(hub);

    const tiles = getRectangles(hub).filter((obj) =>
      getMockFn(obj.on).mock.calls.some((call) => call[0] === "pointerup"),
    );
    fireAllObjectEvents(tiles[20], "pointerup");
    // The tile handler awaits the (mocked) lazy scene loader before transitioning.
    await new Promise((resolve) => setTimeout(resolve, 0));
    completeFadeOuts(hub);

    expect(mockEnsureSceneLoaded).toHaveBeenCalledWith(hub, "FeelingsFaces");
    expect(getMockFn(hub.scene.start)).toHaveBeenCalledWith("FeelingsFaces");
  });
});

describe("Feelings Faces playthrough", () => {
  it("speaks the rule, then plays six scenario rounds to the heart sticker", () => {
    const game = new FeelingsFacesScene();
    game.create();

    const state = internals(game);
    expect(state.rounds).toHaveLength(ROUND_COUNT);
    expect(
      getMockFn(internals(game).add.circle).mock.results,
      "one progress dot per round",
    ).toHaveLength(ROUND_COUNT);
    expect(mockSpeech.speakSentence).toHaveBeenCalledWith(RULE_LINE, true);

    fireDelayedCall(game, OPENING_SPEECH_DELAY);
    expect(mockSpeech.speakSentence).toHaveBeenCalledWith(state.rounds[0].text, true);

    for (let round = 0; round < ROUND_COUNT; round++) {
      const current = internals(game);
      expect(current.roundIndex).toBe(round);
      expect(current.choices).toHaveLength(3);
      expect(new Set(current.choices).size, "three distinct faces").toBe(3);
      expect(getLiveFaceKeys(game)).toEqual(current.choices.map((emotion) => `face_${emotion}`));
      expect(getCards(game)).toHaveLength(3);
      expect(mockSpeech.speakSentence).toHaveBeenCalledWith(current.rounds[round].text, true);

      if (round === 2) {
        const wrong = (targetCardIndex(game) + 1) % 3;
        fireAllObjectEvents(getCards(game)[wrong], "pointerdown");
        expect(mockAudio.playIncorrect).toHaveBeenCalledTimes(1);
        expect(internals(game).roundIndex, "a wrong tap stays on the round").toBe(2);
        expect(mockAudio.playCorrect).toHaveBeenCalledTimes(2);
      }

      tapTargetCard(game);
      expect(mockAudio.playCorrect).toHaveBeenCalledTimes(round + 1);
      fireDelayedCall(game, NEXT_ROUND_DELAY);
    }

    expect(internals(game).roundIndex).toBe(ROUND_COUNT);
    expect(mockAudio.playWin).toHaveBeenCalledTimes(1);
    expect(mockAudio.playSticker).toHaveBeenCalledTimes(1);
    expect(hasSticker("feelings-faces")).toBe(true);
    expect(getImageByKey(game, "sticker_feelings_faces")).toBeDefined();
  });

  it("returns to the hub with the heart sticker on the shelf", () => {
    const game = new FeelingsFacesScene();
    playThrough(game);

    expect(getMockFn(game.scene.start)).not.toHaveBeenCalled();
    autoReturn(game);
    expect(getMockFn(game.scene.start)).toHaveBeenCalledWith("Hub", {
      justEarned: "feelings-faces",
    });

    const hub = new HubScene();
    hub.init({ justEarned: "feelings-faces" });
    hub.create();
    completeHubEntrances(hub);

    expect(getStickerImageSafe(hub, "sticker_feelings_faces")).toBeDefined();
    expect(getEmptySlots(hub), "22 tiles minus the one earned sticker").toHaveLength(21);
  });

  it("does not award a second sticker on a replay and returns without justEarned", () => {
    const first = new FeelingsFacesScene();
    playThrough(first);
    expect(mockAudio.playSticker).toHaveBeenCalledTimes(1);

    const replay = new FeelingsFacesScene();
    playThrough(replay);
    autoReturn(replay);

    expect(mockAudio.playSticker).toHaveBeenCalledTimes(1);
    expect(mockAudio.playWin).toHaveBeenCalledTimes(2);
    expect(getMockFn(replay.scene.start)).toHaveBeenCalledWith("Hub");
  });
});
