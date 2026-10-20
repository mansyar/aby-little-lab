import shapeArrowSvg from "../../assets/svg/shapes/shape_arrow.svg?raw";
import shapeCircleSvg from "../../assets/svg/shapes/shape_circle.svg?raw";
import shapeCrescentSvg from "../../assets/svg/shapes/shape_crescent.svg?raw";
import shapeDiamondSvg from "../../assets/svg/shapes/shape_diamond.svg?raw";
import shapeHeartSvg from "../../assets/svg/shapes/shape_heart.svg?raw";
import shapeHexagonSvg from "../../assets/svg/shapes/shape_hexagon.svg?raw";
import shapeOctagonSvg from "../../assets/svg/shapes/shape_octagon.svg?raw";
import shapeOvalSvg from "../../assets/svg/shapes/shape_oval.svg?raw";
import shapePentagonSvg from "../../assets/svg/shapes/shape_pentagon.svg?raw";
import shapePlusSvg from "../../assets/svg/shapes/shape_plus.svg?raw";
import shapeRectangleSvg from "../../assets/svg/shapes/shape_rectangle.svg?raw";
import shapeRingSvg from "../../assets/svg/shapes/shape_ring.svg?raw";
import shapeSemicircleSvg from "../../assets/svg/shapes/shape_semicircle.svg?raw";
import shapeSquareSvg from "../../assets/svg/shapes/shape_square.svg?raw";
import shapeStarSvg from "../../assets/svg/shapes/shape_star.svg?raw";
import shapeTeardropSvg from "../../assets/svg/shapes/shape_teardrop.svg?raw";
import shapeTrapezoidSvg from "../../assets/svg/shapes/shape_trapezoid.svg?raw";
import shapeTriangleSvg from "../../assets/svg/shapes/shape_triangle.svg?raw";
import type { ArtGroup } from "./types";

/**
 * The 18 solid shapes drawn by Shape Sorter, Pattern Builder, Color Match,
 * Odd One Out and How Many?.
 */
export const shapes: ArtGroup = Object.freeze({
  id: "shapes",
  assets: Object.freeze([
    { key: "shape_circle", svg: shapeCircleSvg },
    { key: "shape_square", svg: shapeSquareSvg },
    { key: "shape_triangle", svg: shapeTriangleSvg },
    { key: "shape_star", svg: shapeStarSvg },
    { key: "shape_heart", svg: shapeHeartSvg },
    { key: "shape_crescent", svg: shapeCrescentSvg },
    { key: "shape_arrow", svg: shapeArrowSvg },
    { key: "shape_diamond", svg: shapeDiamondSvg },
    { key: "shape_hexagon", svg: shapeHexagonSvg },
    { key: "shape_octagon", svg: shapeOctagonSvg },
    { key: "shape_oval", svg: shapeOvalSvg },
    { key: "shape_pentagon", svg: shapePentagonSvg },
    { key: "shape_plus", svg: shapePlusSvg },
    { key: "shape_rectangle", svg: shapeRectangleSvg },
    { key: "shape_ring", svg: shapeRingSvg },
    { key: "shape_semicircle", svg: shapeSemicircleSvg },
    { key: "shape_teardrop", svg: shapeTeardropSvg },
    { key: "shape_trapezoid", svg: shapeTrapezoidSvg },
  ]),
});
