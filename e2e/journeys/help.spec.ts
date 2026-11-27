import { expect, type Page, test } from "@playwright/test";
import { HELP_TOPICS } from "../../src/components/settings/helpContent";
import { GAME_WIDTH, holdCanvasUntil, tapCanvas } from "../fixtures/canvas";
import {
  collectErrors,
  helpState,
  openHub,
  profileCount,
  settingsState,
  stickerCount,
} from "../fixtures/game";
import { readStoredV2 } from "../fixtures/shell";

/**
 * FR-1 / AC-1, AC-10–AC-12: the parent's Help journey.
 *
 * Everything is driven through what the app publishes: the gate is held until
 * Settings opens, Help is tapped at its published header point, and each topic
 * is tapped at the point the overlay publishes for its card. The save is read
 * through the same storage helper the backup and persistence journeys use, so
 * "read-only" is measured on the real payload and not inferred from the UI.
 *
 * No test here changes a setting, earns a sticker, downloads a file, plays
 * sound, goes online or navigates away. The close control is the mirror of the
 * published Help point, which keeps this journey off a copied layout number.
 */

test.setTimeout(120_000);

/** Holds the real parental gate until the panel reports itself open. */
async function openSettings(page: Page): Promise<void> {
  const closed = await settingsState(page);
  if (!closed.gate) throw new Error("the hub should publish the settings gate");
  await holdCanvasUntil(page, closed.gate, async () => (await settingsState(page)).open);
  await expect
    .poll(async () => (await settingsState(page)).helpButton, {
      message: "the open panel should publish its header Help control",
      timeout: 5_000,
    })
    .not.toBeNull();
}

/** Taps the persistent Help control and waits for the topic menu. */
async function openHelp(page: Page): Promise<void> {
  const button = (await settingsState(page)).helpButton;
  if (!button) throw new Error("Settings should publish its Help control");
  await tapCanvas(page, button);
  await expect
    .poll(async () => (await settingsState(page)).help?.screen, {
      message: "tapping Help should open the topic menu",
      timeout: 5_000,
    })
    .toBe("topics");
}

/** Taps a published Help control, failing loudly if that boundary is inactive. */
async function tapHelpControl(
  page: Page,
  control: { x: number; y: number } | null | undefined,
  name: string,
): Promise<void> {
  if (!control) throw new Error(`Help should publish an active ${name} control`);
  await tapCanvas(page, control);
}

test("a parent walks all eight topics from Settings and leaves the save untouched", async ({
  page,
}) => {
  const errors = collectErrors(page);
  await openHub(page);

  const saveBefore = await readStoredV2(page);
  const profilesBefore = await profileCount(page);
  const stickersBefore = await stickerCount(page);

  await openSettings(page);
  const panel = await settingsState(page);
  expect(panel.page, "Help is reached from the first Settings page").toBe(0);
  // Captured while the panel is open: a closed panel has no rows to compare.
  const togglesBefore = panel.toggles;
  await openHelp(page);

  const menu = await helpState(page);
  expect(menu?.screen).toBe("topics");
  expect(menu?.title).toBe("Parent Help");
  expect(menu?.topicId).toBeNull();
  expect(menu?.topicIndex).toBe(-1);
  expect(menu?.topicCount).toBe(8);
  expect(menu?.topics.map((topic) => topic.id)).toEqual(HELP_TOPICS.map((topic) => topic.id));
  expect(menu?.topics.map((topic) => topic.title)).toEqual(HELP_TOPICS.map((topic) => topic.title));
  expect(menu?.controls.back, "the menu has no back control").toBeNull();
  expect(menu?.controls.prev, "the menu has no previous control").toBeNull();
  expect(menu?.controls.next, "the menu has no next control").toBeNull();
  await tapHelpControl(page, menu?.controls.close, "close");

  await expect
    .poll(async () => (await settingsState(page)).help, {
      message: "the ✕ should close Help only",
      timeout: 5_000,
    })
    .toBeNull();
  expect((await settingsState(page)).open, "Settings stays up behind Help").toBe(true);
  expect((await settingsState(page)).page).toBe(0);
  expect((await settingsState(page)).toggles).toEqual(togglesBefore);
  expect(await readStoredV2(page), "Help never writes the save").toEqual(saveBefore);
  expect(await profileCount(page)).toBe(profilesBefore);
  expect(await stickerCount(page)).toBe(stickersBefore);
  expect(errors, "the Help journey should log no page or console errors").toEqual([]);
});

test("Help is reached from either page, closes on its own, and closes with Settings", async ({
  page,
}) => {
  const errors = collectErrors(page);
  await openHub(page);
  const saveBefore = await readStoredV2(page);
  await openSettings(page);

  const helpPoint = (await settingsState(page)).helpButton;
  if (!helpPoint) throw new Error("Settings should publish its Help control");
  const panelClose = { x: GAME_WIDTH - helpPoint.x, y: helpPoint.y };

  await openHelp(page);
  for (let index = 0; index < HELP_TOPICS.length; index += 1) {
    const menu = await helpState(page);
    const card = menu?.topics[index];
    if (!card) throw new Error(`Help should publish topic card ${index}`);
    await tapCanvas(page, card);

    await expect
      .poll(async () => (await helpState(page))?.topicId, {
        message: `topic card ${index} should open its own page`,
        timeout: 5_000,
      })
      .toBe(HELP_TOPICS[index]?.id);

    const detail = await helpState(page);
    expect(detail?.screen).toBe("topic");
    expect(detail?.topicIndex).toBe(index);
    expect(detail?.title).toBe(HELP_TOPICS[index]?.title);
    expect(detail?.lines.length, "a topic should show its read-only lines").toBeGreaterThan(1);
    expect(detail?.controls.back, "a topic can return to the menu").not.toBeNull();
    expect(detail?.controls.prev === null, "Previous is inactive only on the first topic").toBe(
      index === 0,
    );
    expect(detail?.controls.next === null, "Next is inactive only on the last topic").toBe(
      index === HELP_TOPICS.length - 1,
    );

    if (index < HELP_TOPICS.length - 1) {
      await tapHelpControl(page, detail?.controls.next, "next");
      await expect
        .poll(async () => (await helpState(page))?.topicIndex, {
          message: "Next should advance one topic",
          timeout: 5_000,
        })
        .toBe(index + 1);
      const advanced = await helpState(page);
      await tapHelpControl(page, advanced?.controls.back, "back");
    } else {
      await tapHelpControl(page, detail?.controls.back, "back");
    }
    await expect
      .poll(async () => (await settingsState(page)).help?.screen, {
        message: "back should return to the topic menu",
        timeout: 5_000,
      })
      .toBe("topics");
  }

  await tapHelpControl(page, (await helpState(page))?.controls.close, "close");
  await expect
    .poll(async () => (await settingsState(page)).help, {
      message: "closing Help should reveal the same Settings page",
      timeout: 5_000,
    })
    .toBeNull();

  const switchPoint = (await settingsState(page)).switchPage;
  await tapCanvas(page, switchPoint);
  await expect
    .poll(async () => (await settingsState(page)).page, {
      message: "the switch card should open the backup page",
      timeout: 5_000,
    })
    .toBe(1);
  expect((await settingsState(page)).helpButton, "Help stays in the shared header").toEqual(
    helpPoint,
  );

  await openHelp(page);
  expect((await helpState(page))?.topicCount).toBe(8);
  await tapCanvas(page, { x: 8, y: 8 });
  await expect
    .poll(async () => (await settingsState(page)).help, {
      message: "the backdrop should close Help only",
      timeout: 5_000,
    })
    .toBeNull();
  expect((await settingsState(page)).page, "the backup page survives Help's backdrop").toBe(1);

  await openHelp(page);
  await tapHelpControl(page, (await helpState(page))?.controls.close, "close");
  await expect
    .poll(async () => (await settingsState(page)).help, {
      message: "Help's own close control must be tapped before the panel's",
      timeout: 5_000,
    })
    .toBeNull();
  // Help's close sits on the mirrored panel-close coordinate, so only the
  // underlying panel can receive this tap once Help has gone.
  await tapCanvas(page, panelClose);
  await expect
    .poll(async () => (await settingsState(page)).open, {
      message: "closing Settings should close it",
      timeout: 5_000,
    })
    .toBe(false);
  expect(await settingsState(page), "closing Settings takes Help with it").toMatchObject({
    help: null,
    helpButton: null,
  });
  expect(await readStoredV2(page), "Help and page switches never write the save").toEqual(
    saveBefore,
  );
  expect(errors, "the Help journey should log no page or console errors").toEqual([]);
});
