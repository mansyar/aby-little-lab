/**
 * The one piece of Node's global surface the harness reads.
 *
 * This is a browser-only app with no `@types/node`, and this phase may not add
 * a dependency, but `playwright.config.ts` needs `process.env.CI` to choose the
 * retry count, the reporter and server reuse. Declaring exactly what is used
 * keeps the ambient surface honest; delete this file if `@types/node` ever
 * arrives.
 */
declare const process: {
  env: Record<string, string | undefined>;
};

/**
 * `Buffer`, for one purpose: `fileChooser.setFiles` takes in-memory file bytes
 * and Playwright base64-encodes them for the page. A `Uint8Array` does not
 * survive that step - it stringifies to "104,101,..." and `atob` refuses it -
 * so an in-memory fixture has to be a real Buffer. Same rule as above: declare
 * what is used, and delete it if `@types/node` ever arrives.
 */
declare class Buffer extends Uint8Array {
  static from(input: string, encoding?: "utf8" | "base64" | "hex"): Buffer;
}
