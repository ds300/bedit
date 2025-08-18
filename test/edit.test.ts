import {
  describe,
  it,
  expect,
  createSimpleUser,
  createNestedUser,
  createUserArray,
  createDeepNested,
} from './test-utils'
import {
  edit,
  setIn,
  updateIn,
  editIn,
  addIn,
  deleteIn,
  setDevMode,
} from '../src/bedit.mjs'

setDevMode(true)

describe('edit', () => {
  it('should handle concurrent async operations without interference', async () => {
    const obj1 = { a: { value: 1 }, b: { value: 2 } }
    const obj2 = { x: { value: 10 }, y: { value: 20 } }

    // Start two async operations that complete in different orders
    const promise1 = edit(obj1, async (draft) => {
      await new Promise((resolve) => setTimeout(resolve, 20)) // Longer delay
      setIn(draft).a.value(100)
      setIn(draft).b.value(200)
    })

    const promise2 = edit(obj2, async (draft) => {
      await new Promise((resolve) => setTimeout(resolve, 5)) // Shorter delay - completes first
      setIn(draft).x.value(1000)
      setIn(draft).y.value(2000)
    })

    // Both should complete successfully despite out-of-order completion
    const [result1, result2] = await Promise.all([promise1, promise2])

    expect(result1).toEqual({ a: { value: 100 }, b: { value: 200 } })
    expect(result2).toEqual({ x: { value: 1000 }, y: { value: 2000 } })
  })

  it('should batch multiple set operations', () => {
    const obj = createSimpleUser()
    const backup = structuredClone(obj)
    const mutable = structuredClone(obj)
    mutable.name = 'Jane'
    mutable.age = 25

    const result = edit(obj, (draft) => {
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

    const result = edit(obj, (draft) => {
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

    const result = edit(obj, (draft) => {
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

    const result = edit(obj, (draft) => {
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

    const result = edit(obj, (draft) => {
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

    const result = edit(obj, (draft) => {
      editIn(draft).config((config) => {
        config.set('theme', { color: 'light' })
      })
      editIn(draft).config.key('debug')((config) => {
        config.enabled = true
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

    const result = edit(obj, (draft) => {
      setIn(draft).data.config.key('debug')({ color: 'light' })
      editIn(draft).data.tags((tags) => {
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

    const result = edit(obj, (draft) => {
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

    const result = edit(obj, (draft) => {
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

    const result = edit(obj, (obj) => {
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

    const result = edit(obj, (obj) => {
      // First modification - should clone
      setIn(obj).users[0].name('Johnny')
      usersRef = obj.users

      // Second modification - should reuse the same array
      setIn(obj).users[1].age(26)
      expect(obj.users).toBe(usersRef)

      // Third modification - should still reuse
      editIn(obj).users((users) => {
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

    const result = edit(obj, (draft) => {
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

    const result = edit(obj, (draft) => {
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

    const result = edit(obj, (draft) => {
      setIn(draft).a.foo('baz')
      let shallowA = draft.a
      expect(draft.a.b).toBe(obj.a.b)
      editIn(draft).a.b.c((c) => {
        c.d = 'new value'
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

    const result = edit(obj, (draft) => {
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

    const result = edit(obj, (draft) => {
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

    const result = edit(obj, (draft) => {
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

    const result = edit(obj, (draft) => {
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

    const result = edit(obj, (draft) => {
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

  // Async edit tests
  describe('async functionality', () => {
    const delay = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms))

    it('should handle simple async mutations', async () => {
      const obj = createSimpleUser()
      const backup = structuredClone(obj)

      let resolved = false
      const result = edit(obj, async (draft) => {
        await delay(1)
        draft.name = 'Jane'
        draft.age = 25
        resolved = true
      })

      // Should not have resolved synchronously
      expect(resolved).toBe(false)

      await delay(5) // Wait for async operation to complete

      expect(resolved).toBe(true)
      expect(await result).toEqual({ name: 'Jane', age: 25 })
      expect(obj).toEqual(backup) // Original unchanged
    })

    it('should handle async mutations with nested operations', async () => {
      const obj = createNestedUser()
      const backup = structuredClone(obj)

      let resolved = false
      const result = edit(obj, async (draft) => {
        await delay(1)
        setIn(draft).user.profile.name('Jane')
        setIn(draft).user.profile.age(25)
        resolved = true
      })

      expect(resolved).toBe(false)
      await delay(5)

      expect(resolved).toBe(true)
      expect(await result).toEqual({
        user: {
          profile: {
            name: 'Jane',
            age: 25,
          },
        },
      })
      expect(obj).toEqual(backup)
    })

    it('should handle async mutations with multiple await calls', async () => {
      const obj = createSimpleUser()
      const backup = structuredClone(obj)

      const mockApiCall1 = async () => {
        await delay(1)
        return 'Jane'
      }

      const mockApiCall2 = async () => {
        await delay(1)
        return 25
      }

      let resolved = false
      const result = edit(obj, async (draft) => {
        const name = await mockApiCall1()
        draft.name = name

        const age = await mockApiCall2()
        draft.age = age
        resolved = true
      })

      expect(resolved).toBe(false)
      await delay(10)

      expect(resolved).toBe(true)
      expect(await result).toEqual({ name: 'Jane', age: 25 })
      expect(obj).toEqual(backup)
    })

    it('should handle async mutations with Maps', async () => {
      const obj = {
        config: new Map([
          ['theme', 'dark'],
          ['debug', 'enabled'],
        ]),
      }
      const backup = structuredClone(obj)

      let resolved = false
      const result = edit(obj, async (draft) => {
        await delay(1)
        setIn(draft).config.key('theme')('light')
        setIn(draft).config.key('version')('1.0.0')
        resolved = true
      })

      expect(resolved).toBe(false)
      await delay(5)

      expect(resolved).toBe(true)
      expect(await result).toEqual({
        config: new Map([
          ['theme', 'light'],
          ['debug', 'enabled'],
          ['version', '1.0.0'],
        ]),
      })
      expect(obj).toEqual(backup)
    })

    it('should handle async mutations with Sets', async () => {
      const obj = { tags: new Set(['react', 'typescript']) }
      const backup = structuredClone(obj)

      let resolved = false
      const result = edit(obj, async (draft) => {
        await delay(1)
        addIn(draft).tags('nodejs')
        deleteIn(draft).tags('react')
        resolved = true
      })

      expect(resolved).toBe(false)
      await delay(5)

      expect(resolved).toBe(true)
      expect(await result).toEqual({
        tags: new Set(['typescript', 'nodejs']),
      })
      expect(obj).toEqual(backup)
    })

    it('should handle async mutations with arrays', async () => {
      const obj = createUserArray()
      const backup = structuredClone(obj)

      let resolved = false
      const result = await edit(obj, async (draft) => {
        await delay(1)
        addIn(draft).users({ name: 'Bob', age: 40 })
        setIn(draft).users[0].name('Johnny')
        resolved = true
      })

      expect(resolved).toBe(true)
      expect(result.users).toHaveLength(3)
      expect(result.users[0].name).toBe('Johnny')
      expect(result.users[2]).toEqual({ name: 'Bob', age: 40 })
      expect(obj).toEqual(backup)
    })

    it('should handle complex async operations with error handling', async () => {
      const obj = {
        data: null as { id: number; name: string } | null,
        loading: false,
        error: null as string | null,
      }
      const backup = structuredClone(obj)

      const mockApiCall = async (shouldFail: boolean) => {
        await delay(1)
        if (shouldFail) {
          throw new Error('API Error')
        }
        return { id: 1, name: 'John' }
      }

      let resolved = false
      const result = await edit(obj, async (draft) => {
        draft.loading = true

        try {
          const data = await mockApiCall(false)
          draft.data = data
          draft.error = null
        } catch (error) {
          draft.error = (error as Error).message
        } finally {
          draft.loading = false
          resolved = true
        }
      })

      expect(resolved).toBe(true)
      expect(result).toEqual({
        data: { id: 1, name: 'John' },
        loading: false,
        error: null,
      })
      expect(obj).toEqual(backup)
    })

    it('should handle async mutations returning values', async () => {
      const obj = createSimpleUser()
      const backup = structuredClone(obj)

      let resolved = false
      const result = edit(obj, async (_draft) => {
        await delay(1)
        resolved = true
        return { name: 'Jane', age: 25 }
      })

      expect(resolved).toBe(false)
      await result

      expect(resolved).toBe(true)
      expect(await result).toEqual({ name: 'Jane', age: 25 })
      expect(obj).toEqual(backup)
    })

    it('should handle nested async operations with bedit functions', async () => {
      const obj = {
        users: [{ id: 1, name: 'John', profile: { bio: 'Developer' } }],
        loading: false,
      }
      const backup = structuredClone(obj)

      const updateProfile = async (id: number) => {
        await delay(1)
        return `Updated bio for user ${id}`
      }

      let resolved = false
      const result = edit(obj, async (draft) => {
        setIn(draft).loading(true)

        const newBio = await updateProfile(draft.users[0].id)
        setIn(draft).users[0].profile.bio(newBio)
        updateIn(draft).users[0].name((name) => name.toUpperCase())

        setIn(draft).loading(false)
        resolved = true
      })

      expect(resolved).toBe(false)
      await result

      expect(resolved).toBe(true)
      expect(await result).toEqual({
        users: [
          { id: 1, name: 'JOHN', profile: { bio: 'Updated bio for user 1' } },
        ],
        loading: false,
      })
      expect(obj).toEqual(backup)
    })
  })
})
