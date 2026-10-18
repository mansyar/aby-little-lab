import Phaser from "phaser";
import { PROFILE_AVATAR_TEXTURES } from "../../game/profileLogic";
import { attachPressFeedback } from "../../utils/pressFeedback";
import { textureSizeFor } from "../../utils/textureTiers";
import { textStyle } from "../../utils/typography";

/** Flat color palette shared by the settings panel and its overlays. */
export const BACKDROP_COLOR = 0x000000;
export const BACKDROP_ALPHA = 0.6;
export const OVERLAY_ALPHA = 0.75;
export const PANEL_COLOR = 0xfff8e7;
export const OUTLINE_COLOR = 0x2d3748;
export const ENABLED_COLOR = "#68d391";
export const DISABLED_COLOR = "#a0aec0";
export const PRIMARY_COLOR = "#2b6cb0";
export const DANGER_COLOR = "#fc8181";
export const PANEL_WIDTH = 480;
export const PANEL_HEIGHT = 760;
export const TOGGLE_WIDTH = 240;
export const TOGGLE_HEIGHT = 96;
export const ROW_HEIGHT = 64;
/** Avatar textures are rasterized at this size (matches PreloadScene). */
export const AVATAR_TEXTURE_SIZE = textureSizeFor(PROFILE_AVATAR_TEXTURES.cat);
/** Background card behind each main-panel settings row. */
export const ROW_CARD_WIDTH = 400;
export const ROW_CARD_HEIGHT = 68;
/** Slightly deeper cream than the panel so rows read as tappable. */
export const ROW_CARD_COLOR = 0xf6efdd;
/** Toggle switch presentation: a track plus a knob whose side encodes state. */
export const TOGGLE_TRACK_WIDTH = 64;
export const TOGGLE_TRACK_HEIGHT = 32;
export const TOGGLE_KNOB_SIZE = 24;
/** Knob center offset from the track center when on/off. */
export const TOGGLE_KNOB_OFFSET = 16;
export const TOGGLE_TRACK_ON_COLOR = 0x68d391;
export const TOGGLE_TRACK_OFF_COLOR = 0xa0aec0;
export const TOGGLE_KNOB_COLOR = 0xfff8e7;
/** Emphasized confirm-button card in modals (destructive or primary). */
export const MODAL_BUTTON_WIDTH = 240;
export const MODAL_BUTTON_HEIGHT = 64;
/** Numeric twins of the CSS danger/primary colors for shape strokes. */
export const DANGER_HEX = 0xfc8181;
export const PRIMARY_HEX = 0x2b6cb0;

/** Draw list every overlay's display objects land in (destroyed together). */
export type ObjectBucket = Phaser.GameObjects.GameObject[];

/** Draws the flat background card behind one settings row. */
export function addRowCard(scene: Phaser.Scene, x: number, y: number, bucket: ObjectBucket): void {
  const card = scene.add.rectangle(x, y, ROW_CARD_WIDTH, ROW_CARD_HEIGHT, ROW_CARD_COLOR);
  card.setStrokeStyle(2, OUTLINE_COLOR, 1);
  bucket.push(card);
}

/**
 * Creates a standard settings row: the background card plus a centered,
 * inflated-tap-target label that fires `onClick` on pointerdown.
 */
export function createRow(
  scene: Phaser.Scene,
  x: number,
  y: number,
  bucket: ObjectBucket,
  label: string,
  color: string,
  onClick: () => void,
): Phaser.GameObjects.Text {
  addRowCard(scene, x, y, bucket);
  const row = scene.add.text(x, y, label, textStyle({ color, fontSize: "32px" })).setOrigin(0.5);
  row.setInteractive({
    hitArea: new Phaser.Geom.Rectangle(
      -TOGGLE_WIDTH / 2,
      -ROW_HEIGHT / 2,
      TOGGLE_WIDTH,
      ROW_HEIGHT,
    ),
    hitAreaCallback: Phaser.Geom.Rectangle.Contains,
  });
  row.on("pointerdown", onClick);
  attachPressFeedback(row);
  bucket.push(row);
  return row;
}

/**
 * Creates a tappable modal button with an inflated touch target. Destructive
 * or primary confirmations get an emphasized stroked card behind the label so
 * they are visually distinct from plain dismiss buttons; everything lands in
 * the caller's cleanup bucket.
 */
export function createModalButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  defaultBucket: ObjectBucket,
  label: string,
  color: string,
  onClick: () => void,
  options?: { emphasized?: boolean; bucket?: ObjectBucket },
): Phaser.GameObjects.Text {
  const bucket = options?.bucket ?? defaultBucket;
  if (options?.emphasized) {
    const card = scene.add.rectangle(x, y, MODAL_BUTTON_WIDTH, MODAL_BUTTON_HEIGHT, PANEL_COLOR);
    card.setStrokeStyle(3, color === DANGER_COLOR ? DANGER_HEX : PRIMARY_HEX, 1);
    bucket.push(card);
  }
  const button = scene.add.text(x, y, label, textStyle({ color, fontSize: "30px" })).setOrigin(0.5);
  button.setInteractive({
    hitArea: new Phaser.Geom.Rectangle(
      -TOGGLE_WIDTH / 2,
      -ROW_HEIGHT / 2,
      TOGGLE_WIDTH,
      ROW_HEIGHT,
    ),
    hitAreaCallback: Phaser.Geom.Rectangle.Contains,
  });
  button.on("pointerdown", onClick);
  attachPressFeedback(button);
  return button;
}
