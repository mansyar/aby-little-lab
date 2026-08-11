import { afterEach, describe, expect, it, vi } from "vitest";
import { ensureGlyphFontLoaded } from "../../utils/fonts";

/**
 * Regression guard for the BootScene font-load gate (track
 * baloo2-glyphs_20260811).
 *
 * Phaser's SVG loader rasterizes <text> elements ONCE at load time into
 * textures. The letter/numeral glyph SVGs carry `font-family="'Baloo 2',
 * Arial, Helvetica, sans-serif"`, so Baloo 2 must be loaded before Preload
 * runs, otherwise the glyphs silently rasterize as Arial on first visit.
 * `ensureGlyphFontLoaded()` is the no-throw gate: it must NEVER reject or
 * hang the boot, so on any failure (missing API, thrown error, rejected
 * load, stalled network) it resolves and the SVG fallback stack renders.
 */

// Intentional: assert the descriptor/timeout contract with literals rather
// than importing module internals (a shared import would create a false pass).
const BALOO_2_DESCRIPTOR = '700 400px "Baloo 2"';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("ensureGlyphFontLoaded", () => {
  it("resolves immediately when document is unavailable (SSR/worker)", async () => {
    vi.stubGlobal("document", undefined);

    await expect(ensureGlyphFontLoaded()).resolves.toBeUndefined();
  });

  it("resolves immediately when document.fonts is missing", async () => {
    vi.stubGlobal("document", {});

    await expect(ensureGlyphFontLoaded()).resolves.toBeUndefined();
  });

  it("resolves when fonts.load throws synchronously", async () => {
    vi.stubGlobal("document", {
      fonts: {
        load: vi.fn(() => {
          throw new Error("FontFaceSet unavailable");
        }),
      },
    });

    await expect(ensureGlyphFontLoaded()).resolves.toBeUndefined();
  });

  it("resolves (no-throw) when the font load rejects", async () => {
    vi.stubGlobal("document", {
      fonts: {
        load: vi.fn(() => Promise.reject(new Error("font fetch failed"))),
      },
    });

    await expect(ensureGlyphFontLoaded()).resolves.toBeUndefined();
  });

  it("loads the Baloo 2 glyph font before resolving", async () => {
    const load = vi.fn(() => Promise.resolve([]));
    vi.stubGlobal("document", { fonts: { load } });

    await ensureGlyphFontLoaded();

    expect(load).toHaveBeenCalledWith(BALOO_2_DESCRIPTOR);
  });

  it("resolves via the timeout guard when the font load never settles", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("document", {
      fonts: {
        load: vi.fn(
          () =>
            new Promise(() => {
              // Never settles — simulates a stalled network.
            }),
        ),
      },
    });

    const promise = ensureGlyphFontLoaded();
    const result = expect(promise).resolves.toBeUndefined();
    vi.advanceTimersByTime(2500);
    await result;
  });
});
