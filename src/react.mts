import { useMemo, useState } from 'react'
import { $beditStateContainer, BeditStateContainer } from './symbols.mjs'
import { edit } from './bedit.mjs'
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

export function useBeditState<T>(init: T | (() => T)) {
  const [state, setState] = useState<T>(init)
  if (!state || typeof state !== 'object') {
    throw new Error(
      'useBeditState can only be used with objects, arrays, maps, or sets.',
    )
  }

  const store = useMemo(() => {
    return {
      [$beditStateContainer]: {
        get: () => {
          let state
          setState((newState) => {
            state = newState
            return newState
          })
          return state!
        },
        set: (newState: T) => {
          setState(newState)
        },
      },
    } satisfies BeditStateContainer<T>
  }, [setState])

  return giveStore(state, store) as T & BeditStateContainer<T>
}

const state = useBeditState({
  user: { name: 'Nick Cave', preferences: { theme: 'dark' } },
  featureFlags: new Set(['new-sidebar', 'new-sidebar-2']),
})

const nextState = edit(state).user.preferences.theme('light')
const nextState2 = edit(state).featureFlags.add('new-sidebar-3')
const nextState3 = edit(state).featureFlags.delete('new-sidebar-2')
