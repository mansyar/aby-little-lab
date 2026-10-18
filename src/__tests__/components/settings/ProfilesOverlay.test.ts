import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MockFn } from "../../helpers/phaserMock";
import { type MockObject, MockScene, mockRegistry } from "../../helpers/phaserMock";

vi.mock("phaser", async () => {
  const { createPhaserModuleMock } = await import("../../helpers/phaserMock");
  return createPhaserModuleMock().module;
});

const { storageSpies } = vi.hoisted(() => ({
  storageSpies: {
    addProfile: vi.fn(),
    deleteProfile: vi.fn(),
    setPlayTimeLimit: vi.fn(),
  },
}));

// Spies call through to the real storage so state actually changes.
vi.mock("../../../utils/storage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../utils/storage")>();
  storageSpies.addProfile.mockImplementation(actual.addProfile);
  storageSpies.deleteProfile.mockImplementation(actual.deleteProfile);
  storageSpies.setPlayTimeLimit.mockImplementation(actual.setPlayTimeLimit);
  return { ...actual, ...storageSpies };
});

import { ProfilesOverlay } from "../../../components/settings/ProfilesOverlay";
import { getProfiles, load, addProfile as realAddProfile } from "../../../utils/storage";

interface OverlayFixture {
  overlay: ProfilesOverlay;
  scene: MockScene;
  overlayBucket: MockObject[];
  modalBucket: MockObject[];
  onProgressReset: MockFn;
}

/** Builds an overlay wired to a fresh mock scene and real storage state. */
function makeOverlay(): OverlayFixture {
  const scene = new MockScene();
  const overlayBucket: MockObject[] = [];
  const modalBucket: MockObject[] = [];
  const onProgressReset = vi.fn();
  const overlay = new ProfilesOverlay({
    scene: scene as never,
    overlayObjects: overlayBucket as never,
    modalObjects: modalBucket as never,
    onProgressReset,
  });
  return { overlay, scene, overlayBucket, modalBucket, onProgressReset };
}

/** Finds full-canvas overlay panels (480x760). */
function panels(): MockObject[] {
  return mockRegistry.filter(
    (obj) => obj.kind === "rectangle" && obj.args?.[2] === 480 && obj.args?.[3] === 760,
  );
}

/** Finds texts whose rendered label matches. */
function texts(label: string): MockObject[] {
  return mockRegistry.filter((obj) => obj.kind === "text" && obj.args?.[2] === label);
}

/** Finds avatar images at the profile-row X position (centerX − 110). */
function rowAvatars(): MockObject[] {
  return mockRegistry.filter((obj) => obj.kind === "image" && obj.args?.[0] === 402);
}

/** Fires every registered pointerdown handler on the object (Phaser fires all). */
function tap(obj: MockObject): void {
  const handlers = obj.allHandlers.filter((entry) => entry.name === "pointerdown");
  if (handlers.length === 0) throw new Error("no pointerdown handler");
  for (const entry of handlers) entry.cb();
}

beforeEach(() => {
  mockRegistry.length = 0;
  localStorage.clear();
  load();
});

afterEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe("ProfilesOverlay", () => {
  it("renders one avatar + Delete + Play Time chip per profile", () => {
    const { overlay } = makeOverlay();
    const count = getProfiles().length;

    overlay.open();

    expect(panels()).toHaveLength(1);
    expect(rowAvatars()).toHaveLength(count);
    expect(texts("Delete")).toHaveLength(count);
    expect(texts(`Play Time: Off`)).toHaveLength(count);
  });

  it("shows Add Profile with one avatar per unused avatar slot", () => {
    const { overlay } = makeOverlay();

    overlay.open();

    expect(texts("Add Profile")).toHaveLength(1);
    // 6 total avatars, 1 used by the default profile.
    const addAvatars = mockRegistry.filter(
      (obj) => obj.kind === "image" && obj.args?.[1] === 530 && obj.args?.[0] !== 402,
    );
    expect(addAvatars).toHaveLength(5);
  });

  it("tapping an unused avatar adds a profile and re-renders", () => {
    const { overlay, onProgressReset } = makeOverlay();
    overlay.open();
    const before = getProfiles().length;

    const addAvatar = mockRegistry.find(
      (obj) => obj.kind === "image" && obj.args?.[1] === 530 && obj.args?.[0] !== 402,
    );
    if (!addAvatar) throw new Error("no add-profile avatar");
    tap(addAvatar);

    expect(storageSpies.addProfile).toHaveBeenCalledTimes(1);
    expect(getProfiles().length).toBe(before + 1);
    expect(onProgressReset).toHaveBeenCalled();
  });

  it("cycles the play-time chip through the next option", () => {
    const { overlay } = makeOverlay();
    overlay.open();

    const chip = texts("Play Time: Off")[0];
    if (!chip) throw new Error("no play-time chip");
    tap(chip);

    expect(storageSpies.setPlayTimeLimit).toHaveBeenCalledTimes(1);
    expect(storageSpies.setPlayTimeLimit.mock.calls[0]?.[1]).toBe(15);
  });

  it("shows the limit notice instead of Add Profile at 4 profiles", () => {
    realAddProfile("dog");
    realAddProfile("pig");
    realAddProfile("frog");
    const { overlay } = makeOverlay();

    overlay.open();

    expect(getProfiles().length).toBe(4);
    expect(texts("Profile limit reached")).toHaveLength(1);
    expect(texts("Add Profile")).toHaveLength(0);
  });

  it("opens the delete confirmation modal and deletes on confirm", () => {
    realAddProfile("dog");
    const { overlay, modalBucket, onProgressReset } = makeOverlay();
    overlay.open();
    const before = getProfiles().length;
    const target = getProfiles()[1];
    if (!target) throw new Error("expected a second profile");

    const deleteButton = texts("Delete")[1];
    if (!deleteButton) throw new Error("no delete button");
    tap(deleteButton);

    // Modal rendered in the modal bucket while the overlay stays open.
    expect(texts("Delete profile?")).toHaveLength(1);
    expect(modalBucket.length).toBeGreaterThan(0);

    // The modal's Delete is the last "Delete" text created (after both rows).
    const confirm = texts("Delete").at(-1);
    if (!confirm) throw new Error("no modal delete button");
    tap(confirm);

    expect(storageSpies.deleteProfile).toHaveBeenCalledWith(target.id);
    expect(getProfiles().length).toBe(before - 1);
    expect(onProgressReset).toHaveBeenCalled();
    expect(modalBucket).toHaveLength(0);
    const modalTitle = texts("Delete profile?")[0];
    if (!modalTitle) throw new Error("modal title missing from registry");
    expect(modalTitle.destroy as MockFn).toHaveBeenCalled();
  });

  it("cancel closes the modal without deleting", () => {
    const { overlay, modalBucket } = makeOverlay();
    overlay.open();

    const deleteButton = texts("Delete")[0];
    if (!deleteButton) throw new Error("no delete button");
    tap(deleteButton);
    expect(texts("Delete profile?")).toHaveLength(1);

    const cancel = texts("Cancel")[0];
    if (!cancel) throw new Error("no cancel button");
    tap(cancel);

    expect(storageSpies.deleteProfile).not.toHaveBeenCalled();
    expect(modalBucket).toHaveLength(0);
    const modalTitle = texts("Delete profile?")[0];
    if (!modalTitle) throw new Error("modal title missing from registry");
    expect(modalTitle.destroy as MockFn).toHaveBeenCalled();
  });

  it("close() destroys the overlay objects", () => {
    const { overlay, overlayBucket } = makeOverlay();
    overlay.open();
    expect(overlayBucket.length).toBeGreaterThan(0);

    overlay.close();

    expect(overlayBucket).toHaveLength(0);
  });
});
