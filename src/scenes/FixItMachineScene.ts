import type Phaser from "phaser";
import type { E2EFixItMachineState } from "../game/e2eBridge";
import { preloadFixItMachineArt } from "../game/fixItMachineArt";
import {
  type ActionIcon,
  applyRepair,
  buildPlaythrough,
  correctAction,
  type FixItRound,
  hintLevelFor,
  isSolved,
  isWrongCard,
  ROUND_COUNT,
} from "../game/fixItMachineLogic";
import type { Rng } from "../game/random";
import type { GameId } from "../types";
import { createCompletionSplash } from "../utils/completionEffect";
import { motionDuration } from "../utils/motion";
import { sceneEntrance } from "../utils/sceneTransitions";
import { speakSentence } from "../utils/speech";
import { getSettings } from "../utils/storage";
import { ChoiceRoundScene } from "./ChoiceRoundScene";
import {
  buildGo,
  buildTapeSlots,
  buildTray,
  closeTray,
  drawHintBand,
  dropCardImages,
  dropTrayImages,
  type FixItMachineViewState,
  liftBugCard,
  markMismatch,
  openTray,
  present,
  pulse,
  pulseCorrectCandidate,
  RULE,
  redrawTape,
  STEP_MS,
  STEP_REDUCED_MS,
  tapePoint,
  trayPoint,
} from "./fixItMachineView";

/**
 * Fix-It Machine — Game 24.
 *
 * The machine runs the tape card by card and produces a funny result at the
 * card that does not belong there. The child taps that card, picks the tool it
 * should have been from a three-slot tray, and presses Go again to watch the
 * toy come out right.
 *
 * The workshop's rules are not here: `fixItMachineLogic` owns the six rounds,
 * the one wrong card, the tray candidates and the solve check, so this scene
 * only draws and times what those functions return. Chrome (tape slots, tray,
 * Go) is built once per visit; the cards, tray contents and machine are rebuilt
 * per round by `ChoiceRoundScene`'s teardown. The drawing helpers and layout
 * constants live in `fixItMachineView.ts`; this class orchestrates them and
 * holds the round state the browser bridge publishes.
 */
export class FixItMachineScene extends ChoiceRoundScene {
  private rounds: readonly FixItRound[] = [];
  /** The tape on screen, which the repair replaces in place. */
  private tape: ActionIcon[] = [];
  private readonly cardRects: Phaser.GameObjects.Rectangle[] = [];
  private cardImages: Array<Phaser.GameObjects.Image | null> = [];
  private readonly trayRects: Phaser.GameObjects.Rectangle[] = [];
  private trayImages: Array<Phaser.GameObjects.Image | null> = [];
  /** What the open tray offers, in draw order; empty while it is shut. */
  private trayActions: ActionIcon[] = [];
  private trayOpen = false;
  private machine?: Phaser.GameObjects.Image;
  private goal?: Phaser.GameObjects.Image;
  /** Guards delayed run steps against a round torn down underneath them. */
  private runToken = 0;
  /** True while the tape is playing; every tap stays inert until it stops. */
  private running = false;
  /** Taps that did not name the wrong card, or named the wrong tool. */
  private wrongTaps = 0;
  /** The visual help this run of taps has earned (spec FR-11). */
  private hintLevel: 0 | 1 | 2 | 3 = 0;
  /** Runs this round that stopped at the wrong card — what the bridge publishes. */
  private failedRuns = 0;
  /** Whether the toy came out right this round. */
  private solvedThisRound = false;
  constructor(rng: Rng = Math.random) {
    super("FixItMachine", rng);
  }

  /** Structural view the drawing helpers use; no state leaves the scene. */
  private get view(): FixItMachineViewState {
    return this as unknown as FixItMachineViewState;
  }

  preload(): void {
    preloadFixItMachineArt(this);
  }

  create(): void {
    sceneEntrance(this);
    this.createCornerMascot();
    this.createBackButton();
    this.createProgressDots(ROUND_COUNT);
    this.createSpokenInstruction(RULE);

    buildTapeSlots(this.view, (index) => this.tapCard(index));
    buildTray(this.view, (index) => this.tapCandidate(index));
    buildGo(this.view, () => this.run());

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
    return "fix-it-machine";
  }

  /** The tape is the answer; no single tapped card decides the round. */
  protected isChoiceCorrect(): boolean {
    return false;
  }

  /** Draws the goal, the machine and the tape for the current round. */
  protected buildRoundContent(): void {
    const round = this.rounds[this.roundIndex];
    if (!round) return;

    this.tape = [...round.tape];
    this.wrongTaps = 0;
    this.hintLevel = 0;
    this.failedRuns = 0;
    this.solvedThisRound = false;
    this.trayOpen = false;
    this.running = false;

    const goal = this.add.image(236, 232, `machine_${round.toy}`);
    goal.setDisplaySize(132, 132);
    this.goal = goal;
    this.trackRoundObject(goal);

    const bubble = this.add.graphics();
    this.trackRoundObject(bubble);
    bubble.fillStyle(0xfefcbf, 1);
    bubble.fillRoundedRect(236 - 132 / 2 - 10, 232 - 132 / 2 - 10, 132 + 20, 132 + 20, 28);
    bubble.lineStyle(this.OUTLINE_WIDTH, this.OUTLINE_COLOR, 0.6);
    bubble.strokeRoundedRect(236 - 132 / 2 - 10, 232 - 132 / 2 - 10, 132 + 20, 132 + 20, 28);
    bubble.setDepth(goal.depth - 1);

    const machine = this.add.image(664, 320, "machine_idle");
    machine.setDisplaySize(232, 232);
    this.machine = machine;
    this.trackRoundObject(machine);

    redrawTape(this.view);
    closeTray(this.view);
  }

  /** Releases the round's cards, tray and machine. */
  protected clearRoundContent(): void {
    this.runToken += 1;
    this.running = false;
    this.tape = [];
    this.wrongTaps = 0;
    this.hintLevel = 0;
    this.failedRuns = 0;
    this.solvedThisRound = false;
    this.trayOpen = false;
    this.trayActions = [];
    this.machine = undefined;
    this.goal = undefined;
    this.view.mismatch = undefined;
    this.view.hintBand = undefined;
    dropCardImages(this.view);
    dropTrayImages(this.view);
    for (const [index, rect] of this.cardRects.entries()) {
      rect.setAlpha(0.18);
      rect.setAngle(0);
      rect.y = tapePoint(index).y;
    }
    for (const rect of this.trayRects) {
      rect.setVisible(false);
      rect.setAngle(0);
    }
  }

  /**
   * Publishes the round, the tape and the live points for the browser suite
   * (FR-15). Read-only: every field is copied from this scene's own state at
   * call time, so a journey taps what the child is looking at.
   */
  e2eFixItMachine(): E2EFixItMachineState {
    const round = this.rounds[this.roundIndex];
    const machine = this.machine;
    const goal = this.goal;
    return {
      round: this.roundIndex,
      solution: round ? [...round.program] : [],
      tape: [...this.tape],
      bugIndex: round ? round.bugIndex : -1,
      solved: this.solvedThisRound,
      wrongTaps: this.wrongTaps,
      hintLevel: this.hintLevel,
      failedRuns: this.failedRuns,
      trayOpen: this.trayOpen,
      cards: this.tape.map((_, index) => ({
        index,
        ...tapePoint(index),
      })),
      tray: this.trayActions.map((action, index) => ({
        index,
        action,
        ...trayPoint(index),
      })),
      go: { x: 896, y: 664 },
      machine: { x: machine?.x ?? 664, y: machine?.y ?? 320 },
      goal: { x: goal?.x ?? 236, y: goal?.y ?? 232 },
    };
  }

  /**
   * A tape card tap: name the wrong card to diagnose, anything else bounces.
   *
   * A tap on a card that is not the wrong one is how a child *finds* the fault,
   * so it is recorded as a probe — counted for the parent, never scored. The
   * tray is where answering happens, and the hint ladder still counts the miss.
   */
  private tapCard(index: number): void {
    if (this.inputLocked || this.running) return;
    const round = this.rounds[this.roundIndex];
    if (!round) return;
    if (index >= this.tape.length) return;

    if (isWrongCard(round, index)) {
      // Naming the bug card is the round's correct diagnosis (spec FR-10).
      this.recordCorrect();
      openTray(this.view);
      return;
    }

    this.noteMissedTap();
    this.reactProbe(present(this.cardRects[index], this.cardImages[index]), () =>
      this.cardRects[index].setAngle(0),
    );
  }

  /** A tray tap: the right tool repairs the card, anything else bounces. */
  private tapCandidate(index: number): void {
    if (this.inputLocked || !this.trayOpen) return;
    const round = this.rounds[this.roundIndex];
    const action = this.trayActions[index];
    if (!round || !action) return;

    if (action === correctAction(round)) {
      // Choosing the tool the job needs is the second correct result (FR-10).
      this.recordCorrect();
      this.tape = [...applyRepair(round, action)];
      closeTray(this.view);
      redrawTape(this.view);
      return;
    }

    this.noteMissedTap();
    this.reactWrong(present(this.trayRects[index], this.trayImages[index]), () =>
      this.trayRects[index].setAngle(0),
    );
  }

  /**
   * Counts a tap that missed — a probe or a wrong answer alike — and offers the
   * hint its count earns (FR-11). Being stuck is the same whether the miss was
   * scored or not, so the ladder reads one counter.
   */
  private noteMissedTap(): void {
    this.wrongTaps += 1;
    const level = hintLevelFor(this.wrongTaps);
    if (level <= this.hintLevel) return;
    this.hintLevel = level;
    this.applyHint(level);
  }

  /**
   * Visual help only, least to most (spec FR-11): the band shows where the
   * tape went wrong, the card then lifts out of it, and at the last level
   * the tool that belongs pulses in the open tray. A hint never places a
   * card and never taps for the child.
   */
  private applyHint(level: 0 | 1 | 2 | 3): void {
    if (level === 1) drawHintBand(this.view);
    if (level === 2) liftBugCard(this.view);
    if (level === 3) pulseCorrectCandidate(this.view);
  }

  /** Plays the tape: one card at a time, then either solve or funny failure. */
  private run(): void {
    if (this.inputLocked || this.running) return;
    const round = this.rounds[this.roundIndex];
    if (!round) return;

    if (this.tape.length === 0) {
      speakSentence(RULE, getSettings().sfxEnabled);
      return;
    }

    // The run gates taps through its own flag, not the base's input lock:
    // `resolveWholeRound` refuses to fire while `inputLocked` is set, and this
    // scene is the one deciding when a run is over.
    this.running = true;
    this.runToken += 1;
    const token = this.runToken;
    this.machine?.setTexture("machine_working");

    const total = this.tape.length;
    for (let index = 0; index < total; index++) {
      this.time.delayedCall(motionDuration(STEP_MS, STEP_REDUCED_MS) * (index + 1), () => {
        if (token !== this.runToken) return;
        pulse(this.view, this.cardRects[index]);
        if (index === total - 1) this.finishRun();
      });
    }
  }

  /** Settles a finished run: the toy is right, or the machine shrugs. */
  private finishRun(): void {
    const round = this.rounds[this.roundIndex];
    if (!round) return;
    this.running = false;

    if (isSolved(round, this.tape)) {
      this.solvedThisRound = true;
      this.machine?.setTexture("machine_happy");
      this.resolveWholeRound(true);
      return;
    }

    this.failedRuns += 1;
    this.machine?.setTexture("machine_puzzled");
    markMismatch(this.view, round);
    // No lock: the child can diagnose the moment the run stops, so the funny
    // result is never a penalty and never a wait.
    this.reactWrong(present(this.machine));
  }

  /** The shared splash, then the base's chime, dot and advance. */
  protected override onCorrect(): void {
    createCompletionSplash(this, this.cameras.main.centerX, this.cameras.main.centerY);
  }
}
