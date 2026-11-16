import type Phaser from "phaser";
import { describe, expect, it, vi } from "vitest";
import {
  FIX_IT_MACHINE_ASSETS,
  MACHINE_POSE_KEYS,
  MACHINE_TOOL_KEYS,
  MACHINE_TOY_KEYS,
  preloadFixItMachineArt,
} from "../../game/fixItMachineArt";
import preloadSceneSource from "../../scenes/PreloadScene.ts?raw";
import { toDataUri } from "../../utils/svgDataUri";

const assetKeys = FIX_IT_MACHINE_ASSETS.map((asset) => asset.key);

/** Constructs the art contract forbids: gradients, filters, bitmaps and text. */
const FORBIDDEN_MARKUP = /<(linear|radial)gradient|<filter|<image|\.png|\.jpg|<text/i;

/** The body rectangle every pose shares, so swaps never shift the character. */
const SHARED_ANCHOR = 'x="136" y="196" width="240" height="248" rx="72"';

describe("FIX_IT_MACHINE_ASSETS", () => {
  it("holds exactly the sixteen textures the scene draws", () => {
    expect(assetKeys).toHaveLength(16);
    expect(assetKeys).toEqual([...MACHINE_POSE_KEYS, ...MACHINE_TOOL_KEYS, ...MACHINE_TOY_KEYS]);
    expect(new Set(assetKeys).size).toBe(16);
    for (const key of assetKeys) {
      expect(key).toMatch(/^machine_[a-z]+$/);
    }
  });

  it("names one pose, one tool per action and one goal per toy", () => {
    expect(MACHINE_POSE_KEYS).toEqual([
      "machine_idle",
      "machine_working",
      "machine_puzzled",
      "machine_happy",
    ]);
    expect(MACHINE_TOOL_KEYS).toEqual([
      "machine_spray",
      "machine_pour",
      "machine_paint",
      "machine_polish",
      "machine_lift",
      "machine_stack",
    ]);
    expect(MACHINE_TOY_KEYS).toEqual([
      "machine_teddy",
      "machine_car",
      "machine_duck",
      "machine_drum",
      "machine_robot",
      "machine_blocks",
    ]);
  });

  it("carries non-empty SVG markup for every texture", () => {
    for (const asset of FIX_IT_MACHINE_ASSETS) {
      expect(asset.svg.length).toBeGreaterThan(120);
      expect(asset.svg.trimStart().startsWith("<svg")).toBe(true);
      expect(asset.svg.trimEnd().endsWith("</svg>")).toBe(true);
    }
  });

  it("keeps every texture inside the 4 kB art budget", () => {
    for (const asset of FIX_IT_MACHINE_ASSETS) {
      expect(asset.svg.length, `${asset.key} is ${asset.svg.length} bytes`).toBeLessThan(4096);
    }
  });

  it("follows the storybook-flat art contract", () => {
    for (const asset of FIX_IT_MACHINE_ASSETS) {
      expect(asset.svg).toContain('viewBox="0 0 512 512"');
      expect(asset.svg).toContain('stroke="#2D3748"');
      expect(asset.svg).not.toMatch(FORBIDDEN_MARKUP);
    }
  });

  it("draws all four poses on the same anchor", () => {
    for (const key of MACHINE_POSE_KEYS) {
      const asset = FIX_IT_MACHINE_ASSETS.find((candidate) => candidate.key === key);
      expect(asset, `${key} is missing`).toBeDefined();
      expect(asset?.svg).toContain(SHARED_ANCHOR);
    }
  });

  it("keeps each tool pair apart in outline", () => {
    const markupFor = (key: string): string =>
      FIX_IT_MACHINE_ASSETS.find((asset) => asset.key === key)?.svg ?? "";
    const pairs: ReadonlyArray<readonly [string, string]> = [
      ["machine_spray", "machine_pour"],
      ["machine_paint", "machine_polish"],
      ["machine_lift", "machine_stack"],
    ];
    for (const [first, second] of pairs) {
      const a = markupFor(first);
      const b = markupFor(second);
      expect(a.length).toBeGreaterThan(0);
      expect(b.length).toBeGreaterThan(0);
      expect(a).not.toBe(b);
      // Different silhouettes mean different element outlines, not just colour:
      // compare the shape tags with their fills stripped.
      const outline = (svg: string): string[] =>
        svg
          .split("\n")
          .filter(
            (line) => line.includes("<rect") || line.includes("<path") || line.includes("<circle"),
          )
          .map((line) =>
            line
              .replace(/fill="[^"]*"/g, "")
              .replace(/<!--.*-->/g, "")
              .trim(),
          );
      expect(outline(a)).not.toEqual(outline(b));
    }
  });

  it("stays Latin-1 safe so the loader can base64 it", () => {
    for (const asset of FIX_IT_MACHINE_ASSETS) {
      const codePoints = Array.from(asset.svg, (character) => character.codePointAt(0) ?? 0);
      expect(Math.max(...codePoints)).toBeLessThanOrEqual(0xff);
    }
  });
});

describe("preloadFixItMachineArt", () => {
  it("registers every texture once, at the card tier", () => {
    const svg = vi.fn();
    const scene = { load: { svg } } as unknown as Phaser.Scene;

    preloadFixItMachineArt(scene);

    const calls = svg.mock.calls as Array<[string, string, { width: number; height: number }]>;
    expect(calls).toHaveLength(16);
    expect(calls.map(([key]) => key)).toEqual(assetKeys);
    for (const [, uri, size] of calls) {
      expect(uri.startsWith("data:image/svg+xml;base64,")).toBe(true);
      expect(size).toEqual({ width: 256, height: 256 });
    }
  });

  it("encodes every texture without throwing", () => {
    for (const asset of FIX_IT_MACHINE_ASSETS) {
      expect(() => toDataUri(asset.svg)).not.toThrow();
    }
  });
});

describe("shell isolation", () => {
  it("keeps the machine art out of the boot preloader", () => {
    expect(preloadSceneSource).not.toContain("fixItMachineArt");
    expect(preloadSceneSource).not.toContain("svg/machine/");
  });
});
