/**
 * PWA install-state tracking.
 *
 * Pure, testable logic that decides which install UI (if any) the Settings
 * panel should show, plus a browser-event tracker that feeds it.
 *
 * States:
 * - "installable": Chrome/Edge/Android holds an unused captured prompt.
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
  /**
   * True while a captured beforeinstallprompt is still unused. Spending it in
   * `prompt()` clears this; only a fresh browser event sets it again.
   */
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
  /**
   * Shows the deferred install prompt; resolves true if it was shown. The
   * captured event is single-use, so this ends the "installable" state.
   */
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
  // "A captured, unused prompt exists" - the flag and the deferred event are
  // spent together, so the row stops advertising a prompt that has been used.
  // Only a fresh beforeinstallprompt in `onBeforeInstallPrompt` restores it.
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
      const promptEvent = deferredPrompt;
      if (!promptEvent) return false;
      // Claiming the event is what spends it: the browser cannot re-offer a
      // captured prompt, so availability drops before the dialog is awaited.
      deferredPrompt = null;
      promptAvailable = false;
      try {
        await promptEvent.prompt();
      } catch {
        // A browser may refuse when the tap's gesture is no longer trusted.
        // Nothing was shown, and the event is single-use regardless, so report
        // the failure to the caller instead of throwing at a child's tap.
        return false;
      }
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
 * Returns the page's install tracker, creating it on first use so a caller that
 * never ran {@link initInstallPrompt} - for example a test that constructs the
 * panel before any boot code has run - still gets a working one.
 */
export function getInstallPromptTracker(): InstallTracker {
  return resolveInstallPromptTracker();
}
