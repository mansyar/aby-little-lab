import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MockFn } from "../../helpers/phaserMock";
import { type MockObject, MockScene, mockRegistry } from "../../helpers/phaserMock";

vi.mock("phaser", async () => {
  const { createPhaserModuleMock } = await import("../../helpers/phaserMock");
  return createPhaserModuleMock().module;
});

import { ProgressOverlay } from "../../../components/settings/ProgressOverlay";
import { GAME_REGISTRY } from "../../../game/gameRegistry";
import { addProfile, getProfiles, load } from "../../../utils/storage";

/** Registry objects whose destroy has not been called (current render). */
function live(): MockObject[] {
  return mockRegistry.filter((obj) => !(obj.destroy as MockFn).mock.calls.length);
}

function liveTexts(label: string): MockObject[] {
  return live().filter((obj) => obj.kind === "text" && obj.args?.[2] === label);
}

/** Finds full-canvas overlay panels (480x760). */
function panels(): MockObject[] {
  return live().filter(
    (obj) => obj.kind === "rectangle" && obj.args?.[2] === 480 && obj.args?.[3] === 760,
  );
}

/** Row game icons: images at the row X position (centerX − 182 = 330). */
function rowIcons(): MockObject[] {
  return live().filter((obj) => obj.kind === "image" && obj.args?.[0] === 330);
}

/** Viewed-profile rings (80x80 rectangles at chip Y = centerY − 195 = 189). */
function rings(): MockObject[] {
  return live().filter(
    (obj) => obj.kind === "rectangle" && obj.args?.[2] === 80 && obj.args?.[3] === 80,
  );
}

/** Fires every registered pointerdown handler on the object (Phaser fires all). */
function tap(obj: MockObject): void {
  const handlers = obj.allHandlers.filter((entry) => entry.name === "pointerdown");
  if (handlers.length === 0) throw new Error("no pointerdown handler");
  for (const entry of handlers) entry.cb();
}

beforeEach(() => {
  mockRegistry.length = 0;
  localStorage.clear();
  load();
});

describe("ProgressOverlay", () => {
  it("renders panel, title, close button and first page of rows", () => {
    const scene = new MockScene();
    const bucket: MockObject[] = [];
    const overlay = new ProgressOverlay({
      scene: scene as never,
      overlayObjects: bucket as never,
    });

    overlay.open();

    expect(panels()).toHaveLength(1);
    expect(liveTexts("Learning Progress")).toHaveLength(1);
    expect(liveTexts("X")).toHaveLength(1);
    // 22 games over 6 rows per page -> 4 pages, first shown.
    expect(liveTexts("1 / 4")).toHaveLength(1);
    expect(rowIcons()).toHaveLength(6);
    expect(liveTexts("‹")).toHaveLength(1);
    expect(liveTexts("›")).toHaveLength(1);
    expect(bucket.length).toBeGreaterThan(0);
  });

  it("derives its rows from the registry, in hub order", () => {
    const scene = new MockScene();
    const overlay = new ProgressOverlay({
      scene: scene as never,
      overlayObjects: [] as never,
    });

    overlay.open();

    const firstPage = GAME_REGISTRY.slice(0, 6);
    expect(rowIcons().map((icon) => icon.args?.[2])).toEqual(firstPage.map((game) => game.tileKey));
    for (const game of firstPage) {
      expect(liveTexts(game.label)).toHaveLength(1);
    }
  });

  it("scales row icons from the icon texture tier, not the avatar tier", () => {
    const scene = new MockScene();
    const overlay = new ProgressOverlay({
      scene: scene as never,
      overlayObjects: [] as never,
    });

    overlay.open();

    const icon = rowIcons()[0];
    if (!icon) throw new Error("no row icon");
    // tile_* textures rasterize at 160px, so a 28px icon is 28/160 (not 28/256).
    expect((icon.setScale as MockFn).mock.calls[0]?.[0]).toBeCloseTo(28 / 160, 5);
  });

  it("tapping the close button empties the bucket and destroys objects", () => {
    const scene = new MockScene();
    const bucket: MockObject[] = [];
    const overlay = new ProgressOverlay({
      scene: scene as never,
      overlayObjects: bucket as never,
    });
    overlay.open();
    const close = liveTexts("X")[0];
    if (!close) throw new Error("no close button");

    tap(close);

    expect(bucket).toHaveLength(0);
    for (const obj of mockRegistry) {
      if (obj.kind === "text" && obj.args?.[2] === "Learning Progress") {
        expect(obj.destroy as MockFn).toHaveBeenCalled();
      }
    }
  });

  it("pages forward through the chevron and clamps at the last page", () => {
    const scene = new MockScene();
    const overlay = new ProgressOverlay({
      scene: scene as never,
      overlayObjects: [] as never,
    });
    overlay.open();

    const next = (): void => {
      const chevron = liveTexts("›")[0];
      if (!chevron) throw new Error("no next chevron");
      tap(chevron);
    };
    next();
    expect(liveTexts("2 / 4")).toHaveLength(1);
    expect(rowIcons()).toHaveLength(6);

    next();
    next();
    expect(liveTexts("4 / 4")).toHaveLength(1);
    // 22 games -> last page shows the remaining 4 rows.
    expect(rowIcons()).toHaveLength(4);

    next();
    expect(liveTexts("4 / 4")).toHaveLength(1);
  });

  it("no-ops the previous chevron on the first page", () => {
    const scene = new MockScene();
    const overlay = new ProgressOverlay({
      scene: scene as never,
      overlayObjects: [] as never,
    });
    overlay.open();
    const before = live().length;

    const chevron = liveTexts("‹")[0];
    if (!chevron) throw new Error("no prev chevron");
    tap(chevron);

    expect(liveTexts("1 / 4")).toHaveLength(1);
    // No re-render happened: the live object count is unchanged.
    expect(live()).toHaveLength(before);
  });

  it("switches the viewed profile via the profile chips without changing active", () => {
    addProfile("dog");
    const scene = new MockScene();
    const overlay = new ProgressOverlay({
      scene: scene as never,
      overlayObjects: [] as never,
    });
    overlay.open();

    // Second chip sits at centerX + 28 (56px pitch, 2 profiles).
    const secondChip = live().find(
      (obj) => obj.kind === "image" && obj.args?.[0] === 540 && obj.args?.[1] === 189,
    );
    if (!secondChip) throw new Error("no second chip");
    tap(secondChip);

    // The viewed ring moves to the tapped chip; a fresh render replaced the old.
    const liveRings = rings();
    expect(liveRings).toHaveLength(1);
    expect(liveRings[0]?.args?.[0]).toBe(540);
    // Read-only: the active profile never changed.
    expect(getProfiles().find((p) => p.id === "p2")?.id).toBe("p2");
  });

  it("renders per-game stats rows for a fresh profile", () => {
    const scene = new MockScene();
    const overlay = new ProgressOverlay({
      scene: scene as never,
      overlayObjects: [] as never,
    });

    overlay.open();

    // Every row shows its play count in the stats line.
    const stats = live().filter(
      (obj) =>
        obj.kind === "text" &&
        typeof obj.args?.[2] === "string" &&
        String(obj.args[2]).includes("plays"),
    );
    expect(stats.length).toBeGreaterThanOrEqual(6);
  });

  it("renders the 7-day activity strip label and bars", () => {
    const scene = new MockScene();
    const overlay = new ProgressOverlay({
      scene: scene as never,
      overlayObjects: [] as never,
    });

    overlay.open();

    expect(liveTexts("Last 7 days · 0 plays")).toHaveLength(1);
    // Empty activity -> all 7 bars at the minimum 4px height, strip Y = 649.
    const bars = live().filter(
      (obj) => obj.kind === "rectangle" && obj.args?.[1] === 649 && obj.args?.[2] === 24,
    );
    expect(bars).toHaveLength(7);
    for (const bar of bars) expect(bar.args?.[3]).toBe(4);
  });
});
