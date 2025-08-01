type Updater<T> = (val: T) => void | T

type Updatable<T, Root = T> = {
  [k in keyof T]: T[k] extends object
    ? Updatable<T[k], Root>
    : (edit: Updater<T[k]>) => Root
} & ((edit: Updater<T>) => Root)

type Settable<T, Root = T> = {
  [k in keyof T]: T[k] extends object
    ? Settable<T[k], Root>
    : (val: T[k]) => Root
} & ((val: T) => Root)

function set(obj: any, key: string | number, value: any): any {
  if (Array.isArray(obj)) {
    const res = obj.slice(0)
    res[key] = value
    return res
  }
  return { ...obj, [key]: value }
}

const keyPath = new Array(10)
const objPath = new Array(10)
let obj = null as any
let i = 0
let didFinish = true
const SET = 0 as const
const UPDATE = 1 as const
let shallow = false
let type = SET as typeof SET | typeof UPDATE

const resetAfterThrow = () => {
  i = 0
  didFinish = true
  keyPath.fill(undefined)
  objPath.fill(undefined)
  obj = null
}

const $: any = new Proxy(() => {}, {
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
      return $
    } catch (e) {
      resetAfterThrow()
      throw e
    }
  },
  apply(_target, _thisArg, [valueOrFn]) {
    try {
      let value = type === SET ? valueOrFn : obj
      if (type === UPDATE) {
        const fn = valueOrFn
        if (value == null || typeof value !== 'object') {
          // noop
        } else if (shallow) {
          value = Array.isArray(value) ? value.slice() : { ...value }
        } else {
          value = structuredClone(value)
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
      didFinish = true
      return value
    } catch (e) {
      resetAfterThrow()
      throw e
    }
  },
})

export function setIn<T>(t: T): Settable<T> {
  if (!didFinish) {
    throw new Error('`setIn` was called asynchronously')
  }
  didFinish = false
  obj = t
  type = SET
  return $
}

export function updateIn<T>(
  t: T,
  options?: { shallow?: boolean },
): Updatable<T> {
  if (!didFinish) {
    throw new Error('`updateIn` was called asynchronously')
  }
  didFinish = false
  obj = t
  type = UPDATE
  shallow = !!options?.shallow
  return $
}
