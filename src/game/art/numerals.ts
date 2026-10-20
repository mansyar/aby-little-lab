import numeral0Svg from "../../assets/svg/numbers/numeral_0.svg?raw";
import numeral1Svg from "../../assets/svg/numbers/numeral_1.svg?raw";
import numeral2Svg from "../../assets/svg/numbers/numeral_2.svg?raw";
import numeral3Svg from "../../assets/svg/numbers/numeral_3.svg?raw";
import numeral4Svg from "../../assets/svg/numbers/numeral_4.svg?raw";
import numeral5Svg from "../../assets/svg/numbers/numeral_5.svg?raw";
import numeral6Svg from "../../assets/svg/numbers/numeral_6.svg?raw";
import numeral7Svg from "../../assets/svg/numbers/numeral_7.svg?raw";
import numeral8Svg from "../../assets/svg/numbers/numeral_8.svg?raw";
import numeral9Svg from "../../assets/svg/numbers/numeral_9.svg?raw";
import type { ArtGroup } from "./types";

/** The ten digits drawn by How Many? and Number Order. */
export const numerals: ArtGroup = Object.freeze({
  id: "numerals",
  assets: Object.freeze([
    { key: "numeral_0", svg: numeral0Svg },
    { key: "numeral_1", svg: numeral1Svg },
    { key: "numeral_2", svg: numeral2Svg },
    { key: "numeral_3", svg: numeral3Svg },
    { key: "numeral_4", svg: numeral4Svg },
    { key: "numeral_5", svg: numeral5Svg },
    { key: "numeral_6", svg: numeral6Svg },
    { key: "numeral_7", svg: numeral7Svg },
    { key: "numeral_8", svg: numeral8Svg },
    { key: "numeral_9", svg: numeral9Svg },
  ]),
});
