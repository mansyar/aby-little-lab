import { beforeEach, describe, expect, it, vi } from "vitest";
import { MockScene, mockRegistry, type MockFn, type MockObject } from "../../helpers/phaserMock";

vi.mock("phaser", async () => {
  const { createPhaserModuleMock } = await import("../../helpers/phaserMock");
  return createPhaserModuleMock().module;
});

const storageSpies = vi.hoisted(() => ({
  resetProgress: vi.fn(),
}));

vi.mock("../../../utils/storage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../utils/storage")>();
  // Spies call through to the real storage so state actually changes.
  storageSpies.resetProgress.mockImplementation(actual.resetProgress as never);
  return { ...actual, ...storageSpies };
});

import { ResetModal } from "../../../components/settings/ResetModal";
import { getProfiles, load } from "../../../utils/storage";

/** Fires every registered pointerdown handler (module + press feedback). */
function tap(obj: MockObject): void {
  const handlers = obj.allHandlers.filter((entry) => entry.name === "pointerdown");
  if (handlers.length === 0) throw new Error("no pointerdown handler");
  handlers.forEach((entry) => entry.cb());
}

/** Finds a live text object by its literal label. */
function liveText(bucket: MockObject[], label: string): MockObject {
  const found = bucket.find(
    (obj) =>
      obj.kind === "text" &&
      obj.args?.[2] === label &&
      !(obj.destroy as MockFn).mock.calls.length,
  );
  if (!found) throw new Error(`text "${label}" not found`);
  return found;
}

describe("ResetModal", () => {
  let objects: MockObject[];
  let overlayObjects: MockObject[];
  let onProgressReset: MockFn;

  beforeEach(() => {
    mockRegistry.length = 0;
    objects = [];
    overlayObjects = [];
    onProgressReset = vi.fn();
    localStorage.clear();
    load();
    storageSpies.resetProgress.mockClear();
  });

  it("adds the danger Reset Progress row to the panel bucket", () => {
    const scene = new MockScene();
    new ResetModal({
      scene: scene as never,
      objects: objects as never,
      overlayObjects: overlayObjects as never,
      onProgressReset,
    }).createRow(512, 384);

    const row = objects.find((obj) => obj.kind === "text");
    if (!row) throw new Error("reset row not created");
    expect(row.args?.[2]).toBe("Reset Progress");
  });

  it("opens the two-step confirmation modal from the row", () => {
    const scene = new MockScene();
    const modal = new ResetModal({
      scene: scene as never,
      objects: objects as never,
      overlayObjects: overlayObjects as never,
      onProgressReset,
    });
    modal.createRow(512, 384);
    tap(objects.find((obj) => obj.kind === "text") as MockObject);

    expect(liveText(overlayObjects, "Reset all stickers?")).toBeTruthy();
    expect(liveText(overlayObjects, "All stickers will be cleared.")).toBeTruthy();
    expect(liveText(overlayObjects, "Cancel")).toBeTruthy();
    expect(liveText(overlayObjects, "Reset")).toBeTruthy();
    expect(storageSpies.resetProgress).not.toHaveBeenCalled();
  });

  it("cancels without clearing any progress", () => {
    const scene = new MockScene();
    const modal = new ResetModal({
      scene: scene as never,
      objects: objects as never,
      overlayObjects: overlayObjects as never,
      onProgressReset,
    });
    modal.createRow(512, 384);
    tap(objects.find((obj) => obj.kind === "text") as MockObject);
    tap(liveText(overlayObjects, "Cancel"));

    expect(storageSpies.resetProgress).not.toHaveBeenCalled();
    expect(onProgressReset).not.toHaveBeenCalled();
    expect(overlayObjects).toHaveLength(0);
  });

  it("confirms the reset, clears stickers and re-renders downstream", () => {
    const scene = new MockScene();
    const modal = new ResetModal({
      scene: scene as never,
      objects: objects as never,
      overlayObjects: overlayObjects as never,
      onProgressReset,
    });
    modal.createRow(512, 384);
    tap(objects.find((obj) => obj.kind === "text") as MockObject);
    tap(liveText(overlayObjects, "Reset"));

    expect(storageSpies.resetProgress).toHaveBeenCalledTimes(1);
    expect(onProgressReset).toHaveBeenCalledTimes(1);
    expect(overlayObjects).toHaveLength(0);
    expect(getProfiles().length).toBe(1);
  });

  it("shows inline confirmation on the row after a confirmed reset", () => {
    const scene = new MockScene();
    const modal = new ResetModal({
      scene: scene as never,
      objects: objects as never,
      overlayObjects: overlayObjects as never,
      onProgressReset,
    });
    modal.createRow(512, 384);
    const row = objects.find((obj) => obj.kind === "text") as MockObject;
    tap(row);
    tap(liveText(overlayObjects, "Reset"));

    expect(row.setText).toHaveBeenCalledWith("Progress cleared");
    expect(row.setColor).toHaveBeenCalledWith("#a0aec0");
  });

  it("closes via the backdrop without changing any data", () => {
    const scene = new MockScene();
    const modal = new ResetModal({
      scene: scene as never,
      objects: objects as never,
      overlayObjects: overlayObjects as never,
      onProgressReset,
    });
    modal.createRow(512, 384);
    tap(objects.find((obj) => obj.kind === "text") as MockObject);

    const backdrop = overlayObjects.find(
      (obj) => obj.kind === "rectangle" && (obj.args?.[2] as number) === 1024,
    );
    if (!backdrop) throw new Error("modal backdrop not found");
    tap(backdrop);

    expect(storageSpies.resetProgress).not.toHaveBeenCalled();
    expect(overlayObjects).toHaveLength(0);
  });
});
