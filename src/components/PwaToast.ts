import Phaser from "phaser";
import { isReducedMotion, motionDuration } from "../utils/motion";

const PANEL_COLOR = 0xfff8e7;
const OUTLINE_COLOR = 0x2d3748;
const TEXT_COLOR = "#2d3748";
const PRIMARY_BUTTON_COLOR = "#2b6cb0";
const SECONDARY_BUTTON_COLOR = "#a0aec0";
const TOAST_WIDTH = 520;
const TOAST_HEIGHT = 150;
const BUTTON_WIDTH = 200;
const BUTTON_HEIGHT = 72;

export type ToastKind = "update" | "offline";

export interface PwaToastOptions {
  kind: ToastKind;
  onUpdate?: () => void;
  onDismiss?: () => void;
}

/**
 * App-styled toast shown at the top of the Hub for PWA lifecycle events.
 *
 * - `update`: "New version ready!" with an "Update now" action and a "Later"
 *   dismiss action.
 * - `offline`: "Ready to play offline!" with a single OK dismiss action.
 *
 * Parent-facing text (the app itself stays textless for kids). All buttons
 * use inflated hit areas meeting the 64px touch-target minimum, and entrance
 * is alpha-only under reduced motion.
 */
export class PwaToast {
  private readonly scene: Phaser.Scene;
  private readonly objects: Phaser.GameObjects.GameObject[] = [];

  constructor(scene: Phaser.Scene, options: PwaToastOptions) {
    this.scene = scene;
    const { width } = scene.cameras.main;
    const centerX = width / 2;
    const y = 100;

    const panel = scene.add
      .rectangle(centerX, y, TOAST_WIDTH, TOAST_HEIGHT, PANEL_COLOR)
      .setStrokeStyle(4, OUTLINE_COLOR);
    this.objects.push(panel);

    const title = scene.add
      .text(
        centerX,
        y - 35,
        options.kind === "update" ? "New version ready!" : "Ready to play offline!",
        {
          color: TEXT_COLOR,
          fontSize: "26px",
        },
      )
      .setOrigin(0.5);
    this.objects.push(title);

    if (options.kind === "update") {
      this.createButton(
        centerX - 110,
        y + 40,
        "Update now",
        PRIMARY_BUTTON_COLOR,
        options.onUpdate,
      );
      this.createButton(centerX + 110, y + 40, "Later", SECONDARY_BUTTON_COLOR, options.onDismiss);
    } else {
      this.createButton(centerX, y + 40, "OK", PRIMARY_BUTTON_COLOR, options.onDismiss);
    }

    this.animateEntrance([panel, title]);
  }

  /** Destroys the toast and all of its display objects. */
  destroy(): void {
    for (const object of this.objects) object.destroy();
  }

  /** Creates one inflated, touch-friendly toast button. */
  private createButton(
    x: number,
    y: number,
    label: string,
    color: string,
    onTap?: () => void,
  ): Phaser.GameObjects.Text {
    const button = this.scene.add
      .text(x, y, label, {
        color,
        fontSize: "24px",
      })
      .setOrigin(0.5);
    button.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(
        -BUTTON_WIDTH / 2,
        -BUTTON_HEIGHT / 2,
        BUTTON_WIDTH,
        BUTTON_HEIGHT,
      ),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
    });
    button.on("pointerdown", () => onTap?.());
    this.objects.push(button);
    this.animateEntrance([button]);
    return button;
  }

  /** Fades the given objects in; scales in too unless reduced motion is set. */
  private animateEntrance(targets: Phaser.GameObjects.GameObject[]): void {
    for (const target of targets) {
      const tweenable = target as Phaser.GameObjects.GameObject & {
        setAlpha: (alpha: number) => unknown;
        setScale: (scale: number) => unknown;
      };
      tweenable.setAlpha(0);
      if (!isReducedMotion()) {
        tweenable.setScale(0);
      }
    }
    const config: Phaser.Types.Tweens.TweenBuilderConfig = {
      targets,
      alpha: 1,
      duration: motionDuration(300, 200),
      ease: "Sine.out",
    };
    if (!isReducedMotion()) {
      config.scaleX = 1;
      config.scaleY = 1;
    }
    this.scene.tweens.add(config);
  }
}
