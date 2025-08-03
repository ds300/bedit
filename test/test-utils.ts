import { describe, it, expect } from 'vitest'

// Test data factories
export const createSimpleUser = () => ({ name: 'John', age: 30 })
export const createNestedUser = () => ({
  user: {
    profile: {
      name: 'John',
      age: 30,
    },
  },
})
export const createUserArray = () => ({
  users: [
    { name: 'John', age: 30 },
    { name: 'Jane', age: 25 },
  ],
})
export const createDeepNested = () => ({
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
export const createNestedArray = () => ({
  data: [
    [
      { id: 1, value: 'a' },
      { id: 2, value: 'b' },
    ],
    [{ id: 3, value: 'c' }],
  ],
})

// Re-export test functions for convenience
export { describe, it, expect }
