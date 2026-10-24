import type { Mock } from "vitest";
import mainSource from "../../main.ts?raw";
import {
  createBrowserInstallTracker,
  createInstallTracker,
  detectIOS,
  getInstallUiState,
  type InstallTrackerDeps,
} from "../../utils/pwaInstall";

type ListenerMap = Map<string, (event: unknown) => void>;

/** Builds fake browser wiring that records added/removed listeners. */
function createFakeDeps(
  userAgent: string,
  standalone = false,
): {
  deps: InstallTrackerDeps;
  listeners: ListenerMap;
  promptEvent: {
    preventDefault: Mock<() => void>;
    prompt: Mock<() => Promise<void>>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
  };
} {
  const listeners: ListenerMap = new Map();
  const promptEvent = {
    preventDefault: vi.fn(() => {}),
    prompt: vi.fn((): Promise<void> => Promise.resolve()),
    userChoice: Promise.resolve({ outcome: "accepted" as const }),
  };
  return {
    deps: {
      userAgent,
      isStandalone: () => standalone,
      addEventListener: vi.fn(
        (type: "beforeinstallprompt" | "appinstalled", listener: (event: unknown) => void) => {
          listeners.set(type, listener);
        },
      ),
      removeEventListener: vi.fn((type: string) => {
        listeners.delete(type);
      }),
    },
    listeners,
    promptEvent,
  };
}

/** Emits a fake beforeinstallprompt event with the given shape. */
function emitBeforeInstallPrompt(
  listeners: ListenerMap,
  event: { preventDefault?: () => void; prompt?: () => Promise<void> },
): void {
  const listener = listeners.get("beforeinstallprompt");
  if (!listener) throw new Error("Expected beforeinstallprompt listener");
  listener(event);
}

/** Minimal `window` double carrying only what the browser adapter reads. */
interface WindowDouble {
  addEventListener: Mock<(type: string, listener: (event: unknown) => void) => void>;
  removeEventListener: Mock<(type: string) => void>;
  matchMedia: Mock<(query: string) => { matches: boolean }>;
}

/**
 * Stubs the globals the browser adapter reaches through, and hands back the
 * window double so a test can count the listeners it registered.
 */
function stubBrowser(options: { standalone?: boolean; userAgent?: string } = {}): WindowDouble {
  const windowDouble: WindowDouble = {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    matchMedia: vi.fn(() => ({ matches: options.standalone ?? false })),
  };
  vi.stubGlobal("window", windowDouble);
  vi.stubGlobal("navigator", { userAgent: options.userAgent ?? "Android Chrome" });
  return windowDouble;
}

/** Import alias for the module's own type, used by the dynamic-import helper. */
type PwaInstallModule = typeof import("../../utils/pwaInstall");

/** Imports a fresh copy so the page-lifetime holder starts empty. */
async function loadFreshModule(): Promise<PwaInstallModule> {
  vi.resetModules();
  return import("../../utils/pwaInstall");
}

describe("getInstallUiState", () => {
  it("shows the install button when the install prompt is available", () => {
    expect(
      getInstallUiState({
        promptAvailable: true,
        installed: false,
        isIos: false,
        isStandalone: false,
      }),
    ).toBe("installable");
  });

  it("shows the iOS how-to when on iOS without a prompt", () => {
    expect(
      getInstallUiState({
        promptAvailable: false,
        installed: false,
        isIos: true,
        isStandalone: false,
      }),
    ).toBe("ios-howto");
  });

  it("hides the control when already installed", () => {
    expect(
      getInstallUiState({
        promptAvailable: true,
        installed: true,
        isIos: false,
        isStandalone: false,
      }),
    ).toBe("hidden");
  });

  it("hides the control when running standalone", () => {
    expect(
      getInstallUiState({
        promptAvailable: true,
        installed: false,
        isIos: false,
        isStandalone: true,
      }),
    ).toBe("hidden");
  });

  it("hides the control on unsupported platforms with no prompt", () => {
    expect(
      getInstallUiState({
        promptAvailable: false,
        installed: false,
        isIos: false,
        isStandalone: false,
      }),
    ).toBe("hidden");
  });
});

describe("detectIOS", () => {
  it.each(["iPhone Safari", "iPad", "iPod touch"])("detects iOS user agents (%s)", (userAgent) => {
    expect(detectIOS(userAgent)).toBe(true);
  });

  it.each(["Android Chrome", "Mozilla/5.0 (Windows NT 10.0)", "Macintosh"])(
    "rejects non-iOS user agents (%s)",
    (userAgent) => {
      expect(detectIOS(userAgent)).toBe(false);
    },
  );
});

describe("createInstallTracker", () => {
  it("reports hidden before any install signal on Android", () => {
    const { deps } = createFakeDeps("Android Chrome");
    const tracker = createInstallTracker(deps);

    expect(tracker.getState()).toBe("hidden");
  });

  it("reports ios-howto on iOS before any install signal", () => {
    const { deps } = createFakeDeps("iPhone Safari");
    const tracker = createInstallTracker(deps);

    expect(tracker.getState()).toBe("ios-howto");
  });

  it("captures beforeinstallprompt and becomes installable", () => {
    const { deps, listeners, promptEvent } = createFakeDeps("Android Chrome");
    const tracker = createInstallTracker(deps);

    emitBeforeInstallPrompt(listeners, promptEvent);

    expect(promptEvent.preventDefault).toHaveBeenCalled();
    expect(tracker.getState()).toBe("installable");
  });

  it("hides after appinstalled fires", () => {
    const { deps, listeners, promptEvent } = createFakeDeps("Android Chrome");
    const tracker = createInstallTracker(deps);
    emitBeforeInstallPrompt(listeners, promptEvent);

    const appInstalled = listeners.get("appinstalled");
    expect(appInstalled).toBeDefined();
    appInstalled?.(undefined);

    expect(tracker.getState()).toBe("hidden");
  });

  it("prompt() invokes the captured prompt and resolves true", async () => {
    const { deps, listeners, promptEvent } = createFakeDeps("Android Chrome");
    const tracker = createInstallTracker(deps);
    emitBeforeInstallPrompt(listeners, promptEvent);

    const result = await tracker.prompt();

    expect(promptEvent.prompt).toHaveBeenCalledTimes(1);
    expect(result).toBe(true);
  });

  it("prompt() resolves false when no prompt was captured", async () => {
    const { deps } = createFakeDeps("Android Chrome");
    const tracker = createInstallTracker(deps);

    await expect(tracker.prompt()).resolves.toBe(false);
  });

  it("stops reporting installable once the captured prompt has been spent", async () => {
    const { deps, listeners, promptEvent } = createFakeDeps("Android Chrome");
    const tracker = createInstallTracker(deps);
    emitBeforeInstallPrompt(listeners, promptEvent);

    await tracker.prompt();

    expect(tracker.getState()).toBe("hidden");
  });

  it("keeps reporting the iOS how-to once the captured prompt has been spent", async () => {
    const { deps, listeners, promptEvent } = createFakeDeps("iPhone Safari");
    const tracker = createInstallTracker(deps);
    emitBeforeInstallPrompt(listeners, promptEvent);

    await tracker.prompt();

    // A spent prompt removes the button; it does not hide the instructions.
    expect(tracker.getState()).toBe("ios-howto");
  });

  it("resolves false on a second prompt call without throwing", async () => {
    const { deps, listeners, promptEvent } = createFakeDeps("Android Chrome");
    const tracker = createInstallTracker(deps);
    emitBeforeInstallPrompt(listeners, promptEvent);

    await tracker.prompt();

    await expect(tracker.prompt()).resolves.toBe(false);
    // The event is single-use, so the browser was asked exactly once.
    expect(promptEvent.prompt).toHaveBeenCalledTimes(1);
  });

  it("resolves false and stays spent when the browser refuses the prompt", async () => {
    const { deps, listeners, promptEvent } = createFakeDeps("Android Chrome");
    promptEvent.prompt.mockRejectedValue(new Error("prompt() needs a user gesture"));
    const tracker = createInstallTracker(deps);
    emitBeforeInstallPrompt(listeners, promptEvent);

    await expect(tracker.prompt()).resolves.toBe(false);
    expect(tracker.getState()).toBe("hidden");
  });

  it("offers the prompt again when the browser captures a new event", async () => {
    const { deps, listeners } = createFakeDeps("Android Chrome");
    const tracker = createInstallTracker(deps);
    const firstEvent = { preventDefault: vi.fn(), prompt: vi.fn(() => Promise.resolve()) };
    const secondEvent = { preventDefault: vi.fn(), prompt: vi.fn(() => Promise.resolve()) };

    emitBeforeInstallPrompt(listeners, firstEvent);
    await expect(tracker.prompt()).resolves.toBe(true);
    expect(tracker.getState()).toBe("hidden");

    emitBeforeInstallPrompt(listeners, secondEvent);
    expect(tracker.getState()).toBe("installable");
    await expect(tracker.prompt()).resolves.toBe(true);
    expect(secondEvent.prompt).toHaveBeenCalledTimes(1);
  });

  it("destroy() removes both browser listeners", () => {
    const { deps, listeners, promptEvent } = createFakeDeps("Android Chrome");
    const tracker = createInstallTracker(deps);
    emitBeforeInstallPrompt(listeners, promptEvent);

    tracker.destroy();

    expect(deps.removeEventListener).toHaveBeenCalledWith(
      "beforeinstallprompt",
      expect.any(Function),
    );
    expect(deps.removeEventListener).toHaveBeenCalledWith("appinstalled", expect.any(Function));
    expect(listeners.size).toBe(0);
  });
});

describe("createBrowserInstallTracker", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("subscribes to both install events and reports hidden before any signal", () => {
    const windowDouble = stubBrowser();
    const tracker = createBrowserInstallTracker();

    expect(windowDouble.addEventListener).toHaveBeenCalledWith(
      "beforeinstallprompt",
      expect.any(Function),
    );
    expect(windowDouble.addEventListener).toHaveBeenCalledWith(
      "appinstalled",
      expect.any(Function),
    );
    expect(tracker.getState()).toBe("hidden");
  });

  it("reads the user agent for the iOS how-to", () => {
    stubBrowser({ userAgent: "iPhone Safari" });

    expect(createBrowserInstallTracker().getState()).toBe("ios-howto");
  });

  it("treats the standalone display mode as installed", () => {
    stubBrowser({ userAgent: "iPhone Safari", standalone: true });

    expect(createBrowserInstallTracker().getState()).toBe("hidden");
  });

  it("forwards teardown to the window listeners it registered", () => {
    const windowDouble = stubBrowser();
    const tracker = createBrowserInstallTracker();

    tracker.destroy();

    expect(windowDouble.removeEventListener).toHaveBeenCalledWith(
      "beforeinstallprompt",
      expect.any(Function),
    );
    expect(windowDouble.removeEventListener).toHaveBeenCalledWith(
      "appinstalled",
      expect.any(Function),
    );
  });

  it("stays inert when the window cannot carry listeners", () => {
    vi.stubGlobal("window", { matchMedia: () => ({ matches: false }) });
    vi.stubGlobal("navigator", { userAgent: "Android Chrome" });

    const tracker = createBrowserInstallTracker();

    expect(tracker.getState()).toBe("hidden");
    expect(() => tracker.destroy()).not.toThrow();
  });

  it("stays inert when there is no browser at all", () => {
    vi.stubGlobal("window", undefined);
    vi.stubGlobal("navigator", undefined);

    const tracker = createBrowserInstallTracker();

    expect(tracker.getState()).toBe("hidden");
    expect(() => tracker.destroy()).not.toThrow();
  });
});

describe("install prompt is not persisted", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("neither reads nor writes storage across capture, prompt and teardown", async () => {
    const listeners: ListenerMap = new Map();
    vi.stubGlobal("window", {
      addEventListener: (type: string, listener: (event: unknown) => void) => {
        listeners.set(type, listener);
      },
      removeEventListener: (type: string) => {
        listeners.delete(type);
      },
      matchMedia: () => ({ matches: false }),
    });
    vi.stubGlobal("navigator", { userAgent: "Android Chrome" });
    const storage = {
      clear: vi.fn(),
      getItem: vi.fn(),
      key: vi.fn(),
      removeItem: vi.fn(),
      setItem: vi.fn(),
    };
    vi.stubGlobal("localStorage", storage);

    // One dismissal from end to end, through the real browser adapter.
    const tracker = createBrowserInstallTracker();
    emitBeforeInstallPrompt(listeners, {
      preventDefault: () => undefined,
      prompt: () => Promise.resolve(),
    });
    await expect(tracker.prompt()).resolves.toBe(true);

    // AC-5 covers the read path too: the state is derived from the recorded
    // flags and the browser's own standalone mode, never from storage.
    expect(tracker.getState()).toBe("hidden");

    // The second callback route must be as storage-free as the first.
    const appInstalled = listeners.get("appinstalled");
    expect(appInstalled).toBeDefined();
    appInstalled?.(undefined);

    tracker.destroy();

    // AC-5: the page carries the browser's own state and remembers nothing.
    expect(storage.getItem).not.toHaveBeenCalled();
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(storage.removeItem).not.toHaveBeenCalled();
    expect(storage.clear).not.toHaveBeenCalled();
    expect(storage.key).not.toHaveBeenCalled();
  });
});

describe("app-lifetime install tracker", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the same tracker on every call", async () => {
    stubBrowser();
    const pwa = await loadFreshModule();

    expect(pwa.getInstallPromptTracker()).toBe(pwa.getInstallPromptTracker());
  });

  it("registers one listener pair per page however often init runs", async () => {
    const windowDouble = stubBrowser();
    const pwa = await loadFreshModule();

    pwa.initInstallPrompt();
    pwa.initInstallPrompt();

    expect(windowDouble.addEventListener).toHaveBeenCalledTimes(2);
    expect(pwa.getInstallPromptTracker()).toBe(pwa.getInstallPromptTracker());
  });

  it("creates the tracker lazily for an entry point that skips init", async () => {
    const windowDouble = stubBrowser();
    const pwa = await loadFreshModule();

    expect(windowDouble.addEventListener).not.toHaveBeenCalled();
    expect(pwa.getInstallPromptTracker().getState()).toBe("hidden");
    expect(windowDouble.addEventListener).toHaveBeenCalledTimes(2);
  });
});

describe("boot wiring", () => {
  /**
   * Capture is a page fact, so the boot module is the code that starts it.
   * Every other suite injects its own tracker and the lazy getter covers the
   * rest, so only the real entry point can be wrong here.
   */
  it("starts install capture before the game is constructed", () => {
    // Match the statement, not the token: a comment mentioning the call must
    // not satisfy this case after the real line has been deleted.
    const call = /^initInstallPrompt\(\);$/m.exec(mainSource);
    const indexOfCall = call?.index ?? -1;

    expect(indexOfCall).toBeGreaterThan(-1);
    expect(mainSource.indexOf("new Phaser.Game(")).toBeGreaterThan(indexOfCall);
  });
});
