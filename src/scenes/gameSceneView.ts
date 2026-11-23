import Phaser from "phaser";
import type { AudioManager } from "../audio/AudioManager";
import { type ArtLoadingCue, createArtLoadingCue } from "../components/ArtLoadingCue";
import {
  createCornerMascot as createCornerMascotComponent,
  type Mascot,
} from "../components/Mascot";
import { ParentLock } from "../components/ParentLock";
import type { RoundNarrator, RoundNarratorOptions } from "../components/RoundNarrator";
import type { SpeakerButton } from "../components/SpeakerButton";
import { preloadArtGroups } from "../game/art/registry";
import type { ArtGroup } from "../game/art/types";
import { GAME_REGISTRY, stickerKeyForGame } from "../game/gameRegistry";
import type { Rng } from "../game/random";
import type { GameId } from "../types";
import { createWinCelebration } from "../utils/completionEffect";
import { motionDuration, motionScale } from "../utils/motion";
import { attachPressFeedback } from "../utils/pressFeedback";
import { transitionToScene } from "../utils/sceneTransitions";
import { speakSentence } from "../utils/speech";
import {
  earnSticker,
  getSettings,
  hasSticker,
  recordGameResult,
  recordGameTaps,
} from "../utils/storage";
import { displayScale } from "../utils/textureTiers";
import { textStyle } from "../utils/typography";

/**
 * The slice of `GameSceneBase` its shared UI flow needs. The scene supplies
 * itself once through a structural view, so the protected fields subclasses
 * read stay on the scene and every method they call stays a thin delegate.
 */
export interface GameSceneViewState {
  readonly add: Phaser.Scene["add"];
  readonly time: Phaser.Scene["time"];
  readonly tweens: Phaser.Scene["tweens"];
  readonly events: Phaser.Scene["events"];
  readonly load: Phaser.Scene["load"];
  readonly cameras: Phaser.Scene["cameras"];
  readonly audioManager: AudioManager;
  readonly rng: Rng;
  readonly constructedSceneKey: string;
  resolvedGameId?: GameId;
  parentLock?: ParentLock;
  mascot?: Mascot;
  narrator?: RoundNarrator;
  standaloneSpeaker?: SpeakerButton;
  instructionLabel?: Phaser.GameObjects.Text;
  artCue?: ArtLoadingCue;
  progressDots: Phaser.GameObjects.Arc[];
  completedRounds: number;
  inputLocked: boolean;
  sessionCorrect: number;
  sessionWrong: number;
  sessionProbes: number;
  readonly AUTO_RETURN_DELAY: number;
  readonly OUTLINE_COLOR: number;
  readonly WIGGLE_ANGLE: number;
  readonly WIGGLE_REDUCED_ANGLE: number;
  readonly WIGGLE_DURATION: number;
  readonly WIGGLE_REDUCED_DURATION: number;
  readonly WIGGLE_REPEATS: number;
  readonly PROGRESS_DOT_SPACING: number;
  readonly PROGRESS_DOT_Y: number;
  readonly PROGRESS_DOT_RADIUS: number;
  readonly DOT_POP_SCALE: number;
  readonly DOT_POP_REDUCED_SCALE: number;
  readonly DOT_POP_DURATION: number;
  readonly DOT_POP_REDUCED_DURATION: number;
  readonly STICKER_DISPLAY_SIZE: number;
  readonly WIN_TWEEN_DURATION: number;
  readonly INSTRUCTION_Y: number;
  readonly INSTRUCTION_WRAP_WIDTH: number;
  readonly INSTRUCTION_SPEAKER_GAP: number;
  createRoundNarrator(options: RoundNarratorOptions): RoundNarrator;
  stickerKeyFor(gameId: GameId): string;
}

/** Resolves this visit's game id from the registry, if the scene is a game. */
export function resolveGameContext(v: GameSceneViewState): GameId | undefined {
  const entry = GAME_REGISTRY.find((game) => game.sceneKey === v.constructedSceneKey);
  if (entry) {
    v.resolvedGameId = entry.gameId;
    v.audioManager.setGameContext(entry.gameId);
  }
  return entry?.gameId;
}

/**
 * Folds an abandoned session's taps into the rolling adaptive window.
 * Only the window and the probe count move: the cumulative answer counters
 * and the win count describe completed sessions. The session counters are
 * zeroed after the write because scene instances are reused across visits.
 */
export function flushPendingTaps(v: GameSceneViewState): void {
  const gameId = v.resolvedGameId;
  if (gameId === undefined) return;
  if (v.sessionCorrect === 0 && v.sessionWrong === 0 && v.sessionProbes === 0) return;
  recordGameTaps(gameId, v.sessionCorrect, v.sessionWrong, v.sessionProbes);
  v.sessionCorrect = 0;
  v.sessionWrong = 0;
  v.sessionProbes = 0;
}

/** Rasterizes the given art groups; the cue is created once per visit. */
export function preloadSceneArt(v: GameSceneViewState, groups: readonly ArtGroup[]): void {
  const cue = v.artCue ?? createArtCue(v);
  cue.show();
  preloadArtGroups(v as unknown as Phaser.Scene, groups);
}

/** Builds this visit's cue and wires the two events that take it back down. */
function createArtCue(v: GameSceneViewState): ArtLoadingCue {
  const cue = createArtLoadingCue(v as unknown as Phaser.Scene);
  v.artCue = cue;
  v.load.once("complete", () => cue.clear());
  v.events.once("create", () => cue.clear());
  v.events.once("shutdown", () => {
    v.artCue = undefined;
  });
  return cue;
}

/** Creates the "← Back" control with a parental hold-to-exit lock. */
export function createBackButton(v: GameSceneViewState): Phaser.GameObjects.Text {
  const backButton = v.add.text(
    20,
    20,
    "← Back",
    textStyle({ fontSize: "24px", color: "#2d3748" }),
  );
  backButton.setInteractive({
    hitArea: new Phaser.Geom.Rectangle(0, 0, 96, 96),
    hitAreaCallback: Phaser.Geom.Rectangle.Contains,
  });

  v.parentLock = new ParentLock({
    scene: v as unknown as Phaser.Scene,
    target: backButton,
    onSuccess: () => {
      transitionToScene(v as unknown as Phaser.Scene, "Hub");
    },
    onFailure: () => {
      // No action needed on failure.
    },
  });
  attachPressFeedback(backButton);
  return backButton;
}

/** Places Professor Hoot in the bottom-right corner and stores the instance. */
export function createCornerMascot(v: GameSceneViewState): Mascot {
  v.mascot = createCornerMascotComponent(v as unknown as Phaser.Scene);
  v.mascot.curious();
  return v.mascot;
}

/** Narrates the game's rule for pre-readers: a line plus a replay glyph. */
export function createSpokenInstruction(
  v: GameSceneViewState,
  text: string,
  options: { x?: number; y?: number } = {},
): Phaser.GameObjects.Text {
  const centerX = options.x ?? v.cameras.main.centerX;
  const y = options.y ?? v.INSTRUCTION_Y;
  const label = v.add
    .text(
      centerX,
      y,
      text,
      textStyle({
        fontSize: "26px",
        color: "#2d3748",
        align: "center",
        wordWrap: { width: v.INSTRUCTION_WRAP_WIDTH },
      }),
    )
    .setOrigin(0.5);

  // Scene instances are reused across visits: drop the previous prompt line.
  v.instructionLabel?.destroy();
  v.instructionLabel = label;
  v.createRoundNarrator({
    x: centerX + v.INSTRUCTION_WRAP_WIDTH / 2 + v.INSTRUCTION_SPEAKER_GAP,
    y,
    replay: () => {
      speakSentence(text, getSettings().sfxEnabled);
    },
    announce: text,
  });

  return label;
}

/** Creates `count` progress dots at the top of the screen, dimmed by default. */
export function createProgressDots(v: GameSceneViewState, count: number): void {
  v.progressDots = [];
  v.completedRounds = 0;
  const startX = v.cameras.main.centerX - ((count - 1) * v.PROGRESS_DOT_SPACING) / 2;
  for (let i = 0; i < count; i++) {
    const dot = v.add.circle(
      startX + i * v.PROGRESS_DOT_SPACING,
      v.PROGRESS_DOT_Y,
      v.PROGRESS_DOT_RADIUS,
      v.OUTLINE_COLOR,
      0.3,
    );
    v.progressDots.push(dot);
  }
}

/** Fills the progress dot at `index` with a pop. */
export function fillProgressDot(v: GameSceneViewState, index: number): void {
  const dot = v.progressDots[index];
  dot.setAlpha(1);
  v.completedRounds += 1;
  v.tweens.add({
    targets: dot,
    scaleX: motionScale(v.DOT_POP_SCALE, v.DOT_POP_REDUCED_SCALE),
    scaleY: motionScale(v.DOT_POP_SCALE, v.DOT_POP_REDUCED_SCALE),
    duration: motionDuration(v.DOT_POP_DURATION, v.DOT_POP_REDUCED_DURATION),
    ease: "Back.out",
    yoyo: true,
  });
}

/** The feedback both a wrong answer and a probe share; only the record differs. */
export function reactMiss(
  v: GameSceneViewState,
  record: () => void,
  playTone: () => void,
  targets?: Phaser.GameObjects.GameObject[],
  onComplete?: () => void,
  onPreWiggle?: () => void,
): void {
  playTone();
  record();
  v.mascot?.nod();
  onPreWiggle?.();

  if (!targets || targets.length === 0) {
    onComplete?.();
    return;
  }

  v.tweens.add({
    targets,
    angle: motionScale(v.WIGGLE_ANGLE, v.WIGGLE_REDUCED_ANGLE),
    duration: motionDuration(v.WIGGLE_DURATION, v.WIGGLE_REDUCED_DURATION),
    yoyo: true,
    repeat: v.WIGGLE_REPEATS,
    ease: "Sine.inOut",
    onComplete,
  });
}

/** Handles game completion: celebration, sticker and the auto-return to Hub. */
export function completeGame(v: GameSceneViewState, gameId: GameId): void {
  v.inputLocked = true;
  recordGameResult(gameId, v.sessionCorrect, v.sessionWrong, v.sessionProbes);
  v.sessionCorrect = 0;
  v.sessionWrong = 0;
  v.sessionProbes = 0;
  v.audioManager.playWin();
  v.mascot?.cheer(true);
  createWinCelebration(
    v as unknown as Phaser.Scene,
    v.cameras.main.centerX,
    v.cameras.main.centerY,
  );

  const earnedNow = !hasSticker(gameId);
  if (earnedNow) {
    earnSticker(gameId);
    v.audioManager.playSticker();
    createStickerAnimation(v, stickerKeyForGame(gameId));
  }

  v.time.delayedCall(v.AUTO_RETURN_DELAY, () => {
    transitionToScene(
      v as unknown as Phaser.Scene,
      "Hub",
      earnedNow ? { justEarned: gameId } : undefined,
    );
  });
}

/** Shows a sticker unlock animation at the center of the screen. */
export function createStickerAnimation(v: GameSceneViewState, stickerKey: string): void {
  const stickerImage = v.add
    .image(v.cameras.main.centerX, v.cameras.main.centerY, stickerKey)
    .setScale(0);

  v.tweens.add({
    targets: stickerImage,
    scaleX: displayScale(stickerKey, v.STICKER_DISPLAY_SIZE),
    scaleY: displayScale(stickerKey, v.STICKER_DISPLAY_SIZE),
    duration: motionDuration(v.WIN_TWEEN_DURATION, 180),
    delay: motionDuration(400, 250),
    ease: "Back.out",
  });
}

/** Registers the once-only shutdown cleanup for this visit's shared objects. */
export function registerShutdownCleanup(v: GameSceneViewState): void {
  v.events.once("shutdown", () => {
    v.parentLock?.destroy();
    v.mascot?.destroy();
    v.mascot = undefined;
    v.narrator?.destroy();
    v.narrator = undefined;
    v.standaloneSpeaker?.destroy();
    v.standaloneSpeaker = undefined;
    v.instructionLabel?.destroy();
    v.instructionLabel = undefined;
    v.progressDots = [];
    v.completedRounds = 0;
  });
}
