import type Phaser from "phaser";
import type { E2ERobotPathState } from "../game/e2eBridge";
import type { Rng } from "../game/random";
import { preloadRobotPathArt } from "../game/robotPathArt";
import {
  buildPlaythrough,
  canPlace,
  DIRECTIONS,
  type Direction,
  firstDeviation,
  hintFor,
  ROUND_COUNT,
  type RobotPathRound,
  removeFrom,
  runProgram,
} from "../game/robotPathLogic";
import type { GameId } from "../types";
import { createCompletionSplash } from "../utils/completionEffect";
import { motionDuration } from "../utils/motion";
import { sceneEntrance } from "../utils/sceneTransitions";
import { speakSentence } from "../utils/speech";
import { getSettings } from "../utils/storage";
import { ChoiceRoundScene } from "./ChoiceRoundScene";
import {
  buildGo,
  buildPalette,
  buildRoundBoard,
  buildStrip,
  goPoint,
  highlightSlot as highlightSlotView,
  moveRobotTo as moveRobotToView,
  nudge as nudgeView,
  palettePoint,
  pulseHint as pulseHintView,
  type RobotPathViewState,
  redrawStrip as redrawStripView,
  redrawTrail as redrawTrailView,
  STEP_MS,
  tileCenter,
} from "./robotPathView";

/** Spoken once when the game opens, and again on an empty Go (spec FR-13). */
const RULE = "Put the arrows in the robot's path, then tap go.";

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
 * trail are rebuilt per round by `ChoiceRoundScene`'s teardown. The actual
 * drawing lives in `robotPathView.ts`; this class owns all mutable game state.
 */
export class RobotPathScene extends ChoiceRoundScene {
  private rounds: RobotPathRound[] = [];
  private commands: Direction[] = [];
  private stoppedRuns = 0;
  private robot?: Phaser.GameObjects.Image;
  private star?: Phaser.GameObjects.Image;
  protected trail?: Phaser.GameObjects.Graphics;
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
  /** Runs finished this round, both outcomes — what the bridge publishes. */
  private runs = 0;
  /**
   * Whether this round's hint has been offered. FR-10 caps it at one per round,
   * so a third stopped run must not pulse the arrow again.
   */
  private hintOffered = false;
  /** Whether one of those runs reached the star. */
  private solvedThisRound = false;

  /** Structural view handed to the drawing helpers. */
  private get view(): RobotPathViewState {
    return this as unknown as RobotPathViewState;
  }

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

    buildPalette(this.view);
    buildStrip(this.view);
    buildGo(this.view);

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
    return "robot-path";
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
    this.runs = 0;
    this.solvedThisRound = false;
    this.hintOffered = false;

    buildRoundBoard(this.view, round);
    this.redrawStrip();
    this.redrawTrail();
  }

  /** Releases the round's board and resets the program it held. */
  protected clearRoundContent(): void {
    this.runToken += 1;
    this.running = false;
    this.robot = undefined;
    this.star = undefined;
    this.trail = undefined;
    this.commands = [];
    this.stoppedRuns = 0;
    this.deviation = null;
    this.runs = 0;
    this.solvedThisRound = false;
    this.hintOffered = false;
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

  /**
   * Publishes the round, the program and the live board for the browser suite
   * (FR-16). Read-only: every field is copied from the scene's own state at call
   * time, so a journey acts on the geometry this scene is drawing.
   */
  e2eRobotPath(): E2ERobotPathState {
    const round = this.rounds[this.roundIndex];
    const commands = this.commands;
    const robot = this.robot;
    const star = this.star;
    return {
      round: this.roundIndex,
      solution: round ? [...round.solution] : [],
      commands: [...commands],
      palette: DIRECTIONS.map((direction) => ({ dir: direction, ...palettePoint(direction) })),
      slots: this.slotRects.map((rect, index) => ({
        index,
        x: rect.x,
        y: rect.y,
        filled: index < commands.length,
      })),
      go: { x: goPoint.x, y: goPoint.y },
      robot: { x: robot?.x ?? 0, y: robot?.y ?? 0 },
      star: { x: star?.x ?? 0, y: star?.y ?? 0 },
      runs: this.runs,
      solved: this.solvedThisRound,
    };
  }

  /** Taps a palette arrow: append it, or nudge when the board refuses it. */
  protected place(direction: Direction): void {
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
  protected removeAt(index: number): void {
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
  protected run(): void {
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
      this.runs += 1;
      if (result.reachedStar) {
        this.solvedThisRound = true;
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
      const start = tileCenter(round.start);
      this.robot?.setTexture("robot_idle").setPosition(start.x, start.y);
    }
    this.redrawStrip();
    this.inputLocked = false;

    // The hint is offered once per round (spec FR-10): after the second stopped
    // run it pulses, and a third stop no longer repeats it.
    const hint = round && !this.hintOffered ? hintFor(round, this.stoppedRuns) : null;
    if (hint) {
      this.hintOffered = true;
      this.pulseHint(hint);
    }
  }

  /** The shared splash, then the base's chime, dot and advance. */
  protected override onCorrect(): void {
    createCompletionSplash(this, this.cameras.main.centerX, this.cameras.main.centerY);
  }

  private redrawStrip(): void {
    redrawStripView(this.view);
  }

  private redrawTrail(): void {
    const round = this.rounds[this.roundIndex];
    if (!round) return;
    redrawTrailView(this.view, round);
  }

  private moveRobotTo(point: { col: number; row: number }): void {
    moveRobotToView(this.view, point);
  }

  private highlightSlot(index: number): void {
    highlightSlotView(this.view, index);
  }

  private pulseHint(direction: Direction): void {
    pulseHintView(this.view, direction);
  }

  private nudge(rect?: Phaser.GameObjects.Rectangle, arrow?: Phaser.GameObjects.Graphics): void {
    nudgeView(this.view, rect, arrow);
  }
}
