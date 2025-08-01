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

function shallowClone(obj: any) {
  if (Array.isArray(obj)) {
    return obj.slice()
  }
  return { ...obj }
}

class BeditFrame {
  constructor(
    parent: BeditFrame | null,
    private isEphemeral: boolean = false,
  ) {
    this.parent = parent
  }

  release() {
    this.clonedObjects = null
    if (!this.isEphemeral) {
      this.parent = top
      top = this
    }
  }

  parent: BeditFrame | null
  keyPath = new Array(8)
  objPath = new Array(8)
  obj = null as any
  i = 0
  shallow = false
  type = SET as FrameType
  clonedObjects = null as null | Set<object>

  resetAfterThrow() {
    this.i = 0
    this.keyPath.fill(undefined)
    this.objPath.fill(undefined)
    this.obj = null
    this.clonedObjects = null
    this.release()
  }

  set(obj: any, key: string | number, value: any): any {
    const cloned = this.shallowClone(obj)
    cloned[key] = value
    return cloned
  }

  shallowClone(obj: any) {
    if (this.clonedObjects?.has(obj)) {
      return obj
    }
    const cloned = shallowClone(obj)
    this.clonedObjects?.add(cloned)
    return cloned
  }

  deepClone(obj: any) {
    if (this.clonedObjects?.has(obj)) {
      return obj
    }
    const cloned = structuredClone(obj)
    this.clonedObjects?.add(cloned)
    return cloned
  }

  $ = new Proxy(() => {}, {
    get: (_target, prop) => {
      try {
        if (this.obj == null || typeof this.obj !== 'object') {
          throw new TypeError(
            `Cannot read property ${JSON.stringify(String(prop))} of ${this.obj === null ? 'null' : typeof this.obj}`,
          )
        }
        this.keyPath[this.i] = prop
        this.objPath[this.i] = this.obj
        this.obj = this.obj[prop]
        this.i++
        return this.$
      } catch (e) {
        this.resetAfterThrow()
        throw e
      }
    },
    apply: (_target, _thisArg, [valueOrFn]) => {
      try {
        let value: any
        switch (this.type) {
          case SET:
            value = valueOrFn
            break
          case UPDATE:
            value = valueOrFn(this.obj)
            break
          case MUTATE:
            const fn = valueOrFn
            if (this.obj == null || typeof this.obj !== 'object') {
              value = this.obj
            } else if (this.shallow) {
              value = this.shallowClone(this.obj)
            } else {
              value = this.deepClone(this.obj)
            }
            // Apply the function to the cloned value
            const res = fn(value)
            value = typeof res === 'undefined' ? value : res
            break
          default:
            throw new Error('Invalid type')
        }
        while (this.i > 0) {
          this.i--
          value = this.set(this.objPath[this.i], this.keyPath[this.i], value)
          this.keyPath[this.i] = undefined
          this.objPath[this.i] = undefined
        }
        this.obj = null
        this.release()
        return value
      } catch (e) {
        this.resetAfterThrow()
        throw e
      }
    },
  })
}

let top: BeditFrame | null = new BeditFrame(
  new BeditFrame(new BeditFrame(new BeditFrame(null))),
)
type FrameType = typeof SET | typeof UPDATE | typeof MUTATE

function getFrame(root: any, type: FrameType, shallow: boolean): BeditFrame {
  if (top == null) {
    return new BeditFrame(null, true)
  }
  const ret = top
  top = ret.parent
  ret.type = type
  ret.clonedObjects = batchingRoots?.get(root) ?? null
  ret.shallow = shallow
  ret.obj = root
  return ret
}

export function setIn<T>(t: T): Settable<T> {
  return getFrame(t, SET, false).$ as any
}

export function updateIn<T>(t: T): Updatable<T> {
  return getFrame(t, UPDATE, false).$ as any
}

export function mutateIn<T>(t: T): Mutatable<T> {
  return getFrame(t, MUTATE, false).$ as any
}

export function shallowMutateIn<T>(t: T): Mutatable<T> {
  return getFrame(t, MUTATE, true).$ as any
}

let batchingRoots = null as null | Map<object, Set<object>>

export function batchEdits<T>(t: T, fn: (t: T) => void): T {
  const copy = shallowClone(t)
  if (batchingRoots == null) {
    batchingRoots = new Map()
  }

  try {
    batchingRoots.set(copy, new Set([copy]))
    fn(copy)
  } finally {
    batchingRoots.delete(copy)
  }

  return copy
}
