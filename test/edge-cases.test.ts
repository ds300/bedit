import { describe, it, expect } from './test-utils'
import { setIn } from '../bedit.mts'

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
})
