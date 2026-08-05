import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  allowPinchZoom,
  PINCH_ZOOM_VIEWPORT,
  RESTORED_VIEWPORT,
  restorePinchZoom,
} from "../../utils/viewportZoom";

describe("viewportZoom", () => {
  let viewport: HTMLMetaElement | null = null;

  beforeEach(() => {
    viewport = document.createElement("meta");
    viewport.name = "viewport";
    viewport.content = "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no";
    document.head.appendChild(viewport);
  });

  afterEach(() => {
    document.head.innerHTML = "";
  });

  it("relaxes user-scalable and maximum-scale when allowing pinch zoom", () => {
    allowPinchZoom();
    expect(viewport?.content).toBe(PINCH_ZOOM_VIEWPORT);
  });

  it("restores the original lock after pinch zoom is closed", () => {
    allowPinchZoom();
    restorePinchZoom();
    expect(viewport?.content).toBe(RESTORED_VIEWPORT);
  });

  it("is safe to restore before any allow call", () => {
    restorePinchZoom();
    expect(viewport?.content).toBe(RESTORED_VIEWPORT);
  });

  it("keeps working when no viewport meta tag exists", () => {
    document.head.innerHTML = "";
    expect(() => allowPinchZoom()).not.toThrow();
    expect(() => restorePinchZoom()).not.toThrow();
  });
});
