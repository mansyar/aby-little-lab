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
