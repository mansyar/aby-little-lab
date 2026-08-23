import "./styles/style.css";
import { registerSW } from "virtual:pwa-register";
import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { HubScene } from "./scenes/HubScene";
import { PreloadScene } from "./scenes/PreloadScene";
import { initPwaBridge } from "./utils/pwaBridge";

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
  // Shell scenes only — the 7 game scenes are lazy-loaded and registered
  // at runtime via ensureSceneLoaded() when a Hub tile is tapped.
  scene: [BootScene, PreloadScene, HubScene],
};

// Initialize the PWA bridge before the game boots so HubScene can receive
// update/offline events the moment it becomes active.
initPwaBridge(registerSW);

new Phaser.Game(config);
