import type Phaser from "phaser";
import { attachPressFeedback } from "../../utils/pressFeedback";
import type { InstallTracker } from "../../utils/pwaInstall";
import { textStyle } from "../../utils/typography";
import {
  addRowCard,
  BACKDROP_COLOR,
  centredHitArea,
  type ObjectBucket,
  OUTLINE_COLOR,
  OVERLAY_ALPHA,
  PANEL_COLOR,
  PANEL_HEIGHT,
  PANEL_WIDTH,
  PRIMARY_COLOR,
  ROW_HIT_WIDTH,
  ROW_PITCH,
  TOGGLE_HEIGHT,
  TOGGLE_WIDTH,
} from "./primitives";

export interface InstallRowDeps {
  scene: Phaser.Scene;
  /** Panel display bucket for the row itself; torn down with the panel. */
  objects: ObjectBucket;
  /** Shared overlay lifecycle bucket (Progress/Profiles/iOS/reset modal). */
  overlayObjects: ObjectBucket;
  installTracker: InstallTracker;
}

/**
 * Adds a context-aware install control: "Install App" where a browser install
 * prompt is available, "How to Install" on iOS (which has no prompt), and
 * nothing when the app is already installed.
 */
export class InstallRow {
  private readonly deps: InstallRowDeps;

  constructor(deps: InstallRowDeps) {
    this.deps = deps;
  }

  /** Creates the row at the given panel position (no-op when hidden). */
  create(x: number, y: number): void {
    const state = this.deps.installTracker.getState();
    if (state === "hidden") return;
    addRowCard(this.deps.scene, x, y, this.deps.objects);

    const label = state === "installable" ? "Install App" : "How to Install";
    const button = this.deps.scene.add
      .text(
        x,
        y,
        label,
        textStyle({
          color: PRIMARY_COLOR,
          fontSize: "32px",
        }),
      )
      .setOrigin(0.5);
    button.setInteractive(centredHitArea(ROW_HIT_WIDTH, ROW_PITCH));
    button.on("pointerdown", () => {
      if (state === "installable") {
        void this.deps.installTracker.prompt();
      } else {
        this.showIosOverlay();
      }
    });
    attachPressFeedback(button);
    this.deps.objects.push(button);
  }

  /** Shows the iOS "Add to Home Screen" instructions overlay. */
  showIosOverlay(): void {
    const { width, height } = this.deps.scene.cameras.main;
    const centerX = width / 2;
    const centerY = height / 2;

    const overlayBackdrop = this.deps.scene.add
      .rectangle(centerX, centerY, width, height, BACKDROP_COLOR, OVERLAY_ALPHA)
      .setInteractive();
    overlayBackdrop.on("pointerdown", () => this.closeIosOverlay());
    this.deps.overlayObjects.push(overlayBackdrop);
    this.deps.overlayObjects.push(
      this.deps.scene.add
        .rectangle(centerX, centerY, PANEL_WIDTH, PANEL_HEIGHT, PANEL_COLOR)
        .setStrokeStyle(4, OUTLINE_COLOR),
    );
    const step = (y: number, message: string, fontSize: string): void => {
      this.deps.overlayObjects.push(
        this.deps.scene.add
          .text(centerX, y, message, textStyle({ color: "#2d3748", fontSize }))
          .setOrigin(0.5),
      );
    };
    step(centerY - 105, "Install on iOS", "36px");
    step(centerY - 25, "1. Tap the Share icon", "30px");
    step(centerY + 35, "2. Choose Add to Home Screen", "30px");
    step(centerY + 95, "3. Open Aby's Little Lab offline", "30px");
    const close = this.deps.scene.add
      .text(
        centerX,
        centerY + 175,
        "Close",
        textStyle({
          color: PRIMARY_COLOR,
          fontSize: "30px",
        }),
      )
      .setOrigin(0.5);
    close.setInteractive(centredHitArea(TOGGLE_WIDTH, TOGGLE_HEIGHT));
    close.on("pointerdown", () => this.closeIosOverlay());
    this.deps.overlayObjects.push(close);
  }

  /** Destroys the iOS instructions overlay (not the panel). */
  closeIosOverlay(): void {
    for (const object of this.deps.overlayObjects) object.destroy();
    this.deps.overlayObjects.length = 0;
  }
}
