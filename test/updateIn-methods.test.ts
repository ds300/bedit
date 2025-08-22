import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { fork, setDevMode, key, patch } from '../src/patchfork.mjs'

describe('edit method calls', () => {
  beforeEach(() => {
    setDevMode(true)
  })

  afterEach(() => {
    setDevMode(false)
  })

  describe('Array methods', () => {
    it('should support push method', () => {
      const obj = { items: ['a', 'b'] }
      const result = fork(obj).items.push('c')

      expect(result.items).toEqual(['a', 'b', 'c'])
      expect(obj.items).toEqual(['a', 'b']) // Original unchanged
    })

    it('should support multiple push arguments', () => {
      const obj = { items: [1, 2] }
      const result = fork(obj).items.push(3, 4, 5)

      expect(result.items).toEqual([1, 2, 3, 4, 5])
    })

    it('should support pop method', () => {
      const obj = { items: ['a', 'b', 'c'] }
      const result = fork(obj).items.pop()

      expect(result.items).toEqual(['a', 'b'])
      expect(obj.items).toEqual(['a', 'b', 'c']) // Original unchanged
    })

    it('should support shift method', () => {
      const obj = { items: ['a', 'b', 'c'] }
      const result = fork(obj).items.shift()

      expect(result.items).toEqual(['b', 'c'])
      expect(obj.items).toEqual(['a', 'b', 'c']) // Original unchanged
    })

    it('should support unshift method', () => {
      const obj = { items: ['b', 'c'] }
      const result = fork(obj).items.unshift('a')

      expect(result.items).toEqual(['a', 'b', 'c'])
      expect(obj.items).toEqual(['b', 'c']) // Original unchanged
    })

    it('should support multiple unshift arguments', () => {
      const obj = { items: ['d'] }
      const result = fork(obj).items.unshift('a', 'b', 'c')

      expect(result.items).toEqual(['a', 'b', 'c', 'd'])
      expect(obj.items).toEqual(['d']) // Original unchanged
    })

    it('should support splice method', () => {
      const obj = { items: ['a', 'b', 'c', 'd'] }
      const result = fork(obj).items.splice(1, 2, 'x', 'y')

      expect(result.items).toEqual(['a', 'x', 'y', 'd'])
      expect(obj.items).toEqual(['a', 'b', 'c', 'd']) // Original unchanged
    })

    it('should support sort method', () => {
      const obj = { items: ['c', 'a', 'b'] }
      const result = fork(obj).items.sort()

      expect(result.items).toEqual(['a', 'b', 'c'])
      expect(obj.items).toEqual(['c', 'a', 'b']) // Original unchanged
    })

    it('should support sort with compareFn', () => {
      const obj = { items: [3, 1, 2] }
      const result = fork(obj).items.sort((a, b) => b - a)

      expect(result.items).toEqual([3, 2, 1])
      expect(obj.items).toEqual([3, 1, 2]) // Original unchanged
    })

    it('should support reverse method', () => {
      const obj = { items: ['a', 'b', 'c'] }
      const result = fork(obj).items.reverse()

      expect(result.items).toEqual(['c', 'b', 'a'])
      expect(obj.items).toEqual(['a', 'b', 'c']) // Original unchanged
    })

    it('should support concat method (immutable)', () => {
      const obj = { items: ['a', 'b'] }
      const result = fork(obj).items.concat(['c', 'd'])

      expect(result.items).toEqual(['a', 'b', 'c', 'd'])
      expect(obj.items).toEqual(['a', 'b']) // Original unchanged
    })

    it('should support slice method (immutable)', () => {
      const obj = { items: ['a', 'b', 'c', 'd'] }
      const result = fork(obj).items.slice(1, 3)

      expect(result.items).toEqual(['b', 'c'])
      expect(obj.items).toEqual(['a', 'b', 'c', 'd']) // Original unchanged
    })

    it('should support map method (immutable)', () => {
      const obj = { items: [1, 2, 3] }
      const result = fork(obj).items.map((x) => x * 2)

      expect(result.items).toEqual([2, 4, 6])
      expect(obj.items).toEqual([1, 2, 3]) // Original unchanged
    })

    it('should support filter method (immutable)', () => {
      const obj = { items: [1, 2, 3, 4] }
      const result = fork(obj).items.filter((x) => x % 2 === 0)

      expect(result.items).toEqual([2, 4])
      expect(obj.items).toEqual([1, 2, 3, 4]) // Original unchanged
    })

    it('should work with nested arrays', () => {
      const obj = { data: { items: ['a', 'b'] } }
      const result = fork(obj).data.items.push('c')

      expect(result.data.items).toEqual(['a', 'b', 'c'])
      expect(obj.data.items).toEqual(['a', 'b']) // Original unchanged
    })
  })

  describe('Set methods', () => {
    it('should support add method', () => {
      const obj = { tags: new Set(['a', 'b']) }
      const result = fork(obj).tags.add('c')

      expect(result.tags).toEqual(new Set(['a', 'b', 'c']))
      expect(obj.tags).toEqual(new Set(['a', 'b'])) // Original unchanged
    })

    it('should support add method with duplicate', () => {
      const obj = { tags: new Set(['a', 'b']) }
      const result = fork(obj).tags.add('b')

      expect(result.tags).toEqual(new Set(['a', 'b']))
      expect(obj.tags).toEqual(new Set(['a', 'b'])) // Original unchanged
    })

    it('should support delete method', () => {
      const obj = { tags: new Set(['a', 'b', 'c']) }
      const result = fork(obj).tags.delete('b')

      expect(result.tags).toEqual(new Set(['a', 'c']))
      expect(obj.tags).toEqual(new Set(['a', 'b', 'c'])) // Original unchanged
    })

    it('should support delete method with non-existent value', () => {
      const obj = { tags: new Set(['a', 'b']) }
      const result = fork(obj).tags.delete('c')

      expect(result.tags).toEqual(new Set(['a', 'b']))
      expect(obj.tags).toEqual(new Set(['a', 'b'])) // Original unchanged
    })

    it('should support clear method', () => {
      const obj = { tags: new Set(['a', 'b', 'c']) }
      const result = fork(obj).tags.clear()

      expect(result.tags).toEqual(new Set())
      expect(obj.tags).toEqual(new Set(['a', 'b', 'c'])) // Original unchanged
    })

    it('should work with nested Sets', () => {
      const obj = { data: { tags: new Set(['react']) } }
      const result = fork(obj).data.tags.add('typescript')

      expect(result.data.tags).toEqual(new Set(['react', 'typescript']))
      expect(obj.data.tags).toEqual(new Set(['react'])) // Original unchanged
    })

    it('should support chained Set operations in edit', () => {
      const obj = { tags: new Set(['react', 'vue', 'angular']) }

      const result = fork.do(obj, (draft) => {
        patch(draft).tags.delete('vue')
        patch(draft).tags.add('typescript')
        patch(draft).tags.add('nodejs')
      })

      expect(result.tags).toEqual(
        new Set(['react', 'angular', 'typescript', 'nodejs']),
      )
      expect(obj.tags).toEqual(new Set(['react', 'vue', 'angular'])) // Original unchanged
    })
  })

  describe('Map methods', () => {
    it('should support set method', () => {
      const obj = {
        config: new Map<string, string | boolean>([['theme', 'dark']]),
      }
      const result = fork(obj).config.set('debug', true)

      expect(result.config.get('theme')).toBe('dark')
      expect(result.config.get('debug')).toBe(true)
      expect(obj.config.has('debug')).toBe(false) // Original unchanged
    })

    it('should support set method overwriting existing', () => {
      const obj = { config: new Map([['theme', 'dark']]) }
      const result = fork(obj).config.set('theme', 'light')

      expect(result.config.get('theme')).toBe('light')
      expect(obj.config.get('theme')).toBe('dark') // Original unchanged
    })

    it('should support delete method', () => {
      const obj = {
        config: new Map<string, string | boolean>([
          ['theme', 'dark'],
          ['debug', true],
        ]),
      }
      const result = fork(obj).config.delete('debug')

      expect(result.config.has('debug')).toBe(false)
      expect(result.config.get('theme')).toBe('dark')
      expect(obj.config.has('debug')).toBe(true) // Original unchanged
    })

    it('should support delete method with non-existent key', () => {
      const obj = { config: new Map([['theme', 'dark']]) }
      const result = fork(obj).config.delete('nonexistent')

      expect(result.config).toEqual(new Map([['theme', 'dark']]))
    })

    it('should support clear method', () => {
      const obj = {
        config: new Map<string, string | boolean>([
          ['theme', 'dark'],
          ['debug', true],
        ]),
      }
      const result = fork(obj).config.clear()

      expect(result.config).toEqual(new Map())
      expect(obj.config.has('debug')).toBe(true) // Original unchanged
    })

    it('should work with nested Maps', () => {
      const obj = {
        data: {
          config: new Map<string, string | boolean>([['theme', 'dark']]),
        },
      }
      const result = fork(obj).data.config.set('debug', true)

      expect(result.data.config.get('debug')).toBe(true)
      expect(obj.data.config.has('debug')).toBe(false) // Original unchanged
    })

    it('should support chained Map operations in edit', () => {
      const obj = {
        config: new Map<string, string | boolean>([
          ['theme', 'dark'],
          ['old', 'value'],
        ]),
      }

      const result = fork.do(obj, (draft) => {
        patch(draft).config.set('theme', 'light')
        patch(draft).config.set('debug', true)
        patch(draft).config.delete('old')
      })

      expect(result.config.get('theme')).toBe('light')
      expect(result.config.get('debug')).toBe(true)
      expect(result.config.has('old')).toBe(false)
      expect(obj.config.has('old')).toBe(true) // Original unchanged
    })
  })

  describe('Complex scenarios', () => {
    it('should handle mixed collection types', () => {
      const obj = {
        users: ['alice', 'bob'],
        tags: new Set(['admin', 'user']),
        config: new Map<string, string | boolean>([['theme', 'dark']]),
      }

      const result = fork.do(obj, (draft) => {
        patch(draft).users.push('charlie')
        patch(draft).tags.add('moderator')
        patch(draft).config.set('debug', true)
      })

      expect(result.users).toEqual(['alice', 'bob', 'charlie'])
      expect(result.tags).toEqual(new Set(['admin', 'user', 'moderator']))
      expect(result.config.get('debug')).toBe(true)
      expect(obj.config.has('debug')).toBe(false) // Original unchanged
    })

    it('should handle nested collections', () => {
      const obj = {
        data: {
          lists: new Map([
            ['todo', ['task1', 'task2']],
            ['done', ['completed1']],
          ]),
          tags: new Set(['important']),
        },
      }

      const result = fork.do(obj, (draft) => {
        patch(draft).data.lists[key]('todo').push('task3')
        patch(draft).data.tags.add('urgent')
      })

      expect(result.data.lists.get('todo')).toEqual(['task1', 'task2', 'task3'])
      expect(result.data.tags).toEqual(new Set(['important', 'urgent']))
      expect(obj.data.tags).toEqual(new Set(['important'])) // Original unchanged
    })

    it('should handle array of Sets', () => {
      const obj = {
        permissions: [new Set(['read', 'write']), new Set(['admin'])],
      }

      const result = fork(obj).permissions[0].add('execute')

      expect(result.permissions[0]).toEqual(
        new Set(['read', 'write', 'execute']),
      )
      expect(result.permissions[1]).toEqual(new Set(['admin']))
      expect(obj.permissions[1]).toEqual(new Set(['admin'])) // Original unchanged
    })

    it('should handle Map of arrays', () => {
      const obj = {
        groups: new Map([
          ['admins', ['alice', 'bob']],
          ['users', ['charlie']],
        ]),
      }

      const result = fork(obj).groups[key]('users').push('dave')!

      expect(result.groups.get('users')).toEqual(['charlie', 'dave'])
      expect(result.groups.get('admins')).toEqual(['alice', 'bob'])
      expect(obj.groups.get('users')).toEqual(['charlie']) // Original unchanged
    })

    it('should maintain immutability across operations', () => {
      const originalArray = ['a', 'b']
      const originalSet = new Set(['x', 'y'])
      const originalMap = new Map([['key', 'value']])

      const obj = {
        arr: originalArray,
        set: originalSet,
        map: originalMap,
      }

      const result = fork.do(obj, (draft) => {
        patch(draft).arr.push('c')
        patch(draft).set.add('z')
        patch(draft).map.set('new', 'data')
      })

      // Originals should be unchanged
      expect(originalArray).toEqual(['a', 'b'])
      expect(originalSet).toEqual(new Set(['x', 'y']))
      expect(originalMap).toEqual(new Map([['key', 'value']]))

      // Results should be updated
      expect(result.arr).toEqual(['a', 'b', 'c'])
      expect(result.set).toEqual(new Set(['x', 'y', 'z']))
      expect(result.map.get('new')).toBe('data')
      expect(obj.map.get('key')).toBe('value') // Original unchanged
      expect(obj.map.get('new')).toBeUndefined() // Original unchanged
    })

    it('should work with async operations', async () => {
      const obj = {
        items: ['a', 'b'],
        tags: new Set(['react']),
      }

      const result = await fork.do(obj, async (draft) => {
        await new Promise((resolve) => setTimeout(resolve, 1))
        patch(draft).items.push('c')
        patch(draft).tags.add('typescript')
      })

      expect(result.items).toEqual(['a', 'b', 'c'])
      expect(result.tags).toEqual(new Set(['react', 'typescript']))
      expect(obj.tags).toEqual(new Set(['react'])) // Original unchanged
    })
  })

  describe('Collection methods with optional properties', () => {
    it('should handle array methods on optional arrays', () => {
      const obj: { items?: string[] } = {}

      const pushResult = fork(obj).items.push('new')
      const popResult = fork(obj).items.pop()
      const mapResult = fork(obj).items.map((x) => x.toUpperCase())

      expect(pushResult).toBeUndefined()
      expect(popResult).toBeUndefined()
      expect(mapResult).toBeUndefined()
    })

    it('should handle array methods when optional array exists', () => {
      const obj: { items?: string[] } = { items: ['a', 'b'] }

      const pushResult = fork(obj).items.push('c')
      expect(pushResult?.items).toEqual(['a', 'b', 'c'])

      const mapResult = fork(obj).items.map((x) => x.toUpperCase())
      expect(mapResult?.items).toEqual(['A', 'B'])
    })

    it('should handle Set methods on optional Sets', () => {
      const obj: { tags?: Set<string> } = {}

      const addResult = fork(obj).tags.add('new')
      const deleteResult = fork(obj).tags.delete('old')

      expect(addResult).toBeUndefined()
      expect(deleteResult).toBeUndefined()
    })

    it('should handle Map methods on optional Maps', () => {
      const obj: { config?: Map<string, string> } = {}

      const setResult = fork(obj).config.set('key', 'value')
      const deleteResult = fork(obj).config.delete('key')

      expect(setResult).toBeUndefined()
      expect(deleteResult).toBeUndefined()
    })
  })

  describe('Collections within optional objects', () => {
    it('should handle arrays in optional parent objects', () => {
      const obj: { data?: { items: string[] } } = {}

      const result = fork(obj).data.items.push('new')

      expect(result).toBeUndefined()
    })

    it('should handle maps in optional parent objects', () => {
      const obj: { config?: { settings: Map<string, boolean> } } = {}

      const result = fork(obj).config.settings.set('theme', true)

      expect(result).toBeUndefined()
    })

    it('should work when parent object exists', () => {
      const obj: { data?: { items: string[] } } = {
        data: { items: ['a', 'b'] },
      }

      const result = fork(obj).data.items.push('c')

      expect(result?.data?.items).toEqual(['a', 'b', 'c'])
    })
  })

  describe('Readonly constraint verification', () => {
    it('should provide readonly arrays to updaters', () => {
      const obj = { items: [{ id: 1, name: 'test' }] }

      fork(obj).items((items) => {
        // These should fail at runtime in dev mode
        // @ts-expect-error - testing readonly enforcement
        items.push({ id: 2, name: 'new' })

        // @ts-expect-error - testing readonly enforcement
        items[0].id = 999

        // This should work
        return [...items, { id: 2, name: 'new' }]
      })
    })

    it('should provide readonly Maps to updaters', () => {
      const obj = { config: new Map([['theme', 'dark']]) }

      fork(obj).config((config) => {
        // This should fail at runtime in dev mode
        // @ts-expect-error - testing readonly enforcement
        config.set('debug', 'no')

        // This should work
        return new Map([...config, ['debug', 'no']])
      })
    })

    it('should provide readonly Sets to updaters', () => {
      const obj = { tags: new Set(['react', 'typescript']) }

      fork(obj).tags((tags) => {
        // This should fail at runtime in dev mode
        // @ts-expect-error - testing runtime readonly enforcement
        tags.add('vue')

        // This should work
        return new Set([...tags, 'vue'])
      })
    })
  })

  describe('Advanced nested collection scenarios', () => {
    it('should handle Array of Maps with optional access', () => {
      const obj: {
        data?: Array<Map<string, { count: number }>>
      } = {}

      const result = fork(obj).data[0][key]('metrics')((metrics) => ({
        ...metrics,
        count: metrics.count + 1,
      }))

      expect(result).toBeUndefined()
    })

    it('should handle Map of Sets with method calls', () => {
      const obj: {
        permissions?: Map<string, Set<string>>
      } = { permissions: new Map([['admin', new Set(['read', 'write'])]]) }

      const result = fork(obj).permissions[key]('admin').add('delete')

      expect(result?.permissions?.get('admin')).toEqual(
        new Set(['read', 'write', 'delete']),
      )
    })

    it('should handle deeply nested optional collections', () => {
      type Deep = {
        level1?: {
          level2?: {
            data: Map<string, Array<Set<number>>>
          }
        }
      }

      const obj: Deep = {}

      const result = fork(obj).level1.level2.data[key]('group1')[0].add(42)

      expect(result).toBeUndefined()
    })

    it('should handle Set of Maps with nested operations', () => {
      const obj = {
        complexData: new Set([
          new Map([['key1', ['value1', 'value2']]]),
          new Map([['key2', ['value3']]]),
        ]),
      }

      // This tests the existing collection handling with complex nesting
      const result = fork.do(obj, (draft) => {
        const maps = Array.from(draft.complexData)
        maps[0].set('key1', [...maps[0].get('key1')!, 'value4'])
        patch(draft).complexData.clear()
        maps.forEach((map) => patch(draft).complexData.add(map))
      })

      const firstMap = Array.from(result.complexData)[0]
      expect(firstMap.get('key1')).toEqual(['value1', 'value2', 'value4'])
    })
  })
})
