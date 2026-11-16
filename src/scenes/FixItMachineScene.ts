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
  MAX_CARDS,
  ROUND_COUNT,
} from "../game/fixItMachineLogic";
import type { Rng } from "../game/random";
import type { GameId } from "../types";
import { createCompletionSplash } from "../utils/completionEffect";
import { motionDuration } from "../utils/motion";
import { attachPressFeedback } from "../utils/pressFeedback";
import { sceneEntrance } from "../utils/sceneTransitions";
import { speakSentence } from "../utils/speech";
import { getSettings } from "../utils/storage";
import { ChoiceRoundScene } from "./ChoiceRoundScene";

/** Spoken once when the game opens, and again on an empty Go. */
const RULE = "Find the wrong card and fix it.";

/** Cards: 96px with 12px gaps, so the hardest tape spans 528px (spec FR-2). */
const CARD_SIZE = 96;
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

/** Where the goal bubble and the machine stand, clear of tape, tray and Go. */
const GOAL_X = 236;
const GOAL_Y = 232;
const GOAL_SIZE = 132;
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

/**
 * The display objects that exist right now, in order. A round's cards and tray
 * images come and go, so every wiggle target goes through here rather than
 * carrying `null` into `reactWrong`.
 */
function present(
  ...targets: Array<Phaser.GameObjects.GameObject | null | undefined>
): Phaser.GameObjects.GameObject[] {
  const found: Phaser.GameObjects.GameObject[] = [];
  for (const target of targets) {
    if (target) found.push(target);
  }
  return found;
}

/** One card of the run, and the shortest it may take under reduced motion. */
const STEP_MS = 550;
const STEP_REDUCED_MS = 120;

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
 * per round by `ChoiceRoundScene`'s teardown.
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
  /** The ring drawn around the card that stopped the last run. */
  private mismatch?: Phaser.GameObjects.Graphics;
  /** The soft divergence band level 1 draws, with the machine's arm. */
  private hintBand?: Phaser.GameObjects.Graphics;

  constructor(rng: Rng = Math.random) {
    super("FixItMachine", rng);
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

    this.buildTapeSlots();
    this.buildTray();
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

    const goal = this.add.image(GOAL_X, GOAL_Y, `machine_${round.toy}`);
    goal.setDisplaySize(GOAL_SIZE, GOAL_SIZE);
    this.goal = goal;
    this.trackRoundObject(goal);

    const bubble = this.add.graphics();
    this.trackRoundObject(bubble);
    bubble.fillStyle(0xfefcbf, 1);
    bubble.fillRoundedRect(
      GOAL_X - GOAL_SIZE / 2 - 10,
      GOAL_Y - GOAL_SIZE / 2 - 10,
      GOAL_SIZE + 20,
      GOAL_SIZE + 20,
      28,
    );
    bubble.lineStyle(this.OUTLINE_WIDTH, this.OUTLINE_COLOR, 0.6);
    bubble.strokeRoundedRect(
      GOAL_X - GOAL_SIZE / 2 - 10,
      GOAL_Y - GOAL_SIZE / 2 - 10,
      GOAL_SIZE + 20,
      GOAL_SIZE + 20,
      28,
    );
    bubble.setDepth(goal.depth - 1);

    const machine = this.add.image(MACHINE_X, MACHINE_Y, "machine_idle");
    machine.setDisplaySize(MACHINE_SIZE, MACHINE_SIZE);
    this.machine = machine;
    this.trackRoundObject(machine);

    this.redrawTape();
    this.closeTray();
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
    this.mismatch = undefined;
    this.hintBand = undefined;
    this.dropCardImages();
    this.dropTrayImages();
    for (const [index, rect] of this.cardRects.entries()) {
      rect.setAlpha(0.18);
      rect.setAngle(0);
      rect.y = this.tapePoint(index).y;
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
        ...this.tapePoint(index),
      })),
      tray: this.trayActions.map((action, index) => ({
        index,
        action,
        ...this.trayPoint(index),
      })),
      go: { x: GO_X, y: GO_Y },
      machine: { x: machine?.x ?? MACHINE_X, y: machine?.y ?? MACHINE_Y },
      goal: { x: goal?.x ?? GOAL_X, y: goal?.y ?? GOAL_Y },
    };
  }

  /** Centre of one tape slot, from the same constants that drew it. */
  private tapePoint(index: number): { x: number; y: number } {
    return {
      x: TAPE_CENTER_X + (index - (MAX_CARDS - 1) / 2) * CARD_STEP,
      y: TAPE_Y,
    };
  }

  /** Centre of one tray slot, from the same constants that drew it. */
  private trayPoint(index: number): { x: number; y: number } {
    return { x: TAPE_CENTER_X + (index - 1) * TRAY_STEP, y: TRAY_Y };
  }

  /** Five tape slots, built once per visit; contents are redrawn per round. */
  private buildTapeSlots(): void {
    // Scene instances are reused across visits: drop the previous visit's chrome.
    this.cardRects.length = 0;
    this.cardImages.length = 0;
    for (let index = 0; index < MAX_CARDS; index++) {
      const { x, y } = this.tapePoint(index);
      const rect = this.add.rectangle(x, y, CARD_SIZE, CARD_SIZE, this.CARD_BG_COLOR);
      rect.setStrokeStyle(this.OUTLINE_WIDTH, this.OUTLINE_COLOR, 0.8);
      rect.setInteractive();
      rect.on("pointerdown", () => this.tapCard(index));
      attachPressFeedback(rect);

      this.cardRects.push(rect);
      this.cardImages.push(null);
    }
  }

  /** Three tray slots, built once per visit and shown only when diagnosing. */
  private buildTray(): void {
    this.trayRects.length = 0;
    this.trayImages = [];
    for (let index = 0; index < 3; index++) {
      const { x, y } = this.trayPoint(index);
      const rect = this.add.rectangle(x, y, CARD_SIZE, CARD_SIZE, 0xfefcbf);
      rect.setStrokeStyle(this.OUTLINE_WIDTH, this.OUTLINE_COLOR, 0.8);
      rect.setInteractive();
      rect.on("pointerdown", () => this.tapCandidate(index));
      attachPressFeedback(rect);
      rect.setVisible(false);

      this.trayRects.push(rect);
      this.trayImages.push(null);
    }
  }

  /**
   * The run button: a play triangle on a 112px card, the phase's touch size
   * (FR-5 / NFR-1). The triangle is a path rather than `fillTriangle`, the same
   * choice Robot Path's arrows make, so the scene tests can see the drawing.
   */
  private buildGo(): void {
    const go = this.add.rectangle(GO_X, GO_Y, GO_HIT, GO_HIT, this.CARD_BG_COLOR);
    go.setStrokeStyle(this.OUTLINE_WIDTH, this.OUTLINE_COLOR, 1);
    go.setInteractive();
    go.on("pointerdown", () => this.run());
    attachPressFeedback(go);

    const glyph = this.add.graphics();
    glyph.fillStyle(this.OUTLINE_COLOR, 1);
    glyph.beginPath();
    glyph.moveTo(-18, -24);
    glyph.lineTo(26, 0);
    glyph.lineTo(-18, 24);
    glyph.fillPath();
    glyph.setPosition(GO_X, GO_Y);
  }

  /** Redraws the tape's cards to match the tape on screen. */
  private redrawTape(): void {
    this.dropCardImages();
    this.matchRing();
    this.clearHintBand();
    for (let index = 0; index < this.cardRects.length; index++) {
      const rect = this.cardRects[index];
      rect.setAngle(0);
      rect.y = this.tapePoint(index).y;
      const action = this.tape[index];
      if (!action) {
        rect.setAlpha(0.18);
        continue;
      }
      rect.setAlpha(1);
      const image = this.add.image(rect.x, rect.y, `machine_${action}`);
      image.setDisplaySize(ICON_SIZE, ICON_SIZE);
      this.cardImages[index] = this.trackRoundObject(image);
    }
  }

  /** Opens the tray on the round's three candidates. */
  private openTray(): void {
    const round = this.rounds[this.roundIndex];
    if (!round || this.trayOpen) return;
    this.trayOpen = true;
    this.trayActions = [...round.candidates];
    this.dropTrayImages();
    this.trayActions.forEach((action, index) => {
      const rect = this.trayRects[index];
      rect.setVisible(true);
      rect.setAngle(0);
      const { x, y } = this.trayPoint(index);
      const image = this.add.image(x, y, `machine_${action}`);
      image.setDisplaySize(ICON_SIZE, ICON_SIZE);
      this.trayImages[index] = this.trackRoundObject(image);
    });
  }

  /** Closes the tray and clears what it was offering. */
  private closeTray(): void {
    this.trayOpen = false;
    this.trayActions = [];
    this.dropTrayImages();
    for (const rect of this.trayRects) {
      rect.setVisible(false);
      rect.setAngle(0);
    }
  }

  /** Clears the mismatch ring left by the last stopped run. */
  private matchRing(): void {
    if (this.mismatch && !this.mismatch.isDestroyed) this.mismatch.destroy();
    this.mismatch = undefined;
  }

  private dropCardImages(): void {
    for (let index = 0; index < this.cardImages.length; index++) {
      const image = this.cardImages[index];
      if (image && !image.isDestroyed) image.destroy();
      this.cardImages[index] = null;
    }
  }

  private dropTrayImages(): void {
    for (let index = 0; index < this.trayImages.length; index++) {
      const image = this.trayImages[index];
      if (image && !image.isDestroyed) image.destroy();
      this.trayImages[index] = null;
    }
  }

  /** A tape card tap: name the wrong card to diagnose, anything else bounces. */
  private tapCard(index: number): void {
    if (this.inputLocked || this.running) return;
    const round = this.rounds[this.roundIndex];
    if (!round) return;
    if (index >= this.tape.length) return;

    if (isWrongCard(round, index)) {
      // Naming the bug card is the round's correct diagnosis (spec FR-10).
      this.recordCorrect();
      this.openTray();
      return;
    }

    this.noteWrongTap();
    this.reactWrong(present(this.cardRects[index], this.cardImages[index]), () =>
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
      this.closeTray();
      this.redrawTape();
      return;
    }

    this.noteWrongTap();
    this.reactWrong(present(this.trayRects[index], this.trayImages[index]), () =>
      this.trayRects[index].setAngle(0),
    );
  }

  /** Counts a tap that missed, and offers the hint its count earns (FR-11). */
  private noteWrongTap(): void {
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
    if (level === 1) this.drawHintBand();
    if (level === 2) this.liftBugCard();
    if (level === 3) this.pulseCorrectCandidate();
  }

  /**
   * Level 1 (two missed taps): a soft band from the first card through the
   * wrong one, and the machine's arm pointing at the band's end.
   */
  private drawHintBand(): void {
    this.clearHintBand();
    const round = this.rounds[this.roundIndex];
    if (!round || round.bugIndex < 0) return;

    const first = this.tapePoint(0);
    const bug = this.tapePoint(round.bugIndex);
    const x = first.x - CARD_SIZE / 2 - HINT_PAD;
    const y = first.y - CARD_SIZE / 2 - HINT_PAD;
    const width = bug.x - first.x + CARD_SIZE + HINT_PAD * 2;
    const height = CARD_SIZE + HINT_PAD * 2;

    const band = this.add.graphics();
    this.trackRoundObject(band);
    band.fillStyle(HINT_COLOR, 0.16);
    band.fillRoundedRect(x, y, width, height, 20);
    band.lineStyle(4, HINT_COLOR, 0.7);
    band.strokeRoundedRect(x, y, width, height, 20);

    // The arm: one line from the machine's edge to the band's end, with a
    // head, so the direction reads as shape rather than as motion.
    const tipX = bug.x;
    const tipY = bug.y - CARD_SIZE / 2 - HINT_PAD - 8;
    band.lineStyle(6, this.OUTLINE_COLOR, 0.55);
    band.beginPath();
    band.moveTo(MACHINE_X - MACHINE_SIZE / 2, MACHINE_Y + MACHINE_SIZE / 2 - 30);
    band.lineTo(tipX, tipY);
    band.strokePath();
    band.fillStyle(this.OUTLINE_COLOR, 0.75);
    band.fillCircle(tipX, tipY, 8);

    this.hintBand = band;
  }

  /** Level 2 (four missed taps): the wrong card lifts and pulses once. */
  private liftBugCard(): void {
    const index = this.rounds[this.roundIndex]?.bugIndex ?? -1;
    const rect = this.cardRects[index];
    if (!rect) return;

    const lifted = this.tapePoint(index).y - HINT_LIFT;
    const duration = motionDuration(180, 120);
    this.tweens.add({ targets: rect, y: lifted, duration });
    const image = this.cardImages[index];
    if (image) this.tweens.add({ targets: image, y: lifted, duration });
    this.pulse(rect);
  }

  /** Level 3 (six missed taps): the tool the job needs pulses once. */
  private pulseCorrectCandidate(): void {
    if (!this.trayOpen) return;
    const round = this.rounds[this.roundIndex];
    if (!round) return;
    const index = this.trayActions.indexOf(correctAction(round));
    const rect = index >= 0 ? this.trayRects[index] : undefined;
    if (rect) this.pulse(rect);
  }

  /** Drops the level-1 band; a redraw, a repair or a new round clears it. */
  private clearHintBand(): void {
    if (this.hintBand && !this.hintBand.isDestroyed) this.hintBand.destroy();
    this.hintBand = undefined;
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
        this.pulse(this.cardRects[index]);
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
    this.markMismatch(round);
    // No lock: the child can diagnose the moment the run stops, so the funny
    // result is never a penalty and never a wait.
    this.reactWrong(present(this.machine));
  }

  /** Rings the card that did not belong, so the wrong step is visible. */
  private markMismatch(round: FixItRound): void {
    const { x, y } = this.tapePoint(round.bugIndex);
    const ring = this.add.graphics();
    ring.lineStyle(6, 0xe53e3e, 1);
    ring.strokeRoundedRect(
      x - CARD_SIZE / 2 - 6,
      y - CARD_SIZE / 2 - 6,
      CARD_SIZE + 12,
      CARD_SIZE + 12,
      20,
    );
    this.mismatch = this.trackRoundObject(ring);
  }

  /** The shared splash, then the base's chime, dot and advance. */
  protected override onCorrect(): void {
    createCompletionSplash(this, this.cameras.main.centerX, this.cameras.main.centerY);
  }

  /** A brief scale pop on one object; every card and slot hint goes through it. */
  private pulse(target: Phaser.GameObjects.GameObject): void {
    this.tweens.add({
      targets: target,
      scaleX: motionDuration(1.16, 1.06),
      scaleY: motionDuration(1.16, 1.06),
      duration: motionDuration(240, 150),
      yoyo: true,
      repeat: 1,
    });
  }
}
