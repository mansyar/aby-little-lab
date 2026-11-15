import Phaser from "phaser";
import type { Rng } from "../game/random";
import { preloadRobotPathArt } from "../game/robotPathArt";
import {
  buildPlaythrough,
  canPlace,
  DIRECTIONS,
  type Direction,
  firstDeviation,
  ghostPath,
  hintFor,
  MAX_COMMANDS,
  ROUND_COUNT,
  type RobotPathRound,
  removeFrom,
  runProgram,
} from "../game/robotPathLogic";
import type { GameId } from "../types";
import { createCompletionSplash } from "../utils/completionEffect";
import { motionDuration } from "../utils/motion";
import { attachPressFeedback } from "../utils/pressFeedback";
import { sceneEntrance } from "../utils/sceneTransitions";
import { speakSentence } from "../utils/speech";
import { getSettings } from "../utils/storage";
import { ChoiceRoundScene } from "./ChoiceRoundScene";

/** Spoken once when the game opens, and again on an empty Go (spec FR-13). */
const RULE = "Put the arrows in the robot's path, then tap go.";

/** Board geometry: three 112px tiles, 8px apart, rows starting below the rule. */
const TILE_SIZE = 112;
const TILE_GAP = 8;
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
const STEP_MS = 450;

/** The robot's hop between tiles; shortened under reduced motion. */
const HOP_MS = 260;

/**
 * Robot Path — Game 23.
 *
 * The child taps direction arrows into a six-slot strip, watches a dotted trail
 * show where that program would go, and presses Go. The robot walks exactly the
 * strip: reaching the star resolves the round, and stopping anywhere else keeps
 * every command so one arrow can be changed and run again.
 *
 * The board rules are not here — `robotPathLogic` owns stepping, placement and
 * the ladder, so this scene only draws and times what those functions return.
 * Chrome (palette, strip, Go) is built once per visit; the board, robot and
 * trail are rebuilt per round by `ChoiceRoundScene`'s teardown.
 */
export class RobotPathScene extends ChoiceRoundScene {
  private rounds: RobotPathRound[] = [];
  private commands: Direction[] = [];
  private stoppedRuns = 0;
  private robot?: Phaser.GameObjects.Image;
  private trail?: Phaser.GameObjects.Graphics;
  private readonly paletteRects = new Map<Direction, Phaser.GameObjects.Rectangle>();
  private readonly paletteArrows = new Map<Direction, Phaser.GameObjects.Graphics>();
  private readonly slotRects: Phaser.GameObjects.Rectangle[] = [];
  private readonly slotArrows: Array<Phaser.GameObjects.Graphics | null> = [];
  /** Guards delayed steps against a round that was torn down underneath them. */
  private runToken = 0;
  /** True while the robot is walking; the strip stays inert until it stops. */
  private running = false;
  /** Index of the command that first left the route, while a run is judged. */
  private deviation: number | null = null;

  constructor(rng: Rng = Math.random) {
    super("RobotPath", rng);
  }

  preload(): void {
    preloadRobotPathArt(this);
  }

  create(): void {
    sceneEntrance(this);
    this.createCornerMascot();
    this.createBackButton();
    this.createProgressDots(ROUND_COUNT);
    this.createSpokenInstruction(RULE);

    this.buildPalette();
    this.buildStrip();
    this.buildGo();

    this.rounds = buildPlaythrough(this.rng);
    this.roundIndex = 0;
    this.inputLocked = false;
    this.renderRound();
    this.registerShutdownCleanup();
  }

  protected totalRounds(): number {
    return this.rounds.length || ROUND_COUNT;
  }

  protected gameId(): GameId {
    // The `GameId` member and the registry row that makes it real land together
    // in Phase 4 ("the 23rd game enters the roster"), so this scene is typed by
    // the id it will report rather than waiting for the roster.
    return "robot-path" as GameId;
  }

  /** The strip is the answer; no single tapped card decides the round. */
  protected isChoiceCorrect(): boolean {
    return false;
  }

  /** Draws the board for the current round and resets the program. */
  protected buildRoundContent(): void {
    const round = this.rounds[this.roundIndex];
    if (!round) return;

    this.commands = [];
    this.stoppedRuns = 0;
    this.deviation = null;

    const board = this.add.graphics();
    this.trackRoundObject(board);
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const { x, y } = this.tileCenter({ col, row });
        const isGoal = col === round.star.col && row === round.star.row;
        board.fillStyle(isGoal ? 0xfefcbf : 0xffffff, 1);
        board.fillRoundedRect(x - TILE_SIZE / 2, y - TILE_SIZE / 2, TILE_SIZE, TILE_SIZE, 18);
        board.lineStyle(4, this.OUTLINE_COLOR, 0.5);
        board.strokeRoundedRect(x - TILE_SIZE / 2, y - TILE_SIZE / 2, TILE_SIZE, TILE_SIZE, 18);
      }
    }

    for (const rock of round.rocks) {
      const { x, y } = this.tileCenter(rock);
      this.trackRoundObject(this.add.image(x, y, "robot_rock").setDisplaySize(92, 92));
    }

    const goal = this.tileCenter(round.star);
    this.trackRoundObject(this.add.image(goal.x, goal.y, "robot_star").setDisplaySize(84, 84));

    const start = this.tileCenter(round.start);
    const robot = this.add.image(start.x, start.y, "robot_idle").setDisplaySize(96, 96);
    this.robot = robot;
    this.trackRoundObject(robot);

    const trail = this.add.graphics();
    this.trail = trail;
    this.trackRoundObject(trail);

    this.redrawStrip();
    this.redrawTrail();
  }

  /** Releases the round's board and resets the program it held. */
  protected clearRoundContent(): void {
    this.runToken += 1;
    this.running = false;
    this.robot = undefined;
    this.trail = undefined;
    this.commands = [];
    this.stoppedRuns = 0;
    this.deviation = null;
    for (let index = 0; index < this.slotArrows.length; index++) {
      this.slotArrows[index]?.destroy();
      this.slotArrows[index] = null;
    }
    for (const rect of this.slotRects) {
      rect.setAlpha(1);
      rect.setScale(1);
    }
    for (const rect of this.paletteRects.values()) {
      rect.setAlpha(1);
      rect.setScale(1);
    }
    for (const arrow of this.paletteArrows.values()) {
      arrow.setAlpha(1);
      arrow.setScale(1);
    }
  }

  /** Centre of a board tile in canvas space. */
  private tileCenter(point: { col: number; row: number }): { x: number; y: number } {
    return {
      x: BOARD_CENTER_X + (point.col - 1) * TILE_STEP,
      y: BOARD_TOP_ROW + point.row * TILE_STEP,
    };
  }

  /** Four arrow buttons, built once per visit. */
  private buildPalette(): void {
    // Scene instances are reused across visits: drop the previous visit's chrome.
    this.paletteRects.clear();
    this.paletteArrows.clear();
    const startX = BOARD_CENTER_X - ((DIRECTIONS.length - 1) * PALETTE_STEP) / 2;
    DIRECTIONS.forEach((direction, index) => {
      const x = startX + index * PALETTE_STEP;
      const rect = this.add.rectangle(x, PALETTE_Y, PALETTE_SIZE, PALETTE_SIZE, this.CARD_BG_COLOR);
      rect.setStrokeStyle(this.OUTLINE_WIDTH, this.OUTLINE_COLOR, 1);
      rect.setInteractive();
      rect.on("pointerdown", () => this.place(direction));
      attachPressFeedback(rect);

      const arrow = this.add.graphics();
      arrow.setPosition(x, PALETTE_Y);
      this.drawArrow(arrow, direction, 30);

      this.paletteRects.set(direction, rect);
      this.paletteArrows.set(direction, arrow);
    });
  }

  /** Six empty slots, built once per visit; contents are redrawn per change. */
  private buildStrip(): void {
    this.slotRects.length = 0;
    this.slotArrows.length = 0;
    const startX = BOARD_CENTER_X - ((MAX_COMMANDS - 1) * SLOT_STEP) / 2;
    for (let index = 0; index < MAX_COMMANDS; index++) {
      const x = startX + index * SLOT_STEP;
      const rect = this.add.rectangle(x, SLOT_Y, SLOT_SIZE, SLOT_SIZE, this.CARD_BG_COLOR);
      rect.setStrokeStyle(4, this.OUTLINE_COLOR, 0.6);
      rect.setInteractive();
      rect.on("pointerdown", () => this.removeAt(index));
      attachPressFeedback(rect);

      this.slotRects.push(rect);
      this.slotArrows.push(null);
    }
  }

  /** The run button: a play triangle beside the strip. */
  private buildGo(): void {
    const go = this.add.image(GO_X, GO_Y, "robot_go").setDisplaySize(96, 96);
    go.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(-GO_HIT / 2, -GO_HIT / 2, GO_HIT, GO_HIT),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
    });
    go.on("pointerdown", () => this.run());
    attachPressFeedback(go);
  }

  /** Taps a palette arrow: append it, or nudge when the board refuses it. */
  private place(direction: Direction): void {
    if (this.inputLocked || this.running) return;
    const round = this.rounds[this.roundIndex];
    if (!round) return;

    if (!canPlace(round, this.commands, direction)) {
      this.nudge(this.paletteRects.get(direction), this.paletteArrows.get(direction));
      return;
    }

    this.commands = [...this.commands, direction];
    this.redrawStrip();
    this.redrawTrail();
  }

  /** Taps a filled slot: drop it and everything after it (spec FR-5). */
  private removeAt(index: number): void {
    if (this.inputLocked || this.running) return;
    if (index >= this.commands.length) return;

    this.commands = removeFrom(this.commands, index);
    this.redrawStrip();
    this.redrawTrail();
  }

  /**
   * Presses Go. An empty strip re-speaks the rule and nudges the strip instead
   * of counting as a run; otherwise the robot walks the program one step at a
   * time, highlighting the command it is executing.
   */
  private run(): void {
    if (this.inputLocked || this.running) return;
    const round = this.rounds[this.roundIndex];
    if (!round) return;

    if (this.commands.length === 0) {
      speakSentence(RULE, getSettings().sfxEnabled);
      this.nudge(this.slotRects[0], this.slotArrows[0] ?? undefined);
      return;
    }

    // The run gates the strip through its own flag, not the base's input lock:
    // `resolveWholeRound` refuses to fire while `inputLocked` is set, and this
    // scene is the one deciding when a run is over.
    this.running = true;
    this.runToken += 1;
    const token = this.runToken;
    const commands = [...this.commands];
    const result = runProgram(round, commands);

    result.visited.slice(1).forEach((tile, index) => {
      this.time.delayedCall(STEP_MS * (index + 1), () => {
        if (token !== this.runToken) return;
        this.highlightSlot(index);
        this.moveRobotTo(tile);
      });
    });

    this.time.delayedCall(STEP_MS * result.visited.length, () => {
      if (token !== this.runToken) return;
      this.running = false;
      if (result.reachedStar) {
        this.resolveWholeRound(true);
        return;
      }
      // A stopped run: keep every command, blame the one that left the route.
      this.stoppedRuns += 1;
      this.deviation = firstDeviation(commands, round.solution);
      this.robot?.setTexture("robot_puzzled");
      this.resolveWholeRound(false);
    });
  }

  /** Reveals a stopped run's offending command and locks the board meanwhile. */
  protected override onWrong(): void {
    this.inputLocked = true;
    const index = this.deviation;
    if (index === null) return;
    const slot = Math.min(index, this.slotRects.length - 1);
    this.tweens.add({
      targets: [this.slotRects[slot], this.slotArrows[slot]].filter(Boolean),
      alpha: motionDuration(0.45, 0.6),
      duration: motionDuration(220, 140),
      yoyo: true,
      repeat: 2,
    });
  }

  /** Puts the robot back on its start tile so the program can be repaired. */
  protected override onWiggleComplete(): void {
    const round = this.rounds[this.roundIndex];
    if (round) {
      const start = this.tileCenter(round.start);
      this.robot?.setTexture("robot_idle").setPosition(start.x, start.y);
    }
    this.redrawStrip();
    this.inputLocked = false;

    const hint = round ? hintFor(round, this.stoppedRuns) : null;
    if (hint) this.pulseHint(hint);
  }

  /** The shared splash, then the base's chime, dot and advance. */
  protected override onCorrect(): void {
    createCompletionSplash(this, this.cameras.main.centerX, this.cameras.main.centerY);
  }

  /** Redraws every slot's arrow to match the current program. */
  private redrawStrip(): void {
    for (let index = 0; index < this.slotRects.length; index++) {
      this.slotArrows[index]?.destroy();
      this.slotArrows[index] = null;

      const direction = this.commands[index];
      if (!direction) continue;
      const glyph = this.add.graphics();
      const rect = this.slotRects[index];
      glyph.setPosition(rect.x, rect.y);
      this.drawArrow(glyph, direction, 26);
      this.slotArrows[index] = glyph;
    }
  }

  /** Redraws the dotted trail the current program would walk (spec FR-6). */
  private redrawTrail(): void {
    const round = this.rounds[this.roundIndex];
    const trail = this.trail;
    if (!round || !trail) return;

    trail.clear();
    trail.fillStyle(0x2b6cb0, 0.35);
    for (const point of ghostPath(round, this.commands).slice(1)) {
      const { x, y } = this.tileCenter(point);
      trail.fillCircle(x, y, 7);
    }
  }

  /** Draws a bold arrow of `size` pointing `direction`, centred on the origin. */
  private drawArrow(glyph: Phaser.GameObjects.Graphics, direction: Direction, size: number): void {
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
    glyph.fillStyle(this.OUTLINE_COLOR, 1);
    glyph.beginPath();
    glyph.moveTo(tip[0], tip[1]);
    glyph.lineTo(back[0][0], back[0][1]);
    glyph.lineTo(back[1][0], back[1][1]);
    glyph.fillPath();
  }

  /** Moves the robot one tile, hopping unless the child asked for less motion. */
  private moveRobotTo(point: { col: number; row: number }): void {
    const robot = this.robot;
    if (!robot) return;
    const { x, y } = this.tileCenter(point);
    robot.setTexture("robot_walk");
    this.tweens.add({
      targets: robot,
      x,
      y,
      duration: motionDuration(HOP_MS, 120),
      ease: "Sine.inOut",
      onComplete: () => robot.setTexture("robot_idle"),
    });
  }

  /** Pops the slot that is executing, so the strip and the walk stay in sync. */
  private highlightSlot(index: number): void {
    const rect = this.slotRects[index];
    if (!rect) return;
    this.tweens.add({
      targets: [rect, this.slotArrows[index]].filter(Boolean),
      scaleX: motionDuration(1.18, 1.08),
      scaleY: motionDuration(1.18, 1.08),
      duration: motionDuration(160, 100),
      yoyo: true,
    });
  }

  /** Pulses the hinted arrow in the palette; it is never placed for the child. */
  private pulseHint(direction: Direction): void {
    this.tweens.add({
      targets: [this.paletteRects.get(direction), this.paletteArrows.get(direction)].filter(
        Boolean,
      ),
      scaleX: motionDuration(1.14, 1.06),
      scaleY: motionDuration(1.14, 1.06),
      duration: motionDuration(260, 160),
      yoyo: true,
      repeat: 2,
    });
  }

  /** A small refusal shake, shared by a refused arrow and an empty strip. */
  private nudge(rect?: Phaser.GameObjects.Rectangle, arrow?: Phaser.GameObjects.Graphics): void {
    const targets = [rect, arrow].filter(Boolean);
    if (targets.length === 0) return;
    this.tweens.add({
      targets,
      x: (targets[0] as unknown as { x: number }).x + 6,
      duration: motionDuration(90, 60),
      yoyo: true,
      repeat: 1,
    });
  }
}
