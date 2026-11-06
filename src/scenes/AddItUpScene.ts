import { type AddItUpRound, buildPlaythrough, isCorrect } from "../game/addItUpLogic";
import { food } from "../game/art/food";
import { glyphs } from "../game/art/glyphs";
import { items } from "../game/art/items";
import { shapes } from "../game/art/shapes";
import type { E2ERoundGeometry } from "../game/e2eBridge";
import type { Rng } from "../game/random";
import { type GroupMathConfig, GroupMathScene } from "./GroupMathScene";

/**
 * Add It Up — the child counts the dots on two addend cards joined by a big
 * "+" cue, then taps the answer card whose dot-group matches the total.
 *
 * All round mechanics live in {@link GroupMathScene}; this scene pins only the
 * rule set: the plus cue, the addition logic, the spoken rule and the
 * `add-it-up` progress/sticker id.
 */
export class AddItUpScene extends GroupMathScene<AddItUpRound> {
  protected readonly config: GroupMathConfig<AddItUpRound> = {
    instruction: "Add the groups and pick the total.",
    gameId: "add-it-up",
    operationCue: "plus",
    buildPlaythrough,
    isCorrect,
    promptCards: (round) => round.addends,
  };

  constructor(rng: Rng = Math.random) {
    super("AddItUp", rng);
  }

  preload(): void {
    this.preloadArt([food, glyphs, items, shapes]);
  }

  /**
   * Publishes the round for the e2e bridge: the correct answer card's id is its
   * value and its coordinates come from the card the base drew for that option.
   */
  protected override e2eRoundGeometry(): E2ERoundGeometry | null {
    const round = this.rounds[this.roundIndex];
    if (!round) return null;

    const correctIndex = round.answerOptions.findIndex((_, index) => this.isChoiceCorrect(index));
    const card = this.choiceTargets[correctIndex];
    if (!card) return null;

    return {
      round: this.roundIndex,
      targets: [{ id: String(round.target), x: card.x, y: card.y }],
    };
  }
}
