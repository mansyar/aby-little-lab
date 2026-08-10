import Phaser from "phaser";
import { AudioManager } from "../audio/AudioManager";
import { ensureGlyphFontLoaded } from "../utils/fonts";
import { setPreferredVoiceURI } from "../utils/speech";
import { getSettings } from "../utils/storage";

/**
 * Boot scene — the first scene loaded by the game.
 *
 * Initializes the audio system, applies the stored TTS voice preference,
 * attempts to lock the screen orientation to landscape, ensures the bundled
 * Baloo 2 font is ready for the glyph SVGs, then transitions to the Preload
 * scene.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "Boot" });
  }

  async create(): Promise<void> {
    AudioManager.getInstance().init();
    // Apply the device-level TTS voice preference before any scene speaks.
    setPreferredVoiceURI(getSettings().preferredVoiceURI);

    // iPad Safari/Chrome (all iOS browsers use WebKit) only implement a partial
    // Screen Orientation API: `screen.orientation` exists but `lock()` does
    // not. Calling it throws a synchronous TypeError that would abort this
    // scene before Preload starts, leaving the game stuck on a black screen.
    const orientation = screen.orientation;
    if (orientation && typeof orientation.lock === "function") {
      orientation.lock("landscape").catch(() => {
        // Orientation lock may fail on unsupported browsers; ignore.
      });
    }

    // The letter/numeral glyph SVGs carry `font-family="'Baloo 2', Arial, ..."`.
    // Phaser rasterizes SVG <text> once at load time, so Baloo 2 must be
    // loaded before Preload starts, otherwise the glyphs silently fall back
    // to Arial on first visit. The gate is no-throw: on any failure it
    // resolves and the fallback stack renders instead.
    await ensureGlyphFontLoaded();
    this.scene.start("Preload");
  }
}
