import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PlayTime } from "../../types";
import { MockScene, mockRegistry } from "../helpers/phaserMock";

/** normalizePlayTime resets usage on stale dates, so fixtures must be "today". */
const TODAY = new Date().toISOString().slice(0, 10);

vi.mock("../../utils/storage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../utils/storage")>();
  return {
    ...actual,
    getPlayTime: vi.fn(
      (): PlayTime => ({
        limitMinutes: null,
        usedMinutes: 0,
        lastUsedDate: TODAY,
      }),
    ),
  };
});

const { getPlayTime } = await import("../../utils/storage");
const { createPlayTimeIndicator, PlayTimeNudge } = await import(
  "../../components/PlayTimeIndicator"
);

type MockGameObject = (typeof mockRegistry)[number];

/** Casts the shared mock scene to the Phaser.Scene shape the module expects. */
function asScene(mock: MockScene): Phaser.Scene {
  return mock as unknown as Phaser.Scene;
}

function lastGraphics(): MockGameObject | undefined {
  const graphics = mockRegistry.filter((obj) => obj.kind === "graphics");
  return graphics[graphics.length - 1];
}

function lastRectangle(): MockGameObject | undefined {
  const rects = mockRegistry.filter((obj) => obj.kind === "rectangle");
  return rects[rects.length - 1];
}

beforeEach(() => {
  mockRegistry.length = 0;
  vi.mocked(getPlayTime).mockReset();
  vi.mocked(getPlayTime).mockReturnValue({
    limitMinutes: null,
    usedMinutes: 0,
    lastUsedDate: "2026-01-01",
  });
});

describe("createPlayTimeIndicator", () => {
  it("draws nothing when the profile has no limit", () => {
    const scene = new MockScene();
    const onLimitReached = vi.fn();
    const graphics = createPlayTimeIndicator({
      scene: asScene(scene),
      onLimitReached,
    });
    expect(graphics).toBeNull();
    expect(mockRegistry).toHaveLength(0);
    expect(onLimitReached).not.toHaveBeenCalled();
  });

  it("draws a cool hint arc sized by the remaining budget", () => {
    vi.mocked(getPlayTime).mockReturnValue({
      limitMinutes: 30,
      usedMinutes: 10,
      lastUsedDate: TODAY,
    });
    const scene = new MockScene();
    const graphics = createPlayTimeIndicator({
      scene: asScene(scene),
      onLimitReached: vi.fn(),
    });
    expect(graphics).not.toBeNull();
    const g = lastGraphics();
    expect(g).toBeDefined();
    const slice = g?.slice as ReturnType<typeof vi.fn>;
    // cx=512, cy=768-16=752, r=12, from -PI/2 sweeping 20/30 of a circle
    expect(slice.mock.calls[0]).toEqual([
      512,
      752,
      12,
      -Math.PI / 2,
      -Math.PI / 2 + (20 / 30) * Math.PI * 2,
      false,
    ]);
    const fillStyle = g?.fillStyle as ReturnType<typeof vi.fn>;
    expect(fillStyle).toHaveBeenCalledWith(0x68d391, 1);
  });

  it("uses the warm color when within five minutes of the limit", () => {
    vi.mocked(getPlayTime).mockReturnValue({
      limitMinutes: 30,
      usedMinutes: 26,
      lastUsedDate: TODAY,
    });
    const scene = new MockScene();
    createPlayTimeIndicator({ scene: asScene(scene), onLimitReached: vi.fn() });
    const g = lastGraphics();
    const fillStyle = g?.fillStyle as ReturnType<typeof vi.fn>;
    expect(fillStyle).toHaveBeenCalledWith(0xed8936, 1);
  });

  it("draws the moon badge and fires onLimitReached when the limit is reached", () => {
    vi.mocked(getPlayTime).mockReturnValue({
      limitMinutes: 30,
      usedMinutes: 30,
      lastUsedDate: TODAY,
    });
    const scene = new MockScene();
    const onLimitReached = vi.fn();
    createPlayTimeIndicator({ scene: asScene(scene), onLimitReached });
    const g = lastGraphics();
    const fillCircle = g?.fillCircle as ReturnType<typeof vi.fn>;
    expect(fillCircle).toHaveBeenCalledWith(512, 752, 18);
    expect(fillCircle).toHaveBeenCalledWith(507, 748, 13);
    expect(onLimitReached).toHaveBeenCalledTimes(1);
  });
});

describe("PlayTimeNudge", () => {
  function setupNudge() {
    const scene = new MockScene();
    const onLaunch = vi.fn();
    const nudge = new PlayTimeNudge();
    return { scene, onLaunch, nudge };
  }

  it("shows a dimmed overlay and hourglass, then launches after the delay", () => {
    const { scene, onLaunch, nudge } = setupNudge();
    nudge.show({ scene: asScene(scene), onLaunch }, 3);

    const overlay = lastRectangle();
    expect(overlay).toBeDefined();
    expect(overlay?.args).toEqual([512, 384, 1024, 768, 0x2d3748, 0.6]);
    expect(overlay?.setInteractive as ReturnType<typeof vi.fn>).toHaveBeenCalled();
    expect(overlay?.setDepth as ReturnType<typeof vi.fn>).toHaveBeenCalledWith(20);

    expect(onLaunch).not.toHaveBeenCalled();
    const delayedCall = (scene.time.delayedCall as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(delayedCall[0]).toBe(2000);
    expect(mockRegistry.filter((obj) => obj.kind === "graphics")).toHaveLength(1);
    delayedCall[1]();
    expect(onLaunch).toHaveBeenCalledWith(3);
    expect(overlay?.destroy as ReturnType<typeof vi.fn>).toHaveBeenCalled();
    expect(nudge.isActive()).toBe(false);
  });

  it("ignores a second show while one is in flight", () => {
    const { scene, onLaunch, nudge } = setupNudge();
    nudge.show({ scene: asScene(scene), onLaunch }, 0);
    const rectsAfterFirst = mockRegistry.filter((obj) => obj.kind === "rectangle").length;
    nudge.show({ scene: asScene(scene), onLaunch }, 1);
    expect(mockRegistry.filter((obj) => obj.kind === "rectangle").length).toBe(rectsAfterFirst);
    expect(scene.time.delayedCall as ReturnType<typeof vi.fn>).toHaveBeenCalledTimes(1);
  });

  it("allows a new nudge after the previous one completes", () => {
    const { scene, onLaunch, nudge } = setupNudge();
    nudge.show({ scene: asScene(scene), onLaunch }, 0);
    const delayedCall = scene.time.delayedCall as ReturnType<typeof vi.fn>;
    delayedCall.mock.calls[0][1]();
    nudge.show({ scene: asScene(scene), onLaunch }, 1);
    expect(delayedCall).toHaveBeenCalledTimes(2);
  });
});
