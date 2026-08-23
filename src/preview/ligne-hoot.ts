// Task 2.0 live motion-proof harness (dev-only): loads the compiled hoot.ligne
// through the real @ligne-engine/web player so the seven authored states can be
// verified in a browser before any game integration. Dev serves the binary
// from public/ because the bundler's .ligne import path is build-only.
import { LignePlayer } from "@ligne-engine/web";

const HOOT_URL = "/hoot.ligne";

const TRIGGERS = ["wave", "nod", "cheer", "cheer_big", "curious", "flap_greeting"];

async function boot(): Promise<void> {
  const status = document.querySelector("#status");
  if (!(status instanceof HTMLParagraphElement)) {
    throw new Error("missing #status element");
  }
  const controls = document.querySelector("#controls");
  if (!(controls instanceof HTMLDivElement)) {
    throw new Error("missing #controls element");
  }
  const canvas = document.querySelector("#hoot");
  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error("missing #hoot canvas element");
  }
  try {
    const response = await fetch(HOOT_URL);
    if (!response.ok) {
      throw new Error(`asset fetch failed: HTTP ${response.status}`);
    }
    const bytes = new Uint8Array(await response.arrayBuffer());
    const player = await LignePlayer.load(bytes, canvas);

    let last = performance.now();
    const tick = (now: number): void => {
      player.advance((now - last) / 1000);
      last = now;
      player.render();
      requestAnimationFrame(tick);
    };
    requestAnimationFrame((now) => {
      last = now;
      tick(now);
    });

    for (const id of TRIGGERS) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = id;
      button.addEventListener("click", () => {
        player.fireTrigger(id);
      });
      controls.append(button);
    }
    status.textContent = `ready — ${player.inputs.length} inputs · adapter: ${player.adapterName}`;
  } catch (error) {
    status.textContent = `failed: ${String(error)}`;
  }
}

void boot();
