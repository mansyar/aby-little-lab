import { SpeakerButton } from "../../components/SpeakerButton";
import { tapHits } from "../helpers/hitTest";

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

  it("does not define a custom hit area (frame-based default covers the icon)", () => {
    const scene = createScene();
    new SpeakerButton(scene as never, 100, 200, { onSpeak: vi.fn() });

    // The engine's frame-based default hit area is used: no custom hitArea
    // config is passed to setInteractive.
    expect(scene.image.setInteractive).toHaveBeenCalledWith();
  });

  it("is tappable across the entire visible 96x96 icon (engine-accurate hit test)", () => {
    const scene = createScene();
    new SpeakerButton(scene as never, 100, 200, { onSpeak: vi.fn() });

    // Mirrors InputManager.pointWithinHitArea: the tap is transformed into
    // texture-local space (displayOrigin = half the 512x512 raster) before the
    // hit area is tested. The engine's default hit area is the full frame.
    const config = scene.image.setInteractive.mock.calls[0]?.[0] as
      | { hitArea: { x: number; y: number; width: number; height: number } }
      | undefined;
    const subject = {
      x: 100,
      y: 200,
      scale: 96 / 512,
      displayOriginX: 512 / 2,
      displayOriginY: 512 / 2,
      hitArea: config?.hitArea ?? { x: 0, y: 0, width: 512, height: 512 },
    };

    // Taps on the center and edges of the visible icon hit.
    expect(tapHits(subject, 100, 200)).toBe(true);
    expect(tapHits(subject, 100 + 40, 200)).toBe(true);
    expect(tapHits(subject, 100 - 40, 200 - 40)).toBe(true);
    // Taps outside the icon miss.
    expect(tapHits(subject, 100 + 60, 200)).toBe(false);
    expect(tapHits(subject, 100 - 60, 200 + 60)).toBe(false);
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
