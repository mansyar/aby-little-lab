import { vi } from "vitest";

/**
 * Shared `window.matchMedia` stub for tests that exercise reduced-motion
 * (and other media-query) behavior. Replaces the per-file copies previously
 * duplicated across ~15 test files.
 */

export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export type MockFn = ReturnType<typeof vi.fn>;

/** The subset of `MediaQueryList` production code and tests rely on. */
export interface MediaQueryListStub {
  matches: boolean;
  media: string;
  onchange: null;
  addListener: MockFn;
  removeListener: MockFn;
  addEventListener: MockFn;
  removeEventListener: MockFn;
  dispatchEvent: MockFn;
}

/**
 * Builds a `matchMedia` mock that reports `reducedMotion` only for the
 * reduced-motion query (other queries always match `false`).
 */
export function createMatchMediaMock(reducedMotion: boolean): MockFn {
  return vi.fn(
    (query: string): MediaQueryListStub => ({
      matches: query === REDUCED_MOTION_QUERY ? reducedMotion : false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  );
}

/**
 * Stubs the global `matchMedia` with {@link createMatchMediaMock} and returns
 * the mock so tests can hold it or re-tune it via `mockImplementation`.
 */
export function stubMatchMedia(reducedMotion = false): MatchMediaStub {
  let reduced = reducedMotion;
  const matchMedia = vi.fn(
    (query: string): MediaQueryListStub => ({
      matches: query === REDUCED_MOTION_QUERY ? reduced : false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  ) as MatchMediaStub;
  matchMedia.setReducedMotion = (value: boolean) => {
    reduced = value;
  };
  vi.stubGlobal("matchMedia", matchMedia);
  return matchMedia;
}

/** The mock returned by {@link stubMatchMedia}. */
export interface MatchMediaStub extends MockFn {
  /** Toggles the `prefers-reduced-motion` result for subsequent queries. */
  setReducedMotion(reduced: boolean): void;
}
