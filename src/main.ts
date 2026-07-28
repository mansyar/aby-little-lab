import "./styles/style.css";
import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { HubScene } from "./scenes/HubScene";
import { PreloadScene } from "./scenes/PreloadScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1024,
  height: 768,
  parent: "game-container",
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
  scene: [BootScene, PreloadScene, HubScene],
};

new Phaser.Game(config);
