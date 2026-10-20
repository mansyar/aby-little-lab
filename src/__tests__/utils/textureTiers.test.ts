import { describe, expect, it, vi } from "vitest";

/**
 * Mock Phaser minimally: only the SHELL_ASSETS coverage block imports
 * PreloadScene, which needs `Phaser.Scene` at import time (real Phaser
 * probes a canvas 2D context on import, which happy-dom does not provide).
 */
vi.mock("phaser", () => {
  const phaserMock = {
    Scene: class Scene {},
    Scale: { FIT: "FIT" },
  };
  return { ...phaserMock, default: phaserMock };
});

import {
  animals,
  cutouts,
  faces,
  food,
  glyphs,
  items,
  letters,
  music,
  numerals,
  shadows,
  shapes,
  toys,
} from "../../game/art";
import type { ArtGroup } from "../../game/art/types";
import { SHELL_ASSETS } from "../../scenes/PreloadScene";
import { displayScale, TEXTURE_SIZES, textureSizeFor } from "../../utils/textureTiers";

const GROUPS: readonly ArtGroup[] = [
  shapes,
  cutouts,
  letters,
  numerals,
  animals,
  food,
  items,
  shadows,
  toys,
  faces,
  music,
  glyphs,
];

/** Every key the app can ask for: the shell's set plus every group's. */
const APP_ASSETS = [...SHELL_ASSETS, ...GROUPS.flatMap((group) => group.assets)];

/** The 178 distinct keys behind `APP_ASSETS` (the six avatars appear in both). */
const APP_ASSET_COUNT = 178;

describe("textureSizeFor tier mapping", () => {
  it("maps Hub tile icons to the icon tier (displayed at ~64px, headroom for paged tiles)", () => {
    expect(textureSizeFor("tile_shape_sorter")).toBe(TEXTURE_SIZES.icon);
    expect(textureSizeFor("tile_number_order")).toBe(TEXTURE_SIZES.icon);
  });

  it("maps shadow silhouettes to the icon tier (displayed at 112px)", () => {
    expect(textureSizeFor("sm_shadow_car")).toBe(TEXTURE_SIZES.icon);
    expect(textureSizeFor("sm_shadow_umbrella")).toBe(TEXTURE_SIZES.icon);
  });

  it("maps letters and numerals to the card tier (largest display 240-256px: Find-the-Letter target, How-Many target)", () => {
    expect(textureSizeFor("letter_a")).toBe(TEXTURE_SIZES.card);
    expect(textureSizeFor("letter_z")).toBe(TEXTURE_SIZES.card);
    expect(textureSizeFor("numeral_0")).toBe(TEXTURE_SIZES.card);
    expect(textureSizeFor("numeral_9")).toBe(TEXTURE_SIZES.card);
  });

  it("maps small UI symbols to the icon tier", () => {
    for (const key of ["minus", "plus", "equals", "sleep_zzz", "icon_speaker"]) {
      expect(textureSizeFor(key), key).toBe(TEXTURE_SIZES.icon);
    }
  });

  it("maps gameplay art (animals, shapes, cutouts, items, toys, stickers) to the card tier (largest display 256px)", () => {
    for (const key of [
      "animal_cat",
      "animal_elephant",
      "frog_green",
      "shape_circle",
      "cutout_star",
      "food_apple",
      "sm_house",
      "toy_rocket",
      "sticker_shape_sorter",
      "sticker_number_order",
      "lilypad",
      "bubble",
      "card_back",
      "arrow_more",
      "arrow_less",
    ]) {
      expect(textureSizeFor(key), key).toBe(TEXTURE_SIZES.card);
    }
  });

  it("keeps mascot art at the hero tier (Mascot.ts scale math assumes the 512px texture)", () => {
    expect(textureSizeFor("mascot_idle")).toBe(TEXTURE_SIZES.hero);
    expect(textureSizeFor("mascot_celebrate")).toBe(TEXTURE_SIZES.hero);
  });

  it("falls back to the card tier for unknown keys (safe default for new art)", () => {
    expect(textureSizeFor("some_future_texture")).toBe(TEXTURE_SIZES.card);
  });
});

describe("displayScale helper", () => {
  it("computes display scale from the texture's own tier size", () => {
    expect(displayScale("tile_shape_sorter", 64)).toBeCloseTo(64 / 160);
    expect(displayScale("sticker_number_order", 56)).toBeCloseTo(56 / 256);
    expect(displayScale("mascot_idle", 102.4)).toBeCloseTo(102.4 / 512);
  });
});

describe("tier coverage over every app asset", () => {
  it("resolves every shell and group key to a known tier size", () => {
    expect(SHELL_ASSETS).toHaveLength(53);
    expect(new Set(APP_ASSETS.map((asset) => asset.key)).size).toBe(APP_ASSET_COUNT);
    for (const asset of APP_ASSETS) {
      const size = textureSizeFor(asset.key);
      expect([TEXTURE_SIZES.icon, TEXTURE_SIZES.card, TEXTURE_SIZES.hero]).toContain(size);
    }
  });

  it("cuts total GPU texture bytes by more than half versus the uniform 512px baseline", () => {
    const bytesAt = (size: number) => size * size * 4; // RGBA
    const baseline = APP_ASSETS.length * bytesAt(512);
    const tiered = APP_ASSETS.reduce((sum, a) => sum + bytesAt(textureSizeFor(a.key)), 0);
    expect(tiered).toBeLessThan(baseline / 2);
  });
});
