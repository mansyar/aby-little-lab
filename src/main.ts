import "./styles/style.css";
import Phaser from "phaser";
import { AnimalTraceScene } from "./scenes/AnimalTraceScene";
import { BigSmallScene } from "./scenes/BigSmallScene";
import { BootScene } from "./scenes/BootScene";
import { HubScene } from "./scenes/HubScene";
import { MusicalMemoryScene } from "./scenes/MusicalMemoryScene";
import { PopFreezeScene } from "./scenes/PopFreezeScene";
import { PreloadScene } from "./scenes/PreloadScene";
import { ShadowMatchScene } from "./scenes/ShadowMatchScene";
import { ShapeSorterScene } from "./scenes/ShapeSorterScene";

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
  scene: [
    BootScene,
    PreloadScene,
    HubScene,
    ShapeSorterScene,
    AnimalTraceScene,
    PopFreezeScene,
    ShadowMatchScene,
    MusicalMemoryScene,
    BigSmallScene,
  ],
};

new Phaser.Game(config);
