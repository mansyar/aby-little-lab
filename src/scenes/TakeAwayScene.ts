import { buildPlaythrough, isCorrect, type TakeAwayRound } from "../game/takeAwayLogic";
import { type GroupMathConfig, GroupMathScene } from "./GroupMathScene";

/**
 * Take Away — the child counts the dots on the minuend card, "takes away" the
 * subtrahend card (joined by a big "−" cue), and taps the answer card whose
 * dot-group matches the difference.
 *
 * All round mechanics live in {@link GroupMathScene}; this scene pins only the
 * rule set: the minus cue, the subtraction logic, the spoken rule and the
 * `take-away` progress/sticker id.
 */
export class TakeAwayScene extends GroupMathScene<TakeAwayRound> {
  protected readonly config: GroupMathConfig<TakeAwayRound> = {
    instruction: "Take some away and pick how many are left.",
    gameId: "take-away",
    operationCue: "minus",
    buildPlaythrough,
    isCorrect,
    promptCards: (round) => round.promptCards,
  };

  constructor() {
    super("TakeAway");
  }
}
