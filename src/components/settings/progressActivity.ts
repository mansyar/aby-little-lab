import type Phaser from "phaser";
import type { DayActivity } from "../../types";
import { textStyle } from "../../utils/typography";
import type { ObjectBucket } from "./primitives";

/**
 * The Overview's 7-day activity strip, split out of `ProgressOverlay.ts` to
 * keep that module under the strict size budget. Pure drawing into the shared
 * overlay bucket; the overlay re-exports the constants so no caller's import
 * path or rendered geometry changes.
 */

/** Center-relative Y of the 7-day activity strip label. */
export const PROGRESS_STRIP_LABEL_Y = 230;
/** Center-relative Y of the 7-day activity bars. */
export const PROGRESS_STRIP_Y = 265;
/** Width of one activity bar. */
export const PROGRESS_BAR_WIDTH = 24;
/** Number of day bars in the 7-day activity strip. */
export const PROGRESS_BAR_COUNT = 7;
/** Height of the tallest activity bar. */
export const PROGRESS_BAR_HEIGHT = 36;
/** Horizontal gap between activity bars. */
export const PROGRESS_BAR_GAP = 6;
/** Fill color for the per-game accuracy bar and the activity bars. */
export const ACCURACY_FILL_COLOR = 0x68d391;

/** The shared view state the strip draws into. */
export interface ActivityStripView {
  scene: Phaser.Scene;
  overlayObjects: ObjectBucket;
}

/** Draws the "Last 7 days" label and its seven day bars. */
export function drawActivityStrip(
  view: ActivityStripView,
  centerX: number,
  centerY: number,
  activity: DayActivity[],
): void {
  const { scene, overlayObjects } = view;
  const totalPlays = activity.reduce((sum, entry) => sum + entry.plays, 0);
  overlayObjects.push(
    scene.add
      .text(
        centerX,
        centerY + PROGRESS_STRIP_LABEL_Y,
        `Last 7 days · ${totalPlays} plays`,
        textStyle({
          color: "#2d3748",
          fontSize: "30px",
        }),
      )
      .setOrigin(0.5),
  );
  const maxPlays = Math.max(1, ...activity.map((entry) => entry.plays));
  const startX = centerX - ((PROGRESS_BAR_COUNT - 1) * (PROGRESS_BAR_WIDTH + PROGRESS_BAR_GAP)) / 2;
  for (let i = 0; i < PROGRESS_BAR_COUNT; i += 1) {
    const entry = activity[i];
    const plays = entry?.plays ?? 0;
    const barHeight =
      plays === 0 ? 4 : Math.max(10, Math.round((PROGRESS_BAR_HEIGHT * plays) / maxPlays));
    overlayObjects.push(
      scene.add.rectangle(
        startX + i * (PROGRESS_BAR_WIDTH + PROGRESS_BAR_GAP),
        centerY + PROGRESS_STRIP_Y,
        PROGRESS_BAR_WIDTH,
        barHeight,
        ACCURACY_FILL_COLOR,
      ),
    );
  }
}
