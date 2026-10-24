import Phaser from "phaser";
import { availableVoiceOptions } from "../../game/voiceLogic";
import { attachPressFeedback } from "../../utils/pressFeedback";
import { setPreferredVoiceURI, speakWord } from "../../utils/speech";
import { getSettings, updateSettings } from "../../utils/storage";
import { textStyle } from "../../utils/typography";
import {
  addRowCard,
  centredHitArea,
  ENABLED_COLOR,
  type ObjectBucket,
  PRIMARY_COLOR,
  ROW_HIT_WIDTH,
  ROW_PITCH,
} from "./primitives";

/** Sample phrase spoken by the voice preview button. */
const VOICE_PREVIEW_TEXT = "Hi! I can talk.";
/** Longest voice label shown in the chip before truncation. */
const VOICE_LABEL_MAX = 24;
/** Shortest truncation budget the fit pass may shrink to, and its step. */
const VOICE_LABEL_MIN = 8;
const VOICE_LABEL_STEP = 2;
/** Chip and Preview label offsets from the row center (their visual positions). */
const VOICE_CHIP_OFFSET = -30;
const VOICE_PREVIEW_OFFSET = 170;
/**
 * Narrowest either half of the split band may become. Both halves are clamped
 * by this, so neither control is starved and neither band leaves the card.
 */
const VOICE_MIN_HALF = 96;

/** Truncates a long voice label for the narrow chip, e.g. "en-US — Goog…". */
function truncateLabel(label: string, max = VOICE_LABEL_MAX): string {
  return label.length <= max ? label : `${label.slice(0, max - 1)}…`;
}

/** The row's fixed geometry, captured at create so both paths share it. */
interface VoiceRowBand {
  cardLeft: number;
  cardRight: number;
  chipX: number;
  previewX: number;
}

/**
 * A text object's rendered bounds, or null when it cannot report any.
 *
 * Phaser's Text always can. The guard is for the test doubles that model only
 * creation, which keep the anchor midpoint below.
 */
function renderedBounds(object: Phaser.GameObjects.Text): Phaser.Geom.Rectangle | null {
  const measure = (object as { getBounds?: () => Phaser.Geom.Rectangle }).getBounds;
  return typeof measure === "function" ? measure.call(object) : null;
}

/** Clamps a split position into the range the two halves allow. */
function clampSplit(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export interface VoiceRowDeps {
  scene: Phaser.Scene;
  /** Panel display bucket; torn down with the panel. */
  bucket: ObjectBucket;
}

/**
 * The device-level TTS voice row: a chip cycling through the installed voices
 * (plus "Default (device)") and a Preview button that speaks a sample phrase
 * with the current selection, honoring the SFX toggle.
 */
export class VoiceRow {
  private readonly deps: VoiceRowDeps;
  private voiceOptions: ReturnType<typeof availableVoiceOptions> = [];
  private voiceIndex = 0;
  private chip: Phaser.GameObjects.Text | null = null;
  private preview: Phaser.GameObjects.Text | null = null;
  private band: VoiceRowBand | null = null;

  constructor(deps: VoiceRowDeps) {
    this.deps = deps;
  }

  /** Creates the row (card + chip + preview) at the given panel position. */
  create(x: number, y: number): void {
    this.syncVoiceSelection();
    addRowCard(this.deps.scene, x, y, this.deps.bucket);
    const chipX = x + VOICE_CHIP_OFFSET;
    const previewX = x + VOICE_PREVIEW_OFFSET;
    this.band = {
      cardLeft: x - ROW_HIT_WIDTH / 2,
      cardRight: x + ROW_HIT_WIDTH / 2,
      chipX,
      previewX,
    };

    // Both labels exist before the band is split: the split follows what they
    // render to, not where their anchors sit.
    const chip = this.deps.scene.add
      .text(
        chipX,
        y,
        `Voice: ${truncateLabel(this.voiceOptions[this.voiceIndex].label)}`,
        textStyle({
          color: PRIMARY_COLOR,
          fontSize: "26px",
        }),
      )
      .setOrigin(0.5);
    const preview = this.deps.scene.add
      .text(
        previewX,
        y,
        "Preview",
        textStyle({
          color: ENABLED_COLOR,
          fontSize: "26px",
        }),
      )
      .setOrigin(0.5);
    this.chip = chip;
    this.preview = preview;
    this.fitBand();

    chip.on("pointerdown", () => {
      this.voiceIndex = (this.voiceIndex + 1) % this.voiceOptions.length;
      const next = this.voiceOptions[this.voiceIndex];
      updateSettings({ preferredVoiceURI: next.voiceURI });
      setPreferredVoiceURI(next.voiceURI);
      this.fitBand();
    });
    attachPressFeedback(chip);
    this.deps.bucket.push(chip);

    preview.on("pointerdown", () => {
      setPreferredVoiceURI(getSettings().preferredVoiceURI);
      speakWord(VOICE_PREVIEW_TEXT, getSettings().sfxEnabled);
    });
    attachPressFeedback(preview);
    this.deps.bucket.push(preview);
  }

  /**
   * Refreshes the voice options from the platform and resolves the chip index
   * against the stored preference (falling back to "Default (device)" when the
   * URI is unset or no longer installed).
   */
  voiceChanged(): void {
    this.syncVoiceSelection();
    this.fitBand();
  }

  /**
   * Splits the row's one band between the chip and the preview, and sets both
   * hit areas from the result so every caller shares one geometry.
   *
   * The boundary is the midpoint of the gap between what the two labels
   * actually render to, clamped so each half keeps `VOICE_MIN_HALF` and stays
   * inside the card. An anchor midpoint says nothing about label width: a long
   * voice label runs past the chip's half, so the tail of the chip's own text
   * activates Preview, and the right edge of "Preview" falls beyond the card -
   * onto the backdrop, which closes the panel.
   *
   * A different voice changes the chip's width, which is why every label
   * change re-runs this rather than reusing the previous split.
   */
  private fitBand(): void {
    const chip = this.chip;
    const preview = this.preview;
    const band = this.band;
    if (!chip || !preview || !band) return;
    const { cardLeft, cardRight, chipX, previewX } = band;
    const minSplit = cardLeft + VOICE_MIN_HALF;
    const maxSplit = cardRight - VOICE_MIN_HALF;
    // Start from the longest permitted label: a budget shrunk for the previous
    // voice must not make the next one fit by accident.
    this.setChipLabel(VOICE_LABEL_MAX);

    const previewBounds = renderedBounds(preview);
    let splitX = (chipX + previewX) / 2;
    const initialChipBounds = renderedBounds(chip);
    if (initialChipBounds && previewBounds) {
      let chipRight = initialChipBounds.right;
      const splitFor = (right: number): number =>
        clampSplit((right + previewBounds.left) / 2, minSplit, maxSplit);
      splitX = splitFor(chipRight);
      // Keep shortening the chip until its rendered right edge clears the
      // boundary; the floor stops the label from becoming a stub.
      let budget = VOICE_LABEL_MAX;
      while (chipRight > splitX && budget > VOICE_LABEL_MIN) {
        budget = Math.max(budget - VOICE_LABEL_STEP, VOICE_LABEL_MIN);
        this.setChipLabel(budget);
        const measured = renderedBounds(chip);
        if (!measured) break;
        chipRight = measured.right;
        splitX = splitFor(chipRight);
      }
    }

    // Both rectangles are written around each object's own position, because
    // `centredHitArea` cancels the displayOrigin the engine would otherwise add.
    this.applyHitArea(
      chip,
      new Phaser.Geom.Rectangle(cardLeft - chipX, -ROW_PITCH / 2, splitX - cardLeft, ROW_PITCH),
    );
    this.applyHitArea(
      preview,
      new Phaser.Geom.Rectangle(splitX - previewX, -ROW_PITCH / 2, cardRight - splitX, ROW_PITCH),
    );
  }

  /** Writes the current voice into the chip at the given truncation budget. */
  private setChipLabel(budget: number): void {
    const option = this.voiceOptions[this.voiceIndex];
    this.chip?.setText(`Voice: ${truncateLabel(option.label, budget)}`);
  }

  /**
   * Points an object's hit area at `rect`.
   *
   * `setInteractive` keeps the first hit area it was given and only re-enables
   * the object on a later call, so a second call leaves the stale rectangle in
   * place; assigning the new one is what actually moves the band.
   */
  private applyHitArea(object: Phaser.GameObjects.Text, rect: Phaser.Geom.Rectangle): void {
    const area = {
      hitArea: rect,
      hitAreaCallback: centredHitArea(rect.width, rect.height, rect.x, rect.y).hitAreaCallback,
    };
    if (object.input) {
      object.input.hitArea = area.hitArea;
      object.input.hitAreaCallback = area.hitAreaCallback;
      return;
    }
    object.setInteractive(area);
  }

  /** Reads the platform voice list and resolves the persisted selection. */
  private syncVoiceSelection(): void {
    this.voiceOptions = availableVoiceOptions(window.speechSynthesis?.getVoices?.() ?? []);
    const stored = getSettings().preferredVoiceURI;
    this.voiceIndex = Math.max(
      0,
      this.voiceOptions.findIndex((option) => option.voiceURI === stored),
    );
  }
}
