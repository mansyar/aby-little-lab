import type Phaser from "phaser";
import { getRemainingMinutes, isLimitReached, isNearLimit } from "../game/playTimeLogic";
import { getPlayTime } from "../utils/storage";

const HINT_ARC_RADIUS = 12;

const HINT_COOL_COLOR = 0x68d391;

const HINT_WARM_COLOR = 0xed8936;

const NUDGE_DELAY = 2000;

const NUDGE_DEPTH = 20;

export interface PlayTimeIndicatorDeps {
  scene: Phaser.Scene;
  /** Called once when the daily limit is reached (lock tiles, wave mascot). */
  onLimitReached: () => void;
}

/**
 * Creates the play-time indicator for the active profile: a hint arc under
 * the grid while time remains (warm when 5 minutes or fewer are left), or a
 * textless moon badge with dimmed, locked tiles once the daily limit is
 * reached. Returns null (drawing nothing) when the profile has no limit set.
 */
export function createPlayTimeIndicator(
  deps: PlayTimeIndicatorDeps,
): Phaser.GameObjects.Graphics | null {
  const { scene, onLimitReached } = deps;
  const playTime = getPlayTime();
  if (playTime.limitMinutes === null) return null;
  const graphics = scene.add.graphics();
  graphics.setDepth(-1);
  const cx = scene.cameras.main.width / 2;
  const cy = scene.cameras.main.height - 16;
  if (isLimitReached(playTime)) {
    onLimitReached();
    graphics.fillStyle(0x2d3748, 1);
    graphics.fillCircle(cx, cy, HINT_ARC_RADIUS + 6);
    graphics.fillStyle(0xfff8e7, 1);
    graphics.fillCircle(cx - 5, cy - 4, HINT_ARC_RADIUS + 1);
  } else {
    const remaining = getRemainingMinutes(playTime);
    const ratio = Math.max(0, Math.min(1, (remaining ?? 0) / (playTime.limitMinutes ?? 1)));
    const endAngle = -Math.PI / 2 + ratio * Math.PI * 2;
    graphics.fillStyle(isNearLimit(playTime) ? HINT_WARM_COLOR : HINT_COOL_COLOR, 1);
    graphics.slice(cx, cy, HINT_ARC_RADIUS, -Math.PI / 2, endAngle, false);
    graphics.fillPath();
    graphics.fillCircle(cx, cy, 3);
  }
  return graphics;
}

export interface PlayTimeNudgeDeps {
  scene: Phaser.Scene;
  /** Launches the game once the nudge delay elapses. */
  onLaunch: (tileIndex: number) => void;
}

/**
 * Textless nudge (dim overlay + hourglass) shown for NUDGE_DELAY ms before
 * launching a game — a soft "almost done" signal without harsh cutoffs.
 */
export class PlayTimeNudge {
  private active = false;

  isActive(): boolean {
    return this.active;
  }

  show(deps: PlayTimeNudgeDeps, tileIndex: number): void {
    if (this.active) return;
    this.active = true;
    const { scene, onLaunch } = deps;
    const width = scene.cameras.main.width;
    const height = scene.cameras.main.height;
    const cx = width / 2;
    const cy = height / 2;
    const objects: Phaser.GameObjects.GameObject[] = [];
    const overlay = scene.add.rectangle(cx, cy, width, height, 0x2d3748, 0.6);
    overlay.setDepth(NUDGE_DEPTH);
    overlay.setInteractive();
    objects.push(overlay);
    const hourglass = scene.add.graphics();
    hourglass.setDepth(NUDGE_DEPTH + 1);
    hourglass.fillStyle(0xffffff, 1);
    hourglass.beginPath();
    hourglass.moveTo(cx - 36, cy - 40);
    hourglass.lineTo(cx + 36, cy - 40);
    hourglass.lineTo(cx, cy);
    hourglass.lineTo(cx - 36, cy + 40);
    hourglass.lineTo(cx + 36, cy + 40);
    hourglass.lineTo(cx, cy);
    hourglass.fillPath();
    objects.push(hourglass);
    scene.time.delayedCall(NUDGE_DELAY, () => {
      for (const obj of objects) obj.destroy();
      this.active = false;
      onLaunch(tileIndex);
    });
  }
}
