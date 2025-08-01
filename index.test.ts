import { describe, it, expect } from 'vitest'
import { setIn, updateIn, mutateIn } from './index'

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

  it('should use shallow clone when shallow option is true', () => {
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
    const result = mutateIn(obj, { shallow: true }).user.profile.settings(
      (settings) => {
        settings.theme = settings.theme.toUpperCase()
      },
    )

    // Only the immediate parent should be cloned
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

  it('should handle arrays with shallow cloning', () => {
    const obj = createUserArray()
    const result = mutateIn(obj, { shallow: true }).users[0]((person) => {
      person.name = person.name.toUpperCase()
    })

    expect(result.users[0].name).toBe('JOHN')
    expect(result.users).not.toBe(obj.users)
    expectOriginalUnchanged(obj, createUserArray())
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
