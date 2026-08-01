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
