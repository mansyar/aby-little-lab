import faceAngrySvg from "../../assets/svg/feelings/face_angry.svg?raw";
import faceHappySvg from "../../assets/svg/feelings/face_happy.svg?raw";
import faceSadSvg from "../../assets/svg/feelings/face_sad.svg?raw";
import faceScaredSvg from "../../assets/svg/feelings/face_scared.svg?raw";
import type { ArtGroup } from "./types";

/** The four feelings faces drawn by Feelings Faces. */
export const faces: ArtGroup = Object.freeze({
  id: "faces",
  assets: Object.freeze([
    { key: "face_happy", svg: faceHappySvg },
    { key: "face_sad", svg: faceSadSvg },
    { key: "face_angry", svg: faceAngrySvg },
    { key: "face_scared", svg: faceScaredSvg },
  ]),
});
