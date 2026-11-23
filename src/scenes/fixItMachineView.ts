import type Phaser from "phaser";
import {
  type ActionIcon,
  correctAction,
  type FixItRound,
  MAX_CARDS,
} from "../game/fixItMachineLogic";
import { motionDuration } from "../utils/motion";
import { attachPressFeedback } from "../utils/pressFeedback";

/** Spoken once when the game opens, and again on an empty Go. */
export const RULE = "Find the wrong card and fix it.";

/** Cards: 96px with 12px gaps, so the hardest tape spans 528px (spec FR-2). */
export const CARD_SIZE = 96;
const CARD_GAP = 12;
const CARD_STEP = CARD_SIZE + CARD_GAP;
const TAPE_Y = 552;
const TAPE_CENTER_X = 512;

/** The repair tray: three 96px candidates in one row under the tape. */
const TRAY_Y = 664;
const TRAY_STEP = 108;

/** The Go button: 112px, the product's touch floor (spec FR-7 / NFR-1). */
const GO_X = 896;
const GO_Y = 664;
const GO_HIT = 112;

/** Where the machine stands, clear of tape, tray and Go. */
const MACHINE_X = 664;
const MACHINE_Y = 320;
const MACHINE_SIZE = 232;

/** Art size drawn inside one card or tray slot. */
const ICON_SIZE = 68;

/**
 * The hint ladder's own geometry (spec FR-11): the padding of the
 * divergence band, the lift the bug card takes at level 2, and the band's
 * amber, which is a shape cue as well as a colour one.
 */
const HINT_PAD = 14;
const HINT_LIFT = 18;
const HINT_COLOR = 0xf4b942;

/** One card of the run, and the shortest it may take under reduced motion. */
export const STEP_MS = 550;
export const STEP_REDUCED_MS = 120;

/** Centre of one tape slot, from the same constants that drew it. */
export function tapePoint(index: number): { x: number; y: number } {
  return {
    x: TAPE_CENTER_X + (index - (MAX_CARDS - 1) / 2) * CARD_STEP,
    y: TAPE_Y,
  };
}

/** Centre of one tray slot, from the same constants that drew it. */
export function trayPoint(index: number): { x: number; y: number } {
  return { x: TAPE_CENTER_X + (index - 1) * TRAY_STEP, y: TRAY_Y };
}

/** The display objects that exist right now, in order. */
export function present(
  ...targets: Array<Phaser.GameObjects.GameObject | null | undefined>
): Phaser.GameObjects.GameObject[] {
  const found: Phaser.GameObjects.GameObject[] = [];
  for (const target of targets) {
    if (target) found.push(target);
  }
  return found;
}

/**
 * The slice of scene state the drawing helpers need. `FixItMachineScene`
 * supplies itself through a single structural view; the helpers never own
 * state, so every object the scene tests inspect stays on the scene.
 */
export interface FixItMachineViewState {
  readonly add: Phaser.Scene["add"];
  readonly tweens: Phaser.Scene["tweens"];
  readonly OUTLINE_WIDTH: number;
  readonly OUTLINE_COLOR: number;
  readonly CARD_BG_COLOR: number;
  cardRects: Phaser.GameObjects.Rectangle[];
  cardImages: Array<Phaser.GameObjects.Image | null>;
  trayRects: Phaser.GameObjects.Rectangle[];
  trayImages: Array<Phaser.GameObjects.Image | null>;
  tape: ActionIcon[];
  trayActions: ActionIcon[];
  trayOpen: boolean;
  rounds: readonly FixItRound[];
  roundIndex: number;
  machine?: Phaser.GameObjects.Image;
  goal?: Phaser.GameObjects.Image;
  mismatch?: Phaser.GameObjects.Graphics;
  hintBand?: Phaser.GameObjects.Graphics;
  trackRoundObject<T extends Phaser.GameObjects.GameObject>(obj: T): T;
}

/** Five tape slots, built once per visit; contents are redrawn per round. */
export function buildTapeSlots(v: FixItMachineViewState, onTap: (index: number) => void): void {
  // Scene instances are reused across visits: drop the previous visit's chrome.
  v.cardRects.length = 0;
  v.cardImages.length = 0;
  for (let index = 0; index < MAX_CARDS; index++) {
    const { x, y } = tapePoint(index);
    const rect = v.add.rectangle(x, y, CARD_SIZE, CARD_SIZE, v.CARD_BG_COLOR);
    rect.setStrokeStyle(v.OUTLINE_WIDTH, v.OUTLINE_COLOR, 0.8);
    rect.setInteractive();
    rect.on("pointerdown", () => onTap(index));
    attachPressFeedback(rect);

    v.cardRects.push(rect);
    v.cardImages.push(null);
  }
}

/** Three tray slots, built once per visit and shown only when diagnosing. */
export function buildTray(v: FixItMachineViewState, onTap: (index: number) => void): void {
  v.trayRects.length = 0;
  v.trayImages = [];
  for (let index = 0; index < 3; index++) {
    const { x, y } = trayPoint(index);
    const rect = v.add.rectangle(x, y, CARD_SIZE, CARD_SIZE, 0xfefcbf);
    rect.setStrokeStyle(v.OUTLINE_WIDTH, v.OUTLINE_COLOR, 0.8);
    rect.setInteractive();
    rect.on("pointerdown", () => onTap(index));
    attachPressFeedback(rect);
    rect.setVisible(false);

    v.trayRects.push(rect);
    v.trayImages.push(null);
  }
}

/**
 * The run button: a play triangle on a 112px card, the phase's touch size
 * (FR-5 / NFR-1). The triangle is a path rather than `fillTriangle`, the same
 * choice Robot Path's arrows make, so the scene tests can see the drawing.
 */
export function buildGo(v: FixItMachineViewState, onRun: () => void): void {
  const go = v.add.rectangle(GO_X, GO_Y, GO_HIT, GO_HIT, v.CARD_BG_COLOR);
  go.setStrokeStyle(v.OUTLINE_WIDTH, v.OUTLINE_COLOR, 1);
  go.setInteractive();
  go.on("pointerdown", onRun);
  attachPressFeedback(go);

  const glyph = v.add.graphics();
  glyph.fillStyle(v.OUTLINE_COLOR, 1);
  glyph.beginPath();
  glyph.moveTo(-18, -24);
  glyph.lineTo(26, 0);
  glyph.lineTo(-18, 24);
  glyph.fillPath();
  glyph.setPosition(GO_X, GO_Y);
}

/** Redraws the tape's cards to match the tape on screen. */
export function redrawTape(v: FixItMachineViewState): void {
  dropCardImages(v);
  matchRing(v);
  clearHintBand(v);
  for (let index = 0; index < v.cardRects.length; index++) {
    const rect = v.cardRects[index];
    rect.setAngle(0);
    rect.y = tapePoint(index).y;
    const action = v.tape[index];
    if (!action) {
      rect.setAlpha(0.18);
      continue;
    }
    rect.setAlpha(1);
    const image = v.add.image(rect.x, rect.y, `machine_${action}`);
    image.setDisplaySize(ICON_SIZE, ICON_SIZE);
    v.cardImages[index] = v.trackRoundObject(image);
  }
}

/** Opens the tray on the round's three candidates. */
export function openTray(v: FixItMachineViewState): void {
  const round = v.rounds[v.roundIndex];
  if (!round || v.trayOpen) return;
  v.trayOpen = true;
  v.trayActions = [...round.candidates];
  dropTrayImages(v);
  v.trayActions.forEach((action, index) => {
    const rect = v.trayRects[index];
    rect.setVisible(true);
    rect.setAngle(0);
    const { x, y } = trayPoint(index);
    const image = v.add.image(x, y, `machine_${action}`);
    image.setDisplaySize(ICON_SIZE, ICON_SIZE);
    v.trayImages[index] = v.trackRoundObject(image);
  });
}

/** Closes the tray and clears what it was offering. */
export function closeTray(v: FixItMachineViewState): void {
  v.trayOpen = false;
  v.trayActions = [];
  dropTrayImages(v);
  for (const rect of v.trayRects) {
    rect.setVisible(false);
    rect.setAngle(0);
  }
}

/** Clears the mismatch ring left by the last stopped run. */
export function matchRing(v: FixItMachineViewState): void {
  if (v.mismatch && !v.mismatch.isDestroyed) v.mismatch.destroy();
  v.mismatch = undefined;
}

export function dropCardImages(v: FixItMachineViewState): void {
  for (let index = 0; index < v.cardImages.length; index++) {
    const image = v.cardImages[index];
    if (image && !image.isDestroyed) image.destroy();
    v.cardImages[index] = null;
  }
}

export function dropTrayImages(v: FixItMachineViewState): void {
  for (let index = 0; index < v.trayImages.length; index++) {
    const image = v.trayImages[index];
    if (image && !image.isDestroyed) image.destroy();
    v.trayImages[index] = null;
  }
}

/**
 * Level 1 (two missed taps): a soft band from the first card through the
 * wrong one, and the machine's arm pointing at the band's end.
 */
export function drawHintBand(v: FixItMachineViewState): void {
  clearHintBand(v);
  const round = v.rounds[v.roundIndex];
  if (!round || round.bugIndex < 0) return;

  const first = tapePoint(0);
  const bug = tapePoint(round.bugIndex);
  const x = first.x - CARD_SIZE / 2 - HINT_PAD;
  const y = first.y - CARD_SIZE / 2 - HINT_PAD;
  const width = bug.x - first.x + CARD_SIZE + HINT_PAD * 2;
  const height = CARD_SIZE + HINT_PAD * 2;

  const band = v.add.graphics();
  v.trackRoundObject(band);
  band.fillStyle(HINT_COLOR, 0.16);
  band.fillRoundedRect(x, y, width, height, 20);
  band.lineStyle(4, HINT_COLOR, 0.7);
  band.strokeRoundedRect(x, y, width, height, 20);

  // The arm: one line from the machine's edge to the band's end, with a
  // head, so the direction reads as shape rather than as motion.
  const tipX = bug.x;
  const tipY = bug.y - CARD_SIZE / 2 - HINT_PAD - 8;
  band.lineStyle(6, v.OUTLINE_COLOR, 0.55);
  band.beginPath();
  band.moveTo(MACHINE_X - MACHINE_SIZE / 2, MACHINE_Y + MACHINE_SIZE / 2 - 30);
  band.lineTo(tipX, tipY);
  band.strokePath();
  band.fillStyle(v.OUTLINE_COLOR, 0.75);
  band.fillCircle(tipX, tipY, 8);

  v.hintBand = band;
}

/** Level 2 (four missed taps): the wrong card lifts and pulses once. */
export function liftBugCard(v: FixItMachineViewState): void {
  const index = v.rounds[v.roundIndex]?.bugIndex ?? -1;
  const rect = v.cardRects[index];
  if (!rect) return;

  const lifted = tapePoint(index).y - HINT_LIFT;
  const duration = motionDuration(180, 120);
  v.tweens.add({ targets: rect, y: lifted, duration });
  const image = v.cardImages[index];
  if (image) v.tweens.add({ targets: image, y: lifted, duration });
  pulse(v, rect);
}

/** Level 3 (six missed taps): the tool the job needs pulses once. */
export function pulseCorrectCandidate(v: FixItMachineViewState): void {
  if (!v.trayOpen) return;
  const round = v.rounds[v.roundIndex];
  if (!round) return;
  const index = v.trayActions.indexOf(correctAction(round));
  const rect = index >= 0 ? v.trayRects[index] : undefined;
  if (rect) pulse(v, rect);
}

/** Drops the level-1 band; a redraw, a repair or a new round clears it. */
export function clearHintBand(v: FixItMachineViewState): void {
  if (v.hintBand && !v.hintBand.isDestroyed) v.hintBand.destroy();
  v.hintBand = undefined;
}

/** Rings the card that did not belong, so the wrong step is visible. */
export function markMismatch(v: FixItMachineViewState, round: FixItRound): void {
  const { x, y } = tapePoint(round.bugIndex);
  const ring = v.add.graphics();
  ring.lineStyle(6, 0xe53e3e, 1);
  ring.strokeRoundedRect(
    x - CARD_SIZE / 2 - 6,
    y - CARD_SIZE / 2 - 6,
    CARD_SIZE + 12,
    CARD_SIZE + 12,
    20,
  );
  v.mismatch = v.trackRoundObject(ring);
}

/** A brief scale pop on one object; every card and slot hint goes through it. */
export function pulse(v: FixItMachineViewState, target: Phaser.GameObjects.GameObject): void {
  v.tweens.add({
    targets: target,
    scaleX: motionDuration(1.16, 1.06),
    scaleY: motionDuration(1.16, 1.06),
    duration: motionDuration(240, 150),
    yoyo: true,
    repeat: 1,
  });
}
