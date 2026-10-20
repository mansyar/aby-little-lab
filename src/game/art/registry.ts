import type Phaser from "phaser";
import { toDataUri } from "../../utils/svgDataUri";
import { textureSizeFor } from "../../utils/textureTiers";
import { ensureArtTexture } from "./placeholder";
import type { ArtGroup } from "./types";

/** One scene's in-flight loads and the listeners that keep them honest. */
interface SceneLoads {
  readonly load: Phaser.Loader.LoaderPlugin;
  readonly events: Phaser.Events.EventEmitter;
  /** Keys this scene queued and that have not settled yet. */
  readonly keys: Set<string>;
  /** Keys whose file errored in this scene, still owed a placeholder. */
  readonly failed: Set<string>;
  readonly onFileComplete: (key: string) => void;
  readonly onLoadError: (file: Phaser.Loader.File) => void;
  readonly onComplete: () => void;
  readonly onShutdown: () => void;
}

/**
 * Key → the scene that queued it.
 *
 * Ownership is tracked per scene, not just as a flat membership set, because a
 * child can leave a game before its loader finishes. Phaser emits no
 * `loaderror` for files still in flight when a scene shuts down, so without
 * ownership the key would stay guarded forever and every later attempt to open
 * that game would skip it, leaving missing textures for the rest of the
 * session. The set is module-local because the TextureManager is game-wide:
 * two scenes queue into one shared cache, so a key queued by the first game
 * must not be queued again by the second before its load settles.
 *
 * Lifetime rule: a key leaves the guard when its file loads (`filecomplete`),
 * fails (`loaderror`), or its owning scene shuts down — whichever comes first.
 * Releasing on failure and shutdown is what lets the next caller retry.
 */
const keyOwners = new Map<string, SceneLoads>();

/** Scene → its in-flight loads, so a shutdown releases exactly that scene's keys. */
const sceneLoads = new WeakMap<Phaser.Scene, SceneLoads>();

function releaseKey(key: string): void {
  const owner = keyOwners.get(key);
  if (owner === undefined) return;
  keyOwners.delete(key);
  owner.keys.delete(key);
}

/** Releases everything `scene` still had in flight and unhooks its listeners. */
function detachScene(scene: Phaser.Scene): void {
  const record = sceneLoads.get(scene);
  if (record === undefined) return;

  sceneLoads.delete(scene);
  for (const key of record.keys) {
    keyOwners.delete(key);
  }
  record.keys.clear();
  record.failed.clear();
  record.load.off("filecomplete", record.onFileComplete);
  record.load.off("loaderror", record.onLoadError);
  record.load.off("complete", record.onComplete);
  record.events.off("shutdown", record.onShutdown);
}

/** Attaches the per-scene listeners once; repeated calls reuse the record. */
function attachScene(scene: Phaser.Scene): SceneLoads {
  const existing = sceneLoads.get(scene);
  if (existing !== undefined) return existing;

  const failed = new Set<string>();
  const record: SceneLoads = {
    load: scene.load,
    events: scene.events,
    keys: new Set<string>(),
    failed,
    onFileComplete: (key: string): void => {
      releaseKey(key);
      failed.delete(key);
    },
    onLoadError: (file: Phaser.Loader.File): void => {
      // Release for a later retry, but remember the key: the loader's
      // `complete` is the one moment a placeholder can be drawn before the
      // scene's `create` asks for the texture.
      releaseKey(file.key);
      failed.add(file.key);
    },
    onComplete: (): void => {
      for (const key of failed) ensureArtTexture(scene, key);
      failed.clear();
    },
    onShutdown: (): void => detachScene(scene),
  };

  sceneLoads.set(scene, record);
  record.load.on("filecomplete", record.onFileComplete);
  record.load.on("loaderror", record.onLoadError);
  record.load.on("complete", record.onComplete);
  record.events.on("shutdown", record.onShutdown);
  return record;
}

/**
 * Registers every key in `groups` that the TextureManager does not already
 * hold, rasterized at that key's `textureSizeFor` tier.
 *
 * Safe to call repeatedly and concurrently: an already-present texture is
 * satisfied as-is (that is how `mascot_idle` works as a word prompt without a
 * game group), a key still in flight is skipped until its load settles, and a
 * scene that shuts down mid-load hands its keys back for the next attempt.
 *
 * A file that errors is released for a later retry and remembered; when the
 * loader completes, that key is drawn as the neutral placeholder instead of
 * Phaser's `__MISSING` checkerboard, so a corrupt or absent SVG degrades the
 * art rather than the round.
 *
 * Call it from a scene's `preload`, where `scene.load` is queueing.
 */
export function preloadArtGroups(scene: Phaser.Scene, groups: readonly ArtGroup[]): void {
  for (const group of groups) {
    for (const asset of group.assets) {
      if (scene.textures.exists(asset.key) || keyOwners.has(asset.key)) continue;

      const owner = attachScene(scene);
      owner.keys.add(asset.key);
      keyOwners.set(asset.key, owner);

      const size = textureSizeFor(asset.key);
      scene.load.svg(asset.key, toDataUri(asset.svg), { width: size, height: size });
    }
  }
}
