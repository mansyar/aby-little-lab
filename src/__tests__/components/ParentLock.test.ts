import { ParentLock } from "../../components/ParentLock";

type MockFn = ReturnType<typeof vi.fn>;

interface MockTarget {
  on: MockFn;
  off: MockFn;
  emit: (event: string, ...args: unknown[]) => void;
}

interface MockScene {
  time: {
    delayedCall: MockFn;
  };
}

interface MockTimerEvent {
  remove: MockFn;
  callback?: () => void;
}

/** Creates a mock event emitter that mimics a Phaser GameObject's on/off/emit methods. */
function createMockTarget(): MockTarget {
  const listeners: Record<string, Array<(...args: unknown[]) => void>> = {};
  return {
    on: vi.fn((event: string, callback: (...args: unknown[]) => void) => {
      if (!listeners[event]) {
        listeners[event] = [];
      }
      listeners[event].push(callback);
    }),
    off: vi.fn((event: string, callback: (...args: unknown[]) => void) => {
      if (listeners[event]) {
        listeners[event] = listeners[event].filter((cb) => cb !== callback);
      }
    }),
    emit: (event: string, ...args: unknown[]) => {
      if (listeners[event]) {
        listeners[event].forEach((cb) => {
          cb(...args);
        });
      }
    },
  };
}

/** Creates a mock Phaser.Scene with the time API. */
function createMockScene(): MockScene {
  return {
    time: {
      delayedCall: vi.fn(),
    },
  };
}

describe("ParentLock", () => {
  let mockScene: MockScene;
  let mockTarget: MockTarget;
  let onSuccess: MockFn;
  let onFailure: MockFn;
  let mockTimerEvent: MockTimerEvent;

  beforeEach(() => {
    mockTimerEvent = { remove: vi.fn() };
    mockScene = createMockScene();
    mockScene.time.delayedCall.mockImplementation((_duration: number, callback: () => void) => {
      mockTimerEvent.callback = callback;
      return mockTimerEvent;
    });
    mockTarget = createMockTarget();
    onSuccess = vi.fn();
    onFailure = vi.fn();
  });

  function createLock() {
    return new ParentLock({
      scene: mockScene as never,
      target: mockTarget as never,
      onSuccess,
      onFailure,
    });
  }

  describe("constructor", () => {
    it("registers pointerdown listener on target", () => {
      createLock();
      expect(mockTarget.on).toHaveBeenCalledWith("pointerdown", expect.any(Function));
    });

    it("registers pointerup listener on target", () => {
      createLock();
      expect(mockTarget.on).toHaveBeenCalledWith("pointerup", expect.any(Function));
    });

    it("registers pointerout listener on target", () => {
      createLock();
      expect(mockTarget.on).toHaveBeenCalledWith("pointerout", expect.any(Function));
    });
  });

  describe("hold detection", () => {
    it("starts a timer with 3000ms default duration on pointerdown", () => {
      createLock();
      mockTarget.emit("pointerdown");
      expect(mockScene.time.delayedCall).toHaveBeenCalledWith(3000, expect.any(Function));
    });

    it("uses custom holdDuration when provided", () => {
      new ParentLock({
        scene: mockScene as never,
        target: mockTarget as never,
        holdDuration: 5000,
        onSuccess,
        onFailure,
      });
      mockTarget.emit("pointerdown");
      expect(mockScene.time.delayedCall).toHaveBeenCalledWith(5000, expect.any(Function));
    });

    it("fires onSuccess after 3s hold completes", () => {
      createLock();
      mockTarget.emit("pointerdown");
      mockTimerEvent.callback?.();
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });
  });

  describe("reset on release before 3s", () => {
    it("does not fire onSuccess when pointerup before 3s", () => {
      createLock();
      mockTarget.emit("pointerdown");
      mockTarget.emit("pointerup");
      expect(onSuccess).not.toHaveBeenCalled();
    });

    it("removes timer when pointerup before 3s", () => {
      createLock();
      mockTarget.emit("pointerdown");
      mockTarget.emit("pointerup");
      expect(mockTimerEvent.remove).toHaveBeenCalledTimes(1);
    });

    it("fires onFailure when pointerup before 3s", () => {
      createLock();
      mockTarget.emit("pointerdown");
      mockTarget.emit("pointerup");
      expect(onFailure).toHaveBeenCalledTimes(1);
    });

    it("does not fire onSuccess when pointerout before 3s", () => {
      createLock();
      mockTarget.emit("pointerdown");
      mockTarget.emit("pointerout");
      expect(onSuccess).not.toHaveBeenCalled();
    });

    it("removes timer when pointerout before 3s", () => {
      createLock();
      mockTarget.emit("pointerdown");
      mockTarget.emit("pointerout");
      expect(mockTimerEvent.remove).toHaveBeenCalledTimes(1);
    });

    it("fires onFailure when pointerout before 3s", () => {
      createLock();
      mockTarget.emit("pointerdown");
      mockTarget.emit("pointerout");
      expect(onFailure).toHaveBeenCalledTimes(1);
    });

    it("does not fire onFailure if no hold was started", () => {
      createLock();
      mockTarget.emit("pointerup");
      expect(onFailure).not.toHaveBeenCalled();
    });
  });

  describe("destroy()", () => {
    it("removes pointerdown listener from target", () => {
      const lock = createLock();
      lock.destroy();
      expect(mockTarget.off).toHaveBeenCalledWith("pointerdown", expect.any(Function));
    });

    it("removes pointerup listener from target", () => {
      const lock = createLock();
      lock.destroy();
      expect(mockTarget.off).toHaveBeenCalledWith("pointerup", expect.any(Function));
    });

    it("removes pointerout listener from target", () => {
      const lock = createLock();
      lock.destroy();
      expect(mockTarget.off).toHaveBeenCalledWith("pointerout", expect.any(Function));
    });

    it("cancels active timer on destroy", () => {
      const lock = createLock();
      mockTarget.emit("pointerdown");
      lock.destroy();
      expect(mockTimerEvent.remove).toHaveBeenCalledTimes(1);
    });

    it("does not error when no timer is active on destroy", () => {
      const lock = createLock();
      expect(() => lock.destroy()).not.toThrow();
    });
  });
});
