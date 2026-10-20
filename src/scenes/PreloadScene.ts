import Phaser from "phaser";
import animalCatSvg from "../assets/svg/animals/cat.svg?raw";
import animalDogSvg from "../assets/svg/animals/dog.svg?raw";
import animalFrogRedSvg from "../assets/svg/animals/frog_red.svg?raw";
import animalPigSvg from "../assets/svg/animals/pig.svg?raw";
import smDuckSvg from "../assets/svg/items/duck.svg?raw";
import toyTeddyBearSvg from "../assets/svg/toys/teddy_bear.svg?raw";
import iconSpeakerSvg from "../assets/svg/ui/icon_speaker.svg?raw";
import mascotCelebrateSvg from "../assets/svg/ui/mascot_celebrate.svg?raw";
import mascotIdleSvg from "../assets/svg/ui/mascot_idle.svg?raw";
import { GAME_REGISTRY } from "../game/gameRegistry";
import { transitionToScene } from "../utils/sceneTransitions";
import { toDataUri } from "../utils/svgDataUri";
import { textureSizeFor } from "../utils/textureTiers";
import { textStyle } from "../utils/typography";

/** A boot-shell texture: its key and the raw SVG source it rasterizes from. */
export interface ShellAsset {
  readonly key: string;
  readonly svg: string;
}

/**
 * Maps SVG source paths to their texture keys, rejecting a duplicated key.
 *
 * Only `tile_*` and `sticker_*` files are shell assets. The UI directory also
 * holds glyphs and mascot poses that are imported by name below, and game art
 * lives under `src/game/art/`, shipping in the game's own chunk.
 */
function shellSourceMap(globbed: Record<string, string>): Map<string, string> {
  const sources = new Map<string, string>();
  for (const [path, svg] of Object.entries(globbed)) {
    const key = path.slice(path.lastIndexOf("/") + 1).replace(/\.svg$/, "");
    if (!key.startsWith("tile_") && !key.startsWith("sticker_")) continue;
    if (sources.has(key)) {
      throw new Error(`duplicate shell asset: ${key} (${path})`);
    }
    sources.set(key, svg);
  }
  return sources;
}

const gameShellSources = shellSourceMap({
  ...import.meta.glob<string>("../assets/svg/ui/**/*.svg", {
    eager: true,
    query: "?raw",
    import: "default",
  }),
  ...import.meta.glob<string>("../assets/svg/stickers/*.svg", {
    eager: true,
    query: "?raw",
    import: "default",
  }),
});

/** Resolves a registry asset key, failing loudly when no SVG file carries it. */
function shellAsset(key: string): ShellAsset {
  const svg = gameShellSources.get(key);
  if (svg === undefined) {
    throw new Error(`no shell SVG for registry asset key: ${key}`);
  }
  return { key, svg };
}

/**
 * The boot shell's raw SVG table: key → SVG source string, rasterized by the
 * SVG loader at the per-use tier size for each key (see
 * `src/utils/textureTiers.ts` — sized for the asset's largest display context,
 * not a uniform 512²).
 *
 * The 44 game entries are derived: every registry entry names its `tileKey` and
 * `stickerKey`, and the sources come from the eager glob above, so a new game
 * needs one registry row and its two SVG files — no edit here. A missing or
 * duplicated file throws at module evaluation, naming the key.
 *
 * The six avatars (`animal_cat`, `animal_dog`, `animal_pig`, `frog_red`,
 * `sm_duck`, `toy_teddy_bear`) stay eager because `ProfileChip` and the Settings
 * avatar picker render before any game scene loads. They are the only keys the
 * shell and a game group share. `mascot_idle` stays because it is also a word
 * prompt in `wordLogic`.
 */
export const SHELL_ASSETS: readonly ShellAsset[] = [
  ...GAME_REGISTRY.map((game) => shellAsset(game.tileKey)),
  ...GAME_REGISTRY.map((game) => shellAsset(game.stickerKey)),
  { key: "mascot_idle", svg: mascotIdleSvg },
  { key: "mascot_celebrate", svg: mascotCelebrateSvg },
  { key: "icon_speaker", svg: iconSpeakerSvg },
  { key: "animal_cat", svg: animalCatSvg },
  { key: "animal_dog", svg: animalDogSvg },
  { key: "animal_pig", svg: animalPigSvg },
  { key: "frog_red", svg: animalFrogRedSvg },
  { key: "sm_duck", svg: smDuckSvg },
  { key: "toy_teddy_bear", svg: toyTeddyBearSvg },
];

/**
 * Preload scene — displays a progress bar while the shell assets load.
 *
 * Loads the documented shell set rasterized at its per-use tier size
 * (`textureSizeFor`), registers load event listeners for progress tracking,
 * then transitions to the Hub scene once the shell assets are loaded. Game art
 * is not part of this load: each game scene rasterizes its own declared groups
 * in its own `preload`.
 */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: "Preload" });
  }

  preload(): void {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    const title = this.add
      .text(
        centerX,
        centerY - 110,
        "Aby's Little Lab",
        textStyle({
          color: "#2B6CB0",
          fontSize: "44px",
          fontStyle: "bold",
        }),
      )
      .setOrigin(0.5);
    const tagline = this.add
      .text(
        centerX,
        centerY - 70,
        "Fun little games for little learners",
        textStyle({
          color: "#2d3748",
          fontSize: "24px",
        }),
      )
      .setOrigin(0.5);

    const progressBar = this.add.rectangle(centerX, centerY, 300, 30, 0xffffff);
    const progressBox = this.add.rectangle(centerX, centerY, 320, 50, 0x222222);
    progressBox.setDepth(-1);

    this.load.on("progress", (value: number) => {
      progressBar.setDisplaySize(300 * value, 30);
    });

    this.load.on("complete", () => {
      title.destroy();
      tagline.destroy();
      progressBar.destroy();
      progressBox.destroy();
    });

    /* v8 ignore next -- dev-only profiling block: statically removed from
       production builds and unreachable when MODE=test. */
    if (import.meta.env.DEV) {
      // Boot-time profiling (dev-only): aggregate SVG load/rasterization cost.
      // The entire block is statically removed from production builds.
      const loadStart = performance.now();
      let fileCount = 0;
      let lastFileAt = loadStart;
      let slowestFileDelta = 0;

      this.load.on("filecomplete", () => {
        const now = performance.now();
        const delta = now - lastFileAt;
        lastFileAt = now;
        fileCount += 1;
        if (delta > slowestFileDelta) slowestFileDelta = delta;
      });

      this.load.on("complete", () => {
        const elapsed = Math.round(performance.now() - loadStart);
        console.info(
          `[preload] ${fileCount} files in ${elapsed}ms (avg ${Math.round(elapsed / Math.max(fileCount, 1))}ms/file, slowest ${Math.round(slowestFileDelta)}ms)`,
        );
      });
    }

    for (const asset of SHELL_ASSETS) {
      const size = textureSizeFor(asset.key);
      this.load.svg(asset.key, toDataUri(asset.svg), {
        width: size,
        height: size,
      });
    }
  }

  create(): void {
    transitionToScene(this, "Hub");
  }
}
