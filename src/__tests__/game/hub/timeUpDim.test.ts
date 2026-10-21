import { describe, expect, it, vi } from "vitest";
import {
  applyTimeUpLock,
  type LockableTile,
  restoreTiles,
  TIME_UP_TILE_ALPHA,
  TIME_UP_TILE_SCALE,
} from "../../../game/hub/timeUpDim";

/** Structural lockable tile recording every lock/restore call. */
const makeTile = (): LockableTile & Record<string, ReturnType<typeof vi.fn>> =>
  ({
    setAlpha: vi.fn(),
    setScale: vi.fn(),
    disableInteractive: vi.fn(),
    setInteractive: vi.fn(),
  }) as never;

describe("timeUpDim — lock", () => {
  it("dims, shrinks and disables every passed tile", () => {
    const tiles = [makeTile(), makeTile(), makeTile()];

    applyTimeUpLock(tiles);

    for (const tile of tiles) {
      expect(tile.setAlpha).toHaveBeenCalledWith(TIME_UP_TILE_ALPHA);
      expect(tile.setScale).toHaveBeenCalledWith(TIME_UP_TILE_SCALE);
      expect(tile.disableInteractive).toHaveBeenCalledTimes(1);
    }
    expect(TIME_UP_TILE_ALPHA).toBe(0.45);
    expect(TIME_UP_TILE_SCALE).toBe(0.97);
  });

  it("touches only the tiles that were passed (visible-page contract)", () => {
    const visible = [makeTile()];
    const otherPage = makeTile();

    applyTimeUpLock(visible);

    expect(otherPage.setAlpha).not.toHaveBeenCalled();
    expect(otherPage.setScale).not.toHaveBeenCalled();
    expect(otherPage.disableInteractive).not.toHaveBeenCalled();
  });
});

describe("timeUpDim — restore", () => {
  it("re-enables every passed tile at full alpha and scale", () => {
    const tiles = [makeTile(), makeTile()];

    restoreTiles(tiles);

    for (const tile of tiles) {
      expect(tile.setAlpha).toHaveBeenCalledWith(1);
      expect(tile.setScale).toHaveBeenCalledWith(1);
      expect(tile.setInteractive).toHaveBeenCalledTimes(1);
    }
  });

  it("touches only the tiles that were passed", () => {
    const visible = [makeTile()];
    const untouched = makeTile();

    restoreTiles(visible);

    expect(untouched.setAlpha).not.toHaveBeenCalled();
    expect(untouched.setInteractive).not.toHaveBeenCalled();
  });
});
