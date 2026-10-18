import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MockFn, MockObject } from "../../helpers/phaserMock";
import { MockScene, mockRegistry } from "../../helpers/phaserMock";

vi.mock("phaser", async () => {
  const { createPhaserModuleMock } = await import("../../helpers/phaserMock");
  return createPhaserModuleMock().module;
});

vi.mock("../../../utils/pressFeedback", () => ({
  attachPressFeedback: vi.fn(),
}));

import { addRowCard, createModalButton, createRow } from "../../../components/settings/primitives";

/** Finds mock objects created by `scene.add.rectangle` with the given size. */
function rects(w: number, h: number): MockObject[] {
  return mockRegistry.filter(
    (obj) => obj.kind === "rectangle" && obj.args?.[2] === w && obj.args?.[3] === h,
  );
}

/** Finds the single text object in the registry. */
function textObj(): MockObject {
  const found = mockRegistry.find((obj) => obj.kind === "text");
  if (!found) throw new Error("no text object created");
  return found;
}

/** Fires every registered pointerdown handler on the object. */
function tap(obj: MockObject): void {
  const handler = obj.handlers.pointerdown as MockFn | undefined;
  if (!handler) throw new Error("no pointerdown handler");
  handler();
}

beforeEach(() => {
  mockRegistry.length = 0;
});

describe("addRowCard", () => {
  it("draws the flat row card into the given bucket", () => {
    const scene = new MockScene();
    const bucket: MockObject[] = [];
    addRowCard(scene as never, 512, 384, bucket as never);

    const cards = rects(400, 68);
    expect(cards).toHaveLength(1);
    expect(cards[0].args?.[0]).toBe(512);
    expect(cards[0].args?.[1]).toBe(384);
    expect(cards[0].args?.[4]).toBe(0xf6efdd);
    expect(cards[0].setStrokeStyle as MockFn).toHaveBeenCalledWith(2, 0x2d3748, 1);
    expect(bucket).toHaveLength(1);
  });
});

describe("createRow", () => {
  it("renders the label text and fires onClick on tap", () => {
    const scene = new MockScene();
    const bucket: MockObject[] = [];
    const onClick = vi.fn();
    createRow(scene as never, 512, 384, bucket as never, "Profiles", "#2b6cb0", onClick);

    const row = textObj();
    expect(row.args?.[0]).toBe(512);
    expect(row.args?.[1]).toBe(384);
    expect(row.args?.[2]).toBe("Profiles");
    expect(row.setOrigin as MockFn).toHaveBeenCalledWith(0.5);
    // Card + label land in the caller's cleanup bucket.
    expect(bucket).toHaveLength(2);

    tap(row);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("uses the inflated shared row hit area", () => {
    const scene = new MockScene();
    const bucket: MockObject[] = [];
    createRow(scene as never, 0, 0, bucket as never, "Progress", "#2b6cb0", vi.fn());

    const row = textObj();
    const config = (row.setInteractive as MockFn).mock.calls[0]?.[0] as {
      hitArea: { x: number; y: number; width: number; height: number };
      hitAreaCallback: unknown;
    };
    expect(config.hitArea.x).toBe(-120);
    expect(config.hitArea.y).toBe(-32);
    expect(config.hitArea.width).toBe(240);
    expect(config.hitArea.height).toBe(64);
  });
});

describe("createModalButton", () => {
  it("creates the tappable label and fires onClick on tap", () => {
    const scene = new MockScene();
    const defaultBucket: MockObject[] = [];
    const onClick = vi.fn();
    const button = createModalButton(
      scene as never,
      512,
      500,
      defaultBucket as never,
      "Close",
      "#2b6cb0",
      onClick,
    );

    const label = textObj();
    expect(label.args?.[2]).toBe("Close");
    expect(label).toBe(button);
    tap(label);
    expect(onClick).toHaveBeenCalledTimes(1);
    // The caller pushes the returned button (original semantics); only the
    // emphasized card lands in a bucket automatically.
    expect(defaultBucket).toHaveLength(0);
    expect(rects(240, 64)).toHaveLength(0);
  });

  it("lands the emphasized card in the explicit cleanup bucket", () => {
    const scene = new MockScene();
    const defaultBucket: MockObject[] = [];
    const modalBucket: MockObject[] = [];
    createModalButton(
      scene as never,
      512,
      500,
      defaultBucket as never,
      "Delete",
      "#fc8181",
      vi.fn(),
      { bucket: modalBucket as never, emphasized: true },
    );

    expect(defaultBucket).toHaveLength(0);
    expect(modalBucket).toHaveLength(1);
  });

  it("draws the danger-stroked emphasis card behind destructive confirms", () => {
    const scene = new MockScene();
    const bucket: MockObject[] = [];
    createModalButton(scene as never, 512, 500, bucket as never, "Delete", "#fc8181", vi.fn(), {
      emphasized: true,
    });

    const cards = rects(240, 64);
    expect(cards).toHaveLength(1);
    expect(cards[0].args?.[4]).toBe(0xfff8e7);
    expect(cards[0].setStrokeStyle as MockFn).toHaveBeenCalledWith(3, 0xfc8181, 1);
  });

  it("draws the primary-stroked emphasis card behind primary confirms", () => {
    const scene = new MockScene();
    const bucket: MockObject[] = [];
    createModalButton(scene as never, 512, 500, bucket as never, "Reset", "#2b6cb0", vi.fn(), {
      emphasized: true,
    });

    const cards = rects(240, 64);
    expect(cards).toHaveLength(1);
    expect(cards[0].setStrokeStyle as MockFn).toHaveBeenCalledWith(3, 0x2b6cb0, 1);
  });
});
