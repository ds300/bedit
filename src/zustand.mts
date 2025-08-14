import { Editable, edit } from './bedit.mjs'
import { $beditStateContainer, BeditStateContainer } from './symbols.mjs'

interface ZustandStoreish<T> {
  getState: () => T
  setState: (state: T) => void
}

type GetState<S> = S extends { getState: () => infer T } ? T : never

// Helper type to infer mutator function signatures
type MutatorFunctions<T> = {
  [K: string]: (draft: Editable<T>, ...args: any[]) => void
}

// Type for the enhanced store with mutator functions
type BeditifiedStore<S extends ZustandStoreish<any>, M extends MutatorFunctions<GetState<S>>> = 
  S & BeditStateContainer<GetState<S>> & {
    [K in keyof M]: M[K] extends (draft: Editable<GetState<S>>, ...args: infer Args) => void
      ? (...args: Args) => void
      : never
  }

export function beditify<S extends ZustandStoreish<any>>(
  store: S,
): S & BeditStateContainer<GetState<S>>

export function beditify<
  S extends ZustandStoreish<any>,
  M extends MutatorFunctions<GetState<S>>
>(
  store: S,
  mutators: M,
): BeditifiedStore<S, M>

export function beditify<
  S extends ZustandStoreish<any>,
  M extends MutatorFunctions<GetState<S>>
>(
  store: S,
  mutators?: M,
): S & BeditStateContainer<GetState<S>> | BeditifiedStore<S, M> {
  // Create the bedit state container implementation
  const beditContainer: BeditStateContainer<GetState<S>> = {
    [$beditStateContainer]: {
      get: () => store.getState(),
      set: (newState: GetState<S>) => store.setState(newState),
    },
  }

  // Start with the enhanced store
  const enhancedStore = Object.assign(store, beditContainer)

  // If no mutators provided, return the basic enhanced store
  if (!mutators) {
    return enhancedStore as S & BeditStateContainer<GetState<S>>
  }

  // Add mutator functions to the store
  const mutatorMethods: Record<string, (...args: any[]) => void> = {}
  
  for (const [key, mutatorFn] of Object.entries(mutators)) {
    mutatorMethods[key] = (...args: any[]) => {
      const currentState = store.getState()
      const newState = edit(currentState, (draft) => {
        mutatorFn(draft, ...args)
      })
      store.setState(newState)
    }
  }

  return Object.assign(enhancedStore, mutatorMethods) as BeditifiedStore<S, M>
}
