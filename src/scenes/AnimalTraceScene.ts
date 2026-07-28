import Phaser from "phaser";
import { ParentLock } from "../components/ParentLock";

/**
 * Animal Trace scene — placeholder stub.
 *
 * Game logic will be implemented in a future track. Currently provides
 * a back button gated by ParentLock for navigation back to the Hub.
 */
export class AnimalTraceScene extends Phaser.Scene {
  private parentLock?: ParentLock;

  constructor() {
    super({ key: "AnimalTrace" });
  }

  create(): void {
    const backButton = this.add.text(20, 20, "← Back", {
      fontSize: "24px",
      color: "#2d3748",
    });
    backButton.setInteractive();

    this.parentLock = new ParentLock({
      scene: this,
      target: backButton,
      onSuccess: () => {
        this.scene.start("Hub");
      },
      onFailure: () => {
        // No action needed on failure.
      },
    });

    this.events.on("shutdown", () => {
      this.parentLock?.destroy();
    });
  }
}
