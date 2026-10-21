import Phaser from "phaser";
import type { GameId } from "../types";
import { attachPressFeedback } from "../utils/pressFeedback";
import { GameSceneBase } from "./GameSceneBase";

/** Minimum edge of a choice card's hit area (px) — the product touch-target floor. */
const MIN_HIT_AREA = 96;

/** How long the correct card keeps its success fill before reverting (ms). */
const SUCCESS_FLASH_DURATION = 250;

/**
 * Answer index used when a round is not decided by one tapped card — a board
 * the child fills and drops into place, say. It reaches the per-game extras so
 * they can tell a whole-round answer from a card tap.
 */
const WHOLE_ROUND = -1;

/** Shape overrides for a choice card whose content is not square. */
export interface ChoiceCardShape {
  /** Card width (px). Defaults to the square `size` argument. */
  readonly width?: number;
  /** Card height (px). Defaults to the square `size` argument. */
  readonly height?: number;
}

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
 *
 * A game whose round is not decided by one tapped card (a board the child
 * fills, say) skips the choice targets and reports its answer through
 * {@link resolveWholeRound}.
 */
export abstract class ChoiceRoundScene extends GameSceneBase {
  /** Interactive choice cards of the current round, in option order. */
  protected choiceTargets: Phaser.GameObjects.Rectangle[] = [];

  /** Index of the round being played (also the progress-dot index). */
  protected roundIndex = 0;

  /** Every display object the current round owns, destroyed by {@link clearRound}. */
  private roundDisplayObjects: Phaser.GameObjects.GameObject[] = [];

  /**
   * Objects drawn inside each choice card, indexed like {@link choiceTargets}.
   * They wiggle with their card and are destroyed with the round.
   */
  protected cardContents: Phaser.GameObjects.GameObject[][] = [];

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
   * itself. Defaults to the content attached to that card.
   */
  protected wiggleTargets(index: number): Phaser.GameObjects.GameObject[] {
    return this.cardContents[index] ?? [];
  }

  /** Optional per-game correct-answer extras, run before the shared feedback. */
  protected onCorrect(_index: number): void {}

  /**
   * Optional per-game wrong-answer extras, run after the shared tone and the
   * mascot's nod, and before the wiggle completes.
   */
  protected onWrong(_index: number): void {}

  /**
   * Optional per-game extra run once a wrong-answer wiggle has finished, for
   * games that move their own objects afterwards (bounce a board home).
   */
  protected onWiggleComplete(_index: number): void {}

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
    for (const obj of this.roundDisplayObjects) {
      obj.destroy();
    }
    this.roundDisplayObjects.length = 0;
    this.choiceTargets.length = 0;
    this.cardContents.length = 0;
    this.clearRoundContent();
  }

  /** Registers a round display object for destruction at the next teardown. */
  protected trackRoundObject<T extends Phaser.GameObjects.GameObject>(obj: T): T {
    this.roundDisplayObjects.push(obj);
    return obj;
  }

  /**
   * Attaches content to a choice card: it wiggles with the card on a wrong
   * answer and is destroyed with the rest of the round.
   */
  protected attachCardContent(index: number, objects: Phaser.GameObjects.GameObject[]): void {
    this.cardContents[index] = objects;
    for (const obj of objects) {
      this.trackRoundObject(obj);
    }
  }

  /**
   * Creates one interactive choice card at `(x, y)` with a hit area no smaller
   * than the 96 px touch floor, centred on the card, and the shared press
   * feedback. The gameplay handler is registered before the squish so the tap
   * is read first.
   *
   * `size` is the square edge for most games; pass `shape` when the card is
   * wider or taller than its content's natural square (e.g. a word card).
   */
  protected createChoiceTarget(
    x: number,
    y: number,
    size: number,
    choiceIndex: number,
    shape: ChoiceCardShape = {},
  ): Phaser.GameObjects.Rectangle {
    const width = shape.width ?? size;
    const height = shape.height ?? size;
    const card = this.add.rectangle(x, y, width, height, this.CARD_BG_COLOR);
    card.setStrokeStyle(this.OUTLINE_WIDTH, this.OUTLINE_COLOR, 1);
    // A card under the floor gains its extra touch area evenly on all sides,
    // so the tap target stays centred on what the child can see.
    const hitWidth = Math.max(width, MIN_HIT_AREA);
    const hitHeight = Math.max(height, MIN_HIT_AREA);
    card.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(
        (width - hitWidth) / 2,
        (height - hitHeight) / 2,
        hitWidth,
        hitHeight,
      ),
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
   * Runs the shared answer path for a round that is not decided by one tapped
   * card — a board the child fills and drops into place, say. The round gets
   * exactly what a tapped card gets: correct locks the input, chimes, records,
   * runs the scene's extras, cheers, fills the dot and advances; wrong plays
   * the soft tone, records, nods and wiggles whatever this scene reports.
   *
   * A subclass using this must supply {@link wiggleTargets} (there is no tapped
   * card to wiggle) and usually {@link onWiggleComplete}.
   */
  protected resolveWholeRound(correct: boolean): void {
    if (this.inputLocked) return;
    if (correct) {
      this.handleCorrect(WHOLE_ROUND);
    } else {
      this.handleIncorrect(WHOLE_ROUND);
    }
  }

  /**
   * Handles a correct answer: the chime plays, the answer is recorded, the
   * scene's own celebration runs (splash, reinforcement speech), the mascot
   * cheers, the tapped card flashes success, the progress dot pops, and the
   * next round starts after the shared delay (completion after the last).
   *
   * {@link onCorrect} runs before the cheer so a splash is the round's first
   * graphics object; the mascot's sparkle would otherwise claim that slot.
   */
  private handleCorrect(index: number): void {
    this.inputLocked = true;
    this.audioManager.playCorrect();
    this.recordCorrect();
    this.onCorrect(index);
    this.mascot?.cheer();
    this.fillProgressDot(this.roundIndex);

    // A whole-round answer has no tapped card to flash.
    if (index !== WHOLE_ROUND) {
      this.flashChoice(index);
    }

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
   *
   * The scene keeps the choice of what wiggles — the tapped card and whatever
   * the game adds — and hands the shared steps to the base helper, which owns
   * the tone, the recording and the mascot's nod.
   *
   * The game's own `onWrong` runs after the shared feedback and before the
   * wiggle completes: it locks the input while the wiggle is on screen, and
   * the completion that releases it again runs last.
   */
  private handleIncorrect(index: number): void {
    const targets: Phaser.GameObjects.GameObject[] = [...this.wiggleTargets(index)];
    if (index !== WHOLE_ROUND) {
      targets.unshift(this.choiceTargets[index]);
    }

    this.reactWrong(
      targets,
      () => {
        this.onWiggleComplete(index);
      },
      () => {
        this.onWrong(index);
      },
    );
  }
}
