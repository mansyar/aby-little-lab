import arrowDownSvg from "../../assets/svg/ui/arrow_down.svg?raw";
import arrowUpSvg from "../../assets/svg/ui/arrow_up.svg?raw";
import bubbleSvg from "../../assets/svg/ui/bubble.svg?raw";
import cardBackSvg from "../../assets/svg/ui/card_back.svg?raw";
import equalsSvg from "../../assets/svg/ui/equals.svg?raw";
import minusSvg from "../../assets/svg/ui/minus.svg?raw";
import plusSvg from "../../assets/svg/ui/plus.svg?raw";
import sleepZzzSvg from "../../assets/svg/ui/sleep_zzz.svg?raw";
import type { ArtGroup } from "./types";

/**
 * The eight game symbols: speech bubble, sleep glyph, card back, the two
 * More/Less arrows and the three arithmetic signs.
 *
 * `icon_speaker` is deliberately absent — the shared narrator draws it on every
 * game screen, so it belongs to the shell set.
 */
export const glyphs: ArtGroup = Object.freeze({
  id: "glyphs",
  assets: Object.freeze([
    { key: "bubble", svg: bubbleSvg },
    { key: "sleep_zzz", svg: sleepZzzSvg },
    { key: "card_back", svg: cardBackSvg },
    { key: "arrow_more", svg: arrowUpSvg },
    { key: "arrow_less", svg: arrowDownSvg },
    { key: "equals", svg: equalsSvg },
    { key: "plus", svg: plusSvg },
    { key: "minus", svg: minusSvg },
  ]),
});
