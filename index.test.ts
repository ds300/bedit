import { describe, it, expect } from 'vitest'
import { setIn, updateIn } from './index'

describe('setIn', () => {
  it('should set a top-level property', () => {
    const obj = { name: 'John', age: 30 }
    const result = setIn(obj).name('Jane')

    expect(result).toEqual({ name: 'Jane', age: 30 })
    expect(obj).toEqual({ name: 'John', age: 30 }) // original unchanged
  })

  it('should set a nested property', () => {
    const obj = {
      user: {
        profile: {
          name: 'John',
          age: 30,
        },
      },
    }
    const result = setIn(obj).user.profile.name('Jane')

    expect(result).toEqual({
      user: {
        profile: {
          name: 'Jane',
          age: 30,
        },
      },
    })
    expect(obj).toEqual({
      user: {
        profile: {
          name: 'John',
          age: 30,
        },
      },
    }) // original unchanged
  })

  it('should set array elements', () => {
    const obj = {
      users: [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 },
      ],
    }
    const result = setIn(obj).users[0].name('Bob')

    expect(result).toEqual({
      users: [
        { name: 'Bob', age: 30 },
        { name: 'Jane', age: 25 },
      ],
    })
    expect(obj).toEqual({
      users: [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 },
      ],
    }) // original unchanged
  })

  it('should handle deep nested paths', () => {
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
    const result = setIn(obj).a.b.c.d.e.f.g.h.i.j('new value')

    expect(result.a.b.c.d.e.f.g.h.i.j).toBe('new value')
    expect(obj.a.b.c.d.e.f.g.h.i.j).toBe('value') // original unchanged
  })

  it('should handle null/undefined values', () => {
    const obj = { name: 'John' }
    // @ts-expect-error
    const result = setIn(obj).name(null)

    expect(result).toEqual({ name: null })
    expect(obj).toEqual({ name: 'John' }) // original unchanged
  })

  it('should throw error when accessing property of null/undefined', () => {
    const obj = { user: null }

    expect(() => {
      // @ts-expect-error
      setIn(obj).user.name('John')
    }).toThrow('Cannot read property "name" of null')
    expect(obj).toEqual({ user: null }) // original unchanged
  })

  it('should handle concurrent calls', () => {
    const obj = { name: 'John' }

    // This should work fine since they're not actually concurrent
    const result1 = setIn(obj).name('Jane')
    const result2 = setIn(obj).name('Bob')

    expect(result1).toEqual({ name: 'Jane' })
    expect(result2).toEqual({ name: 'Bob' })
    expect(obj).toEqual({ name: 'John' }) // original unchanged
  })
})

describe('updateIn', () => {
  it('should update a top-level property with function', () => {
    const obj = { name: 'John', age: 30 }
    const result = updateIn(obj).name((name) => name.toUpperCase())

    expect(result).toEqual({ name: 'JOHN', age: 30 })
    expect(obj).toEqual({ name: 'John', age: 30 }) // original unchanged
  })

  it('should update a nested property with function', () => {
    const obj = {
      user: {
        profile: {
          name: 'John',
          age: 30,
        },
      },
    }
    const result = updateIn(obj).user.profile.name((name) => name.toUpperCase())

    expect(result).toEqual({
      user: {
        profile: {
          name: 'JOHN',
          age: 30,
        },
      },
    })
    expect(obj).toEqual({
      user: {
        profile: {
          name: 'John',
          age: 30,
        },
      },
    }) // original unchanged
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
    const result = updateIn(obj).user.profile.name((name) => {
      const [firstName, lastName] = name.split(' ')
      return `${lastName}, ${firstName}`
    })

    expect(result).toEqual({
      user: {
        profile: {
          name: 'Doe, John',
          age: 30,
        },
      },
    })
    expect(obj).toEqual({
      user: {
        profile: {
          name: 'John Doe',
          age: 30,
        },
      },
    }) // original unchanged
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
    expect(obj).toEqual({
      user: {
        profile: {
          name: 'John',
          settings: {
            theme: 'dark',
          },
        },
      },
    }) // original unchanged
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
    const result = updateIn(obj, { shallow: true }).user.profile.settings.theme(
      (theme) => theme.toUpperCase(),
    )

    // Only the immediate parent should be cloned
    expect(result.user.profile.settings).not.toBe(obj.user.profile.settings)
    expect(result.user.profile).not.toBe(obj.user.profile)
    expect(result.user).not.toBe(obj.user)
    expect(obj).toEqual({
      user: {
        profile: {
          name: 'John',
          settings: {
            theme: 'dark',
          },
        },
      },
    }) // original unchanged
  })

  it('should handle arrays with shallow cloning', () => {
    const obj = {
      users: [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 },
      ],
    }
    const result = updateIn(obj, { shallow: true }).users[0].name((name) =>
      name.toUpperCase(),
    )

    expect(result.users[0].name).toBe('JOHN')
    expect(result.users).not.toBe(obj.users)
    expect(obj).toEqual({
      users: [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 },
      ],
    }) // original unchanged
  })

  it('should handle function that returns undefined', () => {
    const obj = { name: 'John', age: 30 }
    const result = updateIn(obj).name(() => undefined)

    // Should keep the original value when function returns undefined
    expect(result).toEqual({ name: 'John', age: 30 })
    expect(obj).toEqual({ name: 'John', age: 30 }) // original unchanged
  })

  it('should handle function that returns null', () => {
    const obj = { name: 'John', age: 30 }
    const result = updateIn(obj).name(
      () =>
        // @ts-expect-error
        null,
    )

    expect(result).toEqual({ name: null, age: 30 })
    expect(obj).toEqual({ name: 'John', age: 30 }) // original unchanged
  })

  it('should handle nested arrays', () => {
    const obj = {
      data: [
        [
          { id: 1, value: 'a' },
          { id: 2, value: 'b' },
        ],
        [{ id: 3, value: 'c' }],
      ],
    }
    const result = updateIn(obj).data[0][1].value((value) =>
      value.toUpperCase(),
    )

    expect(result.data[0][1].value).toBe('B')
    expect(obj).toEqual({
      data: [
        [
          { id: 1, value: 'a' },
          { id: 2, value: 'b' },
        ],
        [{ id: 3, value: 'c' }],
      ],
    }) // original unchanged
  })

  it('should throw error when accessing property of null/undefined', () => {
    const obj = { user: null }

    expect(() => {
      // @ts-expect-error
      updateIn(obj).user.name((name) => name.toUpperCase())
    }).toThrow('Cannot read property "name" of null')
    expect(obj).toEqual({ user: null }) // original unchanged
  })

  it('should handle concurrent calls', () => {
    const obj = { name: 'John' }

    // This should work fine since they're not actually concurrent
    const result1 = updateIn(obj).name((name) => name.toUpperCase())
    const result2 = updateIn(obj).name((name) => name.toLowerCase())

    expect(result1).toEqual({ name: 'JOHN' })
    expect(result2).toEqual({ name: 'john' })
    expect(obj).toEqual({ name: 'John' }) // original unchanged
  })
})

describe('edge cases', () => {
  it('should handle empty objects', () => {
    const obj: Record<string, any> = {}
    const result = setIn(obj).newProp('value')

    expect(result).toEqual({ newProp: 'value' })
    expect(obj).toEqual({}) // original unchanged
  })

  it('should handle empty arrays', () => {
    const obj = { items: [] as string[] }
    const result = setIn(obj).items[0]('first item')

    expect(result).toEqual({ items: ['first item'] })
    expect(obj).toEqual({ items: [] }) // original unchanged
  })

  it('should handle undefined values in path', () => {
    const obj = { user: { profile: undefined } }

    expect(() => {
      // @ts-expect-error
      setIn(obj).user.profile.name('John')
    }).toThrow('Cannot read property "name" of undefined')
    expect(obj).toEqual({ user: { profile: undefined } }) // original unchanged
  })

  it('should handle non-object values in path', () => {
    const obj = { user: 'not an object' }

    expect(() => {
      // @ts-expect-error
      setIn(obj).user.name('John')
    }).toThrow()
    expect(obj).toEqual({ user: 'not an object' }) // original unchanged
  })
})
