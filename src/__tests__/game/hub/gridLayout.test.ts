import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  addBreatheTweens,
  animateEntrance,
  wideGridOrigin,
  wideTileCenter,
} from "../../../game/hub/gridLayout";
import {
  BOB_AMPLITUDE,
  BOB_DURATION,
  ENTRANCE_DURATION,
  ENTRANCE_STAGGER,
  TILE_ICON_TEXTURE_SIZE,
} from "../../../game/hub/hubGridConstants";
import { stubMatchMedia } from "../../helpers/matchMediaStub";

/** Structural tween-owning scene — the module needs no Phaser runtime import. */
const makeScene = () => ({ tweens: { add: vi.fn() } });
/** Structural entrance target capturing the alpha/scale resets. */
const makeTarget = () => ({ setAlpha: vi.fn(), setScale: vi.fn() });

describe("gridLayout — wide grid geometry", () => {
  it("centers the 6x4 grid inside a 1024x768 canvas", () => {
    expect(wideGridOrigin(1024, 768)).toEqual({ startX: 25, startY: 119 });
  });

  it("places the first tile one half-tile in from the origin", () => {
    const { x, y } = wideTileCenter(0, wideGridOrigin(1024, 768));
    expect(x).toBe(97);
    expect(y).toBe(177);
  });

  it("wraps row-major: tile 6 drops to the second row", () => {
    const { x, y } = wideTileCenter(6, wideGridOrigin(1024, 768));
    expect(x).toBe(97);
    expect(y).toBe(315);
  });

  it("places the last tile (21) in the short fourth row", () => {
    const { x, y } = wideTileCenter(21, wideGridOrigin(1024, 768));
    expect(x).toBe(595);
    expect(y).toBe(591);
  });
});

describe("gridLayout — entrance pop", () => {
  beforeEach(() => {
    stubMatchMedia(false);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("resets alpha and scale, then tweens to the target scale", () => {
    const scene = makeScene();
    const tile = makeTarget();
    const icon = makeTarget();

    animateEntrance(scene, [tile, icon], 0, { targetScale: 0.4 });

    expect(tile.setAlpha).toHaveBeenCalledWith(0);
    expect(tile.setScale).toHaveBeenCalledWith(0);
    expect(icon.setScale).toHaveBeenCalledWith(0);
    const config = scene.tweens.add.mock.calls[0][0];
    expect(config.alpha).toBe(1);
    expect(config.scaleX).toBe(0.4);
    expect(config.scaleY).toBe(0.4);
    expect(config.delay).toBe(0);
    expect(config.duration).toBe(ENTRANCE_DURATION);
    expect(config.ease).toBe("Sine.out");
  });

  it("defaults the target scale to 1 and staggers by index", () => {
    const scene = makeScene();
    const a = makeTarget();
    const b = makeTarget();

    animateEntrance(scene, [a], 0);
    animateEntrance(scene, [b], 3);

    const first = scene.tweens.add.mock.calls[0][0];
    const second = scene.tweens.add.mock.calls[1][0];
    expect(first.scaleX).toBe(1);
    expect(second.delay).toBe(3 * ENTRANCE_STAGGER);
  });

  it("wires the completion hook into the tween config", () => {
    const scene = makeScene();
    const onComplete = vi.fn();

    animateEntrance(scene, [makeTarget()], 0, { onComplete });

    expect(scene.tweens.add.mock.calls[0][0].onComplete).toBe(onComplete);
  });

  it("under reduced motion keeps the alpha fade but skips the scale pop", () => {
    stubMatchMedia(true);
    const scene = makeScene();
    const tile = makeTarget();

    animateEntrance(scene, [tile], 0, { targetScale: 0.4 });

    expect(tile.setAlpha).toHaveBeenCalledWith(0);
    expect(tile.setScale).not.toHaveBeenCalled();
    const config = scene.tweens.add.mock.calls[0][0];
    expect(config.alpha).toBe(1);
    expect(config.scaleX).toBeUndefined();
    expect(config.scaleY).toBeUndefined();
    expect(config.duration).toBe(ENTRANCE_DURATION);
  });
});

describe("gridLayout — idle breathe pulse", () => {
  beforeEach(() => {
    stubMatchMedia(false);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("pulses tile+label at the bob amplitude and the icon from its display scale", () => {
    const scene = makeScene();
    const tile = { x: 1 };
    const label = { x: 2 };
    const icon = { x: 3 };

    addBreatheTweens(scene, 0, tile, label, icon, 64);

    expect(scene.tweens.add).toHaveBeenCalledTimes(2);
    const [body, iconTween] = scene.tweens.add.mock.calls.map((call) => call[0]);
    expect(body.targets).toEqual([tile, label]);
    expect(body.scaleX).toBe(BOB_AMPLITUDE);
    expect(body.scaleY).toBe(BOB_AMPLITUDE);
    expect(body.duration).toBe(BOB_DURATION);
    expect(body.yoyo).toBe(true);
    expect(body.repeat).toBe(-1);
    expect(body.ease).toBe("Sine.inOut");
    // The icon pulse ends at the same visual size the entrance pop leaves it
    // at (display / texture tier), times the bob amplitude.
    expect(iconTween.targets).toEqual([icon]);
    expect(iconTween.scaleX).toBeCloseTo(64 * BOB_AMPLITUDE * (1 / TILE_ICON_TEXTURE_SIZE), 10);
    expect(iconTween.delay).toBe(ENTRANCE_DURATION + 50);
  });

  it("staggers each tile's breathe loop by the phase offset", () => {
    const scene = makeScene();

    addBreatheTweens(scene, 0, {}, {}, {}, 64);
    addBreatheTweens(scene, 2, {}, {}, {}, 64);

    const [first, , third] = scene.tweens.add.mock.calls.map((call) => call[0]);
    expect(third.delay - first.delay).toBe(2 * 200);
  });

  it("adds no tweens under reduced motion", () => {
    stubMatchMedia(true);
    const scene = makeScene();

    addBreatheTweens(scene, 0, {}, {}, {}, 64);

    expect(scene.tweens.add).not.toHaveBeenCalled();
  });
});
