import { type AddItUpRound, buildPlaythrough, isCorrect } from "../game/addItUpLogic";
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

  constructor() {
    super("AddItUp");
  }
}
