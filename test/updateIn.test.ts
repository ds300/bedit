import {
  describe,
  it,
  expect,
  createSimpleUser,
  createNestedUser,
  createNestedArray,
} from './test-utils'
import { fork, key } from '../src/patchfork.mjs'

describe('edit', () => {
  it('should update a top-level property with function', () => {
    const obj = createSimpleUser()
    const backup = structuredClone(obj)
    const mutable = structuredClone(obj)
    mutable.name = mutable.name.toUpperCase()

    const result = fork(obj).name((name) => name.toUpperCase())

    expect(result).toEqual(mutable)
    expect(obj).toEqual(backup)
  })

  it('should update a nested property with function', () => {
    const obj = createNestedUser()
    const backup = structuredClone(obj)
    const mutable = structuredClone(obj)
    mutable.user.profile.name = mutable.user.profile.name.toUpperCase()

    const result = fork(obj).user.profile.name((name) => name.toUpperCase())

    expect(result).toEqual(mutable)
    expect(obj).toEqual(backup)
  })

  it('should handle complex transformations', () => {
    const obj = {
      user: {
        profile: {
          name: 'John Doe',
          age: 30,
        },
      },
    }
    const backup = structuredClone(obj)
    const mutable = structuredClone(obj)
    const [firstName, lastName] = mutable.user.profile.name.split(' ')
    mutable.user.profile.name = `${lastName}, ${firstName}`

    const result = fork(obj).user.profile.name((name) => {
      const [firstName, lastName] = name.split(' ')
      return `${lastName}, ${firstName}`
    })

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

    const result = fork(obj).user.profile.settings.theme((theme) =>
      theme.toUpperCase(),
    )

    // The nested object should be deeply cloned
    expect(result.user.profile.settings).not.toBe(obj.user.profile.settings)
    expect(result.user.profile).not.toBe(obj.user.profile)
    expect(result.user).not.toBe(obj.user)
    expect(result).toEqual(mutable)
    expect(obj).toEqual(backup)
  })

  it('should handle function that returns undefined', () => {
    const obj = createSimpleUser()
    const backup = structuredClone(obj)
    const mutable = structuredClone(obj)
    mutable.name = undefined as any

    const result = fork(obj).name(() => undefined as any)

    expect(result).toEqual(mutable)
    expect(obj).toEqual(backup)
  })

  it('should handle function that returns null', () => {
    const obj = createSimpleUser()
    const backup = structuredClone(obj)
    const mutable = structuredClone(obj)
    mutable.name = null as any

    const result = fork(obj).name(() => null as any)

    expect(result).toEqual(mutable)
    expect(obj).toEqual(backup)
  })

  it('should handle nested arrays', () => {
    const obj = createNestedArray()
    const backup = structuredClone(obj)
    const mutable = structuredClone(obj)
    mutable.data[0][1].value = mutable.data[0][1].value.toUpperCase()

    const result = fork(obj).data[0][1].value((value) => value.toUpperCase())

    expect(result).toEqual(mutable)
    expect(obj).toEqual(backup)
  })

  it('should handle concurrent calls', () => {
    const obj = createSimpleUser()
    const backup = structuredClone(obj)
    const mutable1 = structuredClone(obj)
    const mutable2 = structuredClone(obj)
    mutable1.name = mutable1.name.toUpperCase()
    mutable2.name = mutable2.name.toLowerCase()

    const result1 = fork(obj).name((name) => name.toUpperCase())
    const result2 = fork(obj).name((name) => name.toLowerCase())

    expect(result1).toEqual(mutable1)
    expect(result2).toEqual(mutable2)
    expect(obj).toEqual(backup)
  })

  it('should handle nested calls', () => {
    const obj = createNestedUser()
    const backup = structuredClone(obj)
    const mutable = structuredClone(obj)
    mutable.user.profile.name = 'Jane'

    const result1 = fork(obj).user((user) => fork(user).profile.name('Jane'))

    expect(result1).toEqual(mutable)
    expect(obj).toEqual(backup)
  })

  it('should handle maps with update functions', () => {
    const obj = { foo: new Map([['bar', 'baz']]) }
    const backup = structuredClone(obj)
    const mutable = structuredClone(obj)
    mutable.foo.set('bar', 'BAZ')

    const result = fork(obj).foo[key]('bar')((value) => value.toUpperCase())

    expect(result).toEqual(mutable)
    expect(obj).toEqual(backup)
  })

  it('should handle nested maps with complex transformations', () => {
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

    const result = fork(obj).data[key]('users')[key]('user1')((user) => ({
      name: user.name.toUpperCase(),
      age: user.age + 5,
    }))

    expect(result).toEqual(mutable)
    expect(obj).toEqual(backup)
  })

  it('should handle maps within arrays with updates', () => {
    const obj = [{ bar: new Map([['foo', 'old value']]) }]
    const backup = structuredClone(obj)
    const mutable = structuredClone(obj)
    mutable[0].bar.set('foo', 'OLD VALUE')

    const result = fork(obj)[0].bar[key]('foo')((value) => value.toUpperCase())

    expect(result).toEqual(mutable)
    expect(obj).toEqual(backup)
  })

  it('should handle deep nested maps with transformations', () => {
    const obj = {
      config: new Map([
        [
          'settings',
          new Map([
            ['features', new Map([['feature1', { enabled: true, count: 1 }]])],
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

    const result = fork(obj)
      .config[key]('settings')
      [key]('features')
      [key]('feature1')((feature) => ({
      enabled: !feature.enabled,
      count: feature.count * 2,
    }))

    expect(result).toEqual(mutable)
    expect(obj).toEqual(backup)
  })

  it('should handle optional properties', () => {
    const obj: { name: string; age?: number } = { name: 'John' }
    const backup = structuredClone(obj)
    const mutable = structuredClone(obj)
    mutable.age = 1

    const result = fork(obj).age((age) => (age == null ? 0 : age + 1))
    expect(result).toEqual(undefined)
    expect(obj).toEqual(backup)
  })

  it('should handle nested optional objects', () => {
    const obj: { user?: { name: string; age?: number } } = {}

    fork(obj).user.age((age) => (age == null ? 0 : age + 1))
  })

  describe('Optional property edge cases', () => {
    it('should handle undefined exclusion in optional property updaters', () => {
      const obj: { name?: string } = {} // name is undefined
      let receivedValue: string | undefined

      const result = fork(obj).name((name) => {
        receivedValue = name
        expect(typeof name).toBe('string') // should never be undefined
        return name.toUpperCase()
      })

      expect(result).toBeUndefined() // operation should not execute
      expect(receivedValue).toBeUndefined() // updater should not be called
    })

    it('should pass null but not undefined to nullable property updaters', () => {
      const obj: { value?: string | null } = { value: null }
      let receivedValue: string | null | undefined

      fork(obj).value((value) => {
        receivedValue = value
        expect(value).toBe(null)
        expect(value).not.toBe(undefined)
        return 'updated'
      })

      expect(receivedValue).toBe(null)
    })

    it('should handle mixed nullable and undefined properties correctly', () => {
      const obj: { data?: string | null | undefined } = { data: null }
      let callCount = 0

      const result = fork(obj).data((data) => {
        callCount++
        expect(data).toBe(null) // should receive null, not undefined
        return 'updated'
      })

      expect(callCount).toBe(1)
      expect(result?.data).toBe('updated')
    })
  })

  describe('Nested optional chain runtime behavior', () => {
    it('should short-circuit on undefined parent object', () => {
      const obj: { user?: { profile: { name: string } } } = {}
      let updaterCalled = false

      const result = fork(obj).user.profile.name((name) => {
        updaterCalled = true
        return name.toUpperCase()
      })

      expect(result).toBeUndefined()
      expect(updaterCalled).toBe(false)
    })

    it('should handle deeply nested optional chains', () => {
      type DeepNested = {
        level1?: {
          level2?: {
            level3?: {
              value: string
            }
          }
        }
      }

      const obj: DeepNested = {}
      let updaterCalled = false

      const result = fork(obj).level1.level2.level3.value((value) => {
        updaterCalled = true
        return value.toUpperCase()
      })

      expect(result).toBeUndefined()
      expect(updaterCalled).toBe(false)
    })

    it('should work when intermediate objects exist', () => {
      const obj: { user?: { profile?: { name: string } } } = {
        user: { profile: { name: 'John' } },
      }

      const result = fork(obj).user.profile.name((name) => name.toUpperCase())

      expect(result?.user?.profile?.name).toBe('JOHN')
    })
  })

  describe('Map key access edge cases', () => {
    it('should handle non-existent Map keys gracefully', () => {
      const obj = { config: new Map<string, string>() }
      let updaterCalled = false

      const result = fork(obj).config[key]('nonexistent')((value) => {
        updaterCalled = true
        return value.toUpperCase()
      })

      expect(result).toBeUndefined()
      expect(updaterCalled).toBe(false)
    })

    it('should work with existing Map keys', () => {
      const obj = { config: new Map([['theme', 'dark']]) }

      const result = fork(obj).config[key]('theme')((value) =>
        value.toUpperCase(),
      )

      expect(result?.config.get('theme')).toBe('DARK')
    })

    it('should handle Map keys in optional contexts', () => {
      const obj: { config?: Map<string, string> } = {}

      const result = fork(obj).config[key]('theme')((value) =>
        value.toUpperCase(),
      )

      expect(result).toBeUndefined()
    })
  })
})
