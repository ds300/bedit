export const $patchable = Symbol.for('__patchfork_state_patchable__')
export const $asyncPatchable = Symbol.for('__patchfork_state_async_patchable__')
export const $editable = Symbol.for('__patchfork_state_editable__')
export interface Patchable<T extends object> {
  [$patchable]: {
    get(): T
    set(t: T): void
  }
}
export interface AsyncPatchable<T extends object> {
  [$asyncPatchable]: {
    get(): T | Promise<T>
    set(t: T): void | Promise<void>
  }
}
