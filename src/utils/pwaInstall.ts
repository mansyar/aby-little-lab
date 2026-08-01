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
  addEventListener: (type: "beforeinstallprompt" | "appinstalled", listener: () => void) => void;
  removeEventListener: (
    type: "beforeinstallprompt" | "appinstalled",
    listener: () => void,
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
      await deferredPrompt.prompt();
      return true;
    },
    destroy(): void {
      deps.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      deps.removeEventListener("appinstalled", onAppInstalled);
    },
  };
}
