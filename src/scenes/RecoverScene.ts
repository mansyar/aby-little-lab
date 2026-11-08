import Phaser from "phaser";
import { reloadOnce } from "../utils/reload";

/**
 * The recovery card (FR-6, NFR-3, NFR-7): the one screen a crash produces.
 *
 * It is a Phaser scene rather than DOM because the canvas is the whole child
 * surface and a DOM overlay would have to re-solve scaling, orientation and
 * pointer routing that Phaser already owns (NFR-3).
 *
 * There is no text anywhere on it. A four-year-old cannot read, so the card
 * carries the product rule in shape instead of words: the mascot they know, and
 * one circular arrow that means "again".
 */

/** Page background (`--bg-base`), matched so the card hides the broken scene. */
const BG_COLOR = 0xfaf9f6;
/** The house outline (`OUTLINE_COLOR` in `components/settings/primitives`). */
const OUTLINE_COLOR = 0x2d3748;
/** The panel cream the rest of the app puts behind its buttons. */
const BUTTON_COLOR = 0xfff8e7;

const SCREEN_WIDTH = 1024;
const SCREEN_HEIGHT = 768;

const MASCOT_X = 512;
const MASCOT_Y = 330;

const BUTTON_X = 512;
const BUTTON_Y = 560;
const BUTTON_RADIUS = 64;
/** A child's aim is poor; the touch target is comfortably larger than the art. */
const HIT_RADIUS = 72;
const STROKE_WIDTH = 6;

const ARROW_RADIUS = 36;
/** The arc starts just past three o'clock and sweeps most of the way round. */
const ARC_START = -0.6;
const ARC_END = 4.6;
const ARROW_LENGTH = 22;
const ARROW_SPREAD = 0.55;

export class RecoverScene extends Phaser.Scene {
  constructor() {
    super({ key: "Recover" });
  }

  create(): void {
    // Full-bleed and opaque: whatever the broken scene drew must not show
    // through, or the card reads as part of the mess rather than as a way out.
    this.add.rectangle(
      SCREEN_WIDTH / 2,
      SCREEN_HEIGHT / 2,
      SCREEN_WIDTH,
      SCREEN_HEIGHT,
      BG_COLOR,
      1,
    );

    // Never assume the texture loaded: a crash during preload is a crash this
    // card is for, and it is exactly the case where the mascot is missing.
    if (this.textures.exists("mascot_idle")) {
      this.add.image(MASCOT_X, MASCOT_Y, "mascot_idle");
    }

    this.drawButton();
  }

  private drawButton(): void {
    const disc = this.add.graphics();
    disc.fillStyle(BUTTON_COLOR, 1);
    disc.fillCircle(BUTTON_X, BUTTON_Y, BUTTON_RADIUS);
    disc.lineStyle(STROKE_WIDTH, OUTLINE_COLOR, 1);
    disc.strokeCircle(BUTTON_X, BUTTON_Y, BUTTON_RADIUS);

    // The arrow: an open arc with a chevron at its leading end, so the circle
    // reads as motion rather than as a ring.
    const arrow = this.add.graphics();
    arrow.lineStyle(STROKE_WIDTH, OUTLINE_COLOR, 1);
    arrow.beginPath();
    arrow.arc(BUTTON_X, BUTTON_Y, ARROW_RADIUS, ARC_START, ARC_END);
    arrow.strokePath();

    const tipX = BUTTON_X + ARROW_RADIUS * Math.cos(ARC_END);
    const tipY = BUTTON_Y + ARROW_RADIUS * Math.sin(ARC_END);
    const back = ARC_END + Math.PI / 2 + Math.PI;
    for (const spread of [-ARROW_SPREAD, ARROW_SPREAD]) {
      arrow.lineBetween(
        tipX,
        tipY,
        tipX + ARROW_LENGTH * Math.cos(back + spread),
        tipY + ARROW_LENGTH * Math.sin(back + spread),
      );
    }

    // The only interactive object on the screen: a transparent disc over the
    // art, hit-tested as a circle so a tap in the corner of its box misses.
    const hit = this.add.circle(BUTTON_X, BUTTON_Y, HIT_RADIUS, BUTTON_COLOR, 0);
    hit.setInteractive(new Phaser.Geom.Circle(0, 0, HIT_RADIUS), Phaser.Geom.Circle.Contains);
    // The same one-shot guard the pre-canvas path uses, so a child mashing the
    // button reloads the page at most once.
    hit.on("pointerdown", () => reloadOnce());
  }
}
