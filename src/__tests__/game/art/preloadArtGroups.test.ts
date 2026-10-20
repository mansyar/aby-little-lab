import type Phaser from "phaser";
import { afterEach, describe, expect, it, vi } from "vitest";
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
  preloadArtGroups,
  shadows,
  shapes,
  toys,
} from "../../../game/art";
import { textureSizeFor } from "../../../utils/textureTiers";
import { MockScene } from "../../helpers/phaserMock";

/**
 * A loader mock that answers `textures.exists` from the keys it holds and
 * registers a canvas key when the placeholder path creates one, like the real
 * manager does.
 */
class ArtScene extends MockScene {
  readonly loadedKeys: Set<string>;
  readonly textures = {
    exists: vi.fn((key: string) => this.loadedKeys.has(key)),
    createCanvas: vi.fn((key: string) => {
      this.loadedKeys.add(key);
      return {
        context: {
          fillStyle: "",
          strokeStyle: "",
          lineWidth: 0,
          fillRect: vi.fn(),
          strokeRect: vi.fn(),
        },
        refresh: vi.fn(),
      };
    }),
  };

  /** `loadedKeys` is shared between scenes to model the one game-wide cache. */
  constructor(loadedKeys: Set<string> = new Set<string>()) {
    super();
    this.loadedKeys = loadedKeys;
  }
}

/** The scene as the registry sees it (`Phaser.Scene`), without a real Phaser. */
const asScene = (scene: ArtScene): Phaser.Scene => scene as unknown as Phaser.Scene;

type SvgCall = [string, string, { width: number; height: number }];

const svgCalls = (scene: ArtScene): SvgCall[] => scene.load.svg.mock.calls as SvgCall[];
const registeredKeys = (scene: ArtScene): string[] => svgCalls(scene).map(([key]) => key);

/** Fires one loader event on every handler the registry attached. */
function emitLoaderEvent(scene: ArtScene, event: string, ...args: unknown[]): void {
  for (const call of scene.load.on.mock.calls) {
    if (call[0] !== event) continue;
    const handler = call[1] as (...handlerArgs: unknown[]) => void;
    handler(...args);
  }
}

const ALL_GROUPS = [
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

const createdScenes: ArtScene[] = [];

function createScene(loadedKeys?: Set<string>): ArtScene {
  const scene = new ArtScene(loadedKeys);
  createdScenes.push(scene);
  return scene;
}

afterEach(() => {
  // Most tests deliberately leave loads in flight. A shutdown is how a real
  // scene gives those keys back when a child leaves mid-load, so it is also
  // the honest cleanup: it exercises the same release path the product uses.
  for (const scene of createdScenes) {
    scene.events.emit("shutdown");
  }
  createdScenes.length = 0;
});

describe("preloadArtGroups", () => {
  it("registers each key once, at that key's texture tier", () => {
    const scene = createScene();

    preloadArtGroups(asScene(scene), ALL_GROUPS);

    const calls = svgCalls(scene);
    const expectedKeys = ALL_GROUPS.flatMap((group) => group.assets.map((asset) => asset.key));

    expect(calls).toHaveLength(expectedKeys.length);
    expect(registeredKeys(scene)).toEqual(expectedKeys);
    expect(new Set(registeredKeys(scene)).size).toBe(expectedKeys.length);

    for (const [key, uri, size] of calls) {
      expect(uri.startsWith("data:image/svg+xml;base64,"), key).toBe(true);
      expect(size, key).toEqual({ width: textureSizeFor(key), height: textureSizeFor(key) });
    }

    // Two tiers are in play, so the size really comes from the key.
    const sizes = new Set(calls.map(([, , size]) => size.width));
    expect(sizes).toContain(160);
    expect(sizes).toContain(256);
  });

  it("skips a key the TextureManager already holds", () => {
    const scene = createScene();
    scene.loadedKeys.add("shape_circle");

    preloadArtGroups(asScene(scene), [shapes]);

    const keys = registeredKeys(scene);
    expect(keys).toHaveLength(17);
    expect(keys).not.toContain("shape_circle");
  });

  it("is a no-op when a second call follows a completed load", () => {
    const scene = createScene();

    preloadArtGroups(asScene(scene), [shapes]);
    expect(scene.load.svg).toHaveBeenCalledTimes(18);

    // Simulate the loader delivering every file to the TextureManager.
    for (const key of registeredKeys(scene)) {
      scene.loadedKeys.add(key);
      emitLoaderEvent(scene, "filecomplete", key);
    }

    preloadArtGroups(asScene(scene), [shapes]);
    expect(scene.load.svg).toHaveBeenCalledTimes(18);
  });

  it("registers a key once when two scenes queue it before the load completes", () => {
    const first = createScene();
    const second = createScene();

    preloadArtGroups(asScene(first), [shapes]);
    preloadArtGroups(asScene(second), [shapes]);

    expect(first.load.svg).toHaveBeenCalledTimes(18);
    expect(second.load.svg).toHaveBeenCalledTimes(0);
  });

  it("registers a key once when the same scene queues it twice mid-flight", () => {
    const scene = createScene();

    preloadArtGroups(asScene(scene), [animals]);
    preloadArtGroups(asScene(scene), [animals, animals]);

    expect(scene.load.svg).toHaveBeenCalledTimes(6);
  });

  it("releases in-flight keys when the owning scene shuts down, so the next scene can register them", () => {
    const first = createScene();
    const second = createScene();

    preloadArtGroups(asScene(first), [shapes]);
    expect(first.load.svg).toHaveBeenCalledTimes(18);

    // A child taps Back before a single file lands: Phaser emits no
    // `loaderror` for those files, only the scene shutdown.
    first.events.emit("shutdown");

    preloadArtGroups(asScene(second), [shapes]);
    expect(second.load.svg).toHaveBeenCalledTimes(18);
  });

  it("keeps delivered art satisfied when the owning scene shuts down", () => {
    const textures = new Set<string>();
    const first = createScene(textures);
    const second = createScene(textures);

    preloadArtGroups(asScene(first), [shapes]);
    textures.add("shape_circle");
    emitLoaderEvent(first, "filecomplete", "shape_circle");

    first.events.emit("shutdown");

    preloadArtGroups(asScene(second), [shapes]);
    const keys = registeredKeys(second);
    // The 17 stranded keys come back; the delivered one stays in the shared
    // TextureManager and must not be rasterized a second time.
    expect(keys).toHaveLength(17);
    expect(keys).not.toContain("shape_circle");
  });

  it("releases a key when its file completes, so another scene can register it", () => {
    const first = createScene();
    const second = createScene();
    preloadArtGroups(asScene(first), [faces]);

    emitLoaderEvent(first, "filecomplete", "face_happy");

    preloadArtGroups(asScene(second), [faces]);
    // Only the settled key is eligible again; the other three are still in
    // flight from the first scene.
    expect(registeredKeys(second)).toEqual(["face_happy"]);
  });

  it("draws a placeholder when the load completes and never re-queues the key", () => {
    const scene = createScene();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    try {
      preloadArtGroups(asScene(scene), [glyphs]);
      expect(scene.load.svg).toHaveBeenCalledTimes(8);

      emitLoaderEvent(scene, "loaderror", { key: "bubble" });
      emitLoaderEvent(scene, "complete");

      // The shipped flow draws the neutral placeholder once, at its tier size,
      // instead of leaving Phaser's __MISSING frame - and says so once.
      expect(warn).toHaveBeenCalledTimes(1);
      expect(scene.textures.createCanvas).toHaveBeenCalledWith(
        "bubble",
        textureSizeFor("bubble"),
        textureSizeFor("bubble"),
      );
      expect(scene.textures.exists("bubble")).toBe(true);

      // The placeholder is a real texture in the shared manager, so a later
      // preload sees the key present and does not queue it again.
      const queuedBeforeRetry = registeredKeys(scene);
      preloadArtGroups(asScene(scene), [glyphs]);
      expect(registeredKeys(scene)).toEqual(queuedBeforeRetry);
      expect(scene.load.svg).toHaveBeenCalledTimes(8);
    } finally {
      warn.mockRestore();
    }
  });
});
