import { useMemo } from 'react'
import { $asyncPatchable, AsyncPatchable } from './symbols.mjs'

export function usePatchableStore<T extends object>(
  setState: (updater: (value: any) => any) => void,
): AsyncPatchable<T> {
  return useMemo(() => {
    return {
      [$asyncPatchable]: {
        get: () =>
          new Promise((resolve) =>
            setState((state) => (resolve(state), state)),
          ),
        set: (newState: any) => {
          setState(newState)
        },
      },
    }
  }, [setState])
}
