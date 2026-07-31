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
  scene?: { tweens: { add: ReturnType<typeof vi.fn> } };
}

/** Builds a minimal interactive-object mock that records event handlers. */
function createMockControl(baseScale = 1, scene?: MockControl["scene"]): MockControl {
  const handlers = new Map<string, Array<() => void>>();
  const obj = {
    scaleX: baseScale,
    setScale: vi.fn(),
    scene,
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

  it("springs back with an overshoot tween on release when spring is enabled", () => {
    stubMatchMedia(false);
    const tweensAdd = vi.fn();
    const control = createMockControl(1, { tweens: { add: tweensAdd } });

    attachPressFeedback(control as never, { spring: true });

    control.fire("pointerdown");
    expect(control.setScale).toHaveBeenCalledWith(0.95);

    control.fire("pointerup");
    expect(tweensAdd).toHaveBeenCalledWith({
      targets: control,
      scaleX: 1,
      scaleY: 1,
      duration: 150,
      ease: "Back.out",
    });
  });

  it("springs back on pointerout and pointercancel when spring is enabled", () => {
    stubMatchMedia(false);
    const tweensAdd = vi.fn();
    const control = createMockControl(1, { tweens: { add: tweensAdd } });

    attachPressFeedback(control as never, { spring: true });

    for (const event of ["pointerout", "pointercancel"]) {
      tweensAdd.mockClear();
      control.fire("pointerdown");
      control.fire(event);
      expect(tweensAdd).toHaveBeenCalledTimes(1);
    }
  });

  it("springs relative to the control's base scale", () => {
    stubMatchMedia(false);
    const tweensAdd = vi.fn();
    const control = createMockControl(0.8, { tweens: { add: tweensAdd } });

    attachPressFeedback(control as never, { spring: true });

    control.fire("pointerdown");
    expect(control.setScale).toHaveBeenCalledWith(0.76);
    control.fire("pointerup");
    expect(tweensAdd).toHaveBeenCalledWith(
      expect.objectContaining({ targets: control, scaleX: 0.8, scaleY: 0.8 }),
    );
  });

  it("registers no listeners under reduced motion even with spring enabled", () => {
    stubMatchMedia(true);
    const control = createMockControl();

    attachPressFeedback(control as never, { spring: true });

    expect(control.on).not.toHaveBeenCalled();
  });
});
