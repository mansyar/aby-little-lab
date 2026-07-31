import type Phaser from "phaser";
import { isReducedMotion, motionDuration } from "./motion";

/** App background color (`--bg-base`) used as the transition fade color. */
const FADE_COLOR = 0xfaf9f6;
const FADE_RED = (FADE_COLOR >> 16) & 0xff;
const FADE_GREEN = (FADE_COLOR >> 8) & 0xff;
const FADE_BLUE = FADE_COLOR & 0xff;

const STANDARD_FADE_DURATION = 300;
const REDUCED_FADE_DURATION = 180;

/** Subtle zoom applied to the incoming scene during entrance (reduced-motion: none). */
const ENTRANCE_ZOOM = 1.02;

/**
 * Fades the current scene out through the app background color, then starts
 * the target scene. Scene data is forwarded to the target scene.
 */
export function transitionToScene(scene: Phaser.Scene, targetKey: string, data?: object): void {
  const duration = motionDuration(STANDARD_FADE_DURATION, REDUCED_FADE_DURATION);
  scene.cameras.main.fadeOut(duration, FADE_RED, FADE_GREEN, FADE_BLUE, () => {
    if (data === undefined) {
      scene.scene.start(targetKey);
    } else {
      scene.scene.start(targetKey, data);
    }
  });
}

/**
 * Called at the start of a scene's `create()`: fades the scene in from the
 * transition color with a subtle zoom-out. Under reduced motion the scene
 * only fades in (no zoom).
 */
export function sceneEntrance(scene: Phaser.Scene): void {
  const duration = motionDuration(STANDARD_FADE_DURATION, REDUCED_FADE_DURATION);
  scene.cameras.main.fadeIn(duration, FADE_RED, FADE_GREEN, FADE_BLUE);
  if (!isReducedMotion()) {
    scene.cameras.main.setZoom(ENTRANCE_ZOOM);
    scene.cameras.main.zoomTo(1, duration, "Sine.out");
  }
}
