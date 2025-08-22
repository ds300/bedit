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
