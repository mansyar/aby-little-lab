import { afterEach, describe, expect, it, vi } from "vitest";
import { HelpButton } from "../../../components/settings/HelpButton";
import { PANEL_WIDTH } from "../../../components/settings/primitives";
import { type MockFn, type MockObject, MockScene } from "../../helpers/phaserMock";

vi.mock("phaser", async () => {
  const { createPhaserModuleMock } = await import("../../helpers/phaserMock");
  return createPhaserModuleMock().module;
});

const CENTER_X = 512;
const CENTER_Y = 384;
/** Mirrors the close ✕'s inset and header offset. */
const INSET = 36;
const HEADER_OFFSET = -161;

interface Setup {
  button: HelpButton;
  objects: MockObject[];
  onOpen: MockFn;
  scene: MockScene;
}

/** Builds a Help button in isolation with its own object bucket. */
function setup(): Setup {
  const objects: MockObject[] = [];
  const scene = new MockScene();
  const onOpen = vi.fn();
  const button = new HelpButton({
    scene: scene as never,
    objects: objects as never,
    centerX: CENTER_X,
    centerY: CENTER_Y,
    onOpen,
  });
  return { button, objects, onOpen, scene };
}

/** The label the button created, and only that label. */
function labelOf(objects: MockObject[]): MockObject {
  const labels = objects.filter((object) => object.kind === "text" && object.args?.[2] === "Help");
  if (labels.length !== 1) throw new Error(`expected one Help label, got ${labels.length}`);
  return labels[0] as MockObject;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("HelpButton", () => {
  it("sits in the mirrored header slot with the close control's 96px hit area", () => {
    const { button, objects, scene } = setup();
    const label = labelOf(objects);
    const x = CENTER_X - PANEL_WIDTH / 2 + INSET;
    const y = CENTER_Y + HEADER_OFFSET;

    expect(label.args?.[0]).toBe(x);
    expect(label.args?.[1]).toBe(y);
    expect(label.setInteractive).toHaveBeenCalledWith(
      expect.objectContaining({
        hitArea: expect.objectContaining({ width: 96, height: 96 }),
      }),
    );
    expect(button.point()).toEqual({ x, y });
    button.raise();
    expect(scene.children.bringToTop).toHaveBeenCalledWith(label);
  });

  it("publishes its point from the label, not a second stored copy", () => {
    const { button, objects } = setup();
    const label = labelOf(objects);
    label.x = 123;
    label.y = 456;

    expect(button.point()).toEqual({ x: 123, y: 456 });
  });

  it("opens once per tap and owns no other interactive object", () => {
    const { objects, onOpen } = setup();
    const label = labelOf(objects);
    expect(objects).toHaveLength(1);

    const pointerDowns = label.allHandlers.filter((handler) => handler.name === "pointerdown");
    expect(pointerDowns).toHaveLength(2);
    for (let tap = 0; tap < 2; tap += 1) {
      for (const handler of pointerDowns) handler.cb();
    }

    expect(onOpen).toHaveBeenCalledTimes(2);
    expect(onOpen).toHaveBeenCalledWith();
  });
});
