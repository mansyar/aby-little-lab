import type Phaser from "phaser";

/**
 * Dynamic-import loaders for the 7 game scenes, keyed by scene key
 * (matching the `sceneKey` values of GAME_TILES in HubScene).
 *
 * Phaser 4 does not support lazy loaders in the config `scene` array
 * (entries are invoked with `new`), so scenes must be imported and
 * registered at runtime via `ensureSceneLoaded`.
 */
export const sceneLoaders: Record<string, () => Promise<Phaser.Types.Scenes.SceneType>> = {
  ShapeSorter: () => import("./ShapeSorterScene").then((m) => m.ShapeSorterScene),
  AnimalTrace: () => import("./AnimalTraceScene").then((m) => m.AnimalTraceScene),
  PopFreeze: () => import("./PopFreezeScene").then((m) => m.PopFreezeScene),
  ShadowMatch: () => import("./ShadowMatchScene").then((m) => m.ShadowMatchScene),
  MusicalMemory: () => import("./MusicalMemoryScene").then((m) => m.MusicalMemoryScene),
  BigSmall: () => import("./BigSmallScene").then((m) => m.BigSmallScene),
  PatternBuilder: () => import("./PatternBuilderScene").then((m) => m.PatternBuilderScene),
};

/**
 * Ensures a scene is registered with the Scene Manager, dynamically
 * importing and registering it on first use. No-op when the scene is
 * already registered. Call before `scene.start(key)` when navigating
 * into a lazy-loaded game scene.
 */
export async function ensureSceneLoaded(
  scene: Phaser.Scene,
  key: string,
  loaders: Record<string, () => Promise<Phaser.Types.Scenes.SceneType>> = sceneLoaders,
): Promise<void> {
  if (scene.scene.get(key)) {
    return;
  }
  const sceneClass = await loaders[key]();
  scene.scene.add(key, sceneClass);
}
