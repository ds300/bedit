import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { setIn, updateIn, editIn, deleteIn, addIn, setDevMode } from '../src/bedit.mjs'

describe('Map/Set error handling', () => {
  beforeEach(() => {
    setDevMode(true)
  })

  afterEach(() => {
    setDevMode(false)
  })

  it('should throw error for invalid Map property access with setIn', () => {
    const obj = { data: new Map([['key', 'value']]) }
    expect(() => {
      // @ts-expect-error
      setIn(obj).data.invalidProp('test')
    }).toThrow('Cannot edit property "invalidProp" of Map or Set. Use .key() instead.')
  })
  
  it('should throw error for invalid Set property access with setIn', () => {
    const obj = { tags: new Set(['tag1']) }
    expect(() => {
      // @ts-expect-error
      setIn(obj).tags.invalidProp('test')
    }).toThrow('Cannot edit property "invalidProp" of Map or Set. Use .key() instead.')
  })

  it('should throw error for invalid Map property access with updateIn', () => {
    const obj = { config: new Map([['theme', 'dark']]) }
    expect(() => {
      // @ts-expect-error
      updateIn(obj).config.theme((theme) => theme.toUpperCase())
    }).toThrow('Cannot edit property "theme" of Map or Set. Use .key() instead.')
  })

  it('should throw error for invalid Set property access with updateIn', () => {
    const obj = { tags: new Set(['react', 'typescript']) }
    expect(() => {
      // @ts-expect-error
      updateIn(obj).tags.size((size) => size + 1)
    }).toThrow('Cannot edit property "size" of Map or Set. Use .key() instead.')
  })

  it('should throw error for invalid Map property access with editIn', () => {
    const obj = { cache: new Map([['user1', { name: 'John' }]]) }
    expect(() => {
      // @ts-expect-error
      editIn(obj).cache.user1((user) => {
        user.name = 'Jane'
        return user
      })
    }).toThrow('Cannot edit property "user1" of Map or Set. Use .key() instead.')
  })

  it('should throw error for invalid Set property access with editIn', () => {
    const obj = { permissions: new Set(['read', 'write']) }
    expect(() => {
      // @ts-expect-error
      editIn(obj).permissions.add('admin')
    }).toThrow('Cannot edit property "add" of Map or Set. Use .key() instead.')
  })

  it('should throw error for invalid Map property access with deleteIn', () => {
    const obj = { settings: new Map([['debug', true], ['verbose', false]]) }
    expect(() => {
      // @ts-expect-error
      deleteIn(obj).settings.debug()
    }).toThrow('Cannot edit property "debug" of Map or Set. Use .key() instead.')
  })

  it('should throw error for invalid Set property access with deleteIn', () => {
    const obj = { features: new Set(['auth', 'payments', 'analytics']) }
    expect(() => {
      // @ts-expect-error
      deleteIn(obj).features.auth()
    }).toThrow('Cannot edit property "auth" of Map or Set. Use .key() instead.')
  })

  it('should work correctly with proper .key() usage on Maps', () => {
    const obj = { data: new Map([['key1', 'value1']]) }
    
    // These should all work properly
    const result1 = setIn(obj).data.key('key2')('value2')
    expect(result1.data.get('key2')).toBe('value2')
    
    const result2 = updateIn(obj).data.key('key1')((val) => val.toUpperCase())
    expect(result2.data.get('key1')).toBe('VALUE1')
    
    const result3 = deleteIn(obj).data.key('key1')()
    expect(result3.data.has('key1')).toBe(false)
  })

  it('should work correctly with proper .key() usage on Sets', () => {
    const obj = { tags: new Set(['react', 'vue']) }
    
    // These should all work properly
    const result1 = addIn(obj).tags('angular')
    expect(result1.tags.has('angular')).toBe(true)
    
    const result2 = deleteIn(obj).tags.key('vue')()
    expect(result2.tags.has('vue')).toBe(false)
    expect(result2.tags.has('react')).toBe(true)
  })

  it('should handle nested Map/Set error scenarios', () => {
    const obj = { 
      config: { 
        cache: new Map([
          ['users', new Set(['user1', 'user2'])],
          ['settings', new Map([['theme', 'dark']])]
        ]) 
      } 
    }
    
    // Invalid nested Map access
    expect(() => {
      // @ts-expect-error
      setIn(obj).config.cache.users('user3')
    }).toThrow('Cannot edit property "users" of Map or Set. Use .key() instead.')
    
    // Invalid nested Set access
    expect(() => {
      // @ts-expect-error
      setIn(obj).config.cache.key('users').add('user3')
    }).toThrow('Cannot edit property "add" of Map or Set. Use .key() instead.')
  })

  it('should handle errors with symbol properties', () => {
    const symbolKey = Symbol('test')
    const obj = { data: new Map([[symbolKey, 'value']]) }
    
    expect(() => {
      // @ts-expect-error
      setIn(obj).data[symbolKey]('new value')
    }).toThrow('Cannot edit property "Symbol(test)" of Map or Set. Use .key() instead.')
  })

  it('should handle errors with numeric property access on Maps', () => {
    const obj = { items: new Map([['0', 'first'], ['1', 'second']]) }
    
    expect(() => {
      // @ts-expect-error
      setIn(obj).items[0]('updated')
    }).toThrow('Cannot edit property "0" of Map or Set. Use .key() instead.')
  })
})