import { createPwaBridge, type PwaBridge, type RegisterSWFn } from "../../utils/pwaBridge";

/** Captures the callbacks the bridge passes to registerSW. */
interface CapturedCallbacks {
  immediate?: boolean;
  onNeedRefresh?: () => void;
  onOfflineReady?: () => void;
}

function createFakeRegisterSW(): {
  registerSW: RegisterSWFn;
  captured: CapturedCallbacks;
  updateSW: ReturnType<RegisterSWFn>;
} {
  const captured: CapturedCallbacks = {};
  const updateSW = vi.fn<ReturnType<RegisterSWFn>>(() => Promise.resolve());
  const registerSW: RegisterSWFn = (options) => {
    captured.immediate = options.immediate;
    captured.onNeedRefresh = options.onNeedRefresh;
    captured.onOfflineReady = options.onOfflineReady;
    return updateSW;
  };
  return { registerSW, captured, updateSW };
}

describe("PWA registration bridge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("registers the service worker with immediate activation", () => {
    const { registerSW, captured } = createFakeRegisterSW();

    createPwaBridge(registerSW);

    expect(captured.immediate).toBe(true);
  });

  it("exposes the update action to reload with the new version", () => {
    const { registerSW, updateSW } = createFakeRegisterSW();
    const bridge = createPwaBridge(registerSW);

    bridge.updateNow();

    expect(updateSW).toHaveBeenCalledWith(true);
  });

  describe("event delivery", () => {
    it("delivers needRefresh to subscribers when the hub is active", () => {
      const { registerSW, captured } = createFakeRegisterSW();
      const bridge = createPwaBridge(registerSW);
      const listener = vi.fn();
      bridge.subscribe(listener);
      bridge.setHubActive(true);

      captured.onNeedRefresh?.();

      expect(listener).toHaveBeenCalledWith("needRefresh");
    });

    it("queues needRefresh while the hub is inactive and flushes it on activation", () => {
      const { registerSW, captured } = createFakeRegisterSW();
      const bridge = createPwaBridge(registerSW);
      const listener = vi.fn();
      bridge.subscribe(listener);
      // Hub not active yet — event must be queued.
      captured.onNeedRefresh?.();
      expect(listener).not.toHaveBeenCalled();

      bridge.setHubActive(true);

      expect(listener).toHaveBeenCalledWith("needRefresh");
    });

    it("delivers offlineReady to subscribers when the hub is active", () => {
      const { registerSW, captured } = createFakeRegisterSW();
      const bridge = createPwaBridge(registerSW);
      const listener = vi.fn();
      bridge.subscribe(listener);
      bridge.setHubActive(true);

      captured.onOfflineReady?.();

      expect(listener).toHaveBeenCalledWith("offlineReady");
    });

    it("queues offlineReady while the hub is inactive and flushes it on activation", () => {
      const { registerSW, captured } = createFakeRegisterSW();
      const bridge = createPwaBridge(registerSW);
      const listener = vi.fn();
      bridge.subscribe(listener);
      captured.onOfflineReady?.();
      expect(listener).not.toHaveBeenCalled();

      bridge.setHubActive(true);

      expect(listener).toHaveBeenCalledWith("offlineReady");
    });

    it("does not deliver queued events while the hub remains inactive", () => {
      const { registerSW, captured } = createFakeRegisterSW();
      const bridge = createPwaBridge(registerSW);
      const listener = vi.fn();
      bridge.subscribe(listener);

      captured.onNeedRefresh?.();
      captured.onOfflineReady?.();

      expect(listener).not.toHaveBeenCalled();
    });

    it("stops delivering events after unsubscribing", () => {
      const { registerSW, captured } = createFakeRegisterSW();
      const bridge = createPwaBridge(registerSW);
      const listener = vi.fn();
      const unsubscribe = bridge.subscribe(listener);
      bridge.setHubActive(true);
      unsubscribe();

      captured.onNeedRefresh?.();

      expect(listener).not.toHaveBeenCalled();
    });

    it("delivers to all subscribers", () => {
      const { registerSW, captured } = createFakeRegisterSW();
      const bridge = createPwaBridge(registerSW);
      const first = vi.fn();
      const second = vi.fn();
      bridge.subscribe(first);
      bridge.subscribe(second);
      bridge.setHubActive(true);

      captured.onNeedRefresh?.();

      expect(first).toHaveBeenCalledWith("needRefresh");
      expect(second).toHaveBeenCalledWith("needRefresh");
    });
  });

  describe("once-only offline toast", () => {
    it("reports the offline toast as not shown before any offlineReady event", () => {
      const { registerSW } = createFakeRegisterSW();
      const bridge: PwaBridge = createPwaBridge(registerSW);

      expect(bridge.offlineReadyShown()).toBe(false);
    });

    it("reports the offline toast as shown after offlineReady fires", () => {
      const { registerSW, captured } = createFakeRegisterSW();
      const bridge = createPwaBridge(registerSW);

      captured.onOfflineReady?.();

      expect(bridge.offlineReadyShown()).toBe(true);
    });

    it("delivers offlineReady at most once even when fired repeatedly", () => {
      const { registerSW, captured } = createFakeRegisterSW();
      const bridge = createPwaBridge(registerSW);
      const listener = vi.fn();
      bridge.subscribe(listener);
      bridge.setHubActive(true);

      captured.onOfflineReady?.();
      captured.onOfflineReady?.();
      captured.onOfflineReady?.();

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith("offlineReady");
    });

    it("never delivers a duplicate offlineReady that arrived while inactive", () => {
      const { registerSW, captured } = createFakeRegisterSW();
      const bridge = createPwaBridge(registerSW);
      const listener = vi.fn();
      bridge.subscribe(listener);

      captured.onOfflineReady?.();
      captured.onOfflineReady?.();
      bridge.setHubActive(true);

      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe("update availability", () => {
    it("reports no update available before needRefresh fires", () => {
      const { registerSW } = createFakeRegisterSW();
      const bridge: PwaBridge = createPwaBridge(registerSW);

      expect(bridge.updateAvailable()).toBe(false);
    });

    it("reports an update available after needRefresh fires", () => {
      const { registerSW, captured } = createFakeRegisterSW();
      const bridge = createPwaBridge(registerSW);

      captured.onNeedRefresh?.();

      expect(bridge.updateAvailable()).toBe(true);
    });
  });
});
