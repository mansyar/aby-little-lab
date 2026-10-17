import { afterEach, describe, expect, it, vi } from "vitest";
import { isReducedMotion, motionDuration, motionScale } from "../../utils/motion";
import { stubMatchMedia } from "../helpers/matchMediaStub";

describe("motion utility", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("isReducedMotion", () => {
    it("returns true when the OS prefers reduced motion", () => {
      stubMatchMedia(true);
      expect(isReducedMotion()).toBe(true);
    });

    it("returns false when the OS does not prefer reduced motion", () => {
      stubMatchMedia(false);
      expect(isReducedMotion()).toBe(false);
    });

    it("returns false when matchMedia is unavailable", () => {
      vi.stubGlobal("matchMedia", undefined);
      expect(isReducedMotion()).toBe(false);
    });
  });

  describe("motionDuration", () => {
    it("returns the normal duration by default", () => {
      stubMatchMedia(false);
      expect(motionDuration(400, 180)).toBe(400);
    });

    it("returns the reduced duration when reduced motion is preferred", () => {
      stubMatchMedia(true);
      expect(motionDuration(400, 180)).toBe(180);
    });
  });

  describe("motionScale", () => {
    it("returns the normal amplitude by default", () => {
      stubMatchMedia(false);
      expect(motionScale(1.2, 1.05)).toBe(1.2);
    });

    it("returns the reduced amplitude when reduced motion is preferred", () => {
      stubMatchMedia(true);
      expect(motionScale(1.2, 1.05)).toBe(1.05);
    });
  });
});
