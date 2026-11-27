/** Identifiers for the eight parent-facing Help topics, in menu order. */
export type HelpTopicId =
  | "parental-lock"
  | "profiles-play-time"
  | "progress-adaptive"
  | "privacy-data"
  | "backup-restore"
  | "diagnostics"
  | "install-offline"
  | "updates";

/** One Help topic: a short introduction and at most four bullet points. */
export interface HelpTopic {
  readonly id: HelpTopicId;
  readonly title: string;
  readonly intro: string;
  readonly points: readonly string[];
}

/**
 * The Help content contract. Copy describes only shipped behaviour: no claims
 * about hardware testing, legal compliance, educational outcomes, data
 * retention studies, or longitudinal adaptive measurement.
 */
export const HELP_TOPICS: readonly HelpTopic[] = [
  {
    id: "parental-lock",
    title: "Parental lock",
    intro: "A continuous three-second hold opens the parent settings; a quick tap does not.",
    points: [
      "Hold Settings for three seconds to open the parent area.",
      "The same hold protects Back, creating or deleting profiles, Progress, and Reset.",
      "Switching the active profile from the Hub chip does not need the hold.",
      "Help is already inside Settings and needs no second hold.",
    ],
  },
  {
    id: "profiles-play-time",
    title: "Profiles & play time",
    intro: "Up to four local profiles; each keeps its own stickers, progress, and play time.",
    points: [
      "Daily limits are Off, 15, 30, 45, or 60 minutes.",
      "Only visible game time counts; time on the Hub does not.",
      "The current game may finish when the limit is reached.",
      "Daily usage resets on the local day.",
    ],
  },
  {
    id: "progress-adaptive",
    title: "Progress & adaptive difficulty",
    intro: "See plays, wins, accuracy, three-win mastery, and last played for each game.",
    points: [
      "22 of 24 games adapt to recent answers.",
      "Each game keeps ten recent taps and needs six before shifting.",
      "At 90% or more correct it shifts up; below 50% it shifts down.",
      "A game shifts at most once per playthrough; Overview is a snapshot, not long-term history.",
    ],
  },
  {
    id: "privacy-data",
    title: "Privacy & local data",
    intro:
      "Profiles, settings, stickers, progress, and play time stay in this browser's local storage.",
    points: [
      "No accounts, sign-in, cloud sync, ads, or analytics.",
      "No names, contact details, location, photos, or voice recording.",
      "Speech is produced on the device.",
      "App assets and updates load from the host, but gameplay data is not transmitted.",
    ],
  },
  {
    id: "backup-restore",
    title: "Backup & restore",
    intro: "Backup & restore saves the whole local save as a JSON file; keep it private.",
    points: [
      "Merge keeps this device's settings and combines profile progress best-of-field.",
      "Replace overwrites the whole save on this device.",
      "A checksum detects accidental corruption, not tampering.",
      "A successful restore reloads the app.",
    ],
  },
  {
    id: "diagnostics",
    title: "Diagnostics",
    intro: "Save diagnostics writes a text file only when crash records exist.",
    points: [
      "It may include app version, export time, user agent, viewport, profile count, and play-time state.",
      "It may include storage status and newest-first crash messages and stacks.",
      "Nothing is uploaded automatically.",
      "Review the file before sharing it.",
    ],
  },
  {
    id: "install-offline",
    title: "Install & offline",
    intro: "Use the context-aware Install row to add the app to your device.",
    points: [
      "On iOS, tap Share, then Add to Home Screen.",
      "After the first successful load, the shell, games, fonts, and music are cached for offline play.",
      "Clearing site data can remove the local save and the cache.",
      "Back up before clearing site data.",
    ],
  },
  {
    id: "updates",
    title: "Updates",
    intro: "The current version is shown in Settings.",
    points: [
      "When an update is ready, the Hub offers Update now or Later.",
      "Update now activates the new version and reloads the app.",
      "Later keeps the current version.",
      "The cached version stays playable offline.",
    ],
  },
];
