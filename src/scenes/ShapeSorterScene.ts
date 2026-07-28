import Phaser from "phaser";
import { ParentLock } from "../components/ParentLock";
import { type ShapeType, selectThreeShapes, shuffle } from "../game/shapeSorterLogic";

/** Y position for cutout slots (top area). */
const SLOT_Y = 200;

/** Y position for draggable shapes (bottom area). */
const SHAPE_Y = 600;

/** Display size for shapes and slots (exceeds 96px ideal touch target). */
const SHAPE_DISPLAY_SIZE = 128;

/**
 * Shape Sorter scene — drag geometric shapes to matching cut-out slots.
 *
 * Round initialization selects 3 of 4 shapes, shuffles slot positions and
 * shape positions independently, and renders cutout slots at top with
 * draggable shapes at bottom.
 */
export class ShapeSorterScene extends Phaser.Scene {
  private parentLock?: ParentLock;
  private selectedShapes: ShapeType[] = [];
  private slotOrder: ShapeType[] = [];
  private shapeOrder: ShapeType[] = [];

  constructor() {
    super({ key: "ShapeSorter" });
  }

  create(): void {
    const backButton = this.add.text(20, 20, "← Back", {
      fontSize: "24px",
      color: "#2d3748",
    });
    backButton.setInteractive();

    this.parentLock = new ParentLock({
      scene: this,
      target: backButton,
      onSuccess: () => {
        this.scene.start("Hub");
      },
      onFailure: () => {
        // No action needed on failure.
      },
    });

    this.initRound();

    this.events.on("shutdown", () => {
      this.parentLock?.destroy();
    });
  }

  /** Initializes a new round: selects shapes, shuffles positions, renders slots and shapes. */
  private initRound(): void {
    this.selectedShapes = selectThreeShapes();
    this.slotOrder = shuffle(this.selectedShapes);
    this.shapeOrder = shuffle(this.selectedShapes);

    this.createSlots();
    this.createShapes();
  }

  /** Creates cutout slot images at the top of the screen. */
  private createSlots(): void {
    const spacing = this.scale.width / (this.selectedShapes.length + 1);
    for (let i = 0; i < this.slotOrder.length; i++) {
      const x = spacing * (i + 1);
      const slotType = this.slotOrder[i];
      this.add
        .image(x, SLOT_Y, `cutout_${slotType}`)
        .setDisplaySize(SHAPE_DISPLAY_SIZE, SHAPE_DISPLAY_SIZE);
    }
  }

  /** Creates interactive draggable shape images at the bottom of the screen. */
  private createShapes(): void {
    const spacing = this.scale.width / (this.selectedShapes.length + 1);
    for (let i = 0; i < this.shapeOrder.length; i++) {
      const x = spacing * (i + 1);
      const shapeType = this.shapeOrder[i];
      this.add
        .image(x, SHAPE_Y, `shape_${shapeType}`)
        .setDisplaySize(SHAPE_DISPLAY_SIZE, SHAPE_DISPLAY_SIZE)
        .setInteractive();
    }
  }
}
