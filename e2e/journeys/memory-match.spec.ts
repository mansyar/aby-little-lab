import { expect, test } from "@playwright/test";
import type { E2ERoundTarget } from "../../src/game/e2eBridge";
import {
  collectErrors,
  launchGame,
  openHub,
  roundIndex,
  tapTarget,
  waitForPlayableRound,
  waitForRoundIndex,
} from "../fixtures/game";

/**
 * FR-3 / AC-3, memory family: three rounds of Memory Match.
 *
 * Cards are paired by the id the bridge publishes — two cards sharing an id are
 * a pair — so the journey never guesses from a face texture or a position.
 */

test("Memory Match clears three rounds of pairs", async ({ page }) => {
  test.setTimeout(120_000);

  const errors = collectErrors(page);
  await openHub(page);
  await launchGame(page, 17, "MemoryMatch");
  expect(await roundIndex(page)).toBe(0);

  for (let round = 0; round < 3; round += 1) {
    const geometry = await waitForPlayableRound(page, round);

    const pairs = new Map<string, E2ERoundTarget[]>();
    for (const card of geometry.targets) {
      const group = pairs.get(card.id) ?? [];
      group.push(card);
      pairs.set(card.id, group);
    }
    expect(pairs.size, "a board of pairs, not singletons").toBeGreaterThan(0);

    for (const [id, cards] of pairs) {
      expect(cards, `card ${id} should have exactly one partner`).toHaveLength(2);
      await tapTarget(page, cards[0]);
      await tapTarget(page, cards[1]);
    }

    await waitForRoundIndex(page, round + 1);
  }

  expect(errors, "clearing three boards should log no page or console errors").toEqual([]);
});
