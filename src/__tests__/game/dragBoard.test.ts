import type Phaser from "phaser";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  type BoardPiece,
  DEFAULT_DRAG_DISTANCE_THRESHOLD,
  DragBoard,
  type ValidationTiming,
  type WrongAnswerBehavior,
} from "../../game/dragBoard";

// biome-ignore lint/suspicious/noExplicitAny: mirrors Vitest's internal `Procedure` type
type MockFn = ReturnType<typeof vi.fn<(...args: any[]) => any>>;

/** A mocked draggable container: captures handlers, tracks its own position. */
interface MockContainer {
  on: MockFn;
  x: number;
  y: number;
  setPosition: MockFn;
  scene: unknown;
  handlers: Record<string, MockFn>;
}

function createContainer(scene: unknown, x: number, y: number): MockContainer {
  const handlers: Record<string, MockFn> = {};
  const container: MockContainer = {
    on: vi.fn((event: string, cb: MockFn) => {
      handlers[event] = cb;
      return container;
    }),
    x,
    y,
    setPosition: vi.fn(function (this: MockContainer, nextX: number, nextY: number) {
      container.x = nextX;
      container.y = nextY;
    }),
    scene,
    handlers,
  };
  return container;
}

interface MockScene {
  add: { zone: MockFn };
  input: { setDraggable: MockFn; dragDistanceThreshold: number };
  children: { bringToTop: MockFn };
  tweens: { add: MockFn };
  events: { on: MockFn; off: MockFn };
}

function createScene(): MockScene {
  return {
    add: {
      zone: vi.fn(() => ({ setInteractive: vi.fn(), destroy: vi.fn() })),
    },
    input: { setDraggable: vi.fn(), dragDistanceThreshold: 0 },
    children: { bringToTop: vi.fn() },
    tweens: { add: vi.fn(() => ({ remove: vi.fn(), stop: vi.fn() })) },
    events: { on: vi.fn(), off: vi.fn() },
  };
}

/** Mocked callbacks captured by the harness; called with the shell's payloads. */
interface HarnessCallbacks {
  onTap: MockFn;
  onDrop: MockFn;
  onWithdraw: MockFn;
  onValidate: MockFn;
}

interface Harness {
  scene: MockScene;
  board: DragBoard<BoardPiece>;
  callbacks: HarnessCallbacks;
  locked: boolean;
  makePiece(id: string, x: number, y: number): BoardPiece;
}

interface HarnessOptions {
  wrongAnswerBehavior?: WrongAnswerBehavior;
  validationTiming?: ValidationTiming;
  tapWithdraw?: boolean;
  dragDistanceThreshold?: number;
  bounceDuration?: number;
  bounceReducedDuration?: number;
}

function createHarness(options: HarnessOptions = {}): Harness {
  const scene = createScene();
  const callbacks: HarnessCallbacks = {
    onTap: vi.fn(),
    onDrop: vi.fn(),
    onWithdraw: vi.fn(),
    onValidate: vi.fn(),
  };
  const harness: Harness = {
    scene,
    board: undefined as unknown as DragBoard<BoardPiece>,
    callbacks,
    locked: false,
    makePiece: (id, x, y) => {
      const container = createContainer(scene, x, y);
      const piece: BoardPiece = {
        id,
        container: container as unknown as Phaser.GameObjects.Container,
        originX: x,
        originY: y,
        slotIndex: null,
        justDropped: false,
      };
      harness.board.addPiece(piece);
      return piece;
    },
  };
  harness.board = new DragBoard<BoardPiece>({
    scene: scene as unknown as Phaser.Scene,
    zoneSize: 160,
    wrongAnswerBehavior: options.wrongAnswerBehavior ?? "bounce-home",
    validationTiming: options.validationTiming ?? "per-drop",
    tapWithdraw: options.tapWithdraw ?? true,
    dragDistanceThreshold: options.dragDistanceThreshold,
    bounceDuration: options.bounceDuration,
    bounceReducedDuration: options.bounceReducedDuration,
    isLocked: () => harness.locked,
    callbacks: harness.callbacks,
  });
  return harness;
}

function handlersOf(piece: BoardPiece): Record<string, MockFn> {
  const handlers = (piece.container as unknown as MockContainer).handlers;
  if (!handlers) {
    throw new Error("Container mock did not capture handlers");
  }
  return handlers;
}

function fire(piece: BoardPiece, event: string, ...args: unknown[]): void {
  const handler = handlersOf(piece)[event];
  if (!handler) {
    throw new Error(`Missing '${event}' handler`);
  }
  handler(...args);
}

/** Drops a piece via its drop handler; null simulates an unknown zone. */
function dropOnto(harness: Harness, piece: BoardPiece, slotIndex: number | null): void {
  const zones = harness.board.getSlots();
  const target = slotIndex === null ? { unknown: true } : zones[slotIndex].zone;
  fire(piece, "drop", {}, target);
}

/** All tween configs the scene received. */
function tweenCalls(harness: Harness): Array<Record<string, unknown>> {
  return harness.scene.tweens.add.mock.calls.map((call) => call[0] as Record<string, unknown>);
}

/** Tweens targeting a specific object. */
function tweensFor(harness: Harness, target: unknown): Array<Record<string, unknown>> {
  return tweenCalls(harness).filter((tween) => tween.targets === target);
}

/** Places a piece through the full browser gesture order. */
function placePiece(harness: Harness, piece: BoardPiece, slotIndex: number): void {
  const slot = harness.board.getSlots()[slotIndex];
  fire(piece, "dragstart");
  fire(piece, "pointerdown");
  dropOnto(harness, piece, slotIndex);
  piece.container.x = slot.x;
  piece.container.y = slot.y;
  fire(piece, "dragend");
  fire(piece, "pointerup");
}

describe("DragBoard", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("slot registration and hover detection", () => {
    it("creates an interactive drop zone per registered slot", () => {
      const { scene, board } = createHarness();
      board.addSlot(100, 200);

      expect(scene.add.zone).toHaveBeenCalledWith(100, 200, 160, 160);
      const zone = scene.add.zone.mock.results[0].value as { setInteractive: MockFn };
      expect(zone.setInteractive).toHaveBeenCalledWith({ dropZone: true });
      expect(board.getSlots()).toHaveLength(1);
      expect(board.getSlots()[0].x).toBe(100);
      expect(board.getSlots()[0].y).toBe(200);
      expect(board.getSlots()[0].occupiedBy).toBeNull();
    });

    it("detects hover inside a registered zone, inclusive of its edges", () => {
      const { board } = createHarness();
      board.addSlot(100, 200);

      expect(board.isOverAnyZone(100, 200)).toBe(true);
      expect(board.isOverAnyZone(20, 120)).toBe(true);
      expect(board.isOverAnyZone(180, 280)).toBe(true);
      expect(board.isOverAnyZone(19, 200)).toBe(false);
      expect(board.isOverAnyZone(181, 200)).toBe(false);
      expect(board.isOverAnyZone(100, 119)).toBe(false);
      expect(board.isOverAnyZone(100, 281)).toBe(false);
    });

    it("detects hover over any of several slots", () => {
      const { board } = createHarness();
      board.addSlot(100, 200);
      board.addSlot(400, 200);

      expect(board.isOverAnyZone(100, 200)).toBe(true);
      expect(board.isOverAnyZone(400, 260)).toBe(true);
      expect(board.isOverAnyZone(250, 200)).toBe(false);
    });
  });

  describe("piece registration", () => {
    it("makes the container draggable and wires every gesture event", () => {
      const harness = createHarness();
      const piece = harness.makePiece("a", 100, 40);

      expect(harness.scene.input.setDraggable).toHaveBeenCalledWith(piece.container);
      const events = Object.keys(handlersOf(piece));
      expect(events).toEqual(
        expect.arrayContaining([
          "pointerdown",
          "pointerup",
          "dragstart",
          "drag",
          "drop",
          "dragend",
        ]),
      );
    });
  });

  describe("drop resolution", () => {
    it("places a source piece into an empty slot and snaps it", () => {
      const harness = createHarness();
      const slot = harness.board.addSlot(100, 200);
      const piece = harness.makePiece("a", 100, 40);

      dropOnto(harness, piece, 0);

      expect(piece.slotIndex).toBe(0);
      expect(slot.occupiedBy).toBe(piece);
      const [snap] = tweensFor(harness, piece.container);
      expect(snap.x).toBe(100);
      expect(snap.y).toBe(200);
      expect(snap.duration).toBe(200);
      expect(snap.ease).toBe("Cubic.out");
      expect(harness.callbacks.onDrop).toHaveBeenCalledWith(piece, 0);
    });

    it("re-snaps a piece dropped back onto its own slot without re-reporting", () => {
      const harness = createHarness();
      const slot = harness.board.addSlot(100, 200);
      const piece = harness.makePiece("a", 100, 40);
      placePiece(harness, piece, 0);
      harness.callbacks.onDrop.mockClear();

      dropOnto(harness, piece, 0);

      expect(slot.occupiedBy).toBe(piece);
      expect(piece.slotIndex).toBe(0);
      expect(harness.callbacks.onDrop).not.toHaveBeenCalled();
    });

    it("swaps two placed pieces between their slots", () => {
      const harness = createHarness();
      const slotA = harness.board.addSlot(100, 200);
      const slotB = harness.board.addSlot(300, 200);
      const pieceA = harness.makePiece("a", 100, 40);
      const pieceB = harness.makePiece("b", 300, 40);
      placePiece(harness, pieceA, 0);
      placePiece(harness, pieceB, 1);

      dropOnto(harness, pieceA, 1);

      expect(pieceA.slotIndex).toBe(1);
      expect(slotB.occupiedBy).toBe(pieceA);
      expect(pieceB.slotIndex).toBe(0);
      expect(slotA.occupiedBy).toBe(pieceB);
      const occupantTween = tweensFor(harness, pieceB.container).at(-1);
      expect(occupantTween?.x).toBe(slotA.x);
      expect(occupantTween?.y).toBe(slotA.y);
      expect(occupantTween?.duration).toBe(200);
      expect(occupantTween?.ease).toBe("Back.out");
      expect(harness.callbacks.onDrop).toHaveBeenLastCalledWith(pieceA, 1);
    });

    it("displaces a placed piece when a source piece drops onto its slot", () => {
      const harness = createHarness();
      const slot = harness.board.addSlot(100, 200);
      const pieceA = harness.makePiece("a", 100, 40);
      const pieceC = harness.makePiece("c", 250, 40);
      placePiece(harness, pieceA, 0);

      dropOnto(harness, pieceC, 0);

      expect(pieceC.slotIndex).toBe(0);
      expect(slot.occupiedBy).toBe(pieceC);
      expect(pieceA.slotIndex).toBeNull();
      const homeTween = tweensFor(harness, pieceA.container).at(-1);
      expect(homeTween?.x).toBe(pieceA.originX);
      expect(homeTween?.y).toBe(pieceA.originY);
      expect(homeTween?.duration).toBe(300);
      expect(homeTween?.ease).toBe("Back.out");
      expect(harness.callbacks.onDrop).toHaveBeenLastCalledWith(pieceC, 0);
    });

    it("ignores a drop onto an unknown zone", () => {
      const harness = createHarness();
      harness.board.addSlot(100, 200);
      const piece = harness.makePiece("a", 100, 40);

      dropOnto(harness, piece, null);

      expect(piece.slotIndex).toBeNull();
      expect(harness.board.getSlots()[0].occupiedBy).toBeNull();
    });

    it("ignores a drop while the scene input is locked", () => {
      const harness = createHarness();
      harness.board.addSlot(100, 200);
      const piece = harness.makePiece("a", 100, 40);
      harness.locked = true;

      dropOnto(harness, piece, 0);

      expect(piece.slotIndex).toBeNull();
      expect(piece.justDropped).toBe(false);
      expect(harness.callbacks.onDrop).not.toHaveBeenCalled();
    });
  });

  describe("tap-vs-drag discrimination", () => {
    it("configures the 10px drag threshold by default", () => {
      const { scene } = createHarness();
      expect(scene.input.dragDistanceThreshold).toBe(DEFAULT_DRAG_DISTANCE_THRESHOLD);
      expect(scene.input.dragDistanceThreshold).toBe(10);
    });

    it("honors a custom drag threshold", () => {
      const { scene } = createHarness({ dragDistanceThreshold: 20 });
      expect(scene.input.dragDistanceThreshold).toBe(20);
    });

    it("treats a sub-threshold tap on a placed piece as a withdraw", () => {
      const harness = createHarness({ tapWithdraw: true });
      const slot = harness.board.addSlot(100, 200);
      const piece = harness.makePiece("a", 100, 40);
      placePiece(harness, piece, 0);

      fire(piece, "pointerdown");
      fire(piece, "pointerup");

      expect(piece.slotIndex).toBeNull();
      expect(slot.occupiedBy).toBeNull();
      const homeTween = tweensFor(harness, piece.container).at(-1);
      expect(homeTween?.x).toBe(piece.originX);
      expect(homeTween?.y).toBe(piece.originY);
      expect(homeTween?.duration).toBe(300);
      expect(homeTween?.ease).toBe("Back.out");
      expect(harness.callbacks.onWithdraw).toHaveBeenCalledWith(piece);
    });

    it("does not withdraw an unplaced piece on tap", () => {
      const harness = createHarness({ tapWithdraw: true });
      harness.board.addSlot(100, 200);
      const piece = harness.makePiece("a", 100, 40);

      fire(piece, "pointerdown");
      fire(piece, "pointerup");

      expect(harness.callbacks.onWithdraw).not.toHaveBeenCalled();
      expect(tweensFor(harness, piece.container)).toHaveLength(0);
    });

    it("does not withdraw when the tap-withdraw policy is off", () => {
      const harness = createHarness({ tapWithdraw: false });
      const slot = harness.board.addSlot(100, 200);
      const piece = harness.makePiece("a", 100, 40);
      placePiece(harness, piece, 0);

      fire(piece, "pointerdown");
      fire(piece, "pointerup");

      expect(piece.slotIndex).toBe(0);
      expect(slot.occupiedBy).toBe(piece);
      expect(harness.callbacks.onWithdraw).not.toHaveBeenCalled();
    });

    it("does not withdraw when the trailing pointerup follows a real drag", () => {
      const harness = createHarness({ tapWithdraw: true });
      const slot = harness.board.addSlot(100, 200);
      const piece = harness.makePiece("a", 100, 40);
      placePiece(harness, piece, 0);

      fire(piece, "pointerdown");
      fire(piece, "drag", {}, 110, 205);
      fire(piece, "pointerup");

      expect(piece.slotIndex).toBe(0);
      expect(slot.occupiedBy).toBe(piece);
      expect(harness.callbacks.onWithdraw).not.toHaveBeenCalled();
    });

    it("keeps a placed piece when the gesture's pointerup follows drop and dragend", () => {
      const harness = createHarness({ tapWithdraw: true });
      const slot = harness.board.addSlot(100, 200);
      const piece = harness.makePiece("a", 100, 40);

      // Real input order observed in the browser: dragstart fires BEFORE
      // pointerdown, then drop, dragend, and the pointerup that ends the gesture.
      fire(piece, "dragstart");
      fire(piece, "pointerdown");
      dropOnto(harness, piece, 0);
      piece.container.x = slot.x;
      piece.container.y = slot.y;
      fire(piece, "dragend");
      fire(piece, "pointerup");

      expect(piece.slotIndex).toBe(0);
      expect(slot.occupiedBy).toBe(piece);
    });

    it("reports taps through the onTap callback", () => {
      const harness = createHarness();
      harness.board.addSlot(100, 200);
      const piece = harness.makePiece("a", 100, 40);

      fire(piece, "pointerdown");

      expect(harness.callbacks.onTap).toHaveBeenCalledWith(piece);
    });

    it("ignores every gesture while the scene input is locked", () => {
      const harness = createHarness({ tapWithdraw: true });
      const slot = harness.board.addSlot(100, 200);
      const piece = harness.makePiece("a", 100, 40);
      placePiece(harness, piece, 0);
      harness.locked = true;
      // placePiece already exercised the unlocked handlers; judge only the
      // locked gestures from here on.
      harness.callbacks.onTap.mockClear();
      harness.scene.children.bringToTop.mockClear();

      fire(piece, "pointerdown");
      fire(piece, "pointerup");
      fire(piece, "dragstart");
      fire(piece, "drag", {}, 150, 160);

      expect(harness.callbacks.onTap).not.toHaveBeenCalled();
      expect(piece.slotIndex).toBe(0);
      expect(slot.occupiedBy).toBe(piece);
      expect(piece.container.x).toBe(slot.x);
      expect(harness.scene.children.bringToTop).not.toHaveBeenCalled();
    });
  });

  describe("drag movement", () => {
    it("moves the container with the pointer and marks the gesture a drag", () => {
      const harness = createHarness();
      const piece = harness.makePiece("a", 100, 40);

      fire(piece, "drag", {}, 150, 160);

      expect(piece.container.x).toBe(150);
      expect(piece.container.y).toBe(160);
      expect(piece.justDropped).toBe(true);
    });

    it("brings the dragged piece to the top on dragstart", () => {
      const harness = createHarness();
      const piece = harness.makePiece("a", 100, 40);

      fire(piece, "dragstart");

      expect(harness.scene.children.bringToTop).toHaveBeenCalledWith(piece.container);
    });
  });

  describe("missed drops", () => {
    it("bounces an unplaced piece home when the drag ends off-board", () => {
      const harness = createHarness();
      harness.board.addSlot(100, 200);
      const piece = harness.makePiece("a", 100, 40);
      piece.container.x = 0;
      piece.container.y = 0;

      fire(piece, "dragend");

      const homeTween = tweensFor(harness, piece.container).at(-1);
      expect(homeTween?.x).toBe(piece.originX);
      expect(homeTween?.y).toBe(piece.originY);
      expect(homeTween?.duration).toBe(300);
    });

    it("leaves an unplaced piece alone when the drag ends over a zone", () => {
      const harness = createHarness();
      const slot = harness.board.addSlot(100, 200);
      const piece = harness.makePiece("a", 100, 40);
      piece.container.x = slot.x;
      piece.container.y = slot.y;

      fire(piece, "dragend");

      expect(tweensFor(harness, piece.container)).toHaveLength(0);
    });

    it("returns a placed piece to its slot when the drag ends off-board", () => {
      const harness = createHarness();
      const slot = harness.board.addSlot(100, 200);
      const piece = harness.makePiece("a", 100, 40);
      placePiece(harness, piece, 0);
      piece.container.x = 0;
      piece.container.y = 0;

      fire(piece, "dragend");

      const backTween = tweensFor(harness, piece.container).at(-1);
      expect(backTween?.x).toBe(slot.x);
      expect(backTween?.y).toBe(slot.y);
      expect(piece.slotIndex).toBe(0);
    });
  });

  describe("wrong-answer policies", () => {
    it("bounce-home bounces every placed piece home and frees the slots", () => {
      const harness = createHarness({ wrongAnswerBehavior: "bounce-home" });
      harness.board.addSlot(100, 200);
      harness.board.addSlot(300, 200);
      const pieceA = harness.makePiece("a", 100, 40);
      const pieceB = harness.makePiece("b", 300, 40);
      placePiece(harness, pieceA, 0);
      placePiece(harness, pieceB, 1);

      harness.board.applyWrongAnswer();

      expect(pieceA.slotIndex).toBeNull();
      expect(pieceB.slotIndex).toBeNull();
      expect(harness.board.getSlots()[0].occupiedBy).toBeNull();
      expect(harness.board.getSlots()[1].occupiedBy).toBeNull();
      expect(harness.board.placedPieces()).toHaveLength(0);
      const homeA = tweensFor(harness, pieceA.container).at(-1);
      const homeB = tweensFor(harness, pieceB.container).at(-1);
      expect(homeA?.x).toBe(pieceA.originX);
      expect(homeB?.x).toBe(pieceB.originX);
      expect(homeA?.duration).toBe(300);
    });

    it("retry-in-place keeps placed pieces exactly where the child put them", () => {
      const harness = createHarness({
        wrongAnswerBehavior: "retry-in-place",
        validationTiming: "round-full",
      });
      const slotA = harness.board.addSlot(100, 200);
      const slotB = harness.board.addSlot(300, 200);
      const pieceA = harness.makePiece("a", 100, 40);
      const pieceB = harness.makePiece("b", 300, 40);
      placePiece(harness, pieceA, 0);
      placePiece(harness, pieceB, 1);
      const tweensBefore = tweenCalls(harness).length;

      harness.board.applyWrongAnswer();

      expect(slotA.occupiedBy).toBe(pieceA);
      expect(slotB.occupiedBy).toBe(pieceB);
      expect(pieceA.slotIndex).toBe(0);
      expect(pieceB.slotIndex).toBe(1);
      expect(tweenCalls(harness).length).toBe(tweensBefore);
    });
  });

  describe("bounce duration option", () => {
    it("defaults the bounce tweens to the shared 300/180 durations", () => {
      const harness = createHarness();
      harness.board.addSlot(100, 200);
      const piece = harness.makePiece("a", 100, 40);
      placePiece(harness, piece, 0);

      harness.board.applyWrongAnswer();

      expect(tweensFor(harness, piece.container).at(-1)?.duration).toBe(300);

      vi.stubGlobal("window", { matchMedia: vi.fn(() => ({ matches: true })) });
      placePiece(harness, piece, 0);
      harness.board.applyWrongAnswer();

      expect(tweensFor(harness, piece.container).at(-1)?.duration).toBe(180);
    });

    it("honors a bounceDuration/bounceReducedDuration override", () => {
      const harness = createHarness({
        bounceDuration: 250,
        bounceReducedDuration: 150,
      });
      harness.board.addSlot(100, 200);
      const piece = harness.makePiece("a", 100, 40);
      placePiece(harness, piece, 0);

      // Wrong-answer bounce-home uses the override.
      harness.board.applyWrongAnswer();

      expect(tweensFor(harness, piece.container).at(-1)?.duration).toBe(250);

      // Tray-to-slot displacement shares the same bounce timing.
      placePiece(harness, piece, 0);
      const displacer = harness.makePiece("c", 250, 40);
      dropOnto(harness, displacer, 0);

      expect(tweensFor(harness, piece.container).at(-1)?.duration).toBe(250);

      // Reduced motion picks the override's reduced duration.
      vi.stubGlobal("window", { matchMedia: vi.fn(() => ({ matches: true })) });
      placePiece(harness, piece, 0);
      harness.board.applyWrongAnswer();

      expect(tweensFor(harness, piece.container).at(-1)?.duration).toBe(150);
    });
  });

  describe("validation timing", () => {
    it("per-drop reports after every drag end, including partial boards", () => {
      const harness = createHarness({ validationTiming: "per-drop" });
      harness.board.addSlot(100, 200);
      harness.board.addSlot(300, 200);
      const piece = harness.makePiece("a", 100, 40);
      placePiece(harness, piece, 0);
      const calls = harness.callbacks.onValidate.mock.calls.length;

      fire(piece, "dragend");

      expect(harness.callbacks.onValidate.mock.calls.length).toBe(calls + 1);
      expect(harness.callbacks.onValidate).toHaveBeenLastCalledWith(["a", null]);
    });

    it("per-drop has no signature guard and repeats for an unchanged full board", () => {
      const harness = createHarness({ validationTiming: "per-drop" });
      harness.board.addSlot(100, 200);
      harness.board.addSlot(300, 200);
      const pieceA = harness.makePiece("a", 100, 40);
      const pieceB = harness.makePiece("b", 300, 40);
      placePiece(harness, pieceA, 0);
      placePiece(harness, pieceB, 1);
      // placePiece's drag ends already reported; isolate the no-guard repeat.
      harness.callbacks.onValidate.mockClear();
      fire(pieceA, "dragend");
      fire(pieceB, "dragend");

      expect(harness.callbacks.onValidate).toHaveBeenNthCalledWith(1, ["a", "b"]);
      expect(harness.callbacks.onValidate).toHaveBeenNthCalledWith(2, ["a", "b"]);
    });

    it("round-full does not report until every slot is filled", () => {
      const harness = createHarness({ validationTiming: "round-full" });
      harness.board.addSlot(100, 200);
      harness.board.addSlot(300, 200);
      const piece = harness.makePiece("a", 100, 40);
      placePiece(harness, piece, 0);

      fire(piece, "dragend");

      expect(harness.callbacks.onValidate).not.toHaveBeenCalled();
    });

    it("round-full reports when the board fills, then guards the same arrangement", () => {
      const harness = createHarness({ validationTiming: "round-full" });
      harness.board.addSlot(100, 200);
      harness.board.addSlot(300, 200);
      const pieceA = harness.makePiece("a", 100, 40);
      const pieceB = harness.makePiece("b", 300, 40);
      placePiece(harness, pieceA, 0);
      placePiece(harness, pieceB, 1);

      fire(pieceB, "dragend");
      expect(harness.callbacks.onValidate).toHaveBeenCalledTimes(1);
      expect(harness.callbacks.onValidate).toHaveBeenLastCalledWith(["a", "b"]);

      // Same arrangement again — the signature guard suppresses the report.
      fire(pieceB, "dragend");
      expect(harness.callbacks.onValidate).toHaveBeenCalledTimes(1);

      // A changed arrangement re-validates (slot↔slot swap keeps the board full).
      dropOnto(harness, pieceB, 0);
      pieceB.container.x = harness.board.getSlots()[0].x;
      pieceB.container.y = harness.board.getSlots()[0].y;
      fire(pieceB, "dragend");
      expect(harness.callbacks.onValidate).toHaveBeenCalledTimes(2);
      expect(harness.callbacks.onValidate).toHaveBeenLastCalledWith(["b", "a"]);
    });

    it("round-full re-validates the same arrangement after a withdraw frees a slot", () => {
      const harness = createHarness({ validationTiming: "round-full" });
      harness.board.addSlot(100, 200);
      harness.board.addSlot(300, 200);
      const pieceA = harness.makePiece("a", 100, 40);
      const pieceB = harness.makePiece("b", 300, 40);
      placePiece(harness, pieceA, 0);
      placePiece(harness, pieceB, 1);
      fire(pieceB, "dragend");
      expect(harness.callbacks.onValidate).toHaveBeenCalledTimes(1);

      // Tap-withdraw opens the board; refilling the identical arrangement is a
      // fresh attempt and must be validated again.
      fire(pieceA, "pointerdown");
      fire(pieceA, "pointerup");
      expect(harness.callbacks.onValidate).toHaveBeenCalledTimes(1);

      dropOnto(harness, pieceA, 0);
      pieceA.container.x = harness.board.getSlots()[0].x;
      pieceA.container.y = harness.board.getSlots()[0].y;
      fire(pieceA, "dragend");
      expect(harness.callbacks.onValidate).toHaveBeenCalledTimes(2);
      expect(harness.callbacks.onValidate).toHaveBeenLastCalledWith(["a", "b"]);
    });

    it("round-full re-validates the same arrangement after bounce-home empties the board", () => {
      const harness = createHarness({
        wrongAnswerBehavior: "bounce-home",
        validationTiming: "round-full",
      });
      harness.board.addSlot(100, 200);
      const pieceA = harness.makePiece("a", 100, 40);
      placePiece(harness, pieceA, 0);
      fire(pieceA, "dragend");
      expect(harness.callbacks.onValidate).toHaveBeenCalledTimes(1);

      harness.board.applyWrongAnswer();
      placePiece(harness, pieceA, 0);
      fire(pieceA, "dragend");

      expect(harness.callbacks.onValidate).toHaveBeenCalledTimes(2);
      expect(harness.callbacks.onValidate).toHaveBeenLastCalledWith(["a"]);
    });

    it("does not report validation while the scene input is locked", () => {
      const harness = createHarness({ validationTiming: "round-full" });
      harness.board.addSlot(100, 200);
      const piece = harness.makePiece("a", 100, 40);
      placePiece(harness, piece, 0);
      harness.locked = true;
      // placePiece's drag end already reported; judge only the locked one.
      harness.callbacks.onValidate.mockClear();

      fire(piece, "dragend");

      expect(harness.callbacks.onValidate).not.toHaveBeenCalled();
    });
  });

  describe("board queries", () => {
    it("reports fullness, placed pieces, and placed ids in slot order", () => {
      const harness = createHarness();
      harness.board.addSlot(100, 200);
      harness.board.addSlot(300, 200);
      const pieceA = harness.makePiece("a", 100, 40);
      const pieceB = harness.makePiece("b", 300, 40);

      expect(harness.board.isFull()).toBe(false);
      expect(harness.board.placedPieces()).toHaveLength(0);
      expect(harness.board.placedIds()).toEqual([null, null]);

      placePiece(harness, pieceB, 1);
      expect(harness.board.isFull()).toBe(false);
      expect(harness.board.placedIds()).toEqual([null, "b"]);

      placePiece(harness, pieceA, 0);
      expect(harness.board.isFull()).toBe(true);
      expect(harness.board.placedIds()).toEqual(["a", "b"]);
      expect(harness.board.placedPieces()).toEqual([pieceA, pieceB]);
    });
  });

  describe("cleanup", () => {
    it("registers itself on the scene shutdown event", () => {
      const { scene } = createHarness();
      const shutdownCalls = scene.events.on.mock.calls.filter((call) => call[0] === "shutdown");
      expect(shutdownCalls).toHaveLength(1);
      expect(typeof shutdownCalls[0][1]).toBe("function");
    });

    it("clears the board when the scene shuts down", () => {
      const harness = createHarness();
      harness.board.addSlot(100, 200);
      const piece = harness.makePiece("a", 100, 40);
      placePiece(harness, piece, 0);
      const shutdown = harness.scene.events.on.mock.calls.find(
        (call) => call[0] === "shutdown",
      )?.[1] as () => void;

      shutdown();

      expect(harness.board.getSlots()).toHaveLength(0);
      expect(harness.board.placedPieces()).toHaveLength(0);
    });

    it("destroy unregisters the shutdown handler and clears state once", () => {
      const harness = createHarness();
      harness.board.addSlot(100, 200);
      const piece = harness.makePiece("a", 100, 40);
      placePiece(harness, piece, 0);
      const shutdown = harness.scene.events.on.mock.calls.find(
        (call) => call[0] === "shutdown",
      )?.[1] as () => void;

      harness.board.destroy();
      harness.board.destroy();

      expect(harness.scene.events.off).toHaveBeenCalledTimes(1);
      expect(harness.scene.events.off).toHaveBeenCalledWith("shutdown", shutdown);
      expect(harness.board.getSlots()).toHaveLength(0);
      expect(harness.board.placedPieces()).toHaveLength(0);
    });

    it("clear destroys the shell-owned zones and resets all state", () => {
      const harness = createHarness();
      harness.board.addSlot(100, 200);
      harness.board.addSlot(300, 200);
      const piece = harness.makePiece("a", 100, 40);
      placePiece(harness, piece, 0);
      const zones = harness.board
        .getSlots()
        .map((slot) => slot.zone as unknown as { destroy: MockFn });

      harness.board.clear();

      expect(zones[0].destroy).toHaveBeenCalledTimes(1);
      expect(zones[1].destroy).toHaveBeenCalledTimes(1);
      expect(harness.board.getSlots()).toHaveLength(0);
      expect(harness.board.placedPieces()).toHaveLength(0);
      expect(piece.slotIndex).toBeNull();
    });
  });

  describe("prefers-reduced-motion degradation", () => {
    it("shortens withdraw, displacement, and swap tweens under reduced motion", () => {
      vi.stubGlobal("window", { matchMedia: vi.fn(() => ({ matches: true })) });

      // Withdraw: 300 → 180.
      const harness = createHarness();
      harness.board.addSlot(100, 200);
      const piece = harness.makePiece("a", 100, 40);
      placePiece(harness, piece, 0);
      fire(piece, "pointerdown");
      fire(piece, "pointerup");
      expect(tweensFor(harness, piece.container).at(-1)?.duration).toBe(180);

      // Tray↔slot displacement (source piece pushes a placed piece home): 300 → 180.
      placePiece(harness, piece, 0);
      const displacer = harness.makePiece("c", 250, 40);
      dropOnto(harness, displacer, 0);
      expect(tweensFor(harness, piece.container).at(-1)?.duration).toBe(180);

      // Slot↔slot swap (occupant slides to the dragging piece's slot): 200 → 120.
      const swapHarness = createHarness();
      swapHarness.board.addSlot(100, 200);
      swapHarness.board.addSlot(300, 200);
      const pieceA = swapHarness.makePiece("a", 100, 40);
      const pieceB = swapHarness.makePiece("b", 300, 40);
      placePiece(swapHarness, pieceA, 0);
      placePiece(swapHarness, pieceB, 1);
      dropOnto(swapHarness, pieceA, 1);
      const swapTween = tweensFor(swapHarness, pieceB.container).at(-1);
      expect(swapTween?.duration).toBe(120);
      expect(swapTween?.x).toBe(100);
    });
  });
});
