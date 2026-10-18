import { expect, vi } from "vitest";
import type { MockFn } from "./phaserMock";

/**
 * Shared doubles and assertions for the scene-flow integration suites.
 *
 * The suites were originally one 7,000-line file whose top half re-declared the
 * same mocks for every module. Those mocks live here instead: each consuming
 * test file keeps only its `vi.mock(...)` wiring, which must stay in the test
 * file because Vitest hoists those calls above the imports.
 *
 * Importing this module gives a test file its own fresh set of spies, since the
 * helper is re-evaluated per test file's module graph.
 */

/** AudioManager singleton stand-in; every method is a spy. */
export const mockAudio = {
  init: vi.fn(),
  resume: vi.fn(),
  playBGM: vi.fn(),
  playCorrect: vi.fn(),
  playIncorrect: vi.fn(),
  playWin: vi.fn(),
  playSticker: vi.fn(),
  playPop: vi.fn(),
  playWake: vi.fn(),
  playFrogNote: vi.fn(),
  playIdleCall: vi.fn(),
};

/** Speech utility stand-in; speech is unsupported unless a test says otherwise. */
export const mockSpeech = {
  isSpeechSupported: vi.fn(() => false),
  onSpeechLifecycle: vi.fn(() => vi.fn()),
  unlockSpeechForUserGesture: vi.fn(),
  speakLetter: vi.fn(() => true),
  speakWord: vi.fn(() => true),
  speakNumber: vi.fn(() => true),
  speakSentence: vi.fn(() => true),
  setPreferredVoiceURI: vi.fn(),
};

export const mockSettingsPanel = vi.fn();
export const mockSettingsPanelDestroy = vi.fn();

/** SettingsPanel stand-in that records constructor arguments and destroy calls. */
export class MockSettingsPanel {
  constructor(...args: unknown[]) {
    mockSettingsPanel(...args);
  }

  destroy(): void {
    mockSettingsPanelDestroy();
  }
}

export const mockPwaToast = vi.fn();
export const mockPwaToastDestroy = vi.fn();

/** PwaToast stand-in that records constructor arguments and destroy calls. */
export class MockPwaToast {
  constructor(...args: unknown[]) {
    mockPwaToast(...args);
  }

  destroy(): void {
    mockPwaToastDestroy();
  }
}

/**
 * PWA bridge stand-in. `mockBridgeState.listener` holds the single subscriber
 * so tests can emit lifecycle events with {@link emitPwaEvent}.
 */
export const mockBridgeState = {
  listener: null as null | ((event: "needRefresh" | "offlineReady") => void),
};

export const mockBridge = {
  subscribe: vi.fn((listener: (event: "needRefresh" | "offlineReady") => void) => {
    mockBridgeState.listener = listener;
    return vi.fn();
  }),
  setHubActive: vi.fn(),
  updateNow: vi.fn(),
  updateAvailable: vi.fn(() => false),
  offlineReadyShown: vi.fn(() => false),
};

/** Emits a PWA lifecycle event through the mock bridge's subscribed listener. */
export function emitPwaEvent(event: "needRefresh" | "offlineReady"): void {
  mockBridgeState.listener?.(event);
}

/** Scene registry stand-in: lazy scene loading resolves immediately. */
export const mockEnsureSceneLoaded = vi.fn(async () => {});

/** Glyph-font gate stand-in: BootScene's await resolves immediately. */
export const mockEnsureGlyphFontLoaded = vi.fn(() => Promise.resolve());

/**
 * Storage spies layered over the real implementation. The consuming `vi.mock`
 * factory installs `mockImplementation` from the actual module so state still
 * changes; tests assert on call counts and arguments.
 */
export const mockStorageHasSticker = vi.fn();
export const mockStorageEarnSticker = vi.fn();

/**
 * Real storage implementations, captured by the consuming `vi.mock` factory so
 * a test that stubbed a spy can put the real behaviour back mid-suite.
 */
export const storageActual: Partial<typeof import("../../utils/storage")> = {};

/** Re-installs real storage behaviour after a test replaced it with a stub. */
export function restoreStorageSpies(): void {
  const { hasSticker, earnSticker } = storageActual;
  if (hasSticker) mockStorageHasSticker.mockImplementation(hasSticker);
  if (earnSticker) mockStorageEarnSticker.mockImplementation(earnSticker);
}

/** Casts a Phaser-typed method to a MockFn for mock assertions. */
export function getMockFn(fn: unknown): MockFn {
  return fn as unknown as MockFn;
}

/** Collects all game objects created by scene.add.* methods. */
export function getAllGameObjects(scene: unknown): Array<Record<string, MockFn>> {
  const add = (scene as { add: Record<string, unknown> }).add;
  const objects: Array<Record<string, MockFn>> = [];
  for (const method of Object.values(add)) {
    const mock = getMockFn(method);
    if (mock.mock?.results) {
      for (const result of mock.mock.results) {
        objects.push(result.value as Record<string, MockFn>);
      }
    }
  }
  return objects;
}

/** Verifies that a success interaction uses one bounded, self-cleaning visual effect. */
export function assertBoundedSuccessEffect(scene: unknown, initialGraphicsCount: number): void {
  const add = (scene as { add: Record<string, unknown> }).add;
  const graphicsMock = getMockFn(add.graphics);
  expect(getMockFn(add.particles)).not.toHaveBeenCalled();
  expect(graphicsMock.mock.results.length).toBeGreaterThan(initialGraphicsCount);

  const effect = graphicsMock.mock.results[initialGraphicsCount]?.value as
    | Record<string, MockFn>
    | undefined;
  if (!effect) return;

  const tweenCalls = getMockFn((scene as { tweens: Record<string, unknown> }).tweens.add).mock
    .calls;
  const effectTween = tweenCalls.find((call) => call[0]?.targets === effect);
  expect(effectTween).toBeDefined();
  if (!effectTween) return;

  const config = effectTween[0] as { duration?: number; onComplete?: () => void };
  expect(config.duration).toBeLessThanOrEqual(800);
  expect(config.onComplete).toEqual(expect.any(Function));

  config.onComplete?.();
  expect(getMockFn(effect.destroy)).toHaveBeenCalledTimes(1);
}

/**
 * Verifies that a round completion plays the choreographed win celebration:
 * a growing/fading ray burst, drifting confetti bits, and no particle emitter.
 */
export function assertWinCelebrationCreated(scene: unknown): void {
  const add = (scene as { add: Record<string, unknown> }).add;
  const tweenCalls = getMockFn((scene as { tweens: Record<string, unknown> }).tweens.add).mock
    .calls;

  // The ray burst grows and fades (motionScale(1.25, 1) under normal motion)
  expect(
    tweenCalls.some(
      (call) => call[0]?.scaleX === 1.25 && call[0]?.scaleY === 1.25 && call[0]?.alpha === 0,
    ),
  ).toBe(true);

  // Confetti bits drift and spin
  expect(tweenCalls.some((call) => typeof call[0]?.angle === "number")).toBe(true);

  // The celebration never uses a particle emitter
  expect(getMockFn(add.particles)).not.toHaveBeenCalled();
}

/** Triggers all pointerdown callbacks registered on game objects. */
export function triggerAllPointerdowns(scene: unknown): void {
  const allObjects = getAllGameObjects(scene);
  for (const obj of allObjects) {
    const onMock = getMockFn(obj.on);
    const pointerdownCall = onMock.mock.calls.find((call) => call[0] === "pointerdown");
    if (pointerdownCall && typeof pointerdownCall[1] === "function") {
      pointerdownCall[1]();
    }
  }
}

/** Triggers all pointerup callbacks registered on game objects. */
export function triggerAllPointerups(scene: unknown): void {
  const allObjects = getAllGameObjects(scene);
  for (const obj of allObjects) {
    const onMock = getMockFn(obj.on);
    const pointerupCall = onMock.mock.calls.find((call) => call[0] === "pointerup");
    if (pointerupCall && typeof pointerupCall[1] === "function") {
      pointerupCall[1]();
    }
  }
}

/** Triggers the shutdown event on a scene, invoking any registered shutdown callbacks. */
export function triggerShutdown(scene: unknown): void {
  const events = (scene as { events: Record<string, unknown> }).events;
  const onMock = getMockFn(events.on);
  const shutdownCall = onMock.mock.calls.find((call) => call[0] === "shutdown");
  if (shutdownCall && typeof shutdownCall[1] === "function") {
    shutdownCall[1]();
  }
}

/**
 * Completes all pending scene transitions by invoking every camera fadeOut
 * callback registered so far. Scene starts are deferred until the fade-out
 * completes, so tests must call this before asserting navigation.
 */
export function completeFadeOuts(scene: unknown): void {
  const cameras = (scene as { cameras: { main: Record<string, unknown> } }).cameras;
  const fadeOutMock = getMockFn(cameras.main.fadeOut);
  for (const call of fadeOutMock.mock.calls) {
    const callback = call[4] as (() => void) | undefined;
    callback?.();
  }
}

/** Returns true if any game object's off method was called. */
export function anyObjectOffCalled(scene: unknown): boolean {
  const allObjects = getAllGameObjects(scene);
  return allObjects.some((obj) => {
    const offMock = obj.off as unknown as MockFn;
    return offMock?.mock?.calls?.length > 0;
  });
}

/** Returns the object returned by the LAST add.image call with the given texture. */
export function findLastAddedImage(
  scene: unknown,
  texture: string,
): Record<string, MockFn> | undefined {
  const imageMock = getMockFn((scene as { add: Record<string, unknown> }).add.image);
  for (let i = imageMock.mock.calls.length - 1; i >= 0; i--) {
    if (imageMock.mock.calls[i]?.[2] === texture) {
      return imageMock.mock.results[i]?.value as Record<string, MockFn> | undefined;
    }
  }
  return undefined;
}

/** Fires the first pointerup handler registered on a game object. */
export function triggerPointerupOn(obj: Record<string, MockFn>): void {
  const onMock = getMockFn(obj.on);
  const call = onMock.mock.calls.find((c) => c[0] === "pointerup");
  if (call && typeof call[1] === "function") {
    call[1]();
  }
}

/** Returns the first text game object whose label contains the given text. */
export function getTextObject(
  scene: unknown,
  labelPart: string,
): Record<string, MockFn> | undefined {
  const textMock = getMockFn((scene as { add: Record<string, unknown> }).add.text);
  for (let i = 0; i < textMock.mock.calls.length; i++) {
    const text = textMock.mock.calls[i][2] as string;
    if (typeof text === "string" && text.includes(labelPart)) {
      return textMock.mock.results[i].value as Record<string, MockFn>;
    }
  }
  return undefined;
}

/** Returns all rectangle game objects (the Hub tiles). */
export function getRectangles(scene: unknown): Array<Record<string, MockFn>> {
  const rectangleMock = getMockFn((scene as { add: Record<string, unknown> }).add.rectangle);
  return rectangleMock.mock.results.map((result) => result.value as Record<string, MockFn>);
}

/** Returns image objects created with sticker_* texture keys (Hub shelf thumbnails). */
export function getStickerImages(
  scene: unknown,
): Array<{ obj: Record<string, MockFn>; key: string }> {
  const imageMock = getMockFn((scene as { add: Record<string, unknown> }).add.image);
  const stickers: Array<{ obj: Record<string, MockFn>; key: string }> = [];
  for (let i = 0; i < imageMock.mock.calls.length; i++) {
    const key = imageMock.mock.calls[i][2] as string;
    if (typeof key === "string" && key.startsWith("sticker_")) {
      stickers.push({ obj: imageMock.mock.results[i].value as Record<string, MockFn>, key });
    }
  }
  return stickers;
}

/** Returns the sticker image object for the given texture key. */
export function getStickerImage(scene: unknown, key: string): Record<string, MockFn> {
  const sticker = getStickerImages(scene).find((s) => s.key === key);
  if (!sticker) throw new Error(`Sticker ${key} not found`);
  return sticker.obj;
}

/** Returns the sticker image for a key, or undefined when not rendered. */
export function getStickerImageSafe(
  scene: unknown,
  key: string,
): Record<string, MockFn> | undefined {
  return getStickerImages(scene).find((s) => s.key === key)?.obj;
}

/** Returns the image game object created with the given texture key. */
export function getImageByKey(scene: unknown, key: string): Record<string, MockFn> | undefined {
  const imageMock = getMockFn((scene as { add: Record<string, unknown> }).add.image);
  for (let i = 0; i < imageMock.mock.calls.length; i++) {
    if (imageMock.mock.calls[i][2] === key) {
      return imageMock.mock.results[i].value as Record<string, MockFn>;
    }
  }
  return undefined;
}

/** Returns the dashed empty-slot outlines drawn by the Hub for unearned stickers. */
export function getEmptySlots(scene: unknown): Array<Record<string, MockFn>> {
  const graphicsMock = getMockFn((scene as { add: Record<string, unknown> }).add.graphics);
  const slots: Array<Record<string, MockFn>> = [];
  for (let i = 0; i < graphicsMock.mock.results.length; i++) {
    const obj = graphicsMock.mock.results[i].value as Record<string, MockFn>;
    const lineStyleCalls = getMockFn(obj.lineStyle).mock.calls;
    const arcCalls = getMockFn(obj.arc).mock.calls;
    if (lineStyleCalls.length > 0 && arcCalls.length > 0) {
      slots.push(obj);
    }
  }
  return slots;
}

/** Returns the tile icon images added by the Hub (distinct from stickers). */
export function getTileIcons(scene: unknown): Array<{ obj: Record<string, MockFn>; key: string }> {
  const imageMock = getMockFn((scene as { add: Record<string, unknown> }).add.image);
  const icons: Array<{ obj: Record<string, MockFn>; key: string }> = [];
  for (let i = 0; i < imageMock.mock.calls.length; i++) {
    const key = imageMock.mock.calls[i][2] as string;
    if (typeof key === "string" && key.startsWith("tile_")) {
      icons.push({ obj: imageMock.mock.results[i].value as Record<string, MockFn>, key });
    }
  }
  return icons;
}

/** Fires every registered handler for an event on a game object. */
export function fireAllObjectEvents(obj: Record<string, MockFn>, event: string): void {
  const onMock = getMockFn(obj.on);
  for (const call of onMock.mock.calls) {
    if (call[0] === event && typeof call[1] === "function") {
      call[1]();
    }
  }
}

/** Completes the Hub's staggered entrance tweens (invokes their onComplete). */
export function completeHubEntrances(scene: unknown): void {
  const tweenCalls = getMockFn((scene as { tweens: Record<string, unknown> }).tweens.add).mock
    .calls;
  for (const call of tweenCalls) {
    const config = call[0] as { duration?: number; onComplete?: () => void };
    if (config.duration === 300 && typeof config.onComplete === "function") {
      config.onComplete();
    }
  }
}

/** Asserts that an interactive object exposes a 96x96 logical-pixel hit area. */
export function expectTouchTargetSize(obj: Record<string, MockFn>): void {
  const setInteractiveMock = getMockFn(obj.setInteractive);
  const interactiveConfig = setInteractiveMock.mock.calls.find(
    (call) => call[0] && typeof call[0] === "object" && "hitArea" in call[0],
  )?.[0] as { hitArea: { width: number; height: number } } | undefined;
  expect(interactiveConfig).toBeDefined();
  expect(interactiveConfig?.hitArea.width).toBeGreaterThanOrEqual(96);
  expect(interactiveConfig?.hitArea.height).toBeGreaterThanOrEqual(96);
}

/**
 * Asserts that the interactive hit area is anchored at the top-left of the
 * control's display bounds (Phaser hit areas are origin-independent).
 */
export function expectHitAreaOrigin(obj: Record<string, MockFn>, x: number, y: number): void {
  const setInteractiveMock = getMockFn(obj.setInteractive);
  const interactiveConfig = setInteractiveMock.mock.calls.find(
    (call) => call[0] && typeof call[0] === "object" && "hitArea" in call[0],
  )?.[0] as { hitArea: { x: number; y: number } } | undefined;
  expect(interactiveConfig).toBeDefined();
  expect(interactiveConfig?.hitArea.x).toBe(x);
  expect(interactiveConfig?.hitArea.y).toBe(y);
}

/**
 * Asserts that an Image control does not define a custom hit area, i.e. the
 * engine's frame-based default is used. For origin-0.5 Images on 512x512
 * textures the default frame rect covers exactly the visible scaled icon
 * (custom rects are tested in texture-local space and can be wildly
 * misaligned with the rendered icon).
 */
export function expectUsesDefaultFrameHitArea(obj: Record<string, MockFn>): void {
  const setInteractiveMock = getMockFn(obj.setInteractive);
  const customConfig = setInteractiveMock.mock.calls.find(
    (call) => call[0] && typeof call[0] === "object",
  );
  expect(customConfig).toBeUndefined();
}
