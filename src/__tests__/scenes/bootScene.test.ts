import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getMockFn, mockAudio, mockSpeech } from "../helpers/sceneFlowHarness";

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

import { BootScene } from "../../scenes/BootScene";
import { ensureGlyphFontLoaded } from "../../utils/fonts";
import { updateSettings } from "../../utils/storage";

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

describe("BootScene", () => {
  it("transitions to PreloadScene on create", async () => {
    const scene = new BootScene();
    scene.create();

    // The glyph font gate resolves on a microtask; flush before asserting.
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(getMockFn(scene.scene.start)).toHaveBeenCalledWith("Preload");
  });

  it("waits for the Baloo 2 glyph font before starting Preload", async () => {
    // Definite-assignment (`!`) is safe here: the Promise executor runs
    // synchronously, so resolveFont is assigned before any await.
    let resolveFont!: () => void;
    vi.mocked(ensureGlyphFontLoaded).mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resolveFont = resolve;
      }),
    );

    const scene = new BootScene();
    scene.create();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(getMockFn(scene.scene.start)).not.toHaveBeenCalled();

    resolveFont();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(getMockFn(scene.scene.start)).toHaveBeenCalledWith("Preload");
  });

  it("attempts to lock screen orientation to landscape", () => {
    const scene = new BootScene();
    scene.create();

    expect(screen.orientation.lock).toHaveBeenCalledWith("landscape");
  });

  it("handles orientation lock rejection gracefully", async () => {
    vi.stubGlobal("screen", {
      orientation: {
        lock: vi.fn().mockRejectedValue(new Error("NotSupported")),
        unlock: vi.fn(),
      },
    });

    const scene = new BootScene();
    scene.create();

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(getMockFn(scene.scene.start)).toHaveBeenCalledWith("Preload");
  });

  it("does not crash when screen.orientation.lock is unavailable (iPad WebKit)", async () => {
    // iPad Safari/Chrome (WebKit) expose only a partial Screen Orientation
    // API: `screen.orientation` exists but `lock` is missing. Calling it
    // throws a synchronous TypeError, so BootScene must still start Preload.
    vi.stubGlobal("screen", {
      orientation: {
        unlock: vi.fn(),
      },
    });

    const scene = new BootScene();
    scene.create();

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(getMockFn(scene.scene.start)).toHaveBeenCalledWith("Preload");
  });

  it("initializes the AudioManager on create", () => {
    const scene = new BootScene();
    scene.create();

    expect(mockAudio.init).toHaveBeenCalled();
  });

  it("applies the stored TTS voice preference on create", () => {
    updateSettings({ preferredVoiceURI: "urn:test-voice" });

    const scene = new BootScene();
    scene.create();

    expect(mockSpeech.setPreferredVoiceURI).toHaveBeenCalledWith("urn:test-voice");
  });
});
