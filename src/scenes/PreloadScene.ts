import Phaser from "phaser";

/**
 * Preload scene — displays a progress bar while assets load.
 *
 * Registers load event listeners for progress tracking, then transitions
 * to the Hub scene once all assets are loaded.
 */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: "Preload" });
  }

  preload(): void {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    const progressBar = this.add.rectangle(centerX, centerY, 300, 30, 0xffffff);
    const progressBox = this.add.rectangle(centerX, centerY, 320, 50, 0x222222);
    progressBox.setDepth(-1);

    this.load.on("progress", (value: number) => {
      progressBar.setDisplaySize(300 * value, 30);
    });

    this.load.on("complete", () => {
      progressBar.destroy();
      progressBox.destroy();
    });
  }

  create(): void {
    this.scene.start("Hub");
  }
}
