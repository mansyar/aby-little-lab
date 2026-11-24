import type { BandShift } from "../../game/adaptiveLogic";

/**
 * Static text appended to a Learning Progress stats line to show a game's
 * effective band: -1 easier, 0 classic, +1 harder. The number is the actual
 * `bandShiftFor` result, so the readout never claims more than the viewed
 * profile's tap window supports. Pure and parent-only: no child scene renders
 * this text, and the overlay derives the shift before calling it.
 */
export function bandLabel(shift: BandShift): string {
  return ` · band ${shift > 0 ? "+" : ""}${shift}`;
}
