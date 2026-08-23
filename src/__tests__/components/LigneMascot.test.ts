import { afterEach, describe, expect, it, vi } from "vitest";
import {
  activateLigneMascot,
  LigneMascot,
  type LigneMascotPlacement,
  type LignePlayerPort,
} from "../../components/LigneMascot";

type MockFn = ReturnType<typeof vi.fn>;

interface PlayerHarness extends LignePlayerPort {
  fireTrigger: MockFn;
  advance: MockFn;
  render: MockFn;
  dispose: MockFn;
}

interface DisplayHarness {
  destroy: MockFn;
}

function createPlayer(): PlayerHarness {
  return {
    fireTrigger: vi.fn(),
    advance: vi.fn(),
    render: vi.fn(),
    dispose: vi.fn(),
  };
}

function createLigneMascot() {
  const player = createPlayer();
  const canvas = document.createElement("canvas");
  const display: DisplayHarness = { destroy: vi.fn() };
  const requestFrame = vi.fn(() => 42);
  const cancelFrame = vi.fn();
  const mascot = new LigneMascot({
    player,
    canvas,
    display,
    requestFrame,
    cancelFrame,
  });
  return { mascot, player, canvas, display, requestFrame, cancelFrame };
}

const PLACEMENT: LigneMascotPlacement = {
  x: 934,
  y: 678,
  scale: 0.2,
  depth: -1,
};

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("LigneMascot", () => {
  it("maps the existing reaction API to Ligne triggers", () => {
    const { mascot, player } = createLigneMascot();

    mascot.wave();
    mascot.nod();
    mascot.cheer();
    mascot.cheer(true);
    mascot.curious();
    mascot.flapGreeting();

    expect(player.fireTrigger.mock.calls.map(([trigger]) => trigger)).toEqual([
      "wave",
      "nod",
      "cheer",
      "cheer_big",
      "curious",
      "flap_greeting",
    ]);
  });

  it("leaves idleLoop to the asset's default looping idle state", () => {
    const { mascot, player } = createLigneMascot();

    mascot.idleLoop();

    expect(player.fireTrigger).not.toHaveBeenCalled();
  });

  it("advances and renders from its animation-frame loop", () => {
    const { player, requestFrame } = createLigneMascot();
    const tick = requestFrame.mock.calls[0]?.[0] as (now: number) => void;

    tick(1_000);
    tick(1_016);

    expect(player.advance).toHaveBeenLastCalledWith(0.016);
    expect(player.render).toHaveBeenCalledTimes(2);
  });

  it("invokes the browser animation-frame APIs with the Window receiver", () => {
    const requestFrame = vi.fn(function (this: unknown) {
      if (this !== window) throw new TypeError("Illegal invocation");
      return 42;
    });
    const cancelFrame = vi.fn(function (this: unknown) {
      if (this !== window) throw new TypeError("Illegal invocation");
    });
    vi.stubGlobal("requestAnimationFrame", requestFrame);
    vi.stubGlobal("cancelAnimationFrame", cancelFrame);

    const mascot = new LigneMascot({
      player: createPlayer(),
      canvas: document.createElement("canvas"),
      display: { destroy: vi.fn() },
    });
    mascot.destroy();

    expect(requestFrame).toHaveBeenCalledOnce();
    expect(cancelFrame).toHaveBeenCalledWith(42);
  });

  it("keeps the overlay canvas touch-inert and installs no pointer listeners", () => {
    const canvas = document.createElement("canvas");
    const addEventListener = vi.spyOn(canvas, "addEventListener");

    new LigneMascot({
      player: createPlayer(),
      canvas,
      display: { destroy: vi.fn() },
      requestFrame: vi.fn(() => 42),
      cancelFrame: vi.fn(),
    });

    expect(canvas.style.pointerEvents).toBe("none");
    expect(addEventListener).not.toHaveBeenCalled();
  });

  it("disposes the player, display, and animation frame exactly once", () => {
    const { mascot, player, display, cancelFrame } = createLigneMascot();

    mascot.destroy();
    mascot.destroy();

    expect(cancelFrame).toHaveBeenCalledOnce();
    expect(cancelFrame).toHaveBeenCalledWith(42);
    expect(player.dispose).toHaveBeenCalledOnce();
    expect(display.destroy).toHaveBeenCalledOnce();
  });
});

describe("activateLigneMascot", () => {
  it("loads at the fallback placement and hides the tween image only after success", async () => {
    const ligne = createLigneMascot().mascot;
    const fallback = { setVisible: vi.fn() };
    const load = vi.fn(async () => ligne);

    const result = await activateLigneMascot({
      fallback,
      placement: PLACEMENT,
      load,
      timeoutMs: 1_000,
      reducedMotion: false,
    });

    expect(load).toHaveBeenCalledWith(PLACEMENT);
    expect(fallback.setVisible).toHaveBeenCalledWith(false);
    expect(result).toBe(ligne);
  });

  it("silently keeps the tween fallback when loading fails", async () => {
    const fallback = { setVisible: vi.fn() };

    const result = await activateLigneMascot({
      fallback,
      placement: PLACEMENT,
      load: vi.fn().mockRejectedValue(new Error("GPU unavailable")),
      timeoutMs: 1_000,
      reducedMotion: false,
    });

    expect(result).toBeNull();
    expect(fallback.setVisible).not.toHaveBeenCalled();
  });

  it("never starts the Ligne load under reduced motion", async () => {
    const load = vi.fn();

    const result = await activateLigneMascot({
      fallback: { setVisible: vi.fn() },
      placement: PLACEMENT,
      load,
      timeoutMs: 1_000,
      reducedMotion: true,
    });

    expect(result).toBeNull();
    expect(load).not.toHaveBeenCalled();
  });

  it("times out to the fallback and destroys a player that resolves late", async () => {
    vi.useFakeTimers();
    const fallback = { setVisible: vi.fn() };
    let resolveLoad: ((mascot: LigneMascot) => void) | undefined;
    const load = vi.fn(
      () =>
        new Promise<LigneMascot>((resolve) => {
          resolveLoad = resolve;
        }),
    );
    const late = createLigneMascot();

    const activation = activateLigneMascot({
      fallback,
      placement: PLACEMENT,
      load,
      timeoutMs: 500,
      reducedMotion: false,
    });
    await vi.advanceTimersByTimeAsync(500);

    expect(await activation).toBeNull();
    expect(fallback.setVisible).not.toHaveBeenCalled();

    resolveLoad?.(late.mascot);
    await Promise.resolve();
    expect(late.player.dispose).toHaveBeenCalledOnce();
    expect(late.display.destroy).toHaveBeenCalledOnce();
  });
});
