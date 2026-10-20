import animalCatSvg from "../../assets/svg/animals/cat.svg?raw";
import animalDogSvg from "../../assets/svg/animals/dog.svg?raw";
import animalElephantSvg from "../../assets/svg/animals/elephant.svg?raw";
import animalMonkeySvg from "../../assets/svg/animals/monkey.svg?raw";
import animalPigSvg from "../../assets/svg/animals/pig.svg?raw";
import animalRabbitSvg from "../../assets/svg/animals/rabbit.svg?raw";
import type { ArtGroup } from "./types";

/**
 * The six game animals. `animal_cat`, `animal_dog` and `animal_pig` also stay
 * in the shell as profile avatars — the one deliberate key overlap.
 */
export const animals: ArtGroup = Object.freeze({
  id: "animals",
  assets: Object.freeze([
    { key: "animal_monkey", svg: animalMonkeySvg },
    { key: "animal_rabbit", svg: animalRabbitSvg },
    { key: "animal_cat", svg: animalCatSvg },
    { key: "animal_dog", svg: animalDogSvg },
    { key: "animal_elephant", svg: animalElephantSvg },
    { key: "animal_pig", svg: animalPigSvg },
  ]),
});
