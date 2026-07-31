import { afterEach, describe, expect, it, vi } from "vitest";
import { attachPressFeedback } from "../../utils/pressFeedback";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/** Stubs window.matchMedia so tests can simulate reduced-motion preferences. */
function stubMatchMedia(matches: boolean): void {
  const matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query === REDUCED_MOTION_QUERY ? matches : false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
  vi.stubGlobal("matchMedia", matchMedia);
}

interface MockControl {
  scaleX: number;
  setScale: ReturnType<typeof vi.fn>;
  on: ReturnType<typeof vi.fn>;
  fire: (event: string) => void;
}

/** Builds a minimal interactive-object mock that records event handlers. */
function createMockControl(baseScale = 1): MockControl {
  const handlers = new Map<string, Array<() => void>>();
  const obj = {
    scaleX: baseScale,
    setScale: vi.fn(),
    on: vi.fn((event: string, handler: () => void) => {
      const list = handlers.get(event) ?? [];
      list.push(handler);
      handlers.set(event, list);
      return obj;
    }),
    fire(event: string) {
      for (const handler of handlers.get(event) ?? []) {
        handler();
      }
    },
  };
  return obj;
}

describe("attachPressFeedback", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("squishes the control to 95% on pointerdown", () => {
    stubMatchMedia(false);
    const control = createMockControl();

    attachPressFeedback(control as never);

    control.fire("pointerdown");
    expect(control.setScale).toHaveBeenCalledWith(0.95);
  });

  it("restores the base scale on pointerup, pointerout, and pointercancel", () => {
    stubMatchMedia(false);
    const control = createMockControl();

    attachPressFeedback(control as never);

    for (const event of ["pointerup", "pointerout", "pointercancel"]) {
      control.setScale.mockClear();
      control.fire("pointerdown");
      control.fire(event);
      expect(control.setScale).toHaveBeenLastCalledWith(1);
    }
  });

  it("scales relative to the control's base scale", () => {
    stubMatchMedia(false);
    const control = createMockControl(0.8);

    attachPressFeedback(control as never);

    control.fire("pointerdown");
    expect(control.setScale).toHaveBeenCalledWith(0.76);
    control.fire("pointerup");
    expect(control.setScale).toHaveBeenLastCalledWith(0.8);
  });

  it("registers no listeners under reduced motion", () => {
    stubMatchMedia(true);
    const control = createMockControl();

    attachPressFeedback(control as never);

    expect(control.on).not.toHaveBeenCalled();
  });
});
