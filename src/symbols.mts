/**
 * Symbol used to identify state containers that implement the Patchable interface.
 * This symbol is used internally by patchfork to detect compatible state containers.
 */
export const $patchable = Symbol.for('__patchfork_state_patchable__')

/**
 * Symbol used to identify state containers that implement the AsyncPatchable interface.
 * This symbol is used internally by patchfork to detect compatible async state containers.
 */
export const $asyncPatchable = Symbol.for('__patchfork_state_async_patchable__')

/**
 * Symbol used to mark objects as editable in patchfork operations.
 * This symbol is used internally by patchfork to track editable objects.
 */
export const $editable = Symbol.for('__patchfork_state_editable__')

/**
 * Interface for state containers that can be used with patchfork's `patch()` function.
 *
 * Implement this interface to make your custom state container compatible with patchfork.
 * The interface requires a symbol property that provides get and set operations.
 *
 * @template T - The type of the state (must extend object)
 */
export interface Patchable<T extends object> {
  [$patchable]: {
    get(): T
    set(t: T): void
  }
}

/**
 * Interface for asynchronous state containers that can be used with patchfork's `patch()` function.
 *
 * Similar to `Patchable`, but allows for asynchronous get and set operations.
 * This is useful for stores that need to perform async operations like persistence or API calls.
 *
 * @template T - The type of the state (must extend object)
 */
export interface AsyncPatchable<T extends object> {
  [$asyncPatchable]: {
    get(): T | Promise<T>
    set(t: T): void | Promise<void>
  }
}
