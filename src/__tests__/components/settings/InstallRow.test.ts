import { beforeEach, describe, expect, it, vi } from "vitest";
import { type MockFn, type MockObject, MockScene, mockRegistry } from "../../helpers/phaserMock";

vi.mock("phaser", async () => {
  const { createPhaserModuleMock } = await import("../../helpers/phaserMock");
  return createPhaserModuleMock().module;
});

import { InstallRow } from "../../../components/settings/InstallRow";
import type { InstallTracker } from "../../../utils/pwaInstall";

/** Fires every registered pointerdown handler (module + press feedback). */
function tap(obj: MockObject): void {
  const handlers = obj.allHandlers.filter((entry) => entry.name === "pointerdown");
  if (handlers.length === 0) throw new Error("no pointerdown handler");
  handlers.forEach((entry) => {
    entry.cb();
  });
}

/** Builds a fake install tracker with a controllable state. */
function tracker(state: "hidden" | "installable" | "manual"): InstallTracker {
  return {
    getState: vi.fn(() => state),
    prompt: vi.fn(async () => undefined),
    destroy: vi.fn(),
  } as unknown as InstallTracker;
}

/** The row button: the only text at x (row cards and cards have no args[2]). */
function rowButton(bucket: MockObject[]): MockObject {
  const found = bucket.find((obj) => obj.kind === "text");
  if (!found) throw new Error("install row button not created");
  return found;
}

describe("InstallRow", () => {
  let objects: MockObject[];
  let overlayObjects: MockObject[];

  beforeEach(() => {
    mockRegistry.length = 0;
    objects = [];
    overlayObjects = [];
  });

  it("adds nothing when the app is already installed (hidden state)", () => {
    const scene = new MockScene();
    new InstallRow({
      scene: scene as never,
      objects: objects as never,
      installTracker: tracker("hidden"),
    }).create(512, 384);

    expect(objects).toHaveLength(0);
  });

  it("shows an Install App row that prompts when installable", () => {
    const fake = tracker("installable");
    const scene = new MockScene();
    new InstallRow({
      scene: scene as never,
      objects: objects as never,
      installTracker: fake,
    }).create(512, 384);

    expect(rowButton(objects).args?.[2]).toBe("Install App");
    tap(rowButton(objects));
    expect(fake.prompt).toHaveBeenCalledTimes(1);
  });

  it("shows a How to Install row that opens the iOS overlay on iOS", () => {
    const scene = new MockScene();
    const row = new InstallRow({
      scene: scene as never,
      objects: objects as never,
      overlayObjects: overlayObjects as never,
      installTracker: tracker("manual"),
    });
    row.create(512, 384);

    expect(rowButton(objects).args?.[2]).toBe("How to Install");
    tap(rowButton(objects));

    const live = overlayObjects.filter((obj) => !(obj.destroy as MockFn).mock.calls.length);
    const titles = live.filter((obj) => obj.kind === "text" && obj.args?.[2] === "Install on iOS");
    expect(titles).toHaveLength(1);
    const stepTexts = live.filter((obj) => obj.kind === "text").map((obj) => String(obj.args?.[2]));
    expect(stepTexts).toContain("1. Tap the Share icon");
    expect(stepTexts).toContain("2. Choose Add to Home Screen");
    expect(stepTexts).toContain("3. Open Aby's Little Lab offline");
  });

  it("closes the iOS overlay when the backdrop is tapped", () => {
    const scene = new MockScene();
    const row = new InstallRow({
      scene: scene as never,
      objects: objects as never,
      overlayObjects: overlayObjects as never,
      installTracker: tracker("manual"),
    });
    row.create(512, 384);
    tap(rowButton(objects));
    expect(overlayObjects.length).toBeGreaterThan(0);

    const backdrop = overlayObjects.find(
      (obj) => obj.kind === "rectangle" && (obj.args?.[2] as number) === 1024,
    );
    if (!backdrop) throw new Error("overlay backdrop not found");
    tap(backdrop);

    expect(overlayObjects).toHaveLength(0);
  });

  it("closes the iOS overlay from the explicit Close button", () => {
    const scene = new MockScene();
    const row = new InstallRow({
      scene: scene as never,
      objects: objects as never,
      overlayObjects: overlayObjects as never,
      installTracker: tracker("manual"),
    });
    row.create(512, 384);
    tap(rowButton(objects));

    const close = overlayObjects.find((obj) => obj.kind === "text" && obj.args?.[2] === "Close");
    if (!close) throw new Error("Close button not found");
    tap(close);

    expect(overlayObjects).toHaveLength(0);
  });
});
