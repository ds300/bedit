import { useMemo } from 'react'
import { $asyncPatchable } from './symbols.mjs'

export function usePatchableStore(
  setState: (updater: (value: any) => any) => void,
) {
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
