import Phaser from "phaser";
import { AudioManager } from "../audio/AudioManager";
import { type ArtLoadingCue, createArtLoadingCue } from "../components/ArtLoadingCue";
import {
  createCornerMascot as createCornerMascotComponent,
  type Mascot,
} from "../components/Mascot";
import { ParentLock } from "../components/ParentLock";
import type { RoundNarratorOptions } from "../components/RoundNarrator";
import { RoundNarrator } from "../components/RoundNarrator";
import type { SpeakerButton } from "../components/SpeakerButton";
import { preloadArtGroups } from "../game/art/registry";
import type { ArtGroup } from "../game/art/types";
import { GAME_REGISTRY, stickerKeyForGame } from "../game/gameRegistry";
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
 * Shared scaffold for all game scenes. Holds the common state every game
 * needs (parental lock, corner mascot, replay speaker, audio manager,
 * progress dots, input lock) and the duplicated win/completion flow:
 * win SFX, mascot big cheer, celebration burst, sticker award + reveal
 * animation, and the 3s auto-return to the Hub.
 *
 * Subclasses keep their per-game mechanics (rounds, cards, drag, scoring)
 * and call the protected helpers from their own `create()` and round
 * handlers.
 */
export abstract class GameSceneBase extends Phaser.Scene {
  protected parentLock?: ParentLock;
  protected mascot?: Mascot;

  /** Per-round narrator owning the replay glyph; destroyed on shutdown. */
  protected narrator?: RoundNarrator;

  /** Glyph injected directly (no narrator), e.g. by tests; destroyed on shutdown. */
  private standaloneSpeaker?: SpeakerButton;

  /** Instruction line created by {@link createSpokenInstruction}; destroyed on shutdown. */
  private instructionLabel?: Phaser.GameObjects.Text;

  /** This visit's art-load cue, created by the first {@link preloadArt} call. */
  private artCue?: ArtLoadingCue;

  protected readonly audioManager: AudioManager;
  protected progressDots: Phaser.GameObjects.Arc[] = [];
  protected inputLocked = false;

  /** Correct taps recorded this session (flushed to progress on completion). */
  private sessionCorrect = 0;

  /** Incorrect taps recorded this session (flushed to progress on completion). */
  private sessionWrong = 0;

  /** Delay before the next round after a correct answer (ms). */
  protected readonly NEXT_ROUND_DELAY: number = 700;

  /** Auto-return delay to Hub after completion (ms). */
  protected readonly AUTO_RETURN_DELAY = 3000;

  /** Wiggle amplitude for an incorrect answer (degrees). */
  protected readonly WIGGLE_ANGLE = 4;

  /** Reduced-motion wiggle amplitude (degrees). */
  protected readonly WIGGLE_REDUCED_ANGLE = 2;

  /** Wiggle swing duration (ms). */
  protected readonly WIGGLE_DURATION = 350;

  /** Reduced-motion wiggle swing duration (ms). */
  protected readonly WIGGLE_REDUCED_DURATION = 200;

  /** Number of yoyo repeats for the incorrect-answer wiggle. */
  protected readonly WIGGLE_REPEATS = 3;

  /** Stroke width of card outlines. */
  protected readonly OUTLINE_WIDTH = 4;

  /** Y position of progress dots from top of screen. */
  protected readonly PROGRESS_DOT_Y: number = 60;

  /** Spacing between progress dots (px). */
  protected readonly PROGRESS_DOT_SPACING: number = 40;

  /** Radius of progress dots (px). */
  protected readonly PROGRESS_DOT_RADIUS: number = 8;

  /** Progress dot pop peak scale. */
  protected readonly DOT_POP_SCALE = 1.4;

  /** Reduced-motion progress dot pop peak scale. */
  protected readonly DOT_POP_REDUCED_SCALE: number = 1.2;

  /** Progress dot pop duration (ms). */
  protected readonly DOT_POP_DURATION: number = 250;

  /** Reduced-motion progress dot pop duration (ms). */
  protected readonly DOT_POP_REDUCED_DURATION: number = 150;

  /** Display size of the sticker image in the unlock animation. */
  protected readonly STICKER_DISPLAY_SIZE = 256;

  /** Duration of sticker reveal animation (ms). */
  protected readonly WIN_TWEEN_DURATION = 300;

  /** Success flash fill color (--success token). */
  protected readonly SUCCESS_COLOR = 0x68d391;

  /** Default white card fill. */
  protected readonly CARD_BG_COLOR = 0xffffff;

  /** Card and dot outline color (--outline token). */
  protected readonly OUTLINE_COLOR = 0x2d3748;

  /** Horizontal gap between the arrow/target and the replay button (px). */
  protected readonly SPEAKER_OFFSET = 70;

  /** Y position of the shared spoken-instruction line (clear of the progress dots). */
  protected readonly INSTRUCTION_Y = 112;

  /** Wrap width of the instruction line, bounding it short of the replay glyph. */
  protected readonly INSTRUCTION_WRAP_WIDTH = 620;

  /** Gap between the instruction line's box edge and the replay glyph (px). */
  protected readonly INSTRUCTION_SPEAKER_GAP = 36;

  /** Scene key this scene was constructed with; used to resolve the registry entry. */
  private readonly constructedSceneKey: string;

  /**
   * Game id this scene resolved to in the registry, or undefined for a scene
   * that is not a game. The shutdown flush needs it to know which game the
   * pending taps belong to.
   */
  private resolvedGameId?: GameId;

  constructor(key: string) {
    super({ key });
    this.constructedSceneKey = key;
    this.audioManager = AudioManager.getInstance();
  }

  /**
   * Registers this visit's audio identity with the shared AudioManager so the
   * feedback trio (correct / incorrect / win) can take on the game's voice.
   * Scenes not in the registry keep the default voice. The context is dropped
   * on shutdown because scene instances are reused across visits.
   *
   * The same shutdown carries the pending taps of an abandoned session into
   * the rolling adaptive window: a child who backs out mid-game still made
   * those taps, so they still inform the next difficulty shift.
   */
  init(): void {
    const entry = GAME_REGISTRY.find((game) => game.sceneKey === this.constructedSceneKey);
    if (entry) {
      this.resolvedGameId = entry.gameId;
      this.audioManager.setGameContext(entry.gameId);
    }
    this.events.once("shutdown", () => {
      this.audioManager.clearGameContext();
    });
    this.events.once("shutdown", () => {
      this.flushPendingTaps();
    });
  }

  /**
   * Folds an abandoned session's taps into the rolling adaptive window.
   *
   * Only the window moves: the cumulative counters and the win count describe
   * completed sessions, while the play count still counts every game the child
   * starts, abandoned or not. The session counters are zeroed after the write
   * because scene instances are reused across visits — left standing, the next
   * visit would carry this visit's taps and report them a second time. A
   * completed session has already zeroed them, so it is never flushed twice.
   */
  private flushPendingTaps(): void {
    const gameId = this.resolvedGameId;
    if (gameId === undefined) return;
    if (this.sessionCorrect === 0 && this.sessionWrong === 0) return;
    recordGameTaps(gameId, this.sessionCorrect, this.sessionWrong);
    this.sessionCorrect = 0;
    this.sessionWrong = 0;
  }

  /**
   * Rasterizes the game art `groups` this scene draws and shows the shared
   * textless cue while the load is pending.
   *
   * Call from `preload` — that is where Phaser is still queueing loads. The cue
   * is created once per visit, however many calls this scene makes, and it is
   * taken down both on the loader's `complete` and on `create`, so a scene whose
   * art is already in the TextureManager (every key still ships in the shell for
   * now) cannot leave it on screen. Its own `shutdown` hook destroys it, which is
   * why no extra cleanup is registered here.
   */
  protected preloadArt(groups: readonly ArtGroup[]): void {
    const cue = this.artCue ?? this.createArtCue();
    cue.show();
    preloadArtGroups(this, groups);
  }

  /** Builds this visit's cue and wires the two events that take it back down. */
  private createArtCue(): ArtLoadingCue {
    const cue = createArtLoadingCue(this);
    this.artCue = cue;
    this.load.once("complete", () => cue.clear());
    this.events.once("create", () => cue.clear());
    // Scene instances are reused across visits: forget the destroyed cue so the
    // next visit builds a fresh one.
    this.events.once("shutdown", () => {
      this.artCue = undefined;
    });
    return cue;
  }

  /**
   * The scene's replay glyph, whether the narrator owns it or it was injected
   * directly. Reading it after a caption flip always returns the live glyph.
   */
  protected get speaker(): SpeakerButton | undefined {
    return this.narrator?.glyph ?? this.standaloneSpeaker;
  }

  protected set speaker(glyph: SpeakerButton | undefined) {
    this.standaloneSpeaker = glyph;
  }

  /**
   * Creates this scene's narrator, replacing any previous one — scene
   * instances are reused across visits, so the old glyph and rule line go
   * first. The narrator is destroyed by {@link registerShutdownCleanup}.
   */
  protected createRoundNarrator(options: RoundNarratorOptions): RoundNarrator {
    this.narrator?.destroy();
    this.narrator = new RoundNarrator(this, options);
    return this.narrator;
  }

  /**
   * Creates the "← Back" control with a parental hold-to-exit lock and press
   * feedback. The lock's success transitions back to the Hub.
   */
  protected createBackButton(): Phaser.GameObjects.Text {
    const backButton = this.add.text(
      20,
      20,
      "← Back",
      textStyle({
        fontSize: "24px",
        color: "#2d3748",
      }),
    );
    backButton.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(0, 0, 96, 96),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
    });

    this.parentLock = new ParentLock({
      scene: this,
      target: backButton,
      onSuccess: () => {
        transitionToScene(this, "Hub");
      },
      onFailure: () => {
        // No action needed on failure.
      },
    });
    attachPressFeedback(backButton);
    return backButton;
  }

  /** Places Professor Hoot in the bottom-right corner and stores the instance. */
  protected createCornerMascot(): Mascot {
    this.mascot = createCornerMascotComponent(this);
    this.mascot.curious();
    return this.mascot;
  }

  /**
   * Narrates the game's rule for pre-readers: a one-line instruction plus a
   * speaker glyph that replays it.
   *
   * The line is spoken once here, when the round is set up, and the glyph
   * replays it on tap. Both go through {@link speakSentence}, which re-reads
   * the SFX toggle on every call, so a mid-session change is honoured. Call
   * from `create()` (outside any per-round teardown) and before
   * `registerShutdownCleanup()` so the glyph's speech subscription is released
   * on shutdown.
   *
   * @param text - The instruction sentence to show and speak.
   * @param options - Optional centre overrides for games whose art needs the
   *   line elsewhere; the glyph follows the line horizontally.
   * @returns The instruction text object.
   */
  protected createSpokenInstruction(
    text: string,
    options: { x?: number; y?: number } = {},
  ): Phaser.GameObjects.Text {
    const centerX = options.x ?? this.cameras.main.centerX;
    const y = options.y ?? this.INSTRUCTION_Y;
    const label = this.add
      .text(
        centerX,
        y,
        text,
        textStyle({
          fontSize: "26px",
          color: "#2d3748",
          align: "center",
          wordWrap: { width: this.INSTRUCTION_WRAP_WIDTH },
        }),
      )
      .setOrigin(0.5);

    // Scene instances are reused across visits: drop the previous prompt line
    // before wiring a fresh one (the narrator replaces its own glyph).
    this.instructionLabel?.destroy();
    this.instructionLabel = label;
    this.createRoundNarrator({
      x: centerX + this.INSTRUCTION_WRAP_WIDTH / 2 + this.INSTRUCTION_SPEAKER_GAP,
      y,
      replay: () => {
        speakSentence(text, getSettings().sfxEnabled);
      },
      announce: text,
    });

    return label;
  }

  /**
   * Creates `count` progress dots at the top of the screen, dimmed by default.
   *
   * Scene instances are reused across visits and Phaser destroys the display
   * list on shutdown, so any dots left over from a previous visit are replaced
   * rather than appended to: otherwise {@link fillProgressDot} would write to
   * destroyed circles and the visible dots would never fill.
   */
  protected createProgressDots(count: number): void {
    this.progressDots = [];
    const startX = this.cameras.main.centerX - ((count - 1) * this.PROGRESS_DOT_SPACING) / 2;
    for (let i = 0; i < count; i++) {
      const dot = this.add.circle(
        startX + i * this.PROGRESS_DOT_SPACING,
        this.PROGRESS_DOT_Y,
        this.PROGRESS_DOT_RADIUS,
        this.OUTLINE_COLOR,
        0.3,
      );
      this.progressDots.push(dot);
    }
  }

  /** Fills the progress dot at `index` with a pop. */
  protected fillProgressDot(index: number): void {
    const dot = this.progressDots[index];
    dot.setAlpha(1);
    this.tweens.add({
      targets: dot,
      scaleX: motionScale(this.DOT_POP_SCALE, this.DOT_POP_REDUCED_SCALE),
      scaleY: motionScale(this.DOT_POP_SCALE, this.DOT_POP_REDUCED_SCALE),
      duration: motionDuration(this.DOT_POP_DURATION, this.DOT_POP_REDUCED_DURATION),
      ease: "Back.out",
      yoyo: true,
    });
  }

  /** Records a correct answer for the active profile's learning progress. */
  protected recordCorrect(): void {
    this.sessionCorrect += 1;
  }

  /** Records an incorrect answer for the active profile's learning progress. */
  protected recordWrong(): void {
    this.sessionWrong += 1;
  }

  /**
   * Shared wrong-answer reaction: the gentle descending incorrect tone, a
   * learning-progress record, and Professor Hoot's nod — never a penalty, so
   * the child simply tries again. When `targets` is given they also receive
   * the shared reduced-motion-aware wiggle. Scenes that need more (a bounce
   * home, a flip-back) add it after calling this helper; scenes with their own
   * wrong path never have to touch it.
   *
   * `onComplete` runs once the wiggle has ended, so a scene can release its
   * input again when the shake is over. It is released even when there is
   * nothing to wiggle: a scene waiting for that callback must never be left
   * locked.
   *
   * `onPreWiggle` runs after the shared tone, the record and the nod, and
   * before the wiggle starts — so a scene's own extras stay behind the shared
   * feedback and still land before the wiggle completion.
   */
  protected reactWrong(
    targets?: Phaser.GameObjects.GameObject[],
    onComplete?: () => void,
    onPreWiggle?: () => void,
  ): void {
    this.audioManager.playIncorrect();
    this.recordWrong();
    this.mascot?.nod();
    onPreWiggle?.();

    if (!targets || targets.length === 0) {
      onComplete?.();
      return;
    }

    this.tweens.add({
      targets,
      angle: motionScale(this.WIGGLE_ANGLE, this.WIGGLE_REDUCED_ANGLE),
      duration: motionDuration(this.WIGGLE_DURATION, this.WIGGLE_REDUCED_DURATION),
      yoyo: true,
      repeat: this.WIGGLE_REPEATS,
      ease: "Sine.inOut",
      onComplete,
    });
  }

  /**
   * Handles game completion: plays the win SFX, runs the shared celebration,
   * awards the sticker on first completion, and auto-returns to the Hub after
   * the auto-return delay, carrying `justEarned` when a sticker was earned.
   */
  protected completeGame(gameId: GameId): void {
    this.inputLocked = true;
    recordGameResult(gameId, this.sessionCorrect, this.sessionWrong);
    this.sessionCorrect = 0;
    this.sessionWrong = 0;
    this.audioManager.playWin();
    this.mascot?.cheer(true);
    createWinCelebration(this, this.cameras.main.centerX, this.cameras.main.centerY);

    const earnedNow = !hasSticker(gameId);
    if (earnedNow) {
      earnSticker(gameId);
      this.audioManager.playSticker();
      this.createStickerAnimation(this.stickerKeyFor(gameId));
    }

    this.time.delayedCall(this.AUTO_RETURN_DELAY, () => {
      transitionToScene(this, "Hub", earnedNow ? { justEarned: gameId } : undefined);
    });
  }

  /** Shows a sticker unlock animation at the center of the screen. */
  protected createStickerAnimation(stickerKey: string): void {
    const stickerImage = this.add
      .image(this.cameras.main.centerX, this.cameras.main.centerY, stickerKey)
      .setScale(0);

    this.tweens.add({
      targets: stickerImage,
      scaleX: displayScale(stickerKey, this.STICKER_DISPLAY_SIZE),
      scaleY: displayScale(stickerKey, this.STICKER_DISPLAY_SIZE),
      duration: motionDuration(this.WIN_TWEEN_DURATION, 180),
      delay: motionDuration(400, 250),
      ease: "Back.out",
    });
  }

  /**
   * Registers the shutdown handler that destroys the parent lock, mascot,
   * narrator (glyph and rule line), any injected glyph, the instruction line
   * and the progress dots. Call from `create()` after creating those instances.
   *
   * Registered with `once`, like the audio context above: scene instances are
   * reused across visits, so a handler that outlived its visit would pile up
   * one shutdown cleanup per visit.
   */
  protected registerShutdownCleanup(): void {
    this.events.once("shutdown", () => {
      this.parentLock?.destroy();
      this.mascot?.destroy();
      this.mascot = undefined;
      this.narrator?.destroy();
      this.narrator = undefined;
      this.standaloneSpeaker?.destroy();
      this.standaloneSpeaker = undefined;
      this.instructionLabel?.destroy();
      this.instructionLabel = undefined;
      // The dots are destroyed with the display list: release them so the
      // scene holds no references to destroyed objects.
      this.progressDots = [];
    });
  }

  /** Returns the sticker texture key for a game id, resolved from the registry. */
  protected stickerKeyFor(gameId: GameId): string {
    return stickerKeyForGame(gameId);
  }
}
