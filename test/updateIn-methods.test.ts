import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { updateIn, edit, setDevMode } from '../src/bedit.mjs'

describe('updateIn method calls', () => {
  beforeEach(() => {
    setDevMode(true)
  })

  afterEach(() => {
    setDevMode(false)
  })

  describe('Array methods', () => {
    it('should support push method', () => {
      const obj = { items: ['a', 'b'] }
      const result = updateIn(obj).items.push('c')
      
      expect(result.items).toEqual(['a', 'b', 'c'])
      expect(obj.items).toEqual(['a', 'b']) // Original unchanged
    })

    it('should support multiple push arguments', () => {
      const obj = { items: [1, 2] }
      const result = updateIn(obj).items.push(3, 4, 5)
      
      expect(result.items).toEqual([1, 2, 3, 4, 5])
    })

    it('should support pop method', () => {
      const obj = { items: ['a', 'b', 'c'] }
      const result = updateIn(obj).items.pop()
      
      expect(result.items).toEqual(['a', 'b'])
      expect(obj.items).toEqual(['a', 'b', 'c']) // Original unchanged
    })

    it('should support shift method', () => {
      const obj = { items: ['a', 'b', 'c'] }
      const result = updateIn(obj).items.shift()
      
      expect(result.items).toEqual(['b', 'c'])
      expect(obj.items).toEqual(['a', 'b', 'c']) // Original unchanged
    })

    it('should support unshift method', () => {
      const obj = { items: ['b', 'c'] }
      const result = updateIn(obj).items.unshift('a')
      
      expect(result.items).toEqual(['a', 'b', 'c'])
      expect(obj.items).toEqual(['b', 'c']) // Original unchanged
    })

    it('should support multiple unshift arguments', () => {
      const obj = { items: ['d'] }
      const result = updateIn(obj).items.unshift('a', 'b', 'c')
      
      expect(result.items).toEqual(['a', 'b', 'c', 'd'])
      expect(obj.items).toEqual(['d']) // Original unchanged
    })

    it('should support splice method', () => {
      const obj = { items: ['a', 'b', 'c', 'd'] }
      const result = updateIn(obj).items.splice(1, 2, 'x', 'y')
      
      expect(result.items).toEqual(['a', 'x', 'y', 'd'])
      expect(obj.items).toEqual(['a', 'b', 'c', 'd']) // Original unchanged
    })

    it('should support sort method', () => {
      const obj = { items: ['c', 'a', 'b'] }
      const result = updateIn(obj).items.sort()
      
      expect(result.items).toEqual(['a', 'b', 'c'])
      expect(obj.items).toEqual(['c', 'a', 'b']) // Original unchanged
    })

    it('should support sort with compareFn', () => {
      const obj = { items: [3, 1, 2] }
      const result = updateIn(obj).items.sort((a, b) => b - a)
      
      expect(result.items).toEqual([3, 2, 1])
      expect(obj.items).toEqual([3, 1, 2]) // Original unchanged
    })

    it('should support reverse method', () => {
      const obj = { items: ['a', 'b', 'c'] }
      const result = updateIn(obj).items.reverse()
      
      expect(result.items).toEqual(['c', 'b', 'a'])
      expect(obj.items).toEqual(['a', 'b', 'c']) // Original unchanged
    })

    it('should support concat method (immutable)', () => {
      const obj = { items: ['a', 'b'] }
      const result = updateIn(obj).items.concat(['c', 'd'])
      
      expect(result.items).toEqual(['a', 'b', 'c', 'd'])
      expect(obj.items).toEqual(['a', 'b']) // Original unchanged
    })

    it('should support slice method (immutable)', () => {
      const obj = { items: ['a', 'b', 'c', 'd'] }
      const result = updateIn(obj).items.slice(1, 3)
      
      expect(result.items).toEqual(['b', 'c'])
      expect(obj.items).toEqual(['a', 'b', 'c', 'd']) // Original unchanged
    })

    it('should support map method (immutable)', () => {
      const obj = { items: [1, 2, 3] }
      const result = updateIn(obj).items.map(x => x * 2)
      
      expect(result.items).toEqual([2, 4, 6])
      expect(obj.items).toEqual([1, 2, 3]) // Original unchanged
    })

    it('should support filter method (immutable)', () => {
      const obj = { items: [1, 2, 3, 4] }
      const result = updateIn(obj).items.filter(x => x % 2 === 0)
      
      expect(result.items).toEqual([2, 4])
      expect(obj.items).toEqual([1, 2, 3, 4]) // Original unchanged
    })

    it('should work with nested arrays', () => {
      const obj = { data: { items: ['a', 'b'] } }
      const result = updateIn(obj).data.items.push('c')
      
      expect(result.data.items).toEqual(['a', 'b', 'c'])
      expect(obj.data.items).toEqual(['a', 'b']) // Original unchanged
    })
  })

  describe('Set methods', () => {
    it('should support add method', () => {
      const obj = { tags: new Set(['a', 'b']) }
      const result = updateIn(obj).tags.add('c')
      
      expect(result.tags).toEqual(new Set(['a', 'b', 'c']))
      expect(obj.tags).toEqual(new Set(['a', 'b'])) // Original unchanged
    })

    it('should support add method with duplicate', () => {
      const obj = { tags: new Set(['a', 'b']) }
      const result = updateIn(obj).tags.add('b')
      
      expect(result.tags).toEqual(new Set(['a', 'b']))
      expect(obj.tags).toEqual(new Set(['a', 'b'])) // Original unchanged
    })

    it('should support delete method', () => {
      const obj = { tags: new Set(['a', 'b', 'c']) }
      const result = updateIn(obj).tags.delete('b')
      
      expect(result.tags).toEqual(new Set(['a', 'c']))
      expect(obj.tags).toEqual(new Set(['a', 'b', 'c'])) // Original unchanged
    })

    it('should support delete method with non-existent value', () => {
      const obj = { tags: new Set(['a', 'b']) }
      const result = updateIn(obj).tags.delete('c')
      
      expect(result.tags).toEqual(new Set(['a', 'b']))
      expect(obj.tags).toEqual(new Set(['a', 'b'])) // Original unchanged
    })

    it('should support clear method', () => {
      const obj = { tags: new Set(['a', 'b', 'c']) }
      const result = updateIn(obj).tags.clear()
      
      expect(result.tags).toEqual(new Set())
      expect(obj.tags).toEqual(new Set(['a', 'b', 'c'])) // Original unchanged
    })

    it('should work with nested Sets', () => {
      const obj = { data: { tags: new Set(['react']) } }
      const result = updateIn(obj).data.tags.add('typescript')
      
      expect(result.data.tags).toEqual(new Set(['react', 'typescript']))
      expect(obj.data.tags).toEqual(new Set(['react'])) // Original unchanged
    })

    it('should support chained Set operations in edit', () => {
      const obj = { tags: new Set(['react', 'vue', 'angular']) }
      
      const result = edit(obj, (draft) => {
        updateIn(draft).tags.delete('vue')
        updateIn(draft).tags.add('typescript')
        updateIn(draft).tags.add('nodejs')
      })
      
      expect(result.tags).toEqual(new Set(['react', 'angular', 'typescript', 'nodejs']))
      expect(obj.tags).toEqual(new Set(['react', 'vue', 'angular'])) // Original unchanged
    })
  })

  describe('Map methods', () => {
    it('should support set method', () => {
      const obj = { config: new Map<string, string | boolean>([['theme', 'dark']]) }
      const result = updateIn(obj).config.set('debug', true)
      
      expect(result.config.get('theme')).toBe('dark')
      expect(result.config.get('debug')).toBe(true)
      expect(obj.config.has('debug')).toBe(false) // Original unchanged
    })

    it('should support set method overwriting existing', () => {
      const obj = { config: new Map([['theme', 'dark']]) }
      const result = updateIn(obj).config.set('theme', 'light')
      
      expect(result.config.get('theme')).toBe('light')
      expect(obj.config.get('theme')).toBe('dark') // Original unchanged
    })

    it('should support delete method', () => {
      const obj = { config: new Map<string, string | boolean>([['theme', 'dark'], ['debug', true]]) }
      const result = updateIn(obj).config.delete('debug')
      
      expect(result.config.has('debug')).toBe(false)
      expect(result.config.get('theme')).toBe('dark')
      expect(obj.config.has('debug')).toBe(true) // Original unchanged
    })

    it('should support delete method with non-existent key', () => {
      const obj = { config: new Map([['theme', 'dark']]) }
      const result = updateIn(obj).config.delete('nonexistent')
      
      expect(result.config).toEqual(new Map([['theme', 'dark']]))
    })

    it('should support clear method', () => {
      const obj = { config: new Map<string, string | boolean>([['theme', 'dark'], ['debug', true]]) }
      const result = updateIn(obj).config.clear()
      
      expect(result.config).toEqual(new Map())
      expect(obj.config.has('debug')).toBe(true) // Original unchanged
    })

    it('should work with nested Maps', () => {
      const obj = { data: { config: new Map<string, string | boolean>([['theme', 'dark']]) } }
      const result = updateIn(obj).data.config.set('debug', true)
      
      expect(result.data.config.get('debug')).toBe(true)
      expect(obj.data.config.has('debug')).toBe(false) // Original unchanged
    })

    it('should support chained Map operations in edit', () => {
      const obj = { config: new Map<string, string | boolean>([['theme', 'dark'], ['old', 'value']]) }
      
      const result = edit(obj, (draft) => {
        updateIn(draft).config.set('theme', 'light')
        updateIn(draft).config.set('debug', true)
        updateIn(draft).config.delete('old')
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
        config: new Map<string, string | boolean>([['theme', 'dark']])
      }
      
      const result = edit(obj, (draft) => {
        updateIn(draft).users.push('charlie')
        updateIn(draft).tags.add('moderator')
        updateIn(draft).config.set('debug', true)
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
            ['done', ['completed1']]
          ]),
          tags: new Set(['important'])
        }
      }
      
      const result = edit(obj, (draft) => {
        updateIn(draft).data.lists.key('todo').push('task3')
        updateIn(draft).data.tags.add('urgent')
      })
      
      expect(result.data.lists.get('todo')).toEqual(['task1', 'task2', 'task3'])
      expect(result.data.tags).toEqual(new Set(['important', 'urgent']))
      expect(obj.data.tags).toEqual(new Set(['important'])) // Original unchanged
    })

    it('should handle array of Sets', () => {
      const obj = {
        permissions: [
          new Set(['read', 'write']),
          new Set(['admin'])
        ]
      }
      
      const result = updateIn(obj).permissions[0].add('execute')
      
      expect(result.permissions[0]).toEqual(new Set(['read', 'write', 'execute']))
      expect(result.permissions[1]).toEqual(new Set(['admin']))
      expect(obj.permissions[1]).toEqual(new Set(['admin'])) // Original unchanged
    })

    it('should handle Map of arrays', () => {
      const obj = {
        groups: new Map([
          ['admins', ['alice', 'bob']],
          ['users', ['charlie']]
        ])
      }
      
      const result = updateIn(obj).groups.key('users').push('dave')
      
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
        map: originalMap 
      }
      
      const result = edit(obj, (draft) => {
        updateIn(draft).arr.push('c')
        updateIn(draft).set.add('z')
        updateIn(draft).map.set('new', 'data')
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
        tags: new Set(['react'])
      }
      
      const result = await edit(obj, async (draft) => {
        await new Promise(resolve => setTimeout(resolve, 1))
        updateIn(draft).items.push('c')
        updateIn(draft).tags.add('typescript')
      })
      
      expect(result.items).toEqual(['a', 'b', 'c'])
      expect(result.tags).toEqual(new Set(['react', 'typescript']))
      expect(obj.tags).toEqual(new Set(['react'])) // Original unchanged
    })
  })
})