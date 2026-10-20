import toyTeddyBearSvg from "../../assets/svg/toys/teddy_bear.svg?raw";
import toyBallSvg from "../../assets/svg/toys/toy_ball.svg?raw";
import toyBlockSvg from "../../assets/svg/toys/toy_block.svg?raw";
import toyBoxSvg from "../../assets/svg/toys/toy_box.svg?raw";
import toyCarSvg from "../../assets/svg/toys/toy_car.svg?raw";
import toyDrumSvg from "../../assets/svg/toys/toy_drum.svg?raw";
import toyRocketSvg from "../../assets/svg/toys/toy_rocket.svg?raw";
import type { ArtGroup } from "./types";

/**
 * The seven toys drawn by Big & Small, Memory Match and Odd One Out.
 * `toy_teddy_bear` also stays in the shell as a profile avatar — the one
 * deliberate key overlap.
 */
export const toys: ArtGroup = Object.freeze({
  id: "toys",
  assets: Object.freeze([
    { key: "toy_teddy_bear", svg: toyTeddyBearSvg },
    { key: "toy_car", svg: toyCarSvg },
    { key: "toy_rocket", svg: toyRocketSvg },
    { key: "toy_drum", svg: toyDrumSvg },
    { key: "toy_ball", svg: toyBallSvg },
    { key: "toy_block", svg: toyBlockSvg },
    { key: "toy_box", svg: toyBoxSvg },
  ]),
});
