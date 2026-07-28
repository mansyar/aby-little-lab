import Phaser from "phaser";
import { AudioManager } from "../audio/AudioManager";

/**
 * Boot scene — the first scene loaded by the game.
 *
 * Initializes the audio system, attempts to lock the screen orientation to
 * landscape, then transitions to the Preload scene.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "Boot" });
  }

  create(): void {
    AudioManager.getInstance().init();

    screen.orientation.lock("landscape").catch(() => {
      // Orientation lock may fail on unsupported browsers; ignore.
    });
    this.scene.start("Preload");
  }
}
