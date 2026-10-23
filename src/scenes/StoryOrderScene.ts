import Phaser from "phaser";
import { type BoardPiece, DragBoard } from "../game/dragBoard";
import { preloadStoryOrderArt } from "../game/storyOrderArt";
import { buildPlaythrough, isCorrect } from "../game/storyOrderLogic";
import type { GameId } from "../types";
import { createCompletionSplash } from "../utils/completionEffect";
import { attachDragLift } from "../utils/dragJuice";
import { sceneEntrance } from "../utils/sceneTransitions";
import { getAdaptiveBandShift } from "../utils/storage";
import { ChoiceRoundScene } from "./ChoiceRoundScene";

const ROUND_COUNT = 6;
const SLOT_Y = 264;
const TRAY_Y = 574;
const SLOT_SIZE = 200;
const PANEL_SIZE = 180;
const PANEL_ART_SIZE = 140;
const DROP_ZONE_SIZE = 200;
const SLOT_GAP = 40;
const TRAY_GAP = 40;
const PIP_RADIUS = 5;
const PIP_GAP = 14;
const PIP_OFFSET_Y = SLOT_SIZE / 2 + 16;

/** A draggable story card registered with the shared drag board. */
interface StoryPanel extends BoardPiece {
  bg: Phaser.GameObjects.Rectangle;
  key: string;
}

/**
 * Story Order — Game 22.
 *
 * The child drags three shuffled story panels from the tray into the three
 * ordinal slots (marked only by 1/2/3 pips) to put the story first → last. The
 * whole strip is the answer, so it reports through {@link resolveWholeRound}:
 * a correct order advances, while a wrong order only wiggles. Unlike Number
 * Order, a wrong board keeps every panel exactly where the child put it and
 * unlocks so one panel can be moved and retried.
 *
 * The 33 panel drawings are rasterized by this scene's own `preload`, so they
 * load with the lazy game chunk rather than the boot shell.
 *
 * All slot registration, hover tracking, snapping, slot↔slot swaps,
 * tray↔slot displacement, tap-to-withdraw, missed-drop corrections, and the
 * `key|key|key` re-validation guard live in the shared {@link DragBoard}
 * shell; this scene only renders visuals and validates the whole strip
 * (retry-in-place, round-full timing).
 */
export class StoryOrderScene extends ChoiceRoundScene {
  private rounds: ReturnType<typeof buildPlaythrough> = [];
  private panels: StoryPanel[] = [];
  private board: DragBoard<StoryPanel> | null = null;
  /** Round-scoped graphics and containers kept for tolerant teardown. */
  private readonly roundObjects: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super("StoryOrder");
  }

  preload(): void {
    preloadStoryOrderArt(this);
  }

  create(): void {
    sceneEntrance(this);
    this.createCornerMascot();
    this.createBackButton();

    // The shell owns the 10 px tap-vs-drag threshold (wobble slack), every
    // gesture handler, and the validation guard. Story Order keeps its policy:
    // a wrong strip stays exactly in place (retry-in-place) and only a full
    // strip validates (round-full).
    this.board?.destroy();
    this.board = new DragBoard<StoryPanel>({
      scene: this,
      zoneSize: DROP_ZONE_SIZE,
      wrongAnswerBehavior: "retry-in-place",
      validationTiming: "round-full",
      tapWithdraw: true,
      isLocked: () => this.inputLocked,
      callbacks: {
        onValidate: (placedIds) => this.validateStrip(placedIds),
      },
    });

    this.createProgressDots(ROUND_COUNT);
    this.createSpokenInstruction("Put the story in order, first to last.");

    this.rounds = buildPlaythrough(Math.random, getAdaptiveBandShift("story-order"));
    this.roundIndex = 0;
    this.inputLocked = false;
    this.renderRound();
    this.registerShutdownCleanup();
  }

  protected totalRounds(): number {
    return this.rounds.length;
  }

  protected gameId(): GameId {
    return "story-order";
  }

  /** The filled strip is the answer; no single panel is ever "correct". */
  protected isChoiceCorrect(): boolean {
    return false;
  }

  /** Renders the three ordinal slots above the shuffled tray of panels. */
  protected buildRoundContent(): void {
    const round = this.rounds[this.roundIndex];
    const board = this.board;
    if (!round || !board) return;

    const count = round.shuffled.length;
    const slotPositions = this.rowPositions(count, SLOT_SIZE, SLOT_GAP);
    const trayPositions = this.rowPositions(count, PANEL_SIZE, TRAY_GAP);

    for (let i = 0; i < count; i++) {
      const sx = slotPositions[i];
      const outline = this.add.graphics();
      outline.setPosition(sx, SLOT_Y);
      outline.lineStyle(4, this.OUTLINE_COLOR, 0.9);
      this.drawDashedRect(outline, -SLOT_SIZE / 2, -SLOT_SIZE / 2, SLOT_SIZE, SLOT_SIZE);
      this.drawOrdinalPips(outline, i + 1);
      this.roundObjects.push(outline);

      board.addSlot(sx, SLOT_Y);
    }

    for (let i = 0; i < count; i++) {
      this.createPanel(round.shuffled[i], trayPositions[i], TRAY_Y);
    }
  }

  /**
   * Tears the board down. Drag objects can already be gone by the time the
   * round ends, so a failed destroy must not leave the rest behind.
   */
  protected override clearRound(): void {
    for (const obj of this.roundObjects) {
      try {
        obj.destroy();
      } catch {
        // Already destroyed — the rest of the board still has to be released.
      }
    }
    this.roundObjects.length = 0;
    this.clearRoundContent();
  }

  /**
   * Removes everything built for the current round. The drop zones are owned
   * by the shared drag board (whose clear tolerates already-gone zones), so
   * only the scene-owned panel list is reset here.
   */
  protected clearRoundContent(): void {
    this.board?.clear();
    this.panels = [];
  }

  /** A wrong strip wiggles the panels where they sit — nothing moves home. */
  protected override wiggleTargets(): Phaser.GameObjects.GameObject[] {
    return (this.board?.placedPieces() ?? []).map((panel) => panel.container);
  }

  /** Keeps the board inert for the wiggle; the panels themselves do not move. */
  protected override onWrong(): void {
    this.inputLocked = true;
  }

  /** Re-opens the board exactly as the child left it, so one panel can move. */
  protected override onWiggleComplete(): void {
    this.inputLocked = false;
  }

  /** Bursts the shared success splash while the base handles the rest. */
  protected override onCorrect(): void {
    createCompletionSplash(this, this.cameras.main.centerX, this.cameras.main.centerY);
  }

  private rowPositions(count: number, itemSize: number, gap: number): number[] {
    const total = count * itemSize + (count - 1) * gap;
    const start = this.scale.width / 2 - total / 2 + itemSize / 2;
    return Array.from({ length: count }, (_, i) => start + i * (itemSize + gap));
  }

  private drawDashedRect(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    w: number,
    h: number,
  ): void {
    const dash = 10;
    const gap = 10;
    for (let px = x; px < x + w; px += dash + gap) {
      const len = Math.min(dash, x + w - px);
      g.lineBetween(px, y, px + len, y);
      g.lineBetween(px, y + h, px + len, y + h);
    }
    for (let py = y; py < y + h; py += dash + gap) {
      const len = Math.min(dash, y + h - py);
      g.lineBetween(x, py, x, py + len);
      g.lineBetween(x + w, py, x + w, py + len);
    }
  }

  /** Draws `count` pips above a slot — the only ordinal cue (no digits). */
  private drawOrdinalPips(g: Phaser.GameObjects.Graphics, count: number): void {
    g.fillStyle(this.OUTLINE_COLOR, 0.55);
    const startX = -((count - 1) * PIP_GAP) / 2;
    for (let i = 0; i < count; i++) {
      g.fillCircle(startX + i * PIP_GAP, -PIP_OFFSET_Y, PIP_RADIUS);
    }
  }

  private createPanel(key: string, x: number, y: number): void {
    const bg = this.add.rectangle(0, 0, PANEL_SIZE, PANEL_SIZE, this.CARD_BG_COLOR);
    bg.setStrokeStyle(this.OUTLINE_WIDTH, this.OUTLINE_COLOR, 1);
    const art = this.add.image(0, 0, key).setDisplaySize(PANEL_ART_SIZE, PANEL_ART_SIZE);

    const container = this.add.container(x, y, [bg, art]);
    container.setSize(PANEL_SIZE, PANEL_SIZE);
    // Containers hit-test in a local space where the display origin (half the
    // size) is added to the tap, so the centred panel occupies (0,0)-(w,h).
    container.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(0, 0, PANEL_SIZE, PANEL_SIZE),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
    });

    const panel: StoryPanel = {
      id: key,
      container,
      bg,
      key,
      originX: x,
      originY: y,
      slotIndex: null,
      justDropped: false,
    };

    attachDragLift(container as unknown as Phaser.GameObjects.Image);

    // The shell owns every gesture handler: tap-vs-drag, drops, swaps,
    // tap-to-withdraw, and the missed-drop corrections.
    this.board?.addPiece(panel);

    this.panels.push(panel);
    this.roundObjects.push(bg, art, container as unknown as Phaser.GameObjects.GameObject);
  }

  /**
   * Validates a complete strip. The shell's signature guard re-checks only
   * when the completed order actually changed, so a drag that leaves the
   * strip as it was cannot wiggle the child again.
   */
  private validateStrip(placedIds: readonly (string | null)[]): void {
    const round = this.rounds[this.roundIndex];
    if (!round) return;
    this.resolveWholeRound(
      isCorrect(
        placedIds.map((id) => id ?? ""),
        round.solution,
      ),
    );
  }
}
