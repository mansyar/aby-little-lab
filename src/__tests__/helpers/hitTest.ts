/**
 * Engine-accurate Phaser 4.2.1 input hit-test simulation.
 *
 * Replicates `InputManager.pointWithinHitArea`: the pointer is transformed
 * into the Game Object's local space (translate to the object's position,
 * divide by scale — rotation is always zero for the subjects here), then the
 * object's displayOrigin is ADDED before the hit area is tested with
 * `Rectangle.Contains`.
 *
 * Because displayOrigin equals half the TEXTURE size for origin-0.5 Images,
 * custom hit areas live in texture-local space where (0,0) is the texture's
 * TOP-LEFT corner — not centered on the object position. A custom hit area
 * that does not cover the frame region actually touched is dead, no matter
 * where the visible icon appears. Objects without a custom hit area use the
 * engine's frame-based default rect (0,0,frameW,frameH), which after the
 * displayOrigin normalization covers exactly the visible, scaled texture.
 */
export interface HitTestSubject {
  x: number;
  y: number;
  /** Uniform scale (scaleX === scaleY); rotation is always 0 for subjects here. */
  scale: number;
  displayOriginX: number;
  displayOriginY: number;
  hitArea: { x: number; y: number; width: number; height: number };
}

/** Returns true when a pointer tap lands inside the object's hit area. */
export function tapHits(subject: HitTestSubject, pointerX: number, pointerY: number): boolean {
  const localX = (pointerX - subject.x) / subject.scale + subject.displayOriginX;
  const localY = (pointerY - subject.y) / subject.scale + subject.displayOriginY;
  const { x, y, width, height } = subject.hitArea;
  return localX >= x && localX <= x + width && localY >= y && localY <= y + height;
}
