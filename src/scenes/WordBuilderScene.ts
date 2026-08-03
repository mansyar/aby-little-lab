import Phaser from "phaser";
import { AudioManager } from "../audio/AudioManager";
import { createCornerMascot, type Mascot } from "../components/Mascot";
import { ParentLock } from "../components/ParentLock";
import {
  generateWordBuildPlaythrough,
  generateLetterTiles,
  type FirstWord,
} from "../game/wordLogic";
import { attachPressFeedback } from "../utils/pressFeedback";
import { sceneEntrance, transitionToScene } from "../utils/sceneTransitions";

/** Number of words per playthrough. */
const WORD_COUNT = 3;

/** Y position of progress dots from top of screen. */
const PROGRESS_DOT_Y = 60;

/** Spacing between progress dots (px). */
const PROGRESS_DOT_SPACING = 40;

/** Radius of progress dots (px). */
const PROGRESS_DOT_RADIUS = 8;

/**
 * Build the Word scene — a picture is shown and its word is spoken aloud, and
 * the child spells the word by tapping letter tiles in order into word slots.
 * Correct letters settle into the next empty slot; wrong tiles wiggle gently
 * (no-fail). Three words win the game: shared celebration + sticker on first
 * completion.
 */
export class WordBuilderScene extends Phaser.Scene {
  private parentLock?: ParentLock;
  private mascot?: Mascot;
  private readonly audioManager: AudioManager;
  private readonly progressDots: Phaser.GameObjects.Arc[] = [];
  private words: FirstWord[] = [];
  private wordIndex = 0;
  private inputLocked = false;

  constructor() {
    super({ key: "WordBuilder" });
    this.audioManager = AudioManager.getInstance();
  }

  create(): void {
    sceneEntrance(this);
    this.mascot = createCornerMascot(this);

    const backButton = this.add.text(20, 20, "← Back", {
      fontSize: "24px",
      color: "#2d3748",
    });
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

    this.createProgressDots();

    this.words = generateWordBuildPlaythrough(WORD_COUNT);
    this.wordIndex = 0;
    this.renderRound();

    this.events.on("shutdown", () => {
      this.parentLock?.destroy();
      this.mascot?.destroy();
      this.mascot = undefined;
    });
  }

  /** Creates 3 progress dots at the top of the screen, dimmed by default. */
  private createProgressDots(): void {
    const startX = this.cameras.main.centerX - ((WORD_COUNT - 1) * PROGRESS_DOT_SPACING) / 2;
    for (let i = 0; i < WORD_COUNT; i++) {
      const dot = this.add.circle(
        startX + i * PROGRESS_DOT_SPACING,
        PROGRESS_DOT_Y,
        PROGRESS_DOT_RADIUS,
        0x2d3748,
        0.3,
      );
      this.progressDots.push(dot);
    }
  }

  /** Renders the current word's prompt picture, slots, and letter tiles. */
  private renderRound(): void {
    // Round rendering (prompt picture + slots + letter tiles) lands in
    // Task 3.2.
    void generateLetterTiles;
  }
}
