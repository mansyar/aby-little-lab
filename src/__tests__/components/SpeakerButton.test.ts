import { SpeakerButton } from "../../components/SpeakerButton";

vi.mock("phaser", () => {
  class Rectangle {
    static Contains = vi.fn(() => true);

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

const pressFeedback = vi.hoisted(() => vi.fn());
vi.mock("../../utils/pressFeedback", () => ({
  attachPressFeedback: pressFeedback,
}));

type MockFn = ReturnType<typeof vi.fn>;

interface MockImage {
  destroy: MockFn;
  on: MockFn;
  setDisplaySize: MockFn;
  setInteractive: MockFn;
}

function createImage(): MockImage {
  const image: MockImage = {
    destroy: vi.fn(),
    on: vi.fn(),
    setDisplaySize: vi.fn().mockReturnThis(),
    setInteractive: vi.fn().mockReturnThis(),
  };
  return image;
}

function createScene() {
  const image = createImage();
  return {
    add: { image: vi.fn(() => image) },
    image,
  };
}

describe("SpeakerButton", () => {
  it("renders the speaker icon texture at the display size", () => {
    const scene = createScene();
    new SpeakerButton(scene as never, 100, 200, { onSpeak: vi.fn() });

    expect(scene.add.image).toHaveBeenCalledWith(100, 200, "icon_speaker");
    expect(scene.image.setDisplaySize).toHaveBeenCalledWith(96, 96);
  });

  it("uses an inflated 96x96 hit area (meets the ideal touch target)", () => {
    const scene = createScene();
    new SpeakerButton(scene as never, 100, 200, { onSpeak: vi.fn() });

    const hitArea = scene.image.setInteractive.mock.calls[0][0].hitArea;
    expect(hitArea.width).toBe(96);
    expect(hitArea.height).toBe(96);
    // Centered on the button position.
    expect(hitArea.x).toBe(-48);
    expect(hitArea.y).toBe(-48);
  });

  it("invokes the speech callback on pointerdown", () => {
    const scene = createScene();
    const onSpeak = vi.fn();
    new SpeakerButton(scene as never, 100, 200, { onSpeak });

    const handler = scene.image.on.mock.calls.find((call) => call[0] === "pointerdown")?.[1];
    expect(handler).toBeDefined();
    handler();
    expect(onSpeak).toHaveBeenCalledTimes(1);
  });

  it("attaches squish press feedback to the button", () => {
    const scene = createScene();
    new SpeakerButton(scene as never, 100, 200, { onSpeak: vi.fn() });

    expect(pressFeedback).toHaveBeenCalledWith(scene.image);
  });

  it("destroys the button image on destroy", () => {
    const scene = createScene();
    const button = new SpeakerButton(scene as never, 100, 200, { onSpeak: vi.fn() });

    button.destroy();
    expect(scene.image.destroy).toHaveBeenCalled();
  });
});
