import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ENTRANCE_DURATION, ENTRANCE_STAGGER } from "../../../game/hub/hubGridConstants";
import {
  addJustEarnedBurst,
  addSparkle,
  animateJustEarned,
  drawDashedSlotRing,
  fadeSlotIn,
  type SlotRingGraphics,
  shelfStickerY,
} from "../../../game/hub/stickerShelf";
import { stubMatchMedia } from "../../helpers/matchMediaStub";

/** Structural tween-owning scene — the module needs no Phaser runtime import. */
const makeScene = () => ({ tweens: { add: vi.fn() } });
/** Structural graphics surface recording every draw call. */
const makeGraphics = (): SlotRingGraphics & Record<string, ReturnType<typeof vi.fn>> =>
  ({
    lineStyle: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    strokePath: vi.fn(),
  }) as never;

describe("stickerShelf — shelf placement", () => {
  it("hangs the wide plaque in the +33..+55 band below the label", () => {
    expect(shelfStickerY(0, 116, 22)).toBe(44);
  });

  it("hangs the paged plaque proportionally lower on the taller tile", () => {
    expect(shelfStickerY(0, 196, 30)).toBe(80);
  });
});

describe("stickerShelf — dashed empty-slot ring", () => {
  it("draws 10 dashes with the documented ink", () => {
    const g = makeGraphics();
    drawDashedSlotRing(g, 9);

    expect(g.lineStyle).toHaveBeenCalledWith(4, 0xffffff, 0.55);
    expect(g.beginPath).toHaveBeenCalledTimes(10);
    expect(g.strokePath).toHaveBeenCalledTimes(10);
    expect(g.arc).toHaveBeenCalledTimes(10);
    // First dash starts at angle 0; each dash spans π/10 with a π/5 step.
    expect(g.arc).toHaveBeenNthCalledWith(1, 0, 0, 9, 0, Math.PI / 10, false);
    expect(g.arc).toHaveBeenNthCalledWith(
      2,
      0,
      0,
      9,
      Math.PI / 5,
      Math.PI / 5 + Math.PI / 10,
      false,
    );
  });
});

describe("stickerShelf — slot fade", () => {
  beforeEach(() => {
    stubMatchMedia(false);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fades the ring in with the per-build entrance stagger", () => {
    const scene = makeScene();
    const ring = { setAlpha: vi.fn() };

    fadeSlotIn(scene as never, ring, 2);

    expect(ring.setAlpha).toHaveBeenCalledWith(0);
    expect(scene.tweens.add).toHaveBeenCalledWith(
      expect.objectContaining({
        targets: ring,
        alpha: 0.55,
        delay: 2 * ENTRANCE_STAGGER,
        duration: ENTRANCE_DURATION,
        ease: "Sine.out",
      }),
    );
  });

  it("lands the ring directly at final alpha under reduced motion", () => {
    stubMatchMedia(true);
    const scene = makeScene();
    const ring = { setAlpha: vi.fn() };

    fadeSlotIn(scene as never, ring, 2);

    expect(ring.setAlpha).toHaveBeenCalledWith(0.55);
    expect(scene.tweens.add).not.toHaveBeenCalled();
  });
});

describe("stickerShelf — earned-sticker sparkle", () => {
  beforeEach(() => {
    stubMatchMedia(false);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("adds a gentle shimmer loop", () => {
    const scene = makeScene();

    addSparkle(scene as never, {});

    expect(scene.tweens.add).toHaveBeenCalledWith(
      expect.objectContaining({
        alpha: 0.75,
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: "Sine.inOut",
      }),
    );
  });

  it("adds no shimmer under reduced motion", () => {
    stubMatchMedia(true);
    const scene = makeScene();

    addSparkle(scene as never, {});

    expect(scene.tweens.add).not.toHaveBeenCalled();
  });

  it("adds shimmer plus a scale-pulse burst", () => {
    const scene = makeScene();

    addJustEarnedBurst(scene as never, {}, 0.4);

    expect(scene.tweens.add).toHaveBeenCalledTimes(2);
    expect(scene.tweens.add).toHaveBeenCalledWith(
      expect.objectContaining({
        scaleX: 1.25 * 0.4,
        scaleY: 1.25 * 0.4,
        duration: 500,
        yoyo: true,
        repeat: -1,
        ease: "Sine.inOut",
      }),
    );
  });

  it("adds no burst tweens under reduced motion", () => {
    stubMatchMedia(true);
    const scene = makeScene();

    addJustEarnedBurst(scene as never, {}, 0.4);

    expect(scene.tweens.add).not.toHaveBeenCalled();
  });
});

describe("stickerShelf — just-earned entrance", () => {
  beforeEach(() => {
    stubMatchMedia(false);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("bounces in at the enlarged scale, then bursts on completion", () => {
    const scene = makeScene();
    const sticker = { setAlpha: vi.fn(), setScale: vi.fn() };

    animateJustEarned(scene as never, sticker, 0.4, 1);

    expect(sticker.setScale).toHaveBeenNthCalledWith(1, 1.15 * 0.4);
    expect(sticker.setAlpha).toHaveBeenCalledWith(0);
    expect(sticker.setScale).toHaveBeenNthCalledWith(2, 0);

    const config = (scene.tweens.add as ReturnType<typeof vi.fn>).mock.calls[0][0] as {
      alpha: number;
      delay: number;
      duration: number;
      ease: string;
      scaleX: number;
      scaleY: number;
      onComplete: () => void;
    };
    expect(config).toEqual(
      expect.objectContaining({
        alpha: 1,
        delay: ENTRANCE_STAGGER,
        duration: ENTRANCE_DURATION,
        ease: "Back.out",
        scaleX: 1.15 * 0.4,
        scaleY: 1.15 * 0.4,
      }),
    );

    // Completing the entrance hands off to the burst (shimmer + pulse).
    (scene.tweens.add as ReturnType<typeof vi.fn>).mockClear();
    config.onComplete();
    expect(scene.tweens.add).toHaveBeenCalledTimes(2);
  });

  it("keeps the enlarged scale as the static new! cue under reduced motion", () => {
    stubMatchMedia(true);
    const scene = makeScene();
    const sticker = { setAlpha: vi.fn(), setScale: vi.fn() };

    animateJustEarned(scene as never, sticker, 0.4, 0);

    expect(sticker.setScale).toHaveBeenCalledTimes(1);
    expect(sticker.setScale).toHaveBeenCalledWith(1.15 * 0.4);

    const config = (scene.tweens.add as ReturnType<typeof vi.fn>).mock.calls[0][0] as {
      alpha: number;
      ease: string;
      scaleX?: number;
      onComplete?: () => void;
    };
    expect(config).toEqual(expect.objectContaining({ alpha: 1, ease: "Back.out" }));
    expect(config.scaleX).toBeUndefined();
    expect(config.onComplete).toBeUndefined();
  });
});
