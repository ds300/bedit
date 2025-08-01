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
let i = 0
let id = null as null | number
const reset = () => {
  i = 0
  id = null
}

export function setIn<T>(t: T): Settable<T> {
  let obj = t
  let myId = (id = Math.random())
  const $: any = new Proxy(() => {}, {
    get(_target, prop) {
      try {
        if (id !== myId) {
          throw new Error('`setIn` was called asynchronously')
        }
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
        reset()
        throw e
      }
    },
    apply(_target, _thisArg, [value]) {
      try {
        if (id !== myId) {
          throw new Error('`setIn` was called asynchronously')
        }
        while (i > 0) {
          i--
          value = set(objPath[i], keyPath[i], value)
          keyPath[i] = undefined
          objPath[i] = undefined
        }
        id = null
        return value
      } catch (e) {
        reset()
        throw e
      }
    },
  })
  return $
}

export function updateIn<T>(
  t: T,
  options?: { shallow?: boolean },
): Updatable<T> {
  let obj = t
  let myId = (id = Math.random())
  const $: any = new Proxy(() => {}, {
    get(_target, prop) {
      try {
        if (id !== myId) {
          throw new Error('`updateIn` was called asynchronously')
        }
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
        reset()
        throw e
      }
    },
    apply(_target, _thisArg, [fn]) {
      try {
        if (id !== myId) {
          throw new Error('`updateIn` was called asynchronously')
        }
        // Clone the value at the current path
        let value: any = obj
        if (value == null || typeof value !== 'object') {
          // noop
        } else if (options?.shallow) {
          value = Array.isArray(value) ? value.slice() : { ...value }
        } else {
          value = structuredClone(value)
        }
        // Apply the function to the cloned value
        const res = fn(value)
        value = typeof res === 'undefined' ? value : res

        while (i > 0) {
          i--
          value = set(objPath[i], keyPath[i], value)
          keyPath[i] = undefined
          objPath[i] = undefined
        }
        id = null
        return value
      } catch (e) {
        reset()
        throw e
      }
    },
  })
  return $
}
