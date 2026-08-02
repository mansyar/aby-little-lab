/**
 * PWA registration bridge.
 *
 * Wraps vite-plugin-pwa's `registerSW` (virtual:pwa-register) into a
 * testable, scene-aware bridge. Toast-worthy events (`needRefresh`,
 * `offlineReady`) are delivered only while the Hub is active; events that
 * fire mid-game are queued and flushed when the Hub becomes active again.
 *
 * The `registerSW` implementation is injected so unit tests can pass a fake
 * instead of mocking the virtual module.
 */

export type PwaEvent = "needRefresh" | "offlineReady";

export type UpdateSW = (reloadPage?: boolean) => Promise<void>;

export interface RegisterSWOptions {
  immediate?: boolean;
  onNeedRefresh?: () => void;
  onOfflineReady?: () => void;
}

export type RegisterSWFn = (options: RegisterSWOptions) => UpdateSW;

export interface PwaBridge {
  /** Subscribes a listener to toast events; returns an unsubscribe function. */
  subscribe(listener: (event: PwaEvent) => void): () => void;
  /**
   * Marks the Hub scene as active/inactive. Activating flushes any events
   * that were queued while the Hub was not active.
   */
  setHubActive(active: boolean): void;
  /** Reloads the page so the new service worker version takes over. */
  updateNow(): void;
  /** True once a new app version has been detected (until the page reloads). */
  updateAvailable(): boolean;
  /** True once the once-only "ready to play offline" event has been delivered. */
  offlineReadyShown(): boolean;
}

let appBridge: PwaBridge | null = null;

/** Initializes the app-wide bridge; call once at startup with the real registerSW. */
export function initPwaBridge(registerSW: RegisterSWFn): PwaBridge {
  appBridge = createPwaBridge(registerSW);
  return appBridge;
}

/** Returns the app-wide bridge, or null before initialization. */
export function getPwaBridge(): PwaBridge | null {
  return appBridge;
}

/** Creates a PWA bridge backed by the given registerSW implementation. */
export function createPwaBridge(registerSW: RegisterSWFn): PwaBridge {
  const listeners = new Set<(event: PwaEvent) => void>();
  const queue: PwaEvent[] = [];
  let hubActive = false;
  let updateAvailableFlag = false;
  let offlineShownFlag = false;

  function deliver(event: PwaEvent): void {
    for (const listener of listeners) listener(event);
  }

  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh: () => {
      updateAvailableFlag = true;
      if (hubActive) {
        deliver("needRefresh");
      } else if (!queue.includes("needRefresh")) {
        queue.push("needRefresh");
      }
    },
    onOfflineReady: () => {
      if (offlineShownFlag) return;
      offlineShownFlag = true;
      if (hubActive) {
        deliver("offlineReady");
      } else if (!queue.includes("offlineReady")) {
        queue.push("offlineReady");
      }
    },
  });

  return {
    subscribe(listener: (event: PwaEvent) => void): () => void {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    setHubActive(active: boolean): void {
      hubActive = active;
      if (!active) return;
      while (queue.length > 0) {
        const event = queue.shift();
        if (event) deliver(event);
      }
    },
    updateNow(): void {
      void updateSW(true).catch(() => undefined);
    },
    updateAvailable(): boolean {
      return updateAvailableFlag;
    },
    offlineReadyShown(): boolean {
      return offlineShownFlag;
    },
  };
}
