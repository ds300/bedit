import {
  describe,
  it,
  expect,
  createSimpleUser,
  createNestedUser,
  createUserArray,
  createDeepNested,
} from './test-utils'
import { mutate, setIn, updateIn, mutateIn, deepMutateIn } from '../bedit.mts'

describe('mutate', () => {
  it('should batch multiple set operations', () => {
    const obj = createSimpleUser()
    const backup = structuredClone(obj)
    const mutable = structuredClone(obj)
    mutable.name = 'Jane'
    mutable.age = 25

    const result = mutate(obj, (draft) => {
      draft.name = 'Jane'
      draft.age = 25
    })

    expect(result).toEqual(mutable)
    expect(obj).toEqual(backup)
  })

  it('should batch mixed operations', () => {
    const obj = createUserArray()
    const backup = structuredClone(obj)
    const mutable = structuredClone(obj)
    mutable.users[0].name = 'Johnny'
    mutable.users = mutable.users.filter((u) => u.age > 25)
    mutable.users[0].age += 5

    const result = mutate(obj, (draft) => {
      setIn(draft).users[0].name('Johnny')
      setIn(draft).users(draft.users.filter((u) => u.age > 25))
      updateIn(draft).users[0].age((age) => age + 5)
    })

    expect(result).toEqual(mutable)
    expect(obj).toEqual(backup)
  })

  it('should handle nested batch operations', () => {
    const obj = createNestedUser()
    const backup = structuredClone(obj)
    const mutable = structuredClone(obj)
    mutable.user.profile.name = 'Jane'
    mutable.user.profile.age = 25
    mutable.user.profile.age += 5

    const result = mutate(obj, (draft) => {
      setIn(draft).user.profile.name('Jane')
      setIn(draft).user.profile.age(25)
      updateIn(draft).user.profile.age((age) => age + 5)
    })

    expect(result).toEqual(mutable)
    expect(obj).toEqual(backup)
  })

  it('should handle array operations in batch', () => {
    const obj = createUserArray()
    const backup = structuredClone(obj)
    const mutable = structuredClone(obj)
    mutable.users[0].name = 'Johnny'
    mutable.users[1].age = 26
    mutable.users.push({ name: 'Bob', age: 40 })

    const result = mutate(obj, (draft) => {
      setIn(draft).users[0].name('Johnny')
      setIn(draft).users[1].age(26)
      updateIn(draft).users((users) => [...users, { name: 'Bob', age: 40 }])
    })

    expect(result).toEqual(mutable)
    expect(obj).toEqual(backup)
  })

  it('should handle deep nested operations in batch', () => {
    const obj = createDeepNested()
    const backup = structuredClone(obj)
    const mutable = structuredClone(obj)
    mutable.a.b.c.d.e.f.g.h.i.j = 'new value'
    ;(mutable.a.b.c.d.e.f.g.h.i as any).k = 'another value'

    const result = mutate(obj, (draft) => {
      setIn(draft).a.b.c.d.e.f.g.h.i.j('new value')
      ;(setIn(draft).a.b.c.d.e.f.g.h.i as any).k('another value')
    })

    expect(result).toEqual(mutable)
    expect(obj).toEqual(backup)
  })

  it('should properly clone Map values during batch operations', () => {
    const obj = {
      config: new Map<string, { color?: string; enabled?: boolean }>([
        ['theme', { color: 'dark' }],
        ['debug', { enabled: false }],
      ]),
    }
    const backup = structuredClone(obj)
    const mutable = structuredClone(obj)
    mutable.config.set('theme', { color: 'light' })
    mutable.config.get('debug')!.enabled = true

    const result = mutate(obj, (draft) => {
      mutateIn(draft).config((config) => {
        config.set('theme', { color: 'light' })
      })
      deepMutateIn(draft).config((config) => {
        config.get('debug')!.enabled = true
      })
    })

    expect(result).toEqual(mutable)
    expect(obj).toEqual(backup)

    // Verify that the original Map is unchanged
    expect(obj.config.get('theme')).toEqual({ color: 'dark' })
    expect(obj.config.has('version')).toBe(false)
    expect(obj.config.get('debug')).toEqual({ enabled: false })

    // Verify that the result Map has the expected values
    expect(result.config.get('theme')).toEqual({ color: 'light' })
    expect(result.config.get('debug')).toEqual({ enabled: true })
  })

  it('should handle nested Map and Set operations in batch', () => {
    const obj = {
      data: {
        config: new Map([['theme', { color: 'dark' }]]),
        tags: new Set(['react']),
      },
    }
    const backup = structuredClone(obj)
    const mutable = structuredClone(obj)
    mutable.data.config.set('debug', { color: 'light' })
    mutable.data.tags.add('typescript')

    const result = mutate(obj, (draft) => {
      setIn(draft).data.config.key('debug')({ color: 'light' })
      mutateIn(draft).data.tags((tags) => {
        tags.add('typescript')
      })
    })

    expect(result).toEqual(mutable)
    expect(obj).toEqual(backup)

    // Verify original is unchanged
    expect(obj.data.config.has('debug')).toBe(false)
    expect(obj.data.tags.has('typescript')).toBe(false)

    // Verify result has expected values
    expect(result.data.config.get('debug')).toEqual({ color: 'light' })
    expect(result.data.tags.has('typescript')).toBe(true)
  })

  it('should handle empty batch operations', () => {
    const obj = createSimpleUser()
    const backup = structuredClone(obj)
    const mutable = structuredClone(obj)

    const result = mutate(obj, (draft) => {
      // No operations
    })

    expect(result).toEqual(mutable)
    expect(obj).toEqual(backup)
  })

  it('should handle batch with direct mutations', () => {
    const obj = createUserArray()
    const backup = structuredClone(obj)
    const mutable = structuredClone(obj)
    mutable.users.push({ name: 'Bob', age: 40 })
    ;(mutable as any).filter = 'all'

    const result = mutate(obj, (draft) => {
      updateIn(draft).users((users) => [...users, { name: 'Bob', age: 40 }])
      ;(setIn(draft) as any).filter('all')
    })

    expect(result).toEqual(mutable)
    expect(obj).toEqual(backup)
  })

  it('should maintain object identity for multiple modifications to the same object', () => {
    const obj = {
      user: {
        profile: {
          name: 'John',
          age: 30,
        },
        settings: {
          theme: 'dark',
        },
      },
    }

    let profileRef: any = null
    let settingsRef: any = null

    const result = mutate(obj, (obj) => {
      // First modification - should clone
      setIn(obj).user.profile.name('Jane')
      profileRef = obj.user.profile

      // Second modification - should reuse the same object
      setIn(obj).user.profile.age(25)
      expect(obj.user.profile).toBe(profileRef)

      // Third modification - should still reuse
      setIn(obj).user.profile.age(26)
      expect(obj.user.profile).toBe(profileRef)

      // Modify a different nested object
      setIn(obj).user.settings.theme('light')
      settingsRef = obj.user.settings

      // Modify it again - should reuse
      setIn(obj).user.settings.theme('auto')
      expect(obj.user.settings).toBe(settingsRef)

      // Modify the first object again - should still reuse
      setIn(obj).user.profile.name('Johnny')
      expect(obj.user.profile).toBe(profileRef)
    })

    expect(result).toEqual({
      user: {
        profile: {
          name: 'Johnny',
          age: 26,
        },
        settings: {
          theme: 'auto',
        },
      },
    })
  })

  it('should maintain array identity for multiple modifications to the same array', () => {
    const obj = {
      users: [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 },
      ],
    }

    let usersRef: any = null

    const result = mutate(obj, (obj) => {
      // First modification - should clone
      setIn(obj).users[0].name('Johnny')
      usersRef = obj.users

      // Second modification - should reuse the same array
      setIn(obj).users[1].age(26)
      expect(obj.users).toBe(usersRef)

      // Third modification - should still reuse
      mutateIn(obj).users((users) => {
        users.push({ name: 'Bob', age: 40 })
      })
      expect(obj.users).toBe(usersRef)

      // Fourth modification - should still reuse
      setIn(obj).users[0].age(35)
      expect(obj.users).toBe(usersRef)
    })

    expect(result).toEqual({
      users: [
        { name: 'Johnny', age: 35 },
        { name: 'Jane', age: 26 },
        { name: 'Bob', age: 40 },
      ],
    })
  })

  it('should maintain identity across different operation types on the same object', () => {
    const obj = {
      user: {
        profile: {
          name: 'John',
          age: 30,
        },
      },
    }

    let profileRef: any = null

    const result = mutate(obj, (draft) => {
      // Direct mutation first
      setIn(draft).user.profile.name('Jane')
      profileRef = draft.user.profile

      // Direct mutation - should reuse
      setIn(draft).user.profile.age(25)
      expect(draft.user.profile).toBe(profileRef)

      // Direct mutation again - should reuse
      setIn(draft).user.profile.age(26)
      expect(draft.user.profile).toBe(profileRef)

      // Direct mutation again - should reuse
      setIn(draft).user.profile.age(27)
      expect(draft.user.profile).toBe(profileRef)
    })

    expect(result).toEqual({
      user: {
        profile: {
          name: 'Jane',
          age: 27,
        },
      },
    })
  })

  it('should maintain identity for deeply nested objects', () => {
    const obj = {
      a: {
        b: {
          c: {
            d: {
              e: {
                f: {
                  g: {
                    h: {
                      i: {
                        j: 'value',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    }

    let deepRef: any = null

    const result = mutate(obj, (draft) => {
      // First modification - should clone the path
      setIn(draft).a.b.c.d.e.f.g.h.i.j('new value')
      deepRef = draft.a.b.c.d.e.f.g.h.i

      // Second modification - should reuse the same object
      ;(setIn(draft).a.b.c.d.e.f.g.h.i as any).k('another value')
      expect(draft.a.b.c.d.e.f.g.h.i).toBe(deepRef)

      // Third modification - should still reuse
      setIn(draft).a.b.c.d.e.f.g.h.i.j('final value')
      expect(draft.a.b.c.d.e.f.g.h.i).toBe(deepRef)
    })

    expect(result).toEqual({
      a: {
        b: {
          c: {
            d: {
              e: {
                f: {
                  g: {
                    h: {
                      i: {
                        j: 'final value',
                        k: 'another value',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })
  })

  it('should deeply clone an object that was previously shallowly cloned', () => {
    const obj = {
      a: {
        b: {
          c: {
            d: 'value',
          },
        },
        foo: 'bar',
      },
    }

    const result = mutate(obj, (draft) => {
      setIn(draft).a.foo('baz')
      let shallowA = draft.a
      expect(draft.a.b).toBe(obj.a.b)
      deepMutateIn(draft).a((a) => {
        a.b.c.d = 'new value'
      })
      // a should not have been recloned
      expect(draft.a).toBe(shallowA)
      // b should have been cloned
      expect(draft.a.b).not.toBe(obj.a.b)
      // obj should not have been changed
      expect(obj).toEqual({
        a: {
          b: {
            c: {
              d: 'value',
            },
          },
          foo: 'bar',
        },
      })
      expect(draft.a.b.c.d).toBe('new value')
    })

    expect(result).toEqual({
      a: {
        b: {
          c: {
            d: 'new value',
          },
        },
        foo: 'baz',
      },
    })
  })

  it('should handle batch operations with maps', () => {
    const obj = { foo: new Map([['bar', 'baz']]) }
    const backup = structuredClone(obj)
    const mutable = structuredClone(obj)
    mutable.foo.set('bar', 'qux')
    mutable.foo.set('new', 'value')

    const result = mutate(obj, (draft) => {
      setIn(draft).foo.key('bar')('qux')
      setIn(draft).foo.key('new')('value')
    })

    expect(result).toEqual(mutable)
    expect(obj).toEqual(backup)
  })

  it('should handle batch operations with nested maps', () => {
    const obj = {
      data: new Map([
        ['users', new Map([['user1', { name: 'John', age: 30 }]])],
      ]),
    }
    const backup = structuredClone(obj)
    const mutable = structuredClone(obj)
    const user = mutable.data.get('users')!.get('user1')!
    user.name = 'Jane'
    user.age = 25
    mutable.data.get('users')!.set('user2', { name: 'Bob', age: 35 })

    const result = mutate(obj, (draft) => {
      setIn(draft).data.key('users').key('user1').name('Jane')
      setIn(draft).data.key('users').key('user1').age(25)
      setIn(draft).data.key('users').key('user2')({ name: 'Bob', age: 35 })
    })

    expect(result).toEqual(mutable)
    expect(obj).toEqual(backup)
  })

  it('should handle batch operations with maps within arrays', () => {
    const obj = [{ bar: new Map([['foo', 'old']]) }]
    const backup = structuredClone(obj)
    const mutable = structuredClone(obj)
    mutable[0].bar.set('foo', 'new')
    mutable[0].bar.set('extra', 'value')

    const result = mutate(obj, (draft) => {
      setIn(draft)[0].bar.key('foo')('new')
      setIn(draft)[0].bar.key('extra')('value')
    })

    expect(result).toEqual(mutable)
    expect(obj).toEqual(backup)
  })

  it('should handle complex batch operations with deep nested maps', () => {
    const obj = {
      config: new Map([
        [
          'settings',
          new Map<string, Map<string, { enabled: boolean; count: number }>>([
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
    feature.enabled = false
    feature.count = 2
    mutable.config
      .get('settings')!
      .get('features')!
      .set('feature2', { enabled: true, count: 1 })

    const result = mutate(obj, (draft) => {
      setIn(draft)
        .config.key('settings')
        .key('features')
        .key('feature1')
        .enabled(false)
      setIn(draft)
        .config.key('settings')
        .key('features')
        .key('feature1')
        .count(2)
      setIn(draft).config.key('settings').key('features').key('feature2')({
        enabled: true,
        count: 1,
      })
    })

    expect(result).toEqual(mutable)
    expect(obj).toEqual(backup)
  })

  it('should maintain map identity in batch operations', () => {
    const obj = { foo: new Map([['bar', 'baz']]) }
    const backup = structuredClone(obj)

    let mapRef: any = null

    const result = mutate(obj, (draft) => {
      // First modification - should clone
      setIn(draft).foo.key('bar')('qux')
      mapRef = draft.foo

      // Second modification - should reuse the same map
      setIn(draft).foo.key('new')('value')
      expect(draft.foo).toBe(mapRef)

      // Third modification - should still reuse
      setIn(draft).foo.key('another')('item')
      expect(draft.foo).toBe(mapRef)
    })

    expect(result).toEqual({
      foo: new Map([
        ['bar', 'qux'],
        ['new', 'value'],
        ['another', 'item'],
      ]),
    })
    expect(obj).toEqual(backup)
  })
})
