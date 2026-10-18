import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { stubMatchMedia } from "../helpers/matchMediaStub";
import { type MockFn, MockScene, mockRegistry } from "../helpers/phaserMock";

vi.mock("phaser", async () => {
  const { createPhaserModuleMock } = await import("../helpers/phaserMock");
  return createPhaserModuleMock().module;
});

import { ProfileChip } from "../../components/ProfileChip";
import { PROFILE_AVATAR_TEXTURES } from "../../game/profileLogic";
import { addProfile, getActiveProfile, getProfiles } from "../../utils/storage";
import { textureSizeFor } from "../../utils/textureTiers";

function makeChip(overrides: Partial<{ onOpen: () => void; onSwitch: () => void }> = {}): {
  chip: ProfileChip;
  scene: MockScene;
  onOpen: MockFn;
  onSwitch: MockFn;
} {
  const scene = new MockScene();
  const onOpen = vi.fn();
  const onSwitch = vi.fn();
  const chip = new ProfileChip({
    scene: scene as unknown as ConstructorParameters<typeof ProfileChip>[0]["scene"],
    onOpen: overrides.onOpen ?? onOpen,
    onSwitch: overrides.onSwitch ?? onSwitch,
  });
  return { chip, scene, onOpen, onSwitch };
}

/** The chip image (top-left at 68, 68). Throws when not created. */
function chipImage() {
  const img = mockRegistry.find(
    (obj) => obj.kind === "image" && obj.args?.[0] === 68 && obj.args?.[1] === 68,
  );
  if (!img) throw new Error("chip image not created");
  return img;
}

/** All picker avatar images (chip excluded), in creation order. */
function pickerAvatars() {
  return mockRegistry.filter((obj) => obj.kind === "image" && (obj.args?.[1] as number) === 384);
}

/** Fires every pointerup handler in dispatch order. */
function tap(obj: { allHandlers: Array<{ name: string; cb: MockFn }> }): void {
  for (const { name, cb } of obj.allHandlers) {
    if (name === "pointerup") cb();
  }
}

describe("ProfileChip", () => {
  beforeEach(() => {
    stubMatchMedia(false);
    localStorage.clear();
    mockRegistry.length = 0;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("creates the chip at the top-left inset with the active avatar texture", () => {
    const { chip, scene } = makeChip();
    chip.create();

    const img = chipImage();
    const [x, y, texture] = img.args ?? [];
    expect(x).toBe(20 + 96 / 2);
    expect(y).toBe(20 + 96 / 2);
    expect(texture).toBe(PROFILE_AVATAR_TEXTURES[getActiveProfile().avatarId]);
    expect(img.setScale).toHaveBeenCalledWith(72 / textureSizeFor(PROFILE_AVATAR_TEXTURES.cat));
    // Selection ring sits behind the chip (92x92 at the chip's center).
    expect(
      mockRegistry.some((obj) => obj.kind === "rectangle" && (obj.args?.[2] as number) === 92),
    ).toBe(true);
    void scene;
  });

  it("opens the picker on chip tap: dim overlay plus one avatar per profile", () => {
    addProfile("dog");
    const { chip, onOpen } = makeChip();
    chip.create();
    tap(chipImage());

    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(chip.isOpen()).toBe(true);
    // Dim overlay covering the canvas.
    expect(
      mockRegistry.filter((obj) => obj.kind === "rectangle" && (obj.args?.[2] as number) === 1024)
        .length,
    ).toBe(1);
    // One avatar per profile; the active one is enlarged (1.15x) with a marker.
    expect(pickerAvatars().length).toBe(getProfiles().length);
    const base = 96 / textureSizeFor(PROFILE_AVATAR_TEXTURES.cat);
    const active = pickerAvatars().find(
      (obj) => (obj.setScale as MockFn).mock.calls.at(-1)?.[0] === base * 1.15,
    );
    expect(active).toBeDefined();
  });

  it("switches profiles on another avatar's tap, notifies the scene and closes", () => {
    addProfile("dog");
    const { chip, onSwitch } = makeChip();
    chip.create();
    tap(chipImage());

    const base = 96 / textureSizeFor(PROFILE_AVATAR_TEXTURES.cat);
    const other = pickerAvatars().find(
      (obj) => (obj.setScale as MockFn).mock.calls.at(-1)?.[0] === base,
    );
    if (!other) throw new Error("non-active avatar not found");
    tap(other);

    expect(chip.isOpen()).toBe(false);
    expect(onSwitch).toHaveBeenCalledTimes(1);
  });

  it("closing via the dim overlay does not switch profiles", () => {
    addProfile("dog");
    const { chip, onSwitch } = makeChip();
    chip.create();
    tap(chipImage());

    const overlay = mockRegistry.find(
      (obj) => obj.kind === "rectangle" && (obj.args?.[2] as number) === 1024,
    );
    if (!overlay) throw new Error("picker overlay not found");
    tap(overlay);

    expect(chip.isOpen()).toBe(false);
    expect(onSwitch).not.toHaveBeenCalled();
  });

  it("destroy() tears down the picker and the chip", () => {
    const { chip } = makeChip();
    chip.create();
    chip.destroy();
    expect(chip.isOpen()).toBe(false);
    expect(chipImage().destroy as MockFn).toHaveBeenCalled();
  });
});
