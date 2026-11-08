import type Phaser from "phaser";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type {
  E2EHubPlayTime,
  E2EHubToast,
  E2EProgressState,
  E2ERoundGeometry,
  E2ERoundTarget,
  E2ESettingsState,
} from "../../game/e2eBridge";
import { initE2EBridge } from "../../game/e2eBridge";
import { addProfile, earnSticker } from "../../utils/storage";

/** The slice of a scene the bridge reads, with nothing of Phaser booted. */
interface FakeScene {
  scene: { key: string };
  completedRounds?: number;
  e2eRoundGeometry?: () => E2ERoundGeometry | null;
  e2eHubTiles?: () => E2ERoundTarget[];
  e2eHubToast?: () => E2EHubToast | null;
  e2eHubReady?: () => boolean;
  e2eSettings?: () => E2ESettingsState;
  e2eHubPlayTime?: () => E2EHubPlayTime;
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

/**
 * The settings state of a scene that publishes no panel: no gate, no panel, and
 * the second page at rest. A fresh object each call, so an assertion against it
 * compares values rather than a shared reference.
 */
function noPanelSettings(): E2ESettingsState {
  return {
    gate: null,
    open: false,
    toggles: [],
    progressRow: null,
    progress: null,
    degraded: false,
    page: 0,
    switchPage: { x: 0, y: 0 },
    backupRows: [],
    backupResult: "",
    choices: [],
  };
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
        "hubPlayTime",
        "hubReady",
        "hubTiles",
        "hubToast",
        "profileCount",
        "roundGeometry",
        "roundIndex",
        "settings",
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
    it("reports the scene's completed-round counter", () => {
      const scene = sceneWith("ShapeSorter");
      scene.completedRounds = 0;
      install([scene]);

      expect(window.__abyE2E?.roundIndex()).toBe(0);

      scene.completedRounds = 1;
      expect(window.__abyE2E?.roundIndex()).toBe(1);

      scene.completedRounds = 2;
      expect(window.__abyE2E?.roundIndex()).toBe(2);
    });

    it("reports -1 for a scene with no counter", () => {
      install([sceneWith("Hub")]);

      // -1 rather than 0: a journey asserting "on round 0" must fail if a game
      // scene stops publishing a counter, not pass on a coincidental zero.
      expect(window.__abyE2E?.roundIndex()).toBe(-1);
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

  describe("hubTiles", () => {
    it("reports no tiles when the active scene publishes no hub hook", () => {
      install([sceneWith("ShapeSorter")]);

      expect(window.__abyE2E?.hubTiles()).toEqual([]);
    });

    it("reports no tiles when no scene is active", () => {
      install();

      expect(window.__abyE2E?.hubTiles()).toEqual([]);
    });

    it("returns the hook's live value", () => {
      const scene = sceneWith("Hub");
      const first: E2ERoundTarget[] = [
        { id: "0", x: 100, y: 200 },
        { id: "1", x: 260, y: 200 },
      ];
      scene.e2eHubTiles = () => first;
      install([scene]);

      expect(window.__abyE2E?.hubTiles()).toBe(first);

      const second: E2ERoundTarget[] = [{ id: "21", x: 512, y: 640 }];
      scene.e2eHubTiles = () => second;
      expect(window.__abyE2E?.hubTiles()).toBe(second);
    });
  });

  describe("hubToast", () => {
    it("reports null when the active scene publishes no toast hook", () => {
      install([sceneWith("ShapeSorter")]);

      expect(window.__abyE2E?.hubToast()).toBeNull();
    });

    it("reports null when no scene is active", () => {
      install();

      expect(window.__abyE2E?.hubToast()).toBeNull();
    });

    it("follows the hook from showing to dismissed", () => {
      const scene = sceneWith("Hub");
      const showing: E2EHubToast = { button: { x: 512, y: 140 } };
      let toast: E2EHubToast | null = showing;
      scene.e2eHubToast = () => toast;
      install([scene]);

      expect(window.__abyE2E?.hubToast()).toEqual(showing);

      toast = null;
      expect(window.__abyE2E?.hubToast()).toBeNull();
    });
  });

  describe("hubReady", () => {
    it("is false when the active scene publishes no readiness hook", () => {
      install([sceneWith("ShapeSorter")]);

      expect(window.__abyE2E?.hubReady()).toBe(false);
    });

    it("is false when no scene is active", () => {
      install();

      expect(window.__abyE2E?.hubReady()).toBe(false);
    });

    it("follows the hub from entering to settled", () => {
      const scene = sceneWith("Hub");
      let ready = false;
      scene.e2eHubReady = () => ready;
      install([scene]);

      expect(window.__abyE2E?.hubReady()).toBe(false);

      ready = true;
      expect(window.__abyE2E?.hubReady()).toBe(true);
    });
  });

  describe("settings", () => {
    it("reports no gate and no panel when the active scene publishes no hook", () => {
      install([sceneWith("ShapeSorter")]);

      expect(window.__abyE2E?.settings()).toEqual(noPanelSettings());
    });

    it("reports no gate and no panel when no scene is active", () => {
      install();

      expect(window.__abyE2E?.settings()).toEqual(noPanelSettings());
    });

    it("follows the gate point, the panel and a toggle's own state", () => {
      const scene = sceneWith("Hub");
      let on = true;
      let state: E2ESettingsState = {
        ...noPanelSettings(),
        gate: { x: 1016, y: 32 },
        open: true,
        toggles: [{ id: "adaptive", x: 512, y: 449, on }],
        progressRow: { x: 512, y: 505 },
        degraded: true,
      };
      scene.e2eSettings = () => state;
      install([scene]);

      expect(window.__abyE2E?.settings().toggles[0]?.on).toBe(true);
      expect(window.__abyE2E?.settings().degraded).toBe(true);

      on = false;
      state = { ...state, toggles: [{ id: "adaptive", x: 512, y: 449, on }] };
      expect(window.__abyE2E?.settings().toggles[0]?.on).toBe(false);

      state = {
        ...noPanelSettings(),
        gate: { x: 1016, y: 32 },
      };
      expect(window.__abyE2E?.settings()).toEqual({
        ...noPanelSettings(),
        gate: { x: 1016, y: 32 },
      });
    });

    it("reports the Progress row's point and the overlay's live page", () => {
      const scene = sceneWith("Hub");
      const page0: E2EProgressState = {
        page: 0,
        pageCount: 5,
        lines: ["a", "b", "c"],
        prev: { x: 402, y: 559 },
        next: { x: 622, y: 559 },
      };
      const page1: E2EProgressState = {
        page: 1,
        pageCount: 5,
        lines: [],
        prev: { x: 402, y: 559 },
        next: { x: 622, y: 559 },
      };
      let progress: E2EProgressState | null = null;
      scene.e2eSettings = () => ({
        ...noPanelSettings(),
        gate: { x: 1016, y: 32 },
        open: true,
        progressRow: { x: 512, y: 505 },
        progress,
      });
      install([scene]);

      expect(window.__abyE2E?.settings().progressRow).toEqual({ x: 512, y: 505 });
      expect(window.__abyE2E?.settings().progress).toBeNull();

      progress = page0;
      expect(window.__abyE2E?.settings().progress).toBe(page0);

      progress = page1;
      const moved = window.__abyE2E?.settings().progress;
      expect(moved?.page).toBe(1);
      expect(moved?.lines).toEqual([]);
    });

    it("publishes the second page, its switch point and its two action rows", () => {
      const scene = sceneWith("Hub");
      let state: E2ESettingsState = {
        ...noPanelSettings(),
        gate: { x: 1016, y: 32 },
        open: true,
        page: 0,
        switchPage: { x: 512, y: 134 },
        backupRows: [],
        backupResult: "",
      };
      scene.e2eSettings = () => state;
      install([scene]);

      // Page one first: the switch is there, the backup rows are not.
      expect(window.__abyE2E?.settings().page).toBe(0);
      expect(window.__abyE2E?.settings().switchPage).toEqual({ x: 512, y: 134 });
      expect(window.__abyE2E?.settings().backupRows).toEqual([]);
      expect(window.__abyE2E?.settings().backupResult).toBe("");
      expect(window.__abyE2E?.settings().choices, "no card is open yet").toEqual([]);

      // A parent taps the switch: the same point now means "back to settings",
      // and the two rows it led to are live.
      state = {
        ...state,
        page: 1,
        backupRows: [
          { id: "export", point: { x: 512, y: 337 } },
          { id: "restore", point: { x: 512, y: 393 } },
        ],
      };
      expect(window.__abyE2E?.settings().page).toBe(1);
      expect(window.__abyE2E?.settings().switchPage).toEqual({ x: 512, y: 134 });
      expect(window.__abyE2E?.settings().backupRows.map((row) => row.id)).toEqual([
        "export",
        "restore",
      ]);
      expect(window.__abyE2E?.settings().backupRows[1]?.point).toEqual({ x: 512, y: 393 });

      // And the line the parent reads afterwards.
      state = { ...state, backupResult: "Saved aby-little-lab-backup-2026-11-08.json" };
      expect(window.__abyE2E?.settings().backupResult).toBe(
        "Saved aby-little-lab-backup-2026-11-08.json",
      );

      // And, once a picked file is accepted, the two buttons its card offers:
      // a journey taps these rather than copying the card's own geometry.
      state = {
        ...state,
        choices: [
          { id: "merge", point: { x: 512, y: 424 } },
          { id: "replace", point: { x: 512, y: 504 } },
        ],
      };
      expect(window.__abyE2E?.settings().choices.map((choice) => choice.id)).toEqual([
        "merge",
        "replace",
      ]);
      expect(window.__abyE2E?.settings().choices[1]?.point).toEqual({ x: 512, y: 504 });
    });

    it("reports the empty page again once the panel closes", () => {
      const scene = sceneWith("Hub");
      let state: E2ESettingsState = {
        ...noPanelSettings(),
        gate: { x: 1016, y: 32 },
        open: true,
        page: 1,
        switchPage: { x: 512, y: 134 },
        backupRows: [{ id: "restore", point: { x: 512, y: 393 } }],
        backupResult: "Nothing was restored.",
      };
      scene.e2eSettings = () => state;
      install([scene]);

      state = { ...noPanelSettings(), gate: { x: 1016, y: 32 } };
      expect(window.__abyE2E?.settings()).toEqual({
        ...noPanelSettings(),
        gate: { x: 1016, y: 32 },
      });
    });
  });

  describe("hubPlayTime", () => {
    it("reports spent budget and no nudge when the scene publishes no hook", () => {
      install([sceneWith("ShapeSorter")]);

      expect(window.__abyE2E?.hubPlayTime()).toEqual({ timeUp: false, nudging: false });
    });

    it("reports nothing when no scene is active", () => {
      install();

      expect(window.__abyE2E?.hubPlayTime()).toEqual({ timeUp: false, nudging: false });
    });

    it("follows the hub from locked to nudging", () => {
      const scene = sceneWith("Hub");
      let state: E2EHubPlayTime = { timeUp: true, nudging: false };
      scene.e2eHubPlayTime = () => state;
      install([scene]);

      expect(window.__abyE2E?.hubPlayTime()).toEqual({ timeUp: true, nudging: false });

      state = { timeUp: false, nudging: true };
      expect(window.__abyE2E?.hubPlayTime()).toEqual({ timeUp: false, nudging: true });
    });
  });
});
