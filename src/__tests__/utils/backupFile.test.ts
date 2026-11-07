import { afterEach, describe, expect, it, vi } from "vitest";
import { backupFilename, downloadBackup, pickBackupFile, reloadApp } from "../../utils/backupFile";

/**
 * The browser seam, driven against happy-dom's real `document`.
 *
 * Both directions of a backup are files: an export writes one through a
 * temporary anchor and a revoked object URL, and an import reads one through a
 * hidden file input. These tests pin what the browser side does — not the
 * format, which has no browser in it at all.
 *
 * Nothing here reads the wall clock: the one date is built from explicit local
 * fields, so the verdict is the same in every timezone on every day.
 */

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = "";
});

describe("backupFilename", () => {
  it("names the file from the local day, not the UTC day", () => {
    // Just after local midnight on 8 November. On a machine east of UTC — the
    // parent this guards is in Sydney — `toISOString().slice(0, 10)` at this
    // instant is `2026-11-07`, so a UTC slice would name the file with
    // yesterday's date.
    expect(backupFilename(new Date(2026, 10, 8, 0, 5, 0))).toBe(
      "aby-little-lab-backup-2026-11-08.json",
    );
    // Both ends of the same local day agree, in every timezone...
    expect(backupFilename(new Date(2026, 10, 8, 23, 55, 0))).toBe(
      "aby-little-lab-backup-2026-11-08.json",
    );
    // ...and the day before does not.
    expect(backupFilename(new Date(2026, 10, 7, 23, 55, 0))).toBe(
      "aby-little-lab-backup-2026-11-07.json",
    );
  });
});

describe("downloadBackup", () => {
  it("clicks a temporary anchor and revokes the object URL afterwards", () => {
    const order: string[] = [];
    const create = vi.spyOn(URL, "createObjectURL").mockImplementation(() => {
      order.push("create");
      return "blob:backup";
    });
    const revoke = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {
      order.push("revoke");
    });
    let href = "";
    let download = "";
    let attachedWhenClicked = false;
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {
      const anchor = document.querySelector("a");
      href = anchor?.getAttribute("href") ?? "";
      download = anchor?.getAttribute("download") ?? "";
      // Some engines ignore a click on a detached anchor and download nothing.
      attachedWhenClicked = anchor?.isConnected ?? false;
      order.push("click");
    });

    downloadBackup('{"format":"probe"}', "aby-little-lab-backup-2026-11-08.json");

    expect(create).toHaveBeenCalledTimes(1);
    expect(click).toHaveBeenCalledTimes(1);
    expect(revoke).toHaveBeenCalledTimes(1);
    expect(href).toBe("blob:backup");
    expect(download).toBe("aby-little-lab-backup-2026-11-08.json");
    expect(attachedWhenClicked).toBe(true);
    // A revoke before the click would leave the anchor pointing at nothing.
    expect(order).toEqual(["create", "click", "revoke"]);
    // The anchor does not stay in the page afterwards.
    expect(document.querySelector("a")).toBeNull();
  });
});

/**
 * Starts a pick with the picker stubbed shut, and returns the live input plus
 * the promise under test. The input is appended synchronously, so it can be
 * driven straight away.
 */
function startPick(): {
  input: HTMLInputElement;
  picked: Promise<{ name: string; text: string } | null>;
} {
  const click = vi.spyOn(HTMLInputElement.prototype, "click").mockImplementation(() => undefined);
  const picked = pickBackupFile();
  click.mockRestore();
  const input = document.querySelector<HTMLInputElement>("input[type=file]");
  if (input === null) {
    throw new Error("pickBackupFile must append a file input before clicking it");
  }
  return { input, picked };
}

describe("pickBackupFile", () => {
  it("resolves the chosen file's text and removes the input", async () => {
    const { input, picked } = startPick();
    // A rendered input would put a native file control on the canvas page.
    expect(input.hidden).toBe(true);
    const file = new File(["{}"], "b.json", { type: "application/json" });
    Object.defineProperty(input, "files", { configurable: true, value: [file] });

    input.dispatchEvent(new Event("change"));

    await expect(picked).resolves.toEqual({ name: "b.json", text: "{}" });
    expect(document.querySelector("input[type=file]")).toBeNull();
  });

  it("resolves null when the picker is cancelled", async () => {
    const { input, picked } = startPick();

    input.dispatchEvent(new Event("cancel"));

    await expect(picked).resolves.toBeNull();
    expect(document.querySelector("input[type=file]")).toBeNull();
  });

  it("resolves null when the change carries no file", async () => {
    const { input, picked } = startPick();

    // A file input that was dismissed can still fire change with no selection.
    input.dispatchEvent(new Event("change"));

    await expect(picked).resolves.toBeNull();
    expect(document.querySelector("input[type=file]")).toBeNull();
  });

  it("resolves null when the chosen file cannot be read", async () => {
    const { input, picked } = startPick();
    const file = new File(["{}"], "b.json", { type: "application/json" });
    Object.defineProperty(file, "text", {
      configurable: true,
      value: () => Promise.reject(new Error("unreadable")),
    });
    Object.defineProperty(input, "files", { configurable: true, value: [file] });

    input.dispatchEvent(new Event("change"));

    await expect(picked).resolves.toBeNull();
    expect(document.querySelector("input[type=file]")).toBeNull();
  });
});

describe("reloadApp", () => {
  it("starts the app again through the browser's own reload", () => {
    const reload = vi.fn();
    const original = window.location.reload;
    // `location.reload` is not configurable on a real browser, so it is swapped
    // by hand and put back, rather than spied on.
    Object.defineProperty(window.location, "reload", { configurable: true, value: reload });
    try {
      reloadApp();
    } finally {
      Object.defineProperty(window.location, "reload", { configurable: true, value: original });
    }
    expect(reload).toHaveBeenCalledTimes(1);
  });
});
