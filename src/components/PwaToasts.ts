import type Phaser from "phaser";
import { getPwaBridge } from "../utils/pwaBridge";
import { PwaToast, type ToastKind } from "./PwaToast";

/**
 * Hub-side PWA lifecycle wiring: subscribes to the service-worker bridge and
 * surfaces update/offline toasts on the hub scene. One instance per hub
 * scene; `wire()` in `create()` and `destroy()` on scene shutdown.
 */
export class PwaToasts {
  private toast?: PwaToast;
  private unsubscribe?: () => void;

  constructor(private readonly scene: Phaser.Scene) {}

  /** Subscribes to PWA lifecycle events; a no-op when no bridge exists. */
  wire(): void {
    const bridge = getPwaBridge();
    if (!bridge) return;
    this.unsubscribe = bridge.subscribe((event) => {
      this.show(event === "needRefresh" ? "update" : "offline");
    });
    bridge.setHubActive(true);
    if (bridge.updateAvailable()) {
      this.show("update");
    }
  }

  /** Unsubscribes, clears hub-active and destroys any visible toast. */
  destroy(): void {
    this.unsubscribe?.();
    getPwaBridge()?.setHubActive(false);
    this.toast?.destroy();
    this.toast = undefined;
  }

  private show(kind: ToastKind): void {
    this.toast?.destroy();
    const bridge = getPwaBridge();
    if (!bridge) return;
    this.toast = new PwaToast(this.scene, {
      kind,
      onUpdate: () => bridge.updateNow(),
      onDismiss: () => {
        this.toast?.destroy();
        this.toast = undefined;
      },
    });
  }
}
