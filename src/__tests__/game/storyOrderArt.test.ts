import type Phaser from "phaser";
import { describe, expect, it, vi } from "vitest";
import { preloadStoryOrderArt, STORY_PANEL_ASSETS } from "../../game/storyOrderArt";
import { STORY_POOL } from "../../game/storyOrderLogic";
import preloadSceneSource from "../../scenes/PreloadScene.ts?raw";
import { toDataUri } from "../../utils/svgDataUri";

const panelKeys = STORY_PANEL_ASSETS.map((panel) => panel.key);

/** Constructs the art contract forbids: gradients, filters, bitmaps and text. */
const FORBIDDEN_MARKUP = /<(linear|radial)gradient|<filter|<image|\.png|\.jpg|<text/i;

describe("STORY_PANEL_ASSETS", () => {
  it("holds exactly the 24 panels of the story pool, in solution order", () => {
    expect(STORY_PANEL_ASSETS).toHaveLength(24);
    expect(panelKeys).toEqual(STORY_POOL.flatMap((story) => story.panels));
  });

  it("uses every texture key once", () => {
    expect(new Set(panelKeys).size).toBe(panelKeys.length);
    for (const key of panelKeys) {
      expect(key).toMatch(/^story_[a-z_]+$/);
    }
  });

  it("carries non-empty SVG markup for every panel", () => {
    for (const panel of STORY_PANEL_ASSETS) {
      expect(panel.svg.length).toBeGreaterThan(200);
      expect(panel.svg.trimStart().startsWith("<svg")).toBe(true);
      expect(panel.svg.trimEnd().endsWith("</svg>")).toBe(true);
    }
  });

  it("follows the storybook-flat art contract", () => {
    for (const panel of STORY_PANEL_ASSETS) {
      expect(panel.svg).toContain('viewBox="0 0 512 512"');
      expect(panel.svg).toContain('stroke="#2D3748"');
      expect(panel.svg).not.toMatch(FORBIDDEN_MARKUP);
    }
  });

  it("stays Latin-1 safe so the loader can base64 it", () => {
    for (const panel of STORY_PANEL_ASSETS) {
      const codePoints = Array.from(panel.svg, (character) => character.codePointAt(0) ?? 0);
      expect(Math.max(...codePoints)).toBeLessThanOrEqual(0xff);
    }
  });
});

describe("preloadStoryOrderArt", () => {
  it("registers every panel once, at the story panel texture tier", () => {
    const svg = vi.fn();
    const scene = { load: { svg } } as unknown as Phaser.Scene;

    preloadStoryOrderArt(scene);

    const calls = svg.mock.calls as Array<[string, string, { width: number; height: number }]>;
    expect(calls).toHaveLength(24);
    expect(calls.map(([key]) => key)).toEqual(panelKeys);
    expect(new Set(calls.map(([key]) => key)).size).toBe(24);
    for (const [, uri, size] of calls) {
      expect(uri.startsWith("data:image/svg+xml;base64,")).toBe(true);
      expect(size).toEqual({ width: 256, height: 256 });
    }
  });
});

describe("toDataUri", () => {
  it("base64-encodes the markup into an SVG data URI", () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"></svg>';
    const uri = toDataUri(svg);

    expect(uri.startsWith("data:image/svg+xml;base64,")).toBe(true);
    expect(atob(uri.slice(uri.indexOf(",") + 1))).toBe(svg);
  });

  it("encodes every story panel without throwing", () => {
    for (const panel of STORY_PANEL_ASSETS) {
      expect(() => toDataUri(panel.svg)).not.toThrow();
    }
  });
});

describe("shell isolation", () => {
  it("keeps the panel art module out of the boot preloader", () => {
    expect(preloadSceneSource).not.toContain("storyOrderArt");
    expect(preloadSceneSource).not.toContain("svg/stories/");
  });
});
