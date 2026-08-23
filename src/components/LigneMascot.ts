import type Phaser from "phaser";

export interface LignePlayerPort {
  fireTrigger(id: string): void;
  advance(dtSeconds: number): void;
  render(): void;
  dispose(): void;
}

export interface LigneDisplayPort {
  destroy(): void;
}

export interface LigneMascotPlacement {
  x: number;
  y: number;
  scale: number;
  depth: number;
}

interface LigneMascotOptions {
  player: LignePlayerPort;
  canvas: HTMLCanvasElement;
  display: LigneDisplayPort;
  requestFrame?: (callback: FrameRequestCallback) => number;
  cancelFrame?: (handle: number) => void;
}

interface TweenFallbackPort {
  setVisible(visible: boolean): void;
}

interface ActivateLigneMascotOptions {
  fallback: TweenFallbackPort;
  placement: LigneMascotPlacement;
  load: (placement: LigneMascotPlacement) => Promise<LigneMascot>;
  timeoutMs: number;
  reducedMotion: boolean;
}

export type LigneMascotLoader = (placement: LigneMascotPlacement) => Promise<LigneMascot>;

const ARTBOARD_SIZE = 512;

async function resolveHootAssetUrl(): Promise<string> {
  if (import.meta.env.DEV) return "/hoot.ligne";
  return (await import("../assets/ligne/hoot.ligne")).default;
}

/** Lazily loads the engine and creates a Phaser-managed, touch-inert DOM overlay. */
export async function loadLigneMascot(
  scene: Phaser.Scene,
  placement: LigneMascotPlacement,
): Promise<LigneMascot> {
  const [{ LignePlayer }, assetUrl] = await Promise.all([
    import("@ligne-engine/web"),
    resolveHootAssetUrl(),
  ]);
  const response = await fetch(assetUrl, import.meta.env.DEV ? { cache: "no-store" } : undefined);
  if (!response.ok) throw new Error(`Unable to load Professor Hoot (${response.status})`);

  const canvas = document.createElement("canvas");
  canvas.width = ARTBOARD_SIZE;
  canvas.height = ARTBOARD_SIZE;
  canvas.className = "ligne-mascot-canvas";
  canvas.setAttribute("aria-hidden", "true");
  const player = await LignePlayer.load(await response.arrayBuffer(), canvas);
  const display = scene.add.dom(placement.x, placement.y, canvas);
  display.setScale(placement.scale);
  display.setDepth(placement.depth);
  return new LigneMascot({ player, canvas, display });
}

/** Adapts the Ligne player to the scene-facing mascot reaction API. */
export class LigneMascot {
  private readonly player: LignePlayerPort;
  private readonly display: LigneDisplayPort;
  private readonly requestFrame: (callback: FrameRequestCallback) => number;
  private readonly cancelFrame: (handle: number) => void;
  private frameHandle: number;
  private previousTime?: number;
  private destroyed = false;

  constructor(options: LigneMascotOptions) {
    this.player = options.player;
    this.display = options.display;
    this.requestFrame = options.requestFrame ?? requestAnimationFrame;
    this.cancelFrame = options.cancelFrame ?? cancelAnimationFrame;
    options.canvas.style.pointerEvents = "none";
    this.frameHandle = this.requestFrame(this.tick);
  }

  wave(): void {
    this.player.fireTrigger("wave");
  }

  nod(): void {
    this.player.fireTrigger("nod");
  }

  cheer(big = false): void {
    this.player.fireTrigger(big ? "cheer_big" : "cheer");
  }

  curious(): void {
    this.player.fireTrigger("curious");
  }

  flapGreeting(): void {
    this.player.fireTrigger("flap_greeting");
  }

  /** Ligne's default state already owns its looping idle animation. */
  idleLoop(): void {}

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.cancelFrame(this.frameHandle);
    this.player.dispose();
    this.display.destroy();
  }

  private readonly tick = (now: number): void => {
    if (this.destroyed) return;
    const dtSeconds = this.previousTime === undefined ? 0 : (now - this.previousTime) / 1_000;
    this.previousTime = now;
    this.player.advance(dtSeconds);
    this.player.render();
    this.frameHandle = this.requestFrame(this.tick);
  };
}

/**
 * Attempts the post-boot Ligne swap while keeping the tween mascot as a
 * permanent, silent fallback for reduced motion, load errors, and timeouts.
 */
export async function activateLigneMascot(
  options: ActivateLigneMascotOptions,
): Promise<LigneMascot | null> {
  if (options.reducedMotion) return null;

  let timedOut = false;
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  const loaded = options
    .load(options.placement)
    .then((mascot) => {
      if (timedOut) {
        mascot.destroy();
        return null;
      }
      return mascot;
    })
    .catch(() => null);
  const timeout = new Promise<null>((resolve) => {
    timeoutHandle = setTimeout(() => {
      timedOut = true;
      resolve(null);
    }, options.timeoutMs);
  });

  const mascot = await Promise.race([loaded, timeout]);
  if (timeoutHandle !== undefined) clearTimeout(timeoutHandle);
  if (mascot) options.fallback.setVisible(false);
  return mascot;
}
