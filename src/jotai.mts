import { useAtom, WritableAtom } from 'jotai'
import { AsyncPatchable } from './symbols.mjs'
import { usePatchableStore } from './usePatchableStore.mjs'

type Options = Parameters<typeof useAtom>[1]

/**
 * A React hook that provides patchfork integration with Jotai atoms.
 * 
 * Returns a tuple containing the current atom value and an AsyncPatchable store
 * that can be used with patchfork's `patch()` function for immutable updates.
 * 
 * @template Value - The type of the atom's value (must extend object)
 * @template Args - The arguments for the atom's write function
 * @template Result - The return type of the atom's write function
 * 
 * @param atom - A Jotai WritableAtom to make patchable
 * @param options - Optional Jotai useAtom options
 * @returns A tuple of [currentValue, patchableStore]
 * 
 * @example
 * ```tsx
 * import { atom } from 'jotai'
 * import { usePatchableAtom } from 'patchfork/jotai'
 * import { patch } from 'patchfork'
 * 
 * const userAtom = atom({ name: 'John', age: 30 })
 * 
 * function UserEditor() {
 *   const [user, store] = usePatchableAtom(userAtom)
 * 
 *   const updateName = (newName: string) => {
 *     patch(store).name(newName)
 *   }
 * 
 *   const incrementAge = () => {
 *     patch(store).age(age => age + 1)
 *   }
 * 
 *   return (
 *     <div>
 *       <p>{user.name}, {user.age}</p>
 *       <button onClick={() => updateName('Jane')}>
 *         Change Name
 *       </button>
 *       <button onClick={incrementAge}>
 *         Age++
 *       </button>
 *     </div>
 *   )
 * }
 * ```
 */
export function usePatchableAtom<
  Value extends object,
  Args extends never[],
  Result,
>(
  atom: WritableAtom<Value, Args, Result>,
  options?: Options,
): [Value, AsyncPatchable<Value>]
export function usePatchableAtom(atom: any, options: any) {
  const [value, setValue] = useAtom(atom, options)

  return [value, usePatchableStore(setValue)]
}
