import type Phaser from "phaser";
import { PROFILE_AVATAR_TEXTURES } from "../game/profileLogic";
import { attachPressFeedback } from "../utils/pressFeedback";
import { getActiveProfile, getProfiles, switchProfile } from "../utils/storage";
import { textureSizeFor } from "../utils/textureTiers";

/** Rendered size of one avatar texture square, in game pixels. */
const AVATAR_TEXTURE_SIZE = textureSizeFor(PROFILE_AVATAR_TEXTURES.cat);
/** Displayed diameter of the active-profile chip (top-left). */
const AVATAR_CHIP_DISPLAY = 72;
/** Kid-tappable hit box around the chip, in game pixels. */
const AVATAR_CHIP_HIT = 96;
/** Inset of the chip's hit box from the screen corner. */
const AVATAR_CHIP_INSET = 20;
/** Avatar display size inside the open profile picker. */
const PICKER_AVATAR_DISPLAY = 96;
/** Horizontal gap between picker avatars. */
const PICKER_AVATAR_SPACING = 40;
/** Depth of the picker overlay and its selection ring. */
const PICKER_DEPTH = 20;

export interface ProfileChipDeps {
  scene: Phaser.Scene;
  /** Invoked on chip tap (audio unlock/start happens before the picker opens). */
  onOpen: () => void;
  /** Invoked after a profile switch so the scene can re-render dependent UI. */
  onSwitch: () => void;
}

/**
 * The kid-tappable avatar chip (top-left) showing the active profile's
 * avatar, plus the textless profile picker it opens. Tapping the chip opens
 * the picker — no parental lock. Tapping a profile switches to it and
 * re-renders the sticker shelf; tapping the overlay closes without switching.
 */
export class ProfileChip {
  private chip?: Phaser.GameObjects.Image;
  private pickerObjects: Phaser.GameObjects.GameObject[] = [];
  private open = false;

  constructor(private readonly deps: ProfileChipDeps) {}

  /** Creates the chip. Call once per scene `create()`. */
  create(): void {
    const active = getActiveProfile();
    const chip = this.deps.scene.add.image(
      AVATAR_CHIP_INSET + AVATAR_CHIP_HIT / 2,
      AVATAR_CHIP_INSET + AVATAR_CHIP_HIT / 2,
      PROFILE_AVATAR_TEXTURES[active.avatarId],
    );
    chip.setScale(AVATAR_CHIP_DISPLAY / AVATAR_TEXTURE_SIZE);

    // Flat storybook ring so the active profile is unambiguous without
    // relying on scale alone (spec FR2).
    const ring = this.deps.scene.add.rectangle(
      AVATAR_CHIP_INSET + AVATAR_CHIP_HIT / 2,
      AVATAR_CHIP_INSET + AVATAR_CHIP_HIT / 2,
      AVATAR_CHIP_DISPLAY + 20,
      AVATAR_CHIP_DISPLAY + 20,
    );
    ring.setFillStyle(0x000000, 0);
    ring.setStrokeStyle(4, 0x2d3748, 1); // thick flat outline (#2D3748)
    ring.setDepth(-1);
    // Frame-based default hit area covers the visible chip exactly (custom
    // rects are tested in texture-local space and miss on 512px textures).
    chip.setInteractive();
    chip.on("pointerup", () => {
      this.deps.onOpen();
      this.openProfilePicker();
    });
    attachPressFeedback(chip);
    this.chip = chip;
  }

  /** True while the picker overlay is on screen. */
  isOpen(): boolean {
    return this.open;
  }

  /** Re-textures the avatar chip to the active profile (after switch/add/delete). */
  refresh(): void {
    this.chip?.setTexture(PROFILE_AVATAR_TEXTURES[getActiveProfile().avatarId]);
  }

  /** Closes the picker overlay and resets the picker state (no stale lock). */
  close(): void {
    for (const obj of this.pickerObjects) obj.destroy();
    this.pickerObjects = [];
    this.open = false;
  }

  /** Tears down chip and picker (scene shutdown). */
  destroy(): void {
    this.close();
    this.chip?.destroy();
    this.chip = undefined;
  }

  private openProfilePicker(): void {
    if (this.open) return;
    this.open = true;
    const scene = this.deps.scene;
    const width = scene.cameras.main.width;
    const height = scene.cameras.main.height;
    const profiles = getProfiles();
    const activeId = getActiveProfile().id;

    const overlay = scene.add.rectangle(width / 2, height / 2, width, height, 0x2d3748, 0.65);
    overlay.setDepth(PICKER_DEPTH);
    overlay.setInteractive();
    overlay.on("pointerup", () => this.close());
    this.pickerObjects.push(overlay);

    const totalWidth =
      profiles.length * PICKER_AVATAR_DISPLAY + (profiles.length - 1) * PICKER_AVATAR_SPACING;
    let x = width / 2 - totalWidth / 2 + PICKER_AVATAR_DISPLAY / 2;
    const y = height / 2;
    for (const profile of profiles) {
      const avatar = scene.add.image(x, y, PROFILE_AVATAR_TEXTURES[profile.avatarId]);
      avatar.setDepth(PICKER_DEPTH + 1);
      avatar.setInteractive();
      const baseScale = PICKER_AVATAR_DISPLAY / AVATAR_TEXTURE_SIZE;
      avatar.setScale(profile.id === activeId ? baseScale * 1.15 : baseScale);
      if (profile.id === activeId) {
        // Selection ring behind the enlarged active avatar; destroyed with
        // the picker on close via pickerObjects.
        const marker = scene.add.rectangle(
          x,
          y,
          PICKER_AVATAR_DISPLAY + 16,
          PICKER_AVATAR_DISPLAY + 16,
        );
        marker.setFillStyle(0x000000, 0);
        marker.setStrokeStyle(4, 0x2d3748, 1);
        marker.setDepth(PICKER_DEPTH);
        this.pickerObjects.push(marker);
      }
      avatar.on("pointerup", () => {
        if (profile.id !== activeId) {
          switchProfile(profile.id);
          this.refresh();
          this.deps.onSwitch();
        }
        this.close();
      });
      this.pickerObjects.push(avatar);
      x += PICKER_AVATAR_DISPLAY + PICKER_AVATAR_SPACING;
    }
  }
}
