import Phaser from "phaser";
import { buildPlaythrough, isCorrect } from "../game/numberOrderLogic";
import type { GameId } from "../types";
import { createCompletionSplash } from "../utils/completionEffect";
import { attachDragLift, snapToSlot } from "../utils/dragJuice";
import { motionDuration } from "../utils/motion";
import { sceneEntrance } from "../utils/sceneTransitions";
import { speakNumber } from "../utils/speech";
import { getAdaptiveBandShift, getSettings } from "../utils/storage";
import { ChoiceRoundScene } from "./ChoiceRoundScene";

const ROUND_COUNT = 6;
const SOURCE_Y = 260;
const SLOT_Y = 520;
const CARD_WIDTH = 140;
const CARD_HEIGHT = 160;
const DROP_ZONE_SIZE = 160;
const NUMERAL_SINGLE_SIZE = 80;
const NUMERAL_TEN_SIZE = 56;
const NUMERAL_TEN_OFFSET = 22;
const BOUNCE_DURATION = 300;
const BOUNCE_REDUCED_DURATION = 180;

interface NumeralCard {
  container: Phaser.GameObjects.Container;
  bg: Phaser.GameObjects.Rectangle;
  numeral: number;
  originX: number;
  originY: number;
  slotIndex: number | null;
  justDropped: boolean;
}

interface Slot {
  zone: Phaser.GameObjects.Zone;
  outline: Phaser.GameObjects.Graphics;
  x: number;
  y: number;
  occupiedBy: NumeralCard | null;
}

/**
 * Number Order — Line Them Up scene.
 * Child drags shuffled numerals (3–5) from the top source row into the
 * bottom slot row to produce ascending order. Tap a numeral to hear it.
 * The whole board is the answer, so it reports through
 * {@link resolveWholeRound}: correct advances, wrong wiggles and bounces home.
 */
export class NumberOrderScene extends ChoiceRoundScene {
  private rounds: ReturnType<typeof buildPlaythrough> = [];
  private cards: NumeralCard[] = [];
  private slots: Slot[] = [];
  private readonly roundObjects: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super("NumberOrder");
  }

  create(): void {
    sceneEntrance(this);
    this.createCornerMascot();
    this.createBackButton();
    this.createProgressDots(ROUND_COUNT);
    this.createSpokenInstruction("Put the numbers in order, smallest first.");

    this.rounds = buildPlaythrough(getAdaptiveBandShift("number-order"));
    this.roundIndex = 0;
    this.inputLocked = false;
    this.renderRound();
    this.registerShutdownCleanup();
  }

  protected totalRounds(): number {
    return this.rounds.length;
  }

  protected gameId(): GameId {
    return "number-order";
  }

  /**
   * This game has no choice cards — the filled board is the answer, so nothing
   * ever asks whether one card is correct. See {@link tryAutoValidate}.
   */
  protected isChoiceCorrect(): boolean {
    return false;
  }

  /** Renders the dashed slot row and the shuffled source cards above it. */
  protected buildRoundContent(): void {
    const round = this.rounds[this.roundIndex];
    if (!round) return;

    const count = round.shuffled.length;
    const slotPositions = this.computePositions(count, this.scale.width);
    const sourcePositions = this.computePositions(count, this.scale.width);

    // Slots (bottom)
    for (let i = 0; i < count; i++) {
      // reuse same x for slot but at SLOT_Y (aligned columns)
      const sx = slotPositions[i];
      const outline = this.add.graphics();
      outline.setPosition(sx, SLOT_Y);
      outline.lineStyle(4, this.OUTLINE_COLOR, 0.9);
      // dashed outline — 8 dashes around rect
      this.drawDashedRect(outline, -CARD_WIDTH / 2, -CARD_HEIGHT / 2, CARD_WIDTH, CARD_HEIGHT);
      this.roundObjects.push(outline);

      const zone = this.add.zone(sx, SLOT_Y, DROP_ZONE_SIZE, DROP_ZONE_SIZE);
      zone.setInteractive({ dropZone: true });
      this.slots.push({ zone, outline, x: sx, y: SLOT_Y, occupiedBy: null });
    }

    // Cards (top shuffled)
    for (let i = 0; i < count; i++) {
      const numeral = round.shuffled[i];
      const x = sourcePositions[i];
      this.createCard(numeral, x, SOURCE_Y);
    }
  }

  /**
   * Tears the board down. A drag game's objects can already be gone by the time
   * the round ends, so a failed destroy must not leave the rest of the board
   * behind (the slot row is released first, then the cards).
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

  /** Drops the slot row and the card list. */
  protected clearRoundContent(): void {
    for (const slot of this.slots) {
      try {
        slot.zone.destroy();
        slot.outline.destroy();
      } catch {
        // Already destroyed — keep going.
      }
    }
    this.slots = [];
    this.cards = [];
  }

  /** A wrong board wiggles the placed cards, not a tapped card. */
  protected override wiggleTargets(): Phaser.GameObjects.GameObject[] {
    const targets: Phaser.GameObjects.GameObject[] = [];
    for (const slot of this.slots) {
      const card = slot.occupiedBy;
      if (card) {
        targets.push(card.container);
      }
    }
    return targets;
  }

  /**
   * Keeps the board inert while the wrong answer wiggles: the cards are about
   * to bounce home, so a drag in the middle of it would fight the tween. The
   * input opens again once the bounce starts.
   */
  protected override onWrong(): void {
    this.inputLocked = true;
  }

  /** Bounces every placed card home once the wiggle has finished. */
  protected override onWiggleComplete(): void {
    for (const slot of this.slots) {
      const card = slot.occupiedBy;
      if (card) {
        this.tweens.add({
          targets: card.container,
          x: card.originX,
          y: card.originY,
          duration: motionDuration(250, 150),
          ease: "Back.out",
        });
        card.slotIndex = null;
        card.bg.setFillStyle(this.CARD_BG_COLOR, 1);
      }
      slot.occupiedBy = null;
    }
    this.inputLocked = false;
  }

  /** Flashes the filled slots green and bursts a splash at the board center. */
  protected override onCorrect(): void {
    for (const slot of this.slots) {
      const card = slot.occupiedBy;
      if (card) card.bg.setFillStyle(this.SUCCESS_COLOR, 1);
    }
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;
    createCompletionSplash(this, centerX, centerY);
  }

  private computePositions(count: number, width: number): number[] {
    const spacing = width / (count + 1);
    return Array.from({ length: count }, (_, i) => spacing * (i + 1));
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
    // top
    for (let px = x; px < x + w; px += dash + gap) {
      const len = Math.min(dash, x + w - px);
      g.lineBetween(px, y, px + len, y);
    }
    // bottom
    for (let px = x; px < x + w; px += dash + gap) {
      const len = Math.min(dash, x + w - px);
      g.lineBetween(px, y + h, px + len, y + h);
    }
    // left
    for (let py = y; py < y + h; py += dash + gap) {
      const len = Math.min(dash, y + h - py);
      g.lineBetween(x, py, x, py + len);
    }
    // right
    for (let py = y; py < y + h; py += dash + gap) {
      const len = Math.min(dash, y + h - py);
      g.lineBetween(x + w, py, x + w, py + len);
    }
  }

  private createCard(numeral: number, x: number, y: number): void {
    const bg = this.add.rectangle(0, 0, CARD_WIDTH, CARD_HEIGHT, 0xffffff);
    bg.setStrokeStyle(this.OUTLINE_WIDTH, this.OUTLINE_COLOR, 1);

    const numeralImages: Phaser.GameObjects.Image[] = [];
    if (numeral === 10) {
      const left = this.add
        .image(-NUMERAL_TEN_OFFSET / 2 - NUMERAL_TEN_SIZE / 2 + 4, 0, "numeral_1")
        .setDisplaySize(NUMERAL_TEN_SIZE, NUMERAL_TEN_SIZE);
      const right = this.add
        .image(NUMERAL_TEN_OFFSET / 2 + NUMERAL_TEN_SIZE / 2 - 4, 0, "numeral_0")
        .setDisplaySize(NUMERAL_TEN_SIZE, NUMERAL_TEN_SIZE);
      numeralImages.push(left, right);
    } else {
      const img = this.add
        .image(0, 0, `numeral_${numeral}`)
        .setDisplaySize(NUMERAL_SINGLE_SIZE, NUMERAL_SINGLE_SIZE);
      numeralImages.push(img);
    }

    const container = this.add.container(x, y, [bg, ...numeralImages]);
    container.setSize(CARD_WIDTH, CARD_HEIGHT);
    // Containers hit-test in a local space where the display origin (half the
    // size) is added to the tap, so the centred card occupies (0,0)-(w,h).
    // A centred rect would shift the live region up-left by half a card.
    container.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(0, 0, CARD_WIDTH, CARD_HEIGHT),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
    });
    // Phaser containers with setSize need explicit input enabled; also make draggable
    this.input.setDraggable(container);

    const card: NumeralCard = {
      container,
      bg,
      numeral,
      originX: x,
      originY: y,
      slotIndex: null,
      justDropped: false,
    };

    // Lift juice (visual)
    attachDragLift(container as unknown as Phaser.GameObjects.Image);

    container.on("pointerdown", () => {
      // A new gesture begins; only a pointerup from a gesture that dropped
      // something is exempt from tap-to-return. Phaser fires dragstart before
      // pointerdown, so this reset cannot live in dragstart.
      card.justDropped = false;
      if (this.inputLocked) return;
      // Speak on any tap (SFX-gated, silent fallback)
      speakNumber(numeral, getSettings().sfxEnabled);
    });

    container.on("pointerup", () => {
      const justDropped = card.justDropped;
      card.justDropped = false;
      if (this.inputLocked) return;
      // Tap-to-return: a drop's trailing pointerup is not a tap.
      if (!justDropped && card.slotIndex !== null) {
        this.returnCardToSource(card);
      }
    });

    container.on("dragstart", () => {
      if (this.inputLocked) return;
      this.children.bringToTop(container);
    });

    container.on("drag", (_pointer: unknown, dragX: number, dragY: number) => {
      if (this.inputLocked) return;
      container.setPosition(dragX, dragY);
    });

    container.on("drop", (_pointer: unknown, target: unknown) => {
      this.handleDrop(card, target as Phaser.GameObjects.Zone);
    });

    container.on("dragend", () => {
      // The pointerup that follows this dragend belongs to the drag, not a tap.
      card.justDropped = true;
      // Validation/wiggle owns the board while locked — leave positions alone.
      if (this.inputLocked) return;
      // If not placed (i.e., dropped on empty area), bounce home
      // For placed cards, handleDrop already snapped; dragend handles misses
      if (card.slotIndex === null) {
        // Card was at source and dropped on empty: snap back to origin (lift restores)
        // The lift's dragend restores scale; we just ensure position
        if (!this.isOverAnyZone(container.x, container.y)) {
          this.tweens.add({
            targets: container,
            x: card.originX,
            y: card.originY,
            duration: motionDuration(BOUNCE_DURATION, BOUNCE_REDUCED_DURATION),
            ease: "Back.out",
          });
        }
      } else {
        // Card is placed; if drop didn't result in valid zone change, it may need position correction
        // But placed cards have slot position; if dragend without drop (missed zone), bounce to its slot position
        const slot = this.slots[card.slotIndex];
        if (slot && (container.x !== slot.x || container.y !== slot.y)) {
          // Check if we already handled drop; if drop missed, return to slot center
          if (!this.isOverAnyZone(container.x, container.y)) {
            this.tweens.add({
              targets: container,
              x: slot.x,
              y: slot.y,
              duration: motionDuration(BOUNCE_DURATION, BOUNCE_REDUCED_DURATION),
              ease: "Back.out",
            });
          }
        }
      }
      // After any drag that resulted in full board, try auto-validate
      this.tryAutoValidate();
    });

    this.cards.push(card);
    this.roundObjects.push(
      bg,
      ...numeralImages,
      container as unknown as Phaser.GameObjects.GameObject,
    );
    // Avoid double-adding: container already contains bg/images, but we pushed them for destroy tracking separately.
    // Keep cards list for lifecycle.
  }

  private isOverAnyZone(x: number, y: number): boolean {
    return this.slots.some((s) => {
      const half = DROP_ZONE_SIZE / 2;
      return x >= s.x - half && x <= s.x + half && y >= s.y - half && y <= s.y + half;
    });
  }

  private handleDrop(card: NumeralCard, zone: Phaser.GameObjects.Zone): void {
    if (this.inputLocked) return;
    const destIdx = this.slots.findIndex((s) => s.zone === zone);
    if (destIdx === -1) return;
    const destSlot = this.slots[destIdx];
    const srcIdx = card.slotIndex;

    if (destSlot.occupiedBy === card) {
      // Dropped back onto its own slot — just snap
      snapToSlot(
        this as unknown as Phaser.Scene,
        card.container as unknown as Phaser.GameObjects.Image,
        destSlot.x,
        destSlot.y,
      );
      return;
    }

    if (destSlot.occupiedBy === null) {
      // Empty slot — move
      if (srcIdx !== null) {
        this.slots[srcIdx].occupiedBy = null;
      }
      destSlot.occupiedBy = card;
      card.slotIndex = destIdx;
      snapToSlot(
        this as unknown as Phaser.Scene,
        card.container as unknown as Phaser.GameObjects.Image,
        destSlot.x,
        destSlot.y,
      );
    } else {
      // Occupied — swap
      const occupant = destSlot.occupiedBy;
      if (srcIdx !== null) {
        // Swap between two slots
        const srcSlot = this.slots[srcIdx];
        srcSlot.occupiedBy = occupant;
        occupant.slotIndex = srcIdx;
        destSlot.occupiedBy = card;
        card.slotIndex = destIdx;
        // Animate occupant to source slot
        this.tweens.add({
          targets: occupant.container,
          x: srcSlot.x,
          y: srcSlot.y,
          duration: motionDuration(200, 120),
          ease: "Back.out",
        });
        snapToSlot(
          this as unknown as Phaser.Scene,
          card.container as unknown as Phaser.GameObjects.Image,
          destSlot.x,
          destSlot.y,
        );
      } else {
        // Dragged from source onto occupied slot — occupant returns to source origin
        destSlot.occupiedBy = card;
        card.slotIndex = destIdx;
        occupant.slotIndex = null;
        // occupant back to its source origin
        this.tweens.add({
          targets: occupant.container,
          x: occupant.originX,
          y: occupant.originY,
          duration: motionDuration(BOUNCE_DURATION, BOUNCE_REDUCED_DURATION),
          ease: "Back.out",
        });
        snapToSlot(
          this as unknown as Phaser.Scene,
          card.container as unknown as Phaser.GameObjects.Image,
          destSlot.x,
          destSlot.y,
        );
      }
    }
  }

  private returnCardToSource(card: NumeralCard): void {
    if (card.slotIndex === null) return;
    const slot = this.slots[card.slotIndex];
    if (slot) slot.occupiedBy = null;
    card.slotIndex = null;
    this.tweens.add({
      targets: card.container,
      x: card.originX,
      y: card.originY,
      duration: motionDuration(BOUNCE_DURATION, BOUNCE_REDUCED_DURATION),
      ease: "Back.out",
    });
  }

  /** Validates the board once every slot is filled; the base runs the answer. */
  private tryAutoValidate(): void {
    if (this.inputLocked) return;
    if (this.slots.some((s) => s.occupiedBy === null)) return;
    // All slots filled — validate
    const round = this.rounds[this.roundIndex];
    const placed = this.slots.map((s) => s.occupiedBy?.numeral ?? -1);
    this.resolveWholeRound(isCorrect(placed, round.solution));
  }
}
