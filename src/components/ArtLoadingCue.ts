import type Phaser from "phaser";
import { isReducedMotion } from "../utils/motion";
import { TEXTURE_SIZES } from "../utils/textureTiers";
import { MASCOT_SCALE } from "./Mascot";

/**
 * A textless "we are getting the pieces ready" cue for a pending art load.
 *
 * Professor Hoot sits still while three small dots pulse in sequence beneath
 * him. Nothing here speaks, nothing here is tappable, and nothing here waits on
 * the network: the cue exists only so a cold first tap does not look frozen
 * while a game's art chunk rasterizes.
 */
export interface ArtLoadingCue {
  /** Reveals Hoot and the dots and starts their motion. Idempotent. */
  show(): void;
  /** Hides everything and stops the cue's own tweens. Safe at any time. */
  clear(): void;
  /** `clear()`, then removes the objects and unhooks the scene listener. */
  destroy(): void;
}

/** The shell mascot pose the cue draws. Not a game group: the shell ships it. */
const MASCOT_TEXTURE = "mascot_idle";

/**
 * Depth of every object the cue creates.
 *
 * Scene content sits at the default depth (0), and the transient chrome
 * overlays — `ProfileChip`'s picker and `PlayTimeIndicator`'s nudge — sit at
 * 20–21. Ten is therefore above the round the cue is covering while every
 * overlay stays on top of it; `ParentLock`'s hold ring is at 10000 and is never
 * behind the cue. The protected controls (`← Back` and the replay glyph) keep
 * the default depth and are kept clear by position instead: the cue is centred
 * and low, while those controls live in the top corners.
 */
const CUE_DEPTH = 10;

/** Dot fill is the soft-vibrant `--primary`; the ring is the `--outline` token. */
const DOT_FILL = 0x2b6cb0;
const DOT_OUTLINE = 0x2d3748;
const DOT_OUTLINE_WIDTH = 2;

const DOT_COUNT = 3;
const DOT_RADIUS = 7;
const DOT_SPACING = 26;

/** Gap between the mascot's bottom edge and the dot row. */
const DOT_MARGIN = 22;

/**
 * Vertical anchor, as a fraction of camera height below the camera centre.
 *
 * 0.3 of a 768 px stage puts the cue around y 614 — clear of the progress dots
 * (y 60) and the shared instruction line (y 112), and above the bottom edge.
 */
const CUE_Y_RATIO = 0.3;

const DOT_ALPHA_LOW = 0.35;
const DOT_SCALE_HIGH = 1.15;
const DOT_PULSE_DURATION = 420;
const DOT_PULSE_STAGGER = 140;

/** Reduced motion keeps the dots visible with one static alpha, never a pulse. */
const DOT_REDUCED_ALPHA = 0.55;

/**
 * True when the TextureManager holds `key`.
 *
 * `mascot_idle` is a shell texture, but a scene may create the cue while
 * `preload` is still rasterizing it, and scene-test doubles do not model the
 * TextureManager at all. A missing pose is not an error — the caller degrades
 * to dots only.
 */
function texturePresent(scene: Phaser.Scene, key: string): boolean {
  const manager: Phaser.Textures.TextureManager | undefined = scene.textures;
  return manager?.exists(key) ?? false;
}

/** Creates one cue bound to `scene`, cleared automatically on scene shutdown. */
export function createArtLoadingCue(scene: Phaser.Scene): ArtLoadingCue {
  const reduced = isReducedMotion();
  const mascotHalfHeight = (TEXTURE_SIZES.hero * MASCOT_SCALE) / 2;

  let mascot: Phaser.GameObjects.Image | null = null;
  let dots: Phaser.GameObjects.Arc[] = [];
  let pulseTweens: Phaser.Tweens.Tween[] = [];
  let built = false;
  let shown = false;
  let destroyed = false;

  function stopPulse(): void {
    for (const tween of pulseTweens) {
      tween.remove();
    }
    pulseTweens = [];
  }

  /** Creates the objects once, at the camera's runtime centre. */
  function build(): void {
    const camera = scene.cameras.main;
    const x = camera.centerX;
    const y = camera.centerY + camera.height * CUE_Y_RATIO;

    if (texturePresent(scene, MASCOT_TEXTURE)) {
      mascot = scene.add.image(x, y, MASCOT_TEXTURE);
      mascot.setScale(MASCOT_SCALE);
      mascot.setDepth(CUE_DEPTH);
      mascot.setVisible(false);
    }

    const dotY = mascot === null ? y : y + mascotHalfHeight + DOT_MARGIN;
    dots = [];
    for (let index = 0; index < DOT_COUNT; index += 1) {
      const offset = (index - (DOT_COUNT - 1) / 2) * DOT_SPACING;
      const dot = scene.add.circle(x + offset, dotY, DOT_RADIUS, DOT_FILL);
      dot.setStrokeStyle(DOT_OUTLINE_WIDTH, DOT_OUTLINE);
      dot.setDepth(CUE_DEPTH);
      dot.setVisible(false);
      // Never `setInteractive`: a preschooler taps wildly during a load, and a
      // cue that swallowed those taps would eat the first round's answer.
      dots.push(dot);
    }

    built = true;
  }

  function show(): void {
    if (destroyed || shown) return;
    shown = true;

    if (!built) {
      build();
    }

    mascot?.setVisible(true);

    for (const [index, dot] of dots.entries()) {
      dot.setVisible(true);
      dot.setScale(1);
      dot.setAlpha(reduced ? DOT_REDUCED_ALPHA : DOT_ALPHA_LOW);
      if (reduced) continue;

      pulseTweens.push(
        scene.tweens.add({
          targets: dot,
          alpha: { from: DOT_ALPHA_LOW, to: 1 },
          scale: DOT_SCALE_HIGH,
          duration: DOT_PULSE_DURATION,
          delay: index * DOT_PULSE_STAGGER,
          yoyo: true,
          repeat: -1,
          ease: "Sine.inOut",
        }),
      );
    }
  }

  function clear(): void {
    if (destroyed) return;
    shown = false;
    stopPulse();

    mascot?.setVisible(false);
    for (const dot of dots) {
      dot.setVisible(false);
      dot.setAlpha(DOT_ALPHA_LOW);
      dot.setScale(1);
    }
  }

  function destroy(): void {
    if (destroyed) return;
    clear();
    destroyed = true;
    scene.events.off("shutdown", destroy);

    mascot?.destroy();
    mascot = null;
    for (const dot of dots) {
      dot.destroy();
    }
    dots = [];
  }

  scene.events.once("shutdown", destroy);

  return { show, clear, destroy };
}
