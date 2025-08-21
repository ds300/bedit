export const $beditStateContainer = Symbol.for('__bedit_state_container__')
export interface BeditStateContainer<T extends object> {
  [$beditStateContainer]: {
    get(): T
    set(t: T): void
  }
}
export interface AsyncBeditStateContainer<T extends object> {
  [$beditStateContainer]: {
    get(): Promise<T>
    set(t: T): void | Promise<void>
  }
}
