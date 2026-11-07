/**
 * Makes `localStorage` refuse access the way a real device does.
 *
 * A full quota rejects writes with `QuotaExceededError`; blocked or
 * partitioned site data rejects every access with `SecurityError`. Both reach
 * the save layer, and neither was survivable before it was guarded.
 *
 * happy-dom binds each `Storage` method to the instance as an own property on
 * first access, so a `Storage.prototype` spy never reaches
 * `localStorage.setItem`. The object is also a Proxy whose `set` trap discards
 * instance assignment, and whose `getOwnPropertyDescriptor` hides own methods.
 * Re-defining the own property is the one route the proxy honours: its
 * `defineProperty` trap forwards the descriptor to the target.
 */

export type StorageMethod = "getItem" | "setItem";
export type StorageFailureName = "QuotaExceededError" | "SecurityError";

const restores: Array<() => void> = [];

/** Replaces the chosen methods of `localStorage` with a thrower. */
export function breakStorage(methods: StorageMethod[], failure: StorageFailureName): void {
  const error = new DOMException(`simulated ${failure}`, failure);
  for (const method of methods) {
    const original = ownDescriptor(method);
    Object.defineProperty(localStorage, method, {
      ...original,
      value: () => {
        throw error;
      },
    });
    restores.push(() => {
      Object.defineProperty(localStorage, method, original);
    });
  }
}

/** Restores every method broken by `breakStorage`. */
export function repairStorage(): void {
  for (const restore of restores.splice(0)) restore();
}

/**
 * The method's current descriptor. The proxy hides own descriptors, so the
 * descriptor is reconstructed from the bound value the getter already returns
 * (the first access is what binds it).
 */
function ownDescriptor(method: StorageMethod): PropertyDescriptor {
  return {
    configurable: true,
    enumerable: false,
    writable: true,
    value: localStorage[method],
  };
}
