import type Phaser from "phaser";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { E2ERoundGeometry } from "../../game/e2eBridge";
import { initE2EBridge } from "../../game/e2eBridge";
import { addProfile, earnSticker } from "../../utils/storage";

/** The slice of a scene the bridge reads, with nothing of Phaser booted. */
interface FakeScene {
  scene: { key: string };
  progressDots?: Array<{ alpha: number }>;
  e2eRoundGeometry?: () => E2ERoundGeometry | null;
}

interface FakeGame {
  game: Phaser.Game;
  scenes: FakeScene[];
}

/** A game whose active-scene list is read live, so a test can swap scenes. */
function createGame(scenes: FakeScene[]): FakeGame {
  const game = {
    scene: {
      getScenes: () => scenes,
    },
  } as unknown as Phaser.Game;
  return { game, scenes };
}

/** A minimal active scene with no progress dots and no geometry hook. */
function sceneWith(key: string): FakeScene {
  return { scene: { key } };
}

/** Installs the bridge behind `?e2e=1` and returns it. */
function install(scenes: FakeScene[] = []): FakeGame {
  window.history.replaceState({}, "", "/?e2e=1");
  const fake = createGame(scenes);
  initE2EBridge(fake.game);
  return fake;
}

describe("initE2EBridge", () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState({}, "", "/");
    delete window.__abyE2E;
  });

  afterEach(() => {
    delete window.__abyE2E;
    window.history.replaceState({}, "", "/");
  });

  describe("the gate", () => {
    it("installs nothing without the query parameter", () => {
      const { game } = createGame([sceneWith("Hub")]);

      initE2EBridge(game);

      expect(window.__abyE2E).toBeUndefined();
    });

    it("installs nothing for a value other than 1", () => {
      window.history.replaceState({}, "", "/?e2e=true");

      initE2EBridge(createGame([sceneWith("Hub")]).game);

      expect(window.__abyE2E).toBeUndefined();
    });

    it("leaves an installed bridge untouched when the parameter is gone", () => {
      install([sceneWith("Hub")]);
      const installed = window.__abyE2E;

      window.history.replaceState({}, "", "/");
      initE2EBridge(createGame([sceneWith("Other")]).game);

      expect(window.__abyE2E).toBe(installed);
      expect(window.__abyE2E?.activeSceneKey()).toBe("Hub");
    });

    it("installs a frozen object for ?e2e=1", () => {
      install([sceneWith("Hub")]);

      const bridge = window.__abyE2E;

      expect(bridge).toBeDefined();
      expect(Object.isFrozen(bridge)).toBe(true);
      expect(Object.keys(bridge ?? {}).sort()).toEqual([
        "activeSceneKey",
        "profileCount",
        "roundGeometry",
        "roundIndex",
        "stickerCount",
      ]);
    });
  });

  describe("activeSceneKey", () => {
    it("follows the scene manager between calls", () => {
      const { scenes } = install();

      expect(window.__abyE2E?.activeSceneKey()).toBeNull();

      scenes.push(sceneWith("Hub"));
      expect(window.__abyE2E?.activeSceneKey()).toBe("Hub");

      scenes.splice(0, 1, sceneWith("ShapeSorter"));
      expect(window.__abyE2E?.activeSceneKey()).toBe("ShapeSorter");
    });
  });

  describe("profileCount", () => {
    it("reads the stored profile list at call time", () => {
      install();
      expect(window.__abyE2E?.profileCount()).toBe(1);

      addProfile("dog");
      expect(window.__abyE2E?.profileCount()).toBe(2);

      addProfile("pig");
      expect(window.__abyE2E?.profileCount()).toBe(3);
    });
  });

  describe("stickerCount", () => {
    it("counts the active profile's earned stickers at call time", () => {
      install();
      expect(window.__abyE2E?.stickerCount()).toBe(0);

      earnSticker("shape-sorter");
      expect(window.__abyE2E?.stickerCount()).toBe(1);

      earnSticker("memory-match");
      expect(window.__abyE2E?.stickerCount()).toBe(2);
    });
  });

  describe("roundIndex", () => {
    it("counts filled progress dots as completed rounds", () => {
      const scene = sceneWith("ShapeSorter");
      scene.progressDots = [{ alpha: 0.3 }, { alpha: 0.3 }, { alpha: 0.3 }];
      install([scene]);

      expect(window.__abyE2E?.roundIndex()).toBe(0);

      scene.progressDots[0].alpha = 1;
      expect(window.__abyE2E?.roundIndex()).toBe(1);

      scene.progressDots[1].alpha = 1;
      expect(window.__abyE2E?.roundIndex()).toBe(2);
    });

    it("reports zero for a scene that has no progress dots", () => {
      install([sceneWith("Hub")]);

      expect(window.__abyE2E?.roundIndex()).toBe(0);
    });
  });

  describe("roundGeometry", () => {
    it("returns null when the active scene publishes no hook", () => {
      install([sceneWith("Hub")]);

      expect(window.__abyE2E?.roundGeometry()).toBeNull();
    });

    it("returns null when no scene is active", () => {
      install();

      expect(window.__abyE2E?.roundGeometry()).toBeNull();
    });

    it("returns the hook's live value", () => {
      const scene = sceneWith("MemoryMatch");
      const first: E2ERoundGeometry = {
        round: 0,
        targets: [{ id: "animal_cat", x: 320, y: 384 }],
      };
      scene.e2eRoundGeometry = () => first;
      install([scene]);

      expect(window.__abyE2E?.roundGeometry()).toBe(first);

      const second: E2ERoundGeometry = {
        round: 1,
        targets: [{ id: "animal_dog", x: 512, y: 384 }],
        slots: [{ id: "animal_dog", x: 512, y: 600 }],
      };
      scene.e2eRoundGeometry = () => second;
      expect(window.__abyE2E?.roundGeometry()).toBe(second);
    });
  });
});
