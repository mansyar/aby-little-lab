import animalFrogBlueSvg from "../../assets/svg/animals/frog_blue.svg?raw";
import animalFrogGreenSvg from "../../assets/svg/animals/frog_green.svg?raw";
import animalFrogRedSvg from "../../assets/svg/animals/frog_red.svg?raw";
import lilypadSvg from "../../assets/svg/items/lilypad.svg?raw";
import type { ArtGroup } from "./types";

/**
 * The three frog notes and their lilypad, drawn by Musical Memory, Color Match
 * and Odd One Out. `frog_red` also stays in the shell as a profile avatar —
 * the one deliberate key overlap.
 */
export const music: ArtGroup = Object.freeze({
  id: "music",
  assets: Object.freeze([
    { key: "frog_green", svg: animalFrogGreenSvg },
    { key: "frog_blue", svg: animalFrogBlueSvg },
    { key: "frog_red", svg: animalFrogRedSvg },
    { key: "lilypad", svg: lilypadSvg },
  ]),
});
