import type Phaser from "phaser";
import { describe, expect, it, vi } from "vitest";
import { preloadRobotPathArt, ROBOT_PATH_ASSETS } from "../../game/robotPathArt";
import preloadSceneSource from "../../scenes/PreloadScene.ts?raw";
import { toDataUri } from "../../utils/svgDataUri";

const assetKeys = ROBOT_PATH_ASSETS.map((asset) => asset.key);

/** Constructs the art contract forbids: gradients, filters, bitmaps and text. */
const FORBIDDEN_MARKUP = /<(linear|radial)gradient|<filter|<image|\.png|\.jpg|<text/i;

describe("ROBOT_PATH_ASSETS", () => {
  it("holds exactly the six textures the scene draws", () => {
    expect(assetKeys).toEqual([
      "robot_idle",
      "robot_walk",
      "robot_puzzled",
      "robot_go",
      "robot_rock",
      "robot_star",
    ]);
    expect(new Set(assetKeys).size).toBe(assetKeys.length);
    for (const key of assetKeys) {
      expect(key).toMatch(/^robot_[a-z]+$/);
    }
  });

  it("carries non-empty SVG markup for every texture", () => {
    for (const asset of ROBOT_PATH_ASSETS) {
      expect(asset.svg.length).toBeGreaterThan(120);
      expect(asset.svg.trimStart().startsWith("<svg")).toBe(true);
      expect(asset.svg.trimEnd().endsWith("</svg>")).toBe(true);
    }
  });

  it("follows the storybook-flat art contract", () => {
    for (const asset of ROBOT_PATH_ASSETS) {
      expect(asset.svg).toContain('viewBox="0 0 512 512"');
      expect(asset.svg).toContain('stroke="#2D3748"');
      expect(asset.svg).not.toMatch(FORBIDDEN_MARKUP);
    }
  });

  it("stays Latin-1 safe so the loader can base64 it", () => {
    for (const asset of ROBOT_PATH_ASSETS) {
      const codePoints = Array.from(asset.svg, (character) => character.codePointAt(0) ?? 0);
      expect(Math.max(...codePoints)).toBeLessThanOrEqual(0xff);
    }
  });
});

describe("preloadRobotPathArt", () => {
  it("registers every texture once, at the card tier", () => {
    const svg = vi.fn();
    const scene = { load: { svg } } as unknown as Phaser.Scene;

    preloadRobotPathArt(scene);

    const calls = svg.mock.calls as Array<[string, string, { width: number; height: number }]>;
    expect(calls).toHaveLength(6);
    expect(calls.map(([key]) => key)).toEqual(assetKeys);
    for (const [, uri, size] of calls) {
      expect(uri.startsWith("data:image/svg+xml;base64,")).toBe(true);
      expect(size).toEqual({ width: 256, height: 256 });
    }
  });

  it("encodes every texture without throwing", () => {
    for (const asset of ROBOT_PATH_ASSETS) {
      expect(() => toDataUri(asset.svg)).not.toThrow();
    }
  });
});

describe("shell isolation", () => {
  it("keeps the robot art module out of the boot preloader", () => {
    expect(preloadSceneSource).not.toContain("robotPathArt");
    expect(preloadSceneSource).not.toContain("svg/robot/");
  });
});
