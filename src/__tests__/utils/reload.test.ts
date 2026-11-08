import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { hasReloaded, reloadOnce } from "../../utils/reload";

const KEY = "aby-little-lab:reload-once";

/** A `sessionStorage` that behaves like the real one, in a `Map`. */
function memoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key: string) => store.get(key) ?? null,
    key: (index: number) => [...store.keys()][index] ?? null,
    removeItem: (key: string) => store.delete(key),
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
  } as Storage;
}

let reload: ReturnType<typeof vi.fn>;

function stubWindow(): void {
  reload = vi.fn();
  vi.stubGlobal("window", {
    sessionStorage: memoryStorage(),
    location: { reload },
  });
}

describe("reloadOnce", () => {
  beforeEach(() => {
    stubWindow();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reloads once and remembers it for the session", () => {
    expect(hasReloaded()).toBe(false);

    reloadOnce();

    expect(reload).toHaveBeenCalledTimes(1);
    expect(hasReloaded()).toBe(true);
    expect(window.sessionStorage.getItem(KEY)).toBe("1");
  });

  it("does not reload a second time once the session has spent it", () => {
    reloadOnce();

    reloadOnce();
    reloadOnce();

    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("does not reload at all when a previous page load already spent it", () => {
    window.sessionStorage.setItem(KEY, "1");

    reloadOnce();

    expect(reload).not.toHaveBeenCalled();
  });

  it("still reloads when storage is blocked, and cannot claim it was spent", () => {
    const blocked = {
      getItem: () => {
        throw new DOMException("blocked", "SecurityError");
      },
      setItem: () => {
        throw new DOMException("blocked", "SecurityError");
      },
    };
    vi.stubGlobal("window", { sessionStorage: blocked, location: { reload } });

    expect(hasReloaded()).toBe(false);

    reloadOnce();

    // Cannot remember is not the same as already spent: a genuinely broken
    // first load still gets its one retry.
    expect(reload).toHaveBeenCalledTimes(1);
  });
});
