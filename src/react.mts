import { useMemo, useState } from 'react'
import { $beditStateContainer, AsyncBeditStateContainer } from './symbols.mjs'
import { _shallowClone } from './utils.mjs'

function giveStore(state: any, store: any) {
  if ($beditStateContainer in state) return state
  const wasFrozen = Object.isFrozen(state)
  if (wasFrozen) {
    state = _shallowClone(state)
  }
  Object.defineProperty(state, $beditStateContainer, {
    value: store,
    writable: false,
    configurable: false,
    enumerable: false,
  })
  if (wasFrozen) {
    Object.freeze(state)
  }
  return state
}

export function useBeditState<T extends object>(init: T | (() => T)) {
  const [state, setState] = useState<T>(init)
  if (!state || typeof state !== 'object') {
    throw new Error(
      'useBeditState can only be used with objects, arrays, maps, or sets.',
    )
  }

  const store = useMemo(() => {
    return {
      get: () =>
        new Promise((resolve) => setState((state) => (resolve(state), state))),
      set: (newState: T) => {
        setState(newState)
      },
    }
  }, [setState])

  return giveStore(state, store) as T & AsyncBeditStateContainer<T>
}
