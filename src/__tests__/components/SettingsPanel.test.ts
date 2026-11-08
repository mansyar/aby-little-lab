import { SettingsPanel } from "../../components/SettingsPanel";
import {
  AVATAR_TEXTURE_SIZE,
  OVERLAY_ALPHA,
  PANEL_HEIGHT,
  PANEL_WIDTH,
  PRIMARY_COLOR,
  ROW_HIT_WIDTH,
  ROW_PITCH,
} from "../../components/settings/primitives";
import { PROFILE_AVATAR_TEXTURES } from "../../game/profileLogic";
import {
  backupFilename,
  downloadBackup,
  downloadText,
  pickBackupFile,
  reloadApp,
  saveDiagnostics,
} from "../../utils/backupFile";
import { type BackupEnvelope, createBackup, refusalFor } from "../../utils/backupFormat";
import { NO_CRASHES } from "../../utils/diagnostics";
import {
  createInstallTracker,
  type InstallTracker,
  type InstallTrackerDeps,
  type InstallUiState,
} from "../../utils/pwaInstall";
import {
  addProfile,
  applyImport,
  earnSticker,
  exportSave,
  getActiveProfile,
  getPlayTime,
  getProfiles,
  getSettings,
  hasSticker,
  isPersistenceDegraded,
  recordGamePlay,
  recordGameResult,
  SCHEMA_VERSION,
  setPlayTimeLimit,
  switchProfile,
  updateSettings,
} from "../../utils/storage";
import { breakStorage, repairStorage } from "../helpers/throwingStorage";

const { mockAudio } = vi.hoisted(() => ({
  mockAudio: {
    pauseBGM: vi.fn(),
    playBGM: vi.fn(),
    playCorrect: vi.fn(),
    setBGMEnabled: vi.fn(),
    setSFXEnabled: vi.fn(),
  },
}));

vi.mock("../../audio/AudioManager", () => ({
  AudioManager: {
    getInstance: () => mockAudio,
  },
}));

/**
 * The seam's browser effects are replaced with spies: this file may not open a
 * real picker, write a real download or reload a real page. `backupFilename`
 * stays real — it is pure, and the result line has to name the file the same
 * way the app does. The pure format module is untouched.
 */
vi.mock("../../utils/backupFile", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../utils/backupFile")>();
  return {
    ...actual,
    downloadBackup: vi.fn(),
    downloadText: vi.fn(),
    pickBackupFile: vi.fn(),
    reloadApp: vi.fn(),
    saveDiagnostics: vi.fn(),
  };
});

/**
 * `applyImport` writes the whole save, so each case decides its own verdict:
 * a real merge, or a refusal it wants to see on the result line.
 */
vi.mock("../../utils/storage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../utils/storage")>();
  return { ...actual, applyImport: vi.fn() };
});

/** Creates a fake install tracker in the given state for SettingsPanel tests. */
function createFakeInstallTracker(state: InstallUiState): InstallTracker {
  return {
    getState: vi.fn(() => state),
    prompt: vi.fn().mockResolvedValue(true),
    destroy: vi.fn(),
  };
}

type InstallListenerMap = Map<string, (event: unknown) => void>;

/** Browser wiring for a real install tracker, with its listeners addressable. */
function createTrackerDeps(): {
  deps: InstallTrackerDeps;
  listeners: InstallListenerMap;
  promptEvent: { preventDefault: () => void; prompt: () => Promise<void> };
} {
  const listeners: InstallListenerMap = new Map();
  const promptEvent = { preventDefault: vi.fn(), prompt: vi.fn(() => Promise.resolve()) };
  return {
    deps: {
      userAgent: "Android Chrome",
      isStandalone: () => false,
      addEventListener: (type, listener) => {
        listeners.set(type, listener);
      },
      removeEventListener: vi.fn((type: string) => {
        listeners.delete(type);
      }),
    },
    listeners,
    promptEvent,
  };
}

/** Fires beforeinstallprompt at whatever listener the wiring currently holds. */
function emitBeforeInstallPrompt(
  listeners: InstallListenerMap,
  promptEvent: { preventDefault: () => void; prompt: () => Promise<void> },
): void {
  const listener = listeners.get("beforeinstallprompt");
  if (!listener) throw new Error("Expected beforeinstallprompt listener");
  listener(promptEvent);
}

vi.mock("phaser", () => {
  class Rectangle {
    static Contains = vi.fn();

    constructor(
      readonly x: number,
      readonly y: number,
      readonly width: number,
      readonly height: number,
    ) {}
  }

  return {
    default: { Geom: { Rectangle } },
    Geom: { Rectangle },
  };
});

type MockFn = ReturnType<typeof vi.fn>;

interface MockGameObject {
  destroy: MockFn;
  on: MockFn;
  setAlpha: MockFn;
  setColor: MockFn;
  setFillStyle: MockFn;
  setInteractive: MockFn;
  setOrigin: MockFn;
  setScale: MockFn;
  setStrokeStyle: MockFn;
  setText: MockFn;
  setX: MockFn;
}

interface MockScene {
  add: {
    image: MockFn;
    rectangle: MockFn;
    text: MockFn;
  };
  cameras: {
    main: {
      height: number;
      width: number;
    };
  };
  children: {
    bringToTop: MockFn;
  };
  time: {
    delayedCall: MockFn;
  };
}

function createGameObject(): MockGameObject {
  const object: MockGameObject = {
    destroy: vi.fn(),
    on: vi.fn(),
    setAlpha: vi.fn(),
    setColor: vi.fn(),
    setFillStyle: vi.fn(),
    setInteractive: vi.fn(),
    setOrigin: vi.fn(),
    setScale: vi.fn(),
    setStrokeStyle: vi.fn(),
    setText: vi.fn(),
    setX: vi.fn(),
  };
  object.setColor.mockReturnValue(object);
  object.setFillStyle.mockReturnValue(object);
  object.setOrigin.mockReturnValue(object);
  object.setInteractive.mockReturnValue(object);
  object.setScale.mockReturnValue(object);
  object.setStrokeStyle.mockReturnValue(object);
  object.setText.mockReturnValue(object);
  object.setX.mockReturnValue(object);
  return object;
}

/** Counts how many handlers were registered for an event on a mock object. */
function listenerCount(object: MockGameObject, event: string): number {
  return object.on.mock.calls.filter(([name]) => name === event).length;
}

/** Finds a text object whose label starts with the given prefix. */
function findTextStartingWith(scene: MockScene, prefix: string): MockGameObject | undefined {
  const callIndex = scene.add.text.mock.calls.findIndex(
    (call) => typeof call[2] === "string" && (call[2] as string).startsWith(prefix),
  );
  if (callIndex < 0) return undefined;
  return scene.add.text.mock.results[callIndex]?.value as MockGameObject | undefined;
}

interface RectWithArgs {
  args?: unknown[];
  object: MockGameObject;
}

/** Returns every created rectangle together with its constructor arguments. */
function getRectangles(scene: MockScene): RectWithArgs[] {
  return scene.add.rectangle.mock.results.map((result, index) => ({
    args: scene.add.rectangle.mock.calls[index] as unknown[],
    object: result.value as MockGameObject,
  }));
}

function triggerPointerdown(object: MockGameObject): void {
  const callback = object.on.mock.calls.find(([event]) => event === "pointerdown")?.[1] as
    | (() => void)
    | undefined;
  if (!callback) throw new Error("Expected pointerdown handler");
  callback();
}

/** Finds the display object created by the first text call with the given label. */
function findTextByLabel(scene: MockScene, label: string): MockGameObject | undefined {
  const callIndex = scene.add.text.mock.calls.findIndex((call) => call[2] === label);
  if (callIndex < 0) return undefined;
  return scene.add.text.mock.results[callIndex]?.value as MockGameObject | undefined;
}

interface HitRect {
  bottom: number;
  left: number;
  right: number;
  top: number;
}

/**
 * Reads the hit-area config a text object was given, failing loudly when the
 * control is not interactive at all.
 */
function configOf(object: MockGameObject): {
  hitArea: { height: number; width: number; x: number; y: number };
  hitAreaCallback: (area: unknown, localX: number, localY: number, object: unknown) => boolean;
} {
  const config = object.setInteractive.mock.calls[0]?.[0] as
    | {
        hitArea: { height: number; width: number; x: number; y: number };
        hitAreaCallback: (
          area: unknown,
          localX: number,
          localY: number,
          object: unknown,
        ) => boolean;
      }
    | undefined;
  if (!config?.hitAreaCallback) throw new Error("No custom hit area callback");
  return config;
}

/**
 * Answers the engine's own question for a point in scene space: it adds the
 * display origin to the local pointer before calling the callback, exactly as
 * `InputManager.pointWithinHitArea` does, so a band that only looks right
 * relative to the object's centre fails here.
 */
function engineHits(
  config: ReturnType<typeof configOf>,
  objectX: number,
  objectY: number,
  displayOriginX: number,
  displayOriginY: number,
  pointX: number,
  pointY: number,
): boolean {
  return config.hitAreaCallback(
    config.hitArea,
    pointX - objectX + displayOriginX,
    pointY - objectY + displayOriginY,
    { displayOriginX, displayOriginY },
  );
}

/**
 * Answers the engine's question for a scaled image: the pointer is translated
 * into the object's local frame through `TransformXY`, which divides by scale,
 * before `pointWithinHitArea` adds the (unscaled) displayOrigin.
 */
function engineHitsScaled(
  config: ReturnType<typeof configOf>,
  objectX: number,
  objectY: number,
  scale: number,
  displayOriginX: number,
  displayOriginY: number,
  pointX: number,
  pointY: number,
): boolean {
  return config.hitAreaCallback(
    config.hitArea,
    (pointX - objectX) / scale + displayOriginX,
    (pointY - objectY) / scale + displayOriginY,
    { displayOriginX, displayOriginY },
  );
}

/** Scene-space position arguments of the text call that created the object. */
function textCallArgs(scene: MockScene, object: MockGameObject): [number, number] {
  const index = scene.add.text.mock.results.findIndex((result) => result.value === object);
  if (index < 0) throw new Error("Object was not created by scene.add.text");
  return scene.add.text.mock.calls[index] as unknown as [number, number];
}

/** Scene-space position arguments of the image call that created the object. */
function imageCallArgs(scene: MockScene, object: MockGameObject): [number, number] {
  const index = scene.add.image.mock.results.findIndex((result) => result.value === object);
  if (index < 0) throw new Error("Object was not created by scene.add.image");
  return scene.add.image.mock.calls[index] as unknown as [number, number];
}

/**
 * Resolves the custom hit area of the text object with the given label into
 * scene coordinates, using the object's own position and rectangle. Deriving
 * the geometry from the created objects (rather than from the layout
 * constants) is what lets a constant drift away from the layout fail here.
 */
function hitRectFor(scene: MockScene, label: string): HitRect {
  const callIndex = scene.add.text.mock.calls.findIndex((call) => call[2] === label);
  if (callIndex < 0) throw new Error(`No text object labelled ${label}`);
  const [x, y] = scene.add.text.mock.calls[callIndex] as unknown as [number, number];
  const object = scene.add.text.mock.results[callIndex]?.value as MockGameObject;
  const config = object.setInteractive.mock.calls[0]?.[0] as
    | { hitArea: { height: number; width: number; x: number; y: number } }
    | undefined;
  if (!config?.hitArea) throw new Error(`No custom hit area on ${label}`);
  const { hitArea } = config;
  return {
    bottom: y + hitArea.y + hitArea.height,
    left: x + hitArea.x,
    right: x + hitArea.x + hitArea.width,
    top: y + hitArea.y,
  };
}

/** Finds the display object created by the LAST text call with the given label. */
function findLastTextByLabel(scene: MockScene, label: string): MockGameObject | undefined {
  let lastIndex = -1;
  scene.add.text.mock.calls.forEach((call, index) => {
    if (call[2] === label) lastIndex = index;
  });
  if (lastIndex < 0) return undefined;
  return scene.add.text.mock.results[lastIndex]?.value as MockGameObject | undefined;
}

/** Returns every display object created by add.image with the given texture. */
function findImagesByTexture(scene: MockScene, texture: string): MockGameObject[] {
  const images: MockGameObject[] = [];
  scene.add.image.mock.calls.forEach((call, index) => {
    if (call[2] === texture) {
      images.push(scene.add.image.mock.results[index]?.value as MockGameObject);
    }
  });
  return images;
}

function createScene(): MockScene {
  return {
    add: {
      image: vi.fn(() => createGameObject()),
      // Captures constructor args so geometry-based assertions can identify shapes.
      rectangle: vi.fn((...args: unknown[]) => {
        const object = createGameObject();
        (object as unknown as { args?: unknown[] }).args = args;
        return object;
      }),
      text: vi.fn(() => createGameObject()),
    },
    cameras: {
      main: {
        height: 768,
        width: 1024,
      },
    },
    children: { bringToTop: vi.fn() },
    // A real `delayedCall` would wait; the panel only needs its request recorded
    // so a test can fire the callback itself.
    time: { delayedCall: vi.fn() },
  };
}

/** The rendered extent a text object reports, as Phaser's `getBounds` does. */
interface Bounds {
  bottom: number;
  left: number;
  right: number;
  top: number;
}

/** A text double that can report the extent of what it currently renders. */
type MeasurableText = MockGameObject & { getBounds: () => Bounds };

/** Per-character advance of a 26 px Baloo label, near enough to lay one out. */
const GLYPH_WIDTH = 13;
/** Line box of the panel's 26 px labels. */
const LINE_HEIGHT = 34;

/**
 * Makes `scene.add.text` report rendered extents for the voice row's two
 * labels, the way Phaser's `Text` does, and leaves every other label on the
 * plain double. The extent follows `setText`, because cycling to another voice
 * changes the chip's width.
 */
function measureVoiceText(scene: MockScene): void {
  scene.add.text.mockImplementation((x: number, y: number, label: string) => {
    const object = createGameObject() as MeasurableText;
    let rendered = label;
    object.setText.mockImplementation((next: string) => {
      rendered = next;
      return object;
    });
    if (label.startsWith("Voice:") || label === "Preview") {
      const width = (): number => rendered.length * GLYPH_WIDTH;
      object.getBounds = vi.fn(() => ({
        bottom: y + LINE_HEIGHT / 2,
        left: x - width() / 2,
        right: x + width() / 2,
        top: y - LINE_HEIGHT / 2,
      }));
    }
    return object;
  });
}

/**
 * Resolves a custom hit area into scene coordinates the way `centredHitArea`
 * intends: the callback subtracts the displayOrigin the engine adds, so the
 * rectangle is measured from the object's own position - the centre of an
 * origin-0.5 label - not from its top-left corner.
 */
function measuredHitRect(object: MeasurableText): HitRect {
  const config = object.setInteractive.mock.calls.at(-1)?.[0] as
    | { hitArea: { height: number; width: number; x: number; y: number } }
    | undefined;
  if (!config?.hitArea) throw new Error("No custom hit area");
  const bounds = object.getBounds();
  const centreX = (bounds.left + bounds.right) / 2;
  const centreY = (bounds.top + bounds.bottom) / 2;
  const { hitArea } = config;
  return {
    bottom: centreY + hitArea.y + hitArea.height,
    left: centreX + hitArea.x,
    right: centreX + hitArea.x + hitArea.width,
    top: centreY + hitArea.y,
  };
}

/** The args of the four corner coordinates of a row card, by its 400x68 size. */
function lastRowCard(scene: MockScene): [number, number, number, number] {
  const card = getRectangles(scene)
    .filter(({ args }) => args?.[2] === 400 && args?.[3] === 68)
    .at(-1);
  if (!card?.args) throw new Error("no row card");
  return card.args as [number, number, number, number];
}

describe("SettingsPanel creation and display", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("creates a semi-transparent black backdrop covering the scene", () => {
    const scene = createScene();

    new SettingsPanel(scene as never);

    expect(scene.add.rectangle).toHaveBeenCalledWith(512, 384, 1024, 768, 0x000000, 0.6);
  });

  it("creates a centered cream panel with a dark outline", () => {
    const scene = createScene();

    new SettingsPanel(scene as never);

    expect(scene.add.rectangle).toHaveBeenCalledWith(
      512,
      384,
      expect.any(Number),
      expect.any(Number),
      0xfff8e7,
    );
    const panel = scene.add.rectangle.mock.results[1]?.value as MockGameObject;
    expect(panel.setStrokeStyle).toHaveBeenCalledWith(4, 0x2d3748);
  });

  it("displays a Settings title", () => {
    const scene = createScene();

    new SettingsPanel(scene as never);

    expect(scene.add.text).toHaveBeenCalledWith(
      512,
      expect.any(Number),
      "Settings",
      expect.objectContaining({ color: "#2d3748" }),
    );
  });

  it.each([
    [{ bgmEnabled: true, sfxEnabled: true }, "BGM: ON", "SFX: ON", "#68d391"],
    [{ bgmEnabled: false, sfxEnabled: false }, "BGM: OFF", "SFX: OFF", "#a0aec0"],
  ])("reflects stored toggle state %o", (settings, bgmLabel, sfxLabel, color) => {
    localStorage.setItem("abby-little-lab:v1", JSON.stringify({ stickers: {}, settings }));
    const scene = createScene();

    new SettingsPanel(scene as never);

    expect(scene.add.text).toHaveBeenCalledWith(
      expect.any(Number),
      expect.any(Number),
      bgmLabel,
      expect.objectContaining({ color }),
    );
    expect(scene.add.text).toHaveBeenCalledWith(
      expect.any(Number),
      expect.any(Number),
      sfxLabel,
      expect.objectContaining({ color }),
    );
  });

  it("gives every toggle label the row pitch band", () => {
    const scene = createScene();

    new SettingsPanel(scene as never);

    const toggleObjects = scene.add.text.mock.results
      .map((result) => result.value as MockGameObject)
      .filter(
        (_object, index) =>
          scene.add.text.mock.calls[index]?.[2] === "BGM: ON" ||
          scene.add.text.mock.calls[index]?.[2] === "BGM: OFF" ||
          scene.add.text.mock.calls[index]?.[2] === "SFX: ON" ||
          scene.add.text.mock.calls[index]?.[2] === "SFX: OFF" ||
          scene.add.text.mock.calls[index]?.[2] === "Adaptive: ON" ||
          scene.add.text.mock.calls[index]?.[2] === "Adaptive: OFF",
      );
    expect(toggleObjects).toHaveLength(3);
    for (const toggle of toggleObjects) {
      expect(toggle.setInteractive).toHaveBeenCalledWith(
        expect.objectContaining({
          hitArea: expect.objectContaining({
            height: expect.any(Number),
            width: expect.any(Number),
          }),
        }),
      );
      const config = toggle.setInteractive.mock.calls[0]?.[0] as {
        hitArea: { height: number; width: number };
      };
      // The row's pitch is its band: eight rows in a 760px panel cannot each be
      // 64px tall without overlapping a neighbour (the documented exception).
      expect(config.hitArea.width).toBe(ROW_HIT_WIDTH);
      expect(config.hitArea.height).toBe(ROW_PITCH);
    }
  });

  it("renders an Adaptive toggle defaulting to ON", () => {
    const scene = createScene();

    new SettingsPanel(scene as never);

    expect(scene.add.text).toHaveBeenCalledWith(
      expect.any(Number),
      expect.any(Number),
      "Adaptive: ON",
      expect.objectContaining({ color: "#68d391" }),
    );
  });
});

describe("SettingsPanel row geometry", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  /** The eight main-panel rows, top to bottom, with the install row visible. */
  const ROW_LABELS = [
    "BGM: ON",
    "SFX: ON",
    "Adaptive: ON",
    "Profiles",
    "Progress",
    "Reset Progress",
    "Install App",
    "Voice: Default (device)",
  ];

  it("gives every row one band, so neighbours abut and never overlap", () => {
    const scene = createScene();
    new SettingsPanel(scene as never, createFakeInstallTracker("installable"));

    const rects = ROW_LABELS.map((label) => hitRectFor(scene, label));

    for (let index = 1; index < rects.length; index += 1) {
      const gap = rects[index].top - rects[index - 1].bottom;
      expect(gap).toBeGreaterThanOrEqual(0); // no overlap: the lower row cannot steal the tap
      expect(gap).toBeLessThanOrEqual(1); // and no dead seam between them either
    }

    // One band height for the whole stack: the pitch is the band.
    const heights = rects.map((rect) => rect.bottom - rect.top);
    expect(new Set(heights).size).toBe(1);
  });

  it("spans each toggle's card and reaches its switch", () => {
    const scene = createScene();
    new SettingsPanel(scene as never);

    const cards = getRectangles(scene).filter(({ args }) => args?.[2] === 400 && args?.[3] === 68);
    const tracks = getRectangles(scene).filter(({ args }) => args?.[2] === 64 && args?.[3] === 32);
    const toggleLabels = ["BGM: ON", "SFX: ON", "Adaptive: ON"];
    expect(cards.slice(0, 3)).toHaveLength(3);
    expect(tracks.slice(0, 3)).toHaveLength(3);

    toggleLabels.forEach((label, index) => {
      const rect = hitRectFor(scene, label);
      const [cardX, , cardWidth] = (cards[index]?.args ?? []) as [number, number, number];

      // The band is the card: its empty space and the label hit the same row.
      expect(rect.left).toBeLessThanOrEqual(cardX - cardWidth / 2);
      expect(rect.right).toBeGreaterThanOrEqual(cardX + cardWidth / 2);

      // The switch graphic is inside it, so the thing that looks like a button
      // is the thing that is tappable.
      const [trackX, trackY] = (tracks[index]?.args ?? []) as [number, number];
      expect(trackX).toBeGreaterThanOrEqual(rect.left);
      expect(trackX).toBeLessThanOrEqual(rect.right);
      expect(trackY).toBeGreaterThanOrEqual(rect.top);
      expect(trackY).toBeLessThanOrEqual(rect.bottom);
    });
  });

  it("keeps the close button above the rows that share its corner", () => {
    const scene = createScene();
    new SettingsPanel(scene as never, createFakeInstallTracker("installable"));

    const close = findTextByLabel(scene, "✕") as MockGameObject;
    const closeRect = hitRectFor(scene, "✕");
    // The BGM band reaches into the ✕'s 96x96 box, bottom right corner and all,
    // so the shared corner is decided by input order rather than by geometry.
    const bgmRect = hitRectFor(scene, "BGM: ON");
    expect(bgmRect.left).toBeLessThan(closeRect.right);
    expect(bgmRect.right).toBeGreaterThan(closeRect.left);
    expect(bgmRect.top).toBeLessThan(closeRect.bottom);
    expect(bgmRect.bottom).toBeGreaterThan(closeRect.top);

    // Raised above the rows after the last of them exists, so no row can cover
    // it; the overlays open later and still land on top of it.
    expect(scene.children.bringToTop).toHaveBeenCalledWith(close);
    const voiceIndex = scene.add.text.mock.calls.findIndex((call) =>
      String(call[2]).startsWith("Voice:"),
    );
    expect(voiceIndex).toBeGreaterThanOrEqual(0);
    expect(scene.children.bringToTop.mock.invocationCallOrder[0]).toBeGreaterThan(
      scene.add.text.mock.invocationCallOrder[voiceIndex],
    );
  });

  it("keeps the close button above page two's rows after a flip", () => {
    const scene = createScene();
    const panel = new SettingsPanel(scene as never, createFakeInstallTracker("installable"));
    const close = findTextByLabel(scene, "✕") as MockGameObject;

    // Page two's export row shares the same corner as page one's BGM band, and
    // it is built after the ✕, so the invariant has to be restored by every
    // rebuild rather than only by the constructor's one call.
    const card = findTextStartingWith(scene, "Backup & restore") as MockGameObject;
    triggerPointerdown(card);
    expect(panel.backupState().page).toBe(1);

    expect(scene.children.bringToTop).toHaveBeenCalledTimes(2);
    expect(scene.children.bringToTop).toHaveBeenLastCalledWith(close);
    const exportIndex = scene.add.text.mock.calls.findIndex((call) => call[2] === "Save a backup");
    expect(exportIndex).toBeGreaterThanOrEqual(0);
    expect(scene.children.bringToTop.mock.invocationCallOrder[1]).toBeGreaterThan(
      scene.add.text.mock.invocationCallOrder[exportIndex],
    );
  });
});

describe("SettingsPanel engine hit test", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  /**
   * The engine adds `displayOrigin` before testing a custom area, so on an
   * origin-0.5 label the origin is half the rendered text - a value that changes
   * with every label. `centredHitArea` subtracts it back out, which is what makes
   * these bands independent of the text; this case proves that through the
   * engine's own arithmetic rather than through the test's rectangle model.
   */
  it("puts a band in the same place whatever the label's display origin is", () => {
    const scene = createScene();
    new SettingsPanel(scene as never);
    const config = configOf(findTextByLabel(scene, "BGM: ON") as MockGameObject);
    const [x, y] = scene.add.text.mock.calls[0] as unknown as [number, number];
    const left = x + config.hitArea.x;
    const right = left + config.hitArea.width;

    // The switch sits at +170 and the band ends at +200, so probe the switch and
    // both edges. A callback that forgot to subtract the display origin answers
    // false just inside the right edge as soon as the origin is non-zero.
    for (const displayOriginX of [0, 65, 137]) {
      expect(engineHits(config, x, y, displayOriginX, 0, x + 169, y)).toBe(true);
      expect(engineHits(config, x, y, displayOriginX, 0, left + 1, y)).toBe(true);
      expect(engineHits(config, x, y, displayOriginX, 0, right - 1, y)).toBe(true);
      expect(engineHits(config, x, y, displayOriginX, 0, left - 1, y)).toBe(false);
      expect(engineHits(config, x, y, displayOriginX, 0, right + 1, y)).toBe(false);
    }
  });

  it("gives every row the same vertical band, whatever its font size is", () => {
    const scene = createScene();
    new SettingsPanel(scene as never);
    // Three label sizes (34 px toggles, 32 px plain rows, 26 px voice) and two
    // text objects in the voice row: nothing here may depend on type metrics.
    const labels = ["BGM: ON", "Profiles", "Voice: Default (device)", "Preview"];
    const rows = labels.map((label) => {
      const index = scene.add.text.mock.calls.findIndex((call) => call[2] === label);
      expect(index).toBeGreaterThanOrEqual(0);
      const [x, y] = scene.add.text.mock.calls[index] as unknown as [number, number];
      const object = scene.add.text.mock.results[index]?.value as MockGameObject;
      const config = configOf(object);
      const left = x + config.hitArea.x;
      return {
        config,
        insideX: left + Math.min(40, config.hitArea.width - 1),
        label,
        x,
        y,
      };
    });

    for (const row of rows) {
      // Half a 34 px line box, the worst case, and a third of it as the floor:
      // one pixel inside each edge is in, one pixel outside each edge is out.
      for (const originY of [0, 11, 17]) {
        for (const insideY of [row.y - ROW_PITCH / 2 + 1, row.y + ROW_PITCH / 2 - 1]) {
          expect(engineHits(row.config, row.x, row.y, 0, originY, row.insideX, insideY)).toBe(true);
        }
        for (const outsideY of [row.y - ROW_PITCH / 2 - 1, row.y + ROW_PITCH / 2 + 1]) {
          expect(engineHits(row.config, row.x, row.y, 0, originY, row.insideX, outsideY)).toBe(
            false,
          );
        }
      }
    }
  });
});

describe("SettingsPanel interaction", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("disables BGM, pauses it, and updates its label", () => {
    const scene = createScene();
    new SettingsPanel(scene as never);
    const bgmToggle = findTextByLabel(scene, "BGM: ON") as MockGameObject;

    triggerPointerdown(bgmToggle);

    expect(mockAudio.setBGMEnabled).toHaveBeenCalledWith(false);
    expect(mockAudio.pauseBGM).toHaveBeenCalled();
    expect(bgmToggle.setText).toHaveBeenCalledWith("BGM: OFF");
    expect(bgmToggle.setColor).toHaveBeenCalledWith("#a0aec0");
  });

  it("enables BGM, starts it, and updates its label", () => {
    localStorage.setItem(
      "abby-little-lab:v1",
      JSON.stringify({ stickers: {}, settings: { bgmEnabled: false, sfxEnabled: true } }),
    );
    const scene = createScene();
    new SettingsPanel(scene as never);
    const bgmToggle = findTextByLabel(scene, "BGM: OFF") as MockGameObject;

    triggerPointerdown(bgmToggle);

    expect(mockAudio.setBGMEnabled).toHaveBeenCalledWith(true);
    expect(mockAudio.playBGM).toHaveBeenCalled();
    expect(bgmToggle.setText).toHaveBeenCalledWith("BGM: ON");
    expect(bgmToggle.setColor).toHaveBeenCalledWith("#68d391");
  });

  it("disables SFX without playing a chime and updates its label", () => {
    const scene = createScene();
    new SettingsPanel(scene as never);
    const sfxToggle = findTextByLabel(scene, "SFX: ON") as MockGameObject;

    triggerPointerdown(sfxToggle);

    expect(mockAudio.setSFXEnabled).toHaveBeenCalledWith(false);
    expect(mockAudio.playCorrect).not.toHaveBeenCalled();
    expect(sfxToggle.setText).toHaveBeenCalledWith("SFX: OFF");
    expect(sfxToggle.setColor).toHaveBeenCalledWith("#a0aec0");
  });

  it("enables SFX, plays a chime, and updates its label", () => {
    localStorage.setItem(
      "abby-little-lab:v1",
      JSON.stringify({ stickers: {}, settings: { bgmEnabled: true, sfxEnabled: false } }),
    );
    const scene = createScene();
    new SettingsPanel(scene as never);
    const sfxToggle = findTextByLabel(scene, "SFX: OFF") as MockGameObject;

    triggerPointerdown(sfxToggle);

    expect(mockAudio.setSFXEnabled).toHaveBeenCalledWith(true);
    expect(mockAudio.playCorrect).toHaveBeenCalled();
    expect(sfxToggle.setText).toHaveBeenCalledWith("SFX: ON");
    expect(sfxToggle.setColor).toHaveBeenCalledWith("#68d391");
  });

  it("disables Adaptive, persists it, and updates its label", () => {
    const scene = createScene();
    new SettingsPanel(scene as never);
    const toggle = findTextByLabel(scene, "Adaptive: ON") as MockGameObject;

    triggerPointerdown(toggle);

    expect(toggle.setText).toHaveBeenCalledWith("Adaptive: OFF");
    expect(toggle.setColor).toHaveBeenCalledWith("#a0aec0");
    expect(getSettings().adaptiveDifficulty).toBe(false);
    expect(getSettings().bgmEnabled).toBe(true);
    expect(getSettings().sfxEnabled).toBe(true);
    expect(mockAudio.setBGMEnabled).not.toHaveBeenCalled();
    expect(mockAudio.setSFXEnabled).not.toHaveBeenCalled();
  });

  it("enables Adaptive from a stored OFF save and persists it", () => {
    localStorage.setItem(
      "abby-little-lab:v1",
      JSON.stringify({
        stickers: {},
        settings: { bgmEnabled: true, sfxEnabled: true, adaptiveDifficulty: false },
      }),
    );
    const scene = createScene();
    new SettingsPanel(scene as never);
    const toggle = findTextByLabel(scene, "Adaptive: OFF") as MockGameObject;

    triggerPointerdown(toggle);

    expect(toggle.setText).toHaveBeenCalledWith("Adaptive: ON");
    expect(toggle.setColor).toHaveBeenCalledWith("#68d391");
    expect(getSettings().adaptiveDifficulty).toBe(true);
  });

  it("toggles once when the switch region is tapped", () => {
    const scene = createScene();
    new SettingsPanel(scene as never);
    const toggle = findTextByLabel(scene, "BGM: ON") as MockGameObject;
    const rect = hitRectFor(scene, "BGM: ON");
    // The switch graphic - the part that looks like a button - is inside the
    // row's band now, so it activates the row rather than falling through.
    const knob = getRectangles(scene).find(({ args }) => args?.[2] === 24 && args?.[3] === 24);
    const [knobX, knobY] = (knob?.args ?? []) as [number, number];
    expect(knobX).toBeGreaterThanOrEqual(rect.left);
    expect(knobX).toBeLessThanOrEqual(rect.right);
    expect(knobY).toBeGreaterThanOrEqual(rect.top);
    expect(knobY).toBeLessThanOrEqual(rect.bottom);

    triggerPointerdown(toggle);

    // Exactly one handler run: one state flip, one label rewrite, no SFX.
    expect(mockAudio.setBGMEnabled).toHaveBeenCalledTimes(1);
    expect(mockAudio.setBGMEnabled).toHaveBeenCalledWith(false);
    expect(mockAudio.setSFXEnabled).not.toHaveBeenCalled();
    expect(toggle.setText).toHaveBeenCalledTimes(1);
    expect(toggle.setText).toHaveBeenCalledWith("BGM: OFF");
  });

  it("destroys every panel object when the backdrop is tapped", () => {
    const scene = createScene();
    new SettingsPanel(scene as never);
    const objects = [
      ...scene.add.rectangle.mock.results.map((result) => result.value as MockGameObject),
      ...scene.add.text.mock.results.map((result) => result.value as MockGameObject),
    ];

    triggerPointerdown(objects[0]);

    for (const object of objects) expect(object.destroy).toHaveBeenCalled();
  });

  it("destroys every panel object when destroy is called", () => {
    const scene = createScene();
    const panel = new SettingsPanel(scene as never);
    const objects = [
      ...scene.add.rectangle.mock.results.map((result) => result.value as MockGameObject),
      ...scene.add.text.mock.results.map((result) => result.value as MockGameObject),
    ];

    panel.destroy();

    for (const object of objects) expect(object.destroy).toHaveBeenCalled();
  });
});

describe("SettingsPanel browser-suite probes", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("reports itself open until destroy runs", () => {
    const scene = createScene();
    const panel = new SettingsPanel(scene as never);

    expect(panel.e2eOpen()).toBe(true);

    // Closing the panel destroys it without telling whoever holds it, which is
    // why the flag lives on the panel rather than on the Hub.
    panel.destroy();

    expect(panel.e2eOpen()).toBe(false);
  });

  it("publishes each toggle with a point its own row band answers to", () => {
    const scene = createScene();
    const panel = new SettingsPanel(scene as never);

    const toggles = panel.e2eToggles();
    expect(toggles.map((toggle) => toggle.id)).toEqual(["bgm", "sfx", "adaptive"]);
    expect(toggles.map((toggle) => toggle.on)).toEqual([true, true, true]);

    const labels = ["BGM: ON", "SFX: ON", "Adaptive: ON"];
    toggles.forEach((toggle, index) => {
      const band = hitRectFor(scene, labels[index]);
      expect(toggle.x).toBeGreaterThanOrEqual(band.left);
      expect(toggle.x).toBeLessThanOrEqual(band.right);
      expect(toggle.y).toBeGreaterThanOrEqual(band.top);
      expect(toggle.y).toBeLessThanOrEqual(band.bottom);
    });
  });

  it("reports a toggle's state after its row is tapped", () => {
    const scene = createScene();
    const panel = new SettingsPanel(scene as never);

    triggerPointerdown(findTextByLabel(scene, "Adaptive: ON") as MockGameObject);

    const adaptive = panel.e2eToggles().find((toggle) => toggle.id === "adaptive");
    expect(adaptive?.on).toBe(false);
  });
});

describe("SettingsPanel install control", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows an Install App button when the tracker is installable", () => {
    const scene = createScene();
    const tracker = createFakeInstallTracker("installable");

    new SettingsPanel(scene as never, tracker);

    expect(scene.add.text).toHaveBeenCalledWith(
      expect.any(Number),
      expect.any(Number),
      "Install App",
      expect.objectContaining({ color: "#2b6cb0" }),
    );
  });

  it("calls tracker.prompt() when Install App is tapped", async () => {
    const scene = createScene();
    const tracker = createFakeInstallTracker("installable");
    new SettingsPanel(scene as never, tracker);

    const installButton = findTextByLabel(scene, "Install App");
    expect(installButton).toBeDefined();
    triggerPointerdown(installButton as MockGameObject);

    expect(tracker.prompt).toHaveBeenCalledTimes(1);

    // The row is a snapshot read once per open, so spending the prompt does not
    // rewrite the row already on screen - the next open is what drops it.
    expect(tracker.getState).toHaveBeenCalledTimes(1);
    expect(findTextByLabel(scene, "Install App")).toBeDefined();
  });

  it("gives the install button the row pitch band", () => {
    const scene = createScene();
    const tracker = createFakeInstallTracker("installable");
    new SettingsPanel(scene as never, tracker);

    const installButton = findTextByLabel(scene, "Install App") as MockGameObject;
    const config = installButton.setInteractive.mock.calls[0]?.[0] as {
      hitArea: { height: number; width: number };
    };
    expect(config.hitArea.width).toBe(ROW_HIT_WIDTH);
    expect(config.hitArea.height).toBe(ROW_PITCH);
  });

  it("shows a How to Install button on iOS and opens the instructions overlay on tap", () => {
    const scene = createScene();
    const tracker = createFakeInstallTracker("ios-howto");
    new SettingsPanel(scene as never, tracker);

    const howToButton = findTextByLabel(scene, "How to Install");
    expect(howToButton).toBeDefined();
    triggerPointerdown(howToButton as MockGameObject);

    expect(scene.add.text).toHaveBeenCalledWith(
      expect.any(Number),
      expect.any(Number),
      expect.stringContaining("Add to Home Screen"),
      expect.anything(),
    );
  });

  it("shows no install control when the tracker reports hidden", () => {
    const scene = createScene();
    const tracker = createFakeInstallTracker("hidden");

    new SettingsPanel(scene as never, tracker);

    const texts = scene.add.text.mock.calls.map((call) => call[2] as string);
    expect(texts).not.toContain("Install App");
    expect(texts).not.toContain("How to Install");
  });

  it("shows no install row once the captured prompt has been spent", async () => {
    const { deps, listeners, promptEvent } = createTrackerDeps();
    const tracker = createInstallTracker(deps);
    emitBeforeInstallPrompt(listeners, promptEvent);
    // The parent tapped Install App and dismissed the browser dialog.
    await expect(tracker.prompt()).resolves.toBe(true);

    const scene = createScene();
    new SettingsPanel(scene as never, tracker);

    expect(findTextByLabel(scene, "Install App")).toBeUndefined();
  });

  it("shows Install App for a prompt captured before the panel was constructed", () => {
    const { deps, listeners, promptEvent } = createTrackerDeps();
    const tracker = createInstallTracker(deps);
    // The browser fires this once per page load, long before Settings opens.
    emitBeforeInstallPrompt(listeners, promptEvent);

    const scene = createScene();
    new SettingsPanel(scene as never, tracker);

    expect(findTextByLabel(scene, "Install App")).toBeDefined();
  });

  it("keeps capturing after the panel closes and offers the later prompt next time", () => {
    const { deps, listeners, promptEvent } = createTrackerDeps();
    const tracker = createInstallTracker(deps);

    const firstScene = createScene();
    new SettingsPanel(firstScene as never, tracker).destroy();
    // Fires while no panel exists at all.
    emitBeforeInstallPrompt(listeners, promptEvent);

    const secondScene = createScene();
    new SettingsPanel(secondScene as never, tracker);

    expect(findTextByLabel(secondScene, "Install App")).toBeDefined();
    expect(deps.removeEventListener).not.toHaveBeenCalled();
  });

  it("shows Install App for a prompt captured at boot, with no tracker injected", async () => {
    const listeners: InstallListenerMap = new Map();
    const promptEvent = { preventDefault: vi.fn(), prompt: vi.fn(() => Promise.resolve()) };
    vi.stubGlobal("window", {
      addEventListener: (type: string, listener: (event: unknown) => void) => {
        listeners.set(type, listener);
      },
      removeEventListener: vi.fn(),
      matchMedia: () => ({ matches: false }),
    });
    vi.stubGlobal("navigator", { userAgent: "Android Chrome" });

    vi.resetModules();
    const pwa = await import("../../utils/pwaInstall");
    const { SettingsPanel: PanelAfterBoot } = await import("../../components/SettingsPanel");

    // What main.ts does before Phaser boots, then the event the page receives.
    pwa.initInstallPrompt();
    emitBeforeInstallPrompt(listeners, promptEvent);

    const scene = createScene();
    new PanelAfterBoot(scene as never);

    expect(findTextByLabel(scene, "Install App")).toBeDefined();
  });
});

describe("SettingsPanel version footer", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("renders the app version in a muted footer row", () => {
    const scene = createScene();

    new SettingsPanel(scene as never);

    expect(scene.add.text).toHaveBeenCalledWith(
      expect.any(Number),
      expect.any(Number),
      `v${__APP_VERSION__}`,
      expect.objectContaining({ color: "#a0aec0" }),
    );
  });

  it("centers the version footer under the title, clear of the install row", () => {
    const scene = createScene();
    new SettingsPanel(scene as never);

    const call = scene.add.text.mock.calls.find((item) => item[2] === `v${__APP_VERSION__}`);
    expect(call).toBeDefined();
    const [x, y] = call as unknown as [number, number];
    expect(x).toBe(512);
    // Between the title (-105) and the BGM toggle (-45), inside the panel.
    expect(y).toBeGreaterThan(384 - 105);
    expect(y).toBeLessThan(384 - 45);
  });

  it("keeps the version footer non-interactive", () => {
    const scene = createScene();
    new SettingsPanel(scene as never);

    const callIndex = scene.add.text.mock.calls.findIndex(
      (item) => item[2] === `v${__APP_VERSION__}`,
    );
    const footer = scene.add.text.mock.results[callIndex]?.value as MockGameObject;
    expect(footer.setInteractive).not.toHaveBeenCalled();
  });
});

describe("SettingsPanel reset progress", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("renders a Reset Progress row in the danger color", () => {
    const scene = createScene();

    new SettingsPanel(scene as never);

    expect(scene.add.text).toHaveBeenCalledWith(
      512,
      expect.any(Number),
      "Reset Progress",
      expect.objectContaining({ color: "#fc8181" }),
    );
  });

  it("opens the confirm modal when the reset row is tapped", () => {
    const scene = createScene();
    new SettingsPanel(scene as never);

    triggerPointerdown(findTextByLabel(scene, "Reset Progress") as MockGameObject);

    expect(findTextByLabel(scene, "Reset all stickers?")).toBeDefined();
    expect(findTextByLabel(scene, "Cancel")).toBeDefined();
    expect(findTextByLabel(scene, "Reset")).toBeDefined();
  });

  it("keeps stickers when the modal is cancelled", () => {
    earnSticker("shape-sorter");
    const scene = createScene();
    new SettingsPanel(scene as never);
    const row = findTextByLabel(scene, "Reset Progress") as MockGameObject;

    triggerPointerdown(row);
    triggerPointerdown(findTextByLabel(scene, "Cancel") as MockGameObject);

    expect(hasSticker("shape-sorter")).toBe(true);
    const modalTitle = findTextByLabel(scene, "Reset all stickers?") as MockGameObject;
    expect(modalTitle.destroy).toHaveBeenCalled();
    expect(row.setText).not.toHaveBeenCalledWith("Progress cleared");
  });

  it("clears every sticker and shows confirmation when Reset is tapped", () => {
    earnSticker("shape-sorter");
    earnSticker("pattern-builder");
    const scene = createScene();
    new SettingsPanel(scene as never);
    const row = findTextByLabel(scene, "Reset Progress") as MockGameObject;

    triggerPointerdown(row);
    triggerPointerdown(findTextByLabel(scene, "Reset") as MockGameObject);

    expect(hasSticker("shape-sorter")).toBe(false);
    expect(hasSticker("pattern-builder")).toBe(false);
    expect(
      (findTextByLabel(scene, "Reset all stickers?") as MockGameObject).destroy,
    ).toHaveBeenCalled();
    expect(row.setText).toHaveBeenCalledWith("Progress cleared");
    expect(row.setColor).toHaveBeenCalledWith("#a0aec0");
  });

  it("preserves audio settings after a reset", () => {
    updateSettings({ bgmEnabled: false });
    const scene = createScene();
    new SettingsPanel(scene as never);

    triggerPointerdown(findTextByLabel(scene, "Reset Progress") as MockGameObject);
    triggerPointerdown(findTextByLabel(scene, "Reset") as MockGameObject);

    expect(getSettings().bgmEnabled).toBe(false);
    expect(getSettings().sfxEnabled).toBe(true);
  });

  it("gives the reset row the row pitch band and modal buttons at least 64px", () => {
    const scene = createScene();
    new SettingsPanel(scene as never);

    const row = findTextByLabel(scene, "Reset Progress") as MockGameObject;
    const rowConfig = row.setInteractive.mock.calls[0]?.[0] as {
      hitArea: { height: number; width: number };
    };
    // Row exception: the panel's pitch caps the band at ROW_PITCH; the modal
    // buttons are laid out by the modal and keep the full 64px minimum.
    expect(rowConfig.hitArea.width).toBe(ROW_HIT_WIDTH);
    expect(rowConfig.hitArea.height).toBe(ROW_PITCH);

    triggerPointerdown(row);
    for (const label of ["Cancel", "Reset"]) {
      const button = findTextByLabel(scene, label) as MockGameObject;
      const config = button.setInteractive.mock.calls[0]?.[0] as {
        hitArea: { height: number; width: number };
      };
      expect(config.hitArea.width).toBeGreaterThanOrEqual(64);
      expect(config.hitArea.height).toBeGreaterThanOrEqual(64);
    }
  });

  it("invokes the onProgressReset callback after a reset", () => {
    const scene = createScene();
    const onProgressReset = vi.fn();
    new SettingsPanel(scene as never, undefined, onProgressReset);

    triggerPointerdown(findTextByLabel(scene, "Reset Progress") as MockGameObject);
    triggerPointerdown(findTextByLabel(scene, "Reset") as MockGameObject);

    expect(onProgressReset).toHaveBeenCalledTimes(1);
  });
});

describe("SettingsPanel profile management", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("renders a Profiles row that opens the profile manager overlay", () => {
    const scene = createScene();

    new SettingsPanel(scene as never);

    const row = findTextByLabel(scene, "Profiles");
    expect(row).toBeDefined();
    triggerPointerdown(row as MockGameObject);

    expect(findTextByLabel(scene, "Close")).toBeDefined();
    expect(scene.add.image).toHaveBeenCalledWith(
      expect.any(Number),
      expect.any(Number),
      "animal_cat",
    );
  });

  it("adds a profile from an unused avatar, making it active", () => {
    const scene = createScene();
    new SettingsPanel(scene as never);

    triggerPointerdown(findTextByLabel(scene, "Profiles") as MockGameObject);
    const dogAvatar = findImagesByTexture(scene, "animal_dog")[0] as MockGameObject;
    triggerPointerdown(dogAvatar);

    expect(getProfiles()).toHaveLength(2);
    expect(getActiveProfile().id).toBe("p2");
    // Overlay rebuilt: dog now renders as the new profile row (one more image
    // than the original add-row offering).
    expect(findImagesByTexture(scene, "animal_dog")).toHaveLength(2);
  });

  it("does not offer avatars already in use", () => {
    addProfile("dog");
    const scene = createScene();
    new SettingsPanel(scene as never);

    triggerPointerdown(findTextByLabel(scene, "Profiles") as MockGameObject);

    expect(findImagesByTexture(scene, "animal_dog")).toHaveLength(1);
    expect(findImagesByTexture(scene, "animal_pig")).toHaveLength(1);
  });

  it("shows the limit message when four profiles exist", () => {
    addProfile("dog");
    addProfile("pig");
    addProfile("frog");
    const scene = createScene();
    new SettingsPanel(scene as never);

    triggerPointerdown(findTextByLabel(scene, "Profiles") as MockGameObject);

    expect(findTextByLabel(scene, "Profile limit reached")).toBeDefined();
    expect(findTextByLabel(scene, "Add Profile")).toBeUndefined();
  });

  it("requires two-step confirmation before deleting a profile", () => {
    addProfile("dog");
    const scene = createScene();
    new SettingsPanel(scene as never);

    triggerPointerdown(findTextByLabel(scene, "Profiles") as MockGameObject);
    triggerPointerdown(findTextByLabel(scene, "Delete") as MockGameObject);

    expect(findTextByLabel(scene, "Delete profile?")).toBeDefined();
    triggerPointerdown(findTextByLabel(scene, "Cancel") as MockGameObject);

    expect(getProfiles()).toHaveLength(2);
    expect(
      (findTextByLabel(scene, "Delete profile?") as MockGameObject).destroy,
    ).toHaveBeenCalled();
  });

  it("removes the profile when the modal Delete is confirmed", () => {
    addProfile("dog");
    const scene = createScene();
    new SettingsPanel(scene as never);

    triggerPointerdown(findTextByLabel(scene, "Profiles") as MockGameObject);
    triggerPointerdown(findTextByLabel(scene, "Delete") as MockGameObject);
    triggerPointerdown(findLastTextByLabel(scene, "Delete") as MockGameObject);

    expect(getProfiles()).toHaveLength(1);
    expect(getActiveProfile().id).toBe("p2");
    // Overlay rebuilt after the deletion.
    expect(findTextByLabel(scene, "Delete")).toBeDefined();
  });

  it("recreates the default profile when the last one is deleted", () => {
    const scene = createScene();
    new SettingsPanel(scene as never);

    triggerPointerdown(findTextByLabel(scene, "Profiles") as MockGameObject);
    triggerPointerdown(findTextByLabel(scene, "Delete") as MockGameObject);
    triggerPointerdown(findLastTextByLabel(scene, "Delete") as MockGameObject);

    expect(getProfiles()).toHaveLength(1);
    expect(getActiveProfile().avatarId).toBe("cat");
  });

  it("notifies the parent scene after adding and after deleting", () => {
    const onProgressReset = vi.fn();
    const scene = createScene();
    new SettingsPanel(scene as never, undefined, onProgressReset);

    triggerPointerdown(findTextByLabel(scene, "Profiles") as MockGameObject);
    triggerPointerdown(findImagesByTexture(scene, "animal_dog")[0] as MockGameObject);
    expect(onProgressReset).toHaveBeenCalledTimes(1);

    triggerPointerdown(findTextByLabel(scene, "Delete") as MockGameObject);
    triggerPointerdown(findLastTextByLabel(scene, "Delete") as MockGameObject);
    expect(onProgressReset).toHaveBeenCalledTimes(2);
  });

  it("gives the profile row the row pitch band and modal controls at least 64px", () => {
    const scene = createScene();
    new SettingsPanel(scene as never);

    const rowConfig = (findTextByLabel(scene, "Profiles") as MockGameObject).setInteractive.mock
      .calls[0]?.[0] as { hitArea: { height: number; width: number } };
    // Row exception: the panel's pitch caps the band at ROW_PITCH; the modal
    // Delete button is laid out by the modal and keeps the 64px minimum.
    expect(rowConfig.hitArea.width).toBe(ROW_HIT_WIDTH);
    expect(rowConfig.hitArea.height).toBe(ROW_PITCH);

    triggerPointerdown(findTextByLabel(scene, "Profiles") as MockGameObject);
    const deleteConfig = (findTextByLabel(scene, "Delete") as MockGameObject).setInteractive.mock
      .calls[0]?.[0] as { hitArea: { height: number; width: number } };
    expect(deleteConfig.hitArea.width).toBeGreaterThanOrEqual(64);
    expect(deleteConfig.hitArea.height).toBeGreaterThanOrEqual(64);

    // Add-Profile avatars use the frame-based default hit area: custom rects
    // are tested in texture-local space (+displayOrigin) and land off the
    // visible icon on 512px textures.
    const addAvatar = findImagesByTexture(scene, "animal_dog")[0] as MockGameObject;
    const addConfig = addAvatar.setInteractive.mock.calls.find(
      (call) => call[0] && typeof call[0] === "object",
    );
    expect(addConfig).toBeUndefined();
  });

  it("installs the Delete band around the drawn word in the engine frame", () => {
    const scene = createScene();
    new SettingsPanel(scene as never);
    triggerPointerdown(findTextByLabel(scene, "Profiles") as MockGameObject);

    const remove = findTextByLabel(scene, "Delete") as MockGameObject;
    const config = configOf(remove);
    const [objectX, objectY] = textCallArgs(scene, remove);
    // The band keeps today's intended 240 x 64 size.
    expect(config.hitArea.width).toBe(240);
    expect(config.hitArea.height).toBe(64);

    // "Delete" at 30px: about 13px per glyph, 40px line box, in the suite's
    // convention (GLYPH_WIDTH/LINE_HEIGHT are the 26px anchors above).
    const wordHalf = ("Delete".length * GLYPH_WIDTH) / 2;
    const lineHalf = 20;
    for (const [displayOriginX, displayOriginY] of [
      [0, 0],
      [wordHalf, lineHalf],
      [137, 13],
    ] as const) {
      // Drawn word centre and drawn word edges live.
      expect(
        engineHits(config, objectX, objectY, displayOriginX, displayOriginY, objectX, objectY),
      ).toBe(true);
      expect(
        engineHits(
          config,
          objectX,
          objectY,
          displayOriginX,
          displayOriginY,
          objectX + wordHalf,
          objectY + lineHalf,
        ),
      ).toBe(true);
      expect(
        engineHits(
          config,
          objectX,
          objectY,
          displayOriginX,
          displayOriginY,
          objectX - wordHalf,
          objectY - lineHalf,
        ),
      ).toBe(true);
      // The full band is live (inclusive edges).
      expect(
        engineHits(
          config,
          objectX,
          objectY,
          displayOriginX,
          displayOriginY,
          objectX + 120,
          objectY + 32,
        ),
      ).toBe(true);
      expect(
        engineHits(
          config,
          objectX,
          objectY,
          displayOriginX,
          displayOriginY,
          objectX - 120,
          objectY - 32,
        ),
      ).toBe(true);
      // One pixel outside the band is dead.
      expect(
        engineHits(
          config,
          objectX,
          objectY,
          displayOriginX,
          displayOriginY,
          objectX + 121,
          objectY,
        ),
      ).toBe(false);
      expect(
        engineHits(
          config,
          objectX,
          objectY,
          displayOriginX,
          displayOriginY,
          objectX - 121,
          objectY,
        ),
      ).toBe(false);
      expect(
        engineHits(config, objectX, objectY, displayOriginX, displayOriginY, objectX, objectY + 33),
      ).toBe(false);
      expect(
        engineHits(config, objectX, objectY, displayOriginX, displayOriginY, objectX, objectY - 33),
      ).toBe(false);
    }
  });
});

describe("SettingsPanel play time", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  function openProfilesOverlay(scene: MockScene): void {
    triggerPointerdown(findTextByLabel(scene, "Profiles") as MockGameObject);
  }

  /** Every text object whose label starts with the play-time prefix. */
  function findPlayTimeChips(scene: MockScene): Array<{ label: string; object: MockGameObject }> {
    const chips: Array<{ label: string; object: MockGameObject }> = [];
    scene.add.text.mock.calls.forEach((call, index) => {
      const label = call[2] as string;
      if (label.startsWith("Play Time:")) {
        chips.push({
          label,
          object: scene.add.text.mock.results[index]?.value as MockGameObject,
        });
      }
    });
    return chips;
  }

  it("renders a Play Time chip per profile row, defaulting to Off", () => {
    const scene = createScene();
    new SettingsPanel(scene as never);
    openProfilesOverlay(scene);

    expect(findTextByLabel(scene, "Play Time: Off")).toBeDefined();
  });

  it("shows the stored limit on the chip", () => {
    setPlayTimeLimit("p1", 30);
    const scene = createScene();
    new SettingsPanel(scene as never);
    openProfilesOverlay(scene);

    expect(findTextByLabel(scene, "Play Time: 30m")).toBeDefined();
  });

  it("renders one chip per profile with that profile's own limit", () => {
    setPlayTimeLimit("p1", 45);
    addProfile("dog"); // p2 becomes active, unlimited.
    const scene = createScene();
    new SettingsPanel(scene as never);
    openProfilesOverlay(scene);

    const chips = findPlayTimeChips(scene);
    expect(chips).toHaveLength(2);
    expect(chips.map((chip) => chip.label).sort()).toEqual(["Play Time: 45m", "Play Time: Off"]);
  });

  it("cycles Off -> 15 -> 30 -> 45 -> 60 -> Off and persists each step", () => {
    const scene = createScene();
    new SettingsPanel(scene as never);
    openProfilesOverlay(scene);

    const chip = findTextByLabel(scene, "Play Time: Off") as MockGameObject;
    const expected = [
      "Play Time: 15m",
      "Play Time: 30m",
      "Play Time: 45m",
      "Play Time: 60m",
      "Play Time: Off",
    ];
    for (const label of expected) {
      triggerPointerdown(chip);
      expect(chip.setText).toHaveBeenCalledWith(label);
    }
    expect(getPlayTime("p1").limitMinutes).toBeNull();
  });

  it("persists the limit when a chip is tapped", () => {
    const scene = createScene();
    new SettingsPanel(scene as never);
    openProfilesOverlay(scene);

    triggerPointerdown(findTextByLabel(scene, "Play Time: Off") as MockGameObject);

    expect(getPlayTime("p1").limitMinutes).toBe(15);
  });

  it("notifies the hub when a chip changes the limit", () => {
    const onProgressReset = vi.fn();
    const scene = createScene();
    new SettingsPanel(scene as never, undefined, onProgressReset);
    openProfilesOverlay(scene);

    triggerPointerdown(findTextByLabel(scene, "Play Time: Off") as MockGameObject);

    expect(onProgressReset).toHaveBeenCalledTimes(1);
  });

  it("changes only the tapped profile's limit", () => {
    setPlayTimeLimit("p1", 30);
    addProfile("dog");
    const scene = createScene();
    new SettingsPanel(scene as never);
    openProfilesOverlay(scene);

    triggerPointerdown(findTextByLabel(scene, "Play Time: Off") as MockGameObject);

    expect(getPlayTime("p2").limitMinutes).toBe(15);
    expect(getPlayTime("p1").limitMinutes).toBe(30);
  });

  it("gives play-time chips inflated touch targets of at least 64px", () => {
    const scene = createScene();
    new SettingsPanel(scene as never);
    openProfilesOverlay(scene);

    const chip = findTextByLabel(scene, "Play Time: Off") as MockGameObject;
    const config = chip.setInteractive.mock.calls[0]?.[0] as {
      hitArea: { height: number; width: number };
    };
    expect(config.hitArea.width).toBeGreaterThanOrEqual(64);
    expect(config.hitArea.height).toBeGreaterThanOrEqual(64);
  });

  it("cycles the limit from the drawn chip label in the engine frame without closing the overlay", () => {
    setPlayTimeLimit("p1", 15);
    const scene = createScene();
    new SettingsPanel(scene as never);
    openProfilesOverlay(scene);

    const chip = findTextByLabel(scene, "Play Time: 15m") as MockGameObject;
    const config = configOf(chip);
    const [objectX, objectY] = textCallArgs(scene, chip);
    // The band keeps today's intended 120 x 64 size.
    expect(config.hitArea.width).toBe(120);
    expect(config.hitArea.height).toBe(64);

    // Rendered extent in the suite's measure convention (GLYPH_WIDTH per
    // character of a 26px label, LINE_HEIGHT line box). The 120px band
    // intentionally ends inside the drawn word — the spec keeps today's
    // floor — so the word's outermost x-edges stay outside the band; the
    // repro's right-third aim point is what must be live.
    const lineHalf = LINE_HEIGHT / 2;
    for (const [displayOriginX, displayOriginY] of [
      [0, 0],
      [45, 17],
      [137, 13],
    ] as const) {
      // Drawn centre, drawn line-box edges and the right-third aim live.
      expect(
        engineHits(config, objectX, objectY, displayOriginX, displayOriginY, objectX, objectY),
      ).toBe(true);
      expect(
        engineHits(
          config,
          objectX,
          objectY,
          displayOriginX,
          displayOriginY,
          objectX,
          objectY + lineHalf,
        ),
      ).toBe(true);
      expect(
        engineHits(
          config,
          objectX,
          objectY,
          displayOriginX,
          displayOriginY,
          objectX,
          objectY - lineHalf,
        ),
      ).toBe(true);
      expect(
        engineHits(config, objectX, objectY, displayOriginX, displayOriginY, objectX + 45, objectY),
      ).toBe(true);
      // The full band is live (inclusive edges).
      expect(
        engineHits(config, objectX, objectY, displayOriginX, displayOriginY, objectX + 60, objectY),
      ).toBe(true);
      expect(
        engineHits(config, objectX, objectY, displayOriginX, displayOriginY, objectX - 60, objectY),
      ).toBe(true);
      // One pixel outside the band is dead.
      expect(
        engineHits(config, objectX, objectY, displayOriginX, displayOriginY, objectX + 61, objectY),
      ).toBe(false);
      expect(
        engineHits(config, objectX, objectY, displayOriginX, displayOriginY, objectX - 61, objectY),
      ).toBe(false);
    }

    // The engine-resolved tap on the chip cycles its own limit and never
    // falls through to the backdrop that closes the overlay.
    const backdrop = getRectangles(scene)
      .filter((rect) => rect.args?.[2] === 1024 && rect.args?.[3] === 768)
      .at(-1) as RectWithArgs;
    const overlayPanel = getRectangles(scene)
      .filter((rect) => rect.args?.[2] === PANEL_WIDTH && rect.args?.[3] === PANEL_HEIGHT)
      .at(-1) as RectWithArgs;
    expect(backdrop.object).toBeDefined();
    expect(overlayPanel.object).toBeDefined();
    triggerPointerdown(chip);
    expect(chip.setText).toHaveBeenCalledWith("Play Time: 30m");
    expect(backdrop.object.destroy).not.toHaveBeenCalled();
    expect(overlayPanel.object.destroy).not.toHaveBeenCalled();
  });
});

describe("SettingsPanel TTS voice selection", () => {
  function makeVoice(voiceURI: string, name: string, lang: string): SpeechSynthesisVoice {
    return {
      voiceURI,
      name,
      lang,
      localService: false,
      default: false,
    };
  }

  function stubSynth(voices: SpeechSynthesisVoice[]): {
    synth: Record<string, unknown>;
    speak: ReturnType<typeof vi.fn>;
    listeners: Record<string, () => void>;
  } {
    const listeners: Record<string, () => void> = {};
    const speak = vi.fn();
    const synth = {
      speaking: false,
      pending: false,
      getVoices: vi.fn(() => voices),
      speak,
      cancel: vi.fn(),
      resume: vi.fn(),
      addEventListener: vi.fn((event: string, handler: () => void) => {
        listeners[event] = handler;
      }),
      removeEventListener: vi.fn((event: string) => {
        delete listeners[event];
      }),
    };
    vi.stubGlobal("speechSynthesis", synth);
    return { synth, speak, listeners };
  }

  class MockUtterance {
    text: string;
    lang = "en-US";
    rate = 1;
    voice: SpeechSynthesisVoice | null = null;

    constructor(text: string) {
      this.text = text;
    }
  }

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows the Default (device) chip when no voices are installed", () => {
    const scene = createScene();
    new SettingsPanel(scene as never);

    expect(findTextByLabel(scene, "Voice: Default (device)")).toBeDefined();
  });

  it("cycles to the next installed voice on tap and persists the preference", () => {
    stubSynth([makeVoice("urn:zoe", "Zoe", "en-US"), makeVoice("urn:fred", "Fred", "fr-FR")]);
    const scene = createScene();
    new SettingsPanel(scene as never);

    const chip = findTextByLabel(scene, "Voice: Default (device)") as MockGameObject;
    triggerPointerdown(chip);

    expect(chip.setText).toHaveBeenCalledWith("Voice: en-US — Zoe");
    expect(getSettings().preferredVoiceURI).toBe("urn:zoe");
  });

  it("wraps back to Default (device) after the last voice", () => {
    stubSynth([makeVoice("urn:zoe", "Zoe", "en-US"), makeVoice("urn:fred", "Fred", "fr-FR")]);
    updateSettings({ preferredVoiceURI: "urn:fred" });
    const scene = createScene();
    new SettingsPanel(scene as never);

    const chip = findTextByLabel(scene, "Voice: fr-FR — Fred") as MockGameObject;
    triggerPointerdown(chip);

    expect(chip.setText).toHaveBeenCalledWith("Voice: Default (device)");
    expect(getSettings().preferredVoiceURI).toBeNull();
  });

  it("truncates long voice labels in the chip", () => {
    stubSynth([makeVoice("urn:long", "A Really Long Voice Name That Spills Over", "en-US")]);
    updateSettings({ preferredVoiceURI: "urn:long" });
    const scene = createScene();
    new SettingsPanel(scene as never);

    const chip = findTextByLabel(scene, "Voice: en-US — A Really Long V…") as MockGameObject;
    triggerPointerdown(chip);

    expect(chip.setText).toHaveBeenCalledWith("Voice: Default (device)");
  });

  it("gives the voice chip and preview halves that abut inside the card", () => {
    stubSynth([makeVoice("urn:zoe", "Zoe", "en-US")]);
    const scene = createScene();
    new SettingsPanel(scene as never);

    const [cardX, cardY, cardWidth, cardHeight] = lastRowCard(scene);
    const chipRect = hitRectFor(scene, "Voice: Default (device)");
    const previewRect = hitRectFor(scene, "Preview");

    // The row carries two controls, so one band is split between them: the
    // halves meet exactly, each keeps the pitch height, and neither is a sliver
    // that a tap would miss.
    expect(chipRect.right).toBe(previewRect.left);
    for (const rect of [chipRect, previewRect]) {
      expect(rect.bottom - rect.top).toBe(ROW_PITCH);
      expect(rect.right - rect.left).toBeGreaterThanOrEqual(96);
      expect(rect.left).toBeGreaterThanOrEqual(cardX - cardWidth / 2);
      expect(rect.right).toBeLessThanOrEqual(cardX + cardWidth / 2);
      expect(rect.top).toBeGreaterThanOrEqual(cardY - cardHeight / 2);
      expect(rect.bottom).toBeLessThanOrEqual(cardY + cardHeight / 2);
    }
  });

  it("splits its band where the rendered labels meet, not at their anchors", () => {
    stubSynth([makeVoice("urn:zoe", "Zoe", "en-US")]);
    const scene = createScene();
    measureVoiceText(scene);
    new SettingsPanel(scene as never);

    const chip = findTextByLabel(scene, "Voice: Default (device)") as MeasurableText;
    const preview = findTextByLabel(scene, "Preview") as MeasurableText;
    const chipRect = measuredHitRect(chip);
    const previewRect = measuredHitRect(preview);
    const chipExtent = chip.getBounds();
    const previewExtent = preview.getBounds();
    const [cardX, , cardWidth] = lastRowCard(scene);

    // The boundary falls in the gap between the two rendered labels, so no part
    // of either label sits in the other's half.
    expect(chipRect.right).toBeGreaterThanOrEqual(chipExtent.right);
    expect(chipRect.right).toBeLessThanOrEqual(previewExtent.left);
    // Each half is one band tall and keeps a generous target. The chip stays
    // inside the card; the preview half reaches as far as its label does, which
    // can pass the card's right edge, and still has to stay on the panel rather
    // than leave the word's tail on the backdrop that closes the panel.
    for (const rect of [chipRect, previewRect]) {
      expect(rect.bottom - rect.top).toBe(ROW_PITCH);
      expect(rect.right - rect.left).toBeGreaterThanOrEqual(96);
      expect(rect.left).toBeGreaterThanOrEqual(cardX - cardWidth / 2);
      expect(rect.right).toBeLessThanOrEqual(cardX + PANEL_WIDTH / 2);
    }
    expect(chipRect.right).toBeLessThanOrEqual(cardX + cardWidth / 2);
    // The chip's own label is inside its half: the wide default voice is the
    // case that used to overrun the midpoint and activate Preview.
    expect(chipExtent.left).toBeGreaterThanOrEqual(chipRect.left);
    expect(chipExtent.right).toBeLessThanOrEqual(chipRect.right);
    // And so is the preview's, whatever it renders to.
    expect(previewExtent.left).toBeGreaterThanOrEqual(previewRect.left);
    expect(previewExtent.right).toBeLessThanOrEqual(previewRect.right);
  });

  it("leaves a chip label whole when its extent already fits its half", () => {
    stubSynth([makeVoice("urn:zoe", "Zoe", "en-US")]);
    updateSettings({ preferredVoiceURI: "urn:zoe" });
    const scene = createScene();
    measureVoiceText(scene);
    new SettingsPanel(scene as never);

    const chip = findTextByLabel(scene, "Voice: en-US — Zoe") as MeasurableText;
    // No shorter budget was ever written: truncation is a fallback, not a
    // blanket. The whole label therefore sits inside its own half.
    for (const [label] of chip.setText.mock.calls) {
      expect(label).toBe("Voice: en-US — Zoe");
    }
    const chipRect = measuredHitRect(chip);
    expect(chipRect.left).toBeLessThanOrEqual(chip.getBounds().left);
    expect(chipRect.right).toBeGreaterThanOrEqual(chip.getBounds().right);
  });

  it("Preview speaks the sample phrase with the selected voice when SFX is on", () => {
    const { speak } = stubSynth([makeVoice("urn:zoe", "Zoe", "en-US")]);
    vi.stubGlobal("SpeechSynthesisUtterance", MockUtterance);
    updateSettings({ preferredVoiceURI: "urn:zoe" });
    const scene = createScene();
    new SettingsPanel(scene as never);

    triggerPointerdown(findTextByLabel(scene, "Preview") as MockGameObject);

    expect(speak).toHaveBeenCalledTimes(1);
    const utterance = speak.mock.calls[0]?.[0] as MockUtterance;
    expect(utterance.text).toBe("Hi! I can talk.");
    expect(utterance.voice?.voiceURI).toBe("urn:zoe");
  });

  it("keeps the voice halves in the frame the engine tests, even after a label change", () => {
    stubSynth([
      makeVoice("urn:zoe", "Zoe", "en-US"),
      makeVoice("urn:long", "A Rather Long Voice Name", "en-GB"),
    ]);
    const scene = createScene();
    measureVoiceText(scene);
    new SettingsPanel(scene as never);
    const chip = findTextByLabel(scene, "Voice: Default (device)") as MockGameObject;
    const config = configOf(chip);
    const bounds = (chip as unknown as MeasurableText).getBounds();
    const chipX = (bounds.left + bounds.right) / 2;
    const chipY = bounds.top + LINE_HEIGHT / 2;
    const chipRect = measuredHitRect(chip as unknown as MeasurableText);

    // The chip half reaches the card's left edge whatever the label renders to,
    // and stops at the split, so a tap past it belongs to Preview.
    for (const originX of [0, 90, 160]) {
      expect(engineHits(config, chipX, chipY, originX, 17, chipRect.left + 1, chipY)).toBe(true);
      expect(engineHits(config, chipX, chipY, originX, 17, chipRect.right + 1, chipY)).toBe(false);
    }

    // Cycling rewrites the chip's text and refits; the engine must see the new
    // rectangle, which only happens because `applyHitArea` assigns to the
    // existing `input` object instead of calling `setInteractive` again (a second
    // call is ignored, so the stale rectangle would stay live).
    const input = {
      hitArea: { ...config.hitArea },
      hitAreaCallback: config.hitAreaCallback,
    };
    (chip as unknown as { input: typeof input }).input = input;
    const before = input.hitArea;
    triggerPointerdown(chip);

    expect(input.hitArea).not.toBe(before);
    expect(chip.setInteractive).toHaveBeenCalledTimes(1);

    // And the refitted rectangle behaves the same way in the engine frame.
    const refit = { hitArea: input.hitArea, hitAreaCallback: input.hitAreaCallback };
    const refitLeft = chipX + input.hitArea.x;
    const refitRight = refitLeft + input.hitArea.width;
    for (const originX of [0, 90, 160]) {
      expect(engineHits(refit, chipX, chipY, originX, 17, refitLeft + 1, chipY)).toBe(true);
      expect(engineHits(refit, chipX, chipY, originX, 17, refitRight + 1, chipY)).toBe(false);
      expect(engineHits(refit, chipX, chipY, originX, 17, refitLeft + 1, chipY - 27)).toBe(true);
      expect(engineHits(refit, chipX, chipY, originX, 17, refitLeft + 1, chipY - 29)).toBe(false);
    }
  });

  it("Preview stays silent when SFX is off", () => {
    const { speak } = stubSynth([makeVoice("urn:zoe", "Zoe", "en-US")]);
    vi.stubGlobal("SpeechSynthesisUtterance", MockUtterance);
    updateSettings({ sfxEnabled: false });
    const scene = createScene();
    new SettingsPanel(scene as never);

    triggerPointerdown(findTextByLabel(scene, "Preview") as MockGameObject);

    expect(speak).not.toHaveBeenCalled();
  });

  it("refreshes the chip when voices load asynchronously (voiceschanged)", () => {
    const { synth, listeners } = stubSynth([]);
    updateSettings({ preferredVoiceURI: "urn:zoe" });
    const scene = createScene();
    new SettingsPanel(scene as never);
    const chip = findTextByLabel(scene, "Voice: Default (device)") as MockGameObject;

    // Voices arrive late on some platforms.
    (synth.getVoices as ReturnType<typeof vi.fn>).mockReturnValue([
      makeVoice("urn:zoe", "Zoe", "en-US"),
    ]);
    listeners.voiceschanged?.();

    expect(chip.setText).toHaveBeenCalledWith("Voice: en-US — Zoe");
  });

  it("survives a voiceschanged event while the other page is open", () => {
    const { synth, listeners } = stubSynth([]);
    const scene = createScene();
    const panel = new SettingsPanel(scene as never);
    const chip = findTextByLabel(scene, "Voice: Default (device)") as MockGameObject;
    const callsBefore = chip.setText.mock.calls.length;

    const card = findTextStartingWith(scene, "Backup & restore") as MockGameObject;
    triggerPointerdown(card);
    expect(panel.backupState().page).toBe(1);
    expect(chip.destroy, "the chip goes with page one").toHaveBeenCalled();

    // The platform listener lives for the panel's lifetime, so it can arrive
    // with page two on screen: the row released its handles before the objects
    // were destroyed, so this writes through nothing.
    (synth.getVoices as ReturnType<typeof vi.fn>).mockReturnValue([
      makeVoice("urn:zoe", "Zoe", "en-US"),
    ]);
    expect(() => listeners.voiceschanged?.()).not.toThrow();
    expect(chip.setText.mock.calls.length).toBe(callsBefore);
  });

  it("removes the voiceschanged listener on destroy", () => {
    const { synth } = stubSynth([]);
    const scene = createScene();
    const panel = new SettingsPanel(scene as never);

    panel.destroy();

    expect(synth.removeEventListener).toHaveBeenCalledWith("voiceschanged", expect.any(Function));
  });
});

describe("SettingsPanel progress report", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("renders a Progress row in the settings panel", () => {
    const scene = createScene();
    new SettingsPanel(scene as never);
    expect(findTextByLabel(scene, "Progress")).toBeDefined();
  });

  it("opens the Learning Progress overlay from the Progress row", () => {
    const scene = createScene();
    new SettingsPanel(scene as never);
    const row = findTextByLabel(scene, "Progress") as MockGameObject;
    triggerPointerdown(row);

    expect(findTextByLabel(scene, "Learning Progress")).toBeDefined();
    expect(findTextByLabel(scene, "X")).toBeDefined();
    // Profile switcher chip for the single default profile.
    expect(findImagesByTexture(scene, PROFILE_AVATAR_TEXTURES.cat).length).toBe(1);
    // The overlay opens on the Overview page: its three statements, the page
    // counter over the extra page, and the 7-day strip.
    expect(findTextByLabel(scene, "1 / 5")).toBeDefined();
    expect(findTextByLabel(scene, "Last 7 days · 0 plays")).toBeDefined();
    // Activity strip bars are 24px wide; the toggle knobs are 24×24 squares.
    const bars = scene.add.rectangle.mock.calls.filter((call) => call[2] === 24 && call[3] !== 24);
    expect(bars).toHaveLength(7);

    // The per-game rows start on the page after the Overview.
    triggerPointerdown(findTextByLabel(scene, "›") as MockGameObject);
    expect(findTextByLabel(scene, "Shape Sorter")).toBeDefined();
    expect(findTextByLabel(scene, "Animal Trace")).toBeDefined();
    expect(findTextByLabel(scene, "Big & Small")).toBeDefined();
    expect(findTextByLabel(scene, "Pattern Builder")).toBeUndefined();
    // Explicit prev/next chevron controls.
    expect(findTextByLabel(scene, "‹")).toBeDefined();
    expect(findTextByLabel(scene, "›")).toBeDefined();
  });

  it("explains adaptive difficulty to parents inside the report", () => {
    const scene = createScene();
    new SettingsPanel(scene as never);
    triggerPointerdown(findTextByLabel(scene, "Progress") as MockGameObject);

    const noteCall = scene.add.text.mock.calls.find(
      (call) => typeof call[2] === "string" && call[2].includes("adapt"),
    );
    expect(noteCall).toBeDefined();
    if (!noteCall) throw new Error("adaptive note text not found");
    // Tells the parent what it does AND where to disable it.
    expect(noteCall?.[2]).toContain("Settings");
    // Muted footer styling keeps it secondary to the report rows.
    expect(noteCall?.[3]).toEqual(expect.objectContaining({ color: "#a0aec0" }));
    // Informational only — never a parent control.
    const noteObject = scene.add.text.mock.results[scene.add.text.mock.calls.indexOf(noteCall)]
      ?.value as MockGameObject;
    expect(noteObject.setInteractive).not.toHaveBeenCalled();
  });

  it("shows per-game plays, accuracy, and last played from progress data", () => {
    recordGamePlay("shape-sorter");
    recordGameResult("shape-sorter", 6, 2);
    recordGamePlay("animal-trace");

    const scene = createScene();
    new SettingsPanel(scene as never);
    triggerPointerdown(findTextByLabel(scene, "Progress") as MockGameObject);
    triggerPointerdown(findTextByLabel(scene, "›") as MockGameObject);

    expect(findTextByLabel(scene, "1 plays · 75% · Today")).toBeDefined();
    expect(findTextByLabel(scene, "1 plays · — · Today")).toBeDefined();
    expect(findTextByLabel(scene, "Last 7 days · 2 plays")).toBeDefined();
  });

  it("shows a mastery star for games with at least 3 wins", () => {
    recordGamePlay("shape-sorter");
    recordGameResult("shape-sorter", 3, 0);
    recordGameResult("shape-sorter", 3, 1);
    recordGameResult("shape-sorter", 4, 0);

    const scene = createScene();
    new SettingsPanel(scene as never);
    triggerPointerdown(findTextByLabel(scene, "Progress") as MockGameObject);
    triggerPointerdown(findTextByLabel(scene, "›") as MockGameObject);

    expect(findTextByLabel(scene, "★ Shape Sorter")).toBeDefined();
    expect(findTextByLabel(scene, "Animal Trace")).toBeDefined();
  });

  it("pages through all 22 game rows with explicit chevrons (6+6+6+4)", () => {
    const scene = createScene();
    new SettingsPanel(scene as never);
    triggerPointerdown(findTextByLabel(scene, "Progress") as MockGameObject);

    const nextChevron = () => findTextByLabel(scene, "›") as MockGameObject | undefined;
    const prevChevron = () => findTextByLabel(scene, "‹") as MockGameObject | undefined;
    expect(nextChevron()).toBeDefined();
    expect(prevChevron()).toBeDefined();
    // Page 1 is the Overview: no game rows and no last-page game yet.
    expect(findTextByLabel(scene, "Shape Sorter")).toBeUndefined();
    expect(findTextByLabel(scene, "Color Match")).toBeUndefined();
    expect(findTextByLabel(scene, "Story Order")).toBeUndefined();
    expect(findTextByLabel(scene, "1 / 5")).toBeDefined();

    triggerPointerdown(nextChevron() as MockGameObject);
    const pageOneRow = findTextByLabel(scene, "Shape Sorter") as MockGameObject;
    expect(findTextByLabel(scene, "2 / 5")).toBeDefined();
    expect(pageOneRow).toBeDefined();
    expect(findTextByLabel(scene, "Pattern Builder")).toBeUndefined();
    expect(findTextByLabel(scene, "Color Match")).toBeUndefined();

    triggerPointerdown(nextChevron() as MockGameObject);
    expect(pageOneRow.destroy).toHaveBeenCalled();
    expect(findTextByLabel(scene, "3 / 5")).toBeDefined();
    expect(findTextByLabel(scene, "Pattern Builder")).toBeDefined();
    expect(findTextByLabel(scene, "First Sounds")).toBeDefined();
    expect(findTextByLabel(scene, "Color Match")).toBeUndefined();
    expect(findTextByLabel(scene, "Take Away")).toBeUndefined();

    triggerPointerdown(nextChevron() as MockGameObject);
    expect(findTextByLabel(scene, "4 / 5")).toBeDefined();
    expect(findTextByLabel(scene, "Color Match")).toBeDefined();
    expect(findTextByLabel(scene, "Add It Up")).toBeDefined();
    expect(findTextByLabel(scene, "Take Away")).toBeDefined();
    expect(findTextByLabel(scene, "Decode It")).toBeUndefined();
    expect(findTextByLabel(scene, "Story Order")).toBeUndefined();

    const lastPageMark = scene.add.text.mock.calls.length;
    triggerPointerdown(nextChevron() as MockGameObject);
    expect(findTextByLabel(scene, "5 / 5")).toBeDefined();
    expect(findTextByLabel(scene, "Decode It")).toBeDefined();
    expect(findTextByLabel(scene, "Number Order")).toBeDefined();
    expect(findTextByLabel(scene, "Feelings Faces")).toBeDefined();
    expect(findTextByLabel(scene, "Story Order")).toBeDefined();
    // The last page holds the remaining four rows (22 = 6 + 6 + 6 + 4).
    const lastPageRows = scene.add.text.mock.calls
      .slice(lastPageMark)
      .filter((call) => call[0] === 354 && call[3]?.fontSize === "30px");
    expect(lastPageRows).toHaveLength(4);

    // The last page clamps instead of wrapping around.
    triggerPointerdown(nextChevron() as MockGameObject);
    expect(findTextByLabel(scene, "5 / 5")).toBeDefined();

    // Previous pages walk back to the Overview, which also clamps.
    triggerPointerdown(prevChevron() as MockGameObject);
    expect(findTextByLabel(scene, "4 / 5")).toBeDefined();
    triggerPointerdown(prevChevron() as MockGameObject);
    expect(findTextByLabel(scene, "3 / 5")).toBeDefined();
    triggerPointerdown(prevChevron() as MockGameObject);
    expect(findTextByLabel(scene, "2 / 5")).toBeDefined();
    triggerPointerdown(prevChevron() as MockGameObject);
    expect(findTextByLabel(scene, "1 / 5")).toBeDefined();
    triggerPointerdown(prevChevron() as MockGameObject);
    expect(findTextByLabel(scene, "1 / 5")).toBeDefined();
  });

  it("shows Story Order as the 22nd row, reading its own progress record", () => {
    recordGamePlay("story-order");

    const scene = createScene();
    new SettingsPanel(scene as never);
    triggerPointerdown(findTextByLabel(scene, "Progress") as MockGameObject);
    for (let page = 0; page < 4; page += 1) {
      triggerPointerdown(findTextByLabel(scene, "›") as MockGameObject);
    }

    expect(findTextByLabel(scene, "5 / 5")).toBeDefined();
    expect(findTextByLabel(scene, "Story Order")).toBeDefined();
    expect(findTextByLabel(scene, "Feelings Faces")).toBeDefined();
    // Exactly one row reports a play: story-order's own record.
    const statsCalls = scene.add.text.mock.calls.filter(
      (call) => call[0] === 354 && call[2] === "1 plays · — · Today",
    );
    expect(statsCalls).toHaveLength(1);
  });

  it("spaces consecutive progress rows at least 56px apart", () => {
    const scene = createScene();
    new SettingsPanel(scene as never);
    triggerPointerdown(findTextByLabel(scene, "Progress") as MockGameObject);
    triggerPointerdown(findTextByLabel(scene, "›") as MockGameObject);

    // Row names are the 30px texts at x = centerX - 158 (354 for a 1024-wide
    // scene). Stats lines are 26px, the title is 36px, and footer texts sit at
    // different x positions, so this filter isolates exactly the row names.
    const nameYs = scene.add.text.mock.calls
      .filter((call) => call[0] === 354 && call[3]?.fontSize === "30px")
      .map((call) => call[1] as number)
      .sort((a, b) => a - b);

    expect(nameYs).toHaveLength(6);
    for (let i = 1; i < nameYs.length; i += 1) {
      expect(nameYs[i] - nameYs[i - 1]).toBeGreaterThanOrEqual(56);
    }
  });

  it("re-renders rows for the selected profile without switching the active profile", () => {
    recordGamePlay("shape-sorter");
    addProfile("dog");
    recordGamePlay("color-match");
    switchProfile(getProfiles()[0].id);

    const scene = createScene();
    new SettingsPanel(scene as never);
    triggerPointerdown(findTextByLabel(scene, "Progress") as MockGameObject);
    triggerPointerdown(findTextByLabel(scene, "›") as MockGameObject);

    expect(findTextByLabel(scene, "0 plays · — · —")).toBeDefined();
    triggerPointerdown(findImagesByTexture(scene, PROFILE_AVATAR_TEXTURES.dog)[0]);
    // A re-render keeps the current page, so the swapped rows appear in place.
    expect(findTextByLabel(scene, "1 plays · — · Today")).toBeDefined();
    expect(getActiveProfile().id).toBe(getProfiles()[0].id);
  });

  it("closes the overlay on backdrop tap and X tap, keeping the panel usable", () => {
    const scene = createScene();
    new SettingsPanel(scene as never);
    triggerPointerdown(findTextByLabel(scene, "Progress") as MockGameObject);
    const header = findTextByLabel(scene, "Learning Progress") as MockGameObject;

    const overlayBackdrop = scene.add.rectangle.mock.results.find(
      (_result, index) => scene.add.rectangle.mock.calls[index]?.[5] === 0.75,
    )?.value as MockGameObject;
    triggerPointerdown(overlayBackdrop);
    expect(header.destroy).toHaveBeenCalled();

    // The panel still works: tapping Progress reopens a fresh overlay.
    triggerPointerdown(findTextByLabel(scene, "Progress") as MockGameObject);
    expect(findTextByLabel(scene, "Learning Progress")).toBeDefined();
    const header2 = findTextByLabel(scene, "Learning Progress") as MockGameObject;
    triggerPointerdown(findTextByLabel(scene, "X") as MockGameObject);
    expect(header2.destroy).toHaveBeenCalled();
  });
});

describe("SettingsPanel progress overlay bands", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  function openProgress(scene: MockScene): void {
    triggerPointerdown(findTextByLabel(scene, "Progress") as MockGameObject);
  }

  /**
   * The most recently created avatar chip in the progress chip row (y = 189)
   * for the given texture, with the image call's index so drawn order can be
   * checked. Re-renders re-create the chips, so the last match is the live one.
   */
  function progressChip(
    scene: MockScene,
    texture: string,
  ): { callIndex: number; object: MockGameObject } {
    let index = -1;
    scene.add.image.mock.calls.forEach((call, i) => {
      if (call[2] === texture && call[1] === 189) index = i;
    });
    if (index < 0) throw new Error(`No progress chip rendered for ${texture}`);
    return {
      callIndex: index,
      object: scene.add.image.mock.results[index]?.value as MockGameObject,
    };
  }

  /** Viewed-profile highlight rings created after the given call count. */
  function newRingsAt(scene: MockScene, since: number, x: number): RectWithArgs[] {
    return getRectangles(scene)
      .slice(since)
      .filter((rect) => {
        const [rx, ry, w] = rect.args ?? [];
        return (
          Math.abs((rx as number) - x) <= 2 &&
          ry === 189 &&
          (w as number) >= 70 &&
          (w as number) <= 90
        );
      });
  }

  it("selects a chip from a tap inside its own band (wrong-profile reproduction fixed)", () => {
    addProfile("dog"); // p2 becomes the active profile, so the overlay opens on p2
    const scene = createScene();
    new SettingsPanel(scene as never);
    openProgress(scene);

    const chipCat = progressChip(scene, PROFILE_AVATAR_TEXTURES.cat); // p1, drawn first
    const chipDog = progressChip(scene, PROFILE_AVATAR_TEXTURES.dog); // p2, drawn later
    const [catX, chipY] = imageCallArgs(scene, chipCat.object);
    const [dogX] = imageCallArgs(scene, chipDog.object);
    expect(chipY).toBe(189);
    expect(dogX - catX).toBe(56); // the accepted chip pitch

    const catConfig = configOf(chipCat.object);
    const dogConfig = configOf(chipDog.object);
    const scale = chipCat.object.setScale.mock.calls[0]?.[0] as number; // 64/256
    // The helper's rectangle lives in the image's local space; because the
    // engine's TransformXY divides the tap by the drawn scale first, the live
    // band measures local width x scale across the scene.
    expect(catConfig.hitArea.width * scale).toBeCloseTo(96);
    expect(catConfig.hitArea.height * scale).toBeCloseTo(96);
    const origin = AVATAR_TEXTURE_SIZE / 2;

    // A point on the drawn avatar that only cat's band contains (left part,
    // outside the accepted seam overlap) selects cat and nothing else.
    const ownX = catX - 24;
    expect(engineHitsScaled(catConfig, catX, chipY, scale, origin, origin, ownX, chipY)).toBe(true);
    expect(engineHitsScaled(dogConfig, dogX, chipY, scale, origin, origin, ownX, chipY)).toBe(
      false,
    );

    const beforeOwn = scene.add.rectangle.mock.calls.length;
    triggerPointerdown(chipCat.object);
    expect(newRingsAt(scene, beforeOwn, catX).length).toBeGreaterThan(0);

    // Re-resolve the live chips; the first tap's re-render destroyed these.
    const catNow = progressChip(scene, PROFILE_AVATAR_TEXTURES.cat);
    const dogNow = progressChip(scene, PROFILE_AVATAR_TEXTURES.dog);
    const catConfigNow = configOf(catNow.object);
    const dogConfigNow = configOf(dogNow.object);

    // A tap exactly at the seam lands in BOTH bands; Phaser resolves
    // topmost-first, so the later-drawn chip (dog) wins the overlap.
    const seamX = (catX + dogX) / 2;
    expect(engineHitsScaled(catConfigNow, catX, chipY, scale, origin, origin, seamX, chipY)).toBe(
      true,
    );
    expect(engineHitsScaled(dogConfigNow, dogX, chipY, scale, origin, origin, seamX, chipY)).toBe(
      true,
    );
    expect(dogNow.callIndex).toBeGreaterThan(catNow.callIndex); // drawn later = on top

    const beforeSeam = scene.add.rectangle.mock.calls.length;
    triggerPointerdown(dogNow.object);
    expect(newRingsAt(scene, beforeSeam, dogX).length).toBeGreaterThan(0);
    expect(newRingsAt(scene, beforeSeam, catX).length).toBe(0);
  });

  it("covers the drawn X glyph across its 96px band with one pixel outside dead", () => {
    addProfile("dog");
    const scene = createScene();
    new SettingsPanel(scene as never);
    openProgress(scene);

    const close = findLastTextByLabel(scene, "X") as MockGameObject;
    const config = configOf(close);
    const [objectX, objectY] = textCallArgs(scene, close);
    // The band keeps today's intended 96 x 96 size.
    expect(config.hitArea.width).toBe(96);
    expect(config.hitArea.height).toBe(96);

    // "X" at 32px: about 26px wide glyph and 42px line box in the suite's
    // convention (GLYPH_WIDTH/LINE_HEIGHT are the 26px anchors above).
    const glyphHalf = 13;
    const lineHalf = 21;
    for (const [displayOriginX, displayOriginY] of [
      [0, 0],
      [glyphHalf, lineHalf],
      [137, 13],
    ] as const) {
      // Drawn glyph centre and edges live.
      expect(
        engineHits(config, objectX, objectY, displayOriginX, displayOriginY, objectX, objectY),
      ).toBe(true);
      expect(
        engineHits(
          config,
          objectX,
          objectY,
          displayOriginX,
          displayOriginY,
          objectX + glyphHalf,
          objectY + lineHalf,
        ),
      ).toBe(true);
      expect(
        engineHits(
          config,
          objectX,
          objectY,
          displayOriginX,
          displayOriginY,
          objectX - glyphHalf,
          objectY - lineHalf,
        ),
      ).toBe(true);
      // The full band is live (inclusive edges).
      expect(
        engineHits(config, objectX, objectY, displayOriginX, displayOriginY, objectX + 48, objectY),
      ).toBe(true);
      expect(
        engineHits(config, objectX, objectY, displayOriginX, displayOriginY, objectX, objectY + 48),
      ).toBe(true);
      // One pixel outside the band is dead.
      expect(
        engineHits(config, objectX, objectY, displayOriginX, displayOriginY, objectX + 49, objectY),
      ).toBe(false);
      expect(
        engineHits(config, objectX, objectY, displayOriginX, displayOriginY, objectX - 49, objectY),
      ).toBe(false);
      expect(
        engineHits(config, objectX, objectY, displayOriginX, displayOriginY, objectX, objectY + 49),
      ).toBe(false);
      expect(
        engineHits(config, objectX, objectY, displayOriginX, displayOriginY, objectX, objectY - 49),
      ).toBe(false);
    }

    // The X still closes the overlay it is drawn on.
    const backdrop = getRectangles(scene)
      .filter((rect) => rect.args?.[2] === 1024 && rect.args?.[3] === 768)
      .at(-1) as RectWithArgs;
    triggerPointerdown(close);
    expect(backdrop.object.destroy).toHaveBeenCalled();
  });

  it("covers the drawn chevron glyphs across their 96px bands with one pixel outside dead", () => {
    const scene = createScene();
    new SettingsPanel(scene as never);
    openProgress(scene);

    for (const glyph of ["‹", "›"]) {
      const chevron = findLastTextByLabel(scene, glyph) as MockGameObject;
      const config = configOf(chevron);
      const [objectX, objectY] = textCallArgs(scene, chevron);
      // The band keeps today's intended 96 x 96 size.
      expect(config.hitArea.width).toBe(96);
      expect(config.hitArea.height).toBe(96);

      // "‹"/"›" at 40px: about 20px glyphs and 52px line boxes in the suite's
      // convention (GLYPH_WIDTH/LINE_HEIGHT are the 26px anchors above).
      const glyphHalf = 10;
      const lineHalf = 26;
      for (const [displayOriginX, displayOriginY] of [
        [0, 0],
        [glyphHalf, lineHalf],
        [137, 13],
      ] as const) {
        // Drawn glyph centre and edges live.
        expect(
          engineHits(config, objectX, objectY, displayOriginX, displayOriginY, objectX, objectY),
        ).toBe(true);
        expect(
          engineHits(
            config,
            objectX,
            objectY,
            displayOriginX,
            displayOriginY,
            objectX + glyphHalf,
            objectY + lineHalf,
          ),
        ).toBe(true);
        expect(
          engineHits(
            config,
            objectX,
            objectY,
            displayOriginX,
            displayOriginY,
            objectX - glyphHalf,
            objectY - lineHalf,
          ),
        ).toBe(true);
        // The full band is live (inclusive edges).
        expect(
          engineHits(
            config,
            objectX,
            objectY,
            displayOriginX,
            displayOriginY,
            objectX + 48,
            objectY,
          ),
        ).toBe(true);
        expect(
          engineHits(
            config,
            objectX,
            objectY,
            displayOriginX,
            displayOriginY,
            objectX,
            objectY + 48,
          ),
        ).toBe(true);
        // One pixel outside the band is dead.
        expect(
          engineHits(
            config,
            objectX,
            objectY,
            displayOriginX,
            displayOriginY,
            objectX + 49,
            objectY,
          ),
        ).toBe(false);
        expect(
          engineHits(
            config,
            objectX,
            objectY,
            displayOriginX,
            displayOriginY,
            objectX - 49,
            objectY,
          ),
        ).toBe(false);
        expect(
          engineHits(
            config,
            objectX,
            objectY,
            displayOriginX,
            displayOriginY,
            objectX,
            objectY + 49,
          ),
        ).toBe(false);
        expect(
          engineHits(
            config,
            objectX,
            objectY,
            displayOriginX,
            displayOriginY,
            objectX,
            objectY - 49,
          ),
        ).toBe(false);
      }
    }
  });
});

describe("SettingsPanel affordance cohesion", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  /** Builds a panel with the install button visible for press-feedback checks. */
  function buildPanel(): MockScene {
    const scene = createScene();
    const tracker = createFakeInstallTracker("installable");
    new SettingsPanel(scene as never, tracker as unknown as InstallTracker);
    return scene;
  }

  it("attaches shared press feedback to every parent control", () => {
    const scene = buildPanel();

    const controls = [
      findTextByLabel(scene, "BGM: ON"),
      findTextByLabel(scene, "SFX: ON"),
      findTextByLabel(scene, "Profiles"),
      findTextByLabel(scene, "Progress"),
      findLastTextByLabel(scene, "Reset Progress"),
      findTextByLabel(scene, "Install App") ?? findTextByLabel(scene, "How to Install"),
      findTextStartingWith(scene, "Voice:"),
      findTextByLabel(scene, "Preview"),
    ];
    expect(controls.length).toBe(8);
    for (const control of controls) {
      expect(control).toBeDefined();
      // One gameplay handler + one press-feedback squish handler.
      expect(listenerCount(control as MockGameObject, "pointerdown")).toBe(2);
      // Restore handlers for release / leave / cancel.
      expect(listenerCount(control as MockGameObject, "pointerup")).toBeGreaterThanOrEqual(1);
      expect(listenerCount(control as MockGameObject, "pointerout")).toBeGreaterThanOrEqual(1);
      expect(listenerCount(control as MockGameObject, "pointercancel")).toBeGreaterThanOrEqual(1);
    }
  });

  it("registers only gameplay handlers under reduced motion", () => {
    vi.stubGlobal("window", {
      matchMedia: () => ({ matches: true }),
    });

    const scene = buildPanel();

    for (const label of ["BGM: ON", "Profiles"]) {
      const control = findTextByLabel(scene, label) as MockGameObject;
      expect(listenerCount(control, "pointerdown")).toBe(1);
      expect(listenerCount(control, "pointerup")).toBe(0);
    }
  });

  it("presents toggles with a track and knob that flip state visually", () => {
    const scene = createScene();
    new SettingsPanel(scene as never);

    // Track (64x32) and knob (24x24) rectangles exist near each toggle row.
    const rects = getRectangles(scene).filter((r) => {
      const [, , w, h] = r.args ?? [];
      return w === 64 && h === 32;
    });
    expect(rects.length).toBeGreaterThanOrEqual(2);

    const knobs = getRectangles(scene).filter((r) => {
      const [, , w, h] = r.args ?? [];
      return w === 24 && h === 24;
    });
    expect(knobs.length).toBeGreaterThanOrEqual(2);

    // Tapping BGM moves its knob and repaints the track.
    const knob = knobs[0]?.object as MockGameObject;
    triggerPointerdown(findTextByLabel(scene, "BGM: ON") as MockGameObject);
    expect(knob.setX).toHaveBeenCalled();
    const anyTrack = rects[0]?.object as MockGameObject;
    expect(anyTrack.setFillStyle).toHaveBeenCalled();
  });

  it("pages the progress report with explicit prev/next chevrons", () => {
    const scene = createScene();
    new SettingsPanel(scene as never);
    triggerPointerdown(findTextByLabel(scene, "Progress") as MockGameObject);

    const pageLabel = () => findLastTextByLabel(scene, "1 / 5");
    expect(pageLabel()).toBeDefined();

    // The ambiguous single More/Back button is gone.
    expect(findLastTextByLabel(scene, "More")).toBeUndefined();
    expect(findLastTextByLabel(scene, "Back")).toBeUndefined();

    // Explicit chevron buttons exist and clamp at both ends.
    const next = findLastTextByLabel(scene, "›") as MockGameObject;
    const prev = findLastTextByLabel(scene, "‹") as MockGameObject;
    expect(next).toBeDefined();
    expect(prev).toBeDefined();

    triggerPointerdown(next);
    triggerPointerdown(next);
    triggerPointerdown(next);
    triggerPointerdown(next);
    expect(findLastTextByLabel(scene, "5 / 5")).toBeDefined();
    triggerPointerdown(next);
    expect(findLastTextByLabel(scene, "5 / 5")).toBeDefined(); // clamped

    triggerPointerdown(prev);
    triggerPointerdown(prev);
    triggerPointerdown(prev);
    triggerPointerdown(prev);
    expect(findLastTextByLabel(scene, "1 / 5")).toBeDefined();
    triggerPointerdown(prev);
    expect(findLastTextByLabel(scene, "1 / 5")).toBeDefined(); // clamped
  });

  it("highlights the viewed profile in the progress report", () => {
    addProfile("dog"); // becomes the ACTIVE profile per storage semantics

    const scene = createScene();
    new SettingsPanel(scene as never);
    triggerPointerdown(findTextByLabel(scene, "Progress") as MockGameObject);

    // Avatar chips sit at y=189 spread 56px apart around centerX.
    const profiles = getProfiles();
    const chipX = (index: number) => 512 + (index - (profiles.length - 1) / 2) * 56;
    const activeIndex = profiles.findIndex((profile) => profile.id === getActiveProfile().id);
    const ringsAt = (x: number) =>
      getRectangles(scene).filter((r) => {
        const [rx, ry, w] = r.args ?? [];
        return (
          Math.abs((rx as number) - x) <= 2 &&
          ry === 189 &&
          (w as number) >= 70 &&
          (w as number) <= 90
        );
      });

    // The report opens on the ACTIVE profile with its ring showing.
    expect(ringsAt(chipX(activeIndex)).length).toBeGreaterThan(0);

    // Tapping another chip moves the highlight without switching profiles.
    // Only rectangles created after this point count — the mock keeps records
    // of destroyed rings from earlier renders.
    const rectCountBeforeSwitch = scene.add.rectangle.mock.calls.length;
    const ringsSince = (x: number) =>
      getRectangles(scene)
        .slice(rectCountBeforeSwitch)
        .filter((r) => {
          const [rx, ry, w] = r.args ?? [];
          return (
            Math.abs((rx as number) - x) <= 2 &&
            ry === 189 &&
            (w as number) >= 70 &&
            (w as number) <= 90
          );
        });
    const otherIndex = activeIndex === 0 ? 1 : 0;
    const otherChip = findImagesByTexture(
      scene,
      PROFILE_AVATAR_TEXTURES[profiles[otherIndex].avatarId],
    )[0] as MockGameObject | undefined;
    expect(otherChip).toBeDefined();
    triggerPointerdown(otherChip as MockGameObject);

    expect(getActiveProfile().id).toBe(profiles[activeIndex].id); // unchanged
    expect(ringsSince(chipX(otherIndex)).length).toBeGreaterThan(0);
    expect(ringsSince(chipX(activeIndex)).length).toBe(0);
  });

  it("outlines the active profile row in the Profiles manager", () => {
    addProfile("dog"); // becomes the ACTIVE profile per storage semantics

    const scene = createScene();
    new SettingsPanel(scene as never);
    triggerPointerdown(findTextByLabel(scene, "Profiles") as MockGameObject);

    // Rows start at centerY-194 with an 80px pitch; avatars sit at centerX-110.
    const profiles = getProfiles();
    const activeRow = profiles.findIndex((profile) => profile.id === getActiveProfile().id);
    const ringsNear = (y: number) =>
      getRectangles(scene).filter((r) => {
        const [rx, ry, w] = r.args ?? [];
        return (
          Math.abs((rx as number) - 402) <= 2 &&
          Math.abs((ry as number) - y) <= 2 &&
          (w as number) >= 100
        );
      });
    const inactiveRow = activeRow === 0 ? 1 : 0;

    expect(ringsNear(190 + activeRow * 80).length).toBeGreaterThan(0); // active outlined
    expect(ringsNear(190 + inactiveRow * 80).length).toBe(0); // others plain
  });

  it("draws a background card behind each settings row", () => {
    const scene = createScene();
    new SettingsPanel(scene as never);

    // Eight cards: the page switch above the title, then BGM, SFX, Adaptive,
    // Profiles, Progress, Reset, Voice.
    const cards = getRectangles(scene).filter((r) => {
      const [, , w, h] = r.args ?? [];
      return w === 400 && h === 68;
    });
    expect(cards).toHaveLength(8);
  });

  it("keeps every settings row card inside the panel and the canvas", () => {
    const scene = createScene();
    new SettingsPanel(scene as never);

    // Panel card: 760px tall, centered at (512, 384) → spans 4..764.
    const rowCards = getRectangles(scene).filter((r) => {
      const [, , w, h] = r.args ?? [];
      return w === 400 && h === 68;
    });
    expect(rowCards.length).toBeGreaterThan(0);

    for (const card of rowCards) {
      const [, y, , h] = card.args ?? [];
      expect((y as number) - (h as number) / 2).toBeGreaterThanOrEqual(4);
      expect((y as number) + (h as number) / 2).toBeLessThanOrEqual(764);
    }
  });

  it("offers an explicit close button on the main panel", () => {
    const scene = createScene();
    new SettingsPanel(scene as never);

    const closeButton = findTextByLabel(scene, "✕") as MockGameObject | undefined;
    expect(closeButton).toBeDefined();
    expect(closeButton?.on.mock.calls.some(([event]) => event === "pointerdown")).toBe(true);

    const backdrop = scene.add.rectangle.mock.results[0]?.value as MockGameObject;
    triggerPointerdown(closeButton as MockGameObject);
    expect(backdrop.destroy).toHaveBeenCalled();
  });

  it("gives destructive confirm buttons a distinct stroked treatment", () => {
    const scene = createScene();
    new SettingsPanel(scene as never);

    // Reset modal.
    triggerPointerdown(findLastTextByLabel(scene, "Reset Progress") as MockGameObject);
    const resetButtons = getRectangles(scene).filter((r) => {
      const [, ry, w, h] = r.args ?? [];
      return w === 240 && h === 64 && (ry as number) > 384;
    });
    expect(resetButtons.some((r) => r.object.setStrokeStyle.mock.calls.length > 0)).toBe(true);

    // Close modal, open Profiles, then the delete confirmation modal.
    triggerPointerdown(findLastTextByLabel(scene, "Cancel") as MockGameObject);
    triggerPointerdown(findTextByLabel(scene, "Profiles") as MockGameObject);
    triggerPointerdown(findLastTextByLabel(scene, "Delete") as MockGameObject);
    const deleteButtons = getRectangles(scene).filter((r) => {
      const [, ry, w, h] = r.args ?? [];
      return w === 240 && h === 64 && (ry as number) > 384;
    });
    expect(deleteButtons.some((r) => r.object.setStrokeStyle.mock.calls.length > 0)).toBe(true);
  });
});

describe("SettingsPanel degraded persistence notice", () => {
  /** The line the panel shows a parent while the device cannot save. */
  const NOTICE = "Progress can't be saved on this device";

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    repairStorage();
    // A refused write raises the flag for the rest of the session, and the panel
    // reads it at open time, so each case heals the store before the next one
    // builds a panel that has to be undegraded.
    updateSettings({});
  });

  /** Scene-space y of the first text call rendered with the given label. */
  function textY(scene: MockScene, label: string): number {
    const call = scene.add.text.mock.calls.find((args) => args[2] === label);
    if (!call) throw new Error(`no text rendered for "${label}"`);
    return call[1] as number;
  }

  /** Builds a panel whose install row is visible, so every row is comparable. */
  function buildPanel(scene: MockScene): SettingsPanel {
    const tracker = createFakeInstallTracker("installable");
    return new SettingsPanel(scene as never, tracker as unknown as InstallTracker);
  }

  it("states the fact while the device cannot save, and says nothing otherwise", () => {
    const healthyScene = createScene();
    const healthy = buildPanel(healthyScene);
    expect(findTextByLabel(healthyScene, NOTICE)).toBeUndefined();
    expect(healthy.e2eDegraded()).toBe(false);

    // The flag is raised by a refused write, not by a stubbed boolean: the panel
    // reads the same session flag every mutator sets.
    breakStorage(["setItem"], "QuotaExceededError");
    earnSticker("shape-sorter");

    const degradedScene = createScene();
    const degraded = buildPanel(degradedScene);
    expect(findTextByLabel(degradedScene, NOTICE)).toBeDefined();
    expect(degraded.e2eDegraded()).toBe(true);
  });

  it("reaches the notice in a session whose reads are blocked", () => {
    // A real save exists, and then the device refuses to read it back.
    earnSticker("shape-sorter");
    breakStorage(["getItem"], "SecurityError");

    // The panel calls getSettings() before it reads the flag. That read used
    // to write defaults over the save it could not see, which cleared the flag
    // before the notice could be decided.
    const scene = createScene();
    const degraded = buildPanel(scene);

    expect(degraded.e2eDegraded()).toBe(true);
    expect(findTextByLabel(scene, NOTICE)).toBeDefined();
  });

  it("leaves the title, the version footer and the eight rows exactly where they were", () => {
    const healthyScene = createScene();
    buildPanel(healthyScene);

    breakStorage(["setItem"], "QuotaExceededError");
    earnSticker("shape-sorter");
    const degradedScene = createScene();
    buildPanel(degradedScene);

    const unchanged = [
      "Settings",
      `v${__APP_VERSION__}`,
      "BGM: ON",
      "SFX: ON",
      "Adaptive: ON",
      "Profiles",
      "Progress",
      "Reset Progress",
      "Install App",
      "Voice: Default (device)",
    ];
    for (const label of unchanged) {
      expect(textY(degradedScene, label), `${label} should not move`).toBe(
        textY(healthyScene, label),
      );
    }

    // The notice occupies the empty band above the title: inside the panel's own
    // top edge and clear of the title's line.
    const noticeY = textY(degradedScene, NOTICE);
    expect(noticeY).toBeGreaterThan(384 - PANEL_HEIGHT / 2);
    expect(noticeY).toBeLessThan(textY(degradedScene, "Settings"));
  });

  it("keeps the notice informational: no hit area and no tap handler", () => {
    breakStorage(["setItem"], "QuotaExceededError");
    earnSticker("shape-sorter");
    const scene = createScene();
    buildPanel(scene);

    const notice = findTextByLabel(scene, NOTICE) as MockGameObject;
    expect(notice.setInteractive).not.toHaveBeenCalled();
    expect(listenerCount(notice, "pointerdown")).toBe(0);
  });

  it("reads the flag once, at open time, and never polls it", () => {
    breakStorage(["setItem"], "QuotaExceededError");
    earnSticker("shape-sorter");
    const scene = createScene();
    const panel = buildPanel(scene);

    // The store starts accepting writes again while the panel is up.
    repairStorage();
    updateSettings({});

    expect(isPersistenceDegraded(), "a later accepted write heals the session").toBe(false);
    // The open panel still reports what was true when it was built and still
    // shows the notice: there is no subscription and no re-render.
    expect(panel.e2eDegraded()).toBe(true);
    expect(findTextByLabel(scene, NOTICE)).toBeDefined();
  });
});

describe("SettingsPanel backup page", () => {
  /** One fixed instant, so the download's filename and the payload agree. */
  const FIXED_NOW = new Date("2026-11-08T10:00:00");
  /** Page one's eight rows, in the order they are drawn. */
  const PAGE_ONE_LABELS = [
    "BGM: ON",
    "SFX: ON",
    "Adaptive: ON",
    "Profiles",
    "Progress",
    "Reset Progress",
    "Install App",
    "Voice: Default (device)",
  ];
  /** Their centres, which AC-9 pins: centerY -47, stepping by ROW_PITCH. */
  const PAGE_ONE_Y = [337, 393, 449, 505, 561, 617, 673, 729];
  /** The switch card's centre, in the empty band above the title. */
  const SWITCH_Y = 134;
  /** The result line's row on page two. */
  const RESULT_Y = 449;

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    // A reset, not a clear: an implementation left over from the previous case
    // would answer for a case that meant to decide for itself.
    vi.mocked(applyImport).mockReset();
    vi.mocked(downloadBackup).mockReset();
    vi.mocked(downloadText).mockReset();
    vi.mocked(pickBackupFile).mockReset();
    vi.mocked(reloadApp).mockReset();
    vi.mocked(saveDiagnostics).mockReset();
    // Only the clock is faked: the async paths below still need the real
    // microtask queue, and nothing here waits on a timer.
    vi.useFakeTimers({ now: FIXED_NOW, toFake: ["Date"] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /** Scene-space y of the last text created with the given label. */
  function lastTextCallY(scene: MockScene, label: string): number {
    let y = Number.NaN;
    scene.add.text.mock.calls.forEach((call, index) => {
      if (call[2] === label)
        y = (scene.add.text.mock.calls[index] as unknown as [number, number])[1];
    });
    if (Number.isNaN(y)) throw new Error(`no text rendered for "${label}"`);
    return y;
  }

  /** The result line: the wrapped text drawn at page two's third row. */
  function findResultLine(scene: MockScene): MockGameObject | undefined {
    let found: MockGameObject | undefined;
    scene.add.text.mock.calls.forEach((call, index) => {
      const style = call[3] as { wordWrap?: unknown } | undefined;
      if (call[1] === RESULT_Y && style?.wordWrap) {
        found = scene.add.text.mock.results[index]?.value as MockGameObject;
      }
    });
    return found;
  }

  /** Builds a panel and taps its way to the backup page, returning the switch card. */
  function openBackupPage(scene: MockScene, panel: SettingsPanel): MockGameObject {
    const card = findTextStartingWith(scene, "Backup & restore") as MockGameObject;
    expect(card, "the switch card should be on page one").toBeDefined();
    triggerPointerdown(card);
    expect(panel.backupState().page).toBe(1);
    return card;
  }

  /** The most recently created text object carrying exactly this label. */
  function lastTextObject(scene: MockScene, label: string): MockGameObject {
    const object = findLastTextByLabel(scene, label) as MockGameObject | undefined;
    if (!object) throw new Error(`no text rendered for "${label}"`);
    return object;
  }

  /** Lets the tap handler's promise chain run to completion. */
  async function settle(): Promise<void> {
    await Promise.resolve();
    await Promise.resolve();
  }

  /** A valid backup of the save on this device, as a parent would pick it. */
  function backupOfThisDevice(): { envelope: BackupEnvelope; json: string } {
    return createBackup(exportSave(), {
      appVersion: __APP_VERSION__,
      now: FIXED_NOW,
      schemaVersion: SCHEMA_VERSION,
    });
  }

  it("reaches a second page in one tap, with its own title and three rows", () => {
    const scene = createScene();
    const panel = new SettingsPanel(scene as never);

    const card = findTextStartingWith(scene, "Backup & restore") as MockGameObject;
    expect(lastTextCallY(scene, "Backup & restore ›")).toBe(SWITCH_Y);
    triggerPointerdown(card);

    expect((findTextByLabel(scene, "Settings") as MockGameObject).setText).toHaveBeenCalledWith(
      "Backup",
    );
    expect(findTextByLabel(scene, "Save a backup")).toBeDefined();
    expect(findTextByLabel(scene, "Restore from a file")).toBeDefined();
    expect(findTextByLabel(scene, "Save diagnostics")).toBeDefined();
    expect(findResultLine(scene), "the result line starts empty").toBeDefined();
    expect(panel.backupState().backupResult).toBe("");

    // The same card now says where it goes back to.
    expect(card.setText).toHaveBeenCalledWith("‹ Back to settings");
  });

  it("returns in one tap with every page-one row at its exact original y", () => {
    const scene = createScene();
    const panel = new SettingsPanel(scene as never, createFakeInstallTracker("installable"));

    const pageOneMap = (): Record<string, number> =>
      Object.fromEntries(PAGE_ONE_LABELS.map((label) => [label, lastTextCallY(scene, label)]));

    const before = pageOneMap();
    expect(Object.values(before)).toEqual(PAGE_ONE_Y);

    const switchCard = openBackupPage(scene, panel);
    const exportRow = lastTextObject(scene, "Save a backup");
    const restoreRow = lastTextObject(scene, "Restore from a file");
    triggerPointerdown(switchCard);

    expect(panel.backupState().page).toBe(0);
    // AC-9: the same eight labels, at the same y, byte for byte.
    expect(pageOneMap()).toEqual(before);
    expect(Object.values(pageOneMap())).toEqual(PAGE_ONE_Y);
    // The page-two rows are destroyed, so nothing from the other page answers.
    expect(exportRow.destroy).toHaveBeenCalled();
    expect(restoreRow.destroy).toHaveBeenCalled();
  });

  it("destroys the rows of the page it leaves, both ways", () => {
    const scene = createScene();
    const panel = new SettingsPanel(scene as never, createFakeInstallTracker("installable"));
    const pageOneRows = PAGE_ONE_LABELS.map(
      (label) => findTextByLabel(scene, label) as MockGameObject,
    );

    const switchCard = openBackupPage(scene, panel);
    for (const row of pageOneRows) {
      // Destroyed, not hidden: a hidden row keeps a live hit band over the canvas.
      expect(row.destroy, "a page-one row outlived the switch").toHaveBeenCalled();
    }

    const exportRow = lastTextObject(scene, "Save a backup");
    const restoreRow = lastTextObject(scene, "Restore from a file");
    triggerPointerdown(switchCard);

    expect(exportRow.destroy).toHaveBeenCalled();
    expect(restoreRow.destroy).toHaveBeenCalled();
  });

  it("publishes the switch point and every row point from the panel's own layout", () => {
    const scene = createScene();
    const panel = new SettingsPanel(scene as never);
    openBackupPage(scene, panel);

    const state = panel.backupState();
    expect(state.switchPage).toEqual({ x: 512, y: SWITCH_Y });
    expect(state.backupRows).toEqual([
      { id: "export", point: { x: 512, y: 337 } },
      { id: "restore", point: { x: 512, y: 393 } },
      { id: "diagnostics", point: { x: 512, y: 505 } },
    ]);
    // Each published point is inside the band its own row answers to.
    const LABEL_OF = {
      export: "Save a backup",
      restore: "Restore from a file",
      diagnostics: "Save diagnostics",
    } as const;
    for (const row of state.backupRows) {
      const band = hitRectFor(scene, LABEL_OF[row.id]);
      expect(row.point.x).toBeGreaterThanOrEqual(band.left);
      expect(row.point.x).toBeLessThanOrEqual(band.right);
      expect(row.point.y).toBeGreaterThanOrEqual(band.top);
      expect(row.point.y).toBeLessThanOrEqual(band.bottom);
    }
  });

  it("saves the whole save to a dated file and says so", () => {
    vi.mocked(applyImport).mockReturnValue({ ok: true });
    const scene = createScene();
    const panel = new SettingsPanel(scene as never);
    openBackupPage(scene, panel);

    triggerPointerdown(findTextByLabel(scene, "Save a backup") as MockGameObject);

    const expected = `Saved ${backupFilename(FIXED_NOW)}`;
    expect(backupFilename(FIXED_NOW)).toBe("aby-little-lab-backup-2026-11-08.json");
    expect(downloadBackup).toHaveBeenCalledWith(expect.any(String), backupFilename(FIXED_NOW));
    // The bytes are a real envelope, not a stringification of something else.
    const json = vi.mocked(downloadBackup).mock.calls[0]?.[0] as string;
    expect(JSON.parse(json)).toMatchObject({ format: "aby-little-lab-backup", formatVersion: 1 });
    expect(findResultLine(scene)?.setText).toHaveBeenCalledWith(expected);
    expect(panel.backupState().backupResult).toBe(expected);
  });

  it("puts the diagnostics row at the next free pitch, with page one having none of it", () => {
    const scene = createScene();
    const panel = new SettingsPanel(scene as never, createFakeInstallTracker("installable"));

    // Nothing from page two exists while page one is up - not the rows, not the
    // result line - so a tap cannot reach a control that is not drawn.
    expect(findTextByLabel(scene, "Save diagnostics")).toBeUndefined();
    expect(findTextByLabel(scene, "Save a backup")).toBeUndefined();

    openBackupPage(scene, panel);

    // FR-8: below the restore row, at one ROW_PITCH past it, and above the line
    // that reports what happened.
    expect(lastTextCallY(scene, "Save diagnostics")).toBe(RESULT_Y + ROW_PITCH);
    expect(lastTextCallY(scene, "Save a backup")).toBe(PAGE_ONE_Y[0]);
    expect(lastTextCallY(scene, "Restore from a file")).toBe(PAGE_ONE_Y[1]);
    // The result line has not moved: it stays where the export row reports to.
    expect(findResultLine(scene), "the result line holds the third row").toBeDefined();
  });

  it("saves the diagnostics file in one tap and names it on the line (AC-8)", () => {
    const filename = "diagnostics-2026-11-08.txt";
    vi.mocked(saveDiagnostics).mockReturnValue({ saved: true, filename });
    const scene = createScene();
    const panel = new SettingsPanel(scene as never);
    openBackupPage(scene, panel);

    triggerPointerdown(findTextByLabel(scene, "Save diagnostics") as MockGameObject);

    expect(saveDiagnostics).toHaveBeenCalledTimes(1);
    // The sentence names the file the parent is about to find in Downloads,
    // in the colour the export row already answers with.
    expect(panel.backupState().backupResult).toBe(`Saved ${filename}`);
    expect(findResultLine(scene)?.setText).toHaveBeenCalledWith(`Saved ${filename}`);
    expect(findResultLine(scene)?.setColor).toHaveBeenCalledWith(PRIMARY_COLOR);
  });

  it("says nothing has been recorded and writes no file when the log is empty (AC-8)", () => {
    vi.mocked(saveDiagnostics).mockReturnValue({ saved: false });
    const scene = createScene();
    const panel = new SettingsPanel(scene as never);
    openBackupPage(scene, panel);

    triggerPointerdown(findTextByLabel(scene, "Save diagnostics") as MockGameObject);

    // The row answered, so it is not a dead control; the sentence is the one
    // the report module owns, not a second copy in the panel.
    expect(saveDiagnostics).toHaveBeenCalledTimes(1);
    expect(panel.backupState().backupResult).toBe(NO_CRASHES);
    expect(findResultLine(scene)?.setText).toHaveBeenCalledWith(NO_CRASHES);
    // Not even a Blob: the seam writes nothing when there is nothing to write.
    expect(downloadText, "an empty log must not produce a file").not.toHaveBeenCalled();
    expect(downloadBackup).not.toHaveBeenCalled();
  });

  it("restores a verified file as a merge, and says in numbers what it added", async () => {
    const backup = backupOfThisDevice();
    vi.mocked(pickBackupFile).mockResolvedValue({ name: "mine.json", text: backup.json });
    // A real import through the public save layer: one more child, two more
    // stickers. The panel counts the save before and after, so these numbers
    // come from what was written rather than from the file.
    vi.mocked(applyImport).mockImplementation(() => {
      addProfile("dog");
      earnSticker("shape-sorter");
      earnSticker("color-match");
      return { ok: true };
    });
    const scene = createScene();
    const panel = new SettingsPanel(scene as never);
    openBackupPage(scene, panel);

    triggerPointerdown(findTextByLabel(scene, "Restore from a file") as MockGameObject);
    await settle();

    // The choice card names the file and offers both ways to apply it.
    expect(findTextByLabel(scene, "mine.json")).toBeDefined();
    expect(findTextByLabel(scene, "Merge")).toBeDefined();
    expect(findTextByLabel(scene, "Replace")).toBeDefined();
    expect(applyImport, "nothing is written before the parent chooses").not.toHaveBeenCalled();

    triggerPointerdown(findTextByLabel(scene, "Merge") as MockGameObject);

    expect(applyImport).toHaveBeenCalledWith("merge", backup.envelope.payload);
    // FR-10: the numbers, on the line the parent reads before the restart.
    expect(panel.backupState().backupResult).toBe("Merged 1 profile and 2 stickers into this one.");
    expect(findResultLine(scene)?.setText).toHaveBeenCalledWith(
      "Merged 1 profile and 2 stickers into this one.",
    );
    // The restart waits for the line to be read rather than racing it.
    expect(reloadApp).not.toHaveBeenCalled();
    expect(scene.time.delayedCall).toHaveBeenCalledWith(900, reloadApp);
    const restart = scene.time.delayedCall.mock.calls[0]?.[1] as () => void;
    restart();
    expect(reloadApp).toHaveBeenCalledTimes(1);
  });

  it("restores a verified file as a replace when that is what was chosen", async () => {
    const backup = backupOfThisDevice();
    vi.mocked(pickBackupFile).mockResolvedValue({ name: "mine.json", text: backup.json });
    vi.mocked(applyImport).mockImplementation(() => {
      addProfile("dog");
      earnSticker("shape-sorter");
      return { ok: true };
    });
    const scene = createScene();
    const panel = new SettingsPanel(scene as never);
    openBackupPage(scene, panel);

    triggerPointerdown(findTextByLabel(scene, "Restore from a file") as MockGameObject);
    await settle();
    triggerPointerdown(findTextByLabel(scene, "Replace") as MockGameObject);

    expect(applyImport).toHaveBeenCalledWith("replace", backup.envelope.payload);
    // A replace reports what the device now holds, not what it added.
    expect(panel.backupState().backupResult).toBe("Restored 2 profiles and 1 sticker.");
    expect(scene.time.delayedCall).toHaveBeenCalledWith(900, reloadApp);
  });

  it("says a merge added nothing when the file held nothing new", async () => {
    const backup = backupOfThisDevice();
    vi.mocked(pickBackupFile).mockResolvedValue({ name: "mine.json", text: backup.json });
    // An import that writes the same save changes no count: the line has to say
    // so rather than repeating the file's totals.
    vi.mocked(applyImport).mockReturnValue({ ok: true });
    const scene = createScene();
    const panel = new SettingsPanel(scene as never);
    openBackupPage(scene, panel);

    triggerPointerdown(findTextByLabel(scene, "Restore from a file") as MockGameObject);
    await settle();
    triggerPointerdown(findTextByLabel(scene, "Merge") as MockGameObject);

    expect(panel.backupState().backupResult).toBe(
      "Merged 0 profiles and 0 stickers into this one.",
    );
  });

  it("writes nothing when the choice card is dismissed (AC-5)", async () => {
    const backup = backupOfThisDevice();
    vi.mocked(pickBackupFile).mockResolvedValue({ name: "mine.json", text: backup.json });
    const scene = createScene();
    const panel = new SettingsPanel(scene as never);
    openBackupPage(scene, panel);

    triggerPointerdown(findTextByLabel(scene, "Restore from a file") as MockGameObject);
    await settle();
    expect(panel.backupState().choices).toHaveLength(2);

    // The card's backdrop is the published way out: a parent who taps away from
    // Merge and Replace has decided not to restore.
    const card = getRectangles(scene).find((rect) => rect.args?.[5] === OVERLAY_ALPHA);
    if (!card) throw new Error("the choice card should draw its own backdrop");
    triggerPointerdown(card.object);

    expect(applyImport, "declining writes nothing").not.toHaveBeenCalled();
    expect(panel.backupState().choices).toEqual([]);
    // The page itself is untouched, so the choice can be made again.
    expect(findTextByLabel(scene, "Save a backup")).toBeDefined();
    expect(findTextByLabel(scene, "Restore from a file")).toBeDefined();
    expect(reloadApp).not.toHaveBeenCalled();
  });

  it("refuses a damaged file on the result line, with no write and no reload", async () => {
    const backup = backupOfThisDevice();
    const damaged = JSON.stringify({ ...backup.envelope, checksum: "fnv1a64:0" });
    vi.mocked(pickBackupFile).mockResolvedValue({ name: "damaged.json", text: damaged });
    const scene = createScene();
    const panel = new SettingsPanel(scene as never);
    openBackupPage(scene, panel);

    triggerPointerdown(findTextByLabel(scene, "Restore from a file") as MockGameObject);
    await settle();

    const sentence = refusalFor("checksum-mismatch").message;
    expect(findResultLine(scene)?.setText).toHaveBeenCalledWith(sentence);
    expect(panel.backupState().backupResult).toBe(sentence);
    expect(findTextByLabel(scene, "Merge"), "no choice to make").toBeUndefined();
    expect(applyImport).not.toHaveBeenCalled();
    expect(reloadApp).not.toHaveBeenCalled();
  });

  it("says nothing was restored when the picker came back empty", async () => {
    vi.mocked(pickBackupFile).mockResolvedValue(null);
    const scene = createScene();
    const panel = new SettingsPanel(scene as never);
    openBackupPage(scene, panel);

    triggerPointerdown(findTextByLabel(scene, "Restore from a file") as MockGameObject);
    await settle();

    expect(findResultLine(scene)?.setText).toHaveBeenCalledWith("Nothing was restored.");
    expect(panel.backupState().backupResult).toBe("Nothing was restored.");
    expect(applyImport).not.toHaveBeenCalled();
    expect(reloadApp).not.toHaveBeenCalled();
  });

  it("puts a refused import's sentence on the line and does not reload", async () => {
    const backup = backupOfThisDevice();
    vi.mocked(pickBackupFile).mockResolvedValue({ name: "mine.json", text: backup.json });
    vi.mocked(applyImport).mockReturnValue({ ok: false, refusal: refusalFor("profile-cap") });
    const scene = createScene();
    const panel = new SettingsPanel(scene as never);
    openBackupPage(scene, panel);

    triggerPointerdown(findTextByLabel(scene, "Restore from a file") as MockGameObject);
    await settle();
    const mergeButton = lastTextObject(scene, "Merge");
    triggerPointerdown(mergeButton);

    const sentence = refusalFor("profile-cap").message;
    expect(mergeButton.destroy, "the card closes on a choice").toHaveBeenCalled();
    expect(findResultLine(scene)?.setText).toHaveBeenCalledWith(sentence);
    expect(panel.backupState().backupResult).toBe(sentence);
    expect(reloadApp).not.toHaveBeenCalled();
  });

  it("opens one picker, not two, when the row is tapped twice", async () => {
    // A picker that never settles: the first tap is still in flight.
    vi.mocked(pickBackupFile).mockReturnValue(new Promise(() => undefined));
    const scene = createScene();
    const panel = new SettingsPanel(scene as never);
    openBackupPage(scene, panel);

    const row = findTextByLabel(scene, "Restore from a file") as MockGameObject;
    triggerPointerdown(row);
    triggerPointerdown(row);
    await settle();

    expect(pickBackupFile).toHaveBeenCalledTimes(1);
  });

  it("keeps the buffer line up while a picker is pending", async () => {
    let resolvePick: ((picked: { name: string; text: string } | null) => void) | undefined;
    vi.mocked(pickBackupFile).mockReturnValue(
      new Promise((resolve) => {
        resolvePick = resolve;
      }),
    );
    const scene = createScene();
    const panel = new SettingsPanel(scene as never);
    openBackupPage(scene, panel);

    triggerPointerdown(findTextByLabel(scene, "Restore from a file") as MockGameObject);
    await settle();

    // The panel stays exactly as it is: the native dialog is the feedback.
    expect(panel.backupState().page).toBe(1);
    expect(findTextByLabel(scene, "Save a backup")).toBeDefined();
    expect(panel.backupState().backupResult).toBe("");

    resolvePick?.(null);
    await settle();

    expect(panel.backupState().backupResult).toBe("Nothing was restored.");
  });
});
