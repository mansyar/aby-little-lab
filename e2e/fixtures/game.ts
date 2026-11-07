import { expect, type Page } from "@playwright/test";
import type {
  E2EHubPlayTime,
  E2EHubToast,
  E2EProgressState,
  E2ERoundGeometry,
  E2ERoundTarget,
  E2ESettingsState,
} from "../../src/game/e2eBridge";
import { type GamePoint, holdCanvasUntil, tapCanvas } from "./canvas";

/**
 * Journey primitives: open the hub, launch a game by registry index, read what
 * the bridge publishes, and leave the way a child would.
 *
 * Every wait here polls bridge state. Nothing waits a fixed duration for a
 * transition to land — the only fixed wait in the suite is the parental hold,
 * where the duration *is* the thing under test. The readiness poll asks the page
 * for two animation frames, which is a stability check on a state reading, not a
 * timeout standing in for an event.
 */

/** The canvas point at the centre of the in-game "← Back" button's hold square. */
export const BACK_BUTTON: GamePoint = { x: 68, y: 68 };

/**
 * The gate cannot be short-circuited, and its three seconds are *scene* time, so
 * both holds below are state-driven (`holdCanvasUntil`) rather than fixed: see
 * `holdCanvasUntil` for why a wall-clock hold is not equivalent on a loaded
 * machine. `SETTINGS_SHORT_PRESS_MS` is the one duration that stays literal,
 * because the thing being tested is that too short a press does nothing.
 */

/**
 * A press well under the gate's three seconds. It must leave the hub exactly as
 * it found it — and mostly it must not leave a timer behind that opens the
 * panel late, which is why the journey watches past the three-second mark.
 */
export const SETTINGS_SHORT_PRESS_MS = 1_000;

const BRIDGE_TIMEOUT = 15_000;
const SCENE_TIMEOUT = 30_000;
const ROUND_TIMEOUT = 20_000;

/**
 * What the browser calls a policy refusal. Chromium writes "Refused to load …
 * because it violates the following Content Security Policy directive", and the
 * other engines name the policy too, so matching the policy's name is enough to
 * tell a blocked resource from an ordinary console error.
 */
const CSP_REFUSAL = /content security policy/i;

/**
 * Collects page errors and console errors for a journey's final assertion.
 *
 * `console: false` keeps only uncaught page errors, which is what an offline
 * journey can honestly claim: a relaunch with no network may log a failed fetch
 * for something optional without anything being wrong with the app.
 *
 * The first Content-Security-Policy refusal is also echoed to the runner's own
 * output. It arrives as a console error, so the final assertion would name it —
 * but only if the journey reaches that line, and a blocked resource usually
 * fails earlier as a plain timeout on a blank canvas. Echoing it once means the
 * violation text is in the failure output either way, without changing what the
 * assertion sees or how many times a journey reports.
 */
export function collectErrors(page: Page, options: { console?: boolean } = {}): string[] {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  if (options.console !== false) {
    let echoed = false;
    page.on("console", (message) => {
      if (message.type() !== "error") return;
      const text = message.text();
      errors.push(text);
      if (!echoed && CSP_REFUSAL.test(text)) {
        echoed = true;
        console.log(`[collectErrors] ${text}`);
      }
    });
  }
  return errors;
}

/** The hub's PWA toast, while one is covering the tiles. */
export function hubToast(page: Page): Promise<E2EHubToast | null> {
  return page.evaluate(() => window.__abyE2E?.hubToast() ?? null);
}

/** Whether the hub is accepting taps, per the grid's own entrance state. */
export function hubReady(page: Page): Promise<boolean> {
  return page.evaluate(() => window.__abyE2E?.hubReady() ?? false);
}

/** The parental gate and settings panel as the hub publishes them. */
export function settingsState(page: Page): Promise<E2ESettingsState> {
  return page.evaluate(
    () =>
      window.__abyE2E?.settings() ?? {
        gate: null,
        open: false,
        toggles: [],
        progressRow: null,
        progress: null,
        degraded: false,
        page: 0,
        switchPage: { x: 0, y: 0 },
        backupRows: [],
        backupResult: "",
      },
  );
}

/** The Learning Progress overlay as it is drawing it, or null while it is closed. */
export function progressState(page: Page): Promise<E2EProgressState | null> {
  return page.evaluate(() => window.__abyE2E?.settings().progress ?? null);
}

/** The hub's daily-budget state: whether the cap locked the tiles, and whether a nudge is up. */
export function hubPlayTime(page: Page): Promise<E2EHubPlayTime> {
  return page.evaluate(() => window.__abyE2E?.hubPlayTime() ?? { timeUp: false, nudging: false });
}

/**
 * Whether the hub is ready now, and still ready a couple of animation frames
 * later.
 *
 * One `true` is not proof: the flag can be withdrawn right after it is read
 * (the frame a rebuild starts, a resize, a page flip), and a tap taken in that
 * gap lands on a board that is entering. Two frames are enough to reject a
 * reading that is about to be invalidated, and short enough that a genuine
 * wait — the board reports false for about a second — is not extended.
 */
async function hubReadySettled(page: Page): Promise<boolean> {
  return page.evaluate(
    () =>
      new Promise<boolean>((resolve) => {
        const bridge = window.__abyE2E;
        if (!bridge?.hubReady()) {
          resolve(false);
          return;
        }
        requestAnimationFrame(() => {
          requestAnimationFrame(() => resolve(bridge.hubReady()));
        });
      }),
  );
}

/**
 * Polls until the hub's tiles have finished entering and the board stays ready.
 *
 * A tile enters at scale 0 and cannot be hit until its tween ends, so for the
 * first second or so a tap lands on nothing. Waiting on the grid's own signal
 * is the alternative to sleeping past it — which would pass here and flake on
 * a slower host. The reading has to survive two frames because the value alone
 * can be a leftover from a grid that is already being replaced.
 */
export async function waitForHubReady(page: Page): Promise<void> {
  await expect
    .poll(() => hubReadySettled(page), {
      message: "the hub should finish building its grid and start accepting taps",
      timeout: SCENE_TIMEOUT,
    })
    .toBe(true);
}

/**
 * Closes the hub's PWA toast the way a parent does, by tapping its button.
 *
 * A first visit announces offline readiness, and the toast is drawn over the
 * tiles inside the canvas, so it swallows the next tap. The journey dismisses
 * it from the geometry the app publishes rather than tapping a guess: a blind
 * tap would hit a tile on any visit without a toast and pass for the wrong
 * reason. Bounded to two attempts, because the button scales in with the
 * toast's entrance and a tap in its first frame cannot hit it.
 */
export async function dismissHubToast(page: Page): Promise<void> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const toast = await hubToast(page);
    if (!toast) return;
    await tapCanvas(page, toast.button);
    try {
      await expect
        .poll(() => hubToast(page), {
          message: "the toast should close when its button is tapped",
          timeout: 2_000,
        })
        .toBeNull();
      return;
    } catch (error) {
      // Still showing: only retry if we are still on the hub, so a tap that
      // somehow reached a tile fails loudly instead of being replayed.
      if ((await activeSceneKey(page)) !== "Hub") throw error;
    }
  }
  throw new Error("the hub toast's published button did not dismiss it");
}

/** Options for {@link openHub}. */
export interface OpenHubOptions {
  /**
   * Close a toast covering the tiles before returning. Default `true`; the boot
   * journey turns it off so it can assert the toast is reported at all.
   */
  dismissToast?: boolean;
}

/**
 * Waits for the built game's shell to be up: canvas, bridge, hub, a settled
 * grid, and no toast covering the tiles.
 *
 * Split out of {@link openHub} because a journey that reloads — the only way to
 * prove persistence, and the only way to relaunch while offline — arrives at
 * the same shell through a different navigation and must wait for the same
 * things.
 */
export async function settleHub(page: Page, options: OpenHubOptions = {}): Promise<void> {
  await expect(page.locator("canvas")).toBeVisible({ timeout: SCENE_TIMEOUT });
  await expect
    .poll(() => page.evaluate(() => typeof window.__abyE2E), {
      message: "?e2e=1 should install the read-only bridge",
      timeout: BRIDGE_TIMEOUT,
    })
    .toBe("object");
  await waitForScene(page, "Hub");
  await waitForHubReady(page);
  if (options.dismissToast !== false) await dismissHubToast(page);
}

/** Opens the built game and waits for the bridge and the hub. */
export async function openHub(page: Page, options: OpenHubOptions = {}): Promise<void> {
  await page.goto("/?e2e=1");
  await settleHub(page, options);
}

/**
 * Relaunches the app from the URL already open, then waits for the same shell.
 *
 * This is the navigation a player gets from a home-screen icon: no fresh URL,
 * no cache bypass — whatever the browser can serve from what it already holds.
 */
export async function reloadHub(page: Page, options: OpenHubOptions = {}): Promise<void> {
  await page.reload();
  await settleHub(page, options);
}

/** The scene key the bridge reports right now, or null mid-transition. */
export function activeSceneKey(page: Page): Promise<string | null> {
  return page.evaluate(() => window.__abyE2E?.activeSceneKey() ?? null);
}

/** Polls until the given scene is the active one. */
export async function waitForScene(
  page: Page,
  key: string,
  timeout = SCENE_TIMEOUT,
): Promise<void> {
  await expect
    .poll(() => activeSceneKey(page), {
      message: `the active scene should settle on ${key}`,
      timeout,
    })
    .toBe(key);
}

/** The hub tiles currently on screen, in registry order. */
export function hubTiles(page: Page): Promise<E2ERoundTarget[]> {
  return page.evaluate(() => window.__abyE2E?.hubTiles() ?? []);
}

/** How many profiles the app has stored. */
export function profileCount(page: Page): Promise<number> {
  return page.evaluate(() => window.__abyE2E?.profileCount() ?? -1);
}

/** How many stickers the active profile has earned. */
export function stickerCount(page: Page): Promise<number> {
  return page.evaluate(() => window.__abyE2E?.stickerCount() ?? -1);
}

/** How many progress dots are filled in the active game, 0 at round start. */
export function roundIndex(page: Page): Promise<number> {
  return page.evaluate(() => window.__abyE2E?.roundIndex() ?? -1);
}

/** The active scene's published round geometry, or null when it has none. */
export function roundGeometry(page: Page): Promise<E2ERoundGeometry | null> {
  return page.evaluate(() => window.__abyE2E?.roundGeometry() ?? null);
}

/** Polls until the round's progress dots show `filled` completions. */
export async function waitForRoundIndex(
  page: Page,
  filled: number,
  timeout = ROUND_TIMEOUT,
): Promise<void> {
  await expect
    .poll(() => roundIndex(page), {
      message: `the board should show ${filled} completed round(s)`,
      timeout,
    })
    .toBe(filled);
}

/**
 * Polls until the given round is on the board with targets to act on.
 *
 * `targets` never lies about what is clickable, so this is also the wait that
 * covers the game's own between-round delay — no sleeping on 700 ms or 1.2 s.
 */
export async function waitForPlayableRound(
  page: Page,
  round: number,
  timeout = ROUND_TIMEOUT,
): Promise<E2ERoundGeometry> {
  await expect
    .poll(
      async () => {
        const geometry = await roundGeometry(page);
        return geometry !== null && geometry.round === round && geometry.targets.length > 0;
      },
      {
        message: `round ${round} should be on the board with playable targets`,
        timeout,
      },
    )
    .toBe(true);

  const geometry = await roundGeometry(page);
  if (!geometry) throw new Error(`round ${round} vanished between polling and reading`);
  return geometry;
}

/**
 * Taps the hub tile for a registry index and waits for its scene.
 *
 * The tile is found by the index the bridge publishes, not by position, so the
 * journey does not care how the grid is laid out.
 */
export async function launchGame(page: Page, index: number, sceneKey: string): Promise<void> {
  await waitForScene(page, "Hub");
  await waitForHubReady(page);

  await expect
    .poll(async () => (await hubTiles(page)).some((tile) => tile.id === String(index)), {
      message: `hub tile ${index} (${sceneKey}) should be on screen`,
      timeout: SCENE_TIMEOUT,
    })
    .toBe(true);

  const tiles = await hubTiles(page);
  const tile = tiles.find((candidate) => candidate.id === String(index));
  if (!tile) throw new Error(`hub tile ${index} (${sceneKey}) is not on screen`);

  await tapCanvas(page, tile);
  await waitForScene(page, sceneKey);
}

/**
 * Leaves a game the way a player does: hold the back control, then wait for the
 * hub. The hold is the parental gate, so it cannot be short-circuited - but it
 * is held until the hub appears rather than for a fixed duration, because the
 * gate counts scene time and a loaded runner renders fewer frames per second.
 */
export async function returnToHub(page: Page): Promise<void> {
  await holdCanvasUntil(page, BACK_BUTTON, async () => (await activeSceneKey(page)) === "Hub");
  await waitForScene(page, "Hub");
  await waitForHubReady(page);
  await dismissHubToast(page);
}

/** Taps a published target's centre. */
export async function tapTarget(page: Page, target: E2ERoundTarget): Promise<void> {
  await tapCanvas(page, target);
}
