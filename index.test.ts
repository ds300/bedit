import { describe, it, expect } from 'vitest'
import { setIn, updateIn, mutateIn, shallowMutateIn, batchEdits } from './index'

// Test data factories
const createSimpleUser = () => ({ name: 'John', age: 30 })
const createNestedUser = () => ({
  user: {
    profile: {
      name: 'John',
      age: 30,
    },
  },
})
const createUserArray = () => ({
  users: [
    { name: 'John', age: 30 },
    { name: 'Jane', age: 25 },
  ],
})
const createDeepNested = () => ({
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
})
const createNestedArray = () => ({
  data: [
    [
      { id: 1, value: 'a' },
      { id: 2, value: 'b' },
    ],
    [{ id: 3, value: 'c' }],
  ],
})

// Helper function to verify original object is unchanged
const expectOriginalUnchanged = (original: any, expected: any) => {
  expect(original).toEqual(expected)
}

// Helper function for common test pattern
const testImmutability = (
  fn: () => any,
  expectedResult: any,
  originalData: any,
  originalExpected: any,
) => {
  const result = fn()
  expect(result).toEqual(expectedResult)
  expectOriginalUnchanged(originalData, originalExpected)
}

// Helper function for error testing
const testErrorCase = (
  fn: () => any,
  errorMessage: string,
  originalData: any,
) => {
  expect(() => fn()).toThrow(errorMessage)
  expectOriginalUnchanged(originalData, originalData)
}

describe('setIn', () => {
  it('should set a top-level property', () => {
    const obj = createSimpleUser()
    testImmutability(
      () => setIn(obj).name('Jane'),
      { name: 'Jane', age: 30 },
      obj,
      createSimpleUser(),
    )
  })

  it('should set a nested property', () => {
    const obj = createNestedUser()
    testImmutability(
      () => setIn(obj).user.profile.name('Jane'),
      {
        user: {
          profile: {
            name: 'Jane',
            age: 30,
          },
        },
      },
      obj,
      createNestedUser(),
    )
  })

  it('should set array elements', () => {
    const obj = createUserArray()
    testImmutability(
      () => setIn(obj).users[0].name('Bob'),
      {
        users: [
          { name: 'Bob', age: 30 },
          { name: 'Jane', age: 25 },
        ],
      },
      obj,
      createUserArray(),
    )
  })

  it('should handle deep nested paths', () => {
    const obj = createDeepNested()
    const result = setIn(obj).a.b.c.d.e.f.g.h.i.j('new value')

    expect(result.a.b.c.d.e.f.g.h.i.j).toBe('new value')
    expectOriginalUnchanged(obj, createDeepNested())
  })

  it('should handle null/undefined values', () => {
    const obj = { name: 'John' }
    testImmutability(() => setIn(obj).name(null as any), { name: null }, obj, {
      name: 'John',
    })
  })

  it('should throw error when accessing property of null/undefined', () => {
    const obj = { user: null }
    testErrorCase(
      () => {
        // @ts-expect-error
        setIn(obj).user.name('John')
      },
      'Cannot read property "name" of null',
      obj,
    )
  })

  it('should handle concurrent calls', () => {
    const obj = createSimpleUser()
    const result1 = setIn(obj).name('Jane')
    const result2 = setIn(obj).name('Bob')

    expect(result1).toEqual({ name: 'Jane', age: 30 })
    expect(result2).toEqual({ name: 'Bob', age: 30 })
    expectOriginalUnchanged(obj, createSimpleUser())
  })
})

describe('updateIn', () => {
  it('should update a top-level property with function', () => {
    const obj = createSimpleUser()
    testImmutability(
      () => updateIn(obj).name((name) => name.toUpperCase()),
      { name: 'JOHN', age: 30 },
      obj,
      createSimpleUser(),
    )
  })

  it('should update a nested property with function', () => {
    const obj = createNestedUser()
    testImmutability(
      () => updateIn(obj).user.profile.name((name) => name.toUpperCase()),
      {
        user: {
          profile: {
            name: 'JOHN',
            age: 30,
          },
        },
      },
      obj,
      createNestedUser(),
    )
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
    testImmutability(
      () =>
        updateIn(obj).user.profile.name((name) => {
          const [firstName, lastName] = name.split(' ')
          return `${lastName}, ${firstName}`
        }),
      {
        user: {
          profile: {
            name: 'Doe, John',
            age: 30,
          },
        },
      },
      obj,
      {
        user: {
          profile: {
            name: 'John Doe',
            age: 30,
          },
        },
      },
    )
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
    const result = updateIn(obj).user.profile.settings.theme((theme) =>
      theme.toUpperCase(),
    )

    // The nested object should be deeply cloned
    expect(result.user.profile.settings).not.toBe(obj.user.profile.settings)
    expect(result.user.profile).not.toBe(obj.user.profile)
    expect(result.user).not.toBe(obj.user)
    expectOriginalUnchanged(obj, {
      user: {
        profile: {
          name: 'John',
          settings: {
            theme: 'dark',
          },
        },
      },
    })
  })

  it('should handle function that returns undefined', () => {
    const obj = createSimpleUser()
    testImmutability(
      () => updateIn(obj).name(() => undefined as any),
      { name: undefined, age: 30 },
      obj,
      createSimpleUser(),
    )
  })

  it('should handle function that returns null', () => {
    const obj = createSimpleUser()
    testImmutability(
      () => updateIn(obj).name(() => null as any),
      { name: null, age: 30 },
      obj,
      createSimpleUser(),
    )
  })

  it('should handle nested arrays', () => {
    const obj = createNestedArray()
    const result = updateIn(obj).data[0][1].value((value) =>
      value.toUpperCase(),
    )

    expect(result.data[0][1].value).toBe('B')
    expectOriginalUnchanged(obj, createNestedArray())
  })

  it('should throw error when accessing property of null/undefined', () => {
    const obj = { user: null }
    testErrorCase(
      () => {
        // @ts-expect-error
        updateIn(obj).user.name((name) => name.toUpperCase())
      },
      'Cannot read property "name" of null',
      obj,
    )
  })

  it('should handle concurrent calls', () => {
    const obj = createSimpleUser()
    const result1 = updateIn(obj).name((name) => name.toUpperCase())
    const result2 = updateIn(obj).name((name) => name.toLowerCase())

    expect(result1).toEqual({ name: 'JOHN', age: 30 })
    expect(result2).toEqual({ name: 'john', age: 30 })
    expectOriginalUnchanged(obj, createSimpleUser())
  })

  it('should handle nested calls', () => {
    const obj = createNestedUser()
    const result1 = updateIn(obj).user((user) =>
      setIn(user).profile.name('Jane'),
    )

    expect(result1.user.profile.name).toBe('Jane')
    expectOriginalUnchanged(obj, createNestedUser())
  })
})

describe('mutateIn', () => {
  it('should mutate a top-level property with function that returns value', () => {
    const obj = createSimpleUser()
    testImmutability(
      () => mutateIn(obj).name((name) => name.toUpperCase()),
      { name: 'JOHN', age: 30 },
      obj,
      createSimpleUser(),
    )
  })

  it('should mutate a top-level property with function that returns undefined', () => {
    const obj = createSimpleUser()
    testImmutability(
      () =>
        mutateIn(obj)((person) => {
          person.name = person.name.toUpperCase()
        }),
      { name: 'JOHN', age: 30 },
      obj,
      createSimpleUser(),
    )
  })

  it('should mutate a nested property with function', () => {
    const obj = createNestedUser()
    testImmutability(
      () => mutateIn(obj).user.profile.name((name) => name.toUpperCase()),
      {
        user: {
          profile: {
            name: 'JOHN',
            age: 30,
          },
        },
      },
      obj,
      createNestedUser(),
    )
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
    const result = mutateIn(obj).user.profile.settings((settings) => {
      settings.theme = settings.theme.toUpperCase()
    })

    // The nested object should be deeply cloned
    expect(result.user.profile.settings).not.toBe(obj.user.profile.settings)
    expect(result.user.profile).not.toBe(obj.user.profile)
    expect(result.user).not.toBe(obj.user)
    expect(result.user.profile.settings.theme).toBe('DARK')
    expectOriginalUnchanged(obj, {
      user: {
        profile: {
          name: 'John',
          settings: {
            theme: 'dark',
          },
        },
      },
    })
  })

  it('should handle mutation that returns a new value', () => {
    const obj = createSimpleUser()
    testImmutability(
      () => mutateIn(obj).name((name) => name.toUpperCase() + ' DOE'),
      { name: 'JOHN DOE', age: 30 },
      obj,
      createSimpleUser(),
    )
  })

  it('should handle mutation that returns undefined', () => {
    const obj = createSimpleUser()
    testImmutability(
      () =>
        mutateIn(obj)((person) => {
          person.name = person.name.toUpperCase()
          return undefined
        }),
      { name: 'JOHN', age: 30 },
      obj,
      createSimpleUser(),
    )
  })

  it('should handle mutation that returns null', () => {
    const obj = createSimpleUser()
    testImmutability(
      () => mutateIn(obj).name(() => null as any),
      { name: null, age: 30 },
      obj,
      createSimpleUser(),
    )
  })

  it('should handle nested arrays', () => {
    const obj = createNestedArray()
    const result = mutateIn(obj).data[0][1]((item) => {
      item.value = item.value.toUpperCase()
    })

    expect(result.data[0][1].value).toBe('B')
    expectOriginalUnchanged(obj, createNestedArray())
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
    testImmutability(
      () =>
        mutateIn(obj).user.profile((profile) => {
          profile.name = profile.name.toUpperCase()
          profile.age += 1
          profile.hobbies.push('coding')
        }),
      {
        user: {
          profile: {
            name: 'JOHN DOE',
            age: 31,
            hobbies: ['reading', 'gaming', 'coding'],
          },
        },
      },
      obj,
      {
        user: {
          profile: {
            name: 'John Doe',
            age: 30,
            hobbies: ['reading', 'gaming'],
          },
        },
      },
    )
  })

  it('should throw error when accessing property of null/undefined', () => {
    const obj = { user: null }
    testErrorCase(
      () => {
        // @ts-expect-error
        mutateIn(obj).user.name((name) => name.toUpperCase())
      },
      'Cannot read property "name" of null',
      obj,
    )
  })

  it('should handle concurrent calls', () => {
    const obj = createSimpleUser()
    const result1 = mutateIn(obj).name((name) => name.toUpperCase())
    const result2 = mutateIn(obj).name((name) => name.toLowerCase())

    expect(result1).toEqual({ name: 'JOHN', age: 30 })
    expect(result2).toEqual({ name: 'john', age: 30 })
    expectOriginalUnchanged(obj, createSimpleUser())
  })

  it('should handle mutation of array elements', () => {
    const obj = createUserArray()
    testImmutability(
      () =>
        mutateIn(obj).users[0]((user) => {
          user.name = user.name.toUpperCase()
          user.age += 5
        }),
      {
        users: [
          { name: 'JOHN', age: 35 },
          { name: 'Jane', age: 25 },
        ],
      },
      obj,
      createUserArray(),
    )
  })

  it('should handle mutation with return value overriding mutation', () => {
    const obj = createSimpleUser()
    testImmutability(
      () =>
        mutateIn(obj).name((name) => {
          name = name.toUpperCase()
          return 'OVERRIDE'
        }),
      { name: 'OVERRIDE', age: 30 },
      obj,
      createSimpleUser(),
    )
  })
})

describe('batch', () => {
  it('should batch multiple set operations', () => {
    const obj = createSimpleUser()
    testImmutability(
      () =>
        batchEdits(obj, (draft) => {
          draft.name = 'Jane'
          draft.age = 25
        }),
      { name: 'Jane', age: 25 },
      obj,
      createSimpleUser(),
    )
  })

  it('should batch mixed operations', () => {
    const obj = createUserArray()
    testImmutability(
      () =>
        batchEdits(obj, (draft) => {
          setIn(draft).users[0].name('Johnny')
          setIn(draft).users(draft.users.filter((u) => u.age > 25))
          updateIn(draft).users[0].age((age) => age + 5)
        }),
      {
        users: [{ name: 'Johnny', age: 35 }],
      },
      obj,
      createUserArray(),
    )
  })

  it('should handle nested batch operations', () => {
    const obj = createNestedUser()
    testImmutability(
      () =>
        batchEdits(obj, (draft) => {
          setIn(draft).user.profile.name('Jane')
          setIn(draft).user.profile.age(25)
          updateIn(draft).user.profile.age((age) => age + 5)
        }),
      {
        user: {
          profile: {
            name: 'Jane',
            age: 30,
          },
        },
      },
      obj,
      createNestedUser(),
    )
  })

  it('should handle array operations in batch', () => {
    const obj = createUserArray()
    testImmutability(
      () =>
        batchEdits(obj, (draft) => {
          setIn(draft).users[0].name('Johnny')
          setIn(draft).users[1].age(26)
          updateIn(draft).users((users) => [...users, { name: 'Bob', age: 40 }])
        }),
      {
        users: [
          { name: 'Johnny', age: 30 },
          { name: 'Jane', age: 26 },
          { name: 'Bob', age: 40 },
        ],
      },
      obj,
      createUserArray(),
    )
  })

  it('should handle deep nested operations in batch', () => {
    const obj = createDeepNested()
    testImmutability(
      () =>
        batchEdits(obj, (draft) => {
          setIn(draft).a.b.c.d.e.f.g.h.i.j('new value')
          ;(setIn(draft).a.b.c.d.e.f.g.h.i as any).k('another value')
        }),
      {
        a: {
          b: {
            c: {
              d: {
                e: {
                  f: {
                    g: {
                      h: {
                        i: {
                          j: 'new value',
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
      },
      obj,
      createDeepNested(),
    )
  })

  it('should handle empty batch operations', () => {
    const obj = createSimpleUser()
    testImmutability(
      () =>
        batchEdits(obj, (draft) => {
          // No operations
        }),
      { name: 'John', age: 30 },
      obj,
      createSimpleUser(),
    )
  })

  it('should handle batch with direct mutations', () => {
    const obj = createUserArray()
    testImmutability(
      () =>
        batchEdits(obj, (draft) => {
          updateIn(draft).users((users) => [...users, { name: 'Bob', age: 40 }])
          ;(setIn(draft) as any).filter('all')
        }),
      {
        users: [
          { name: 'John', age: 30 },
          { name: 'Jane', age: 25 },
          { name: 'Bob', age: 40 },
        ],
        filter: 'all',
      },
      obj,
      createUserArray(),
    )
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

    const result = batchEdits(obj, (obj) => {
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

    const result = batchEdits(obj, (obj) => {
      // First modification - should clone
      setIn(obj).users[0].name('Johnny')
      usersRef = obj.users

      // Second modification - should reuse the same array
      setIn(obj).users[1].age(26)
      expect(obj.users).toBe(usersRef)

      // Third modification - should still reuse
      shallowMutateIn(obj).users((users) => {
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

    const result = batchEdits(obj, (draft) => {
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

    const result = batchEdits(obj, (draft) => {
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

    const result = batchEdits(obj, (draft) => {
      setIn(draft).a.foo('baz')
      let shallowA = draft.a
      expect(draft.a.b).toBe(obj.a.b)
      mutateIn(draft).a((a) => {
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
})

describe('edge cases', () => {
  it('should handle empty objects', () => {
    const obj: Record<string, any> = {}
    testImmutability(
      () => setIn(obj).newProp('value'),
      { newProp: 'value' },
      obj,
      {},
    )
  })

  it('should handle empty arrays', () => {
    const obj = { items: [] as string[] }
    testImmutability(
      () => setIn(obj).items[0]('first item'),
      { items: ['first item'] },
      obj,
      { items: [] },
    )
  })

  it('should handle undefined values in path', () => {
    const obj = { user: { profile: undefined } }
    testErrorCase(
      () => {
        // @ts-expect-error
        setIn(obj).user.profile.name('John')
      },
      'Cannot read property "name" of undefined',
      obj,
    )
  })

  it('should handle non-object values in path', () => {
    const obj = { user: 'not an object' }
    testErrorCase(
      () => {
        // @ts-expect-error
        setIn(obj).user.name('John')
      },
      'Cannot read property "name" of string',
      obj,
    )
  })
})
