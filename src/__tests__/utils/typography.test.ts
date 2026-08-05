import { describe, expect, it } from "vitest";
import {
  FONT_FAMILY,
  FONT_SIZE_LARGE,
  FONT_SIZE_MEDIUM,
  FONT_SIZE_SMALL,
  FONT_SIZE_XLARGE,
  textStyle,
} from "../../utils/typography";

describe("typography utility", () => {
  describe("FONT_FAMILY", () => {
    it("is a non-empty string", () => {
      expect(typeof FONT_FAMILY).toBe("string");
      expect(FONT_FAMILY.length).toBeGreaterThan(0);
    });

    it("references the bundled Baloo 2 font first", () => {
      expect(FONT_FAMILY.startsWith('"Baloo 2"')).toBe(true);
    });

    it("includes a fallback sans-serif stack", () => {
      expect(FONT_FAMILY.toLowerCase()).toContain("sans-serif");
    });
  });

  describe("font-size presets", () => {
    it("defines small, medium, large and xlarge sizes", () => {
      expect(FONT_SIZE_SMALL).toBe(18);
      expect(FONT_SIZE_MEDIUM).toBe(24);
      expect(FONT_SIZE_LARGE).toBe(32);
      expect(FONT_SIZE_XLARGE).toBe(40);
    });

    it("sizes are strictly increasing", () => {
      expect(FONT_SIZE_SMALL).toBeLessThan(FONT_SIZE_MEDIUM);
      expect(FONT_SIZE_MEDIUM).toBeLessThan(FONT_SIZE_LARGE);
      expect(FONT_SIZE_LARGE).toBeLessThan(FONT_SIZE_XLARGE);
    });
  });

  describe("textStyle", () => {
    it("applies the app font family", () => {
      expect(textStyle()).toEqual({ fontFamily: FONT_FAMILY });
    });

    it("preserves the caller's style props", () => {
      expect(textStyle({ fontSize: "24px", color: "#2d3748" })).toEqual({
        fontFamily: FONT_FAMILY,
        fontSize: "24px",
        color: "#2d3748",
      });
    });

    it("does not override an explicit fontFamily", () => {
      expect(textStyle({ fontFamily: "serif" })).toEqual({ fontFamily: "serif" });
    });
  });
});
