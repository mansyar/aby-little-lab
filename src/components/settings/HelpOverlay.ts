import type Phaser from "phaser";
import { attachPressFeedback } from "../../utils/pressFeedback";
import { textStyle } from "../../utils/typography";
import { HELP_TOPICS, type HelpTopicId } from "./helpContent";
import {
  BACKDROP_COLOR,
  centredHitArea,
  DISABLED_COLOR,
  type ObjectBucket,
  OUTLINE_COLOR,
  OVERLAY_ALPHA,
  PANEL_COLOR,
  PANEL_HEIGHT,
  PANEL_WIDTH,
} from "./primitives";

/** A screen-space point published for the browser suite. */
export interface Point {
  readonly x: number;
  readonly y: number;
}

/** Dependencies owned by the caller (the Settings panel). */
export interface HelpOverlayDeps {
  scene: Phaser.Scene;
  /** Shared overlay lifecycle bucket; this component only clears its own entries. */
  overlayObjects: ObjectBucket;
}

/** A topic card as drawn on the menu. */
export interface HelpTopicPoint {
  readonly id: HelpTopicId;
  readonly title: string;
  readonly x: number;
  readonly y: number;
}

/** Interactive control points. Boundary controls are null when inactive. */
export interface HelpControls {
  close: Point;
  back: Point | null;
  prev: Point | null;
  next: Point | null;
}

/** The overlay as it is drawn right now, for the browser suite, or null when closed. */
export interface HelpOverlayState {
  readonly screen: "topics" | "topic";
  readonly topicId: string | null;
  readonly topicIndex: number;
  readonly topicCount: number;
  readonly title: string;
  readonly lines: readonly string[];
  readonly topics: readonly HelpTopicPoint[];
  readonly controls: HelpControls;
}

const MENU_TITLE = "Parent Help";
const CLOSE_GLYPH = "✕";
const BACK_LABEL = "Back to topics";
const PREV_LABEL = "Previous";
const NEXT_LABEL = "Next";
const INK_COLOR = "#2d3748";
const LINK_COLOR = "#2b6cb0";
const CARD_COLOR = 0xf6efdd;
const CARD_WIDTH = 200;
const CARD_HEIGHT = 96;
const CARD_COLUMN_OFFSET = 112;
const CARD_ROW_START = -150;
const CARD_ROW_PITCH = 96;
const BODY_WIDTH = 420;
const WRAP_WIDTH = 430;
const BULLET_X_OFFSET = -212;
const POINT_X_OFFSET = -190;
const POINT_ROW_START = -105;
const POINT_ROW_PITCH = 90;
const FOOTER_Y_OFFSET = 270;
const FOOTER_X_SPACING = 150;

/**
 * Standalone parent Help overlay: a topic menu and eight read-only topic
 * pages. It never reads or writes storage, settings, files, or audio, and it
 * never navigates outside the app.
 */
export class HelpOverlay {
  private readonly deps: HelpOverlayDeps;
  private visible = false;
  private screen: "topics" | "topic" = "topics";
  private topicIndex = -1;
  private title = "";
  /** Content strings filled as their text objects are created. */
  private lines: string[] = [];
  /** Topic card centres filled as their text objects are created. */
  private topics: HelpTopicPoint[] = [];
  /** Control points filled as their text objects are created. */
  private controls: HelpControls = {
    close: { x: 0, y: 0 },
    back: null,
    prev: null,
    next: null,
  };

  constructor(deps: HelpOverlayDeps) {
    this.deps = deps;
  }

  /** Opens the overlay, or resets an open one to the topic menu. */
  open(): void {
    this.close();
    this.screen = "topics";
    this.topicIndex = -1;
    this.render();
  }

  /** Destroys and empties only the shared overlay bucket; leaves Settings alone. */
  close(): void {
    this.clearRender();
    this.screen = "topics";
    this.topicIndex = -1;
  }

  /** The current overlay state for the browser suite, or null when closed. */
  e2eState(): HelpOverlayState | null {
    if (!this.visible) return null;
    const topic = this.screen === "topic" ? HELP_TOPICS[this.topicIndex] : undefined;
    return {
      screen: this.screen,
      topicId: topic?.id ?? null,
      topicIndex: this.topicIndex,
      topicCount: HELP_TOPICS.length,
      title: this.title,
      lines: [...this.lines],
      topics: this.topics.map((entry) => ({ ...entry })),
      controls: {
        close: { ...this.controls.close },
        back: this.controls.back === null ? null : { ...this.controls.back },
        prev: this.controls.prev === null ? null : { ...this.controls.prev },
        next: this.controls.next === null ? null : { ...this.controls.next },
      },
    };
  }

  /** Removes this component's game objects and captured state, keeping navigation. */
  private clearRender(): void {
    for (const object of this.deps.overlayObjects) object.destroy();
    this.deps.overlayObjects.length = 0;
    this.visible = false;
    this.title = "";
    this.lines = [];
    this.topics = [];
    this.controls = {
      close: { x: 0, y: 0 },
      back: null,
      prev: null,
      next: null,
    };
  }

  private render(): void {
    this.clearRender();
    const camera = this.deps.scene.cameras.main;
    const centerX = camera.centerX;
    const centerY = camera.centerY;

    const backdrop = this.deps.scene.add.rectangle(
      centerX,
      centerY,
      camera.width,
      camera.height,
      BACKDROP_COLOR,
      OVERLAY_ALPHA,
    );
    backdrop.setInteractive();
    backdrop.on("pointerdown", () => this.close());
    this.deps.overlayObjects.push(backdrop);

    const panel = this.deps.scene.add.rectangle(
      centerX,
      centerY,
      PANEL_WIDTH,
      PANEL_HEIGHT,
      PANEL_COLOR,
    );
    panel.setStrokeStyle(4, OUTLINE_COLOR);
    this.deps.overlayObjects.push(panel);

    if (this.screen === "topic" && this.topicIndex >= 0) {
      this.renderTopic(centerX, centerY);
    } else {
      this.renderMenu(centerX, centerY);
    }
    this.visible = true;
  }

  /** Adds a text object to the shared bucket without treating it as content. */
  private drawText(
    x: number,
    y: number,
    label: string,
    style: Record<string, unknown>,
    originX = 0.5,
    originY = 0.5,
  ): Phaser.GameObjects.Text {
    const text = this.deps.scene.add.text(x, y, label, textStyle(style));
    text.setOrigin(originX, originY);
    this.deps.overlayObjects.push(text);
    return text;
  }

  /** Adds a text object and records the content string it draws. */
  private drawLine(
    x: number,
    y: number,
    label: string,
    style: Record<string, unknown>,
    originX = 0.5,
    originY = 0.5,
  ): Phaser.GameObjects.Text {
    const text = this.drawText(x, y, label, style, originX, originY);
    this.lines.push(label);
    return text;
  }

  /** Adds a pressable control (or a passive, greyed one) and returns its centre. */
  private drawControl(
    x: number,
    y: number,
    label: string,
    width: number,
    color: string,
    onClick: () => void,
    enabled = true,
  ): Point {
    const text = this.drawText(x, y, label, { color, fontSize: "24px" });
    if (enabled) {
      text.setInteractive(centredHitArea(width, CARD_HEIGHT));
      text.on("pointerdown", onClick);
      attachPressFeedback(text);
    }
    return { x: text.x, y: text.y };
  }

  private renderMenu(centerX: number, centerY: number): void {
    this.title = MENU_TITLE;
    this.drawText(centerX, centerY - 245, MENU_TITLE, { color: INK_COLOR, fontSize: "32px" });
    this.controls.close = this.drawControl(
      centerX + 200,
      centerY - 245,
      CLOSE_GLYPH,
      CARD_HEIGHT,
      INK_COLOR,
      () => this.close(),
    );

    HELP_TOPICS.forEach((topic, index) => {
      const column = index % 2;
      const row = Math.floor(index / 2);
      const x = centerX + (column === 0 ? -CARD_COLUMN_OFFSET : CARD_COLUMN_OFFSET);
      const y = centerY + CARD_ROW_START + row * CARD_ROW_PITCH;
      const card = this.deps.scene.add.rectangle(x, y, CARD_WIDTH, CARD_HEIGHT, CARD_COLOR);
      card.setStrokeStyle(2, OUTLINE_COLOR);
      this.deps.overlayObjects.push(card);

      const label = this.drawLine(x, y, topic.title, {
        color: INK_COLOR,
        fontSize: "22px",
        align: "center",
        wordWrap: { width: 180 },
      });
      label.setInteractive(centredHitArea(CARD_WIDTH, CARD_HEIGHT));
      label.on("pointerdown", () => {
        this.topicIndex = index;
        this.screen = "topic";
        this.render();
      });
      attachPressFeedback(label);
      this.topics.push({ id: topic.id, title: topic.title, x: label.x, y: label.y });
    });
  }

  private renderTopic(centerX: number, centerY: number): void {
    const topic = HELP_TOPICS[this.topicIndex];
    if (topic === undefined) {
      this.screen = "topics";
      this.topicIndex = -1;
      this.renderMenu(centerX, centerY);
      return;
    }
    this.title = topic.title;
    this.drawLine(centerX, centerY - 245, topic.title, {
      color: INK_COLOR,
      fontSize: "30px",
      align: "center",
      wordWrap: { width: WRAP_WIDTH },
    });
    this.controls.close = this.drawControl(
      centerX + 200,
      centerY - 245,
      CLOSE_GLYPH,
      CARD_HEIGHT,
      INK_COLOR,
      () => this.close(),
    );
    this.drawLine(
      centerX,
      centerY - 180,
      topic.intro,
      {
        color: INK_COLOR,
        fontSize: "22px",
        align: "center",
        wordWrap: { width: WRAP_WIDTH },
      },
      0.5,
      0,
    );

    topic.points.forEach((point, index) => {
      const y = centerY + POINT_ROW_START + index * POINT_ROW_PITCH;
      this.drawText(centerX + BULLET_X_OFFSET, y, "•", { color: INK_COLOR, fontSize: "20px" });
      this.drawLine(
        centerX + POINT_X_OFFSET,
        y,
        point,
        {
          color: INK_COLOR,
          fontSize: "20px",
          wordWrap: { width: BODY_WIDTH },
        },
        0,
        0,
      );
    });

    const footerY = centerY + FOOTER_Y_OFFSET;
    this.controls.back = this.drawControl(
      centerX - FOOTER_X_SPACING,
      footerY,
      BACK_LABEL,
      160,
      LINK_COLOR,
      () => {
        this.screen = "topics";
        this.topicIndex = -1;
        this.render();
      },
    );

    const hasPrevious = this.topicIndex > 0;
    const previousPoint = this.drawControl(
      centerX,
      footerY,
      PREV_LABEL,
      140,
      hasPrevious ? LINK_COLOR : DISABLED_COLOR,
      () => {
        if (this.topicIndex > 0) {
          this.topicIndex -= 1;
          this.render();
        }
      },
      hasPrevious,
    );
    this.controls.prev = hasPrevious ? previousPoint : null;

    const hasNext = this.topicIndex < HELP_TOPICS.length - 1;
    const nextPoint = this.drawControl(
      centerX + FOOTER_X_SPACING,
      footerY,
      NEXT_LABEL,
      140,
      hasNext ? LINK_COLOR : DISABLED_COLOR,
      () => {
        if (this.topicIndex < HELP_TOPICS.length - 1) {
          this.topicIndex += 1;
          this.render();
        }
      },
      hasNext,
    );
    this.controls.next = hasNext ? nextPoint : null;
  }
}
