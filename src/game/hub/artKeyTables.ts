/**
 * Art texture-key tables for the Hub's idle art prewarm.
 *
 * These are key-plus-raster-tier pairs transcribed from the frozen art tables
 * in `src/game/art/` (plus the story panels in `src/game/storyOrderArt.ts`).
 * Only key strings and sizes live here — importing the group objects would drag
 * every game's SVG markup into the shell bundle. The parity test in
 * `prewarm.test.ts` pins every entry to the live art tables.
 *
 * Split out of `prewarm.ts` to keep the engine module inside the 400-line
 * production budget; `artPrewarm.ts` composes these tables into the per-game
 * key source.
 */

/**
 * Raster edges matching `TEXTURE_SIZES`. Game art only ever uses the `icon`
 * (shadows, small glyphs) and `card` (everything else) tiers — no game group
 * holds a `hero` (mascot) key, so no 512 entry exists here.
 */
export const ART_ICON_SIZE = 160;
export const ART_CARD_SIZE = 256;

/** One `[key, size]` pair; groups compose per-game lists out of these. */
export type ArtKeyDef = readonly [key: string, size: number];

const CARD = ART_CARD_SIZE;
const ICON = ART_ICON_SIZE;

export const SHAPES_KEYS: readonly ArtKeyDef[] = [
  ["shape_circle", CARD],
  ["shape_square", CARD],
  ["shape_triangle", CARD],
  ["shape_star", CARD],
  ["shape_heart", CARD],
  ["shape_crescent", CARD],
  ["shape_arrow", CARD],
  ["shape_diamond", CARD],
  ["shape_hexagon", CARD],
  ["shape_octagon", CARD],
  ["shape_oval", CARD],
  ["shape_pentagon", CARD],
  ["shape_plus", CARD],
  ["shape_rectangle", CARD],
  ["shape_ring", CARD],
  ["shape_semicircle", CARD],
  ["shape_teardrop", CARD],
  ["shape_trapezoid", CARD],
  ["shape_cube", CARD],
  ["shape_cross", CARD],
  ["shape_chevron", CARD],
  ["shape_capsule", CARD],
  ["shape_sector", CARD],
  ["shape_parallelogram", CARD],
];

export const CUTOUTS_KEYS: readonly ArtKeyDef[] = [
  ["cutout_circle", CARD],
  ["cutout_square", CARD],
  ["cutout_triangle", CARD],
  ["cutout_star", CARD],
  ["cutout_heart", CARD],
  ["cutout_crescent", CARD],
  ["cutout_arrow", CARD],
  ["cutout_diamond", CARD],
  ["cutout_hexagon", CARD],
  ["cutout_octagon", CARD],
  ["cutout_oval", CARD],
  ["cutout_pentagon", CARD],
  ["cutout_plus", CARD],
  ["cutout_rectangle", CARD],
  ["cutout_ring", CARD],
  ["cutout_semicircle", CARD],
  ["cutout_teardrop", CARD],
  ["cutout_trapezoid", CARD],
  ["cutout_cube", CARD],
  ["cutout_cross", CARD],
  ["cutout_chevron", CARD],
  ["cutout_capsule", CARD],
  ["cutout_sector", CARD],
  ["cutout_parallelogram", CARD],
];

export const ANIMALS_KEYS: readonly ArtKeyDef[] = [
  ["animal_monkey", CARD],
  ["animal_rabbit", CARD],
  ["animal_cat", CARD],
  ["animal_dog", CARD],
  ["animal_elephant", CARD],
  ["animal_pig", CARD],
];

export const FOOD_KEYS: readonly ArtKeyDef[] = [
  ["food_banana", CARD],
  ["food_carrot", CARD],
  ["food_fish", CARD],
  ["food_bone", CARD],
  ["food_peanut", CARD],
  ["food_apple", CARD],
];

export const ITEMS_KEYS: readonly ArtKeyDef[] = [
  ["sm_house", CARD],
  ["sm_tree", CARD],
  ["sm_car", CARD],
  ["sm_boat", CARD],
  ["sm_ball", CARD],
  ["sm_umbrella", CARD],
  ["sm_airplane", CARD],
  ["sm_mushroom", CARD],
  ["sm_sock", CARD],
  ["sm_boot", CARD],
  ["sm_kite", CARD],
  ["sm_bell", CARD],
  ["sm_bug", CARD],
  ["sm_duck", CARD],
  ["sm_hat", CARD],
  ["sm_sun", CARD],
  ["sm_bed", CARD],
  ["sm_cup", CARD],
  ["sm_fox", CARD],
  ["sm_map", CARD],
];

export const GLYPHS_KEYS: readonly ArtKeyDef[] = [
  ["bubble", CARD],
  ["sleep_zzz", ICON],
  ["card_back", CARD],
  ["arrow_more", CARD],
  ["arrow_less", CARD],
  ["equals", ICON],
  ["plus", ICON],
  ["minus", ICON],
];

export const FACES_KEYS: readonly ArtKeyDef[] = [
  ["face_happy", CARD],
  ["face_sad", CARD],
  ["face_angry", CARD],
  ["face_scared", CARD],
];

export const TOYS_KEYS: readonly ArtKeyDef[] = [
  ["toy_teddy_bear", CARD],
  ["toy_car", CARD],
  ["toy_rocket", CARD],
  ["toy_drum", CARD],
  ["toy_ball", CARD],
  ["toy_block", CARD],
  ["toy_box", CARD],
];

export const MUSIC_KEYS: readonly ArtKeyDef[] = [
  ["frog_green", CARD],
  ["frog_blue", CARD],
  ["frog_red", CARD],
  ["lilypad", CARD],
];

export const LETTERS_KEYS: readonly ArtKeyDef[] = [
  ["letter_a", CARD],
  ["letter_b", CARD],
  ["letter_c", CARD],
  ["letter_d", CARD],
  ["letter_e", CARD],
  ["letter_f", CARD],
  ["letter_g", CARD],
  ["letter_h", CARD],
  ["letter_i", CARD],
  ["letter_j", CARD],
  ["letter_k", CARD],
  ["letter_l", CARD],
  ["letter_m", CARD],
  ["letter_n", CARD],
  ["letter_o", CARD],
  ["letter_p", CARD],
  ["letter_q", CARD],
  ["letter_r", CARD],
  ["letter_s", CARD],
  ["letter_t", CARD],
  ["letter_u", CARD],
  ["letter_v", CARD],
  ["letter_w", CARD],
  ["letter_x", CARD],
  ["letter_y", CARD],
  ["letter_z", CARD],
];

export const NUMERALS_KEYS: readonly ArtKeyDef[] = [
  ["numeral_0", CARD],
  ["numeral_1", CARD],
  ["numeral_2", CARD],
  ["numeral_3", CARD],
  ["numeral_4", CARD],
  ["numeral_5", CARD],
  ["numeral_6", CARD],
  ["numeral_7", CARD],
  ["numeral_8", CARD],
  ["numeral_9", CARD],
];

export const SHADOWS_KEYS: readonly ArtKeyDef[] = [
  ["sm_shadow_house", ICON],
  ["sm_shadow_tree", ICON],
  ["sm_shadow_car", ICON],
  ["sm_shadow_boat", ICON],
  ["sm_shadow_ball", ICON],
  ["sm_shadow_umbrella", ICON],
  ["sm_shadow_airplane", ICON],
  ["sm_shadow_mushroom", ICON],
  ["sm_shadow_sock", ICON],
  ["sm_shadow_boot", ICON],
  ["sm_shadow_kite", ICON],
  ["sm_shadow_bell", ICON],
];

export const ROBOT_PATH_KEYS: readonly ArtKeyDef[] = [
  ["robot_idle", CARD],
  ["robot_walk", CARD],
  ["robot_puzzled", CARD],
  ["robot_go", CARD],
  ["robot_rock", CARD],
  ["robot_star", CARD],
];

export const MACHINE_KEYS: readonly ArtKeyDef[] = [
  ["machine_idle", CARD],
  ["machine_working", CARD],
  ["machine_puzzled", CARD],
  ["machine_happy", CARD],
  ["machine_spray", CARD],
  ["machine_pour", CARD],
  ["machine_paint", CARD],
  ["machine_polish", CARD],
  ["machine_lift", CARD],
  ["machine_stack", CARD],
  ["machine_teddy", CARD],
  ["machine_car", CARD],
  ["machine_duck", CARD],
  ["machine_drum", CARD],
  ["machine_robot", CARD],
  ["machine_blocks", CARD],
];

export const STORY_PANEL_KEYS: readonly ArtKeyDef[] = [
  ["story_seed_planted", CARD],
  ["story_seed_sprout", CARD],
  ["story_seed_flower", CARD],
  ["story_balloon_flat", CARD],
  ["story_balloon_round", CARD],
  ["story_balloon_aloft", CARD],
  ["story_egg", CARD],
  ["story_egg_cracking", CARD],
  ["story_duckling", CARD],
  ["story_ice_scoop", CARD],
  ["story_ice_dripping", CARD],
  ["story_ice_puddle", CARD],
  ["story_cake_whole", CARD],
  ["story_cake_candles", CARD],
  ["story_cake_sliced", CARD],
  ["story_snow_pile", CARD],
  ["story_snowman", CARD],
  ["story_snowman_hat", CARD],
  ["story_blocks_scattered", CARD],
  ["story_tower_half", CARD],
  ["story_tower_tall", CARD],
  ["story_kite_folded", CARD],
  ["story_kite_raised", CARD],
  ["story_kite_flying", CARD],
  ["story_pancake_batter", CARD],
  ["story_pancake_cooked", CARD],
  ["story_pancake_berries", CARD],
  ["story_soap_bar", CARD],
  ["story_soap_bubbles", CARD],
  ["story_soap_bubble_big", CARD],
  ["story_pencil_new", CARD],
  ["story_pencil_sharp", CARD],
  ["story_pencil_drawing", CARD],
  ["story_sand_pile", CARD],
  ["story_sand_castle", CARD],
  ["story_sand_flag", CARD],
  ["story_lantern_off", CARD],
  ["story_lantern_on", CARD],
  ["story_lantern_glow", CARD],
  ["story_cupcake_plain", CARD],
  ["story_cupcake_frosted", CARD],
  ["story_cupcake_cherry", CARD],
  ["story_train_track", CARD],
  ["story_train_near", CARD],
  ["story_train_waving", CARD],
  ["story_banana_whole", CARD],
  ["story_banana_peeled", CARD],
  ["story_banana_peel", CARD],
  ["story_cup_full", CARD],
  ["story_cup_pouring", CARD],
  ["story_cup_empty", CARD],
  ["story_foot_bare", CARD],
  ["story_foot_sock", CARD],
  ["story_foot_shoe", CARD],
  ["story_cloud", CARD],
  ["story_cloud_raining", CARD],
  ["story_rain_puddle", CARD],
  ["story_clothes_wet", CARD],
  ["story_clothes_drying", CARD],
  ["story_clothes_dry", CARD],
  ["story_sun_rise", CARD],
  ["story_sun_noon", CARD],
  ["story_sun_set", CARD],
  ["story_caterpillar", CARD],
  ["story_cocoon", CARD],
  ["story_butterfly", CARD],
  ["story_frogspawn", CARD],
  ["story_tadpole", CARD],
  ["story_frog", CARD],
  ["story_shadow_morning", CARD],
  ["story_shadow_noon", CARD],
  ["story_shadow_evening", CARD],
  ["story_magnet_bar", CARD],
  ["story_magnet_clip", CARD],
  ["story_magnet_chain", CARD],
  ["story_mirror_frame", CARD],
  ["story_mirror_reflection", CARD],
  ["story_mirror_smile", CARD],
  ["story_kettle_cold", CARD],
  ["story_kettle_steam", CARD],
  ["story_kettle_tea", CARD],
  ["story_paint_blank", CARD],
  ["story_paint_stroke", CARD],
  ["story_paint_picture", CARD],
  ["story_bee_flower", CARD],
  ["story_bee_landing", CARD],
  ["story_bee_flying", CARD],
  ["story_puzzle_pieces", CARD],
  ["story_puzzle_half", CARD],
  ["story_puzzle_done", CARD],
];
