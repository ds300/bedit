export const $beditStateContainer = Symbol.for('__bedit_state_container__')
export interface BeditStateContainer<T> {
  [$beditStateContainer]: {
    get(): T
    set(t: T): void
  }
}
export interface AsyncBeditStateContainer<T> {
  [$beditStateContainer]: {
    get(): Promise<T>
    set(t: T): void | Promise<void>
  }
}
