import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { type MockFn, type MockObject, MockScene, mockRegistry } from "../../helpers/phaserMock";

vi.mock("phaser", async () => {
  const { createPhaserModuleMock } = await import("../../helpers/phaserMock");
  return createPhaserModuleMock().module;
});

vi.mock("../../../utils/speech", () => ({
  setPreferredVoiceURI: vi.fn(),
  speakWord: vi.fn(),
}));

import { VoiceRow } from "../../../components/settings/VoiceRow";
import { setPreferredVoiceURI, speakWord } from "../../../utils/speech";
import { getActiveProfile, getSettings, updateSettings } from "../../../utils/storage";

/** Minimal SpeechSynthesisVoice stand-in for availableVoiceOptions(). */
function makeVoice(voiceURI: string, name: string, lang: string): SpeechSynthesisVoice {
  return {
    voiceURI,
    name,
    lang,
    default: false,
    localService: true,
  } as SpeechSynthesisVoice;
}

/** Fires every registered pointerdown handler (module + press feedback). */
function tap(obj: MockObject): void {
  const handlers = obj.allHandlers.filter((entry) => entry.name === "pointerdown");
  if (handlers.length === 0) throw new Error("no pointerdown handler");
  handlers.forEach((entry) => {
    entry.cb();
  });
}

/** The row's chip text: the only text whose label starts with "Voice:". */
function chip(bucket: MockObject[]): MockObject {
  const found = bucket.find(
    (obj) => obj.kind === "text" && String(obj.args?.[2]).startsWith("Voice:"),
  );
  if (!found) throw new Error("voice chip not created");
  return found;
}

/** Current chip label: the latest setText arg, else the created label. */
function chipLabel(obj: MockObject): string {
  const calls = (obj.setText as MockFn | undefined)?.mock.calls ?? [];
  const last = calls.at(-1)?.[0];
  return String(last ?? obj.args?.[2]);
}

interface SynthFixture {
  synth: Record<string, unknown>;
  listeners: Record<string, () => void>;
  setVoices: (voices: SpeechSynthesisVoice[]) => void;
}

/** Installs a controllable speechSynthesis global. */
function stubSynth(initialVoices: SpeechSynthesisVoice[]): SynthFixture {
  let voices = initialVoices;
  const listeners: Record<string, () => void> = {};
  const synth = {
    getVoices: vi.fn(() => voices),
    addEventListener: vi.fn((event: string, handler: () => void) => {
      listeners[event] = handler;
    }),
    removeEventListener: vi.fn((event: string) => {
      delete listeners[event];
    }),
  };
  vi.stubGlobal("speechSynthesis", synth);
  return {
    synth,
    listeners,
    setVoices(next: SpeechSynthesisVoice[]) {
      voices = next;
    },
  };
}

describe("VoiceRow", () => {
  let bucket: MockObject[];

  beforeEach(() => {
    mockRegistry.length = 0;
    bucket = [];
    localStorage.clear();
    getActiveProfile();
    vi.mocked(setPreferredVoiceURI).mockClear();
    vi.mocked(speakWord).mockClear();
  });

  it("renders the row card, voice chip and preview button", () => {
    stubSynth([]);
    const scene = new MockScene();
    new VoiceRow({ scene: scene as never, bucket: bucket as never }).create(512, 384);

    expect(bucket).toHaveLength(3); // row card + chip + preview
    expect(chip(bucket).args?.[2]).toBe("Voice: Default (device)");
    expect(bucket.some((obj) => obj.kind === "text" && obj.args?.[2] === "Preview")).toBe(true);
  });

  it("cycles the chip through installed voices and persists the choice", () => {
    stubSynth([makeVoice("urn:zoe", "Zoe", "en-US")]);
    const scene = new MockScene();
    new VoiceRow({ scene: scene as never, bucket: bucket as never }).create(512, 384);

    tap(chip(bucket));

    expect(chipLabel(chip(bucket))).toBe("Voice: en-US — Zoe");
    expect(setPreferredVoiceURI).toHaveBeenCalledWith("urn:zoe");
    expect(getSettings().preferredVoiceURI).toBe("urn:zoe");
  });

  it("resolves the chip index against the stored voice preference", () => {
    stubSynth([makeVoice("urn:zoe", "Zoe", "en-US")]);
    updateSettings({ preferredVoiceURI: "urn:zoe" });
    const scene = new MockScene();
    new VoiceRow({ scene: scene as never, bucket: bucket as never }).create(512, 384);

    expect(chip(bucket).args?.[2]).toBe("Voice: en-US — Zoe");
  });

  it("preview speaks the sample phrase honoring the SFX toggle", () => {
    stubSynth([]);
    updateSettings({ sfxEnabled: false });
    const scene = new MockScene();
    new VoiceRow({ scene: scene as never, bucket: bucket as never }).create(512, 384);

    const preview = bucket.find((obj) => obj.kind === "text" && obj.args?.[2] === "Preview");
    if (!preview) throw new Error("preview button not created");
    tap(preview);

    expect(speakWord).toHaveBeenCalledWith("Hi! I can talk.", false);
    expect(setPreferredVoiceURI).toHaveBeenCalledWith(getSettings().preferredVoiceURI);
  });

  it("refreshes the chip when the platform voice list changes", () => {
    const { setVoices } = stubSynth([makeVoice("urn:zoe", "Zoe", "en-US")]);
    const scene = new MockScene();
    const row = new VoiceRow({ scene: scene as never, bucket: bucket as never });
    row.create(512, 384);
    // The parent selects Zoe; the choice persists.
    tap(chip(bucket));
    expect(chipLabel(chip(bucket))).toBe("Voice: en-US — Zoe");

    // Zoe disappears from the platform; the chip falls back to the device voice.
    setVoices([]);
    row.voiceChanged();

    expect(chipLabel(chip(bucket))).toBe("Voice: Default (device)");
    expect((row as unknown as { voiceIndex: number }).voiceIndex).toBe(0);
  });

  it("keeps the chip label in sync without a stored preference after re-sync", () => {
    const { setVoices } = stubSynth([makeVoice("urn:zoe", "Zoe", "en-US")]);
    const scene = new MockScene();
    const row = new VoiceRow({ scene: scene as never, bucket: bucket as never });
    row.create(512, 384);

    setVoices([]);
    row.voiceChanged();

    expect(chipLabel(chip(bucket))).toBe("Voice: Default (device)");
    expect((row as unknown as { voiceIndex: number }).voiceIndex).toBe(0);
  });

  it("exposes its text objects through the shared bucket for panel teardown", () => {
    stubSynth([]);
    const scene = new MockScene();
    const bucketObjects: Phaser.GameObjects.GameObject[] = [];
    new VoiceRow({ scene: scene as never, bucket: bucketObjects }).create(512, 384);

    expect(bucketObjects).toHaveLength(3);
    for (const object of bucketObjects) {
      (object.destroy as Mock).mockClear?.();
    }
    expect(bucketObjects.every((obj) => typeof obj.destroy === "function")).toBe(true);
  });
});
