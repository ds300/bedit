import {
  describe,
  it,
  expect,
  createSimpleUser,
  createNestedUser,
  createUserArray,
  createDeepNested,
} from './test-utils'
import { key, setIn } from '../src/bedit.mjs'

describe('setIn', () => {
  it('should set a top-level property', () => {
    const obj = createSimpleUser()
    const backup = structuredClone(obj)
    const mutable = structuredClone(obj)
    mutable.name = 'Jane'

    const result = setIn(obj).name('Jane')

    expect(result).toEqual(mutable)
    expect(obj).toEqual(backup)
  })

  it('should set a nested property', () => {
    const obj = createNestedUser()
    const backup = structuredClone(obj)
    const mutable = structuredClone(obj)
    mutable.user.profile.name = 'Jane'

    const result = setIn(obj).user.profile.name('Jane')

    expect(result).toEqual(mutable)
    expect(obj).toEqual(backup)
  })

  it('should set array elements', () => {
    const obj = createUserArray()
    const backup = structuredClone(obj)
    const mutable = structuredClone(obj)
    mutable.users[0].name = 'Bob'

    const result = setIn(obj).users[0].name('Bob')

    expect(result).toEqual(mutable)
    expect(obj).toEqual(backup)
  })

  it('should handle deep nested paths', () => {
    const obj = createDeepNested()
    const backup = structuredClone(obj)
    const mutable = structuredClone(obj)
    mutable.a.b.c.d.e.f.g.h.i.j = 'new value'

    const result = setIn(obj).a.b.c.d.e.f.g.h.i.j('new value')

    expect(result).toEqual(mutable)
    expect(obj).toEqual(backup)
  })

  it('should handle null/undefined values', () => {
    const obj = { name: 'John' }
    const backup = structuredClone(obj)
    const mutable = structuredClone(obj)
    mutable.name = null as any

    const result = setIn(obj).name(null as any)

    expect(result).toEqual(mutable)
    expect(obj).toEqual(backup)
  })

  it('should return undefined when accessing property of null/undefined', () => {
    const obj = { user: null as null | { name: string } }
    const backup = structuredClone(obj)

    const result = setIn(obj).user.name('John')
    expect(result).toBeUndefined()
    expect(obj).toEqual(backup)
  })

  it('should handle concurrent calls', () => {
    const obj = createSimpleUser()
    const backup = structuredClone(obj)
    const mutable1 = structuredClone(obj)
    const mutable2 = structuredClone(obj)
    mutable1.name = 'Jane'
    mutable2.name = 'Bob'

    const result1 = setIn(obj).name('Jane')
    const result2 = setIn(obj).name('Bob')

    expect(result1).toEqual(mutable1)
    expect(result2).toEqual(mutable2)
    expect(obj).toEqual(backup)
  })

  it('should handle maps', () => {
    const obj = new Map([
      ['a', 1],
      ['b', 2],
    ])
    const backup = structuredClone(obj)
    const mutable = structuredClone(obj)
    mutable.set('a', 2)

    const result = setIn(obj)[key]('a')(2)

    expect(result).toEqual(mutable)
    expect(obj).toEqual(backup)
  })

  it('should handle nested maps', () => {
    const obj = new Map([['a', new Map([['b', 1]])]])
    const backup = structuredClone(obj)
    const mutable = structuredClone(obj)
    mutable.get('a')!.set('b', 2)

    const result = setIn(obj)[key]('a')[key]('b')(2)

    expect(result).toEqual(mutable)
    expect(obj).toEqual(backup)
  })

  it('should handle maps within objects', () => {
    const obj = { foo: new Map([['bar', 'baz']]) }
    const backup = structuredClone(obj)
    const mutable = structuredClone(obj)
    mutable.foo.set('bar', 'qux')

    const result = setIn(obj).foo[key]('bar')('qux')

    expect(result).toEqual(mutable)
    expect(obj).toEqual(backup)
  })

  it('should handle maps within arrays', () => {
    const obj = [{ bar: new Map([['foo', [] as string[]]]) }]
    const backup = structuredClone(obj)
    const mutable = structuredClone(obj)
    mutable[0].bar.set('foo', ['new item'])

    const result = setIn(obj)[0].bar[key]('foo')(['new item'])

    expect(result).toEqual(mutable)
    expect(obj).toEqual(backup)
  })

  it('should handle deep nested maps in objects', () => {
    const obj = {
      data: {
        users: new Map([['user1', { profile: new Map([['name', 'John']]) }]]),
      },
    }
    const backup = structuredClone(obj)
    const mutable = structuredClone(obj)
    mutable.data.users.get('user1')!.profile.set('name', 'Jane')

    const result = setIn(obj).data.users[key]('user1').profile[key]('name')(
      'Jane',
    )

    expect(result).toEqual(mutable)
    expect(obj).toEqual(backup)
  })

  it('should handle maps with complex nested structures', () => {
    const obj = {
      config: new Map([
        [
          'settings',
          new Map([
            [
              'features',
              new Map([['feature1', { enabled: true, options: ['a', 'b'] }]]),
            ],
          ]),
        ],
      ]),
    }
    const backup = structuredClone(obj)
    const mutable = structuredClone(obj)
    mutable.config
      .get('settings')!
      .get('features')!
      .set('feature1', { enabled: false, options: ['x', 'y'] })

    const result = setIn(obj)
      .config[key]('settings')
      [key]('features')
      [key]('feature1')({ enabled: false, options: ['x', 'y'] })

    expect(result).toEqual(mutable)
    expect(obj).toEqual(backup)
  })

  it('should handle maps within maps within arrays', () => {
    const obj = [
      {
        id: 1,
        data: new Map([['items', new Map([['item1', { value: 'old' }]])]]),
      },
    ]
    const backup = structuredClone(obj)
    const mutable = structuredClone(obj)
    mutable[0].data.get('items')!.set('item1', { value: 'new' })

    const result = setIn(obj)[0].data[key]('items')[key]('item1')({
      value: 'new',
    })

    expect(result).toEqual(mutable)
    expect(obj).toEqual(backup)
  })

  it('should work on optional properties', () => {
    const obj: { name: string; age?: number; buns?: string[] } = {
      name: 'John',
      buns: [],
    }
    const backup = structuredClone(obj)

    const result = setIn(obj).age(1)
    expect(result).toEqual({ name: 'John', age: 1, buns: [] })
    expect(obj).toEqual(backup)

    const result2 = setIn(obj).buns[0]('bacon')
    expect(result2).toEqual({ name: 'John', buns: ['bacon'] })
    expect(obj).toEqual(backup)
  })

  it('should return maybe undefined when setting a property inside a map', () => {
    const obj = new Map<string, { b: number }>()
    const result = setIn(obj)[key]('a').b(2)
    expect(result).toEqual(undefined)
  })
})
