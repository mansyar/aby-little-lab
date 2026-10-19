import Phaser from "phaser";
import type { GameId } from "../types";
import { isReducedMotion, motionDuration } from "../utils/motion";
import { attachPressFeedback } from "../utils/pressFeedback";
import { GameSceneBase } from "./GameSceneBase";

/** Minimum edge of a choice card's hit area (px) — the product touch-target floor. */
const MIN_HIT_AREA = 96;

/** How long the correct card keeps its success fill before reverting (ms). */
const SUCCESS_FLASH_DURATION = 250;

/**
 * Shared round lifecycle for the tap-a-choice games.
 *
 * The base owns everything those games do identically: tearing the previous
 * round's display objects down before the next one is built, choice cards with
 * the product's 96 px hit area and press feedback, the correct path (input
 * lock, chime, answer recording, mascot cheer, progress dot, delayed advance)
 * and the no-fail wrong path (soft tone, answer recording, mascot nod,
 * reduced-motion-aware wiggle).
 *
 * Subclasses supply only their round content and, optionally, the extras that
 * should move with a wrong choice. They must track every display object they
 * create with {@link trackRoundObject} so the base can destroy it, and they
 * call {@link renderRound} once their playthrough is ready.
 */
export abstract class ChoiceRoundScene extends GameSceneBase {
  /** Interactive choice cards of the current round, in option order. */
  protected choiceTargets: Phaser.GameObjects.Rectangle[] = [];

  /** Index of the round being played (also the progress-dot index). */
  protected roundIndex = 0;

  /** Every display object the current round owns, destroyed by {@link clearRound}. */
  private roundObjects: Phaser.GameObjects.GameObject[] = [];

  /** Total number of rounds in this scene's playthrough. */
  protected abstract totalRounds(): number;

  /** Game id used for the completion record and the sticker key. */
  protected abstract gameId(): GameId;

  /** Renders the current round's prompts and cues. */
  protected abstract buildRoundContent(): void;

  /** Returns true when the tapped choice is the round's correct answer. */
  protected abstract isChoiceCorrect(index: number): boolean;

  /** Resets the subclass's per-round bookkeeping. */
  protected abstract clearRoundContent(): void;

  /**
   * Display objects that should wiggle with a wrong choice, besides the card
   * itself (typically the card's own dot-group).
   */
  protected wiggleTargets(_index: number): Phaser.GameObjects.GameObject[] {
    return [];
  }

  /** Optional per-game correct-answer extras, run after the shared feedback. */
  protected onCorrect(_index: number): void {}

  /** Optional per-game wrong-answer extras, run after the shared feedback. */
  protected onWrong(_index: number): void {}

  /**
   * Renders a round: destroys the objects the previous round owned, then asks
   * the subclass to build its content.
   */
  protected renderRound(): void {
    this.clearRound();
    this.buildRoundContent();
  }

  /** Destroys every object tracked for the current round. */
  protected clearRound(): void {
    for (const obj of this.roundObjects) {
      obj.destroy();
    }
    this.roundObjects.length = 0;
    this.choiceTargets.length = 0;
    this.clearRoundContent();
  }

  /** Registers a round display object for destruction at the next teardown. */
  protected trackRoundObject<T extends Phaser.GameObjects.GameObject>(obj: T): T {
    this.roundObjects.push(obj);
    return obj;
  }

  /**
   * Creates one interactive choice card at `(x, y)` with a hit area no smaller
   * than the 96 px touch floor and the shared press feedback. The gameplay
   * handler is registered before the squish so the tap is read first.
   */
  protected createChoiceTarget(
    x: number,
    y: number,
    size: number,
    choiceIndex: number,
  ): Phaser.GameObjects.Rectangle {
    const hitAreaSize = Math.max(size, MIN_HIT_AREA);
    const card = this.add.rectangle(x, y, size, size, this.CARD_BG_COLOR);
    card.setStrokeStyle(this.OUTLINE_WIDTH, this.OUTLINE_COLOR, 1);
    card.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(0, 0, hitAreaSize, hitAreaSize),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
    });
    card.on("pointerdown", () => this.handleChoice(choiceIndex));
    attachPressFeedback(card);

    this.choiceTargets.push(card);
    return this.trackRoundObject(card);
  }

  /** Routes a tap: correct answers advance the round, wrong ones only wiggle. */
  private handleChoice(index: number): void {
    // Locked while a correct answer is being celebrated, so one tap cannot
    // advance two rounds.
    if (this.inputLocked) return;
    if (this.isChoiceCorrect(index)) {
      this.handleCorrect(index);
    } else {
      this.handleIncorrect(index);
    }
  }

  /**
   * Handles a correct answer: the chime plays, the answer is recorded, the
   * mascot cheers, the tapped card flashes success, the progress dot pops, and
   * the next round starts after the shared delay (completion after the last).
   */
  private handleCorrect(index: number): void {
    this.inputLocked = true;
    this.audioManager.playCorrect();
    this.recordCorrect();
    this.mascot?.cheer();
    this.fillProgressDot(this.roundIndex);

    this.flashChoice(index);
    this.onCorrect(index);

    this.time.delayedCall(this.NEXT_ROUND_DELAY, () => {
      this.advanceRound();
    });
  }

  /** Flashes the tapped card in the success colour, reverting it after 250 ms. */
  private flashChoice(index: number): void {
    const card = this.choiceTargets[index];
    card.setFillStyle(this.SUCCESS_COLOR, 1);
    this.time.delayedCall(SUCCESS_FLASH_DURATION, () => {
      // The round may be torn down between the flash and its revert.
      if (!card.isDestroyed) card.setFillStyle(this.CARD_BG_COLOR, 1);
    });
  }

  /** Moves to the next round, or completes the game after the last one. */
  private advanceRound(): void {
    this.roundIndex++;
    if (this.roundIndex >= this.totalRounds()) {
      this.completeGame(this.gameId());
    } else {
      this.inputLocked = false;
      this.renderRound();
    }
  }

  /**
   * Handles an incorrect answer: a gentle wiggle and soft tone, no penalty, so
   * the child can simply try again.
   */
  private handleIncorrect(index: number): void {
    this.audioManager.playIncorrect();
    this.recordWrong();
    this.mascot?.nod();

    const angle = isReducedMotion() ? this.WIGGLE_REDUCED_ANGLE : this.WIGGLE_ANGLE;
    this.tweens.add({
      targets: [this.choiceTargets[index], ...this.wiggleTargets(index)],
      angle,
      duration: motionDuration(this.WIGGLE_DURATION, this.WIGGLE_REDUCED_DURATION),
      yoyo: true,
      repeat: this.WIGGLE_REPEATS,
      ease: "Sine.inOut",
    });

    this.onWrong(index);
  }
}
