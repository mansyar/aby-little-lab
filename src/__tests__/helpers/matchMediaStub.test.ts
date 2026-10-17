import { afterEach, describe, expect, it, vi } from "vitest";
import { createMatchMediaMock, REDUCED_MOTION_QUERY, stubMatchMedia } from "./matchMediaStub";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createMatchMediaMock", () => {
  it("reports reduced motion only for the reduced-motion query", () => {
    const matchMedia = createMatchMediaMock(true);

    expect(matchMedia(REDUCED_MOTION_QUERY).matches).toBe(true);
    expect(matchMedia("(display-mode: standalone)").matches).toBe(false);
  });

  it("reports false for every query when reduced motion is off", () => {
    const matchMedia = createMatchMediaMock(false);

    expect(matchMedia(REDUCED_MOTION_QUERY).matches).toBe(false);
    expect(matchMedia("(display-mode: standalone)").matches).toBe(false);
  });

  it("returns the full MediaQueryList surface with inert listeners", () => {
    const matchMedia = createMatchMediaMock(false);
    const mql = matchMedia(REDUCED_MOTION_QUERY);

    expect(mql.media).toBe(REDUCED_MOTION_QUERY);
    expect(mql.onchange).toBeNull();
    for (const key of [
      "addListener",
      "removeListener",
      "addEventListener",
      "removeEventListener",
      "dispatchEvent",
    ] as const) {
      expect(mql[key]).toBeTypeOf("function");
    }
  });

  it("issues a fresh listener set per media-query call", () => {
    const matchMedia = createMatchMediaMock(false);
    const first = matchMedia(REDUCED_MOTION_QUERY);
    const second = matchMedia(REDUCED_MOTION_QUERY);

    expect(second).not.toBe(first);
    expect(second.addEventListener).not.toBe(first.addEventListener);
  });
});

describe("stubMatchMedia", () => {
  it("installs the returned mock as the global matchMedia", () => {
    const matchMedia = stubMatchMedia(true);

    expect(window.matchMedia).toBe(matchMedia);
    expect(window.matchMedia(REDUCED_MOTION_QUERY).matches).toBe(true);
  });

  it("can be re-tuned between test phases via setReducedMotion", () => {
    const matchMedia = stubMatchMedia(false);
    expect(matchMedia(REDUCED_MOTION_QUERY).matches).toBe(false);

    matchMedia.setReducedMotion(true);
    expect(matchMedia(REDUCED_MOTION_QUERY).matches).toBe(true);

    matchMedia.setReducedMotion(false);
    expect(matchMedia(REDUCED_MOTION_QUERY).matches).toBe(false);
  });

  it("can be re-tuned between test phases via mockImplementation", () => {
    const matchMedia = stubMatchMedia(false);
    expect(matchMedia(REDUCED_MOTION_QUERY).matches).toBe(false);

    matchMedia.mockImplementation((query: string) => ({
      matches: query === REDUCED_MOTION_QUERY,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    expect(matchMedia(REDUCED_MOTION_QUERY).matches).toBe(true);
  });
});
