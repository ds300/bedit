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

// Dev mode configuration
let devMode = false

export function enableDevMode() {
  devMode = true
}

export function disableDevMode() {
  devMode = false
}

export function isDevModeEnabled(): boolean {
  return devMode
}

const frozenObjects = new WeakSet<object>()

function freezeObject(obj: any): any {
  if (!devMode || !obj || typeof obj !== 'object') {
    return
  }

  if (frozenObjects.has(obj)) {
    return
  }

  Object.freeze(obj)
  frozenObjects.add(obj)

  // Recursively freeze nested objects
  if (Array.isArray(obj)) {
    for (const item of obj) {
      if (item && typeof item === 'object') {
        freezeObject(item)
      }
    }
  } else {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key]
        if (value && typeof value === 'object') {
          freezeObject(value)
        }
      }
    }
  }
}

function _shallowClone(obj: any) {
  if (Array.isArray(obj)) {
    return obj.slice()
  }
  return { ...obj }
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
   * The root object
   */
  r: (root: any, type: FrameType, shallow: boolean) => void
}

function frame(parent: Frame | null, isEphemeral: boolean = false): Frame {
  const keyPath = new Array(8)
  const objPath = new Array(8)
  let obj = null as any
  let i = 0
  let shallow = false
  let type = SET as FrameType
  let clonedObjects = null as null | Set<object>

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

  function shallowClone(obj: any) {
    if (clonedObjects?.has(obj)) {
      return obj
    }
    const cloned = _shallowClone(obj)
    clonedObjects?.add(cloned)
    return cloned
  }

  function deepClone(obj: any) {
    if (clonedObjects?.has(obj)) {
      return obj
    }
    const cloned = structuredClone(obj)
    clonedObjects?.add(cloned)
    return cloned
  }

  function set(obj: any, key: string | number, value: any): any {
    const cloned = shallowClone(obj)
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
          switch (type) {
            case SET:
              value = valueOrFn
              break
            case UPDATE:
              value = valueOrFn(obj)
              break
            case MUTATE:
              const fn = valueOrFn
              if (obj == null || typeof obj !== 'object') {
                value = obj
              } else if (shallow) {
                value = shallowClone(obj)
              } else {
                value = deepClone(obj)
              }
              // Apply the function to the cloned value
              const res = fn(value)
              value = typeof res === 'undefined' ? value : res
              break
            default:
              throw new Error('Invalid type')
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

let batchingRoots = null as null | Map<object, Set<object>>

export function batchEdits<T>(t: T, fn: (t: T) => void): T {
  const copy = _shallowClone(t)
  if (batchingRoots == null) {
    batchingRoots = new Map()
  }

  try {
    const clonedObjects = new Set([copy])
    batchingRoots.set(copy, clonedObjects)
    fn(copy)
    if (devMode) {
      for (const obj of clonedObjects) {
        freezeObject(obj)
      }
    }
  } finally {
    batchingRoots.delete(copy)
  }

  return copy
}
