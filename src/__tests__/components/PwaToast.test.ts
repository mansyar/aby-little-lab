import { PwaToast } from "../../components/PwaToast";

const { mockMatchMedia } = vi.hoisted(() => ({
  mockMatchMedia: vi.fn(),
}));

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

vi.mock("../../utils/motion", () => ({
  isReducedMotion: () => mockMatchMedia()?.matches === true,
  motionDuration: (normal: number, reduced: number) =>
    mockMatchMedia()?.matches === true ? reduced : normal,
}));

type MockFn = ReturnType<typeof vi.fn>;

interface MockGameObject {
  destroy: MockFn;
  on: MockFn;
  setAlpha: MockFn;
  setInteractive: MockFn;
  setOrigin: MockFn;
  setScale: MockFn;
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
  tweens: {
    add: MockFn;
  };
}

function createGameObject(): MockGameObject {
  const object: MockGameObject = {
    destroy: vi.fn(),
    on: vi.fn(),
    setAlpha: vi.fn(),
    setInteractive: vi.fn(),
    setOrigin: vi.fn(),
    setScale: vi.fn(),
    setStrokeStyle: vi.fn(),
  };
  object.setAlpha.mockReturnValue(object);
  object.setInteractive.mockReturnValue(object);
  object.setOrigin.mockReturnValue(object);
  object.setScale.mockReturnValue(object);
  object.setStrokeStyle.mockReturnValue(object);
  return object;
}

function triggerPointerdown(object: MockGameObject): void {
  const callback = object.on.mock.calls.find(([event]) => event === "pointerdown")?.[1] as
    | (() => void)
    | undefined;
  if (!callback) throw new Error("Expected pointerdown handler");
  callback();
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
    tweens: {
      add: vi.fn(),
    },
  };
}

/** Returns the text objects created by the toast (title + buttons). */
function getTextObjects(scene: MockScene): MockGameObject[] {
  return scene.add.text.mock.results.map((result) => result.value as MockGameObject);
}

/** Returns the label passed when creating the text object at the given index. */
function getTextLabels(scene: MockScene): string[] {
  return scene.add.text.mock.calls.map((call) => call[2] as string);
}

describe("PwaToast rendering", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMatchMedia.mockReturnValue({ matches: false });
  });

  it("renders an update toast with a panel and title", () => {
    const scene = createScene();

    new PwaToast(scene as never, { kind: "update", onUpdate: vi.fn(), onDismiss: vi.fn() });

    expect(scene.add.rectangle).toHaveBeenCalledWith(
      512,
      expect.any(Number),
      expect.any(Number),
      expect.any(Number),
      0xfff8e7,
    );
    const panel = scene.add.rectangle.mock.results[0]?.value as MockGameObject;
    expect(panel.setStrokeStyle).toHaveBeenCalledWith(4, 0x2d3748);
    expect(getTextLabels(scene)).toContain("New version ready!");
  });

  it("renders an offline toast with a panel and title", () => {
    const scene = createScene();

    new PwaToast(scene as never, { kind: "offline", onDismiss: vi.fn() });

    expect(getTextLabels(scene)).toContain("Ready to play offline!");
  });

  it("shows an Update now button and a Later dismiss button for update toasts", () => {
    const scene = createScene();

    new PwaToast(scene as never, { kind: "update", onUpdate: vi.fn(), onDismiss: vi.fn() });

    const labels = getTextLabels(scene);
    expect(labels).toContain("Update now");
    expect(labels).toContain("Later");
  });

  it("shows a single OK dismiss button for offline toasts", () => {
    const scene = createScene();

    new PwaToast(scene as never, { kind: "offline", onDismiss: vi.fn() });

    const labels = getTextLabels(scene);
    expect(labels).toContain("OK");
    expect(labels).not.toContain("Update now");
    expect(labels).not.toContain("Later");
  });

  it("gives every button an inflated touch target of at least 64px", () => {
    const scene = createScene();

    new PwaToast(scene as never, { kind: "update", onUpdate: vi.fn(), onDismiss: vi.fn() });

    const buttons = getTextObjects(scene).slice(1); // skip the title
    expect(buttons.length).toBeGreaterThan(0);
    for (const button of buttons) {
      expect(button.setInteractive).toHaveBeenCalledWith(
        expect.objectContaining({
          hitArea: expect.objectContaining({
            height: expect.any(Number),
            width: expect.any(Number),
          }),
        }),
      );
      const config = button.setInteractive.mock.calls[0]?.[0] as {
        hitArea: { height: number; width: number };
      };
      expect(config.hitArea.width).toBeGreaterThanOrEqual(64);
      expect(config.hitArea.height).toBeGreaterThanOrEqual(64);
    }
  });
});

describe("PwaToast interaction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMatchMedia.mockReturnValue({ matches: false });
  });

  it("fires onUpdate when Update now is tapped", () => {
    const scene = createScene();
    const onUpdate = vi.fn();
    const onDismiss = vi.fn();
    new PwaToast(scene as never, { kind: "update", onUpdate, onDismiss });

    const updateButton = getTextObjects(scene).find(
      (_object, index) => getTextLabels(scene)[index] === "Update now",
    );
    if (!updateButton) throw new Error("Expected Update now button");
    triggerPointerdown(updateButton);

    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("fires onDismiss when Later is tapped", () => {
    const scene = createScene();
    const onDismiss = vi.fn();
    new PwaToast(scene as never, { kind: "update", onUpdate: vi.fn(), onDismiss });

    const laterButton = getTextObjects(scene).find(
      (_object, index) => getTextLabels(scene)[index] === "Later",
    );
    if (!laterButton) throw new Error("Expected Later button");
    triggerPointerdown(laterButton);

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("fires onDismiss when the offline OK button is tapped", () => {
    const scene = createScene();
    const onDismiss = vi.fn();
    new PwaToast(scene as never, { kind: "offline", onDismiss });

    const okButton = getTextObjects(scene).find(
      (_object, index) => getTextLabels(scene)[index] === "OK",
    );
    if (!okButton) throw new Error("Expected OK button");
    triggerPointerdown(okButton);

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("destroys every toast object when destroy is called", () => {
    const scene = createScene();
    const toast = new PwaToast(scene as never, {
      kind: "update",
      onUpdate: vi.fn(),
      onDismiss: vi.fn(),
    });
    const objects = [
      ...scene.add.rectangle.mock.results.map((result) => result.value as MockGameObject),
      ...getTextObjects(scene),
    ];

    toast.destroy();

    for (const object of objects) expect(object.destroy).toHaveBeenCalled();
  });

  it("does not crash when callbacks are omitted", () => {
    const scene = createScene();

    expect(() => {
      new PwaToast(scene as never, { kind: "update" });
    }).not.toThrow();
  });
});

describe("PwaToast reduced motion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMatchMedia.mockReturnValue({ matches: true });
  });

  it("animates alpha only, without scaling, under reduced motion", () => {
    const scene = createScene();

    new PwaToast(scene as never, { kind: "offline", onDismiss: vi.fn() });

    expect(scene.tweens.add).toHaveBeenCalled();
    for (const call of scene.tweens.add.mock.calls) {
      const config = call[0] as Record<string, unknown>;
      expect(config.scaleX).toBeUndefined();
      expect(config.scaleY).toBeUndefined();
      expect(config.alpha).toBe(1);
    }
    // No scale pre-animation either.
    const title = getTextObjects(scene)[0];
    expect(title.setScale).not.toHaveBeenCalled();
  });
});

describe("PwaToast engine hit test", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMatchMedia.mockReturnValue({ matches: false });
  });

  interface HitConfig {
    hitArea: { height: number; width: number; x: number; y: number };
    hitAreaCallback: (area: unknown, localX: number, localY: number, object: unknown) => boolean;
  }

  /** Reads the hit-area config a toast button was handed, failing loudly otherwise. */
  function configOf(object: MockGameObject): HitConfig {
    const config = object.setInteractive.mock.calls[0]?.[0] as HitConfig | undefined;
    if (!config?.hitAreaCallback) throw new Error("No custom hit area callback");
    return config;
  }

  /**
   * Answers the engine's own question for a scene-space point: it adds the
   * display origin to the local pointer before calling the callback, exactly
   * as `InputManager.pointWithinHitArea` does, so a band that only looks right
   * relative to the object's centre fails here.
   */
  function engineHits(
    config: HitConfig,
    objectX: number,
    objectY: number,
    displayOriginX: number,
    displayOriginY: number,
    pointX: number,
    pointY: number,
  ): boolean {
    return config.hitAreaCallback(
      config.hitArea,
      pointX - objectX + displayOriginX,
      pointY - objectY + displayOriginY,
      { displayOriginX, displayOriginY },
    );
  }

  /** Scene-space position arguments of the text call that created the object. */
  function textCallArgs(scene: MockScene, object: MockGameObject): [number, number] {
    const index = scene.add.text.mock.results.findIndex((result) => result.value === object);
    if (index < 0) throw new Error("Object was not created by scene.add.text");
    return scene.add.text.mock.calls[index] as unknown as [number, number];
  }

  /** Finds the button text object with the exact label. */
  function findButtonByLabel(scene: MockScene, label: string): MockGameObject | undefined {
    const index = scene.add.text.mock.calls.findIndex((call) => call[2] === label);
    if (index < 0) return undefined;
    return scene.add.text.mock.results[index]?.value as MockGameObject | undefined;
  }

  // Drawn extents of 24px labels in the suite's measurement convention —
  // mirrors SettingsPanel.test.ts GLYPH_WIDTH/LINE_HEIGHT scaled to 24px.
  const UPDATE_WORD_HALF = 60; // "Update now": 10 chars x 12px
  const LATER_WORD_HALF = 30; // "Later": 5 chars x 12px
  const OK_WORD_HALF = 12; // "OK": 2 chars x 12px
  const LINE_HALF = 16; // 24px line box, about 32px tall
  const BAND_HALF_WIDTH = 100;
  const BAND_HALF_HEIGHT = 36;

  /**
   * Asserts one button's engine-frame behaviour at every displayOrigin the
   * engine may hand over (origin 0 and two realistic centre-anchored values):
   * drawn centre and word edges live, the full 200x72 band live, one pixel
   * outside dead.
   */
  function expectButtonBand(scene: MockScene, label: string, wordHalf: number): void {
    const button = findButtonByLabel(scene, label);
    expect(button).toBeDefined();
    const [objectX, objectY] = textCallArgs(scene, button as MockGameObject);
    const config = configOf(button as MockGameObject);
    // The band keeps today's intended 200 x 72 size.
    expect(config.hitArea.width).toBe(BAND_HALF_WIDTH * 2);
    expect(config.hitArea.height).toBe(BAND_HALF_HEIGHT * 2);

    for (const [displayOriginX, displayOriginY] of [
      [0, 0],
      [wordHalf, LINE_HALF],
      [137, 13],
    ] as const) {
      // Drawn centre and drawn word edges live.
      expect(
        engineHits(config, objectX, objectY, displayOriginX, displayOriginY, objectX, objectY),
      ).toBe(true);
      expect(
        engineHits(
          config,
          objectX,
          objectY,
          displayOriginX,
          displayOriginY,
          objectX + wordHalf,
          objectY + LINE_HALF,
        ),
      ).toBe(true);
      expect(
        engineHits(
          config,
          objectX,
          objectY,
          displayOriginX,
          displayOriginY,
          objectX - wordHalf,
          objectY - LINE_HALF,
        ),
      ).toBe(true);
      // The full band is live (inclusive edges).
      expect(
        engineHits(
          config,
          objectX,
          objectY,
          displayOriginX,
          displayOriginY,
          objectX + BAND_HALF_WIDTH,
          objectY + BAND_HALF_HEIGHT,
        ),
      ).toBe(true);
      expect(
        engineHits(
          config,
          objectX,
          objectY,
          displayOriginX,
          displayOriginY,
          objectX - BAND_HALF_WIDTH,
          objectY - BAND_HALF_HEIGHT,
        ),
      ).toBe(true);
      // One pixel outside the band is dead.
      expect(
        engineHits(
          config,
          objectX,
          objectY,
          displayOriginX,
          displayOriginY,
          objectX + BAND_HALF_WIDTH + 1,
          objectY,
        ),
      ).toBe(false);
      expect(
        engineHits(
          config,
          objectX,
          objectY,
          displayOriginX,
          displayOriginY,
          objectX - BAND_HALF_WIDTH - 1,
          objectY,
        ),
      ).toBe(false);
      expect(
        engineHits(
          config,
          objectX,
          objectY,
          displayOriginX,
          displayOriginY,
          objectX,
          objectY + BAND_HALF_HEIGHT + 1,
        ),
      ).toBe(false);
      expect(
        engineHits(
          config,
          objectX,
          objectY,
          displayOriginX,
          displayOriginY,
          objectX,
          objectY - BAND_HALF_HEIGHT - 1,
        ),
      ).toBe(false);
    }
  }

  it("lands Update now taps across its drawn word and its 200x72 band", () => {
    const scene = createScene();
    new PwaToast(scene as never, { kind: "update", onUpdate: vi.fn(), onDismiss: vi.fn() });

    expectButtonBand(scene, "Update now", UPDATE_WORD_HALF);
  });

  it("lands Later taps across its drawn word and its 200x72 band", () => {
    const scene = createScene();
    new PwaToast(scene as never, { kind: "update", onUpdate: vi.fn(), onDismiss: vi.fn() });

    expectButtonBand(scene, "Later", LATER_WORD_HALF);
  });

  it("lands OK taps across its drawn word and its 200x72 band", () => {
    const scene = createScene();
    new PwaToast(scene as never, { kind: "offline", onDismiss: vi.fn() });

    expectButtonBand(scene, "OK", OK_WORD_HALF);
  });
});
