import { describe, expect, it } from "vitest";
import faceAngrySvg from "../../assets/svg/feelings/face_angry.svg?raw";
import faceHappySvg from "../../assets/svg/feelings/face_happy.svg?raw";
import faceSadSvg from "../../assets/svg/feelings/face_sad.svg?raw";
import faceScaredSvg from "../../assets/svg/feelings/face_scared.svg?raw";
import stickerFeelingsFacesSvg from "../../assets/svg/stickers/sticker_feelings_faces.svg?raw";
import tileFeelingsFacesSvg from "../../assets/svg/ui/tile_feelings_faces.svg?raw";

/**
 * Feelings Faces art guards (NFR-5, NFR-7).
 *
 * The four expression SVGs must be one kid in four moods. The framing block
 * asserted below is byte-identical across all four files, so expression
 * changes alone carry the feeling and each face survives grayscale — colour is
 * reinforcement, never the only cue. Flat-vector and 512 viewBox rules come
 * from `docs/SVG_STYLE.md`.
 */

const FACES = {
  happy: faceHappySvg,
  sad: faceSadSvg,
  angry: faceAngrySvg,
  scared: faceScaredSvg,
};

const ASSETS = [
  faceHappySvg,
  faceSadSvg,
  faceAngrySvg,
  faceScaredSvg,
  tileFeelingsFacesSvg,
  stickerFeelingsFacesSvg,
];

/**
 * Framing shared by every face: shirt with its rounded crew neckline (no neck),
 * big round head, one soft hair shape, small rounded nose. If one of these
 * drifts in a single file the character identity breaks.
 */
const SHARED_FRAMING = [
  'd="M 48 504 L 48 474 C 48 432 90 400 140 352 C 176 388 204 402 256 404 C 308 402 336 388 372 352 C 422 400 464 432 464 474 L 464 504 Z"',
  '<ellipse cx="256" cy="248" rx="160" ry="164" fill="#F0D5B4" stroke="#2D3748" stroke-width="6"/>',
  'd="M 104 300 C 94 168 168 80 256 80 C 344 80 418 168 408 300 C 400 252 390 214 376 188 Q 250 158 136 188 C 122 214 112 252 104 300 Z"',
  'd="M 252 300 Q 256 318 266 314"',
];

/** Expression cues that must appear in the named face only. */
const EXCLUSIVE_CUES: Record<keyof typeof FACES, string[]> = {
  happy: ['d="M 198 342 Q 256 408 314 342"'], // wide smile
  sad: ['d="M 206 386 Q 256 336 306 386"', 'fill="#90CDF4"'], // frown + single tear
  angry: [
    'd="M 204 348 Q 256 336 308 348 C 308 380 288 394 256 394 C 224 394 204 380 204 348 Z"', // open shout
    'fill="#FED7D7"', // blush (reinforcement only)
  ],
  scared: ['<circle cx="178" cy="272" r="38"', '<ellipse cx="256" cy="366" rx="22" ry="26"'], // wide eye + open mouth
};

describe("Feelings Faces SVGs", () => {
  it("uses the 512 square canvas and the shared outline colour on every asset", () => {
    for (const svg of ASSETS) {
      expect(svg).toContain('viewBox="0 0 512 512"');
      expect(svg).toContain('stroke="#2D3748"');
    }
  });

  it("stays flat vector art (no gradients, filters, raster images or text)", () => {
    for (const svg of ASSETS) {
      expect(svg).not.toMatch(/Gradient|<filter|<image|\.png|\.jpg/i);
      expect(svg).not.toContain("<text");
    }
  });

  it("keeps one identical kid across all four faces (framing block unchanged)", () => {
    for (const [name, svg] of Object.entries(FACES)) {
      for (const fragment of SHARED_FRAMING) {
        expect(svg, `${name} face is missing shared framing: ${fragment}`).toContain(fragment);
      }
    }
  });

  it("gives each expression its own shape cues and no other face's cue", () => {
    for (const [name, svg] of Object.entries(FACES)) {
      for (const [owner, cues] of Object.entries(EXCLUSIVE_CUES)) {
        for (const cue of cues) {
          if (owner === name) {
            expect(svg, `${name} face is missing its ${cue}`).toContain(cue);
          } else {
            expect(svg, `${name} face must not carry the ${owner} cue ${cue}`).not.toContain(cue);
          }
        }
      }
    }
  });

  it("draws the happy face with arched eyes only (no eye whites to lean on)", () => {
    expect(faceHappySvg).not.toContain('fill="#FFFFFF"');
    for (const name of ["sad", "angry", "scared"] as const) {
      expect(FACES[name], name).toContain('fill="#FFFFFF"');
    }
  });

  it("keeps preschooler proportions: a big round head and no neck", () => {
    for (const [name, svg] of Object.entries(FACES)) {
      const head = svg.match(/<ellipse cx="256" cy="\d+" rx="(\d+)" ry="(\d+)"/);
      if (!head) throw new Error(`${name} face has no head ellipse`);
      const headHeight = Number(head[2]) * 2;
      expect(headHeight / 512, `${name} head height`).toBeGreaterThanOrEqual(0.6);
      expect(headHeight / 512, `${name} head height`).toBeLessThanOrEqual(0.65);
      expect(svg, `${name} face must not draw a neck or a tank-top block`).not.toContain("<rect");
    }
  });

  it("fills the tile with one large face and a single heart motif", () => {
    expect(tileFeelingsFacesSvg).toContain('d="M 196 336 Q 256 404 316 336"');
    expect(tileFeelingsFacesSvg).toContain('fill="#FC8181"');
    expect(tileFeelingsFacesSvg).not.toContain("<rect");
  });

  it("frames the sticker as a cream badge around a soft-red heart", () => {
    expect(stickerFeelingsFacesSvg).toContain('r="236" fill="#FFF8E7"');
    expect(stickerFeelingsFacesSvg).toContain('fill="#FC8181"');
    expect(stickerFeelingsFacesSvg).not.toContain('fill="#F6E05E"');
  });

  it("keeps the six new assets inside the 40 KB payload budget (NFR-7)", () => {
    const encoder = new TextEncoder();
    const bytes = ASSETS.reduce((sum, svg) => sum + encoder.encode(svg).length, 0);
    expect(bytes).toBeLessThanOrEqual(40 * 1024);
  });
});
