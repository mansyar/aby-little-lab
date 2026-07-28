import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ALL_ANIMALS,
  type BubbleConfig,
  type BubbleType,
  CONCURRENT_BUBBLES,
  MAX_SLEEPING,
  MIN_SLEEPING,
  WIN_TARGET,
  createRoundState,
  generateInitialBubbles,
  generateSpawnConfig,
  registerPop,
  registerWake,
  selectBubbleType,
  selectSleepingAnimal,
  shuffle,
} from "../../game/popFreezeLogic";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("createRoundState", () => {
  it("initializes pop count to 0", () => {
    const state = createRoundState();
    expect(state.popCount).toBe(0);
  });

  it("sets win target to 6", () => {
    const state = createRoundState();
    expect(state.winTarget).toBe(6);
  });
});

describe("selectBubbleType", () => {
  it("returns sleeping when no sleeping bubbles exist (need at least 1)", () => {
    expect(selectBubbleType(0)).toBe("sleeping");
  });

  it("returns poppable when sleeping count is at max (2)", () => {
    expect(selectBubbleType(MAX_SLEEPING)).toBe("poppable");
  });

  it("returns poppable when sleeping count exceeds max", () => {
    expect(selectBubbleType(3)).toBe("poppable");
  });

  it("can return either type when sleeping count is between min and max", () => {
    const spy = vi.spyOn(Math, "random");
    spy.mockReturnValueOnce(0.3);
    expect(selectBubbleType(1)).toBe("sleeping");

    spy.mockReturnValueOnce(0.7);
    expect(selectBubbleType(1)).toBe("poppable");
  });
});

describe("selectSleepingAnimal", () => {
  it("returns an animal from the valid set of 4", () => {
    const animal = selectSleepingAnimal();
    expect(ALL_ANIMALS).toContain(animal);
  });

  it("returns different animals on successive calls (randomized)", () => {
    const spy = vi.spyOn(Math, "random");
    spy.mockReturnValueOnce(0.0);
    const first = selectSleepingAnimal();

    spy.mockReturnValueOnce(0.9);
    const second = selectSleepingAnimal();

    expect(first).not.toBe(second);
  });
});

describe("generateSpawnConfig", () => {
  const worldWidth = 800;
  const worldHeight = 600;
  const bubbleSize = 96;

  it("generates a poppable bubble config with valid position within world bounds", () => {
    const config = generateSpawnConfig(worldWidth, worldHeight, bubbleSize, "poppable");
    expect(config.type).toBe("poppable");
    expect(config.animal).toBeUndefined();
    expect(config.x).toBeGreaterThanOrEqual(bubbleSize);
    expect(config.x).toBeLessThanOrEqual(worldWidth - bubbleSize);
    expect(config.y).toBeGreaterThanOrEqual(bubbleSize);
    expect(config.y).toBeLessThanOrEqual(worldHeight - bubbleSize);
  });

  it("generates a sleeping bubble config with an animal assigned", () => {
    const config = generateSpawnConfig(worldWidth, worldHeight, bubbleSize, "sleeping");
    expect(config.type).toBe("sleeping");
    expect(config.animal).toBeDefined();
    expect(ALL_ANIMALS).toContain(config.animal);
  });

  it("generates non-zero velocity for floating motion", () => {
    const config = generateSpawnConfig(worldWidth, worldHeight, bubbleSize, "poppable");
    const speed = Math.sqrt(config.vx ** 2 + config.vy ** 2);
    expect(speed).toBeGreaterThan(0);
  });

  it("produces different positions on successive calls (randomized)", () => {
    const spy = vi.spyOn(Math, "random");
    spy.mockReturnValueOnce(0.1).mockReturnValueOnce(0.2).mockReturnValueOnce(0.3).mockReturnValueOnce(0.4);
    const config1 = generateSpawnConfig(worldWidth, worldHeight, bubbleSize, "poppable");

    spy.mockReturnValueOnce(0.8).mockReturnValueOnce(0.9).mockReturnValueOnce(0.1).mockReturnValueOnce(0.2);
    const config2 = generateSpawnConfig(worldWidth, worldHeight, bubbleSize, "poppable");

    expect(config1.x).not.toBe(config2.x);
    expect(config1.y).not.toBe(config2.y);
  });
});

describe("generateInitialBubbles", () => {
  const worldWidth = 800;
  const worldHeight = 600;
  const bubbleSize = 96;

  it("returns the expected concurrent bubble count (5)", () => {
    const bubbles = generateInitialBubbles(worldWidth, worldHeight, bubbleSize);
    expect(bubbles).toHaveLength(CONCURRENT_BUBBLES);
  });

  it("includes at least 1 sleeping bubble", () => {
    const bubbles = generateInitialBubbles(worldWidth, worldHeight, bubbleSize);
    const sleeping = bubbles.filter((b) => b.type === "sleeping");
    expect(sleeping.length).toBeGreaterThanOrEqual(MIN_SLEEPING);
  });

  it("includes at most 2 sleeping bubbles", () => {
    const bubbles = generateInitialBubbles(worldWidth, worldHeight, bubbleSize);
    const sleeping = bubbles.filter((b) => b.type === "sleeping");
    expect(sleeping.length).toBeLessThanOrEqual(MAX_SLEEPING);
  });

  it("all sleeping bubbles have an animal assigned", () => {
    const bubbles = generateInitialBubbles(worldWidth, worldHeight, bubbleSize);
    for (const b of bubbles) {
      if (b.type === "sleeping") {
        expect(b.animal).toBeDefined();
        expect(ALL_ANIMALS).toContain(b.animal);
      }
    }
  });

  it("all poppable bubbles have no animal assigned", () => {
    const bubbles = generateInitialBubbles(worldWidth, worldHeight, bubbleSize);
    for (const b of bubbles) {
      if (b.type === "poppable") {
        expect(b.animal).toBeUndefined();
      }
    }
  });
});

describe("registerPop", () => {
  it("increments pop count by 1", () => {
    const state = createRoundState();
    const result = registerPop(state);
    expect(result.state.popCount).toBe(1);
  });

  it("returns isWin false when target not reached", () => {
    const state = createRoundState();
    const result = registerPop(state);
    expect(result.isWin).toBe(false);
  });

  it("returns isWin true when pop count reaches win target (6)", () => {
    const state = { popCount: 5, winTarget: WIN_TARGET };
    const result = registerPop(state);
    expect(result.state.popCount).toBe(6);
    expect(result.isWin).toBe(true);
  });

  it("does not mutate the original state", () => {
    const state = createRoundState();
    registerPop(state);
    expect(state.popCount).toBe(0);
  });
});

describe("registerWake", () => {
  it("does not change pop count (no penalty)", () => {
    const state = { popCount: 3, winTarget: WIN_TARGET };
    const result = registerWake(state);
    expect(result.popCount).toBe(3);
  });

  it("returns the same state (no penalty)", () => {
    const state = { popCount: 3, winTarget: WIN_TARGET };
    const result = registerWake(state);
    expect(result).toEqual(state);
  });

  it("does not mutate the original state", () => {
    const state = { popCount: 3, winTarget: WIN_TARGET };
    registerWake(state);
    expect(state.popCount).toBe(3);
  });
});

describe("shuffle", () => {
  it("returns an array with the same elements", () => {
    const input: BubbleType[] = ["poppable", "sleeping", "poppable"];
    const result = shuffle(input);
    expect(result.sort()).toEqual(input.sort());
  });

  it("returns a new array (does not mutate input)", () => {
    const input: BubbleType[] = ["poppable", "sleeping", "poppable"];
    const inputCopy = [...input];
    shuffle(input);
    expect(input).toEqual(inputCopy);
  });

  it("returns the same length array", () => {
    const input: BubbleConfig[] = [
      { type: "poppable", x: 100, y: 100, vx: 30, vy: 40 },
      { type: "sleeping", animal: "cat", x: 200, y: 200, vx: -30, vy: 40 },
    ];
    const result = shuffle(input);
    expect(result).toHaveLength(input.length);
  });

  it("produces independent results when called twice with different random values", () => {
    const input: BubbleType[] = ["poppable", "sleeping", "poppable", "sleeping"];

    const spy = vi.spyOn(Math, "random");
    spy.mockReturnValueOnce(0.5).mockReturnValueOnce(0.2);
    const result1 = shuffle(input);

    spy.mockReturnValueOnce(0.8).mockReturnValueOnce(0.1);
    const result2 = shuffle(input);

    expect(result1).not.toEqual(result2);
  });
});
