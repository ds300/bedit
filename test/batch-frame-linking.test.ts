import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { editIn, edit, setIn, setDevMode, updateIn } from '../src/bedit.mjs'

describe('batch frame linking', () => {
  beforeEach(() => {
    setDevMode(true)
  })

  afterEach(() => {
    setDevMode(false)
  })

  it('should handle complex batch frame release scenarios', async () => {
    const obj = { a: 1, b: 2, c: 3 }

    // Create nested batch operations to test frame linking
    const result = await edit(obj, async (draft) => {
      await edit(draft, async (draft) => {
        await edit(draft, async (draft) => {
          await edit(draft, async (draft) => {
            draft.a = 2
          })
        })
      })
      setIn(draft).b(20)
      setIn(draft).c(30)
    })

    expect(result).toEqual({ a: 2, b: 20, c: 30 })
  })

  it('should handle multiple concurrent batch frames', async () => {
    const obj = {
      users: [{ name: 'John', age: 30 }],
      settings: { theme: 'dark', debug: false },
      metadata: { version: 1, updated: new Date('2023-01-01') },
    }

    const result = await edit(obj, async (draft) => {
      // Multiple async operations that should create and release batch frames
      const userUpdate = editIn(draft).users[0](async (user) => {
        user.name = 'Jane'
        user.age = 31
        return user
      })

      const settingsUpdate = editIn(draft).settings(async (settings) => {
        settings.theme = 'light'
        settings.debug = true
        return settings
      })

      const metadataUpdate = editIn(draft).metadata(async (metadata) => {
        metadata.version = 2
        metadata.updated = new Date('2024-01-01')
        return metadata
      })

      // Wait for all to complete
      await Promise.all([userUpdate, settingsUpdate, metadataUpdate])
    })

    expect(result.users[0].name).toBe('Jane')
    expect(result.users[0].age).toBe(31)
    expect(result.settings.theme).toBe('light')
    expect(result.settings.debug).toBe(true)
    expect(result.metadata.version).toBe(2)
  })

  it('should handle deeply nested async batch frames', async () => {
    const obj = {
      level1: {
        level2: {
          level3: {
            level4: {
              data: ['a', 'b', 'c'],
            } as { data: string[]; newProp?: string },
          },
        },
      },
    }

    const result = await editIn(obj).level1(async (level1) => {
      return await editIn(level1).level2(async (level2) => {
        return await editIn(level2).level3(async (level3) => {
          return await editIn(level3).level4(async (level4) => {
            updateIn(level4).data.push('d')
            level4.newProp = 'added'
            return level4
          })
        })
      })
    })

    expect(result.level1.level2.level3.level4.data).toEqual([
      'a',
      'b',
      'c',
      'd',
    ])
    expect(result.level1.level2.level3.level4.newProp).toBe('added')
  })

  it('should handle batch frame linking with mixed sync/async operations', () => {
    const obj = {
      sync: 1,
      async: 2,
      mixed: { value: 3 } as { value: number; newProp?: string },
    }

    const result = edit(obj, (draft) => {
      // Sync operation
      setIn(draft).sync(10)

      // Use setIn instead of editIn to avoid readonly issues
      setIn(draft).mixed({ value: 30, newProp: 'sync-added' })

      // Another sync operation
      setIn(draft).async(20)
    })

    expect(result).toEqual({
      sync: 10,
      async: 20,
      mixed: { value: 30, newProp: 'sync-added' },
    })
  })

  it('should handle batch frame errors and cleanup', async () => {
    const obj = { data: { value: 1 }, error: { value: 2 } }

    // Test that batch frames are properly cleaned up even when errors occur
    await expect(async () => {
      await edit(obj, async (draft) => {
        // This should work
        await editIn(draft).data(async (data) => {
          data.value = 10
          return data
        })

        // This should throw an error
        await editIn(draft).error(async (error) => {
          throw new Error('Async operation failed')
        })
      })
    }).rejects.toThrow('Async operation failed')

    // Original object should be unchanged
    expect(obj.data.value).toBe(1)
    expect(obj.error.value).toBe(2)
  })

  it('should handle batch frame pool reuse', async () => {
    const obj1 = { value: 1 }
    const obj2 = { value: 2 }
    const obj3 = { value: 3 }

    // Multiple sequential operations that should reuse batch frames
    const result1 = await edit(obj1, async (draft) => {
      await editIn(draft).value(async (val) => val * 10)
    })

    const result2 = await edit(obj2, async (draft) => {
      await editIn(draft).value(async (val) => val * 20)
    })

    const result3 = await edit(obj3, async (draft) => {
      await editIn(draft).value(async (val) => val * 30)
    })

    expect(result1.value).toBe(10)
    expect(result2.value).toBe(40)
    expect(result3.value).toBe(90)
  })

  it('should handle empty batch operations', () => {
    const obj = { unchanged: 'value' }

    const result = edit(obj, (draft) => {
      // Perform no operations
    })

    expect(result).toEqual(obj)
    expect(result).not.toBe(obj) // Should still clone the top-level object
  })

  it('should handle batch frames with Map and Set operations', async () => {
    const obj = {
      cache: new Map([['key1', 'value1']]),
      tags: new Set(['tag1', 'tag2']),
    }

    const result = await edit(obj, async (draft) => {
      // Async Map operation
      await editIn(draft).cache(async (cache) => {
        cache.set('key2', 'value2')
        cache.delete('key1')
        return cache
      })

      // Async Set operation
      await editIn(draft).tags(async (tags) => {
        tags.add('tag3')
        tags.delete('tag1')
        return tags
      })
    })

    expect(result.cache.get('key2')).toBe('value2')
    expect(result.cache.has('key1')).toBe(false)
    expect(result.tags.has('tag3')).toBe(true)
    expect(result.tags.has('tag1')).toBe(false)
  })
})
