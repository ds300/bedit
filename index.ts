type Updater<T> = (val: T) => T
type Mutator<T> = (val: T) => void | T

type Updatable<T, Root = T> = {
  [k in keyof T]: T[k] extends object
    ? Updatable<T[k], Root>
    : (update: Updater<T[k]>) => Root
} & ((update: Updater<T>) => Root)

type Settable<T, Root = T> = {
  [k in keyof T]: T[k] extends object
    ? Settable<T[k], Root>
    : (val: T[k]) => Root
} & ((val: T) => Root)

type Mutatable<T, Root = T> = {
  [k in keyof T]: T[k] extends object
    ? Mutatable<T[k], Root>
    : (mutate: Mutator<T[k]>) => Root
} & ((mutate: Mutator<T>) => Root)

const SET = 0 as const
const UPDATE = 1 as const
const MUTATE = 2 as const

const SHALLOW_CLONE = 0 as const
const DEEP_CLONE = 1 as const

type CloneType = typeof SHALLOW_CLONE | typeof DEEP_CLONE

// Dev mode configuration
let devMode = false

export function setDevMode(enabled: boolean) {
  devMode = enabled
}

export function isDevModeEnabled(): boolean {
  return devMode
}

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

function updateChildren(obj: any, fn: (child: any) => any) {
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      obj[i] = fn(obj[i])
    }
  } else {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        obj[key] = fn(obj[key])
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
    cloned[key] = value
    if (devMode && !clonedObjects) {
      freezeObject(cloned)
    }
    return cloned
  }
  const result = {
    p: parent,
    r: (root, _type, _shallow) => {
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
          let value: any
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
type FrameType = typeof SET | typeof UPDATE | typeof MUTATE

function getFrame(root: any, type: FrameType, shallow: boolean): Frame {
  if (top == null) {
    return frame(null, true)
  }
  const ret = top
  top = ret.p
  ret.r(root, type, shallow)
  return ret
}

export const setIn = <T>(t: T): Settable<T> => getFrame(t, SET, false).$

export const updateIn = <T>(t: T): Updatable<T> => getFrame(t, UPDATE, false).$

export const mutateIn = <T>(t: T): Mutatable<T> => getFrame(t, MUTATE, false).$

export const shallowMutateIn = <T>(t: T): Mutatable<T> =>
  getFrame(t, MUTATE, true).$

let batchingRoots = null as null | Map<object, Map<object, CloneType>>

export function batchEdits<T>(t: T, fn: (t: T) => void): T {
  const copy = _shallowClone(t)
  if (batchingRoots == null) {
    batchingRoots = new Map()
  }

  try {
    const clonedObjects = new Map([[copy, SHALLOW_CLONE]])
    batchingRoots.set(copy, clonedObjects)
    fn(copy)
    if (devMode) {
      for (const obj of clonedObjects.keys()) {
        freezeObject(obj)
      }
    }
  } finally {
    batchingRoots.delete(copy)
  }

  return copy
}
