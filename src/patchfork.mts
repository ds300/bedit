import {
  _shallowClone,
  // @ifndef PRODUCTION
  isPlainObject,
  // @endif
} from './utils.mjs'
import {
  $asyncPatchable,
  $patchable,
  $editable,
  AsyncPatchable,
  Patchable,
} from './symbols.mjs'

/**
 * Symbol used for accessing Map values in patchfork operations.
 *
 * Use this symbol to access and update values in Map objects:
 * ```ts
 * import { key, fork } from 'patchfork'
 *
 * const state = { users: new Map([['user1', { name: 'John' }]]) }
 * const newState = fork(state).users[key]('user1').name('Jane')
 * ```
 */
export const key = Symbol.for('__patchfork_key__')

export type DeepReadonly<T> = T extends PrimitiveOrImmutableBuiltin
  ? T
  : T extends ReadonlyArray<infer U>
    ? ReadonlyArray<DeepReadonly<U>>
    : T extends ReadonlyMap<infer K, infer V>
      ? ReadonlyMap<K, DeepReadonly<V>>
      : T extends ReadonlySet<infer U>
        ? ReadonlySet<U>
        : T extends object
          ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
          : T

type ArrayMethods =
  | 'push'
  | 'pop'
  | 'shift'
  | 'unshift'
  | 'splice'
  | 'sort'
  | 'reverse'
  | 'concat'
  | 'slice'
  | 'map'
  | 'filter'

type UpdatingArrayMethods<Elem, Root> = {
  [k in ArrayMethods]: Array<Elem>[k] extends (...args: infer Args) => infer R
    ? k extends 'map'
      ? (mapper: (item: Elem, index: number, array: Elem[]) => Elem) => Root
      : (...args: Args) => Root
    : never
}

const immutableArrayMethods: ReadonlySet<ArrayMethods> = new Set<ArrayMethods>([
  'concat',
  'slice',
  'map',
  'filter',
])

type MapMethods = 'set' | 'get' | 'delete' | 'clear'

type UpdatingMapMethods<Key, Value, Root> = {
  [k in MapMethods]: Map<Key, Value>[k] extends (...args: infer Args) => infer R
    ? (...args: Args) => Root
    : never
}

type SetMethods = 'add' | 'delete' | 'clear'

type UpdatingSetMethods<Elem, Root> = {
  [k in SetMethods]: Set<Elem>[k] extends (...args: infer Args) => infer R
    ? (...args: Args) => Root
    : never
}

/**
 * Editable<T> makes the top-level properties of T mutable,
 * but all child properties (or elements, for arrays/maps/sets) are readonly.
 */
export type Editable<T> = {
  [$editable]: true
} &
  // Arrays: mutable array, but elements are readonly
  (T extends ReadonlyArray<infer U>
    ? Array<DeepReadonly<U>>
    : // Map: mutable map, but values are readonly
      T extends ReadonlyMap<infer K, infer V>
      ? Map<K, DeepReadonly<V>>
      : // Set: mutable set, but elements are readonly
        T extends ReadonlySet<infer U>
        ? Set<U>
        : // Object: mutable top-level, but child properties are readonly
          T extends object
          ? { -readonly [K in keyof T]: DeepReadonly<T[K]> }
          : // Primitives: just T
            T)

export type Updater<Input, Output = Input> = (val: Input) => Output
export type BatchFn<T> = (val: Editable<NonNullable<T>>) => void | Promise<void>

type PrimitiveOrImmutableBuiltin =
  | string
  | number
  | boolean
  | null
  | undefined
  | Date
  | RegExp
  | Error
  | Symbol

export type Updatable<
  T,
  Root = T,
  Result = Root,
  SetResult = Result,
  IsOptional = never,
> = {
  (value: T | DeepReadonly<T> | IsOptional): SetResult
  (update: Updater<DeepReadonly<T>, T | DeepReadonly<T> | IsOptional>): Result
} & (NonNullable<T> extends ReadonlyMap<infer K, infer V>
  ? {
      [key]: (k: K) => Updatable<V, undefined | Root, undefined | Root, Root>
    } & UpdatingMapMethods<K, V, Root>
  : NonNullable<T> extends ReadonlyArray<infer U>
    ? { [index: number]: Updatable<U, Root> } & UpdatingArrayMethods<
        DeepReadonly<U>,
        Root
      >
    : NonNullable<T> extends ReadonlySet<infer U>
      ? UpdatingSetMethods<U, Root>
      : // The seemingly pointless Exclude here actually prevents distribution
        // over T's members if it's a union
        Exclude<T, never> extends PrimitiveOrImmutableBuiltin
        ? {}
        : {
            [k in keyof NonNullable<T>]-?: Updatable<
              Exclude<NonNullable<T>[k], undefined>,
              Extract<NonNullable<T>[k], null | undefined> | Root,
              undefined extends NonNullable<T>[k] ? Root | undefined : Root,
              Root,
              undefined extends NonNullable<T>[k] ? undefined : never
            >
          })

export type AsyncUpdatable<
  T,
  Root = T,
  Result = Root,
  SetResult = Result,
  IsOptional = never,
> = {
  (value: T | DeepReadonly<T> | IsOptional): Promise<SetResult>
  (
    update: Updater<DeepReadonly<T>, T | DeepReadonly<T> | IsOptional>,
  ): Promise<Result>
} & (NonNullable<T> extends ReadonlyMap<infer K, infer V>
  ? {
      [key]: (
        k: K,
      ) => AsyncUpdatable<V, undefined | Root, undefined | Root, Root>
    } & UpdatingMapMethods<K, V, Promise<Root>>
  : NonNullable<T> extends ReadonlyArray<infer U>
    ? { [index: number]: AsyncUpdatable<U, Root> } & UpdatingArrayMethods<
        DeepReadonly<U>,
        Promise<Root>
      >
    : NonNullable<T> extends ReadonlySet<infer U>
      ? UpdatingSetMethods<U, Promise<Root>>
      : // The seemingly pointless Exclude here actually prevents distribution
        // over T's members if it's a union
        Exclude<T, never> extends PrimitiveOrImmutableBuiltin
        ? {}
        : {
            [k in keyof NonNullable<T>]-?: AsyncUpdatable<
              Exclude<NonNullable<T>[k], undefined>,
              Extract<NonNullable<T>[k], null | undefined> | Root,
              undefined extends NonNullable<T>[k] ? Root | undefined : Root,
              Root,
              undefined extends NonNullable<T>[k] ? undefined : never
            >
          })

export type Batchable<T, Root = T, Result = Root> = (<F extends BatchFn<T>>(
  mutate: F,
) => ReturnType<F> extends Promise<any>
  ? Promise<Exclude<Result, undefined>> | Extract<Result, undefined>
  : Result) &
  (NonNullable<T> extends ReadonlyMap<infer K, infer V>
    ? { [key]: (k: K) => Batchable<V, Root | undefined> }
    : NonNullable<T> extends ReadonlyArray<infer U>
      ? { [key: number]: Batchable<U, Root> }
      : NonNullable<T> extends ReadonlySet<any>
        ? <F extends BatchFn<T>>(
            mutate: F,
          ) => ReturnType<F> extends Promise<any> ? Promise<Root> : Root
        : Exclude<T, never> extends PrimitiveOrImmutableBuiltin
          ? never
          : {
              [k in keyof NonNullable<T>]-?: Batchable<
                Exclude<NonNullable<T>[k], undefined>,
                Extract<NonNullable<T>[k], null | undefined> | Root,
                undefined extends NonNullable<T>[k] ? Root | undefined : Root
              >
            })

export type AsyncBatchable<T, Root = T, Result = Root> = (<
  F extends BatchFn<T>,
>(
  mutate: F,
) => Promise<Result>) &
  (NonNullable<T> extends ReadonlyMap<infer K, infer V>
    ? { [key]: (k: K) => AsyncBatchable<V, Root | undefined> }
    : NonNullable<T> extends ReadonlyArray<infer U>
      ? { [key: number]: AsyncBatchable<U, Root> }
      : NonNullable<T> extends ReadonlySet<any>
        ? <F extends BatchFn<T>>(mutate: F) => Promise<Root>
        : Exclude<T, never> extends PrimitiveOrImmutableBuiltin
          ? never
          : {
              [k in keyof NonNullable<T>]-?: Batchable<
                Exclude<NonNullable<T>[k], undefined>,
                Extract<NonNullable<T>[k], null | undefined> | Root,
                undefined extends NonNullable<T>[k] ? Root | undefined : Root
              >
            })

const EDIT = 1 as const
const BATCH = 2 as const

/**
 * Enables or disables development mode for the patchfork library.
 *
 * When development mode is enabled, objects are automatically frozen after mutations
 * to help detect accidental mutations of immutable objects. This is useful during
 * development and testing to catch bugs early.
 *
 * @note This function is only available in development mode.
 *
 * @param enabled - Whether to enable (true) or disable (false) development mode
 *
 * @example
 * ```typescript
 * // Enable development mode
 * setDevMode(true)
 *
 * // Disable development mode
 * setDevMode(false)
 * ```
 */
export function setDevMode(enabled: boolean) {
  // @ifndef PRODUCTION
  devMode = enabled
  // @endif
  // @if PRODUCTION
  // @echo DEV_MODE_ERROR
  // @endif
}

// @ifndef PRODUCTION
// Dev mode configuration
let devMode = false

const frozenObjects = new WeakSet<object>()

function freezeObject(obj: any): any {
  if (!devMode || !obj || typeof obj !== 'object') {
    return obj
  }

  if (frozenObjects.has(obj)) {
    return obj
  }

  obj = _shallowClone(obj)

  // Recursively freeze nested objects
  updateChildren(obj, freezeObject)

  Object.freeze(obj)
  frozenObjects.add(obj)

  return obj
}

function updateChildren(obj: any, fn: (child: any) => any) {
  if (isPlainObject(obj)) {
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        obj[key] = fn(obj[key])
      }
    }
  } else if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      obj[i] = fn(obj[i])
    }
  } else if (obj instanceof Map) {
    for (const [key, value] of obj) {
      const nextValue = fn(value)
      if (nextValue !== value) {
        obj.set(key, nextValue)
      }
    }
  }
  return obj
}
// @endif

const isCollection = (obj: any) =>
  obj instanceof Map || obj instanceof Set || Array.isArray(obj)

class MapKey {
  constructor(public k: any) {}
}

interface Frame {
  /**
   * The proxy that is used to record paths
   */
  $: any
  /**
   * The parent frame (for the initial stack)
   */
  p: Frame | null
  /**
   * The reset function used when acquiring a frame
   */
  r: (root: any, type: FrameType, isUpdate?: boolean) => void
}
function frame(parent: Frame | null): Frame {
  const keyPath = new Array(8)
  const objPath = new Array(8)
  let obj = null as any
  let i = 0
  let type = EDIT as FrameType
  let clonedObjects = null as null | Set<object>
  let rootPromise = null as null | Promise<any>

  function release() {
    complete = null
    clonedObjects = null
    result.p = top
    top = result
  }

  function resetAfterThrow() {
    i = 0
    keyPath.fill(undefined)
    objPath.fill(undefined)
    obj = null
    rootPromise = null
    release()
  }

  function clone(obj: any) {
    if (clonedObjects?.has(obj)) {
      return obj
    }

    const res = _shallowClone(obj)
    clonedObjects?.add(res)
    return res
  }

  function set(obj: any, key: string | number, value: any): any {
    const cloned = clone(obj)
    if (cloned instanceof Map) {
      cloned.set((key as unknown as MapKey).k, value)
    } else {
      cloned[key] = value
    }
    // @ifndef PRODUCTION
    if (devMode && !clonedObjects) {
      return freezeObject(cloned)
    }
    // @endif
    return cloned
  }
  let complete = null as null | ((obj: any) => any)
  const result = {
    p: parent,
    r: (root: any, _type: FrameType, isUpdate?: boolean) => {
      type = _type
      obj = root
      if (isUpdate && ($patchable in root || $asyncPatchable in root)) {
        const container = root[$asyncPatchable] ?? root[$patchable]
        const acutalRoot = container.get()
        if ($asyncPatchable in root) {
          rootPromise = Promise.resolve(acutalRoot)
          obj = null
        } else {
          obj = root = acutalRoot
        }
        complete = (obj: any) => {
          const res = container.set(obj)
          if (res instanceof Promise) {
            return res.then(() => obj)
          }
          return obj
        }
      }
      if (!root || typeof root !== 'object' || !batchStack) {
        return
      }
      let current = batchStack as BatchFrame | null
      while (current) {
        if (current.r === root) {
          if (current.s == null) {
            current.s = new Set([root])
          }
          clonedObjects = current.s
          break
        }
        current = current.b
      }
    },
    $: new Proxy(() => {}, {
      get: function getTrap(_target, prop) {
        try {
          if (obj != null && typeof obj !== 'object') {
            const error = new TypeError(
              `Cannot edit property ${JSON.stringify(String(prop))} of ${typeof obj}`,
            )
            throw Error.captureStackTrace?.(error, getTrap) ?? error
          }
          if (prop === key) {
            return (k: any) => {
              keyPath[i] = new MapKey(k)
              objPath[i] = obj
              obj = obj?.get(k)
              i++
              return result.$
            }
          }

          keyPath[i] = prop
          objPath[i] = obj
          obj = obj?.[prop]
          i++
          return result.$
        } catch (e) {
          resetAfterThrow()
          throw e
        }
      },
      apply(_target, _thisArg, args) {
        try {
          if (rootPromise) {
            return rootPromise
              .then((root) => {
                obj = root
                for (let j = 0; j < i; j++) {
                  objPath[j] = obj
                  const key = keyPath[j]
                  if (key instanceof MapKey) {
                    obj = obj?.get(key.k)
                  } else {
                    obj = obj?.[keyPath[j]]
                  }
                }
                rootPromise = null
                return (result as any).$(...args)
              })
              .catch((e) => {
                resetAfterThrow()
                throw e
              })
          }
          let value: any = undefined
          if (type === EDIT) {
            // if obj is a function and it's parent is an array/map/set,
            // we need to clone the parent and call the function on it
            // then we pop off the the last key and value from the keyPath and objPath
            // and assign the result to value
            const parent = objPath[i - 1]
            if (typeof obj === 'function' && isCollection(parent)) {
              if (!immutableArrayMethods.has(keyPath[i - 1])) {
                value = clone(parent)
                obj.call(value, ...args)
              } else {
                value = obj.call(parent, ...args)
              }
              i--
              objPath[i] = undefined
              keyPath[i] = undefined
            }

            // if args[0] is a function, we need to call it on obj and
            // assign the result to value, as long as obj is not undefined
            else if (typeof args[0] === 'function') {
              if (obj === undefined) {
                return resetAfterThrow()
              }
              value = args[0](obj)
            }

            // if args[0] is not a function and obj's parent is defined,
            // we can assign it to value
            else {
              if (i > 0 && parent == null) {
                return resetAfterThrow()
              }
              value = args[0]
            }
          } else if (type === BATCH) {
            if (obj == null) {
              resetAfterThrow()
              return undefined
            }
            const fn = args[0]
            if (typeof obj !== 'object') {
              throw new Error(
                'edit.batch must be called on an object or collection',
              )
            } else {
              value = clone(obj)
            }
            const currentBatchFrame = getBatchFrame(value)
            let isAsync = false
            // Apply the function to the cloned value
            try {
              const res = fn.call(currentBatchFrame, value)
              if (res instanceof Promise) {
                isAsync = true
                type = EDIT

                return res
                  .then((res) => {
                    if (typeof res !== 'undefined') {
                      throw new Error('edit.batch must not return a value')
                    }
                    return (result.$ as any)(value)
                  })
                  .catch((e) => {
                    resetAfterThrow()
                    throw e
                  })
                  .finally(() => {
                    // Ensure batch stack is always released for async operations
                    releaseBatchFrame(currentBatchFrame)
                  })
              }

              if (typeof res !== 'undefined') {
                throw new Error('edit.batch must return a value')
              }
              // @ifndef PRODUCTION
              if (devMode && clonedObjects == null) {
                value = freezeObject(value)
              }
              // @endif
            } finally {
              if (!isAsync) {
                releaseBatchFrame(currentBatchFrame)
              }
            }
          }

          // @ifndef PRODUCTION
          if (devMode && !clonedObjects) {
            value = freezeObject(value)
          }
          // @endif

          while (i > 0) {
            i--
            value = set(objPath[i], keyPath[i], value)
            keyPath[i] = undefined
            objPath[i] = undefined
          }
          obj = null
          const ret = complete ? complete(value) : value

          release()
          return ret
        } catch (e) {
          resetAfterThrow()
          throw e
        }
      },
    }),
  }
  return result
}

// set up a tiny pool of four frames. we only need one frame per level
// of nested edit calls.
let top: Frame | null = frame(frame(frame(frame(null))))
type FrameType = typeof EDIT | typeof BATCH

function getFrame(root: any, type: FrameType, isUpdate?: boolean): Frame {
  if (top == null) {
    const res = frame(null)
    res.r(root, type)
    return res
  }
  const ret = top
  top = ret.p
  ret.r(root, type, isUpdate)
  return ret
}

type BatchFrame = {
  r: any
  // frame below this one (added earlier)
  b: BatchFrame | null
  // frame above this one (added later)
  a: BatchFrame | null
  s: Set<object> | null
}
let _batchStackPool: BatchFrame | null = null
let batchStack: BatchFrame | null = null
function getBatchFrame(root: any): BatchFrame {
  let ret = _batchStackPool
  if (ret === null) {
    ret = { b: batchStack, a: null, r: root, s: null }
  } else {
    _batchStackPool = ret.b
    ret.b = batchStack
    ret.a = null
    ret.r = root
    ret.s = null
  }
  if (batchStack) {
    batchStack.a = ret
  }
  batchStack = ret
  return ret
}

function releaseBatchFrame(frame: BatchFrame) {
  // clear the set and root to avoid memory leaks
  frame.r = frame.s = null
  // snip the frame out of the stack
  if (frame.b) {
    frame.b.a = frame.a
  }
  if (frame.a) {
    frame.a.b = frame.b
  } else {
    // special case: this is the top frame, so we need to update the top pointer
    batchStack = frame.b
  }
  // finally return the frame to the pool
  frame.a = null
  frame.b = _batchStackPool
  _batchStackPool = frame
}

/**
 * Allows immutably updating properties at any depth in a value using functions.
 *
 * @template T - The type of the input value
 * @param t - The value to create an updater for
 * @returns An updater object that allows updating properties at any depth using functions
 *
 * @example
 * ```typescript
 * const user = { name: 'John', age: 30 }
 * const newUser = fork(user).name(name => name.toUpperCase())
 * // Result: { name: 'JOHN', age: 30 }
 *
 * // Nested objects with complex transformations
 * const state = { user: { profile: { name: 'John Doe' } } }
 * const newState = fork(state).user.profile.name(name => {
 *   const [firstName, lastName] = name.split(' ')
 *   return `${lastName}, ${firstName}`
 * })
 * // Result: { user: { profile: { name: 'Doe, John' } } }
 *
 * // Arrays with transformations
 * const users = [{ name: 'John', age: 30 }]
 * const newUsers = fork(users)[0].age(age => age + 1)
 * // Result: [{ name: 'John', age: 31 }]
 *
 * // Maps with transformations
 * const config = new Map([['theme', 'dark']])
 * const newConfig = fork(config)[key]('theme')(theme => theme.toUpperCase())
 * // Result: Map([['theme', 'DARK']])
 * ```
 */
export const fork: (<T extends object & { [$editable]?: never }>(
  t: T | null | undefined,
) => Updatable<T>) & {
  do: {
    <T extends object & { [$editable]?: never }>(
      t: T | Patchable<T> | null | undefined,
    ): Batchable<T>
    <T extends object & { [$editable]?: never }, Fn extends BatchFn<T>>(
      t: T | Patchable<T> | null | undefined,
      fn: Fn,
    ): ReturnType<Fn> extends Promise<any> ? Promise<T> : T
  }
} = Object.assign((t: any) => getFrame(t, EDIT).$, {
  do: (t: any, f?: any) => (f ? fork.do(t)(f) : getFrame(t, BATCH).$),
})

/**
 * Updates state containers immutably using the same interface as `fork`.
 *
 * Unlike `fork` which creates a new object, `patch` operates on state containers
 * that implement the `Patchable` or `AsyncPatchable` interface. It provides the
 * same fluent API for updating nested properties, arrays, maps, and sets.
 *
 * @template T - The type of the state container's value
 * @param t - A state container that implements Patchable, AsyncPatchable, or Editable
 * @returns An updater object that allows updating properties at any depth
 */
export const patch: {
  <T extends object>(t: Editable<T>): Updatable<T>
  <T extends object>(t: AsyncPatchable<T>): AsyncUpdatable<T>
  <T extends object>(t: Patchable<T>): Updatable<T>
} & {
  do: {
    <T extends object>(t: Editable<T>): Batchable<T>
    <T extends object>(t: AsyncPatchable<T>): AsyncBatchable<T>
    <T extends object>(t: Patchable<T>): Batchable<T>
    <T extends object, Fn extends BatchFn<T>>(
      t: Editable<T>,
      fn: Fn,
    ): ReturnType<Fn> extends Promise<any> ? Promise<T> : T
    <T extends object, Fn extends BatchFn<T>>(
      t: AsyncPatchable<T>,
      fn: Fn,
    ): Promise<T>
    <T extends object, Fn extends BatchFn<T>>(
      t: Patchable<T>,
      fn: Fn,
    ): ReturnType<Fn> extends Promise<any> ? Promise<T> : T
  }
} = Object.assign((t: any) => getFrame(t, EDIT, true).$, {
  do: (t: any, f?: any) => (f ? patch.do(t)(f) : getFrame(t, BATCH, true).$),
})
