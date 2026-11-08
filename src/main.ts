import "./styles/style.css";
import { registerSW } from "virtual:pwa-register";
import Phaser from "phaser";
import { initE2EBridge } from "./game/e2eBridge";
import { installErrorCapture, runningScene } from "./game/errorCapture";
import { BootScene } from "./scenes/BootScene";
import { HubScene } from "./scenes/HubScene";
import { PreloadScene } from "./scenes/PreloadScene";
import { RecoverScene } from "./scenes/RecoverScene";
import { initPwaBridge } from "./utils/pwaBridge";
import { initInstallPrompt } from "./utils/pwaInstall";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1024,
  height: 768,
  parent: "game-container",
  dom: {
    createContainer: true,
  },
  // Scenes are transparent and show the page background (--bg-base #FAF9F6)
  // through; an opaque canvas would render black behind every scene.
  transparent: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 0 },
    },
  },
  // Shell scenes only — all 22 game scenes are lazy-loaded and registered
  // at runtime via loadSceneWithRetry() (retries once, reports failure rather
  // than throwing) when a Hub tile is tapped. Recover is the exception: it is
  // imported above and registered here because the one scene you cannot afford
  // to load lazily is the one that runs when loading is what broke.
  scene: [BootScene, PreloadScene, HubScene, RecoverScene],
};

// Start install-prompt capture before the game boots: the browser fires
// beforeinstallprompt once per page load, so it must be caught before any
// scene can open Settings or the offer is gone.
initInstallPrompt();

// Initialize the PWA bridge before the game boots so HubScene can receive
// update/offline events the moment it becomes active.
initPwaBridge(registerSW);

// The instance is kept so the read-only e2e bridge can reach the scene
// manager; without `?e2e=1` the bridge returns immediately and changes nothing.
const game = new Phaser.Game(config);

// Before anything else is wired, and in particular before the bridge below: a
// failure while wiring the rest of boot is exactly the failure nothing else can
// hear, and the listeners have to exist before it happens.
installErrorCapture(game, { runningScene: () => runningScene(game) });

initE2EBridge(game);
