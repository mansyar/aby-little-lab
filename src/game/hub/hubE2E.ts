import type Phaser from "phaser";
import type { PwaToasts } from "../../components/PwaToasts";
import type { SettingsPanel } from "../../components/SettingsPanel";
import type {
  E2EHubGroups,
  E2EHubPlayTime,
  E2EHubToast,
  E2ERoundTarget,
  E2ESettingsState,
} from "../e2eBridge";
import type { HubGrid } from "../hubGrid";
import { ALL_GROUP_ID, visibleTileIndexes } from "../hubGroups";
import { pageTileIndexes } from "../hubPaging";
import { GAME_TILES } from "../hubTiles";
import type { PlayTimeUiController } from "./playTimeUi";

/**
 * Structural view of the hub objects the e2e publishers read. Keeping the
 * publishers here lets `HubScene` own only wiring while the bridge still
 * reports live geometry from the objects the child actually sees.
 */
export interface HubE2EState {
  grid: HubGrid;
  settingsButton?: Phaser.GameObjects.Text;
  settingsPanel?: SettingsPanel;
  pwaToasts: PwaToasts;
  playTime: PlayTimeUiController;
}

/** The tiles that are on screen, in draw order, keyed by registry index. */
export function hubTiles(v: HubE2EState): E2ERoundTarget[] {
  const selection = v.grid.selection;
  const indexes =
    selection === ALL_GROUP_ID
      ? v.grid.paged
        ? pageTileIndexes(v.grid.hubPage)
        : GAME_TILES.map((_, index) => index)
      : // A filtered board draws one group on one page, so its drawn slots are
        // that group's registry indexes — the identity a journey already knows.
        visibleTileIndexes(selection);
  return v.grid.attractTargets.map((tile, slot) => ({
    id: String(indexes[slot]),
    x: tile.x,
    y: tile.y,
  }));
}

/** The live chip row and its filter selection. */
export function hubGroups(v: HubE2EState): E2EHubGroups {
  return { selected: v.grid.selection, chips: v.grid.groupChipPoints() };
}

/** The PWA toast covering the hub, if any. */
export function hubToast(v: HubE2EState): E2EHubToast | null {
  const point = v.pwaToasts.dismissPoint();
  return point ? { button: point } : null;
}

/** Whether the grid is accepting taps. */
export function hubReady(v: HubE2EState): boolean {
  return v.grid.entranceSettled;
}

/** The parental gate and settings panel as currently drawn. */
export function settings(v: HubE2EState): E2ESettingsState {
  const centre = v.settingsButton?.getCenter();
  const panel = v.settingsPanel;
  const open = panel?.e2eOpen() ?? false;
  return {
    gate: centre ? { x: centre.x, y: centre.y } : null,
    open,
    toggles: open && panel ? panel.e2eToggles() : [],
    // The row's published point and the overlay's own state both survive the
    // panel losing focus, so neither is gated on the panel staying open.
    progressRow: panel ? panel.e2eProgressRow() : null,
    progress: panel ? panel.e2eProgress() : null,
    // Help is published only while its own panel is up, never as a stale state.
    helpButton: open && panel ? panel.e2eHelpButton() : null,
    help: open && panel ? panel.e2eHelp() : null,
    // The notice is the panel's own open-time snapshot, so the journey reads
    // the same value that decided what the parent sees.
    degraded: open && panel ? panel.e2eDegraded() : false,
    // The second page is only tappable while the panel is up, so a closed
    // panel publishes the empty page rather than the last one it drew.
    ...(open && panel
      ? panel.backupState()
      : { page: 0, switchPage: { x: 0, y: 0 }, backupRows: [], backupResult: "", choices: [] }),
  };
}

/** The daily-budget cap and the launch nudge, read from their own controllers. */
export function hubPlayTime(v: HubE2EState): E2EHubPlayTime {
  return { timeUp: v.playTime.isTimeUp(), nudging: v.playTime.nudge.isActive() };
}
