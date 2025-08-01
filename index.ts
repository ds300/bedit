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

function set(obj: any, key: string | number, value: any): any {
  if (Array.isArray(obj)) {
    const res = obj.slice(0)
    res[key] = value
    return res
  }
  return { ...obj, [key]: value }
}

const SET = 0 as const
const UPDATE = 1 as const
const MUTATE = 2 as const

class BeditFrame {
  constructor(
    parent: BeditFrame | null,
    private isEphemeral: boolean = false,
  ) {
    this.parent = parent
  }

  release() {
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
  type = SET as typeof SET | typeof UPDATE | typeof MUTATE

  resetAfterThrow() {
    this.i = 0
    this.keyPath.fill(undefined)
    this.objPath.fill(undefined)
    this.obj = null
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
              value = Array.isArray(this.obj)
                ? this.obj.slice()
                : { ...this.obj }
            } else {
              value = structuredClone(this.obj)
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
          value = set(this.objPath[this.i], this.keyPath[this.i], value)
          this.keyPath[this.i] = undefined
          this.objPath[this.i] = undefined
        }
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

function getFrame(): BeditFrame {
  if (top == null) {
    return new BeditFrame(null, true)
  }
  const ret = top
  top = ret.parent
  return ret
}

export function setIn<T>(t: T): Settable<T> {
  const frame = getFrame()
  frame.obj = t
  frame.type = SET
  return frame.$ as any
}

export function updateIn<T>(t: T): Updatable<T> {
  const frame = getFrame()
  frame.obj = t
  frame.type = UPDATE
  return frame.$ as any
}

export function mutateIn<T>(
  t: T,
  options?: { shallow?: boolean },
): Mutatable<T> {
  const frame = getFrame()
  frame.obj = t
  frame.type = MUTATE
  frame.shallow = !!options?.shallow
  return frame.$ as any
}

export function shallowMutateIn<T>(t: T): Mutatable<T> {
  return mutateIn(t, { shallow: true })
}