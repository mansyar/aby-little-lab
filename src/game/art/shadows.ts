import smShadowAirplaneSvg from "../../assets/svg/shadows/shadow_airplane.svg?raw";
import smShadowBallSvg from "../../assets/svg/shadows/shadow_ball.svg?raw";
import smShadowBellSvg from "../../assets/svg/shadows/shadow_bell.svg?raw";
import smShadowBoatSvg from "../../assets/svg/shadows/shadow_boat.svg?raw";
import smShadowBootSvg from "../../assets/svg/shadows/shadow_boot.svg?raw";
import smShadowCarSvg from "../../assets/svg/shadows/shadow_car.svg?raw";
import smShadowHouseSvg from "../../assets/svg/shadows/shadow_house.svg?raw";
import smShadowKiteSvg from "../../assets/svg/shadows/shadow_kite.svg?raw";
import smShadowMushroomSvg from "../../assets/svg/shadows/shadow_mushroom.svg?raw";
import smShadowSockSvg from "../../assets/svg/shadows/shadow_sock.svg?raw";
import smShadowTreeSvg from "../../assets/svg/shadows/shadow_tree.svg?raw";
import smShadowUmbrellaSvg from "../../assets/svg/shadows/shadow_umbrella.svg?raw";
import type { ArtGroup } from "./types";

/** The twelve silhouettes Shadow Match pairs with their objects. */
export const shadows: ArtGroup = Object.freeze({
  id: "shadows",
  assets: Object.freeze([
    { key: "sm_shadow_house", svg: smShadowHouseSvg },
    { key: "sm_shadow_tree", svg: smShadowTreeSvg },
    { key: "sm_shadow_car", svg: smShadowCarSvg },
    { key: "sm_shadow_boat", svg: smShadowBoatSvg },
    { key: "sm_shadow_ball", svg: smShadowBallSvg },
    { key: "sm_shadow_umbrella", svg: smShadowUmbrellaSvg },
    { key: "sm_shadow_airplane", svg: smShadowAirplaneSvg },
    { key: "sm_shadow_mushroom", svg: smShadowMushroomSvg },
    { key: "sm_shadow_sock", svg: smShadowSockSvg },
    { key: "sm_shadow_boot", svg: smShadowBootSvg },
    { key: "sm_shadow_kite", svg: smShadowKiteSvg },
    { key: "sm_shadow_bell", svg: smShadowBellSvg },
  ]),
});
