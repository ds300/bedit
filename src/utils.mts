export const isPlainObject = (obj: any) => {
  if (obj == null || typeof obj !== 'object') {
    return false
  }
  const proto = Object.getPrototypeOf(obj)
  return proto === Object.prototype || proto === null
}

export const _shallowClone = (obj: any) =>
  isPlainObject(obj)
    ? { ...obj }
    : Array.isArray(obj)
      ? obj.slice()
      : obj instanceof Map
        ? new Map(obj)
        : obj instanceof Set
          ? new Set(obj)
          : structuredClone(obj)
