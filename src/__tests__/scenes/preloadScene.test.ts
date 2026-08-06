import { describe, expect, it, vi } from "vitest";

/**
 * Mock Phaser minimally: PreloadScene only needs `Phaser.Scene` at import
 * time (SHAPE_ASSETS is a module-scope constant; real Phaser probes a canvas
 * 2D context on import, which happy-dom does not provide).
 */
vi.mock("phaser", () => {
  const phaserMock = {
    Scene: class Scene {},
    Scale: { FIT: "FIT" },
  };
  return { ...phaserMock, default: phaserMock };
});

import { SHAPE_ASSETS } from "../../scenes/PreloadScene";

/** The 12 shape types added by the shape-sorter-rounds-variety track. */
const NEW_SHAPES = [
  "oval",
  "rectangle",
  "diamond",
  "pentagon",
  "hexagon",
  "octagon",
  "trapezoid",
  "semicircle",
  "arrow",
  "plus",
  "ring",
  "teardrop",
];

describe("PreloadScene SHAPE_ASSETS", () => {
  it("registers all 12 new shape textures with SVG content", () => {
    for (const shape of NEW_SHAPES) {
      const entry = SHAPE_ASSETS.find((a) => a.key === `shape_${shape}`);
      expect(entry, `shape_${shape} is missing from SHAPE_ASSETS`).toBeDefined();
      expect(entry?.svg).toContain("<svg");
    }
  });

  it("registers all 12 new cutout textures with SVG content", () => {
    for (const shape of NEW_SHAPES) {
      const entry = SHAPE_ASSETS.find((a) => a.key === `cutout_${shape}`);
      expect(entry, `cutout_${shape} is missing from SHAPE_ASSETS`).toBeDefined();
      expect(entry?.svg).toContain("<svg");
    }
  });

  it("keeps the original 6 shape textures registered", () => {
    for (const shape of ["circle", "square", "triangle", "star", "heart", "crescent"]) {
      expect(SHAPE_ASSETS.some((a) => a.key === `shape_${shape}`)).toBe(true);
      expect(SHAPE_ASSETS.some((a) => a.key === `cutout_${shape}`)).toBe(true);
    }
  });

  it("registers exactly 18 shape and 18 cutout textures", () => {
    const shapes = SHAPE_ASSETS.filter((a) => a.key.startsWith("shape_"));
    const cutouts = SHAPE_ASSETS.filter((a) => a.key.startsWith("cutout_"));
    expect(shapes).toHaveLength(18);
    expect(cutouts).toHaveLength(18);
  });
});
