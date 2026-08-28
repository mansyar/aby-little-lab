import Phaser from "phaser";
import { buildPlaythrough, isCorrect } from "../game/numberOrderLogic";
import { createCompletionSplash } from "../utils/completionEffect";
import { attachDragLift, snapToSlot } from "../utils/dragJuice";
import { isReducedMotion, motionDuration } from "../utils/motion";
import { sceneEntrance } from "../utils/sceneTransitions";
import { speakNumber } from "../utils/speech";
import { getAdaptiveBandShift, load } from "../utils/storage";
import { GameSceneBase } from "./GameSceneBase";

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
  dragging: boolean;
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
 * Auto-validates when every slot is filled; correct advances, wrong wiggles
 * and bounces home.
 */
export class NumberOrderScene extends GameSceneBase {
  private rounds: ReturnType<typeof buildPlaythrough> = [];
  private roundIndex = 0;
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

    this.rounds = buildPlaythrough(getAdaptiveBandShift("number-order"));
    this.roundIndex = 0;
    this.inputLocked = false;
    this.renderRound();
    this.registerShutdownCleanup();
  }

  private renderRound(): void {
    this.clearRound();
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

    // Drop handling via zones is handled per-card drop event; also need swap highlight?
    // Enable drop zone highlight pulse? Optional, keep minimal.
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
    container.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(
        -CARD_WIDTH / 2,
        -CARD_HEIGHT / 2,
        CARD_WIDTH,
        CARD_HEIGHT,
      ),
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
      dragging: false,
    };

    // Lift juice (visual)
    attachDragLift(container as unknown as Phaser.GameObjects.Image);

    container.on("pointerdown", () => {
      if (this.inputLocked) return;
      // Speak on any tap (SFX-gated, silent fallback)
      speakNumber(numeral, load().settings.sfxEnabled);
    });

    container.on("pointerup", () => {
      if (this.inputLocked) return;
      // Tap-to-return: if placed and not dragging, return home
      if (!card.dragging && card.slotIndex !== null) {
        this.returnCardToSource(card);
      }
    });

    container.on("dragstart", () => {
      if (this.inputLocked) return;
      card.dragging = true;
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
      card.dragging = false;
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

  private tryAutoValidate(): void {
    if (this.inputLocked) return;
    if (this.slots.some((s) => s.occupiedBy === null)) return;
    // All slots filled — validate
    this.inputLocked = true;
    const round = this.rounds[this.roundIndex];
    const placed = this.slots.map((s) => s.occupiedBy?.numeral ?? -1);
    const correct = isCorrect(placed, round.solution);
    if (correct) {
      this.handleCorrect();
    } else {
      this.handleIncorrect();
    }
  }

  private handleCorrect(): void {
    // Flash success on slots
    for (const slot of this.slots) {
      const card = slot.occupiedBy;
      if (card) card.bg.setFillStyle(this.SUCCESS_COLOR, 1);
    }
    // Also splash
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;
    createCompletionSplash(this, centerX, centerY);
    this.audioManager.playCorrect();
    this.recordCorrect();
    this.mascot?.cheer();
    this.fillProgressDot(this.roundIndex);

    this.time.delayedCall(this.NEXT_ROUND_DELAY, () => {
      this.roundIndex++;
      if (this.roundIndex >= this.rounds.length) {
        this.completeGame("number-order");
      } else {
        this.inputLocked = false;
        this.renderRound();
      }
    });
  }

  private handleIncorrect(): void {
    this.audioManager.playIncorrect();
    this.recordWrong();
    this.mascot?.nod();

    // Wiggle the card containers only — the bg is a child of the container,
    // so adding both to targets would double-apply the tilt (bg is already
    // carried by the container; numerals ride along too).
    const targets: Phaser.GameObjects.GameObject[] = [];
    for (const slot of this.slots) {
      const card = slot.occupiedBy;
      if (card) {
        targets.push(card.container);
      }
    }
    const angle = isReducedMotion() ? this.WIGGLE_REDUCED_ANGLE : this.WIGGLE_ANGLE;
    this.tweens.add({
      targets,
      angle,
      duration: motionDuration(this.WIGGLE_DURATION, this.WIGGLE_REDUCED_DURATION),
      yoyo: true,
      repeat: this.WIGGLE_REPEATS,
      ease: "Sine.inOut",
      onComplete: () => {
        // Bounce all placed cards home
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
      },
    });
    // Reset fill after wiggle? Keep pending until bounce.
  }

  private clearRound(): void {
    for (const obj of this.roundObjects) {
      try {
        obj.destroy();
      } catch {
        // ignore
      }
    }
    this.roundObjects.length = 0;
    for (const s of this.slots) {
      try {
        s.zone.destroy();
        s.outline.destroy();
      } catch {
        // ignore
      }
    }
    this.slots = [];
    // Cards containers already destroyed via roundObjects, but ensure list cleared
    this.cards = [];
  }
}
