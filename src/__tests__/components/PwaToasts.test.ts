import { afterEach, describe, expect, it, vi } from "vitest";
import { stubMatchMedia } from "../helpers/matchMediaStub";
import { type MockFn, MockScene, mockRegistry } from "../helpers/phaserMock";

vi.mock("phaser", async () => {
  const { createPhaserModuleMock } = await import("../helpers/phaserMock");
  return createPhaserModuleMock().module;
});

const bridgeMock = vi.hoisted(() => ({
  listeners: [] as Array<(event: string) => void>,
  updateAvailable: vi.fn(() => false),
  subscribe: vi.fn((listener: (event: string) => void) => {
    bridgeMock.listeners.push(listener);
    return () => {
      bridgeMock.listeners = bridgeMock.listeners.filter((l) => l !== listener);
    };
  }),
  setHubActive: vi.fn(),
  updateNow: vi.fn(),
}));

vi.mock("../../utils/pwaBridge", () => ({
  getPwaBridge: () => bridgeMock,
}));

/** Options the panel passes to `new PwaToast(scene, options)`. */
type ToastOptions = { kind: string };

const toastCtor = vi.hoisted(() =>
  vi.fn(function (this: Record<string, unknown>, _scene: unknown, _options: ToastOptions) {
    this.destroy = vi.fn();
    this.update = vi.fn();
  }),
);
vi.mock("../../components/PwaToast", () => ({
  PwaToast: toastCtor,
}));

import { PwaToasts } from "../../components/PwaToasts";

/** Options of the toast constructed at `index` (throws when none was created). */
function toastOptions(index = 0): ToastOptions {
  const call = toastCtor.mock.calls[index];
  if (!call) throw new Error(`no toast constructed at index ${index}`);
  return call[1];
}

function makeToasts(): { toasts: PwaToasts; scene: MockScene } {
  const scene = new MockScene();
  const toasts = new PwaToasts(scene as unknown as ConstructorParameters<typeof PwaToasts>[0]);
  return { toasts, scene };
}

describe("PwaToasts", () => {
  afterEach(() => {
    stubMatchMedia(false);
    vi.unstubAllGlobals();
    mockRegistry.length = 0;
    bridgeMock.listeners.length = 0;
    bridgeMock.updateAvailable.mockReset().mockReturnValue(false);
    bridgeMock.subscribe.mockClear();
    bridgeMock.setHubActive.mockClear();
    toastCtor.mockClear();
  });

  it("wires the bridge when present: subscribes, flags hub active, pre-flushes updates", () => {
    const { toasts } = makeToasts();
    bridgeMock.updateAvailable.mockReturnValue(true);

    toasts.wire();

    expect(bridgeMock.subscribe).toHaveBeenCalledTimes(1);
    expect(bridgeMock.setHubActive).toHaveBeenCalledWith(true);
    expect(toastCtor).toHaveBeenCalledTimes(1);
    expect(toastOptions().kind).toBe("update");
  });

  it("shows an update toast on the needRefresh event", () => {
    const { toasts } = makeToasts();
    toasts.wire();
    toastCtor.mockClear();

    bridgeMock.listeners[0]?.("needRefresh");

    expect(toastCtor).toHaveBeenCalledTimes(1);
    expect(toastOptions().kind).toBe("update");
  });

  it("shows an offline toast on the offline event", () => {
    const { toasts } = makeToasts();
    toasts.wire();
    toastCtor.mockClear();

    bridgeMock.listeners[0]?.("offline");

    expect(toastOptions().kind).toBe("offline");
  });

  it("destroy() unsubscribes, clears hub-active and kills the toast", () => {
    const { toasts } = makeToasts();
    toasts.wire();
    bridgeMock.listeners[0]?.("needRefresh");
    const toastInstance = toastCtor.mock.instances[0] as { destroy: MockFn };
    toastCtor.mockClear();

    toasts.destroy();

    expect(bridgeMock.setHubActive).toHaveBeenCalledWith(false);
    expect(toastInstance.destroy).toHaveBeenCalled();
    // No further events after unsubscribe.
    bridgeMock.listeners[0]?.("offline");
    expect(toastCtor).not.toHaveBeenCalled();
  });
});
