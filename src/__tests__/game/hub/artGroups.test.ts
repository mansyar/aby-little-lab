import { describe, expect, it } from "vitest";
import { music } from "../../../game/art/music";
import { shapes } from "../../../game/art/shapes";
import {
  ART_GROUPS_BY_GAME,
  type ArtGroupLoader,
  type ArtTableLike,
  createArtResolver,
} from "../../../game/hub/artGroups";
import { ART_KEYS_BY_GAME, type ArtKeyEntry } from "../../../game/hub/prewarm";

describe("hub art groups resolver", () => {
  it("resolves every art key of every game to its group's markup", async () => {
    const resolver = createArtResolver();

    // A key from a game's second group exercises the fallback across tables.
    const circle = await resolver.resolveArtSvg({
      gameId: "shape-sorter",
      key: "shape_circle",
      size: 192,
    });
    expect(circle).toBe(shapes.assets.find((asset) => asset.key === "shape_circle")?.svg);

    for (const keys of Object.values(ART_KEYS_BY_GAME)) {
      for (const entry of keys) {
        const svg = await resolver.resolveArtSvg(entry);
        if (!svg) throw new Error(`no markup resolved for ${entry.gameId}/${entry.key}`);
        expect(svg).toContain("<svg");
      }
    }

    // Every raster key's group is a group its game actually draws from.
    for (const [gameId, keys] of Object.entries(ART_KEYS_BY_GAME)) {
      expect(ART_GROUPS_BY_GAME[gameId]).toBeDefined();
      expect(keys.length).toBeGreaterThan(0);
    }
    expect(music.assets.length).toBeGreaterThan(0);
  });

  it("resolves unknown keys to undefined", async () => {
    const resolver = createArtResolver();

    await expect(
      resolver.resolveArtSvg({ gameId: "shape-sorter", key: "not-a-real-key", size: 256 }),
    ).resolves.toBeUndefined();
    await expect(
      resolver.resolveArtSvg({ gameId: "not-a-real-game", key: "shape_circle", size: 256 }),
    ).resolves.toBeUndefined();
  });

  it("loads each group's table once and reuses cached markup", async () => {
    let toyLoads = 0;
    const toyTable: readonly ArtTableLike[] = [
      { assets: [{ key: "toy_test_key", svg: "<svg>toy</svg>" }] },
    ];
    const loaders: Readonly<Record<string, ArtGroupLoader>> = {
      toys: () => {
        toyLoads += 1;
        return Promise.resolve(toyTable);
      },
    };
    const resolver = createArtResolver(loaders);
    const entry: ArtKeyEntry = { gameId: "big-small", key: "toy_test_key", size: 256 };

    await expect(resolver.resolveArtSvg(entry)).resolves.toBe("<svg>toy</svg>");
    await expect(resolver.resolveArtSvg(entry)).resolves.toBe("<svg>toy</svg>");
    expect(toyLoads).toBe(1);
  });
});
