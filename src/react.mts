import { useState } from 'react'
import { AsyncPatchable } from './symbols.mjs'
import { usePatchableStore } from './usePatchableStore.mjs'

/**
 * A React hook that provides patchfork integration with React's useState.
 *
 * Returns a tuple containing the current state value and an AsyncPatchable store
 * that can be used with patchfork's `patch()` function for immutable updates.
 *
 * @template T - The type of the state (must extend object)
 *
 * @param init - Initial state value or a function that returns the initial state
 * @returns A tuple of [currentState, patchableStore]
 *
 * @example
 * ```tsx
 * import { usePatchableState } from 'patchfork/react'
 * import { patch } from 'patchfork'
 *
 * function Counter() {
 *   const [state, store] = usePatchableState({ count: 0, name: 'Counter' })
 *
 *   const increment = () => {
 *     patch(store).count(count => count + 1)
 *   }
 *
 *   const updateName = (newName: string) => {
 *     patch(store).name(newName)
 *   }
 *
 *   return (
 *     <div>
 *       <p>Count: {state.count}</p>
 *       <p>Name: {state.name}</p>
 *       <button onClick={increment}>+</button>
 *       <button onClick={() => updateName('Updated')}>Change Name</button>
 *     </div>
 *   )
 * }
 * ```
 *
 * @throws {Error} If the initial state is not an object, array, map, or set
 */
export function usePatchableState<T extends object>(init: T | (() => T)) {
  const [state, setState] = useState<T>(init)
  if (!state || typeof state !== 'object') {
    throw new Error(
      'usePatchableState can only be used with objects, arrays, maps, or sets.',
    )
  }
  return [state, usePatchableStore(setState)] as [T, AsyncPatchable<T>]
}
