import cutoutArrowSvg from "../../assets/svg/shapes/cutout_arrow.svg?raw";
import cutoutCircleSvg from "../../assets/svg/shapes/cutout_circle.svg?raw";
import cutoutCrescentSvg from "../../assets/svg/shapes/cutout_crescent.svg?raw";
import cutoutDiamondSvg from "../../assets/svg/shapes/cutout_diamond.svg?raw";
import cutoutHeartSvg from "../../assets/svg/shapes/cutout_heart.svg?raw";
import cutoutHexagonSvg from "../../assets/svg/shapes/cutout_hexagon.svg?raw";
import cutoutOctagonSvg from "../../assets/svg/shapes/cutout_octagon.svg?raw";
import cutoutOvalSvg from "../../assets/svg/shapes/cutout_oval.svg?raw";
import cutoutPentagonSvg from "../../assets/svg/shapes/cutout_pentagon.svg?raw";
import cutoutPlusSvg from "../../assets/svg/shapes/cutout_plus.svg?raw";
import cutoutRectangleSvg from "../../assets/svg/shapes/cutout_rectangle.svg?raw";
import cutoutRingSvg from "../../assets/svg/shapes/cutout_ring.svg?raw";
import cutoutSemicircleSvg from "../../assets/svg/shapes/cutout_semicircle.svg?raw";
import cutoutSquareSvg from "../../assets/svg/shapes/cutout_square.svg?raw";
import cutoutStarSvg from "../../assets/svg/shapes/cutout_star.svg?raw";
import cutoutTeardropSvg from "../../assets/svg/shapes/cutout_teardrop.svg?raw";
import cutoutTrapezoidSvg from "../../assets/svg/shapes/cutout_trapezoid.svg?raw";
import cutoutTriangleSvg from "../../assets/svg/shapes/cutout_triangle.svg?raw";
import type { ArtGroup } from "./types";

/** The 18 press-out outlines Shape Sorter uses as drop slots. */
export const cutouts: ArtGroup = Object.freeze({
  id: "cutouts",
  assets: Object.freeze([
    { key: "cutout_circle", svg: cutoutCircleSvg },
    { key: "cutout_square", svg: cutoutSquareSvg },
    { key: "cutout_triangle", svg: cutoutTriangleSvg },
    { key: "cutout_star", svg: cutoutStarSvg },
    { key: "cutout_heart", svg: cutoutHeartSvg },
    { key: "cutout_crescent", svg: cutoutCrescentSvg },
    { key: "cutout_arrow", svg: cutoutArrowSvg },
    { key: "cutout_diamond", svg: cutoutDiamondSvg },
    { key: "cutout_hexagon", svg: cutoutHexagonSvg },
    { key: "cutout_octagon", svg: cutoutOctagonSvg },
    { key: "cutout_oval", svg: cutoutOvalSvg },
    { key: "cutout_pentagon", svg: cutoutPentagonSvg },
    { key: "cutout_plus", svg: cutoutPlusSvg },
    { key: "cutout_rectangle", svg: cutoutRectangleSvg },
    { key: "cutout_ring", svg: cutoutRingSvg },
    { key: "cutout_semicircle", svg: cutoutSemicircleSvg },
    { key: "cutout_teardrop", svg: cutoutTeardropSvg },
    { key: "cutout_trapezoid", svg: cutoutTrapezoidSvg },
  ]),
});
