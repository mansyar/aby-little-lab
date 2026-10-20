import type Phaser from "phaser";
import { textureSizeFor } from "../../utils/textureTiers";

/**
 * Keys already reported this session.
 *
 * A round often draws the same missing art many times (one card, its shadow,
 * its prompt), so the warning is per key, not per call: one console line tells
 * the maintainer which SVG is absent without drowning the log.
 */
const warnedKeys = new Set<string>();

const BACKGROUND_COLOR = "#FFFFFF";
const OUTLINE_COLOR = "#2D3748";

/** Stroke width at the texture's own raster size — the product's 4–6 px band. */
const OUTLINE_WIDTH = 6;

/**
 * Guarantees a drawable texture for `key`.
 *
 * Returns `true` when the TextureManager already holds the texture. Otherwise it
 * warns once for that key and generates a neutral white tile with the product
 * outline at `textureSizeFor(key)`, so the round can still render and be
 * completed. It never throws and never blocks; `false` means only that the
 * texture manager refused to make a canvas, in which case Phaser's own
 * missing-texture frame stands in.
 *
 * The canvas texture is not a temporary: it *is* the placeholder, so nothing is
 * generated and thrown away.
 */
export function ensureArtTexture(scene: Phaser.Scene, key: string): boolean {
  if (scene.textures.exists(key)) {
    return true;
  }

  warnOnce(key);
  return drawPlaceholder(scene, key);
}

function warnOnce(key: string): void {
  if (warnedKeys.has(key)) {
    return;
  }
  warnedKeys.add(key);
  console.warn(
    `[art] missing asset for texture "${key}": no art group registered it, so a neutral placeholder was generated and the round continues.`,
  );
}

function drawPlaceholder(scene: Phaser.Scene, key: string): boolean {
  const size = textureSizeFor(key);
  const texture = scene.textures.createCanvas(key, size, size);
  if (texture === null) {
    return false;
  }

  const context = texture.context;
  context.fillStyle = BACKGROUND_COLOR;
  context.fillRect(0, 0, size, size);
  context.strokeStyle = OUTLINE_COLOR;
  context.lineWidth = OUTLINE_WIDTH;
  // Drawing the stroke centred on the inset edge keeps the ring visually
  // centred inside the tile instead of clipping half of it.
  const inset = OUTLINE_WIDTH / 2;
  context.strokeRect(inset, inset, size - OUTLINE_WIDTH, size - OUTLINE_WIDTH);
  texture.refresh();

  return true;
}
