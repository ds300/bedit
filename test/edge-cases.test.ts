import { describe, it, expect } from './test-utils'
import { setIn } from '../src/bedit.mjs'

describe('edge cases', () => {
  it('should handle empty objects', () => {
    const obj: Record<string, any> = {}
    const backup = structuredClone(obj)
    const mutable = structuredClone(obj)
    mutable.newProp = 'value'

    const result = setIn(obj).newProp('value')

    expect(result).toEqual(mutable)
    expect(obj).toEqual(backup)
  })

  it('should handle empty arrays', () => {
    const obj = { items: [] as string[] }
    const backup = structuredClone(obj)
    const mutable = structuredClone(obj)
    mutable.items[0] = 'first item'

    const result = setIn(obj).items[0]('first item')

    expect(result).toEqual(mutable)
    expect(obj).toEqual(backup)
  })

  it('should handle undefined values in path', () => {
    const obj = { user: { profile: undefined } }
    const backup = structuredClone(obj)

    expect(() => {
      // @ts-expect-error
      setIn(obj).user.profile.name('John')
    }).toThrow('Cannot read property "name" of undefined')
    expect(obj).toEqual(backup)
  })

  it('should handle non-object values in path', () => {
    const obj = { user: 'not an object' }
    const backup = structuredClone(obj)

    expect(() => {
      // @ts-expect-error
      setIn(obj).user.name('John')
    }).toThrow('Cannot read property "name" of string')
    expect(obj).toEqual(backup)
  })

  it('should handle empty maps', () => {
    const obj = { data: new Map() }
    const backup = structuredClone(obj)
    const mutable = structuredClone(obj)
    mutable.data.set('new', 'value')

    const result = setIn(obj).data.key('new')('value')

    expect(result).toEqual(mutable)
    expect(obj).toEqual(backup)
  })

  it('should handle maps with null/undefined values', () => {
    const obj = { foo: new Map([['bar', null as string | null]]) }
    const backup = structuredClone(obj)
    const mutable = structuredClone(obj)
    mutable.foo.set('bar', 'new value')

    const result = setIn(obj).foo.key('bar')('new value')

    expect(result).toEqual(mutable)
    expect(obj).toEqual(backup)
  })

  it('should handle maps with undefined keys', () => {
    const obj = { foo: new Map([['bar', 'baz']]) }
    const backup = structuredClone(obj)

    expect(() => {
      // @ts-expect-error
      setIn(obj).foo.key('nonexistent').key('something')('value')
    }).toThrow()
    expect(obj).toEqual(backup)
  })

  it('should handle maps within null objects', () => {
    const obj = { data: null }
    const backup = structuredClone(obj)

    expect(() => {
      // @ts-expect-error
      setIn(obj).data.key('foo')('value')
    }).toThrow('Cannot read property "key" of null')
    expect(obj).toEqual(backup)
  })

  it('should handle null/undefined in isPlainObject checks', () => {
    // Test null properties - should not affect cloning behavior
    const obj: {
      nullProp: string | null
      undefinedProp: string | undefined
      validProp: { nested: string }
    } = {
      nullProp: null,
      undefinedProp: undefined,
      validProp: { nested: 'value' },
    }
    const backup = structuredClone(obj)

    const result = setIn(obj).nullProp('not null')

    expect(result.nullProp).toBe('not null')
    expect(result.undefinedProp).toBe(undefined)
    expect(result.validProp).toEqual({ nested: 'value' })
    expect(obj).toEqual(backup) // Original unchanged
  })

  it('should handle objects with null prototype', () => {
    const nullProtoObj = Object.create(null)
    nullProtoObj.key = 'value'

    const obj: { data: { key: string } } = { data: nullProtoObj }
    const result = setIn(obj).data.key('updated')

    expect(result.data.key).toBe('updated')
    // The cloned object will have Object.prototype, not null prototype
    // This is expected behavior from the shallow clone operation
    expect(Object.getPrototypeOf(result.data)).toBe(Object.prototype)
  })

  it('should handle primitive values in object positions', () => {
    const obj = { primitive: 42 }
    const backup = structuredClone(obj)

    expect(() => {
      // @ts-expect-error
      setIn(obj).primitive.nonExistentProp('value')
    }).toThrow('Cannot read property "nonExistentProp" of number')
    expect(obj).toEqual(backup)
  })

  it('should handle boolean primitives', () => {
    const obj = { flag: true }
    const backup = structuredClone(obj)

    expect(() => {
      // @ts-expect-error
      setIn(obj).flag.toString('false')
    }).toThrow('Cannot read property "toString" of boolean')
    expect(obj).toEqual(backup)
  })
})
