import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  backupFilename,
  downloadBackup,
  downloadText,
  pickBackupFile,
  reloadApp,
  saveDiagnostics,
} from "../../utils/backupFile";
import { toCrashEntry } from "../../utils/diagnostics";
import {
  getActiveProfile,
  getProfiles,
  recordCrash,
  recordPlayTime,
  setPlayTimeLimit,
} from "../../utils/storage";

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

/**
 * Stops the download at the object URL so a test can read the bytes that would
 * have been written and the name the browser would have saved them under.
 */
function captureWrite(): {
  createCalls: () => number;
  filename: () => string;
  type: () => string;
  text: () => Promise<string>;
} {
  let blob: Blob | undefined;
  let filename = "";
  const create = vi.spyOn(URL, "createObjectURL").mockImplementation((value) => {
    blob = value as Blob;
    return "blob:captured";
  });
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {
    filename = document.querySelector("a")?.getAttribute("download") ?? "";
  });
  return {
    createCalls: () => create.mock.calls.length,
    filename: () => filename,
    type: () => blob?.type ?? "",
    text: async () => (blob ? await blob.text() : ""),
  };
}

describe("downloadText", () => {
  it("writes the text it is handed under the name it is given", async () => {
    const write = captureWrite();

    downloadText("plain words", "notes.txt");

    expect(write.filename()).toBe("notes.txt");
    expect(await write.text()).toBe("plain words");
    // A text report, so the file opens in whatever reads text.
    expect(write.type()).toBe("text/plain");
    // The anchor does not stay in the page afterwards, either path.
    expect(document.querySelector("a")).toBeNull();
  });

  it("keeps the backup a JSON file even though the anchor path is shared", () => {
    const write = captureWrite();

    downloadBackup("{}", "backup.json");

    // The bytes are the envelope; the type tells the OS what it is opening.
    expect(write.filename()).toBe("backup.json");
    expect(write.type()).toBe("application/json");
  });
});

/** The moment of export every diagnostics case is written at. */
const NOW = new Date(2026, 10, 8, 14, 20, 0);
/** One entry recorded a little before {@link NOW}, for the ordering case. */
const EARLIER = new Date(2026, 10, 8, 14, 19, 30);

/** Saves once at `now` and returns the text of the file that would be written. */
async function savedText(now: Date = NOW): Promise<string> {
  const write = captureWrite();
  expect(saveDiagnostics(now).saved).toBe(true);
  const text = await write.text();
  vi.restoreAllMocks();
  return text;
}

describe("saveDiagnostics", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("writes no file at all when no crash has been recorded (AC-8)", () => {
    const write = captureWrite();

    expect(saveDiagnostics(NOW)).toEqual({ saved: false });

    // Not an empty file: no blob, no anchor, no download a parent has to open
    // to discover it says nothing.
    expect(write.createCalls()).toBe(0);
    expect(document.querySelector("a")).toBeNull();
  });

  it("names the file from the local day, not the UTC day", () => {
    recordCrash(toCrashEntry("error", new Error("boom"), NOW));
    const write = captureWrite();

    // Just after local midnight on 8 November. A machine east of UTC — the
    // parent this guards is in Sydney — is still on 7 November in UTC then, so
    // a UTC slice would name the file with yesterday's date.
    expect(saveDiagnostics(new Date(2026, 10, 8, 0, 5, 0))).toEqual({
      saved: true,
      filename: "diagnostics-2026-11-08.txt",
    });
    expect(write.filename()).toBe("diagnostics-2026-11-08.txt");

    // ...and the day before names the day before.
    vi.restoreAllMocks();
    recordCrash(toCrashEntry("error", new Error("boom"), NOW));
    const nextDay = captureWrite();
    expect(saveDiagnostics(new Date(2026, 10, 7, 23, 55, 0))).toEqual({
      saved: true,
      filename: "diagnostics-2026-11-07.txt",
    });
    expect(nextDay.filename()).toBe("diagnostics-2026-11-07.txt");
  });

  it("writes the environment header and every entry, newest first (FR-10)", async () => {
    recordCrash(toCrashEntry("error", new Error("older boom"), EARLIER));
    recordCrash(toCrashEntry("rejection", new Error("newer boom"), NOW));
    const write = captureWrite();

    expect(saveDiagnostics(NOW)).toEqual({ saved: true, filename: "diagnostics-2026-11-08.txt" });

    const text = await write.text();
    expect(text).toContain(`Exported: ${NOW.toISOString()}`);
    expect(text).toContain(`App version: ${__APP_VERSION__}`);
    expect(text).toContain(`User agent: ${navigator.userAgent}`);
    expect(text).toContain(`Viewport: ${window.innerWidth}x${window.innerHeight}`);
    expect(text).toContain(`Profiles: ${getProfiles().length}`);
    expect(text).toContain("Play time: unlimited");
    expect(text).toContain("2 crashes recorded, newest first.");
    expect(text).toContain("newer boom");
    expect(text).toContain("older boom");
    // The line a parent reads is the last thing that broke, not the first.
    expect(text.indexOf("newer boom")).toBeLessThan(text.indexOf("older boom"));
  });

  it("reports the play-time state in one word", async () => {
    recordCrash(toCrashEntry("error", new Error("boom"), NOW));
    const id = getActiveProfile().id;

    expect(await savedText()).toContain("Play time: unlimited");

    setPlayTimeLimit(id, 30);
    expect(await savedText()).toContain("Play time: available");

    setPlayTimeLimit(id, 1);
    recordPlayTime(id, 1);
    expect(await savedText()).toContain("Play time: spent");
  });
});
