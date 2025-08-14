import { describe, it, expect } from 'vitest'
import { editIn } from '../src/bedit.mjs'

describe('editIn', () => {
  describe('Object mutations', () => {
    it('should allow mutations on object properties', () => {
      const baseObj = {
        user: {
          name: 'John',
          age: 30,
          settings: {
            theme: 'dark',
            notifications: true,
          },
        },
      }

      const result = editIn(baseObj).user((user) => {
        // Can mutate top-level properties of user
        user.name = 'Jane'
        user.age = 25
        // Cannot mutate nested properties - they are readonly
        function _() {
          // @ts-expect-error
          user.settings.theme = 'light'
        }
      })

      // Should create new objects only at the mutation path
      expect(result).not.toBe(baseObj)
      expect(result.user).not.toBe(baseObj.user)

      // Should preserve references to unchanged objects
      expect(result.user.settings).toBe(baseObj.user.settings)

      // Should have the new values
      expect(result.user.name).toBe('Jane')
      expect(result.user.age).toBe(25)
    })

    it('should replace entire objects at any level', () => {
      const baseObj = {
        user: {
          profile: {
            name: 'John',
            age: 30,
          },
          preferences: {
            language: 'en',
          },
        },
      }

      const result = editIn(baseObj).user((user) => {
        // Can replace entire objects
        user.profile = {
          name: 'Jane',
          age: 25,
        }
        user.preferences = {
          language: 'de',
        }
      })

      expect(result).not.toBe(baseObj)
      expect(result.user).not.toBe(baseObj.user)
      expect(result.user.profile.name).toBe('Jane')
      expect(result.user.profile.age).toBe(25)
    })
  })

  describe('Array mutations', () => {
    it('should allow mutations on array elements', () => {
      const baseObj = {
        todos: [
          { id: 1, name: 'Todo 1', completed: false },
          { id: 2, name: 'Todo 2', completed: true },
        ],
      }

      const result = editIn(baseObj).todos((todos) => {
        // Can replace array elements
        todos[0] = {
          id: 1,
          name: 'Updated Todo 1',
          completed: true,
        }
        // Cannot mutate nested properties of array elements
        function _() {
          // @ts-expect-error
          todos[1].name = 'Updated Todo 2' // error: readonly
        }
      })

      expect(result).not.toBe(baseObj)
      expect(result.todos).not.toBe(baseObj.todos)
      expect(result.todos[0]).not.toBe(baseObj.todos[0])
      expect(result.todos[1]).toBe(baseObj.todos[1]) // Unchanged element should have same reference

      expect(result.todos[0].name).toBe('Updated Todo 1')
      expect(result.todos[0].completed).toBe(true)
    })

    it('should replace entire arrays', () => {
      const baseObj = {
        items: [
          { id: 1, name: 'Item 1' },
          { id: 2, name: 'Item 2' },
        ],
      }

      const result = editIn(baseObj).items((items) => {
        // Can mutate array methods
        items.length = 0 // Clear array
        items.push(
          { id: 3, name: 'New Item 1' },
          { id: 4, name: 'New Item 2' },
          { id: 5, name: 'New Item 3' },
        )
      })

      expect(result.items).not.toBe(baseObj.items)
      expect(result.items).toHaveLength(3)
      expect(result.items[0].name).toBe('New Item 1')
    })

    it('should handle nested arrays', () => {
      const baseObj = {
        categories: [
          {
            name: 'Work',
            tasks: [
              { id: 1, name: 'Task 1' },
              { id: 2, name: 'Task 2' },
            ],
          },
        ],
      }

      const result = editIn(baseObj).categories[0].tasks((tasks) => {
        // Can mutate array methods
        tasks.length = 0
        tasks.push({ id: 3, name: 'New Task 1' }, { id: 4, name: 'New Task 2' })
      })

      expect(result.categories[0].tasks).not.toBe(baseObj.categories[0].tasks)
      expect(result.categories[0].tasks).toHaveLength(2)
      expect(result.categories[0].tasks[0].name).toBe('New Task 1')
    })
  })

  describe('Mixed object and array mutations', () => {
    it('should handle complex nested structures', () => {
      const baseObj = {
        user: {
          profile: {
            name: 'John',
            preferences: {
              themes: ['dark', 'light'],
              settings: {
                notifications: true,
              },
            },
          },
        },
      }

      const result = editIn(baseObj).user.profile.preferences((preferences) => {
        // Can replace entire objects
        preferences.themes = ['light', 'dark', 'auto']
        preferences.settings = {
          notifications: false,
        }
      })

      // Check that the mutations worked
      expect(result.user.profile.preferences.themes).toEqual([
        'light',
        'dark',
        'auto',
      ])
      expect(result.user.profile.preferences.settings.notifications).toBe(false)

      // Check that unchanged elements maintain references
      expect(result.user.profile.name).toBe('John')
    })
  })

  describe('Function-based mutations', () => {
    it('should support direct mutations with access to current value', () => {
      const baseObj = {
        counter: { value: 5, history: [1, 2, 3] },
      }

      const result = editIn(baseObj).counter((counter) => {
        // Can mutate top-level properties
        counter.value += 1
        counter.history = [...counter.history, counter.value - 1]
      })

      expect(result.counter.value).toBe(6)
      expect(result.counter.history).toEqual([1, 2, 3, 5])
    })

    it('should support complex mutations', () => {
      const baseObj = {
        user: {
          profile: {
            name: 'John',
            settings: { theme: 'dark', notifications: true },
          },
        },
      }

      const result = editIn(baseObj).user.profile((profile) => {
        // Can mutate top-level properties
        profile.name = profile.name.toUpperCase()
        profile.settings = {
          theme: profile.settings.theme === 'dark' ? 'light' : 'dark',
          notifications: profile.settings.notifications,
        }
      })

      expect(result.user.profile.name).toBe('JOHN')
      expect(result.user.profile.settings.theme).toBe('light')
      expect(result.user.profile.settings.notifications).toBe(true)
    })
  })

  describe('Edge cases', () => {
    it('should handle deep nested mutations', () => {
      const baseObj = {
        a: {
          b: {
            c: {
              d: {
                e: {
                  f: {
                    g: {
                      h: {
                        i: {
                          j: {
                            value: 'deep',
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
      }

      const result = editIn(baseObj).a.b.c.d.e.f.g.h.i.j((j) => {
        j.value = 'updated'
      })

      expect(result.a.b.c.d.e.f.g.h.i.j.value).toBe('updated')
    })
  })

  describe('Performance characteristics', () => {
    it('should perform shallow cloning (not deep cloning)', () => {
      const baseObj = {
        user: {
          profile: {
            name: 'John',
            settings: { theme: 'dark' },
          },
          todos: [
            { id: 1, name: 'Todo 1' },
            { id: 2, name: 'Todo 2' },
          ],
        },
      }

      const result = editIn(baseObj).user.profile.settings((settings) => {
        settings.theme = 'light'
      })

      // The result should be a new object
      expect(result).not.toBe(baseObj)
      expect(result.user).not.toBe(baseObj.user)
      expect(result.user.profile).not.toBe(baseObj.user.profile)
      expect(result.user.profile.settings).not.toBe(
        baseObj.user.profile.settings,
      )

      // But unchanged nested objects should maintain their references
      // This is the key difference from deep cloning
      expect(result.user.todos).toBe(baseObj.user.todos)
      expect(result.user.todos[0]).toBe(baseObj.user.todos[0])
      expect(result.user.todos[1]).toBe(baseObj.user.todos[1])
    })

    it('should only clone the specific object being mutated', () => {
      const baseObj = {
        user: {
          profile: { name: 'John' },
          settings: { theme: 'dark' },
        },
        other: { data: 'unchanged' },
      }

      const result = editIn(baseObj).user.profile((profile) => {
        profile.name = 'Jane'
      })

      // Only the mutation path should be cloned
      expect(result.user).not.toBe(baseObj.user)
      expect(result.user.profile).not.toBe(baseObj.user.profile)

      // Other objects should maintain references
      expect(result.user.settings).toBe(baseObj.user.settings)
      expect(result.other).toBe(baseObj.other)
    })
  })
})
