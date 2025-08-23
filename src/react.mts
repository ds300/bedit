import { useState } from 'react'
import { AsyncPatchable } from './symbols.mjs'
import { usePatchableStore } from './usePatchableStore.mjs'

export function usePatchableState<T extends object>(init: T | (() => T)) {
  const [state, setState] = useState<T>(init)
  if (!state || typeof state !== 'object') {
    throw new Error(
      'usePatchableState can only be used with objects, arrays, maps, or sets.',
    )
  }
  return [state, usePatchableStore(setState)] as [T, AsyncPatchable<T>]
}
