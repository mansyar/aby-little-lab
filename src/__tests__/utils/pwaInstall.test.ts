import type { Mock } from "vitest";
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
