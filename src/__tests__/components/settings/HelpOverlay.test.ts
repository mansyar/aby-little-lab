import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HelpOverlay, type HelpOverlayState } from "../../../components/settings/HelpOverlay";
import { HELP_TOPICS } from "../../../components/settings/helpContent";
import type { MockFn } from "../../helpers/phaserMock";
import { type MockObject, MockScene, mockRegistry } from "../../helpers/phaserMock";

vi.mock("phaser", async () => {
  const { createPhaserModuleMock } = await import("../../helpers/phaserMock");
  return createPhaserModuleMock().module;
});

/** Registry objects whose destroy has not been called (current render). */
function live(): MockObject[] {
  return mockRegistry.filter((obj) => !(obj.destroy as MockFn).mock.calls.length);
}

function liveTexts(label: string): MockObject[] {
  return live().filter((obj) => obj.kind === "text" && obj.args?.[2] === label);
}

/** Fires every registered pointerdown handler on the object. */
function tap(obj: MockObject): void {
  const handlers = obj.allHandlers.filter((entry) => entry.name === "pointerdown");
  if (handlers.length === 0) throw new Error("no pointerdown handler");
  for (const entry of handlers) entry.cb();
}

/** The single live control with the given label. */
function control(label: string): MockObject {
  const found = liveTexts(label);
  if (found.length !== 1) throw new Error(`expected one ${label} control, got ${found.length}`);
  return found[0] as MockObject;
}

/** Opens a fresh overlay with its own bucket. */
function setup(): { overlay: HelpOverlay; bucket: MockObject[]; scene: MockScene } {
  const scene = new MockScene();
  const bucket: MockObject[] = [];
  const overlay = new HelpOverlay({ scene: scene as never, overlayObjects: bucket as never });
  overlay.open();
  return { overlay, bucket, scene };
}

/** Navigates the menu to a topic by its card label. */
function openTopic(index: number): HelpOverlayState {
  const { overlay } = setup();
  tap(control(HELP_TOPICS[index]?.title ?? ""));
  const state = overlay.e2eState();
  if (state === null) throw new Error("overlay closed unexpectedly");
  return state;
}

beforeEach(() => {
  mockRegistry.length = 0;
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("HelpOverlay", () => {
  it("reports null before open and after close", () => {
    const scene = new MockScene();
    const overlay = new HelpOverlay({ scene: scene as never, overlayObjects: [] as never });
    expect(overlay.e2eState()).toBeNull();
    overlay.open();
    expect(overlay.e2eState()).not.toBeNull();
    overlay.close();
    expect(overlay.e2eState()).toBeNull();
  });

  it("renders one panel, a close control and eight topic cards", () => {
    const { overlay } = setup();
    const state = overlay.e2eState();

    expect(
      live().filter(
        (obj) => obj.kind === "rectangle" && obj.args?.[2] === 480 && obj.args?.[3] === 760,
      ),
    ).toHaveLength(1);
    expect(liveTexts("Parent Help")).toHaveLength(1);
    expect(liveTexts("✕")).toHaveLength(1);
    expect(
      live().filter(
        (obj) => obj.kind === "rectangle" && obj.args?.[2] === 200 && obj.args?.[3] === 96,
      ),
    ).toHaveLength(8);
    expect(state?.screen).toBe("topics");
    expect(state?.topicId).toBeNull();
    expect(state?.topicIndex).toBe(-1);
    expect(state?.topicCount).toBe(8);
    expect(state?.title).toBe("Parent Help");
    expect(state?.lines).toEqual(HELP_TOPICS.map((topic) => topic.title));
    expect(state?.topics.map((topic) => topic.id)).toEqual(HELP_TOPICS.map((topic) => topic.id));
    expect(state?.controls.back).toBeNull();
    expect(state?.controls.prev).toBeNull();
    expect(state?.controls.next).toBeNull();
    expect(state?.controls.close).not.toBeNull();
  });

  it("reopening is idempotent: the old render is destroyed and not duplicated", () => {
    const { overlay } = setup();
    const firstRender = [...live()];
    const firstBucketSize = live().length;
    overlay.open();

    for (const object of firstRender)
      expect((object.destroy as MockFn).mock.calls.length).toBeGreaterThan(0);
    expect(live()).toHaveLength(firstBucketSize);
    expect(liveTexts("Parent Help")).toHaveLength(1);
    expect(overlay.e2eState()?.topics).toHaveLength(8);
  });

  it("close destroys only the shared bucket and leaves other objects untouched", () => {
    const scene = new MockScene();
    const bucket: MockObject[] = [];
    const otherBucket: MockObject[] = [];
    const sentinel = scene.add.text(10, 10, "Settings", {});
    otherBucket.push(sentinel);
    const overlay = new HelpOverlay({ scene: scene as never, overlayObjects: bucket as never });
    overlay.open();
    const rendered = [...bucket];

    overlay.close();

    for (const object of rendered)
      expect((object.destroy as MockFn).mock.calls.length).toBeGreaterThan(0);
    expect(bucket).toHaveLength(0);
    expect((sentinel.destroy as MockFn).mock.calls).toHaveLength(0);
    expect(otherBucket).toHaveLength(1);
  });

  it("opens every topic card with its exact id, index, title and drawn lines", () => {
    for (const [index, topic] of HELP_TOPICS.entries()) {
      const state = openTopic(index);
      expect(state.screen).toBe("topic");
      expect(state.topicId).toBe(topic.id);
      expect(state.topicIndex).toBe(index);
      expect(state.title).toBe(topic.title);
      expect(state.lines).toEqual([topic.title, topic.intro, ...topic.points]);
      expect(state.lines).toHaveLength(1 + 1 + topic.points.length);
      for (const line of state.lines) expect(liveTexts(line)).toHaveLength(1);
    }
  });

  it("walks Next through all eight topics and Previous back to the first", () => {
    const { overlay } = setup();
    tap(control(HELP_TOPICS[0]?.title ?? ""));
    const seenIds: string[] = [overlay.e2eState()?.topicId ?? ""];
    expect(overlay.e2eState()?.topicIndex).toBe(0);
    expect(overlay.e2eState()?.controls.prev).toBeNull();
    expect(overlay.e2eState()?.controls.next).not.toBeNull();

    for (let index = 1; index < HELP_TOPICS.length; index += 1) {
      tap(control("Next"));
      const state = overlay.e2eState();
      expect(state?.topicIndex).toBe(index);
      expect(state?.topicId).toBe(HELP_TOPICS[index]?.id);
      expect(state?.controls.prev).not.toBeNull();
      const isLast = index === HELP_TOPICS.length - 1;
      if (isLast) expect(state?.controls.next).toBeNull();
      else expect(state?.controls.next).not.toBeNull();
      seenIds.push(state?.topicId ?? "");
    }
    expect(seenIds).toEqual(HELP_TOPICS.map((topic) => topic.id));
    expect(overlay.e2eState()?.controls.next).toBeNull();

    for (let index = HELP_TOPICS.length - 2; index >= 0; index -= 1) {
      tap(control("Previous"));
      const state = overlay.e2eState();
      expect(state?.topicIndex).toBe(index);
      expect(state?.topicId).toBe(HELP_TOPICS[index]?.id);
      if (index === 0) expect(state?.controls.prev).toBeNull();
      else expect(state?.controls.prev).not.toBeNull();
      expect(state?.controls.next).not.toBeNull();
    }
    expect(overlay.e2eState()?.topicId).toBe(HELP_TOPICS[0]?.id);
    expect(overlay.e2eState()?.controls.prev).toBeNull();
  });

  it("opens a topic with the exact content drawn and first-topic boundaries", () => {
    const state = openTopic(0);
    const topic = HELP_TOPICS[0];
    expect(topic).toBeDefined();

    expect(state.screen).toBe("topic");
    expect(state.topicId).toBe("parental-lock");
    expect(state.topicIndex).toBe(0);
    expect(state.title).toBe(topic?.title);
    expect(state.lines).toEqual([topic?.title, topic?.intro, ...(topic?.points ?? [])]);
    expect(state.topics).toEqual([]);
    expect(state.controls.back).not.toBeNull();
    expect(state.controls.prev).toBeNull();
    expect(state.controls.next).not.toBeNull();
    for (const line of state.lines) expect(liveTexts(line)).toHaveLength(1);
  });

  it("navigates Previous and Next without wrapping, and Back returns to the menu", () => {
    const { overlay } = setup();
    tap(control(HELP_TOPICS[0]?.title ?? ""));
    tap(control("Next"));
    expect(overlay.e2eState()?.topicId).toBe("profiles-play-time");
    expect(overlay.e2eState()?.topicIndex).toBe(1);
    expect(overlay.e2eState()?.controls.prev).not.toBeNull();

    tap(control("Previous"));
    expect(overlay.e2eState()?.topicId).toBe("parental-lock");
    expect(overlay.e2eState()?.controls.prev).toBeNull();

    tap(control("Back to topics"));
    expect(overlay.e2eState()?.screen).toBe("topics");
    expect(overlay.e2eState()?.topicIndex).toBe(-1);
    expect(liveTexts("Previous")).toHaveLength(0);
  });

  it("makes the last topic's Next null and ignores taps on inactive boundaries", () => {
    const { overlay } = setup();
    tap(control(HELP_TOPICS[7]?.title ?? ""));
    const last = overlay.e2eState();
    expect(last?.topicId).toBe("updates");
    expect(last?.controls.next).toBeNull();
    expect(last?.controls.prev).not.toBeNull();

    tap(control("Next"));
    expect(overlay.e2eState()?.topicIndex).toBe(7);
    expect(overlay.e2eState()?.title).toBe("Updates");
  });

  it("closes from the ✕ control and from the backdrop", () => {
    const first = setup();
    tap(control("✕"));
    expect(first.overlay.e2eState()).toBeNull();

    const second = setup();
    const backdrop = live().find(
      (obj) => obj.kind === "rectangle" && obj.args?.[2] === 1024 && obj.args?.[3] === 768,
    );
    if (backdrop === undefined) throw new Error("no backdrop");
    tap(backdrop);
    expect(second.overlay.e2eState()).toBeNull();
  });

  it("lays out a 2-by-4 card grid with 96px-tall cards and 96px hit areas", () => {
    setup();
    const cards = live().filter(
      (obj) => obj.kind === "rectangle" && obj.args?.[2] === 200 && obj.args?.[3] === 96,
    );
    const xs = [...new Set(cards.map((obj) => Number(obj.x)))].sort((a, b) => a - b);
    const ys = [...new Set(cards.map((obj) => Number(obj.y)))].sort((a, b) => a - b);
    expect(xs).toEqual([400, 624]);
    expect(ys).toEqual([234, 330, 426, 522]);

    for (const topic of HELP_TOPICS) {
      const label = control(topic.title);
      const hit = label.setInteractive.mock.calls[0]?.[0] as {
        hitArea: { width: number; height: number };
      };
      expect(hit.hitArea.width).toBeGreaterThanOrEqual(96);
      expect(hit.hitArea.height).toBeGreaterThanOrEqual(96);
    }
  });

  it("draws the detail title, wrapped body and footer at their published points", () => {
    const { overlay } = setup();
    tap(control(HELP_TOPICS[2]?.title ?? ""));
    const state = overlay.e2eState();
    if (state === null) throw new Error("overlay closed unexpectedly");

    expect(control(state.title).y).toBe(139);
    for (const line of state.lines.slice(1)) {
      const text = control(line);
      const style = text.args?.[3] as Record<string, unknown>;
      const wrap = style.wordWrap as { width: number };
      expect(wrap.width).toBeGreaterThanOrEqual(420);
      expect(wrap.width).toBeLessThanOrEqual(430);
    }
    expect(control("Back to topics").y).toBe(654);
    expect(control("Previous").y).toBe(654);
    expect(control("Next").y).toBe(654);
  });

  it("performs no storage, network, download, audio or external-navigation operation", () => {
    // Spies go up after beforeEach's localStorage.clear() so setup cannot
    // register a false positive against the cleanup itself.
    const getItem = vi.spyOn(Storage.prototype, "getItem");
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    const removeItem = vi.spyOn(Storage.prototype, "removeItem");
    const clear = vi.spyOn(Storage.prototype, "clear");
    const fetchSpy =
      typeof globalThis.fetch === "function" ? vi.spyOn(globalThis, "fetch") : undefined;
    const openWindow = vi.spyOn(window, "open");
    const createObjectURL =
      typeof URL.createObjectURL === "function" ? vi.spyOn(URL, "createObjectURL") : undefined;
    const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, "click");
    const mediaPlay =
      typeof HTMLMediaElement.prototype.play === "function"
        ? vi.spyOn(HTMLMediaElement.prototype, "play")
        : undefined;

    const { overlay } = setup();
    for (let index = 0; index < HELP_TOPICS.length; index += 1) {
      if (index > 0) tap(control("Back to topics"));
      tap(control(HELP_TOPICS[index]?.title ?? ""));
    }
    for (let index = HELP_TOPICS.length - 2; index >= 0; index -= 1) tap(control("Previous"));
    for (let index = 0; index < HELP_TOPICS.length - 1; index += 1) tap(control("Next"));
    tap(control("Back to topics"));
    tap(control("✕"));
    overlay.close();

    expect(getItem).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
    expect(removeItem).not.toHaveBeenCalled();
    expect(clear).not.toHaveBeenCalled();
    expect(openWindow).not.toHaveBeenCalled();
    expect(anchorClick).not.toHaveBeenCalled();
    if (fetchSpy !== undefined) expect(fetchSpy).not.toHaveBeenCalled();
    if (createObjectURL !== undefined) expect(createObjectURL).not.toHaveBeenCalled();
    if (mediaPlay !== undefined) expect(mediaPlay).not.toHaveBeenCalled();
  });
});
