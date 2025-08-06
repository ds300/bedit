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
export type DeepMutable<T> =
  T extends ReadonlyArray<infer U>
    ? Array<DeepMutable<U>>
    : T extends ReadonlyMap<infer K, infer V>
      ? Map<K, DeepMutable<V>>
      : T extends ReadonlySet<infer U>
        ? Set<U>
        : T extends object
          ? { -readonly [K in keyof T]: DeepMutable<T[K]> }
          : T

/**
 * ShallowMutable<T> makes the top-level properties of T mutable,
 * but all child properties (or elements, for arrays/maps/sets) are readonly.
 */
export type ShallowMutable<T> =
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
        : (mutate: Mutator<DeepMutable<T[k]>>) => Root
    }) &
  ((mutate: Mutator<DeepMutable<T>>) => Root)

type ShallowMutatable<T, Root = T> = (T extends ReadonlyMap<infer K, infer V>
  ? { key: (k: K) => ShallowMutatable<V, Root> }
  : {
      [k in keyof T]: T[k] extends object
        ? ShallowMutatable<T[k], Root>
        : (mutate: Mutator<ShallowMutable<T[k]>>) => Root
    }) &
  ((mutate: Mutator<ShallowMutable<T>>) => Root)

type Deletable<T, Root = T> = (T extends ReadonlyMap<infer K, infer V>
  ? { key: (k: K) => Deletable<V, Root> }
  : T extends ReadonlySet<infer V>
    ? { key: (k: V) => () => Root }
    : {
        [k in keyof T]: T[k] extends object ? Deletable<T[k], Root> : () => Root
      }) &
  (() => Root)

const SET = 0 as const
const UPDATE = 1 as const
const MUTATE = 2 as const
const DELETE = 3 as const

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
  r: (root: any, type: FrameType, shallow: boolean) => void
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
  let shallow = false
  let type = SET as FrameType
  let clonedObjects = null as null | Map<object, CloneType>

  function release() {
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
    clonedObjects = null
    release()
  }

  function clone(obj: any, type: CloneType) {
    const existing = clonedObjects?.get(obj)
    if (existing === SHALLOW_CLONE) {
      if (type === DEEP_CLONE) {
        updateChildren(obj, (child) => clone(child, DEEP_CLONE))
        clonedObjects?.set(obj, DEEP_CLONE)
      }
      return obj
    } else if (existing === DEEP_CLONE) {
      return obj
    } else {
      const res =
        type === DEEP_CLONE ? structuredClone(obj) : _shallowClone(obj)
      clonedObjects?.set(res, type)
      return res
    }
  }

  function set(obj: any, key: string | number, value: any): any {
    const cloned = clone(obj, SHALLOW_CLONE)
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
  const result = {
    p: parent,
    r: (root: any, _type: FrameType, _shallow: boolean) => {
      type = _type
      clonedObjects = batchingRoots?.get(root) ?? null
      shallow = _shallow
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
      apply(_target, _thisArg, [valueOrFn]) {
        try {
          let value: any = DELETE_VALUE
          if (type === SET) {
            value = valueOrFn
          } else if (type === UPDATE) {
            value = valueOrFn(obj)
          } else if (type === MUTATE) {
            const fn = valueOrFn
            if (obj == null || typeof obj !== 'object') {
              value = obj
            } else if (shallow) {
              value = clone(obj, SHALLOW_CLONE)
            } else {
              value = clone(obj, DEEP_CLONE)
            }
            // Apply the function to the cloned value
            const res = fn(value)
            value = typeof res === 'undefined' ? value : res
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
          release()
          return value
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
// of nested setIn/updateIn/mutateIn calls.
let top: Frame | null = frame(frame(frame(frame(null))))
type FrameType = typeof SET | typeof UPDATE | typeof MUTATE | typeof DELETE

function getFrame(root: any, type: FrameType, shallow?: boolean): Frame {
  if (top == null) {
    return frame(null, true)
  }
  const ret = top
  top = ret.p
  ret.r(root, type, !!shallow)
  return ret
}
let batchingRoots = null as null | Map<object, Map<object, CloneType>>

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
export const setIn = <T,>(t: T): Settable<T> => getFrame(t, SET).$

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
export const updateIn = <T,>(t: T): Updatable<T> => getFrame(t, UPDATE).$

/**
 * Allows immutably mutating properties at any depth in a value using functions.
 * The function can either mutate the value directly or return a new value.
 * This performs deep cloning using `structuredClone` for complete isolation.
 *
 * @template T - The type of the input value
 * @param t - The value to create a mutator for
 * @returns A mutator object that allows mutating properties at any depth using functions
 *
 * @example
 * ```typescript
 * const user = { name: 'John', age: 30 }
 *
 * // Direct mutation
 * const newUser = deepMutateIn(user)(user => {
 *   user.name = user.name.toUpperCase()
 *   user.age += 1
 * })
 * // Result: { name: 'JOHN', age: 31 }
 *
 * // Return new value
 * const newUser2 = deepMutateIn(user).name(name => name.toUpperCase())
 * // Result: { name: 'JOHN', age: 30 }
 *
 * // Nested objects with complex mutations
 * const state = { user: { profile: { name: 'John', age: 30 } } }
 * const newState = deepMutateIn(state).user.profile(profile => {
 *   profile.name = profile.name.toUpperCase()
 *   profile.age += 5
 *   profile.hobbies = ['reading', 'gaming']
 * })
 * // Result: { user: { profile: { name: 'JOHN', age: 35, hobbies: ['reading', 'gaming'] } } }
 *
 * // Maps with mutations
 * const config = new Map([['theme', 'dark']])
 * const newConfig = deepMutateIn(config).key('theme')(theme => theme.toUpperCase())
 * // Result: Map([['theme', 'DARK']])
 * ```
 */
export const deepMutateIn = <T,>(t: T): Mutatable<T> => getFrame(t, MUTATE).$

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
export const deleteIn = <T,>(t: T): Deletable<T> => getFrame(t, DELETE).$

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
 * const newState = mutateIn(state).user(user => {
 *   user.name = 'Jane'
 *   // ❌ don't mutate nested objects! This would throw an error at dev time.
 *   // user.profile.age = 31
 * })
 * // Result: { name: 'Jane', profile: { age: 30, city: 'NYC' } }
 * // Original user.profile.age is still 30 (shared reference)
 *
 * // For nested mutations, use deepMutateIn instead
 * const safeState = deepMutateIn(state).user(user => {
 *   user.profile.age = 31 // This only affects the new object
 * })
 * // Original user.profile.age remains 30
 *
 * // Arrays with shallow mutation
 * const state = { users: [{ name: 'John', details: { age: 30 } }] }
 * const newState = mutateIn(state).users(users => {
 *   const user = users.pop()
 *   // Only the array itself is cloned, not the nested objects.
 *   // ❌ This would throw an error at dev time.
 *   // user.details.age = 31
 * })
 *
 * // Maps with shallow mutation
 * const config = { preferences: new Map([['theme', 'dark']]) }
 * const newConfig = mutateIn(config).preferences(prefs => {
 *   prefs.set('theme', 'light')
 * })
 * // Result: { preferences: Map([['theme', 'light']]) }
 * ```
 */
export const mutateIn = <T,>(t: T): ShallowMutatable<T> =>
  getFrame(t, MUTATE, true).$

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
 * const newUser = batchEdits(user, (user) => {
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
 * const newState = batchEdits(state, (state) => {
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
 * const newConfig = batchEdits(config, (config) => {
 *   config.set('theme', 'light')
 *   config.set('debug', true)
 *   config.set('version', '1.0.0')
 * })
 *
 * // Arrays with batch edits
 * const numbers = [1, 2, 3, 4, 5]
 * const newNumbers = batchEdits(numbers, (numbers) => {
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
 * const userBatch = batchEdits(user, (user) => {
 *   user.name = 'Jane'
 *   user.age = 31
 *   user.profile.city = 'LA'
 * })
 * ```
 */
export function batchEdits<T>(t: T, fn: (t: ShallowMutable<T>) => void): T {
  const copy = _shallowClone(t)
  if (batchingRoots == null) {
    batchingRoots = new Map()
  }

  try {
    const clonedObjects = new Map([[copy, SHALLOW_CLONE]])
    batchingRoots.set(copy, clonedObjects)
    fn(copy)
    // @ifndef PRODUCTION
    if (devMode) {
      for (const obj of clonedObjects.keys()) {
        freezeObject(obj)
      }
    }
    // @endif
  } finally {
    batchingRoots.delete(copy)
  }

  return copy
}
