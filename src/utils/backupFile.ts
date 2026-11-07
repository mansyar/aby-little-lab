import { todayKey } from "../game/playTimeLogic";

/**
 * The browser seam for backup: the only module in `src/` this track added that
 * names a DOM global. Everything that touches `document`, `Blob` or `URL` for
 * exporting and importing a save lives here, so the format (`backupFormat.ts`)
 * stays pure and the rest of the app keeps playing on a canvas with no DOM.
 *
 * `src/__tests__/guard/backupDom.test.ts` pins that: a new module naming one of
 * those globals fails the suite.
 */

/**
 * `aby-little-lab-backup-2026-11-08.json` — a name a parent can recognise later.
 *
 * The date is the LOCAL day, built through `todayKey`, not
 * `toISOString().slice(0, 10)`: the ISO string is UTC, so a parent in Sydney
 * exporting before 11am would get yesterday's date in the filename.
 */
export function backupFilename(now: Date): string {
  return `aby-little-lab-backup-${todayKey(now)}.json`;
}

/**
 * Writes `json` to the user's downloads as `filename`.
 *
 * The anchor has to be in the document: a detached anchor's synthetic `click()`
 * is ignored by some engines, so the download would silently never start. The
 * object URL is revoked afterwards because it holds the blob alive for the
 * lifetime of the page otherwise — a parent who exports a few times would keep
 * every copy in memory until they close the tab.
 *
 * `revokeObjectURL` runs AFTER `click()`: revoking a URL first leaves the
 * anchor pointing at nothing, and the download is empty or never starts.
 */
export function downloadBackup(json: string, filename: string): void {
  const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/**
 * Starts the app again from a clean boot after a completed import.
 *
 * An import writes the whole save in one mutation, but every scene already
 * drawing has read the old state into its own objects — the hub's sticker shelf,
 * the profile chip, the play-time banner. Half-applying the new save to live
 * scene state would show a parent a mixture of two devices, so the honest move
 * is to start again: the write is on disk, and a fresh boot draws from it.
 *
 * It lives in the seam rather than in the panel because `window` is a DOM
 * global, and the panel is canvas code that a headless test can build.
 */
export function reloadApp(): void {
  window.location.reload();
}

/**
 * Opens the file picker; resolves the chosen file's text, or null when cancelled.
 *
 * The input is removed from the document and both listeners are detached on
 * every path — a chosen file, a cancellation, an empty selection, and a file
 * whose text cannot be read.
 *
 * Accepted limit: on an engine without the `cancel` event (Chromium, Edge and
 * Safari 16.4+ have it) a cancelled picker leaves this promise pending. Nothing
 * is corrupted by that and no state is left set: the input element is inert,
 * no write has happened, and the page keeps working. This is a promise that
 * always settles only on the engines that report cancellation.
 */
export function pickBackupFile(): Promise<{ name: string; text: string } | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    // Hidden because a bare file input renders: appending a visible one puts a
    // native "Choose file" control on the canvas page, and on an engine without
    // the `cancel` event it would stay there for the rest of the session - a
    // stray control a four-year-old can reach. A hidden input still opens the
    // picker from a click inside the same user gesture.
    input.hidden = true;

    /** Detaches, removes and resolves — the single exit for every path. */
    function settle(picked: { name: string; text: string } | null): void {
      input.removeEventListener("change", onPicked);
      input.removeEventListener("cancel", onCancelled);
      input.remove();
      resolve(picked);
    }

    function onCancelled(): void {
      settle(null);
    }

    function onPicked(): void {
      const file = input.files?.[0];
      if (file === undefined) {
        settle(null);
        return;
      }
      // A file the browser cannot read is treated exactly like a cancel: no
      // readable save was chosen, so nothing happens and nothing is written.
      file.text().then(
        (text) => settle({ name: file.name, text }),
        () => settle(null),
      );
    }

    input.addEventListener("change", onPicked);
    input.addEventListener("cancel", onCancelled);
    // Attached for the same reason as the download anchor: some engines ignore
    // a synthetic click on a detached input and never open the picker.
    document.body.append(input);
    input.click();
  });
}
