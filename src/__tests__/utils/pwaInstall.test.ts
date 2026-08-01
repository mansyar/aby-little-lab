import {
  createInstallTracker,
  detectIOS,
  getInstallUiState,
  type InstallTrackerDeps,
} from "../../utils/pwaInstall";

type ListenerMap = Map<string, (event?: unknown) => void>;

/** Builds fake browser wiring that records added/removed listeners. */
function createFakeDeps(userAgent: string, standalone = false): {
  deps: InstallTrackerDeps;
  listeners: ListenerMap;
  promptEvent: {
    preventDefault: ReturnType<typeof vi.fn>;
    prompt: ReturnType<typeof vi.fn>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
  };
} {
  const listeners: ListenerMap = new Map();
  const promptEvent = {
    preventDefault: vi.fn(),
    prompt: vi.fn().mockResolvedValue(undefined),
    userChoice: Promise.resolve({ outcome: "accepted" as const }),
  };
  return {
    deps: {
      userAgent,
      isStandalone: () => standalone,
      addEventListener: vi.fn((type: string, listener: () => void) => {
        listeners.set(type, listener);
      }),
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
  it.each(["iPhone Safari", "iPad", "iPod touch"])(
    "detects iOS user agents (%s)",
    (userAgent) => {
      expect(detectIOS(userAgent)).toBe(true);
    },
  );

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
    appInstalled?.();

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

    expect(deps.removeEventListener).toHaveBeenCalledWith("beforeinstallprompt", expect.any(Function));
    expect(deps.removeEventListener).toHaveBeenCalledWith("appinstalled", expect.any(Function));
    expect(listeners.size).toBe(0);
  });
});
