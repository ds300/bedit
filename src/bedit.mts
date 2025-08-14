import { $beditStateContainer, BeditStateContainer } from './symbols.mjs'

export type DeepReadonly<T> =
  T extends ReadonlyArray<infer U>
    ? ReadonlyArray<DeepReadonly<U>>
    : T extends ReadonlyMap<infer K, infer V>
      ? ReadonlyMap<K, DeepReadonly<V>>
      : T extends ReadonlySet<infer U>
        ? ReadonlySet<U>
        : T extends object
          ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
          : T

/**
 * Editable<T> makes the top-level properties of T mutable,
 * but all child properties (or elements, for arrays/maps/sets) are readonly.
 */
export type Editable<T> =
  // Arrays: mutable array, but elements are readonly
  T extends ReadonlyArray<infer U>
    ? Array<DeepReadonly<U>>
    : // Map: mutable map, but values are readonly
      T extends ReadonlyMap<infer K, infer V>
      ? Map<K, DeepReadonly<V>>
      : // Set: mutable set, but elements are readonly
        T extends ReadonlySet<infer U>
        ? Set<DeepReadonly<U>>
        : // Object: mutable top-level, but child properties are readonly
          T extends object
          ? { -readonly [K in keyof T]: DeepReadonly<T[K]> }
          : // Primitives: just T
            T

type Updater<T> = (val: T) => T
type Mutator<T> = (val: T) => void | T

type Updatable<T, Root = T> = (T extends ReadonlyMap<infer K, infer V>
  ? { key: (k: K) => Updatable<V, Root> }
  : {
      [k in keyof T]: T[k] extends object
        ? Updatable<T[k], Root>
        : (update: Updater<DeepReadonly<T[k]>>) => Root
    }) &
  ((update: Updater<DeepReadonly<T>>) => Root)

type Settable<T, Root = T> = (T extends ReadonlyMap<infer K, infer V>
  ? { key: (k: K) => Settable<V, Root> }
  : {
      [k in keyof T]: T[k] extends object
        ? Settable<T[k], Root>
        : (val: T[k]) => Root
    }) &
  ((val: T) => Root)

type Mutatable<T, Root = T> = (T extends ReadonlyMap<infer K, infer V>
  ? { key: (k: K) => Mutatable<V, Root> }
  : {
      [k in keyof T]: T[k] extends object
        ? Mutatable<T[k], Root>
        : (mutate: Mutator<Editable<T[k]>>) => Root
    }) &
  ((mutate: Mutator<Editable<T>>) => Root)

type ShallowMutatable<T, Root = T> = (T extends ReadonlyMap<infer K, infer V>
  ? { key: (k: K) => ShallowMutatable<V, Root> }
  : {
      [k in keyof T]: T[k] extends object
        ? ShallowMutatable<T[k], Root>
        : (mutate: Mutator<Editable<T[k]>>) => Root
    }) &
  ((mutate: Mutator<Editable<T>>) => Root)

type Deletable<T, Root = T> = (T extends ReadonlyMap<infer K, infer V>
  ? { key: (k: K) => Deletable<V, Root> }
  : T extends ReadonlySet<infer V>
    ? { key: (k: V) => () => Root }
    : {
        [k in keyof T]: T[k] extends object ? Deletable<T[k], Root> : () => Root
      }) &
  (() => Root)

type Addable<T, Root = T> =
  T extends ReadonlyMap<infer K, infer V>
    ? { key: (k: K) => Addable<V, Root> }
    : T extends ReadonlySet<infer V>
      ? (...args: V[]) => Root
      : T extends ReadonlyArray<infer V>
        ? ((...args: V[]) => Root) & Record<number, Addable<V, Root>>
        : {
            [k in keyof T]: T[k] extends object
              ? Addable<T[k], Root>
              : () => Root
          }

const SET = 0 as const
const UPDATE = 1 as const
const MUTATE = 2 as const
const DELETE = 3 as const
const ADD = 4 as const

const SHALLOW_CLONE = 0 as const
const DEEP_CLONE = 1 as const

const DELETE_VALUE = {}

type CloneType = typeof SHALLOW_CLONE | typeof DEEP_CLONE

/**
 * Enables or disables development mode for the bedit library.
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
 *
 * // Check if development mode is enabled
 * if (isDevModeEnabled()) {
 *   console.log('Development mode is active')
 * }
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

  // Recursively freeze nested objects
  updateChildren(obj, freezeObject)

  Object.freeze(obj)
  frozenObjects.add(obj)

  return obj
}
// @endif

function updateChildren(obj: any, fn: (child: any) => any) {
  if (isPlainObject(obj)) {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
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
  r: (root: any, type: FrameType) => void
}
const isPlainObject = (obj: any) => {
  if (obj == null || typeof obj !== 'object') {
    return false
  }
  const proto = Object.getPrototypeOf(obj)
  return proto === Object.prototype || proto === null
}

const _shallowClone = (obj: any) =>
  isPlainObject(obj)
    ? { ...obj }
    : Array.isArray(obj)
      ? obj.slice()
      : obj instanceof Map
        ? new Map(obj)
        : obj instanceof Set
          ? new Set(obj)
          : structuredClone(obj)

function frame(parent: Frame | null, isEphemeral: boolean = false): Frame {
  const keyPath = new Array(8)
  const objPath = new Array(8)
  let obj = null as any
  let i = 0
  let type = SET as FrameType
  let clonedObjects = null as null | Set<object>

  function release() {
    complete = null
    clonedObjects = null
    if (!isEphemeral) {
      result.p = top
      top = result
    }
  }

  function resetAfterThrow() {
    i = 0
    keyPath.fill(undefined)
    objPath.fill(undefined)
    obj = null
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
    if (value === DELETE_VALUE) {
      if (Array.isArray(cloned)) {
        cloned.splice(Number(key), 1)
      } else if (cloned instanceof Map || cloned instanceof Set) {
        cloned.delete(key)
      } else {
        delete cloned[key]
      }
    } else {
      if (cloned instanceof Map) {
        cloned.set(key, value)
      } else {
        cloned[key] = value
      }
    }
    // @ifndef PRODUCTION
    if (devMode && !clonedObjects) {
      freezeObject(cloned)
    }
    // @endif
    return cloned
  }
  let complete = null as null | ((obj: any) => any)
  const result = {
    p: parent,
    r: (root: any, _type: FrameType) => {
      if ($beditStateContainer in root) {
        const container = root[$beditStateContainer]
        root = container.get()
        complete = (obj: any) => {
          container.set(obj)
          return obj
        }
      }
      type = _type
      if (root && batchStack?.r === root) {
        if (batchStack!.s == null) {
          batchStack!.s = new Set([root])
        }
        clonedObjects = batchStack!.s
      }
      obj = root
    },
    $: new Proxy(() => {}, {
      get(_target, prop) {
        try {
          if (obj == null || typeof obj !== 'object') {
            throw new TypeError(
              `Cannot read property ${JSON.stringify(String(prop))} of ${obj === null ? 'null' : typeof obj}`,
            )
          }
          if (obj instanceof Map) {
            if (prop !== 'key') {
              throw new TypeError(
                `Cannot edit property ${JSON.stringify(String(prop))} of Map. Use .key() instead.`,
              )
            }
            return (k: any) => {
              keyPath[i] = k
              objPath[i] = obj
              obj = obj.get(k)
              i++
              return result.$
            }
          }

          keyPath[i] = prop
          objPath[i] = obj
          obj = obj[prop]
          i++
          return result.$
        } catch (e) {
          resetAfterThrow()
          throw e
        }
      },
      apply(_target, _thisArg, args) {
        try {
          let value: any = DELETE_VALUE
          if (type === SET) {
            value = args[0]
          } else if (type === UPDATE) {
            value = args[0](obj)
          } else if (type === MUTATE) {
            const fn = args[0]
            if (obj == null || typeof obj !== 'object') {
              value = obj
            } else {
              value = clone(obj)
            }
            batchStack = getBatchStack(batchStack, value, null)
            // Apply the function to the cloned value
            try {
              const res = fn(value)
              value = typeof res === 'undefined' ? value : res
              // @ifndef PRODUCTION
              if (devMode && batchStack.s != null) {
                for (const obj of batchStack.s.keys()) {
                  freezeObject(obj)
                }
              }
              // @endif
            } finally {
              releaseBatchStack(batchStack)
            }
          } else if (type === ADD) {
            value = clone(obj)
            if (Array.isArray(value)) {
              value.push(...args)
            } else if (value instanceof Set) {
              args.forEach((arg) => value.add(arg))
            } else {
              throw new Error(`Cannot add to ${obj?.constructor?.name}`)
            }
          }
          // @ifndef PRODUCTION
          if (devMode && !clonedObjects) {
            freezeObject(value)
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
// of nested setIn/updateIn/editIn calls.
let top: Frame | null = frame(frame(frame(frame(null))))
type FrameType =
  | typeof SET
  | typeof UPDATE
  | typeof MUTATE
  | typeof DELETE
  | typeof ADD

function getFrame(root: any, type: FrameType): Frame {
  if (top == null) {
    return frame(null, true)
  }
  const ret = top
  top = ret.p
  ret.r(root, type)
  return ret
}

type BatchStack = {
  r: any
  p: BatchStack | null
  s: Set<object> | null
}
let _batchStackPool: BatchStack | null = null
let batchStack: BatchStack | null = null
function getBatchStack(
  p: BatchStack | null,
  r: any,
  s: Set<object> | null,
): BatchStack {
  if (_batchStackPool == null) {
    return { p, r, s }
  }
  const ret = _batchStackPool
  _batchStackPool = ret.p
  ret.p = p
  ret.r = r
  ret.s = s
  return ret
}
function releaseBatchStack(bs: BatchStack) {
  batchStack = bs.p
  bs.p = _batchStackPool
  _batchStackPool = bs
  bs.r = null
  bs.s = null
}

/**
 * Allows immutably setting properties at any depth in a value.
 *
 * @template T - The type of the input value
 * @param t - The value to create a setter for
 * @returns A setter object that allows setting properties at any depth
 *
 * @example
 * ```typescript
 * const user = { name: 'John', age: 30 }
 * const newUser = setIn(user).name('Jane')
 * // Result: { name: 'Jane', age: 30 }
 * // Original user is unchanged
 *
 * // Nested objects
 * const state = { user: { profile: { name: 'John' } } }
 * const newState = setIn(state).user.profile.name('Jane')
 * // Result: { user: { profile: { name: 'Jane' } } }
 *
 * // Arrays
 * const users = [{ name: 'John' }, { name: 'Jane' }]
 * const newUsers = setIn(users)[0].name('Bob')
 * // Result: [{ name: 'Bob' }, { name: 'Jane' }]
 *
 * // Maps
 * const config = new Map([['theme', 'dark']])
 * const newConfig = setIn(config).key('theme')('light')
 * // Result: Map([['theme', 'light']])
 * ```
 */
export const setIn = <T,>(t: T | BeditStateContainer<T>): Settable<T> =>
  getFrame(t, SET).$

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
 * const newUser = updateIn(user).name(name => name.toUpperCase())
 * // Result: { name: 'JOHN', age: 30 }
 *
 * // Nested objects with complex transformations
 * const state = { user: { profile: { name: 'John Doe' } } }
 * const newState = updateIn(state).user.profile.name(name => {
 *   const [firstName, lastName] = name.split(' ')
 *   return `${lastName}, ${firstName}`
 * })
 * // Result: { user: { profile: { name: 'Doe, John' } } }
 *
 * // Arrays with transformations
 * const users = [{ name: 'John', age: 30 }]
 * const newUsers = updateIn(users)[0].age(age => age + 1)
 * // Result: [{ name: 'John', age: 31 }]
 *
 * // Maps with transformations
 * const config = new Map([['theme', 'dark']])
 * const newConfig = updateIn(config).key('theme')(theme => theme.toUpperCase())
 * // Result: Map([['theme', 'DARK']])
 * ```
 */
export const updateIn = <T,>(t: T | BeditStateContainer<T>): Updatable<T> =>
  getFrame(t, UPDATE).$

/**
 * Allows immutably deleting properties at any depth in a value.
 *
 * @template T - The type of the input value
 * @param t - The value to create a deleter for
 * @returns A deleter object that allows deleting properties at any depth
 *
 * @example
 * ```typescript
 * const user = { name: 'John', age: 30, email: 'john@example.com' }
 * const newUser = deleteIn(user).email()
 * // Result: { name: 'John', age: 30 }
 *
 * // Nested objects
 * const state = { user: { profile: { name: 'John', email: 'john@example.com' } } }
 * const newState = deleteIn(state).user.profile.email()
 * // Result: { user: { profile: { name: 'John' } } }
 *
 * // Arrays
 * const users = [{ name: 'John' }, { name: 'Jane' }, { name: 'Bob' }]
 * const newUsers = deleteIn(users)[1]()
 * // Result: [{ name: 'John' }, { name: 'Bob' }]
 *
 * // Maps
 * const config = new Map([['theme', 'dark'], ['debug', true]])
 * const newConfig = deleteIn(config).key('debug')()
 * // Result: Map([['theme', 'dark']])
 *
 * // Nested maps
 * const data = new Map([['users', new Map([['user1', { name: 'John' }]])]])
 * const newData = deleteIn(data).key('users').key('user1')()
 * // Result: Map([['users', new Map([])]])
 * ```
 */
export const deleteIn = <T,>(t: T | BeditStateContainer<T>): Deletable<T> =>
  getFrame(t, DELETE).$

/**
 * Allows immutably mutating properties at any depth in a value using functions.
 * This performs shallow cloning for better performance - only the target object is cloned,
 * while nested objects maintain their references.
 *
 * @template T - The type of the input value
 * @param t - The value to create a mutator for
 * @returns A mutator object that allows mutating properties at any depth using functions
 *
 * @example
 * ```typescript
 * const state = { user: { name: 'John', profile: { age: 30, city: 'NYC' } } }
 *
 * // Shallow mutation - only the top-level object is cloned
 * const newState = editIn(state).user(user => {
 *   user.name = 'Jane'
 *   // ❌ don't mutate nested objects! This would throw an error at dev time.
 *   // user.profile.age = 31
 * })
 * // Result: { name: 'Jane', profile: { age: 30, city: 'NYC' } }
 * // Original user.profile.age is still 30 (shared reference)
 *
 * // Arrays with shallow mutation
 * const state = { users: [{ name: 'John', details: { age: 30 } }] }
 * const newState = editIn(state).users(users => {
 *   const user = users.pop()
 *   // Only the array itself is cloned, not the nested objects.
 *   // ❌ This would throw an error at dev time.
 *   // user.details.age = 31
 * })
 *
 * // Maps with shallow mutation
 * const config = { preferences: new Map([['theme', 'dark']]) }
 * const newConfig = editIn(config).preferences(prefs => {
 *   prefs.set('theme', 'light')
 * })
 * // Result: { preferences: Map([['theme', 'light']]) }
 * ```
 */
export const editIn = <T,>(
  t: T | BeditStateContainer<T>,
): ShallowMutatable<T> => getFrame(t, MUTATE).$

/**
 * Allows performing multiple mutations on a value at once while minimizing the
 * number of clone operations that need to be performed under the hood.
 *
 * @template T - The type of the input value
 * @param t - The value to perform batch edits on
 * @param fn - A function that receives the cloned value and performs the desired mutations
 * @returns A new value with all the batch edits applied
 *
 * @example
 * ```typescript
 * const user = { name: 'John', age: 30, profile: { city: 'NYC' } }
 *
 * // Multiple mutations in a single batch
 * const newUser = edit(user, (user) => {
 *   user.name = 'Jane'
 *   user.age = 31
 *   user.profile.city = 'LA'
 *   user.profile.country = 'USA'
 * })
 * // Result: { name: 'Jane', age: 31, profile: { city: 'LA', country: 'USA' } }
 * // Original user remains unchanged
 *
 * // Complex batch operations
 * const state = { users: [{ name: 'John' }, { name: 'Jane' }] }
 * const newState = edit(state, (state) => {
 *   // Add a new user
 *   state.users.push({ name: 'Bob' })
 *
 *   // Update existing users
 *   state.users[0].name = 'John Doe'
 *   state.users[1].age = 25
 *
 *   // Add metadata
 *   state.lastUpdated = new Date()
 *   state.version = 2
 * })
 *
 * // Maps with batch edits
 * const config = new Map([['theme', 'dark'], ['debug', false]])
 * const newConfig = edit(config, (config) => {
 *   config.set('theme', 'light')
 *   config.set('debug', true)
 *   config.set('version', '1.0.0')
 * })
 *
 * // Arrays with batch edits
 * const numbers = [1, 2, 3, 4, 5]
 * const newNumbers = edit(numbers, (numbers) => {
 *   numbers.push(6, 7, 8)
 *   numbers[0] = 0
 *   numbers.splice(2, 1) // Remove element at index 2
 * })
 * // Result: [0, 2, 4, 5, 6, 7, 8]
 *
 * // Performance comparison
 * // Less efficient: multiple copies
 * const user1 = setIn(user).name('Jane')
 * const user2 = setIn(user1).age(31)
 * const user3 = setIn(user2).profile.city('LA')
 *
 * // More efficient: single copy with batch edits
 * const userBatch = edit(user, (user) => {
 *   user.name = 'Jane'
 *   user.age = 31
 *   user.profile.city = 'LA'
 * })
 * ```
 */
export function edit<T>(
  t: T | BeditStateContainer<T>,
  fn: (t: Editable<T>) => void,
): T {
  return editIn(t)(fn)
}

/**
 * Allows immutably adding items to arrays and Sets at any depth in a value.
 *
 * @template T - The type of the input value
 * @param t - The value to create an adder for
 * @returns An adder object that allows adding items to arrays and Sets at any depth
 *
 * @example
 * ```typescript
 * // Adding to arrays
 * const users = [{ name: 'John' }, { name: 'Jane' }]
 * const newUsers = addIn(users)({ name: 'Bob' })
 * // Result: [{ name: 'John' }, { name: 'Jane' }, { name: 'Bob' }]
 *
 * // Adding to Sets
 * const tags = new Set(['admin', 'user'])
 * const newTags = addIn(tags)('moderator', 'vip')
 * // Result: Set(['admin', 'user', 'moderator', 'vip'])
 *
 * // Nested arrays
 * const state = { users: [{ name: 'John', tags: ['admin'] }] }
 * const newState = addIn(state).users[0].tags('moderator', 'vip')
 * // Result: { users: [{ name: 'John', tags: ['admin', 'moderator', 'vip'] }] }
 *
 * // Nested Sets
 * const state = { categories: { tech: new Set(['js', 'ts']) } }
 * const newState = addIn(state).categories.tech('react', 'vue')
 * // Result: { categories: { tech: Set(['js', 'ts', 'react', 'vue']) } }
 *
 * // Maps with nested Sets
 * const state = { users: new Map([['user1', { tags: new Set(['admin']) }]]) }
 * const newState = addIn(state).users.key('user1').tags('moderator')
 * // Result: { users: Map([['user1', { tags: Set(['admin', 'moderator']) }]]) }
 * ```
 */
export const addIn = <T,>(t: T | BeditStateContainer<T>): Addable<T> =>
  getFrame(t, ADD).$
