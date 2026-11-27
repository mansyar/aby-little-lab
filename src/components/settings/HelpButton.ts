import type Phaser from "phaser";
import { attachPressFeedback } from "../../utils/pressFeedback";
import { textStyle } from "../../utils/typography";
import { centredHitArea, type ObjectBucket, PANEL_WIDTH } from "./primitives";

/** Header controls sit this far above the panel's centre. */
const HEADER_OFFSET = -105;
/** Mirrors the close ✕'s inset from the panel edge. */
const HEADER_INSET = 36;
/** Same generous touch band the close ✕ uses. */
const HIT_SIZE = 96;

/** Creates the parent-facing Help control in the persistent Settings header. */
export interface HelpButtonDeps {
  scene: Phaser.Scene;
  /** Persistent Settings objects, so the button survives page switches. */
  objects: ObjectBucket;
  centerX: number;
  centerY: number;
  onOpen: () => void;
}

/**
 * The Help entry point. It lives in the panel's header, not in either page's
 * row bucket, so it keeps the same canvas position on Settings and Backup.
 */
export class HelpButton {
  private readonly scene: Phaser.Scene;
  private readonly label: Phaser.GameObjects.Text;

  constructor(deps: HelpButtonDeps) {
    this.scene = deps.scene;
    const x = deps.centerX - PANEL_WIDTH / 2 + HEADER_INSET;
    const y = deps.centerY + HEADER_OFFSET;
    const label = deps.scene.add
      .text(x, y, "Help", textStyle({ color: "#2d3748", fontSize: "26px" }))
      .setOrigin(0.5);
    label.setInteractive(centredHitArea(HIT_SIZE, HIT_SIZE));
    label.on("pointerdown", deps.onOpen);
    attachPressFeedback(label);
    deps.objects.push(label);
    this.label = label;
  }

  /** The canvas point a finger lands on, published for the browser journey. */
  point(): { x: number; y: number } {
    return { x: this.label.x, y: this.label.y };
  }

  /** Raises the persistent header control above rows built after it. */
  raise(): void {
    this.scene.children.bringToTop(this.label);
  }
}
