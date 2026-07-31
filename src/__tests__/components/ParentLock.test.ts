import { ParentLock } from "../../components/ParentLock";

type MockFn = ReturnType<typeof vi.fn>;

interface MockTarget {
  on: MockFn;
  off: MockFn;
  getCenter: MockFn;
  emit: (event: string, ...args: unknown[]) => void;
}

interface MockScene {
  add: {
    graphics: MockFn;
  };
  time: {
    delayedCall: MockFn;
  };
  tweens: {
    add: MockFn;
  };
}

interface MockTimerEvent {
  remove: MockFn;
  callback?: () => void;
}

interface MockTweenEvent {
  stop: MockFn;
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
    getCenter: vi.fn(() => ({ x: 100, y: 100 })),
    emit: (event: string, ...args: unknown[]) => {
      if (listeners[event]) {
        listeners[event].forEach((cb) => {
          cb(...args);
        });
      }
    },
  };
}

/** Creates a mock Phaser.Scene with the time, graphics, and tweens APIs. */
function createMockScene(): MockScene {
  return {
    add: {
      graphics: vi.fn(() => {
        const graphics = {
          destroy: vi.fn(),
          clear: vi.fn(),
          fillStyle: vi.fn(),
          slice: vi.fn(),
          fillPath: vi.fn(),
          setDepth: vi.fn(),
        };
        graphics.setDepth.mockReturnValue(graphics);
        return graphics;
      }),
    },
    time: {
      delayedCall: vi.fn(),
    },
    tweens: {
      add: vi.fn(),
    },
  };
}

describe("ParentLock", () => {
  let mockScene: MockScene;
  let mockTarget: MockTarget;
  let onSuccess: MockFn;
  let onFailure: MockFn;
  let mockTimerEvent: MockTimerEvent;
  let mockTweenEvent: MockTweenEvent;

  beforeEach(() => {
    mockTimerEvent = { remove: vi.fn() };
    mockTweenEvent = { stop: vi.fn() };
    mockScene = createMockScene();
    mockScene.time.delayedCall.mockImplementation((_duration: number, callback: () => void) => {
      mockTimerEvent.callback = callback;
      return mockTimerEvent;
    });
    mockScene.tweens.add.mockReturnValue(mockTweenEvent);
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

    it("registers pointercancel listener on target", () => {
      createLock();
      expect(mockTarget.on).toHaveBeenCalledWith("pointercancel", expect.any(Function));
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

  describe("duplicate pointer-down prevention", () => {
    it("starts only one hold timer when pointerdown fires twice", () => {
      createLock();
      mockTarget.emit("pointerdown");
      mockTarget.emit("pointerdown");
      expect(mockScene.time.delayedCall).toHaveBeenCalledTimes(1);
    });

    it("ignores duplicate pointerdown while a hold is active", () => {
      createLock();
      mockTarget.emit("pointerdown");
      mockTarget.emit("pointerdown");
      expect(mockTimerEvent.remove).not.toHaveBeenCalled();
    });
  });

  describe("pointercancel cancellation", () => {
    it("does not fire onSuccess when pointercancel before 3s", () => {
      createLock();
      mockTarget.emit("pointerdown");
      mockTarget.emit("pointercancel");
      expect(onSuccess).not.toHaveBeenCalled();
    });

    it("removes timer when pointercancel before 3s", () => {
      createLock();
      mockTarget.emit("pointerdown");
      mockTarget.emit("pointercancel");
      expect(mockTimerEvent.remove).toHaveBeenCalledTimes(1);
    });

    it("fires onFailure when pointercancel before 3s", () => {
      createLock();
      mockTarget.emit("pointerdown");
      mockTarget.emit("pointercancel");
      expect(onFailure).toHaveBeenCalledTimes(1);
    });
  });

  describe("callback-once behavior", () => {
    it("fires onSuccess exactly once per completed hold", () => {
      createLock();
      mockTarget.emit("pointerdown");
      mockTimerEvent.callback?.();
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });

    it("ignores a stale success callback after completion", () => {
      createLock();
      mockTarget.emit("pointerdown");
      mockTimerEvent.callback?.();
      mockTimerEvent.callback?.();
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });

    it("does not fire onFailure for a stray pointerup after success", () => {
      createLock();
      mockTarget.emit("pointerdown");
      mockTimerEvent.callback?.();
      mockTarget.emit("pointerup");
      expect(onFailure).not.toHaveBeenCalled();
    });

    it("allows a fresh hold after a cancelled hold", () => {
      createLock();
      mockTarget.emit("pointerdown");
      mockTarget.emit("pointerup");
      mockTarget.emit("pointerdown");
      mockTimerEvent.callback?.();
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });

    it("fires onFailure only once for a single cancelled hold", () => {
      createLock();
      mockTarget.emit("pointerdown");
      mockTarget.emit("pointerup");
      mockTarget.emit("pointerup");
      expect(onFailure).toHaveBeenCalledTimes(1);
    });
  });

  describe("hold-progress feedback", () => {
    it("creates a circular progress indicator on pointerdown", () => {
      createLock();
      mockTarget.emit("pointerdown");
      expect(mockScene.add.graphics).toHaveBeenCalledTimes(1);
    });

    it("draws the progress ring centered on the target", () => {
      createLock();
      mockTarget.emit("pointerdown");
      expect(mockTarget.getCenter).toHaveBeenCalled();
    });

    it("destroys the progress indicator when the hold is cancelled", () => {
      createLock();
      mockTarget.emit("pointerdown");
      const graphics = mockScene.add.graphics.mock.results[0]?.value as {
        destroy: MockFn;
      };
      mockTarget.emit("pointerup");
      expect(graphics.destroy).toHaveBeenCalledTimes(1);
    });

    it("destroys the progress indicator when the hold completes", () => {
      createLock();
      mockTarget.emit("pointerdown");
      const graphics = mockScene.add.graphics.mock.results[0]?.value as {
        destroy: MockFn;
      };
      mockTimerEvent.callback?.();
      expect(graphics.destroy).toHaveBeenCalledTimes(1);
    });

    it("starts a fresh progress indicator after a cancelled hold", () => {
      createLock();
      mockTarget.emit("pointerdown");
      mockTarget.emit("pointerup");
      mockTarget.emit("pointerdown");
      expect(mockScene.add.graphics).toHaveBeenCalledTimes(2);
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

    it("cancels an active hold timer on destroy", () => {
      const lock = createLock();
      mockTarget.emit("pointerdown");
      lock.destroy();
      expect(mockTimerEvent.remove).toHaveBeenCalledTimes(1);
    });

    it("destroys the progress indicator on destroy", () => {
      const lock = createLock();
      mockTarget.emit("pointerdown");
      const graphics = mockScene.add.graphics.mock.results[0]?.value as {
        destroy: MockFn;
      };
      lock.destroy();
      expect(graphics.destroy).toHaveBeenCalledTimes(1);
    });

    it("stops the progress tween on destroy", () => {
      const lock = createLock();
      mockTarget.emit("pointerdown");
      lock.destroy();
      expect(mockTweenEvent.stop).toHaveBeenCalledTimes(1);
    });

    it("ignores a stale success callback after destroy", () => {
      const lock = createLock();
      mockTarget.emit("pointerdown");
      lock.destroy();
      mockTimerEvent.callback?.();
      expect(onSuccess).not.toHaveBeenCalled();
    });

    it("does not fire onSuccess from a stale callback after cancellation", () => {
      createLock();
      mockTarget.emit("pointerdown");
      mockTarget.emit("pointercancel");
      mockTimerEvent.callback?.();
      expect(onSuccess).not.toHaveBeenCalled();
    });
  });
});
