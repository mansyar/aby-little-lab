import type Phaser from "phaser";
import {
  DIRECTIONS,
  type Direction,
  ghostPath,
  MAX_COMMANDS,
  type RobotPathRound,
} from "../game/robotPathLogic";
import { motionDuration } from "../utils/motion";
import { attachPressFeedback } from "../utils/pressFeedback";

/** Board geometry: three 112px tiles, 12px apart (spec FR-2). */
const TILE_SIZE = 112;
const TILE_GAP = 12;
const TILE_STEP = TILE_SIZE + TILE_GAP;
const BOARD_TOP_ROW = 190;
const BOARD_CENTER_X = 512;

/** Palette: four 112px arrow buttons in one row under the board. */
const PALETTE_SIZE = 112;
const PALETTE_STEP = 120;
const PALETTE_Y = 560;

/** Command strip: six 96px slots, and the Go button beside them. */
const SLOT_SIZE = 96;
const SLOT_STEP = 104;
const SLOT_Y = 676;
const GO_X = 920;
const GO_Y = 676;
const GO_HIT = 112;

/** Time one command takes to run, so a full strip is 2.7s (spec NFR-5). */
export const STEP_MS = 450;

/** The robot's hop between tiles; shortened under reduced motion. */
const HOP_MS = 260;

/** Go button centre, shared by the drawing and the read-only e2e bridge. */
export const goPoint = { x: GO_X, y: GO_Y };

/** Centre of one palette arrow, from the same constants that drew it. */
export function palettePoint(direction: Direction): { x: number; y: number } {
  const startX = BOARD_CENTER_X - ((DIRECTIONS.length - 1) * PALETTE_STEP) / 2;
  return { x: startX + DIRECTIONS.indexOf(direction) * PALETTE_STEP, y: PALETTE_Y };
}

/** Centre of a board tile in canvas space. */
export function tileCenter(point: { col: number; row: number }): { x: number; y: number } {
  return {
    x: BOARD_CENTER_X + (point.col - 1) * TILE_STEP,
    y: BOARD_TOP_ROW + point.row * TILE_STEP,
  };
}

/** The slice of `RobotPathScene` its drawing helpers need. */
export interface RobotPathViewState {
  readonly add: Phaser.Scene["add"];
  readonly tweens: Phaser.Scene["tweens"];
  readonly OUTLINE_COLOR: number;
  readonly OUTLINE_WIDTH: number;
  readonly CARD_BG_COLOR: number;
  readonly paletteRects: Map<Direction, Phaser.GameObjects.Rectangle>;
  readonly paletteArrows: Map<Direction, Phaser.GameObjects.Graphics>;
  readonly slotRects: Phaser.GameObjects.Rectangle[];
  readonly slotArrows: Array<Phaser.GameObjects.Graphics | null>;
  robot?: Phaser.GameObjects.Image;
  star?: Phaser.GameObjects.Image;
  trail?: Phaser.GameObjects.Graphics;
  commands: Direction[];
  trackRoundObject<T extends Phaser.GameObjects.GameObject>(object: T): T;
  place(direction: Direction): void;
  removeAt(index: number): void;
  run(): void;
}

/** Draws a bold arrow of `size` pointing `direction`, centred on the origin. */
function drawArrow(
  glyph: Phaser.GameObjects.Graphics,
  direction: Direction,
  size: number,
  outlineColor: number,
): void {
  const tip = {
    up: [0, -size],
    right: [size, 0],
    down: [0, size],
    left: [-size, 0],
  }[direction] as [number, number];
  const back = {
    up: [
      [-size * 0.8, size * 0.6],
      [size * 0.8, size * 0.6],
    ],
    right: [
      [-size * 0.6, -size * 0.8],
      [-size * 0.6, size * 0.8],
    ],
    down: [
      [-size * 0.8, -size * 0.6],
      [size * 0.8, -size * 0.6],
    ],
    left: [
      [size * 0.6, -size * 0.8],
      [size * 0.6, size * 0.8],
    ],
  }[direction] as [number, number][];

  // A path rather than fillTriangle: the arrow is three points and the fill
  // closes them, which keeps the drawing to APIs the scene tests can see.
  glyph.fillStyle(outlineColor, 1);
  glyph.beginPath();
  glyph.moveTo(tip[0], tip[1]);
  glyph.lineTo(back[0][0], back[0][1]);
  glyph.lineTo(back[1][0], back[1][1]);
  glyph.fillPath();
}

/** Draws the board for the current round and resets the program. */
export function buildRoundBoard(v: RobotPathViewState, round: RobotPathRound): void {
  const board = v.add.graphics();
  v.trackRoundObject(board);
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const { x, y } = tileCenter({ col, row });
      const isGoal = col === round.star.col && row === round.star.row;
      board.fillStyle(isGoal ? 0xfefcbf : 0xffffff, 1);
      board.fillRoundedRect(x - TILE_SIZE / 2, y - TILE_SIZE / 2, TILE_SIZE, TILE_SIZE, 18);
      board.lineStyle(4, v.OUTLINE_COLOR, 0.5);
      board.strokeRoundedRect(x - TILE_SIZE / 2, y - TILE_SIZE / 2, TILE_SIZE, TILE_SIZE, 18);
    }
  }

  for (const rock of round.rocks) {
    const { x, y } = tileCenter(rock);
    v.trackRoundObject(v.add.image(x, y, "robot_rock").setDisplaySize(92, 92));
  }

  const goal = tileCenter(round.star);
  const star = v.add.image(goal.x, goal.y, "robot_star").setDisplaySize(84, 84);
  v.star = star;
  v.trackRoundObject(star);

  const start = tileCenter(round.start);
  const robot = v.add.image(start.x, start.y, "robot_idle").setDisplaySize(96, 96);
  v.robot = robot;
  v.trackRoundObject(robot);

  const trail = v.add.graphics();
  v.trail = trail;
  v.trackRoundObject(trail);
}

/** Four arrow buttons, built once per visit. */
export function buildPalette(v: RobotPathViewState): void {
  // Scene instances are reused across visits: drop the previous visit's chrome.
  v.paletteRects.clear();
  v.paletteArrows.clear();
  const startX = BOARD_CENTER_X - ((DIRECTIONS.length - 1) * PALETTE_STEP) / 2;
  DIRECTIONS.forEach((direction, index) => {
    const x = startX + index * PALETTE_STEP;
    const rect = v.add.rectangle(x, PALETTE_Y, PALETTE_SIZE, PALETTE_SIZE, v.CARD_BG_COLOR);
    rect.setStrokeStyle(v.OUTLINE_WIDTH, v.OUTLINE_COLOR, 1);
    rect.setInteractive();
    rect.on("pointerdown", () => v.place(direction));
    attachPressFeedback(rect);

    const arrow = v.add.graphics();
    arrow.setPosition(x, PALETTE_Y);
    drawArrow(arrow, direction, 30, v.OUTLINE_COLOR);

    v.paletteRects.set(direction, rect);
    v.paletteArrows.set(direction, arrow);
  });
}

/** Six empty slots, built once per visit; contents are redrawn per change. */
export function buildStrip(v: RobotPathViewState): void {
  v.slotRects.length = 0;
  v.slotArrows.length = 0;
  const startX = BOARD_CENTER_X - ((MAX_COMMANDS - 1) * SLOT_STEP) / 2;
  for (let index = 0; index < MAX_COMMANDS; index++) {
    const x = startX + index * SLOT_STEP;
    const rect = v.add.rectangle(x, SLOT_Y, SLOT_SIZE, SLOT_SIZE, v.CARD_BG_COLOR);
    rect.setStrokeStyle(4, v.OUTLINE_COLOR, 0.6);
    rect.setInteractive();
    rect.on("pointerdown", () => v.removeAt(index));
    attachPressFeedback(rect);

    v.slotRects.push(rect);
    v.slotArrows.push(null);
  }
}

/**
 * The run button: a play triangle beside the strip, drawn at the phase's
 * 112x112 touch size (FR-7 / NFR-1).
 *
 * Its tap target is the frame's own hit area rather than a centred custom
 * rectangle: a custom area is measured in *unscaled* frame pixels, so on this
 * 512px texture a 112px rectangle would sit in the top-left corner of the art
 * and leave the visible button untappable. The default area follows the
 * displayed size, which is exactly the size NFR-1 asks for.
 */
export function buildGo(v: RobotPathViewState): void {
  const go = v.add.image(GO_X, GO_Y, "robot_go").setDisplaySize(GO_HIT, GO_HIT);
  go.setInteractive();
  go.on("pointerdown", () => v.run());
  attachPressFeedback(go);
}

/** Redraws every slot's arrow to match the current program. */
export function redrawStrip(v: RobotPathViewState): void {
  for (let index = 0; index < v.slotRects.length; index++) {
    v.slotArrows[index]?.destroy();
    v.slotArrows[index] = null;

    const direction = v.commands[index];
    if (!direction) continue;
    const glyph = v.add.graphics();
    const rect = v.slotRects[index];
    glyph.setPosition(rect.x, rect.y);
    drawArrow(glyph, direction, 26, v.OUTLINE_COLOR);
    v.slotArrows[index] = glyph;
  }
}

/** Redraws the dotted trail the current program would walk (spec FR-6). */
export function redrawTrail(v: RobotPathViewState, round: RobotPathRound): void {
  const trail = v.trail;
  if (!trail) return;

  trail.clear();
  trail.fillStyle(0x2b6cb0, 0.35);
  for (const point of ghostPath(round, v.commands).slice(1)) {
    const { x, y } = tileCenter(point);
    trail.fillCircle(x, y, 7);
  }
}

/** Moves the robot one tile, hopping unless the child asked for less motion. */
export function moveRobotTo(v: RobotPathViewState, point: { col: number; row: number }): void {
  const robot = v.robot;
  if (!robot) return;
  const { x, y } = tileCenter(point);
  robot.setTexture("robot_walk");
  v.tweens.add({
    targets: robot,
    x,
    y,
    duration: motionDuration(HOP_MS, 120),
    ease: "Sine.inOut",
    onComplete: () => robot.setTexture("robot_idle"),
  });
}

/** Pops the slot that is executing, so the strip and the walk stay in sync. */
export function highlightSlot(v: RobotPathViewState, index: number): void {
  const rect = v.slotRects[index];
  v.tweens.add({
    targets: [rect, v.slotArrows[index]].filter(Boolean),
    scaleX: motionDuration(1.18, 1.08),
    scaleY: motionDuration(1.18, 1.08),
    duration: motionDuration(160, 100),
    yoyo: true,
  });
}

/** Pulses the hinted arrow in the palette; it is never placed for the child. */
export function pulseHint(v: RobotPathViewState, direction: Direction): void {
  v.tweens.add({
    targets: [v.paletteRects.get(direction), v.paletteArrows.get(direction)].filter(Boolean),
    scaleX: motionDuration(1.14, 1.06),
    scaleY: motionDuration(1.14, 1.06),
    duration: motionDuration(260, 160),
    yoyo: true,
    repeat: 2,
  });
}

/** A small refusal shake, shared by a refused arrow and an empty strip. */
export function nudge(
  v: RobotPathViewState,
  rect?: Phaser.GameObjects.Rectangle,
  arrow?: Phaser.GameObjects.Graphics,
): void {
  const targets = [rect, arrow].filter(Boolean);
  if (targets.length === 0) return;
  v.tweens.add({
    targets,
    x: (targets[0] as unknown as { x: number }).x + 6,
    duration: motionDuration(90, 60),
    yoyo: true,
    repeat: 1,
  });
}
