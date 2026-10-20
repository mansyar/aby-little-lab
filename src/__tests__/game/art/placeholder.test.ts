import type Phaser from "phaser";

/**
 * `placeholder.ts` keeps a module-level "already warned" set, so every test
 * re-imports a fresh copy instead of the module exposing a test-only reset.
 */
type PlaceholderModule = typeof import("../../../game/art/placeholder");

async function loadPlaceholder(): Promise<PlaceholderModule> {
  vi.resetModules();
  return import("../../../game/art/placeholder");
}

interface FakeContext {
  fillStyle: string;
  strokeStyle: string;
  lineWidth: number;
  fillRect: ReturnType<typeof vi.fn>;
  strokeRect: ReturnType<typeof vi.fn>;
}

interface FakeCanvasTexture {
  readonly context: FakeContext;
  refresh: ReturnType<typeof vi.fn>;
}

function createCanvasTexture(): FakeCanvasTexture {
  return {
    context: {
      fillStyle: "",
      strokeStyle: "",
      lineWidth: 0,
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
    },
    refresh: vi.fn(),
  };
}

/**
 * Minimal TextureManager double.
 *
 * `createCanvas` deliberately does not register the key it creates: the real
 * manager would, and a short-circuit on the next call would hide whether the
 * warning itself is deduplicated.
 */
class PlaceholderScene {
  readonly present = new Set<string>();
  readonly createdKeys: string[] = [];
  readonly createdSizes: Array<{ width: number; height: number }> = [];
  readonly created: FakeCanvasTexture[] = [];
  readonly textures = {
    exists: vi.fn((key: string) => this.present.has(key)),
    createCanvas: vi.fn((key: string, width: number, height: number): FakeCanvasTexture | null => {
      this.createdKeys.push(key);
      this.createdSizes.push({ width, height });
      const texture = createCanvasTexture();
      this.created.push(texture);
      return texture;
    }),
  };
}

const asScene = (scene: PlaceholderScene): Phaser.Scene => scene as unknown as Phaser.Scene;

let warnSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.clearAllMocks();
  warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
});

afterEach(() => {
  warnSpy.mockRestore();
});

describe("ensureArtTexture", () => {
  it("returns true without touching anything when the texture exists", async () => {
    const { ensureArtTexture } = await loadPlaceholder();
    const scene = new PlaceholderScene();
    scene.present.add("shape_circle");

    expect(ensureArtTexture(asScene(scene), "shape_circle")).toBe(true);
    expect(scene.textures.createCanvas).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("warns once for a repeated missing key and still creates the placeholder", async () => {
    const { ensureArtTexture } = await loadPlaceholder();
    const scene = new PlaceholderScene();

    expect(ensureArtTexture(asScene(scene), "sm_shadow_ball")).toBe(true);
    expect(ensureArtTexture(asScene(scene), "sm_shadow_ball")).toBe(true);

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("sm_shadow_ball"));
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("missing asset"));
    expect(scene.createdKeys).toEqual(["sm_shadow_ball", "sm_shadow_ball"]);
  });

  it("warns once for each distinct missing key", async () => {
    const { ensureArtTexture } = await loadPlaceholder();
    const scene = new PlaceholderScene();

    ensureArtTexture(asScene(scene), "shape_circle");
    ensureArtTexture(asScene(scene), "animal_frog");
    ensureArtTexture(asScene(scene), "shape_circle");

    expect(warnSpy).toHaveBeenCalledTimes(2);
  });

  it("sizes the placeholder with textureSizeFor", async () => {
    const { ensureArtTexture } = await loadPlaceholder();
    const scene = new PlaceholderScene();

    ensureArtTexture(asScene(scene), "sm_shadow_ball");
    ensureArtTexture(asScene(scene), "shape_circle");

    // icon tier / card tier from src/utils/textureTiers.ts.
    expect(scene.createdSizes).toEqual([
      { width: 160, height: 160 },
      { width: 256, height: 256 },
    ]);
  });

  it("fills the tile white inside a centred product outline", async () => {
    const { ensureArtTexture } = await loadPlaceholder();
    const scene = new PlaceholderScene();

    ensureArtTexture(asScene(scene), "shape_circle");

    const [texture] = scene.created;
    expect(texture.context.fillStyle).toBe("#FFFFFF");
    expect(texture.context.fillRect).toHaveBeenCalledWith(0, 0, 256, 256);
    expect(texture.context.strokeStyle).toBe("#2D3748");
    expect(texture.context.lineWidth).toBe(6);
    expect(texture.context.strokeRect).toHaveBeenCalledWith(3, 3, 250, 250);
    expect(texture.refresh).toHaveBeenCalledTimes(1);
  });

  it("returns false without throwing when the texture manager refuses a canvas", async () => {
    const { ensureArtTexture } = await loadPlaceholder();
    const scene = new PlaceholderScene();
    scene.textures.createCanvas.mockReturnValueOnce(null);

    expect(ensureArtTexture(asScene(scene), "shape_circle")).toBe(false);
    expect(scene.created).toHaveLength(0);
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it("never throws for an unusual key", async () => {
    const { ensureArtTexture } = await loadPlaceholder();
    const scene = new PlaceholderScene();

    expect(() => ensureArtTexture(asScene(scene), "")).not.toThrow();
    expect(ensureArtTexture(asScene(scene), "art/odd key")).toBe(true);
  });
});
