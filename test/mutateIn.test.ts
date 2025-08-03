import {
  describe,
  it,
  expect,
  createSimpleUser,
  createNestedUser,
  createUserArray,
  createNestedArray,
} from './test-utils'
import { mutateIn } from '../bedit.mjs'

describe('mutateIn', () => {
  it('should mutate a top-level property with function that returns value', () => {
    const obj = createSimpleUser()
    const backup = structuredClone(obj)
    const mutable = structuredClone(obj)
    mutable.name = mutable.name.toUpperCase()

    const result = mutateIn(obj).name((name) => name.toUpperCase())

    expect(result).toEqual(mutable)
    expect(obj).toEqual(backup)
  })

  it('should mutate a top-level property with function that returns undefined', () => {
    const obj = createSimpleUser()
    const backup = structuredClone(obj)
    const mutable = structuredClone(obj)
    mutable.name = mutable.name.toUpperCase()

    const result = mutateIn(obj)((person) => {
      person.name = person.name.toUpperCase()
    })

    expect(result).toEqual(mutable)
    expect(obj).toEqual(backup)
  })

  it('should mutate a nested property with function', () => {
    const obj = createNestedUser()
    const backup = structuredClone(obj)
    const mutable = structuredClone(obj)
    mutable.user.profile.name = mutable.user.profile.name.toUpperCase()

    const result = mutateIn(obj).user.profile.name((name) => name.toUpperCase())

    expect(result).toEqual(mutable)
    expect(obj).toEqual(backup)
  })

  it('should use deep clone by default', () => {
    const obj = {
      user: {
        profile: {
          name: 'John',
          settings: {
            theme: 'dark',
          },
        },
      },
    }
    const backup = structuredClone(obj)
    const mutable = structuredClone(obj)
    mutable.user.profile.settings.theme =
      mutable.user.profile.settings.theme.toUpperCase()

    const result = mutateIn(obj).user.profile.settings((settings) => {
      settings.theme = settings.theme.toUpperCase()
    })

    // The nested object should be deeply cloned
    expect(result.user.profile.settings).not.toBe(obj.user.profile.settings)
    expect(result.user.profile).not.toBe(obj.user.profile)
    expect(result.user).not.toBe(obj.user)
    expect(result).toEqual(mutable)
    expect(obj).toEqual(backup)
  })

  it('should handle mutation that returns a new value', () => {
    const obj = createSimpleUser()
    const backup = structuredClone(obj)
    const mutable = structuredClone(obj)
    mutable.name = mutable.name.toUpperCase() + ' DOE'

    const result = mutateIn(obj).name((name) => name.toUpperCase() + ' DOE')

    expect(result).toEqual(mutable)
    expect(obj).toEqual(backup)
  })

  it('should handle mutation that returns undefined', () => {
    const obj = createSimpleUser()
    const backup = structuredClone(obj)
    const mutable = structuredClone(obj)
    mutable.name = mutable.name.toUpperCase()

    const result = mutateIn(obj)((person) => {
      person.name = person.name.toUpperCase()
      return undefined
    })

    expect(result).toEqual(mutable)
    expect(obj).toEqual(backup)
  })

  it('should handle mutation that returns null', () => {
    const obj = createSimpleUser()
    const backup = structuredClone(obj)
    const mutable = structuredClone(obj)
    mutable.name = null as any

    const result = mutateIn(obj).name(() => null as any)

    expect(result).toEqual(mutable)
    expect(obj).toEqual(backup)
  })

  it('should handle nested arrays', () => {
    const obj = createNestedArray()
    const backup = structuredClone(obj)
    const mutable = structuredClone(obj)
    mutable.data[0][1].value = mutable.data[0][1].value.toUpperCase()

    const result = mutateIn(obj).data[0][1]((item) => {
      item.value = item.value.toUpperCase()
    })

    expect(result).toEqual(mutable)
    expect(obj).toEqual(backup)
  })

  it('should handle complex object mutations', () => {
    const obj = {
      user: {
        profile: {
          name: 'John Doe',
          age: 30,
          hobbies: ['reading', 'gaming'],
        },
      },
    }
    const backup = structuredClone(obj)
    const mutable = structuredClone(obj)
    mutable.user.profile.name = mutable.user.profile.name.toUpperCase()
    mutable.user.profile.age += 1
    mutable.user.profile.hobbies.push('coding')

    const result = mutateIn(obj).user.profile((profile) => {
      profile.name = profile.name.toUpperCase()
      profile.age += 1
      profile.hobbies.push('coding')
    })

    expect(result).toEqual(mutable)
    expect(obj).toEqual(backup)
  })

  it('should throw error when accessing property of null/undefined', () => {
    const obj = { user: null }
    const backup = structuredClone(obj)

    expect(() => {
      // @ts-expect-error
      mutateIn(obj).user.name((name) => name.toUpperCase())
    }).toThrow('Cannot read property "name" of null')
    expect(obj).toEqual(backup)
  })

  it('should handle concurrent calls', () => {
    const obj = createSimpleUser()
    const backup = structuredClone(obj)
    const mutable1 = structuredClone(obj)
    const mutable2 = structuredClone(obj)
    mutable1.name = mutable1.name.toUpperCase()
    mutable2.name = mutable2.name.toLowerCase()

    const result1 = mutateIn(obj).name((name) => name.toUpperCase())
    const result2 = mutateIn(obj).name((name) => name.toLowerCase())

    expect(result1).toEqual(mutable1)
    expect(result2).toEqual(mutable2)
    expect(obj).toEqual(backup)
  })

  it('should handle mutation of array elements', () => {
    const obj = createUserArray()
    const backup = structuredClone(obj)
    const mutable = structuredClone(obj)
    mutable.users[0].name = mutable.users[0].name.toUpperCase()
    mutable.users[0].age += 5

    const result = mutateIn(obj).users[0]((user) => {
      user.name = user.name.toUpperCase()
      user.age += 5
    })

    expect(result).toEqual(mutable)
    expect(obj).toEqual(backup)
  })

  it('should handle mutation with return value overriding mutation', () => {
    const obj = createSimpleUser()
    const backup = structuredClone(obj)
    const mutable = structuredClone(obj)
    mutable.name = 'OVERRIDE'

    const result = mutateIn(obj).name((name) => {
      name = name.toUpperCase()
      return 'OVERRIDE'
    })

    expect(result).toEqual(mutable)
    expect(obj).toEqual(backup)
  })

  it('should handle maps with mutations', () => {
    const obj = { foo: new Map([['bar', 'baz']]) }
    const backup = structuredClone(obj)
    const mutable = structuredClone(obj)
    mutable.foo.set('bar', 'BAZ')

    const result = mutateIn(obj).foo.key('bar')((value) => value.toUpperCase())

    expect(result).toEqual(mutable)
    expect(obj).toEqual(backup)
  })

  it('should handle nested maps with mutations', () => {
    const obj = {
      data: new Map([
        ['users', new Map([['user1', { name: 'John', age: 30 }]])],
      ]),
    }
    const backup = structuredClone(obj)
    const mutable = structuredClone(obj)
    const user = mutable.data.get('users')!.get('user1')!
    user.name = user.name.toUpperCase()
    user.age += 5

    const result = mutateIn(obj).data.key('users').key('user1')((user) => {
      user.name = user.name.toUpperCase()
      user.age += 5
    })

    expect(result).toEqual(mutable)
    expect(obj).toEqual(backup)
  })

  it('should handle maps within arrays with mutations', () => {
    const obj = [{ bar: new Map([['foo', 'old value']]) }]
    const backup = structuredClone(obj)
    const mutable = structuredClone(obj)
    mutable[0].bar.set('foo', 'OLD VALUE')

    const result = mutateIn(obj)[0].bar.key('foo')((value) =>
      value.toUpperCase(),
    )

    expect(result).toEqual(mutable)
    expect(obj).toEqual(backup)
  })

  it('should handle complex map mutations', () => {
    const obj = {
      config: new Map([
        [
          'settings',
          new Map([
            [
              'features',
              new Map([
                ['feature1', { enabled: true, count: 1, items: ['a', 'b'] }],
              ]),
            ],
          ]),
        ],
      ]),
    }
    const backup = structuredClone(obj)
    const mutable = structuredClone(obj)
    const feature = mutable.config
      .get('settings')!
      .get('features')!
      .get('feature1')!
    feature.enabled = !feature.enabled
    feature.count *= 2
    feature.items.push('c')

    const result = mutateIn(obj)
      .config.key('settings')
      .key('features')
      .key('feature1')((feature) => {
      feature.enabled = !feature.enabled
      feature.count *= 2
      feature.items.push('c')
    })

    expect(result).toEqual(mutable)
    expect(obj).toEqual(backup)
  })

  it('should handle maps with mutation that returns value', () => {
    const obj = { foo: new Map([['bar', 'baz']]) }
    const backup = structuredClone(obj)
    const mutable = structuredClone(obj)
    mutable.foo.set('bar', 'OVERRIDE')

    const result = mutateIn(obj).foo.key('bar')((value) => {
      value = value.toUpperCase()
      return 'OVERRIDE'
    })

    expect(result).toEqual(mutable)
    expect(obj).toEqual(backup)
  })
})
