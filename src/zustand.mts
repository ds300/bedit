import { Editable, edit } from './bedit.mjs'
import { $beditStateContainer, BeditStateContainer } from './symbols.mjs'
import { _shallowClone } from './utils.mjs'

interface ZustandStoreish<T> {
  getState: () => T
  setState: (state: T) => void
}

type GetState<S> = S extends { getState: () => infer T } ? T : never

// Type for the enhanced store with mutator functions
type BeditifiedStore<S extends ZustandStoreish<any>> = S &
  BeditStateContainer<GetState<S>>

export function beditify<S extends ZustandStoreish<any>>(
  store: S,
): BeditifiedStore<S> {
  // Start with the enhanced store and add the bedit state container symbol
  const enhancedStore = store as any
  enhancedStore[$beditStateContainer] = {
    get: () => store.getState(),
    set: (newState: GetState<S>) => store.setState(newState),
  }

  return enhancedStore as BeditifiedStore<S>
}
