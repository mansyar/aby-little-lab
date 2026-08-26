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

const speech = vi.hoisted(() => ({
  isSpeechSupported: vi.fn(() => true),
  onSpeechLifecycle: vi.fn(() => vi.fn()),
}));
vi.mock("../../utils/speech", () => speech);

const motion = vi.hoisted(() => ({
  isReducedMotion: vi.fn(() => false),
}));
vi.mock("../../utils/motion", () => motion);

type MockFn = ReturnType<typeof vi.fn>;
type LifecycleListener = (event: { kind: string }) => void;

interface MockImage {
  clearTint: MockFn;
  destroy: MockFn;
  on: MockFn;
  setAlpha: MockFn;
  setDisplaySize: MockFn;
  setInteractive: MockFn;
  setTint: MockFn;
}

interface MockScene {
  add: { image: MockFn };
  image: MockImage;
  tweens: { add: MockFn };
}

function createImage(): MockImage {
  const image: MockImage = {
    clearTint: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
    on: vi.fn().mockReturnThis(),
    setAlpha: vi.fn().mockReturnThis(),
    setDisplaySize: vi.fn().mockReturnThis(),
    setInteractive: vi.fn().mockReturnThis(),
    setTint: vi.fn().mockReturnThis(),
  };
  return image;
}

function createScene(): MockScene {
  const image = createImage();
  return {
    add: { image: vi.fn(() => image) },
    image,
    tweens: {
      add: vi.fn(() => ({ stop: vi.fn() })),
    },
  };
}

/** Returns the lifecycle listener the button registered (throws if none). */
function registeredListener(): LifecycleListener {
  const call = speech.onSpeechLifecycle.mock.calls.at(-1);
  const listener = call?.[0];
  if (typeof listener !== "function") {
    throw new Error("SpeakerButton did not register a speech lifecycle listener");
  }
  return listener as LifecycleListener;
}

describe("SpeakerButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    speech.isSpeechSupported.mockReturnValue(true);
    motion.isReducedMotion.mockReturnValue(false);
  });

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

  describe("speaker state feedback", () => {
    it("subscribes to the speech lifecycle while supported and unmuted", () => {
      const scene = createScene();
      new SpeakerButton(scene as never, 100, 200, { onSpeak: vi.fn() });

      expect(speech.onSpeechLifecycle).toHaveBeenCalledTimes(1);
      expect(scene.image.setTint).not.toHaveBeenCalled();
    });

    it("pulses while speaking and returns to neutral after the utterance ends", () => {
      const scene = createScene();
      new SpeakerButton(scene as never, 100, 200, { onSpeak: vi.fn() });
      const listener = registeredListener();

      listener({ kind: "speech:start" });
      expect(scene.image.setTint).toHaveBeenCalledWith(0x68d391);
      expect(scene.tweens.add).toHaveBeenCalledTimes(1);
      const tween = scene.tweens.add.mock.results[0]?.value;

      listener({ kind: "speech:end" });
      expect(scene.image.clearTint).toHaveBeenCalled();
      expect(scene.image.setAlpha).toHaveBeenLastCalledWith(1);
      expect(tween.stop).toHaveBeenCalled();
    });

    it("returns to neutral after a speech error", () => {
      const scene = createScene();
      new SpeakerButton(scene as never, 100, 200, { onSpeak: vi.fn() });
      const listener = registeredListener();

      listener({ kind: "speech:start" });
      listener({ kind: "speech:error" });
      expect(scene.image.clearTint).toHaveBeenCalled();
      expect(scene.image.setAlpha).toHaveBeenLastCalledWith(1);
    });

    it("shows a dimmed unavailable presentation when speech is unsupported", () => {
      speech.isSpeechSupported.mockReturnValue(false);
      const scene = createScene();
      new SpeakerButton(scene as never, 100, 200, { onSpeak: vi.fn() });

      expect(speech.onSpeechLifecycle).not.toHaveBeenCalled();
      expect(scene.image.setTint).toHaveBeenCalledWith(0xa0aec0);
      expect(scene.image.setAlpha).toHaveBeenCalledWith(0.6);
    });

    it("shows a dimmed muted presentation when the SFX toggle is off", () => {
      const scene = createScene();
      new SpeakerButton(scene as never, 100, 200, { onSpeak: vi.fn(), muted: true });

      expect(speech.onSpeechLifecycle).not.toHaveBeenCalled();
      expect(scene.image.setTint).toHaveBeenCalledWith(0xa0aec0);
      expect(scene.image.setAlpha).toHaveBeenCalledWith(0.6);
    });

    it("setActive drives the same grammar for non-Web-Speech replay", () => {
      const scene = createScene();
      const button = new SpeakerButton(scene as never, 100, 200, { onSpeak: vi.fn() });

      button.setActive(true);
      expect(scene.image.setTint).toHaveBeenCalledWith(0x68d391);
      expect(scene.tweens.add).toHaveBeenCalledTimes(1);

      button.setActive(false);
      expect(scene.image.clearTint).toHaveBeenCalled();
      expect(scene.image.setAlpha).toHaveBeenLastCalledWith(1);
    });

    it("does not create a pulsing tween under reduced motion but still tints", () => {
      motion.isReducedMotion.mockReturnValue(true);
      const scene = createScene();
      const button = new SpeakerButton(scene as never, 100, 200, { onSpeak: vi.fn() });

      button.setActive(true);
      expect(scene.image.setTint).toHaveBeenCalledWith(0x68d391);
      expect(scene.tweens.add).not.toHaveBeenCalled();
    });

    it("destroy unsubscribes the lifecycle and stops the active tween", () => {
      const scene = createScene();
      const button = new SpeakerButton(scene as never, 100, 200, { onSpeak: vi.fn() });
      const unsubscribe = speech.onSpeechLifecycle.mock.results.at(-1)?.value;

      button.setActive(true);
      const tween = scene.tweens.add.mock.results.at(-1)?.value;

      button.destroy();
      expect(unsubscribe).toBeTypeOf("function");
      expect(unsubscribe).toHaveBeenCalled();
      expect(tween.stop).toHaveBeenCalled();
      expect(scene.image.destroy).toHaveBeenCalled();
    });

    it("still attaches squish press feedback on a muted button", () => {
      const scene = createScene();
      new SpeakerButton(scene as never, 100, 200, { onSpeak: vi.fn(), muted: true });

      expect(pressFeedback).toHaveBeenCalledWith(scene.image);
    });
  });
});
