import { createCornerMascot } from "../../components/Mascot";

/** Number of background decorations. */
export const DECORATION_COUNT = 4;
/** Radius of background decoration dots (px). */
export const DECORATION_RADIUS = 10;
/** Low-contrast color for background decorations. */
export const DECORATION_COLOR = 0xe8e0d0;
/** Vertical drift distance for decorations (px). */
export const DECORATION_DRIFT = 16;
/** Slowest decoration drift loop (ms). */
export const DECORATION_DRIFT_MIN = 4000;
/** Fastest decoration drift loop (ms). */
export const DECORATION_DRIFT_MAX = 6000;
/** Idle time without input before the attract cue starts (ms). */
export const IDLE_ATTRACT_DELAY = 25000;
/** Interval between idle calls while attract is active (ms). */
export const IDLE_CALL_INTERVAL = 10000;
/** Wiggle amplitude for the attract cue (degrees). */
export const WIGGLE_ANGLE = 4;
/** Duration of one wiggle swing (ms). */
export const WIGGLE_DURATION = 350;
/** Phase offset between tile wiggles (ms). */
export const WIGGLE_PHASE_OFFSET = 120;
/** How many tiles wiggle during an attract cue (rotating pick). */
export const ATTRACT_WIGGLE_COUNT = 2;

/** Structural subset of `Mascot` the attract flow touches. */
export interface HubAttractMascot {
  flapGreeting(): void;
  cheer(): void;
  idleLoop(): void;
  wave(): void;
  destroy(): void;
}

/** Pending idle-attract timer handle. */
export interface HubAttractTimer {
  remove(): void;
}

/**
 * Engine handles the HubScene owns and passes in. The controller owns the
 * mascot, the idle timer, and the decorations; the scene owns the grid
 * targets, the audio, and the motion gate.
 */
export interface HubAttractDeps {
  /** Scene the mascot and decorations draw into. */
  readonly scene: Phaser.Scene;
  /** Tiles eligible for the wiggle cue, in rotation order. */
  getAttractTargets(): readonly Phaser.GameObjects.Rectangle[];
  /** Plays the idle call (greeting prompt). */
  playIdleCall(): void;
  /** True while reduced motion suppresses the wiggle cue. */
  isReducedMotion(): boolean;
  /** Mascot factory; defaults to the corner placement. */
  createMascot?(scene: Phaser.Scene): HubAttractMascot;
}

/**
 * Idle attract and decor: Professor Hoot, the repeating idle call, the tile
 * wiggle cue, and the drifting background dots. The HubScene keeps only
 * delegation plus the `create()`/`shutdown` lifecycle wiring.
 */
export interface HubAttractController {
  /** Clears the attract-active flag for a new visit. */
  resetForVisit(): void;
  /** Places the mascot: greets, cheers on a new sticker, then idles. */
  createMascot(justEarned?: string): void;
  /** Schedules the next idle-attract check after the given delay. */
  scheduleIdleAttract(delay?: number): void;
  /** Re-arms the idle timer after any pointer input. */
  resetIdleAttract(): void;
  /** Plays the idle call and starts the wiggle cue once. */
  triggerIdleAttract(): void;
  /** Creates low-contrast dots that drift slowly behind the grid. */
  createDecorations(): void;
  /** Waves the mascot, if one is placed (play-time cap fanfare). */
  waveMascot(): void;
  /** Drops the timer and destroys the mascot for the shutdown hook. */
  destroy(): void;
}

/**
 * Creates the attract controller. All logic is a verbatim move of the
 * HubScene slice: no timing, copy, or motion tweaks, and the reduced-motion
 * guards stay exactly where they were.
 */
export function createHubAttract(deps: HubAttractDeps): HubAttractController {
  const { scene } = deps;
  const createMascotFn: (scene: Phaser.Scene) => HubAttractMascot =
    deps.createMascot ?? createCornerMascot;
  let idleCallTimer: HubAttractTimer | undefined;
  let idleAttractActive = false;
  let attractWiggleTick = 0;
  let mascot: HubAttractMascot | undefined;

  /** Schedules the next idle-attract check after the given delay. */
  function scheduleIdleAttract(delay = IDLE_ATTRACT_DELAY): void {
    idleCallTimer = scene.time.delayedCall(delay, () => {
      triggerIdleAttract();
    }) as unknown as HubAttractTimer;
  }

  /**
   * Plays the idle call; starts the tile wiggle cue once (skipped under
   * reduced motion); re-arms itself so the call repeats every
   * IDLE_CALL_INTERVAL.
   */
  function triggerIdleAttract(): void {
    if (!idleCallTimer) return;
    deps.playIdleCall();
    if (!idleAttractActive) {
      idleAttractActive = true;
      const targets = deps.getAttractTargets();
      if (!deps.isReducedMotion() && targets.length > 0) {
        // Wiggle only a couple of tiles so the cue stays gentle; rotate the
        // pick across the grid on each attract so no tile feels ignored.
        const start = attractWiggleTick % targets.length;
        for (let i = 0; i < ATTRACT_WIGGLE_COUNT; i++) {
          const tile = targets[(start + i) % targets.length];
          scene.tweens.add({
            targets: tile,
            angle: WIGGLE_ANGLE,
            duration: WIGGLE_DURATION,
            yoyo: true,
            repeat: -1,
            ease: "Sine.inOut",
            delay: i * WIGGLE_PHASE_OFFSET,
          });
        }
        attractWiggleTick += 1;
      }
    }
    scheduleIdleAttract(IDLE_CALL_INTERVAL);
  }

  return {
    resetForVisit: () => {
      idleAttractActive = false;
    },
    createMascot: (justEarned) => {
      mascot = createMascotFn(scene);
      mascot.flapGreeting();
      if (justEarned) {
        mascot.cheer();
      }
      mascot.idleLoop();
    },
    scheduleIdleAttract,
    resetIdleAttract: () => {
      idleCallTimer?.remove();
      scheduleIdleAttract();
    },
    triggerIdleAttract,
    createDecorations: () => {
      const driftRange = DECORATION_DRIFT_MAX - DECORATION_DRIFT_MIN;
      const positions: ReadonlyArray<[number, number]> = [
        [scene.cameras.main.width * 0.12, scene.cameras.main.height * 0.18],
        [scene.cameras.main.width * 0.88, scene.cameras.main.height * 0.15],
        [scene.cameras.main.width * 0.1, scene.cameras.main.height * 0.8],
        [scene.cameras.main.width * 0.9, scene.cameras.main.height * 0.75],
      ];

      for (let i = 0; i < DECORATION_COUNT; i++) {
        const [x, y] = positions[i];
        const dot = scene.add.circle(x, y, DECORATION_RADIUS, DECORATION_COLOR);
        dot.setDepth(-1);
        scene.tweens.add({
          targets: dot,
          y: y - DECORATION_DRIFT,
          duration: DECORATION_DRIFT_MIN + (i * driftRange) / (DECORATION_COUNT - 1),
          yoyo: true,
          repeat: -1,
          ease: "Sine.inOut",
          delay: i * 300,
        });
      }
    },
    waveMascot: () => {
      mascot?.wave();
    },
    destroy: () => {
      idleCallTimer?.remove();
      idleCallTimer = undefined;
      mascot?.destroy();
      mascot = undefined;
    },
  };
}
