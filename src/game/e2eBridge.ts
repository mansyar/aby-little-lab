import type Phaser from "phaser";
import { getActiveProfile, getProfiles } from "../utils/storage";
import type {
  E2EBridge,
  E2EFixItMachineState,
  E2EHubGroups,
  E2EHubPlayTime,
  E2EHubToast,
  E2ERecoverState,
  E2ERobotPathState,
  E2ERoundGeometry,
  E2ERoundTarget,
  E2ESettingsState,
} from "./e2eBridgeTypes";

export type {
  E2EBackupState,
  E2EBridge,
  E2EFixItMachineCard,
  E2EFixItMachineState,
  E2EFixItMachineTraySlot,
  E2EHelpState,
  E2EHubChip,
  E2EHubGroups,
  E2EHubPlayTime,
  E2EHubToast,
  E2EProgressState,
  E2ERecoverState,
  E2ERobotPathPalette,
  E2ERobotPathSlot,
  E2ERobotPathState,
  E2ERoundGeometry,
  E2ERoundTarget,
  E2ESettingsState,
  E2ESettingsToggle,
  GamePoint,
} from "./e2eBridgeTypes";

/**
 * What the bridge reaches for on a scene at runtime.
 *
 * `GameSceneBase` declares the geometry hook `protected`, so TypeScript hides it
 * from outside the class even though it is a plain prototype method at runtime.
 * This shape plus one cast is how the bridge reads it without importing a scene
 * (the dependency stays one-way: scenes -> bridge types, bridge -> nothing) and
 * without widening the scene's public surface for production code.
 */
interface E2ESceneProbe {
  completedRounds?: number;
  e2eRoundGeometry?: () => E2ERoundGeometry | null;
  e2eHubTiles?: () => E2ERoundTarget[];
  e2eHubToast?: () => E2EHubToast | null;
  e2eHubReady?: () => boolean;
  e2eSettings?: () => E2ESettingsState;
  e2eHubPlayTime?: () => E2EHubPlayTime;
  e2eHubGroups?: () => E2EHubGroups;
  e2eRecoverButton?: () => E2ERecoverState | null;
  e2eRobotPath?: () => E2ERobotPathState | null;
  e2eFixItMachine?: () => E2EFixItMachineState | null;
}

/** True when the page was opened by the browser suite. */
function bridgeRequested(): boolean {
  return new URLSearchParams(location.search).get("e2e") === "1";
}

/** The scene Phaser is currently showing, or undefined before the first boot. */
function activeScene(game: Phaser.Game): Phaser.Scene | undefined {
  return game.scene.getScenes(true)[0];
}

function probeOf(scene: Phaser.Scene | undefined): E2ESceneProbe | undefined {
  return scene as unknown as E2ESceneProbe | undefined;
}

/**
 * Rounds finished in the active visit, read from the scene's own counter, or
 * `-1` when the active scene publishes no counter at all.
 *
 * `GameSceneBase` keeps `completedRounds`, advances it once in `fillProgressDot`,
 * and resets it when the dots are rebuilt or the scene shuts down - so this
 * reports 0 before the first round and one more per finished round. Not inferred
 * from the dots: a dot is dimmed with its *fill* alpha, which leaves the game
 * object's `alpha` at 1, so counting dots by alpha would report every dot as
 * filled.
 *
 * The `-1` default matches the other counters (`profileCount`, `stickerCount`):
 * a caller asserting "the game is on round 0" then fails loudly if a scene
 * stops publishing a counter, instead of passing on a coincidental zero.
 */
function completedRounds(probe: E2ESceneProbe | undefined): number {
  const count = probe?.completedRounds;
  return typeof count === "number" ? count : -1;
}

/** The active profile's earned stickers. */
function earnedStickers(): number {
  const stickers = getActiveProfile().stickers;
  return Object.values(stickers).filter((sticker) => sticker.earned).length;
}

/**
 * Installs the read-only test window when the page URL asks for it.
 *
 * Inert without `?e2e=1`: nothing is assigned and the game instance is only
 * held by the caller. When it is installed every accessor reads live state at
 * call time — there is no cache, no setter and no storage write — so the suite
 * can poll the round without the bridge ever steering it.
 *
 * The bridge is deliberately the same code in the shipped artifact: the gate is
 * the query string, not a build-time flag, so what CI exercises is what users
 * download.
 */
export function initE2EBridge(game: Phaser.Game): void {
  if (!bridgeRequested()) return;

  const bridge: E2EBridge = {
    activeSceneKey: () => activeScene(game)?.scene.key ?? null,
    profileCount: () => getProfiles().length,
    stickerCount: earnedStickers,
    roundIndex: () => completedRounds(probeOf(activeScene(game))),
    roundGeometry: () => {
      const probe = probeOf(activeScene(game));
      const hook = probe?.e2eRoundGeometry;
      if (typeof hook !== "function") return null;
      return hook.call(probe);
    },
    hubTiles: () => {
      const probe = probeOf(activeScene(game));
      const hook = probe?.e2eHubTiles;
      if (typeof hook !== "function") return [];
      return hook.call(probe);
    },
    hubToast: () => {
      const probe = probeOf(activeScene(game));
      const hook = probe?.e2eHubToast;
      if (typeof hook !== "function") return null;
      return hook.call(probe);
    },
    hubReady: () => {
      const probe = probeOf(activeScene(game));
      const hook = probe?.e2eHubReady;
      if (typeof hook !== "function") return false;
      return hook.call(probe);
    },
    settings: () => {
      const probe = probeOf(activeScene(game));
      const hook = probe?.e2eSettings;
      if (typeof hook !== "function") {
        return {
          gate: null,
          open: false,
          toggles: [],
          progressRow: null,
          progress: null,
          helpButton: null,
          help: null,
          degraded: false,
          page: 0,
          switchPage: { x: 0, y: 0 },
          backupRows: [],
          backupResult: "",
          choices: [],
        };
      }
      return hook.call(probe);
    },
    hubPlayTime: () => {
      const probe = probeOf(activeScene(game));
      const hook = probe?.e2eHubPlayTime;
      if (typeof hook !== "function") return { timeUp: false, nudging: false };
      return hook.call(probe);
    },
    hubGroups: () => {
      const probe = probeOf(activeScene(game));
      const hook = probe?.e2eHubGroups;
      if (typeof hook !== "function") return { selected: "all", chips: [] };
      return hook.call(probe);
    },
    robotPath: () => {
      const probe = probeOf(activeScene(game));
      const hook = probe?.e2eRobotPath;
      if (typeof hook !== "function") return null;
      return hook.call(probe);
    },
    fixItMachine: () => {
      const probe = probeOf(activeScene(game));
      const hook = probe?.e2eFixItMachine;
      if (typeof hook !== "function") return null;
      return hook.call(probe);
    },
    recover: () => {
      // The card is only readable while it is what Phaser is showing: after the
      // tap the page is reloading and after a normal launch this scene is not
      // running at all, so there is no button a journey could honestly tap.
      const scene = activeScene(game);
      if (scene?.scene.key !== "Recover") return null;
      const probe = probeOf(scene);
      const hook = probe?.e2eRecoverButton;
      if (typeof hook !== "function") return null;
      return hook.call(probe);
    },
  };

  window.__abyE2E = Object.freeze(bridge);
}
