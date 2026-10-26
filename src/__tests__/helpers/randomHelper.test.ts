import { describe, expect, it } from "vitest";
import { mulberry32 } from "./randomHelper";

describe("mulberry32", () => {
  it("reproduces the same sequence for the same seed", () => {
    const first = mulberry32(1234);
    const second = mulberry32(1234);

    expect(Array.from({ length: 10 }, () => second())).toEqual(
      Array.from({ length: 10 }, () => first()),
    );
  });

  it("produces a different sequence for a different seed", () => {
    const first = mulberry32(1234);
    const second = mulberry32(2026);

    expect(Array.from({ length: 10 }, () => second())).not.toEqual(
      Array.from({ length: 10 }, () => first()),
    );
  });

  it("keeps every draw within [0, 1)", () => {
    const rng = mulberry32(1234);

    for (let draw = 0; draw < 1000; draw++) {
      const value = rng();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it("allows seed 0 and reproduces its sequence", () => {
    const first = mulberry32(0);
    const second = mulberry32(0);

    expect(first()).toBe(0.26642920868471265);
    expect(second()).toBe(0.26642920868471265);
  });

  it("reproduces the implementation-derived draws for seed 1234", () => {
    const rng = mulberry32(1234);

    expect(rng()).toBe(0.07329497812315822);
    expect(rng()).toBe(0.7034119898453355);
    expect(rng()).toBe(0.9028560190927237);
  });
});
