import foodAppleSvg from "../../assets/svg/items/apple.svg?raw";
import foodBananaSvg from "../../assets/svg/items/banana.svg?raw";
import foodBoneSvg from "../../assets/svg/items/bone.svg?raw";
import foodCarrotSvg from "../../assets/svg/items/carrot.svg?raw";
import foodFishSvg from "../../assets/svg/items/fish.svg?raw";
import foodPeanutSvg from "../../assets/svg/items/peanut.svg?raw";
import type { ArtGroup } from "./types";

/** The six foods Animal Trace and How Many? draw. */
export const food: ArtGroup = Object.freeze({
  id: "food",
  assets: Object.freeze([
    { key: "food_banana", svg: foodBananaSvg },
    { key: "food_carrot", svg: foodCarrotSvg },
    { key: "food_fish", svg: foodFishSvg },
    { key: "food_bone", svg: foodBoneSvg },
    { key: "food_peanut", svg: foodPeanutSvg },
    { key: "food_apple", svg: foodAppleSvg },
  ]),
});
