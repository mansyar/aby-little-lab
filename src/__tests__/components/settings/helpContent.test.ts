import { describe, expect, it } from "vitest";
import { HELP_TOPICS, type HelpTopicId } from "../../../components/settings/helpContent";

/** The approved topic set, in menu order. */
const EXPECTED_IDS: readonly HelpTopicId[] = [
  "parental-lock",
  "profiles-play-time",
  "progress-adaptive",
  "privacy-data",
  "backup-restore",
  "diagnostics",
  "install-offline",
  "updates",
];

/** All parent-facing copy for one topic, as one searchable string. */
function copyFor(id: HelpTopicId): string {
  const topic = HELP_TOPICS.find((entry) => entry.id === id);
  if (topic === undefined) throw new Error(`Missing help topic: ${id}`);
  return [topic.title, topic.intro, ...topic.points].join("\n");
}

describe("HELP_TOPICS", () => {
  it("publishes exactly eight topics in the approved order", () => {
    expect(HELP_TOPICS).toHaveLength(8);
    expect(HELP_TOPICS.map((topic) => topic.id)).toEqual(EXPECTED_IDS);
    expect(new Set(HELP_TOPICS.map((topic) => topic.id)).size).toBe(8);
  });

  it("gives every topic non-empty copy and at most four points", () => {
    for (const topic of HELP_TOPICS) {
      expect(topic.title.trim().length).toBeGreaterThan(0);
      expect(topic.intro.trim().length).toBeGreaterThan(0);
      expect(topic.points.length).toBeGreaterThan(0);
      expect(topic.points.length).toBeLessThanOrEqual(4);
      for (const point of topic.points) expect(point.trim().length).toBeGreaterThan(0);
    }
  });

  it("explains the parental hold and where it does and does not apply", () => {
    const copy = copyFor("parental-lock");
    for (const claim of [
      "three-second hold",
      "Settings",
      "Back",
      "creating or deleting profiles",
      "Progress",
      "Reset",
      "Hub chip",
      "no second hold",
    ]) {
      expect(copy).toContain(claim);
    }
  });

  it("explains profiles, daily limits and what counts as play time", () => {
    const copy = copyFor("profiles-play-time");
    for (const claim of [
      "four local profiles",
      "stickers, progress, and play time",
      "Off, 15, 30, 45, or 60 minutes",
      "Only visible game time counts",
      "Hub",
      "may finish",
      "local day",
    ]) {
      expect(copy).toContain(claim);
    }
  });

  it("describes progress and adaptive difficulty without claiming long-term measurement", () => {
    const copy = copyFor("progress-adaptive");
    for (const claim of [
      "plays, wins, accuracy, three-win mastery, and last played",
      "22 of 24 games adapt",
      "ten recent taps",
      "six before shifting",
      "90%",
      "below 50%",
      "once per playthrough",
      "Overview is a snapshot",
    ]) {
      expect(copy).toContain(claim);
    }
  });

  it("describes local-only privacy without collecting personal data", () => {
    const copy = copyFor("privacy-data");
    for (const claim of [
      "local storage",
      "No accounts, sign-in, cloud sync, ads, or analytics",
      "No names, contact details, location, photos, or voice recording",
      "Speech is produced on the device",
      "not transmitted",
    ]) {
      expect(copy).toContain(claim);
    }
  });

  it("explains backup, merge, replace and checksum limits", () => {
    const copy = copyFor("backup-restore");
    for (const claim of [
      "JSON file",
      "keep it private",
      "Merge keeps this device's settings",
      "best-of-field",
      "Replace overwrites the whole save",
      "accidental corruption, not tampering",
      "reloads",
    ]) {
      expect(copy).toContain(claim);
    }
  });

  it("explains when diagnostics are written and that nothing uploads", () => {
    const copy = copyFor("diagnostics");
    for (const claim of [
      "only when crash records exist",
      "app version",
      "user agent",
      "viewport",
      "newest-first",
      "Nothing is uploaded automatically",
      "Review the file before sharing",
    ]) {
      expect(copy).toContain(claim);
    }
  });

  it("explains install, offline caching and the cost of clearing site data", () => {
    const copy = copyFor("install-offline");
    for (const claim of [
      "Install row",
      "Share",
      "Add to Home Screen",
      "cached for offline play",
      "Clearing site data",
      "Back up before clearing site data",
    ]) {
      expect(copy).toContain(claim);
    }
  });

  it("explains the Hub update choices and the offline fallback", () => {
    const copy = copyFor("updates");
    for (const claim of [
      "Settings",
      "Update now or Later",
      "activates the new version and reloads",
      "Later keeps the current version",
      "cached version stays playable offline",
    ]) {
      expect(copy).toContain(claim);
    }
  });

  it("makes no hardware, compliance, outcome or longitudinal claims", () => {
    const allCopy = HELP_TOPICS.map((topic) =>
      [topic.title, topic.intro, ...topic.points].join("\n"),
    ).join("\n");
    for (const banned of [
      "hardware-tested",
      "device-tested",
      "clinically",
      "research-proven",
      "retention study",
      "GDPR",
      "COPPA",
      "guaranteed",
      "longitudinal",
    ]) {
      expect(allCopy.toLowerCase()).not.toContain(banned.toLowerCase());
    }
  });
});
