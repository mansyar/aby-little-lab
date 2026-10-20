import Phaser from "phaser";
import { preloadStoryOrderArt } from "../game/storyOrderArt";
import { buildPlaythrough, isCorrect } from "../game/storyOrderLogic";
import type { GameId } from "../types";
import { createCompletionSplash } from "../utils/completionEffect";
import { attachDragLift, snapToSlot } from "../utils/dragJuice";
import { motionDuration } from "../utils/motion";
import { sceneEntrance } from "../utils/sceneTransitions";
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
const BOUNCE_DURATION = 300;
const BOUNCE_REDUCED_DURATION = 180;
const SWAP_DURATION = 200;
const SWAP_REDUCED_DURATION = 120;

interface StoryPanel {
  container: Phaser.GameObjects.Container;
  bg: Phaser.GameObjects.Rectangle;
  key: string;
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
  occupiedBy: StoryPanel | null;
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
 * The 24 panel drawings are rasterized by this scene's own `preload`, so they
 * load with the lazy game chunk rather than the boot shell.
 */
export class StoryOrderScene extends ChoiceRoundScene {
  private rounds: ReturnType<typeof buildPlaythrough> = [];
  private panels: StoryPanel[] = [];
  private slots: Slot[] = [];
  private readonly roundObjects: Phaser.GameObjects.GameObject[] = [];
  private lastValidatedSignature: string | null = null;

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
    // Phaser starts a drag on the first pointermove (threshold 0), and a drag
    // that ends over the panel's own slot is indistinguishable from a drop. Ten
    // pixels of slack keeps a preschooler's slightly wobbly tap a tap, so it
    // still withdraws a placed panel instead of being swallowed as a drag.
    this.input.dragDistanceThreshold = 10;
    this.createProgressDots(ROUND_COUNT);
    this.createSpokenInstruction("Put the story in order, first to last.");

    this.rounds = buildPlaythrough();
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
    if (!round) return;

    this.lastValidatedSignature = null;
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

      const zone = this.add.zone(sx, SLOT_Y, DROP_ZONE_SIZE, DROP_ZONE_SIZE);
      zone.setInteractive({ dropZone: true });
      this.slots.push({ zone, outline, x: sx, y: SLOT_Y, occupiedBy: null });
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
    this.panels = [];
    this.lastValidatedSignature = null;
  }

  /** A wrong strip wiggles the panels where they sit — nothing moves home. */
  protected override wiggleTargets(): Phaser.GameObjects.GameObject[] {
    const targets: Phaser.GameObjects.GameObject[] = [];
    for (const slot of this.slots) {
      const panel = slot.occupiedBy;
      if (panel) {
        targets.push(panel.container);
      }
    }
    return targets;
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
    this.input.setDraggable(container);

    const panel: StoryPanel = {
      container,
      bg,
      key,
      originX: x,
      originY: y,
      slotIndex: null,
      justDropped: false,
    };

    attachDragLift(container as unknown as Phaser.GameObjects.Image);

    container.on("pointerdown", () => {
      // A new gesture begins as a potential tap. Only real movement (or a drop)
      // marks it as a drag, so the trailing pointerup of a drag is exempt from
      // tap-to-return while a clean tap still returns the panel.
      panel.justDropped = false;
    });

    container.on("pointerup", () => {
      const justDropped = panel.justDropped;
      panel.justDropped = false;
      if (this.inputLocked) return;
      // Tap-to-return: a drop's trailing pointerup is not a tap.
      if (!justDropped && panel.slotIndex !== null) {
        this.returnPanelToSource(panel);
      }
    });

    container.on("dragstart", () => {
      if (this.inputLocked) return;
      this.children.bringToTop(container);
    });

    container.on("drag", (_pointer: unknown, dragX: number, dragY: number) => {
      if (this.inputLocked) return;
      // Movement means this gesture is a drag, so its pointerup is not a tap.
      panel.justDropped = true;
      container.setPosition(dragX, dragY);
    });

    container.on("drop", (_pointer: unknown, target: unknown) => {
      this.handleDrop(panel, target as Phaser.GameObjects.Zone);
    });

    container.on("dragend", () => {
      // Whether this gesture moved is already recorded (drag/drop); the
      // pointerup that follows belongs to the drag, not a tap.
      // Validation/wiggle owns the board while locked — leave positions alone.
      if (this.inputLocked) return;
      if (panel.slotIndex === null) {
        if (!this.isOverAnyZone(container.x, container.y)) {
          this.tweens.add({
            targets: container,
            x: panel.originX,
            y: panel.originY,
            duration: motionDuration(BOUNCE_DURATION, BOUNCE_REDUCED_DURATION),
            ease: "Back.out",
          });
        }
      } else {
        const slot = this.slots[panel.slotIndex];
        if (
          slot &&
          (container.x !== slot.x || container.y !== slot.y) &&
          !this.isOverAnyZone(container.x, container.y)
        ) {
          this.tweens.add({
            targets: container,
            x: slot.x,
            y: slot.y,
            duration: motionDuration(BOUNCE_DURATION, BOUNCE_REDUCED_DURATION),
            ease: "Back.out",
          });
        }
      }
      this.tryAutoValidate();
    });

    this.panels.push(panel);
    this.roundObjects.push(bg, art, container as unknown as Phaser.GameObjects.GameObject);
  }

  private isOverAnyZone(x: number, y: number): boolean {
    return this.slots.some((s) => {
      const half = DROP_ZONE_SIZE / 2;
      return x >= s.x - half && x <= s.x + half && y >= s.y - half && y <= s.y + half;
    });
  }

  private handleDrop(panel: StoryPanel, zone: Phaser.GameObjects.Zone): void {
    if (this.inputLocked) return;
    // A drop is never a tap, whatever the pointerup that follows it looks like.
    panel.justDropped = true;
    const destIdx = this.slots.findIndex((s) => s.zone === zone);
    if (destIdx === -1) return;
    const destSlot = this.slots[destIdx];
    const srcIdx = panel.slotIndex;

    if (destSlot.occupiedBy === panel) {
      this.snapPanel(panel, destSlot);
      return;
    }

    if (destSlot.occupiedBy === null) {
      if (srcIdx !== null) {
        this.slots[srcIdx].occupiedBy = null;
      }
      destSlot.occupiedBy = panel;
      panel.slotIndex = destIdx;
      this.snapPanel(panel, destSlot);
      return;
    }

    const occupant = destSlot.occupiedBy;
    if (srcIdx !== null) {
      // Swap the two placed panels.
      const srcSlot = this.slots[srcIdx];
      srcSlot.occupiedBy = occupant;
      occupant.slotIndex = srcIdx;
      destSlot.occupiedBy = panel;
      panel.slotIndex = destIdx;
      this.tweens.add({
        targets: occupant.container,
        x: srcSlot.x,
        y: srcSlot.y,
        duration: motionDuration(SWAP_DURATION, SWAP_REDUCED_DURATION),
        ease: "Back.out",
      });
    } else {
      // Came from the tray: the occupant returns to its own tray spot.
      destSlot.occupiedBy = panel;
      panel.slotIndex = destIdx;
      occupant.slotIndex = null;
      this.tweens.add({
        targets: occupant.container,
        x: occupant.originX,
        y: occupant.originY,
        duration: motionDuration(BOUNCE_DURATION, BOUNCE_REDUCED_DURATION),
        ease: "Back.out",
      });
    }
    this.snapPanel(panel, destSlot);
  }

  private snapPanel(panel: StoryPanel, slot: Slot): void {
    snapToSlot(
      this as unknown as Phaser.Scene,
      panel.container as unknown as Phaser.GameObjects.Image,
      slot.x,
      slot.y,
    );
  }

  private returnPanelToSource(panel: StoryPanel): void {
    if (panel.slotIndex === null) return;
    const slot = this.slots[panel.slotIndex];
    if (slot) slot.occupiedBy = null;
    panel.slotIndex = null;
    // The strip is no longer complete, so re-filling it must validate again.
    this.lastValidatedSignature = null;
    this.tweens.add({
      targets: panel.container,
      x: panel.originX,
      y: panel.originY,
      duration: motionDuration(BOUNCE_DURATION, BOUNCE_REDUCED_DURATION),
      ease: "Back.out",
    });
  }

  /**
   * Validates a complete strip. The signature guard re-checks only when the
   * completed order actually changed, so a drag that leaves the strip as it
   * was cannot wiggle the child again.
   */
  private tryAutoValidate(): void {
    if (this.inputLocked) return;
    if (this.slots.some((s) => s.occupiedBy === null)) return;
    const round = this.rounds[this.roundIndex];
    if (!round) return;
    const placed = this.slots.map((s) => s.occupiedBy?.key ?? "");
    const signature = placed.join("|");
    if (signature === this.lastValidatedSignature) return;
    this.lastValidatedSignature = signature;
    this.resolveWholeRound(isCorrect(placed, round.solution));
  }
}
