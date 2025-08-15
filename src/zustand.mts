import { Editable, edit } from './bedit.mjs'
import { $beditStateContainer, BeditStateContainer } from './symbols.mjs'

interface ZustandStoreish<T> {
  getState: () => T
  setState: (state: T) => void
}

type GetState<S> = S extends { getState: () => infer T } ? T : never

// Helper type to infer mutator function signatures
type MutatorFunctions<T> = {
  [K: string]: (draft: Editable<T>, ...args: any[]) => void | Promise<void>
}

// Type for the enhanced store with mutator functions
type BeditifiedStore<
  S extends ZustandStoreish<any>,
  M extends MutatorFunctions<GetState<S>>,
> = S &
  BeditStateContainer<GetState<S>> & {
    [K in keyof M]: M[K] extends (
      draft: Editable<GetState<S>>,
      ...args: infer Args
    ) => Promise<void>
      ? (...args: Args) => Promise<void>
      : M[K] extends (draft: Editable<GetState<S>>, ...args: infer Args) => void
        ? (...args: Args) => void
        : never
  }

export function beditify<S extends ZustandStoreish<any>>(
  store: S,
): S & BeditStateContainer<GetState<S>> 

export function beditify<
  S extends ZustandStoreish<any>,
  M extends MutatorFunctions<GetState<S>>,
>(store: S, mutators: M): BeditifiedStore<S, M>

export function beditify<
  S extends ZustandStoreish<any>,
  M extends MutatorFunctions<GetState<S>>,
>(
  store: S,
  mutators?: M,
) {
  // Start with the enhanced store and add the bedit state container symbol
  const enhancedStore = store as any
  enhancedStore[$beditStateContainer] = {
    get: () => store.getState(),
    set: (newState: GetState<S>) => store.setState(newState),
  }

  // If no mutators provided, return the basic enhanced store
  if (!mutators) {
    return enhancedStore as S & BeditStateContainer<GetState<S>>
  }

  // Add mutator functions to the store
  const mutatorMethods: Record<string, (...args: any[]) => any> = {}

  for (const [key, mutatorFn] of Object.entries(mutators)) {
    mutatorMethods[key] = (...args: any[]) => {
      const currentState = store.getState()
      const result = edit(currentState, (draft) => {
        return mutatorFn(draft, ...args)
      })

      // Check if result is a promise (async mutator)
      if (result && typeof result.then === 'function') {
        return result.then((newState: GetState<S>) => {
          store.setState(newState)
          return newState
        })
        // Note: If the async mutator throws, the promise will be rejected
        // and store.setState() will not be called, preserving the original state
      } else {
        // Sync mutator
        store.setState(result as GetState<S>)
        return result
      }
    }
  }

  return Object.assign(enhancedStore, mutatorMethods) as BeditifiedStore<S, M>
}
