import Phaser from "phaser";
import { AudioManager } from "../audio/AudioManager";
import type { ArtLoadingCue } from "../components/ArtLoadingCue";
import type { Mascot } from "../components/Mascot";
import type { ParentLock } from "../components/ParentLock";
import type { RoundNarratorOptions } from "../components/RoundNarrator";
import { RoundNarrator } from "../components/RoundNarrator";
import type { SpeakerButton } from "../components/SpeakerButton";
import type { ArtGroup } from "../game/art/types";
import type { E2ERoundGeometry } from "../game/e2eBridge";
import { stickerKeyForGame } from "../game/gameRegistry";
import type { Rng } from "../game/random";
import type { GameId } from "../types";
import {
  completeGame as completeGameView,
  createBackButton as createBackButtonView,
  createCornerMascot as createCornerMascotView,
  createProgressDots as createProgressDotsView,
  createSpokenInstruction as createSpokenInstructionView,
  createStickerAnimation as createStickerAnimationView,
  fillProgressDot as fillProgressDotView,
  flushPendingTaps as flushPendingTapsView,
  type GameSceneViewState,
  preloadSceneArt,
  reactMiss,
  registerShutdownCleanup as registerShutdownCleanupView,
  resolveGameContext,
} from "./gameSceneView";

/**
 * Shared scaffold for all game scenes. Holds the common state every game
 * needs (parental lock, corner mascot, replay speaker, audio manager,
 * progress dots, input lock) and the duplicated win/completion flow:
 * win SFX, mascot big cheer, celebration burst, sticker award + reveal
 * animation, and the 3s auto-return to the Hub.
 *
 * Subclasses keep their per-game mechanics (rounds, cards, drag, scoring)
 * and call the protected helpers from their own `create()` and round
 * handlers. The helpers' bodies live in `gameSceneView.ts`; this class keeps
 * every field and every protected/private method name as the public surface.
 */
export abstract class GameSceneBase extends Phaser.Scene {
  protected parentLock?: ParentLock;
  protected mascot?: Mascot;
  protected narrator?: RoundNarrator;
  private standaloneSpeaker?: SpeakerButton;
  protected instructionLabel?: Phaser.GameObjects.Text;
  protected artCue?: ArtLoadingCue;

  protected readonly audioManager: AudioManager;

  /**
   * Random generator every gameplay draw in this scene flows through. Phaser
   * constructs scenes with no arguments, so the default is what production
   * gets and only tests ever supply a seeded generator. Readonly because scene
   * instances are reused across visits.
   */
  protected readonly rng: Rng;

  protected progressDots: Phaser.GameObjects.Arc[] = [];

  /** Rounds finished this visit, advanced only by `fillProgressDot`. */
  protected completedRounds = 0;
  protected inputLocked = false;

  private sessionCorrect = 0;
  private sessionWrong = 0;
  private sessionProbes = 0;

  protected readonly NEXT_ROUND_DELAY: number = 700;
  protected readonly AUTO_RETURN_DELAY = 3000;
  protected readonly WIGGLE_ANGLE = 4;
  protected readonly WIGGLE_REDUCED_ANGLE = 2;
  protected readonly WIGGLE_DURATION = 350;
  protected readonly WIGGLE_REDUCED_DURATION = 200;
  protected readonly WIGGLE_REPEATS = 3;
  protected readonly OUTLINE_WIDTH = 4;
  protected readonly PROGRESS_DOT_Y: number = 60;
  protected readonly PROGRESS_DOT_SPACING: number = 40;
  protected readonly PROGRESS_DOT_RADIUS: number = 8;
  protected readonly DOT_POP_SCALE = 1.4;
  protected readonly DOT_POP_REDUCED_SCALE: number = 1.2;
  protected readonly DOT_POP_DURATION: number = 250;
  protected readonly DOT_POP_REDUCED_DURATION: number = 150;
  protected readonly STICKER_DISPLAY_SIZE = 256;
  protected readonly WIN_TWEEN_DURATION = 300;
  protected readonly SUCCESS_COLOR = 0x68d391;
  protected readonly CARD_BG_COLOR = 0xffffff;
  protected readonly OUTLINE_COLOR = 0x2d3748;
  protected readonly SPEAKER_OFFSET = 70;
  protected readonly INSTRUCTION_Y = 112;
  protected readonly INSTRUCTION_WRAP_WIDTH = 620;
  protected readonly INSTRUCTION_SPEAKER_GAP = 36;

  protected readonly constructedSceneKey: string;
  protected resolvedGameId?: GameId;

  constructor(key: string, rng: Rng = Math.random) {
    super({ key });
    this.constructedSceneKey = key;
    this.audioManager = AudioManager.getInstance();
    this.rng = rng;
  }

  /** Structural view used to hand this scene to the extracted UI helpers. */
  protected get sceneView(): GameSceneViewState {
    return this as unknown as GameSceneViewState;
  }

  /** Registers this visit's audio identity and the two shutdown taps. */
  init(): void {
    resolveGameContext(this.sceneView);
    this.events.once("shutdown", () => {
      this.audioManager.clearGameContext();
    });
    this.events.once("shutdown", () => {
      this.flushPendingTaps();
    });
  }

  /** Folds an abandoned session's taps into the rolling adaptive window. */
  private flushPendingTaps(): void {
    flushPendingTapsView(this.sceneView);
  }

  /** Rasterizes the game art `groups` this scene draws and shows the load cue. */
  protected preloadArt(groups: readonly ArtGroup[]): void {
    preloadSceneArt(this.sceneView, groups);
  }

  /** The scene's replay glyph, owned by the narrator or injected directly. */
  protected get speaker(): SpeakerButton | undefined {
    return this.narrator?.glyph ?? this.standaloneSpeaker;
  }

  protected set speaker(glyph: SpeakerButton | undefined) {
    this.standaloneSpeaker = glyph;
  }

  /** Creates this scene's narrator, replacing any previous one. */
  protected createRoundNarrator(options: RoundNarratorOptions): RoundNarrator {
    this.narrator?.destroy();
    this.narrator = new RoundNarrator(this, options);
    return this.narrator;
  }

  protected createBackButton(): Phaser.GameObjects.Text {
    return createBackButtonView(this.sceneView);
  }

  protected createCornerMascot(): Mascot {
    return createCornerMascotView(this.sceneView);
  }

  protected createSpokenInstruction(
    text: string,
    options: { x?: number; y?: number } = {},
  ): Phaser.GameObjects.Text {
    return createSpokenInstructionView(this.sceneView, text, options);
  }

  protected createProgressDots(count: number): void {
    createProgressDotsView(this.sceneView, count);
  }

  protected fillProgressDot(index: number): void {
    fillProgressDotView(this.sceneView, index);
  }

  /** Canvas-space description of the current round for the e2e bridge. */
  protected e2eRoundGeometry(): E2ERoundGeometry | null {
    return null;
  }

  protected recordCorrect(): void {
    this.sessionCorrect += 1;
  }

  protected recordWrong(): void {
    this.sessionWrong += 1;
  }

  protected recordProbe(): void {
    this.sessionProbes += 1;
  }

  /** The one in-scene call site for the shared incorrect tone. */
  private playIncorrectFeedback(): void {
    this.audioManager.playIncorrect();
  }

  protected reactWrong(
    targets?: Phaser.GameObjects.GameObject[],
    onComplete?: () => void,
    onPreWiggle?: () => void,
  ): void {
    reactMiss(
      this.sceneView,
      () => this.recordWrong(),
      () => this.playIncorrectFeedback(),
      targets,
      onComplete,
      onPreWiggle,
    );
  }

  protected reactProbe(
    targets?: Phaser.GameObjects.GameObject[],
    onComplete?: () => void,
    onPreWiggle?: () => void,
  ): void {
    reactMiss(
      this.sceneView,
      () => this.recordProbe(),
      () => this.playIncorrectFeedback(),
      targets,
      onComplete,
      onPreWiggle,
    );
  }

  protected completeGame(gameId: GameId): void {
    completeGameView(this.sceneView, gameId);
  }

  protected createStickerAnimation(stickerKey: string): void {
    createStickerAnimationView(this.sceneView, stickerKey);
  }

  protected registerShutdownCleanup(): void {
    registerShutdownCleanupView(this.sceneView);
  }

  protected stickerKeyFor(gameId: GameId): string {
    return stickerKeyForGame(gameId);
  }
}
