import { expect } from "vitest";

/**
 * Minimal structural shape of a vi.fn as used by the scene-test Phaser mocks.
 * Every mocked game-object member (on, setScale, ...) satisfies this.
 */
interface MockedFn {
  (...args: unknown[]): unknown;
  mock: { calls: unknown[][]; results: Array<{ value: unknown }> };
  mockClear(): MockedFn;
}

/** A mocked Phaser game object: members are vi.fn mocks keyed by name. */
type MockGameObject = Record<string, MockedFn>;

function asMockFn(value: unknown): MockedFn {
  return value as MockedFn;
}

/** True when the mocked object registered at least one pointerdown handler. */
function isInteractive(value: unknown): value is MockGameObject {
  const obj = value as Partial<MockGameObject> | undefined;
  if (!obj?.on) return false;
  return asMockFn(obj.on).mock.calls.some((call) => call[0] === "pointerdown");
}

/** Fires every handler registered for the event, in registration order. */
export function fireAllEvents(obj: MockGameObject, event: string): void {
  for (const call of obj.on.mock.calls) {
    if (call[0] === event && typeof call[1] === "function") {
      (call[1] as () => void)();
    }
  }
}

/** Fires only the first-registered handler for the event. */
export function fireFirstHandler(obj: MockGameObject, event: string): void {
  const call = obj.on.mock.calls.find((entry) => entry[0] === event);
  if (call && typeof call[1] === "function") {
    (call[1] as () => void)();
  }
}

/** Counts handlers registered on the mocked object for the event. */
export function countListeners(obj: MockGameObject, event: string): number {
  return obj.on.mock.calls.filter((call) => call[0] === event).length;
}

/** Interactive rectangles created by the scene (choice cards / letter tiles). */
export function getInteractiveRects(scene: unknown): MockGameObject[] {
  const rectangle = asMockFn((scene as MockGameObject).add.rectangle);
  return rectangle.mock.results.map((result) => result.value).filter(isInteractive);
}

/** Interactive images created by the scene (e.g. Musical Memory frogs). */
export function getInteractiveImages(scene: unknown): MockGameObject[] {
  const image = asMockFn((scene as MockGameObject).add.image);
  return image.mock.results.map((result) => result.value).filter(isInteractive);
}

/**
 * Asserts the shared press-feedback grammar on one control (instant-restore
 * variant used by choice cards): squishes to 95% of its base scale while
 * pressed and restores the base scale on pointerup, pointerout, and
 * pointercancel. Spring-based controls (Hub tiles) are covered separately.
 */
export function expectPressFeedbackContract(control: MockGameObject, baseScale = 1): void {
  const pressed = Number((baseScale * 0.95).toFixed(10));

  fireAllEvents(control, "pointerdown");
  expect(control.setScale).toHaveBeenCalledWith(pressed);

  for (const event of ["pointerup", "pointerout", "pointercancel"] as const) {
    control.setScale.mockClear();
    fireAllEvents(control, "pointerdown");
    fireAllEvents(control, event);
    expect(control.setScale).toHaveBeenLastCalledWith(baseScale);
  }
}
