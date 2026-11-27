import type Phaser from "phaser";
import { glyphs } from "../game/art/glyphs";
import type {
  E2ERepeatMachineChoice,
  E2ERepeatMachineCount,
  E2ERepeatMachineState,
} from "../game/e2eBridge";
import type { Rng } from "../game/random";
import {
  buildPlaythrough,
  isValidCount,
  MOVE_ACTIONS,
  type MoveAction,
  nextAttempt,
  type Program,
  type RepeatRound,
  ROUND_COUNT,
  type RunResult,
  runProgram,
  scoreFor,
  type TargetCount,
} from "../game/repeatMachineLogic";
import type { GameId } from "../types";
import { createCompletionSplash } from "../utils/completionEffect";
import { motionDuration } from "../utils/motion";
import { attachPressFeedback } from "../utils/pressFeedback";
import { sceneEntrance } from "../utils/sceneTransitions";
import { speakSentence } from "../utils/speech";
import { getAdaptiveBandShift, getSettings } from "../utils/storage";
import { ChoiceRoundScene } from "./ChoiceRoundScene";

/** Spoken once on entry, and again when Go is pressed with an empty program. */
const RULE = "Pick a move and a count, then press Go.";

const DOT_Y = 200;
const DOT_STEP = 112;
const DOT_RADIUS = 30;

const MACHINE_X = 512;
const MACHINE_Y = 310;
const MACHINE_WIDTH = 280;
const MACHINE_HEIGHT = 160;

const COUNT_Y = 468;
const COUNT_SIZE = 112;
const COUNT_STEP = 136;

const ACTION_Y = 628;
const ACTION_SIZE = 132;
const ACTION_STEP = 148;

const GO_X = 912;
const GO_Y = 628;
const GO_HIT = 112;

/** One move+sound pair, drawn as a step on the machine's display. */
const STEP_MS = 420;
const STEP_REDUCED_MS = 120;
const MAX_STEPS = 4;

const ACTION_LABELS: Readonly<Record<MoveAction, string>> = {
  wave: "Wave",
  nod: "Nod",
  cheer: "Cheer",
  curious: "Curious",
};

/** Dot centres for a round, derived from the same spacing the drawing uses. */
function dotPoint(index: number, target: TargetCount): { x: number; y: number } {
  return { x: 512 + (index - (target - 1) / 2) * DOT_STEP, y: DOT_Y };
}

/** Centre of one move card. */
function actionPoint(index: number): { x: number; y: number } {
  return { x: 512 + (index - (MOVE_ACTIONS.length - 1) / 2) * ACTION_STEP, y: ACTION_Y };
}

/** Centre of one repeat-count card, in authored count order 2, 3, 4. */
function countPoint(index: number): { x: number; y: number } {
  return { x: 512 + (index - 1) * COUNT_STEP, y: COUNT_Y };
}

/**
 * Repeat Machine — Game 25.
 *
 * The machine replays one move+sound pair exactly as many times as the child
 * authors. `repeatMachineLogic` owns the six-round ladder, the program check
 * and the scoring; this scene draws the dots, the authoring cards and the
 * replay, and holds only the state the browser bridge publishes. Chrome (the
 * move cards, count cards and Go) is built once per visit; round content is
 * rebuilt by `ChoiceRoundScene`'s teardown.
 */
export class RepeatMachineScene extends ChoiceRoundScene {
  private rounds: readonly RepeatRound[] = [];
  private readonly actionRects: Phaser.GameObjects.Rectangle[] = [];
  private readonly countRects: Phaser.GameObjects.Rectangle[] = [];
  private readonly dotCircles: Phaser.GameObjects.Arc[] = [];
  private machine?: Phaser.GameObjects.Rectangle;
  private face?: Phaser.GameObjects.Graphics;
  private program: Program = { action: null, count: null };
  private performed: readonly MoveAction[] = [];
  /** Guards delayed replay steps against a round torn down underneath them. */
  private runToken = 0;
  /** True while the machine is replaying; every tap stays inert until it stops. */
  private running = false;
  private solvedThisRound = false;
  private wrongRuns = 0;
  private wrongTaps = 0;
  private hintLevel: 0 | 1 | 2 = 0;
  /** Attempts this round, starting at one and never reset by a wrong replay. */
  private attempts = 1;
  /** Points the last valid replay earned, from the rule module's `scoreFor`. */
  private lastScore = 0;

  constructor(rng: Rng = Math.random) {
    super("RepeatMachine", rng);
  }

  preload(): void {
    this.preloadArt([glyphs]);
  }

  create(): void {
    sceneEntrance(this);
    this.createCornerMascot();
    this.createBackButton();
    this.createProgressDots(ROUND_COUNT);
    this.createSpokenInstruction(RULE);

    this.buildAuthoring();
    this.rounds = buildPlaythrough(getAdaptiveBandShift("repeat-machine"), this.rng);
    this.roundIndex = 0;
    this.inputLocked = false;
    this.renderRound();
    this.registerShutdownCleanup();
  }

  protected totalRounds(): number {
    return this.rounds.length || ROUND_COUNT;
  }

  protected gameId(): GameId {
    return "repeat-machine";
  }

  /** No single tapped card decides the round: Go does, after a replay. */
  protected isChoiceCorrect(): boolean {
    return false;
  }

  /** Builds the four move cards, three count cards and Go, once per visit. */
  private buildAuthoring(): void {
    // A revisit must not stack a second set of cards over the first one.
    this.actionRects.length = 0;
    this.countRects.length = 0;
    MOVE_ACTIONS.forEach((action, index) => {
      const { x, y } = actionPoint(index);
      const rect = this.add.rectangle(x, y, ACTION_SIZE, ACTION_SIZE, this.CARD_BG_COLOR);
      rect.setStrokeStyle(this.OUTLINE_WIDTH, this.OUTLINE_COLOR, 0.8);
      rect.setInteractive();
      rect.on("pointerdown", () => this.tapAction(index));
      attachPressFeedback(rect);
      this.add
        .text(x, y, ACTION_LABELS[action], {
          fontFamily: "Arial, sans-serif",
          fontSize: "30px",
          color: "#2d3748",
        })
        .setOrigin(0.5);
      this.actionRects.push(rect);
    });

    for (let index = 0; index < 3; index++) {
      const { x, y } = countPoint(index);
      const rect = this.add.rectangle(x, y, COUNT_SIZE, COUNT_SIZE, 0xfefcbf);
      rect.setStrokeStyle(this.OUTLINE_WIDTH, this.OUTLINE_COLOR, 0.8);
      rect.setInteractive();
      rect.on("pointerdown", () => this.tapCount(index + 2));
      attachPressFeedback(rect);
      this.add
        .text(x, y, String(index + 2), {
          fontFamily: "Arial, sans-serif",
          fontSize: "36px",
          color: "#2d3748",
        })
        .setOrigin(0.5);
      this.countRects.push(rect);
    }

    // The machine speaks its replay through a bubble the count cards sit below.
    const bubble = this.add.image(MACHINE_X + 168, MACHINE_Y - 76, "bubble");
    bubble.setDisplaySize(72, 72);

    const go = this.add.rectangle(GO_X, GO_Y, GO_HIT, GO_HIT, this.CARD_BG_COLOR);
    go.setStrokeStyle(this.OUTLINE_WIDTH, this.OUTLINE_COLOR, 1);
    go.setInteractive();
    go.on("pointerdown", () => this.run());
    attachPressFeedback(go);
  }

  /** Draws the target dots and the machine for the current round. */
  protected buildRoundContent(): void {
    const round = this.rounds[this.roundIndex];
    if (!round) return;

    this.program = { action: null, count: null };
    this.performed = [];
    this.running = false;
    this.solvedThisRound = false;
    this.wrongRuns = 0;
    this.wrongTaps = 0;
    this.hintLevel = 0;
    this.attempts = 1;
    this.lastScore = 0;

    for (let index = 0; index < round.target; index++) {
      const { x, y } = dotPoint(index, round.target);
      const dot = this.add.circle(x, y, DOT_RADIUS, 0xfefcbf);
      dot.setStrokeStyle(this.OUTLINE_WIDTH, this.OUTLINE_COLOR, 0.9);
      this.trackRoundObject(dot);
      this.dotCircles.push(dot);
    }

    const machine = this.add.rectangle(
      MACHINE_X,
      MACHINE_Y,
      MACHINE_WIDTH,
      MACHINE_HEIGHT,
      0xfefcbf,
    );
    machine.setStrokeStyle(this.OUTLINE_WIDTH, this.OUTLINE_COLOR, 1);
    this.machine = machine;
    this.trackRoundObject(machine);

    const face = this.add.graphics();
    face.setPosition(MACHINE_X, MACHINE_Y);
    this.face = face;
    this.trackRoundObject(face);
    this.drawFace("idle");
  }

  /** Releases the round's dots and machine, and cancels any pending replay. */
  protected clearRoundContent(): void {
    this.runToken += 1;
    this.running = false;
    this.performed = [];
    this.program = { action: null, count: null };
    this.solvedThisRound = false;
    this.wrongRuns = 0;
    this.wrongTaps = 0;
    this.hintLevel = 0;
    this.attempts = 1;
    this.lastScore = 0;
    this.dotCircles.length = 0;
    this.machine = undefined;
    this.face = undefined;
    for (const rect of this.actionRects)
      rect.setStrokeStyle(this.OUTLINE_WIDTH, this.OUTLINE_COLOR, 0.8);
    for (const rect of this.countRects)
      rect.setStrokeStyle(this.OUTLINE_WIDTH, this.OUTLINE_COLOR, 0.8);
  }

  /** Read-only state for the browser journey (FR-15). */
  e2eRepeatMachine(): E2ERepeatMachineState {
    const round = this.rounds[this.roundIndex];
    const actions: E2ERepeatMachineChoice[] = MOVE_ACTIONS.map((action, index) => ({
      index,
      action,
      ...actionPoint(index),
    }));
    const counts: E2ERepeatMachineCount[] = [2, 3, 4].map((count, index) => ({
      index,
      count,
      ...countPoint(index),
    }));
    return {
      round: this.roundIndex,
      target: round?.target ?? 2,
      actions: round?.actions ?? MOVE_ACTIONS,
      actionOptions: actions,
      countOptions: counts,
      program: { ...this.program },
      performed: [...this.performed],
      dots: this.dotCircles.map((_, index) => dotPoint(index, round?.target ?? 2)),
      solved: this.solvedThisRound,
      wrongRuns: this.wrongRuns,
      wrongTaps: this.wrongTaps,
      hintLevel: this.hintLevel,
      attempts: this.attempts,
      lastScore: this.lastScore,
      go: { x: GO_X, y: GO_Y },
      machine: { x: MACHINE_X, y: MACHINE_Y },
    };
  }

  /** Chooses a move; the authored count, if any, stays as it was. */
  private tapAction(index: number): void {
    if (this.inputLocked || this.running) return;
    const action = MOVE_ACTIONS[index];
    if (!action) return;
    this.program = { ...this.program, action };
    this.highlight(this.actionRects, index, this.SUCCESS_COLOR);
  }

  /** Chooses a repeat count from 2 to 4; the chosen move stays as it was. */
  private tapCount(count: number): void {
    if (this.inputLocked || this.running) return;
    if (!isValidCount(count)) return;
    this.program = { ...this.program, count };
    this.highlight(this.countRects, count - 2, this.SUCCESS_COLOR);
  }

  /** Marks one selected card without changing any of the others' size. */
  private highlight(
    rects: readonly Phaser.GameObjects.Rectangle[],
    selected: number,
    color: number,
  ): void {
    rects.forEach((rect, index) => {
      rect.setStrokeStyle(
        index === selected ? 6 : this.OUTLINE_WIDTH,
        color,
        index === selected ? 1 : 0.8,
      );
    });
  }

  /**
   * Runs the authored program. The rule module decides whether it is valid,
   * how many move+sound pairs it performs, and whether the count matched; the
   * scene only times what it returns.
   */
  private run(): void {
    if (this.inputLocked || this.running) return;
    const round = this.rounds[this.roundIndex];
    if (!round) return;

    const result = runProgram(round, this.program, this.attempts);
    if (!result.valid) {
      // A missing field is guidance, not a scored mistake.
      speakSentence(result.issue ?? RULE, getSettings().sfxEnabled);
      return;
    }

    this.running = true;
    this.runToken += 1;
    const token = this.runToken;
    this.performed = result.performed;
    this.lastScore = scoreFor(result);
    this.drawFace("working");

    result.performed.forEach((action, index) => {
      this.time.delayedCall(motionDuration(STEP_MS, STEP_REDUCED_MS) * (index + 1), () => {
        if (token !== this.runToken) return;
        this.playStep(result, index, action);
        if (index === result.performed.length - 1) this.finishRun(result);
      });
    });
  }

  /** One visible dot and mascot move+sound pair of the replay. */
  private playStep(result: RunResult, index: number, action: MoveAction): void {
    const dot = this.dotCircles[index];
    dot?.setFillStyle(index < result.target ? this.SUCCESS_COLOR : 0xfc8181, 1);
    this.playMove(action);
    this.audioManager.playSFX("pop");

    this.face?.clear();
    for (let step = 0; step < MAX_STEPS; step++) {
      const x = (step - (MAX_STEPS - 1) / 2) * 56;
      if (step <= index) {
        this.face?.fillStyle(this.SUCCESS_COLOR, 1);
      } else {
        this.face?.fillStyle(this.OUTLINE_COLOR, 0.25);
      }
      this.face?.fillCircle(x, 0, 12);
    }
  }

  /** Uses the mascot's existing moves; no new animation or sound is introduced. */
  private playMove(action: MoveAction): void {
    switch (action) {
      case "wave":
        this.mascot?.wave();
        break;
      case "nod":
        this.mascot?.nod();
        break;
      case "cheer":
        this.mascot?.cheer();
        break;
      case "curious":
        this.mascot?.curious();
        break;
    }
  }

  /** Settles a finished replay: match advances, mismatch stays for a retry. */
  private finishRun(result: RunResult): void {
    const round = this.rounds[this.roundIndex];
    if (!round) return;
    this.running = false;

    if (result.won) {
      this.solvedThisRound = true;
      this.drawFace("happy");
      this.resolveWholeRound(true);
      return;
    }

    this.wrongRuns += 1;
    this.wrongTaps += 1;
    this.attempts = nextAttempt(this.attempts);
    this.hintLevel = this.wrongRuns >= 2 ? 2 : 1;
    this.drawFace("puzzled");
    this.applyHint();
    // No lock: the child can re-author the moment the replay stops.
    this.reactWrong([this.machine, this.face].filter((obj) => obj !== undefined));
  }

  /** Points at the authored count and dotted target without solving for them. */
  private applyHint(): void {
    this.face?.lineStyle(6, 0xf4b942, 0.9);
    const selected = this.program.count === null ? -1 : this.program.count - 2;
    if (selected >= 0 && this.hintLevel === 1) {
      const { x, y } = countPoint(selected);
      this.face?.strokeRoundedRect(
        x - MACHINE_X - COUNT_SIZE / 2,
        y - MACHINE_Y - COUNT_SIZE / 2,
        COUNT_SIZE,
        COUNT_SIZE,
        16,
      );
    }
    if (this.hintLevel === 2) {
      const target = this.rounds[this.roundIndex]?.target ?? 2;
      this.dotCircles.forEach((dot, index) => {
        dot.setStrokeStyle(8, 0xf4b942, 1);
        dot.setPosition(dotPoint(index, target).x, DOT_Y);
      });
    }
  }

  /** Machine expression, drawn as eyes and a mouth from plain shapes. */
  private drawFace(mood: "idle" | "working" | "happy" | "puzzled"): void {
    const graphics = this.face;
    if (!graphics) return;
    graphics.clear();
    graphics.fillStyle(this.OUTLINE_COLOR, 1);
    graphics.fillCircle(-34, -12, 8);
    graphics.fillCircle(34, -12, 8);
    graphics.lineStyle(5, this.OUTLINE_COLOR, 1);
    graphics.beginPath();
    if (mood === "happy") {
      graphics.arc(0, 4, 26, 0.15 * Math.PI, 0.85 * Math.PI, false);
    } else if (mood === "puzzled") {
      graphics.moveTo(-26, 22);
      graphics.lineTo(26, 10);
    } else {
      graphics.moveTo(-24, 22);
      graphics.lineTo(24, 22);
    }
    graphics.strokePath();
  }

  /** The shared splash; the base then plays the chime, dot and advance. */
  protected override onCorrect(): void {
    createCompletionSplash(this, this.cameras.main.centerX, this.cameras.main.centerY);
  }
}
