import type Phaser from "phaser";
import { PROFILE_AVATAR_TEXTURES } from "../../game/profileLogic";
import { MAX_PROFILES } from "../../types";
import { attachPressFeedback } from "../../utils/pressFeedback";
import {
  addProfile,
  deleteProfile,
  getActiveProfile,
  getAvailableAvatars,
  getPlayTime,
  getProfiles,
  setPlayTimeLimit,
} from "../../utils/storage";
import { textStyle } from "../../utils/typography";
import {
  AVATAR_TEXTURE_SIZE,
  BACKDROP_COLOR,
  centredHitArea,
  createModalButton,
  DANGER_COLOR,
  DISABLED_COLOR,
  type ObjectBucket,
  OUTLINE_COLOR,
  OVERLAY_ALPHA,
  PANEL_COLOR,
  PANEL_HEIGHT,
  PANEL_WIDTH,
  PRIMARY_COLOR,
  ROW_HEIGHT,
  TOGGLE_WIDTH,
} from "./primitives";

/** Daily play-time limit options cycled by the per-profile chip (null = Off). */
const PLAY_TIME_OPTIONS: ReadonlyArray<number | null> = [null, 15, 30, 45, 60];
/** Outline ring behind the active profile row in the Profiles manager. */
const ACTIVE_RING_SIZE = 112;

/** "Off" for an unlimited budget, otherwise "15m"-style labels. */
export function playTimeLabel(limitMinutes: number | null): string {
  return limitMinutes === null ? "Off" : `${limitMinutes}m`;
}

export interface ProfilesOverlayDeps {
  scene: Phaser.Scene;
  /** Shared overlay lifecycle bucket (Progress/Profiles/iOS/reset modal). */
  overlayObjects: ObjectBucket;
  /** Bucket for the stacked delete-confirmation modal. */
  modalObjects: ObjectBucket;
  /** Called after persisted profile state changes so the scene can re-render. */
  onProgressReset?: () => void;
}

/**
 * The profile manager overlay: one row per profile (avatar + Delete + play-time
 * chip) plus unused avatars for adding new profiles (up to 4). Rebuilds itself
 * after add/delete so the list always reflects persisted state.
 */
export class ProfilesOverlay {
  private readonly deps: ProfilesOverlayDeps;

  constructor(deps: ProfilesOverlayDeps) {
    this.deps = deps;
  }

  open(): void {
    this.close();
    const { scene } = this.deps;
    const { width, height } = scene.cameras.main;
    const centerX = width / 2;
    const centerY = height / 2;
    const profiles = getProfiles();
    const available = getAvailableAvatars();

    const backdrop = scene.add
      .rectangle(centerX, centerY, width, height, BACKDROP_COLOR, OVERLAY_ALPHA)
      .setInteractive();
    backdrop.on("pointerdown", () => this.close());
    this.deps.overlayObjects.push(backdrop);
    this.deps.overlayObjects.push(
      scene.add
        .rectangle(centerX, centerY, PANEL_WIDTH, PANEL_HEIGHT, PANEL_COLOR)
        .setStrokeStyle(4, OUTLINE_COLOR),
    );
    this.deps.overlayObjects.push(
      scene.add
        .text(
          centerX,
          centerY - 250,
          "Profiles",
          textStyle({
            color: "#2d3748",
            fontSize: "36px",
          }),
        )
        .setOrigin(0.5),
    );

    profiles.forEach((profile, index) => {
      const y = centerY - 194 + index * 80;
      // Persistent outline marks the ACTIVE profile (read-only in the report,
      // authoritative here) so it is never identified by position alone.
      if (profile.id === getActiveProfile().id) {
        const ring = scene.add.rectangle(centerX - 110, y, ACTIVE_RING_SIZE, ACTIVE_RING_SIZE);
        ring.setStrokeStyle(4, OUTLINE_COLOR, 1);
        this.deps.overlayObjects.push(ring);
      }
      const avatar = scene.add.image(centerX - 110, y, PROFILE_AVATAR_TEXTURES[profile.avatarId]);
      avatar.setScale(96 / AVATAR_TEXTURE_SIZE);
      attachPressFeedback(avatar);
      this.deps.overlayObjects.push(avatar);
      const remove = scene.add
        .text(
          centerX + 60,
          y,
          "Delete",
          textStyle({
            color: DANGER_COLOR,
            fontSize: "30px",
          }),
        )
        .setOrigin(0.5);
      // Custom hit areas are tested in the engine frame: InputManager adds
      // the displayOrigin before the callback, so centredHitArea cancels it
      // and the band lands on the drawn word.
      remove.setInteractive(centredHitArea(TOGGLE_WIDTH, ROW_HEIGHT));
      remove.on("pointerdown", () => this.showDeleteModal(profile.id));
      attachPressFeedback(remove);
      this.deps.overlayObjects.push(remove);

      const limit = getPlayTime(profile.id).limitMinutes;
      const chip = scene.add
        .text(
          centerX - 10,
          y,
          `Play Time: ${playTimeLabel(limit)}`,
          textStyle({
            color: PRIMARY_COLOR,
            fontSize: "26px",
          }),
        )
        .setOrigin(0.5);
      // Same engine frame as the Delete band (comment above).
      chip.setInteractive(centredHitArea(TOGGLE_WIDTH / 2, ROW_HEIGHT));
      chip.on("pointerdown", () => {
        const current = getPlayTime(profile.id).limitMinutes;
        const index = PLAY_TIME_OPTIONS.indexOf(current);
        const safeIndex = index === -1 ? 0 : index;
        const next = PLAY_TIME_OPTIONS[(safeIndex + 1) % PLAY_TIME_OPTIONS.length];
        setPlayTimeLimit(profile.id, next);
        chip.setText(`Play Time: ${playTimeLabel(next)}`);
        // Keep the Hub's indicator and lock state in sync with the new limit.
        this.deps.onProgressReset?.();
      });
      attachPressFeedback(chip);
      this.deps.overlayObjects.push(chip);
    });

    if (profiles.length >= MAX_PROFILES) {
      this.deps.overlayObjects.push(
        scene.add
          .text(
            centerX,
            centerY + 116,
            "Profile limit reached",
            textStyle({
              color: DISABLED_COLOR,
              fontSize: "30px",
            }),
          )
          .setOrigin(0.5),
      );
    } else {
      this.deps.overlayObjects.push(
        scene.add
          .text(
            centerX,
            centerY + 96,
            "Add Profile",
            textStyle({
              color: PRIMARY_COLOR,
              fontSize: "30px",
            }),
          )
          .setOrigin(0.5),
      );
      const totalWidth = available.length * 80 + (available.length - 1) * 36;
      let x = centerX - totalWidth / 2 + 40;
      const y = centerY + 146;
      for (const avatarId of available) {
        const avatar = scene.add.image(x, y, PROFILE_AVATAR_TEXTURES[avatarId]);
        avatar.setScale(80 / AVATAR_TEXTURE_SIZE);
        avatar.setInteractive();
        avatar.on("pointerdown", () => {
          addProfile(avatarId);
          this.open();
          this.deps.onProgressReset?.();
        });
        attachPressFeedback(avatar);
        this.deps.overlayObjects.push(avatar);
        x += 80 + 36;
      }
    }

    this.deps.overlayObjects.push(
      createModalButton(
        scene,
        centerX,
        centerY + 220,
        this.deps.overlayObjects,
        "Close",
        PRIMARY_COLOR,
        () => this.close(),
      ),
    );
  }

  /** Destroys the profile manager overlay (not the panel). */
  close(): void {
    for (const object of this.deps.overlayObjects) object.destroy();
    this.deps.overlayObjects.length = 0;
  }

  /** Shows the two-step "Delete profile?" confirmation modal. */
  private showDeleteModal(profileId: string): void {
    const { scene } = this.deps;
    const { width, height } = scene.cameras.main;
    const centerX = width / 2;
    const centerY = height / 2;

    const modalBackdrop = scene.add
      .rectangle(centerX, centerY, width, height, BACKDROP_COLOR, OVERLAY_ALPHA)
      .setInteractive();
    modalBackdrop.on("pointerdown", () => this.closeDeleteModal());
    this.deps.modalObjects.push(modalBackdrop);
    this.deps.modalObjects.push(
      scene.add
        .rectangle(centerX, centerY, PANEL_WIDTH, PANEL_HEIGHT, PANEL_COLOR)
        .setStrokeStyle(4, OUTLINE_COLOR),
    );
    this.deps.modalObjects.push(
      scene.add
        .text(
          centerX,
          centerY - 105,
          "Delete profile?",
          textStyle({
            color: "#2d3748",
            fontSize: "36px",
          }),
        )
        .setOrigin(0.5),
    );
    this.deps.modalObjects.push(
      scene.add
        .text(
          centerX,
          centerY - 25,
          "This profile's stickers will be lost.",
          textStyle({
            color: "#2d3748",
            fontSize: "30px",
          }),
        )
        .setOrigin(0.5),
    );
    this.deps.modalObjects.push(
      createModalButton(
        scene,
        centerX,
        centerY + 45,
        this.deps.overlayObjects,
        "Cancel",
        PRIMARY_COLOR,
        () => this.closeDeleteModal(),
        { bucket: this.deps.modalObjects },
      ),
    );
    this.deps.modalObjects.push(
      createModalButton(
        scene,
        centerX,
        centerY + 125,
        this.deps.overlayObjects,
        "Delete",
        DANGER_COLOR,
        () => this.confirmDelete(profileId),
        { bucket: this.deps.modalObjects, emphasized: true },
      ),
    );
  }

  /** Closes the delete confirmation modal, keeping the profile overlay open. */
  private closeDeleteModal(): void {
    for (const object of this.deps.modalObjects) object.destroy();
    this.deps.modalObjects.length = 0;
  }

  /** Deletes the profile, then rebuilds the profile overlay. */
  private confirmDelete(profileId: string): void {
    deleteProfile(profileId);
    this.closeDeleteModal();
    this.open();
    this.deps.onProgressReset?.();
  }
}
