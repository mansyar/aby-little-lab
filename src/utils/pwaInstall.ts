/**
 * PWA install-state tracking.
 *
 * Pure, testable logic that decides which install UI (if any) the Settings
 * panel should show, plus a browser-event tracker that feeds it.
 *
 * States:
 * - "installable": Chrome/Edge/Android captured a beforeinstallprompt.
 * - "ios-howto": iOS Safari, which has no install prompt; show instructions.
 * - "hidden": already installed/standalone, or unsupported.
 *
 * Lifetime: install events are page facts, not panel facts. The browser fires
 * beforeinstallprompt once per page load, usually before the parental lock is
 * even held, so capture starts at boot (`initInstallPrompt`) and the Settings
 * panel borrows the tracker that results instead of owning one. A tracker
 * created per panel would subscribe after the only event that matters.
 */

export type InstallUiState = "installable" | "ios-howto" | "hidden";

export interface InstallStateInput {
  /** True once a beforeinstallprompt event has been captured. */
  promptAvailable: boolean;
  /** True once an appinstalled event has fired. */
  installed: boolean;
  /** True when the browser is iOS Safari (or standalone iOS). */
  isIos: boolean;
  /** True when the app is already running in standalone mode. */
  isStandalone: boolean;
}

/** Decides which install control to show from the raw state flags. */
export function getInstallUiState(input: InstallStateInput): InstallUiState {
  if (input.installed || input.isStandalone) return "hidden";
  if (input.promptAvailable) return "installable";
  if (input.isIos) return "ios-howto";
  return "hidden";
}

/** Detects iOS from a user agent string. */
export function detectIOS(userAgent: string): boolean {
  return /iPhone|iPad|iPod/.test(userAgent);
}

/** Browser wiring needed by the tracker, injected for testability. */
export interface InstallTrackerDeps {
  userAgent: string;
  /** True when the app runs in standalone/installed mode. */
  isStandalone: () => boolean;
  addEventListener: (
    type: "beforeinstallprompt" | "appinstalled",
    listener: (event: unknown) => void,
  ) => void;
  removeEventListener: (
    type: "beforeinstallprompt" | "appinstalled",
    listener: (event: unknown) => void,
  ) => void;
}

export interface InstallTracker {
  /** Current install UI state. */
  getState(): InstallUiState;
  /** Shows the deferred install prompt; resolves true if it was shown. */
  prompt(): Promise<boolean>;
  /** Stops tracking browser install events. */
  destroy(): void;
}

/** Captured beforeinstallprompt event (Chrome's proprietary shape). */
interface BeforeInstallPromptLike {
  preventDefault: () => void;
  prompt: () => Promise<void>;
}

/** Tracks install events and exposes the current install UI state. */
export function createInstallTracker(deps: InstallTrackerDeps): InstallTracker {
  let promptAvailable = false;
  let installed = false;
  let deferredPrompt: BeforeInstallPromptLike | null = null;

  const onBeforeInstallPrompt = (event: unknown): void => {
    const promptEvent = event as BeforeInstallPromptLike;
    promptEvent.preventDefault();
    deferredPrompt = promptEvent;
    promptAvailable = true;
  };

  const onAppInstalled = (): void => {
    installed = true;
  };

  deps.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  deps.addEventListener("appinstalled", onAppInstalled);

  return {
    getState(): InstallUiState {
      return getInstallUiState({
        promptAvailable,
        installed,
        isIos: detectIOS(deps.userAgent),
        isStandalone: deps.isStandalone(),
      });
    },
    async prompt(): Promise<boolean> {
      if (!deferredPrompt) return false;
      const promptEvent = deferredPrompt;
      deferredPrompt = null;
      await promptEvent.prompt();
      return true;
    },
    destroy(): void {
      deps.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      deps.removeEventListener("appinstalled", onAppInstalled);
    },
  };
}

/**
 * True where the window can carry install-event listeners. Scene suites stub a
 * partial `window` and non-DOM hosts expose none at all, so the browser adapter
 * goes inert there rather than throwing - the same capability guard
 * `playTimeLogic` applies to visibility events.
 */
function canObserveInstallEvents(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    typeof window.addEventListener === "function" &&
    typeof window.removeEventListener === "function"
  );
}

/**
 * Builds a tracker against the real browser globals.
 *
 * Deliberately thin: everything testable stays in `createInstallTracker`, which
 * takes the same wiring as an injected object. Where the globals are absent or
 * partial the tracker attaches nothing and reports "hidden", which is what an
 * environment that cannot install the app should say.
 */
export function createBrowserInstallTracker(): InstallTracker {
  if (!canObserveInstallEvents()) {
    return createInstallTracker({
      userAgent: "",
      isStandalone: () => false,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    });
  }

  return createInstallTracker({
    userAgent: navigator.userAgent,
    isStandalone: () =>
      typeof window.matchMedia === "function" &&
      window.matchMedia("(display-mode: standalone)").matches,
    addEventListener: (type, listener) => window.addEventListener(type, listener),
    removeEventListener: (type, listener) => window.removeEventListener(type, listener),
  });
}

/** The page's tracker, created on first use and kept for the page's life. */
let installPromptTracker: InstallTracker | undefined;

/** Returns the page's tracker, creating and storing it when it is missing. */
function resolveInstallPromptTracker(): InstallTracker {
  const existing = installPromptTracker;
  if (existing !== undefined) return existing;

  const created = createBrowserInstallTracker();
  installPromptTracker = created;
  return created;
}

/**
 * Starts install-event capture for the page. Call once at boot, before any
 * scene can open Settings; calling it again is a no-op, so the page never
 * registers a second pair of listeners.
 */
export function initInstallPrompt(): void {
  resolveInstallPromptTracker();
}

/**
 * Returns the page's install tracker, creating it on first use so an entry
 * point that never ran {@link initInstallPrompt} (a Hub-only host, or a test
 * that builds the panel first) still gets a working one.
 */
export function getInstallPromptTracker(): InstallTracker {
  return resolveInstallPromptTracker();
}
