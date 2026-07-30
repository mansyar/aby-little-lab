import { SettingsPanel } from "../../components/SettingsPanel";

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
  setOrigin: MockFn;
  setStrokeStyle: MockFn;
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
    setOrigin: vi.fn(),
    setStrokeStyle: vi.fn(),
  };
  object.setOrigin.mockReturnValue(object);
  object.setInteractive.mockReturnValue(object);
  object.setStrokeStyle.mockReturnValue(object);
  return object;
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

    const toggleObjects = scene.add.text.mock.results.slice(1).map((result) => result.value);
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
