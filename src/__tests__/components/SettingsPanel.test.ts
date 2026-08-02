import { SettingsPanel } from "../../components/SettingsPanel";
import type { InstallTracker, InstallUiState } from "../../utils/pwaInstall";

const { mockAudio } = vi.hoisted(() => ({
  mockAudio: {
    pauseBGM: vi.fn(),
    playBGM: vi.fn(),
    playCorrect: vi.fn(),
    setBGMEnabled: vi.fn(),
    setSFXEnabled: vi.fn(),
  },
}));

vi.mock("../../audio/AudioManager", () => ({
  AudioManager: {
    getInstance: () => mockAudio,
  },
}));

/** Creates a fake install tracker in the given state for SettingsPanel tests. */
function createFakeInstallTracker(state: InstallUiState): InstallTracker {
  return {
    getState: vi.fn(() => state),
    prompt: vi.fn().mockResolvedValue(true),
    destroy: vi.fn(),
  };
}

vi.mock("phaser", () => {
  class Rectangle {
    static Contains = vi.fn();

    constructor(
      readonly x: number,
      readonly y: number,
      readonly width: number,
      readonly height: number,
    ) {}
  }

  return {
    default: { Geom: { Rectangle } },
    Geom: { Rectangle },
  };
});

type MockFn = ReturnType<typeof vi.fn>;

interface MockGameObject {
  destroy: MockFn;
  on: MockFn;
  setInteractive: MockFn;
  setColor: MockFn;
  setOrigin: MockFn;
  setStrokeStyle: MockFn;
  setText: MockFn;
}

interface MockScene {
  add: {
    rectangle: MockFn;
    text: MockFn;
  };
  cameras: {
    main: {
      height: number;
      width: number;
    };
  };
}

function createGameObject(): MockGameObject {
  const object: MockGameObject = {
    destroy: vi.fn(),
    on: vi.fn(),
    setInteractive: vi.fn(),
    setColor: vi.fn(),
    setOrigin: vi.fn(),
    setStrokeStyle: vi.fn(),
    setText: vi.fn(),
  };
  object.setColor.mockReturnValue(object);
  object.setOrigin.mockReturnValue(object);
  object.setInteractive.mockReturnValue(object);
  object.setStrokeStyle.mockReturnValue(object);
  object.setText.mockReturnValue(object);
  return object;
}

function triggerPointerdown(object: MockGameObject): void {
  const callback = object.on.mock.calls.find(([event]) => event === "pointerdown")?.[1] as
    | (() => void)
    | undefined;
  if (!callback) throw new Error("Expected pointerdown handler");
  callback();
}

/** Finds the display object created by the first text call with the given label. */
function findTextByLabel(scene: MockScene, label: string): MockGameObject | undefined {
  const callIndex = scene.add.text.mock.calls.findIndex((call) => call[2] === label);
  if (callIndex < 0) return undefined;
  return scene.add.text.mock.results[callIndex]?.value as MockGameObject | undefined;
}

function createScene(): MockScene {
  return {
    add: {
      rectangle: vi.fn(() => createGameObject()),
      text: vi.fn(() => createGameObject()),
    },
    cameras: {
      main: {
        height: 768,
        width: 1024,
      },
    },
  };
}

describe("SettingsPanel creation and display", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("creates a semi-transparent black backdrop covering the scene", () => {
    const scene = createScene();

    new SettingsPanel(scene as never);

    expect(scene.add.rectangle).toHaveBeenCalledWith(512, 384, 1024, 768, 0x000000, 0.6);
  });

  it("creates a centered cream panel with a dark outline", () => {
    const scene = createScene();

    new SettingsPanel(scene as never);

    expect(scene.add.rectangle).toHaveBeenCalledWith(
      512,
      384,
      expect.any(Number),
      expect.any(Number),
      0xfff8e7,
    );
    const panel = scene.add.rectangle.mock.results[1]?.value as MockGameObject;
    expect(panel.setStrokeStyle).toHaveBeenCalledWith(4, 0x2d3748);
  });

  it("displays a Settings title", () => {
    const scene = createScene();

    new SettingsPanel(scene as never);

    expect(scene.add.text).toHaveBeenCalledWith(
      512,
      expect.any(Number),
      "Settings",
      expect.objectContaining({ color: "#2d3748" }),
    );
  });

  it.each([
    [{ bgmEnabled: true, sfxEnabled: true }, "BGM: ON", "SFX: ON", "#68d391"],
    [{ bgmEnabled: false, sfxEnabled: false }, "BGM: OFF", "SFX: OFF", "#a0aec0"],
  ])("reflects stored toggle state %o", (settings, bgmLabel, sfxLabel, color) => {
    localStorage.setItem("abby-little-lab:v1", JSON.stringify({ stickers: {}, settings }));
    const scene = createScene();

    new SettingsPanel(scene as never);

    expect(scene.add.text).toHaveBeenCalledWith(
      expect.any(Number),
      expect.any(Number),
      bgmLabel,
      expect.objectContaining({ color }),
    );
    expect(scene.add.text).toHaveBeenCalledWith(
      expect.any(Number),
      expect.any(Number),
      sfxLabel,
      expect.objectContaining({ color }),
    );
  });

  it("gives both toggle labels inflated touch targets of at least 64px", () => {
    const scene = createScene();

    new SettingsPanel(scene as never);

    const toggleObjects = scene.add.text.mock.results
      .map((result) => result.value as MockGameObject)
      .filter(
        (_object, index) =>
          scene.add.text.mock.calls[index]?.[2] === "BGM: ON" ||
          scene.add.text.mock.calls[index]?.[2] === "BGM: OFF" ||
          scene.add.text.mock.calls[index]?.[2] === "SFX: ON" ||
          scene.add.text.mock.calls[index]?.[2] === "SFX: OFF",
      );
    expect(toggleObjects).toHaveLength(2);
    for (const toggle of toggleObjects) {
      expect(toggle.setInteractive).toHaveBeenCalledWith(
        expect.objectContaining({
          hitArea: expect.objectContaining({
            height: expect.any(Number),
            width: expect.any(Number),
          }),
        }),
      );
      const config = toggle.setInteractive.mock.calls[0]?.[0] as {
        hitArea: { height: number; width: number };
      };
      expect(config.hitArea.width).toBeGreaterThanOrEqual(64);
      expect(config.hitArea.height).toBeGreaterThanOrEqual(64);
    }
  });
});

describe("SettingsPanel interaction", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("disables BGM, pauses it, and updates its label", () => {
    const scene = createScene();
    new SettingsPanel(scene as never);
    const bgmToggle = scene.add.text.mock.results[1]?.value as MockGameObject;

    triggerPointerdown(bgmToggle);

    expect(mockAudio.setBGMEnabled).toHaveBeenCalledWith(false);
    expect(mockAudio.pauseBGM).toHaveBeenCalled();
    expect(bgmToggle.setText).toHaveBeenCalledWith("BGM: OFF");
    expect(bgmToggle.setColor).toHaveBeenCalledWith("#a0aec0");
  });

  it("enables BGM, starts it, and updates its label", () => {
    localStorage.setItem(
      "abby-little-lab:v1",
      JSON.stringify({ stickers: {}, settings: { bgmEnabled: false, sfxEnabled: true } }),
    );
    const scene = createScene();
    new SettingsPanel(scene as never);
    const bgmToggle = scene.add.text.mock.results[1]?.value as MockGameObject;

    triggerPointerdown(bgmToggle);

    expect(mockAudio.setBGMEnabled).toHaveBeenCalledWith(true);
    expect(mockAudio.playBGM).toHaveBeenCalled();
    expect(bgmToggle.setText).toHaveBeenCalledWith("BGM: ON");
    expect(bgmToggle.setColor).toHaveBeenCalledWith("#68d391");
  });

  it("disables SFX without playing a chime and updates its label", () => {
    const scene = createScene();
    new SettingsPanel(scene as never);
    const sfxToggle = scene.add.text.mock.results[2]?.value as MockGameObject;

    triggerPointerdown(sfxToggle);

    expect(mockAudio.setSFXEnabled).toHaveBeenCalledWith(false);
    expect(mockAudio.playCorrect).not.toHaveBeenCalled();
    expect(sfxToggle.setText).toHaveBeenCalledWith("SFX: OFF");
    expect(sfxToggle.setColor).toHaveBeenCalledWith("#a0aec0");
  });

  it("enables SFX, plays a chime, and updates its label", () => {
    localStorage.setItem(
      "abby-little-lab:v1",
      JSON.stringify({ stickers: {}, settings: { bgmEnabled: true, sfxEnabled: false } }),
    );
    const scene = createScene();
    new SettingsPanel(scene as never);
    const sfxToggle = scene.add.text.mock.results[2]?.value as MockGameObject;

    triggerPointerdown(sfxToggle);

    expect(mockAudio.setSFXEnabled).toHaveBeenCalledWith(true);
    expect(mockAudio.playCorrect).toHaveBeenCalled();
    expect(sfxToggle.setText).toHaveBeenCalledWith("SFX: ON");
    expect(sfxToggle.setColor).toHaveBeenCalledWith("#68d391");
  });

  it("destroys every panel object when the backdrop is tapped", () => {
    const scene = createScene();
    new SettingsPanel(scene as never);
    const objects = [
      ...scene.add.rectangle.mock.results.map((result) => result.value as MockGameObject),
      ...scene.add.text.mock.results.map((result) => result.value as MockGameObject),
    ];

    triggerPointerdown(objects[0]);

    for (const object of objects) expect(object.destroy).toHaveBeenCalled();
  });

  it("destroys every panel object when destroy is called", () => {
    const scene = createScene();
    const panel = new SettingsPanel(scene as never);
    const objects = [
      ...scene.add.rectangle.mock.results.map((result) => result.value as MockGameObject),
      ...scene.add.text.mock.results.map((result) => result.value as MockGameObject),
    ];

    panel.destroy();

    for (const object of objects) expect(object.destroy).toHaveBeenCalled();
  });
});

describe("SettingsPanel install control", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("shows an Install App button when the tracker is installable", () => {
    const scene = createScene();
    const tracker = createFakeInstallTracker("installable");

    new SettingsPanel(scene as never, tracker);

    expect(scene.add.text).toHaveBeenCalledWith(
      expect.any(Number),
      expect.any(Number),
      "Install App",
      expect.objectContaining({ color: "#2b6cb0" }),
    );
  });

  it("calls tracker.prompt() when Install App is tapped", async () => {
    const scene = createScene();
    const tracker = createFakeInstallTracker("installable");
    new SettingsPanel(scene as never, tracker);

    const installButton = findTextByLabel(scene, "Install App");
    expect(installButton).toBeDefined();
    triggerPointerdown(installButton as MockGameObject);

    expect(tracker.prompt).toHaveBeenCalledTimes(1);
  });

  it("gives the install button an inflated touch target of at least 64px", () => {
    const scene = createScene();
    const tracker = createFakeInstallTracker("installable");
    new SettingsPanel(scene as never, tracker);

    const installButton = findTextByLabel(scene, "Install App") as MockGameObject;
    const config = installButton.setInteractive.mock.calls[0]?.[0] as {
      hitArea: { height: number; width: number };
    };
    expect(config.hitArea.width).toBeGreaterThanOrEqual(64);
    expect(config.hitArea.height).toBeGreaterThanOrEqual(64);
  });

  it("shows a How to Install button on iOS and opens the instructions overlay on tap", () => {
    const scene = createScene();
    const tracker = createFakeInstallTracker("ios-howto");
    new SettingsPanel(scene as never, tracker);

    const howToButton = findTextByLabel(scene, "How to Install");
    expect(howToButton).toBeDefined();
    triggerPointerdown(howToButton as MockGameObject);

    expect(scene.add.text).toHaveBeenCalledWith(
      expect.any(Number),
      expect.any(Number),
      expect.stringContaining("Add to Home Screen"),
      expect.anything(),
    );
  });

  it("shows no install control when the tracker reports hidden", () => {
    const scene = createScene();
    const tracker = createFakeInstallTracker("hidden");

    new SettingsPanel(scene as never, tracker);

    const texts = scene.add.text.mock.calls.map((call) => call[2] as string);
    expect(texts).not.toContain("Install App");
    expect(texts).not.toContain("How to Install");
  });
});

describe("SettingsPanel version footer", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("renders the app version in a muted footer row", () => {
    const scene = createScene();

    new SettingsPanel(scene as never);

    expect(scene.add.text).toHaveBeenCalledWith(
      expect.any(Number),
      expect.any(Number),
      `v${__APP_VERSION__}`,
      expect.objectContaining({ color: "#a0aec0" }),
    );
  });

  it("centers the version footer at the bottom of the panel", () => {
    const scene = createScene();
    new SettingsPanel(scene as never);

    const call = scene.add.text.mock.calls.find((item) => item[2] === `v${__APP_VERSION__}`);
    expect(call).toBeDefined();
    const [x, y] = call as unknown as [number, number];
    expect(x).toBe(512);
    // Below the toggle/install controls, inside the 460px-tall panel (half-height 230).
    expect(y).toBeGreaterThan(384 + 150);
    expect(y).toBeLessThan(384 + 230);
  });

  it("keeps the version footer non-interactive", () => {
    const scene = createScene();
    new SettingsPanel(scene as never);

    const callIndex = scene.add.text.mock.calls.findIndex(
      (item) => item[2] === `v${__APP_VERSION__}`,
    );
    const footer = scene.add.text.mock.results[callIndex]?.value as MockGameObject;
    expect(footer.setInteractive).not.toHaveBeenCalled();
  });
});
