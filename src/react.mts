import { useMemo, useState } from 'react'
import { $asyncPatchable, $patchable, AsyncPatchable } from './symbols.mjs'
import { _shallowClone } from './utils.mjs'

export function usePatchableState<T extends object>(init: T | (() => T)) {
  const [state, setState] = useState<T>(init)
  if (!state || typeof state !== 'object') {
    throw new Error(
      'usePatchableState can only be used with objects, arrays, maps, or sets.',
    )
  }

  const store = useMemo(() => {
    return {
      [$asyncPatchable]: {
        get: () =>
          new Promise((resolve) =>
            setState((state) => (resolve(state), state)),
          ),
        set: (newState: T) => {
          setState(newState)
        },
      },
    }
  }, [setState])

  return [state, store] as [T, AsyncPatchable<T>]
}
