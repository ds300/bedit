import {
  describe,
  it,
  expect,
  createDeepNested,
  createNestedArray,
} from './test-utils'
import { deleteIn } from '../src/bedit.mjs'

describe('deleteIn', () => {
  it('should delete a top-level property', () => {
    const obj = { name: 'John', age: 30, city: 'NYC' }
    const backup = structuredClone(obj)
    const mutable = structuredClone(obj)
    delete (mutable as any).age

    const result = deleteIn(obj).age()

    expect(result).toEqual(mutable)
    expect(obj).toEqual(backup)
  })

  it('should delete a nested property', () => {
    const obj = {
      user: {
        profile: {
          name: 'John',
          age: 30,
          email: 'john@example.com',
        },
      },
    }
    const backup = structuredClone(obj)
    const mutable = structuredClone(obj)
    delete (mutable.user.profile as any).email

    const result = deleteIn(obj).user.profile.email()

    expect(result).toEqual(mutable)
    expect(obj).toEqual(backup)
  })

  it('should delete array elements', () => {
    const obj = {
      users: [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 },
        { name: 'Bob', age: 35 },
      ],
    }
    const backup = structuredClone(obj)
    const mutable = structuredClone(obj)
    mutable.users.splice(1, 1)

    const result = deleteIn(obj).users[1]()

    expect(result).toEqual(mutable)
    expect(obj).toEqual(backup)
  })

  it('should delete deeply nested properties', () => {
    const obj = createDeepNested()
    const backup = structuredClone(obj)
    const mutable = structuredClone(obj)
    ;(mutable.a.b.c.d.e.f.g.h.i as any) = {}

    const result = deleteIn(obj).a.b.c.d.e.f.g.h.i.j()

    expect(result).toEqual(mutable)
    expect(obj).toEqual(backup)
  })

  it('should delete multiple properties in the same object', () => {
    const obj = {
      user: {
        profile: {
          name: 'John',
          age: 30,
          email: 'john@example.com',
          phone: '123-456-7890',
        },
      },
    }
    const backup = structuredClone(obj)
    const mutable = structuredClone(obj)
    delete (mutable.user.profile as any).email
    delete (mutable.user.profile as any).phone

    let result = deleteIn(obj).user.profile.email()
    result = deleteIn(result).user.profile.phone()

    expect(result).toEqual(mutable)
    expect(obj).toEqual(backup)
  })

  it('should handle deleting from arrays with nested objects', () => {
    const obj = {
      data: [
        { id: 1, value: 'a', extra: 'x' },
        { id: 2, value: 'b', extra: 'y' },
        { id: 3, value: 'c', extra: 'z' },
      ],
    }
    const backup = structuredClone(obj)
    const mutable = structuredClone(obj)
    delete (mutable.data[1] as any).extra

    const result = deleteIn(obj).data[1].extra()

    expect(result).toEqual(mutable)
    expect(obj).toEqual(backup)
  })

  it('should handle deleting from nested arrays', () => {
    const obj = createNestedArray()
    const backup = structuredClone(obj)
    const mutable = structuredClone(obj)
    delete (mutable.data[0][1] as any).value

    const result = deleteIn(obj).data[0][1].value()

    expect(result).toEqual(mutable)
    expect(obj).toEqual(backup)
  })

  it('should handle deleting from empty arrays', () => {
    const obj = { items: [] as string[] }
    const backup = structuredClone(obj)
    const mutable = structuredClone(obj)

    const result = deleteIn(obj).items[0]()

    expect(result).toEqual(mutable)
    expect(obj).toEqual(backup)
  })

  it('should handle concurrent delete operations', () => {
    const obj = {
      user: {
        profile: {
          name: 'John',
          age: 30,
          email: 'john@example.com',
        },
      },
    }
    const backup = structuredClone(obj)
    const mutable1 = structuredClone(obj)
    const mutable2 = structuredClone(obj)
    delete (mutable1.user.profile as any).name
    delete (mutable2.user.profile as any).email

    const result1 = deleteIn(obj).user.profile.name()
    const result2 = deleteIn(obj).user.profile.email()

    expect(result1).toEqual(mutable1)
    expect(result2).toEqual(mutable2)
    expect(obj).toEqual(backup)
  })

  it('should throw error when accessing property of null/undefined', () => {
    const obj = { user: null }
    const backup = structuredClone(obj)

    expect(() => {
      // @ts-expect-error
      deleteIn(obj).user.name()
    }).toThrow('Cannot read property "name" of null')
    expect(obj).toEqual(backup)
  })

  it('should handle deleting from objects with mixed types', () => {
    const obj = {
      data: {
        string: 'value',
        number: 42,
        boolean: true,
        null: null,
        undefined: undefined,
        array: [1, 2, 3],
        object: { nested: 'value' },
      },
    }
    const backup = structuredClone(obj)
    const mutable = structuredClone(obj)
    delete (mutable.data as any).null

    const result = deleteIn(obj).data.null()

    expect(result).toEqual(mutable)
    expect(obj).toEqual(backup)
  })

  it('should handle deleting from objects with numeric string keys', () => {
    const obj = {
      '0': 'zero',
      '1': 'one',
      '2': 'two',
    }
    const backup = structuredClone(obj)
    const mutable = structuredClone(obj)
    delete (mutable as any)['1']

    const result = deleteIn(obj)['1']()

    expect(result).toEqual(mutable)
    expect(obj).toEqual(backup)
  })

  it('should delete map entries', () => {
    const obj = {
      foo: new Map([
        ['bar', 'baz'],
        ['qux', 'quux'],
      ]),
    }
    const backup = structuredClone(obj)
    const mutable = structuredClone(obj)
    mutable.foo.delete('bar')

    const result = deleteIn(obj).foo.key('bar')()

    expect(result).toEqual(mutable)
    expect(obj).toEqual(backup)
  })

  it('should delete nested map entries', () => {
    const obj = {
      data: new Map([
        [
          'users',
          new Map([
            ['user1', { name: 'John' }],
            ['user2', { name: 'Jane' }],
          ]),
        ],
      ]),
    }
    const backup = structuredClone(obj)
    const mutable = structuredClone(obj)
    mutable.data.get('users')!.delete('user1')

    const result = deleteIn(obj).data.key('users').key('user1')()

    expect(result).toEqual(mutable)
    expect(obj).toEqual(backup)
  })

  it('should delete map entries within arrays', () => {
    const obj = [
      {
        bar: new Map([
          ['foo', 'value'],
          ['extra', 'data'],
        ]),
      },
    ]
    const backup = structuredClone(obj)
    const mutable = structuredClone(obj)
    mutable[0].bar.delete('extra')

    const result = deleteIn(obj)[0].bar.key('extra')()

    expect(result).toEqual(mutable)
    expect(obj).toEqual(backup)
  })

  it('should delete deeply nested map entries', () => {
    const obj = {
      config: new Map([
        [
          'settings',
          new Map([
            [
              'features',
              new Map([
                ['feature1', { enabled: true }],
                ['feature2', { enabled: false }],
              ]),
            ],
          ]),
        ],
      ]),
    }
    const backup = structuredClone(obj)
    const mutable = structuredClone(obj)
    mutable.config.get('settings')!.get('features')!.delete('feature1')

    const result = deleteIn(obj)
      .config.key('settings')
      .key('features')
      .key('feature1')()

    expect(result).toEqual(mutable)
    expect(obj).toEqual(backup)
  })

  it('should handle deleting from maps with complex nested structures', () => {
    const obj = {
      data: new Map([
        [
          'items',
          new Map([
            ['item1', { id: 1, tags: ['a', 'b'] }],
            ['item2', { id: 2, tags: ['c', 'd'] }],
          ]),
        ],
      ]),
    }
    const backup = structuredClone(obj)
    const mutable = structuredClone(obj)
    mutable.data.get('items')!.delete('item1')

    const result = deleteIn(obj).data.key('items').key('item1')()

    expect(result).toEqual(mutable)
    expect(obj).toEqual(backup)
  })
})
