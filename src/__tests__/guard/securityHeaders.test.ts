/**
 * Security header guard.
 *
 * The policy lives in `nginx.security-headers.conf`, a snippet `nginx.conf`
 * includes in the `server` block and in every location that declares its own
 * `add_header`. That arrangement is load-bearing and invisible: nginx inherits
 * `add_header` from an enclosing block only into a location that declares none,
 * so deleting one `include` line silently strips all four headers from a route
 * while the config still reads correctly and `nginx -t` still passes.
 *
 * This test reads the config as text, so it catches that deletion. It also pins
 * the policy's content — the thirteen CSP directives, `always` on every header,
 * the eleven-feature deny list, and the absence of the two escape hatches a
 * policy is usually widened with. It cannot prove the *runtime* behaviour; that
 * is `scripts/validate-headers.js`, which probes a real container.
 *
 * Sources arrive through static `?raw` imports (the precedent is
 * `toolchain.test.ts`): the project ships no Node type declarations, so
 * `node:fs` would not typecheck, and `import.meta.glob` does not collect
 * dot-prefixed paths. The accepted limit is the same as there — a new config
 * file is invisible here until it is imported by hand.
 */

import { describe, expect, it } from "vitest";

import dockerfileRaw from "../../../Dockerfile?raw";
import nginxConfRaw from "../../../nginx.conf?raw";
import snippetRaw from "../../../nginx.security-headers.conf?raw";

const INCLUDE_DIRECTIVE = "include /etc/nginx/snippets/security-headers.conf;";
const SNIPPET_PATH = "/etc/nginx/snippets/security-headers.conf";

/** FR-1, in order. A reworded or dropped directive must be named, not averaged. */
const CSP_DIRECTIVES: { name: string; sources: string[] }[] = [
  { name: "default-src", sources: ["'self'"] },
  { name: "script-src", sources: ["'self'"] },
  { name: "style-src", sources: ["'self'"] },
  { name: "img-src", sources: ["'self'", "data:"] },
  { name: "font-src", sources: ["'self'"] },
  { name: "media-src", sources: ["'self'"] },
  { name: "connect-src", sources: ["'self'"] },
  { name: "worker-src", sources: ["'self'"] },
  { name: "manifest-src", sources: ["'self'"] },
  { name: "object-src", sources: ["'none'"] },
  { name: "base-uri", sources: ["'none'"] },
  { name: "form-action", sources: ["'none'"] },
  { name: "frame-ancestors", sources: ["'none'"] },
];

/** FR-4. `fullscreen` is deliberately absent: the installed PWA needs it. */
const DENIED_FEATURES = [
  "camera",
  "microphone",
  "geolocation",
  "payment",
  "usb",
  "serial",
  "midi",
  "display-capture",
  "accelerometer",
  "gyroscope",
  "magnetometer",
];

const SECURITY_HEADERS = [
  "Content-Security-Policy",
  "X-Content-Type-Options",
  "Referrer-Policy",
  "Permissions-Policy",
];

/** Net brace depth at the end of each line, so a block's extent is readable. */
function depthsAfter(lines: readonly string[]): number[] {
  const depths: number[] = [];
  let depth = 0;
  for (const line of lines) {
    const opens = (line.match(/\{/g) ?? []).length;
    const closes = (line.match(/\}/g) ?? []).length;
    depth += opens - closes;
    depths.push(depth);
  }
  return depths;
}

interface NginxBlock {
  header: string;
  body: string[];
}

function locationBlocks(source: string): NginxBlock[] {
  const lines = source.split(/\r?\n/);
  const depths = depthsAfter(lines);
  const blocks: NginxBlock[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!/^\s*location\b/.test(line) || !line.includes("{")) {
      continue;
    }

    const openingDepth = depths[index];
    const closing = depths.findIndex((depth, at) => at > index && depth < openingDepth);
    const last = closing === -1 ? lines.length - 1 : closing;
    blocks.push({ header: line.trim(), body: lines.slice(index + 1, last) });
  }

  return blocks;
}

/** Includes written directly in the `server` block sit at depth 1; a location's at depth 2. */
function serverLevelIncludes(source: string): number {
  const lines = source.split(/\r?\n/);
  const depths = depthsAfter(lines);
  return lines.filter((line, index) => line.trim() === INCLUDE_DIRECTIVE && depths[index] === 1)
    .length;
}

function directiveLine(source: string, header: string): string | undefined {
  const pattern = new RegExp(`^\\s*add_header\\s+${header}\\s+"[^"]*"\\s+always;\\s*$`, "i");
  return source.split(/\r?\n/).find((line) => pattern.test(line));
}

function headerValue(source: string, header: string): string {
  const pattern = new RegExp(`^\\s*add_header\\s+${header}\\s+"([^"]*)"`, "i");
  for (const line of source.split(/\r?\n/)) {
    const match = pattern.exec(line);
    if (match !== null) {
      return match[1];
    }
  }
  return "";
}

interface CspDirective {
  name: string;
  sources: string[];
}

function parseCsp(value: string): CspDirective[] {
  return value
    .split(";")
    .map((directive) => directive.trim())
    .filter((directive) => directive.length > 0)
    .map((directive) => {
      const [name = "", ...sources] = directive.split(/\s+/);
      return { name, sources };
    });
}

describe("security headers guard", () => {
  it("includes the snippet in every location of nginx.conf that declares add_header", () => {
    const declaring = locationBlocks(nginxConfRaw).filter((block) =>
      block.body.some((line) => /^\s*add_header\b/.test(line)),
    );

    // Five: /sw.js, /manifest.webmanifest, /index.html, the hashed-asset regex
    // and .mp3. Without this the scan below would pass on an empty list.
    expect(
      declaring.length,
      "nginx.conf is expected to declare add_header in five locations; if that count moved, update this test deliberately",
    ).toBe(5);

    for (const block of declaring) {
      expect(
        block.body.some((line) => line.trim() === INCLUDE_DIRECTIVE),
        `${block.header} declares add_header, so nginx will not inherit the server-level include — it must include ${SNIPPET_PATH} itself`,
      ).toBe(true);
    }
  });

  it("includes the snippet in the server block, so uncategorised and 404 responses get the policy", () => {
    expect(
      serverLevelIncludes(nginxConfRaw),
      `the server block must contain exactly one "${INCLUDE_DIRECTIVE}" at its own level`,
    ).toBe(1);
  });

  it("declares all four headers in the snippet, each with always", () => {
    for (const header of SECURITY_HEADERS) {
      expect(
        directiveLine(snippetRaw, header),
        `${header} is missing from nginx.security-headers.conf, or is declared without "always" so 4xx/5xx would drop it`,
      ).toBeDefined();
    }
  });

  it("carries the thirteen CSP directives in order, and no escape hatch", () => {
    const csp = headerValue(snippetRaw, "Content-Security-Policy");
    expect(csp.length, "the snippet declares no Content-Security-Policy value").toBeGreaterThan(0);

    const parsed = parseCsp(csp);
    expect(
      parsed.map((directive) => directive.name),
      "CSP directives differ from FR-1: the directive list and its order are the policy",
    ).toEqual(CSP_DIRECTIVES.map((directive) => directive.name));

    for (const expected of CSP_DIRECTIVES) {
      const actual = parsed.find((directive) => directive.name === expected.name);
      for (const source of expected.sources) {
        expect(actual?.sources, `${expected.name} must include ${source}`).toContain(source);
      }
    }

    expect(
      csp,
      "CSP must not allow unsafe-inline: the built HTML has nothing inline",
    ).not.toContain("unsafe-inline");
    expect(
      csp,
      "CSP must not allow unsafe-eval: neither bundle contains eval or new Function",
    ).not.toContain("unsafe-eval");
    expect(csp, "CSP must not contain a wildcard source").not.toContain("*");
    expect(csp, "CSP must not allow http: scheme sources").not.toContain("http:");
    expect(csp, "CSP must not allow https: scheme sources").not.toContain("https:");
  });

  it("denies all eleven features in Permissions-Policy and leaves fullscreen alone", () => {
    const policy = headerValue(snippetRaw, "Permissions-Policy");
    expect(policy.length, "the snippet declares no Permissions-Policy value").toBeGreaterThan(0);

    const denied = policy
      .split(",")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);

    expect(denied, "Permissions-Policy must deny exactly the eleven features FR-4 names").toEqual(
      DENIED_FEATURES.map((feature) => `${feature}=()`),
    );
    expect(
      policy,
      "fullscreen must stay unmentioned: the installed PWA requests display_override fullscreen",
    ).not.toContain("fullscreen");
  });

  it("copies the snippet to the path nginx includes", () => {
    const copy = new RegExp(
      `^\\s*COPY\\s+nginx\\.security-headers\\.conf\\s+${SNIPPET_PATH.replace(/\./g, "\\.")}\\s*$`,
      "m",
    );
    expect(
      copy.test(dockerfileRaw),
      `the Dockerfile must COPY nginx.security-headers.conf to ${SNIPPET_PATH}; nginx exits on a missing include, so shipping it is what makes an omission fail instead of serving unprotected`,
    ).toBe(true);
  });

  it("read every source, so no assertion above passed vacuously", () => {
    expect(nginxConfRaw.length, "nginx.conf arrived empty").toBeGreaterThan(100);
    expect(snippetRaw.length, "nginx.security-headers.conf arrived empty").toBeGreaterThan(100);
    expect(dockerfileRaw.length, "Dockerfile arrived empty").toBeGreaterThan(100);
  });
});
