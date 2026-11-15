import type Phaser from "phaser";
import { textStyle } from "../../utils/typography";
import type { HubGrid } from "../hubGrid";
import { HUB_SELECTIONS, type HubSelection, selectionGlyphKey, selectionLabel } from "../hubGroups";
import {
  CHIP_GLYPH_DISPLAY,
  CHIP_GLYPH_Y,
  CHIP_HEIGHT,
  CHIP_LABEL_FONT_SIZE,
  CHIP_LABEL_Y,
  CHIP_ROW_CENTER_Y,
  CHIP_WIDTH,
  chipCenter,
} from "./groupLayout";

/**
 * The Hub's group-chip row (spec FR-2, D2, D7, D8).
 *
 * Six chips — All plus the five groups — live in the band between the avatar
 * chip and Settings. Each is a rectangle with a glyph above a one-word label: the
 * glyph is the storybook group art when the shell has it, and the same drawn 2x2
 * grid All uses when it does not, so a chip can never render Phaser's
 * missing-texture box on the Hub.
 *
 * The row is created once per grid lifetime and repainted on every selection
 * change — fills only, no tween (NFR-4) — so a tap costs a handful of styles and
 * a rebuild of the tiles, never a rebuild of the chips.
 *
 * The tap target is a Zone, not the visible rectangle: a chip is a filter, not a
 * game tile, and the Hub's own suites (and the e2e bridge) recognise a tappable
 * board by "a rectangle with a pointerup handler". A zone keeps that true.
 */

/** The shared flat storybook outline ink. */
const INK = 0x2d3748;
/** Stroke width of an unselected chip (px). */
const CHIP_STROKE = 3;
/** Stroke width of the selected chip (px). */
const CHIP_STROKE_SELECTED = 5;
/** Fill of an unselected chip: the cream the Hub already uses as its ground. */
const CHIP_FILL = 0xfff8e7;
/** Fill of the selected chip: the shared tile blue. */
const CHIP_FILL_SELECTED = 0x2b6cb0;
/** Side of one square in the drawn 2x2 glyph (px). */
const GLYPH_SQUARE = 12;
/** Centre offset of each square in the drawn 2x2 glyph (px). */
const GLYPH_SQUARE_OFFSET = 10;

/** One chip's objects, its live centre and the repaint rule that keeps them in step. */
export interface ChipView {
  readonly selection: HubSelection;
  /** Canvas centre of the chip's plate and hit zone. */
  readonly x: number;
  readonly y: number;
  readonly objects: Phaser.GameObjects.GameObject[];
  paint(selected: boolean): void;
}

/**
 * Draws the All chip's 2x2 grid — four small squares — and serves as the
 * fallback for a group chip whose texture is not in the shell. Rectangles rather
 * than a Graphics object, so a chip adds no drawing surface the Hub's slot and
 * indicator suites would have to learn to skip.
 */
function createDrawnGlyph(
  scene: Phaser.Scene,
  x: number,
  y: number,
  selected: boolean,
): Phaser.GameObjects.Rectangle[] {
  const squares: Phaser.GameObjects.Rectangle[] = [];
  for (const dx of [-GLYPH_SQUARE_OFFSET, GLYPH_SQUARE_OFFSET]) {
    for (const dy of [-GLYPH_SQUARE_OFFSET, GLYPH_SQUARE_OFFSET]) {
      squares.push(
        scene.add.rectangle(x + dx, y + dy, GLYPH_SQUARE, GLYPH_SQUARE, selected ? 0xffffff : INK),
      );
    }
  }
  return squares;
}

/** Creates the whole chip row for the grid, painted to its current selection. */
export function createGroupChips(grid: HubGrid): void {
  const scene = grid.deps.scene;
  HUB_SELECTIONS.forEach((selection, index) => {
    const { x, y } = chipCenter(index, scene.cameras.main.width);
    const selected = selection === grid.selection;

    const rect = scene.add.rectangle(x, y, CHIP_WIDTH, CHIP_HEIGHT, CHIP_FILL);
    rect.setStrokeStyle(CHIP_STROKE, INK);
    const objects: Phaser.GameObjects.GameObject[] = [rect];

    const glyphKey = selectionGlyphKey(selection);
    let image: Phaser.GameObjects.Image | undefined;
    let squares: Phaser.GameObjects.Rectangle[] = [];
    if (glyphKey !== null && scene.textures.exists(glyphKey)) {
      image = scene.add.image(x, y + (CHIP_GLYPH_Y - CHIP_ROW_CENTER_Y), glyphKey);
      image.setDisplaySize(CHIP_GLYPH_DISPLAY, CHIP_GLYPH_DISPLAY);
      objects.push(image);
    } else {
      squares = createDrawnGlyph(scene, x, CHIP_GLYPH_Y, selected);
      objects.push(...squares);
    }

    const label = scene.add.text(
      x,
      CHIP_LABEL_Y,
      selectionLabel(selection),
      textStyle({
        fontSize: `${CHIP_LABEL_FONT_SIZE}px`,
        color: selected ? "#ffffff" : "#2d3748",
      }),
    );
    label.setOrigin(0.5);
    objects.push(label);

    const paint = (isSelected: boolean): void => {
      rect.setFillStyle(isSelected ? CHIP_FILL_SELECTED : CHIP_FILL, 1);
      rect.setStrokeStyle(
        isSelected ? CHIP_STROKE_SELECTED : CHIP_STROKE,
        isSelected ? 0xffffff : INK,
      );
      label.setColor(isSelected ? "#ffffff" : "#2d3748");
      image?.setAlpha(isSelected ? 1 : 0.9);
      for (const square of squares) {
        square.setFillStyle(isSelected ? 0xffffff : INK, 1);
      }
    };

    // One code path owns the chip's look, so the first paint and every later
    // repaint cannot drift apart.
    paint(selected);

    // Release-to-select, like a game tile. The hit target is its own object, so
    // a tap test can address the chip without confusing it for a nav tile.
    const zone = scene.add.zone(x, y, CHIP_WIDTH, CHIP_HEIGHT);
    zone.setInteractive();
    zone.on("pointerup", () => grid.setGroup(selection));
    objects.push(zone);

    grid.chips.push(...objects);
    grid.chipViews.push({ selection, x, y, objects, paint });
  });
}

/** Repaints every chip to match `grid.selection`. */
export function paintGroupChips(grid: HubGrid): void {
  for (const chip of grid.chipViews) {
    chip.paint(chip.selection === grid.selection);
  }
}

/** Destroys the whole chip row (grid shutdown) and forgets its views. */
export function destroyGroupChips(grid: HubGrid): void {
  for (const obj of grid.chips) obj.destroy();
  grid.chips = [];
  grid.chipViews = [];
}
