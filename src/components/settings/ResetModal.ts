import type Phaser from "phaser";
import { resetProgress } from "../../utils/storage";
import { textStyle } from "../../utils/typography";
import {
  BACKDROP_COLOR,
  createModalButton,
  createRow,
  DANGER_COLOR,
  DISABLED_COLOR,
  type ObjectBucket,
  OUTLINE_COLOR,
  OVERLAY_ALPHA,
  PANEL_COLOR,
  PANEL_HEIGHT,
  PANEL_WIDTH,
  PRIMARY_COLOR,
} from "./primitives";

export interface ResetModalDeps {
  scene: Phaser.Scene;
  /** Panel display bucket for the row itself; torn down with the panel. */
  objects: ObjectBucket;
  /** Shared overlay lifecycle bucket (Progress/Profiles/iOS/reset modal). */
  overlayObjects: ObjectBucket;
  /** Called after a confirmed reset so the scene can re-render derived views. */
  onProgressReset?: () => void;
}

/**
 * The parental "Reset Progress" row plus its two-step "Reset all stickers?"
 * confirmation modal. The reset only happens after an explicit confirm.
 */
export class ResetModal {
  private readonly deps: ResetModalDeps;
  private resetRowText: Phaser.GameObjects.Text | null = null;

  constructor(deps: ResetModalDeps) {
    this.deps = deps;
  }

  /** Adds the parental "Reset Progress" row that clears all stickers. */
  createRow(x: number, y: number): void {
    this.resetRowText = createRow(
      this.deps.scene,
      x,
      y,
      this.deps.objects,
      "Reset Progress",
      DANGER_COLOR,
      () => this.show(),
    );
  }

  /** Shows the two-step "Reset all stickers?" confirmation modal. */
  show(): void {
    const { width, height } = this.deps.scene.cameras.main;
    const centerX = width / 2;
    const centerY = height / 2;

    const modalBackdrop = this.deps.scene.add
      .rectangle(centerX, centerY, width, height, BACKDROP_COLOR, OVERLAY_ALPHA)
      .setInteractive();
    modalBackdrop.on("pointerdown", () => this.close());
    this.deps.overlayObjects.push(modalBackdrop);
    this.deps.overlayObjects.push(
      this.deps.scene.add
        .rectangle(centerX, centerY, PANEL_WIDTH, PANEL_HEIGHT, PANEL_COLOR)
        .setStrokeStyle(4, OUTLINE_COLOR),
    );
    this.deps.overlayObjects.push(
      this.deps.scene.add
        .text(
          centerX,
          centerY - 105,
          "Reset all stickers?",
          textStyle({
            color: "#2d3748",
            fontSize: "36px",
          }),
        )
        .setOrigin(0.5),
    );
    this.deps.overlayObjects.push(
      this.deps.scene.add
        .text(
          centerX,
          centerY - 25,
          "All stickers will be cleared.",
          textStyle({
            color: "#2d3748",
            fontSize: "30px",
          }),
        )
        .setOrigin(0.5),
    );
    this.deps.overlayObjects.push(
      createModalButton(
        this.deps.scene,
        centerX,
        centerY + 45,
        this.deps.overlayObjects,
        "Cancel",
        PRIMARY_COLOR,
        () => this.close(),
      ),
    );
    this.deps.overlayObjects.push(
      createModalButton(
        this.deps.scene,
        centerX,
        centerY + 125,
        this.deps.overlayObjects,
        "Reset",
        DANGER_COLOR,
        () => this.confirm(),
        { emphasized: true },
      ),
    );
  }

  /** Closes the reset confirmation modal without changing any data. */
  close(): void {
    for (const object of this.deps.overlayObjects) object.destroy();
    this.deps.overlayObjects.length = 0;
  }

  /** Clears the sticker collection and shows inline confirmation. */
  private confirm(): void {
    resetProgress();
    this.close();
    this.resetRowText?.setText("Progress cleared");
    this.resetRowText?.setColor(DISABLED_COLOR);
    this.deps.onProgressReset?.();
  }
}
