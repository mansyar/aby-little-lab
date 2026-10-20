import smAirplaneSvg from "../../assets/svg/items/airplane.svg?raw";
import smBallSvg from "../../assets/svg/items/ball.svg?raw";
import smBedSvg from "../../assets/svg/items/bed.svg?raw";
import smBoatSvg from "../../assets/svg/items/boat.svg?raw";
import smBugSvg from "../../assets/svg/items/bug.svg?raw";
import smCarSvg from "../../assets/svg/items/car.svg?raw";
import smCupSvg from "../../assets/svg/items/cup.svg?raw";
import smDuckSvg from "../../assets/svg/items/duck.svg?raw";
import smFoxSvg from "../../assets/svg/items/fox.svg?raw";
import smHatSvg from "../../assets/svg/items/hat.svg?raw";
import smHouseSvg from "../../assets/svg/items/house.svg?raw";
import smMapSvg from "../../assets/svg/items/map.svg?raw";
import smMushroomSvg from "../../assets/svg/items/mushroom.svg?raw";
import smSunSvg from "../../assets/svg/items/sun.svg?raw";
import smTreeSvg from "../../assets/svg/items/tree.svg?raw";
import smUmbrellaSvg from "../../assets/svg/items/umbrella.svg?raw";
import type { ArtGroup } from "./types";

/**
 * The 16 small-object keys. `sm_duck` also stays in the shell as a profile
 * avatar — the one deliberate key overlap.
 */
export const items: ArtGroup = Object.freeze({
  id: "items",
  assets: Object.freeze([
    { key: "sm_house", svg: smHouseSvg },
    { key: "sm_tree", svg: smTreeSvg },
    { key: "sm_car", svg: smCarSvg },
    { key: "sm_boat", svg: smBoatSvg },
    { key: "sm_ball", svg: smBallSvg },
    { key: "sm_umbrella", svg: smUmbrellaSvg },
    { key: "sm_airplane", svg: smAirplaneSvg },
    { key: "sm_mushroom", svg: smMushroomSvg },
    { key: "sm_bug", svg: smBugSvg },
    { key: "sm_duck", svg: smDuckSvg },
    { key: "sm_hat", svg: smHatSvg },
    { key: "sm_sun", svg: smSunSvg },
    { key: "sm_bed", svg: smBedSvg },
    { key: "sm_cup", svg: smCupSvg },
    { key: "sm_fox", svg: smFoxSvg },
    { key: "sm_map", svg: smMapSvg },
  ]),
});
