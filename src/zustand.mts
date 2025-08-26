import { $patchable, Patchable } from './symbols.mjs'
import { _shallowClone } from './utils.mjs'

interface ZustandStoreish<T> {
  getState: () => T
  setState: (state: T) => void
}

type GetState<S> = S extends { getState: () => infer T } ? T : never

// Type for the enhanced store with mutator functions
type PatchforkifiedStore<S extends ZustandStoreish<any>> = S &
  Patchable<GetState<S>>

/**
 * Enhances a Zustand store with patchfork compatibility.
 *
 * Takes a Zustand store and returns an enhanced version that implements the
 * `Patchable` interface, allowing it to work with patchfork's `patch()` function.
 *
 * @template S - The type of the Zustand store
 *
 * @param store - A Zustand store with getState and setState methods
 * @returns The enhanced store with patchfork compatibility
 *
 * @example
 * ```ts
 * import { create } from 'zustand'
 * import { patchable } from 'patchfork/zustand'
 * import { patch } from 'patchfork'
 *
 * const useStore = create(() => ({
 *   count: 0,
 *   user: { name: 'John', age: 30 }
 * }))
 *
 * const store = patchable(useStore)
 *
 * // Now you can use patchfork functions directly on the store
 * patch(store).count(42)
 * patch(store).user.name('Jane')
 * patch(store).user.age(age => age + 1)
 * ```
 */
export function patchable<S extends ZustandStoreish<any>>(
  store: S,
): PatchforkifiedStore<S> {
  // Start with the enhanced store and add the patchfork state container symbol
  const enhancedStore = store as any
  enhancedStore[$patchable] = {
    get: () => store.getState(),
    set: (newState: GetState<S>) => store.setState(newState),
  }

  return enhancedStore as PatchforkifiedStore<S>
}
