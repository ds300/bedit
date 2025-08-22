import { describe, beforeEach, afterEach, test, expect } from 'vitest'
import { fork, setDevMode, key, patch } from '../src/patchfork.mjs'

describe('Dev Mode', () => {
  beforeEach(() => {
    setDevMode(true)
  })

  afterEach(() => {
    setDevMode(false)
  })

  test('should freeze objects after setIn when dev mode is enabled', () => {
    const obj = { a: 1, b: { c: 2 } }

    const result = fork(obj).a(3)

    expect(Object.isFrozen(result)).toBe(true)
    expect(Object.isFrozen(result.b)).toBe(true)
    expect(result.a).toBe(3)
  })

  test('should not freeze objects when dev mode is disabled', () => {
    const obj = { a: 1, b: { c: 2 } }

    setDevMode(false)
    const result = fork(obj).a(3)

    expect(Object.isFrozen(result)).toBe(false)
    expect(Object.isFrozen(result.b)).toBe(false)
    expect(result.a).toBe(3)
  })

  test('should freeze objects after updateIn when dev mode is enabled', () => {
    const obj = { a: 1, b: { c: 2 } }

    const result = fork(obj).a((x) => x + 1)

    expect(Object.isFrozen(result)).toBe(true)
    expect(Object.isFrozen(result.b)).toBe(true)
    expect(result.a).toBe(2)
  })

  test('should freeze objects after edit.batch when dev mode is enabled', () => {
    const obj = { a: 1, b: { c: 2 } }

    const result = fork.do(obj, (obj) => {
      obj.a = 3
    })

    expect(Object.isFrozen(result)).toBe(true)
    expect(Object.isFrozen(result.b)).toBe(true)
    expect(result.a).toBe(3)
  })

  test('should freeze objects after edit when dev mode is enabled', () => {
    const obj = { a: 1, b: { c: 2 } }

    const result = fork.do(obj, (draft) => {
      patch(draft).a(3)
      patch(draft).b.c(4)
    })

    expect(Object.isFrozen(result)).toBe(true)
    expect(Object.isFrozen(result.b)).toBe(true)
    expect(result.a).toBe(3)
    expect(result.b.c).toBe(4)
  })

  test('should not freeze non-objects', () => {
    const obj = { a: 1, b: 'string', c: 42, d: null, e: undefined }

    const result = fork(obj).a(3)

    expect(Object.isFrozen(result)).toBe(true)
    expect(result.b).toBe('string')
    expect(result.c).toBe(42)
    expect(result.d).toBe(null)
    expect(result.e).toBe(undefined)
  })

  test('should handle arrays correctly', () => {
    const arr = [1 as number, 2, { a: 3 }] as Array<number | { a: number }>

    const result = fork(arr)[0](10)

    expect(Object.isFrozen(result)).toBe(true)
    expect(Object.isFrozen(result[2])).toBe(true)
    expect(result[0]).toBe(10)
    expect(result[1]).toBe(2)
    expect(result[2]).toEqual({ a: 3 })
  })

  test('should freeze Map values in dev mode', () => {
    const map = new Map([
      ['key1', { value: 1 }],
      ['key2', { value: 2 }],
    ])

    const result = fork(map)[key]('key1')({ value: 3 })

    expect(Object.isFrozen(result)).toBe(true)
    // Check that Map keys are frozen
    for (const [key, value] of result) {
      expect(Object.isFrozen(key)).toBe(true)
      expect(Object.isFrozen(value)).toBe(true)
    }
    expect(result.get('key1')).toEqual({ value: 3 })
  })

  test('should freeze nested Maps in dev mode', () => {
    const obj = {
      config: new Map([
        ['theme', { color: 'dark' }],
        ['debug', { enabled: true }],
      ]),
    }

    const result = fork(obj).config[key]('theme')({ color: 'light' })

    expect(Object.isFrozen(result)).toBe(true)
    expect(Object.isFrozen(result.config)).toBe(true)

    // Check that Map keys and values are frozen
    for (const [key, value] of result.config) {
      expect(Object.isFrozen(key)).toBe(true)
      expect(Object.isFrozen(value)).toBe(true)
    }
  })

  test('should handle Map and Set updates in dev mode', () => {
    const obj = {
      config: new Map([
        ['theme', 'dark'],
        ['debug', 'false'],
      ]),
      tags: new Set(['react', 'typescript']),
    }

    const result = fork(obj).config[key]('theme')((theme) =>
      theme.toUpperCase(),
    )!

    expect(Object.isFrozen(result)).toBe(true)
    expect(Object.isFrozen(result.config)).toBe(true)
    expect(Object.isFrozen(result.tags)).toBe(true)

    // Check Map keys and values are frozen
    for (const [key, value] of result.config) {
      expect(Object.isFrozen(key)).toBe(true)
      expect(Object.isFrozen(value)).toBe(true)
    }

    // Check Set values are frozen
    for (const value of result.tags) {
      expect(Object.isFrozen(value)).toBe(true)
    }
  })

  test('should handle Map and Set mutations in dev mode', () => {
    const obj = {
      config: new Map([['theme', { color: 'dark' }]]),
      tags: new Set(['react']),
    }

    const result = fork.do(obj, (draft) => {
      patch(draft).config[key]('debug')({ color: 'light' })
      patch(draft).tags.add('typescript')
    })

    expect(Object.isFrozen(result)).toBe(true)
    expect(Object.isFrozen(result.config)).toBe(true)
    expect(Object.isFrozen(result.tags)).toBe(true)

    // Check that all Map keys and values are frozen
    for (const [key, value] of result.config) {
      expect(Object.isFrozen(key)).toBe(true)
      expect(Object.isFrozen(value)).toBe(true)
    }

    // Check that all Set values are frozen
    for (const value of result.tags) {
      expect(Object.isFrozen(value)).toBe(true)
    }
  })

  test('should modify Map values when freezing in dev mode', () => {
    const map = new Map([['key', { nested: { value: 1 } }]])
    const obj = { map }

    const result = fork(obj).map[key]('key')({ nested: { value: 2 } })

    expect(Object.isFrozen(result.map.get('key'))).toBe(true)
    expect(result.map.get('key')).toEqual({ nested: { value: 2 } })
  })

  test('should freeze all cloned objects in batch operations', () => {
    const obj = { a: { nested: 1 }, b: { nested: 2 } }

    const result = fork.do(obj, (draft) => {
      patch(draft).a({ nested: 10 })
      patch(draft).b({ nested: 20 })
    })

    expect(Object.isFrozen(result)).toBe(true)
    expect(Object.isFrozen(result.a)).toBe(true)
    expect(Object.isFrozen(result.b)).toBe(true)
    expect(result.a.nested).toBe(10)
    expect(result.b.nested).toBe(20)
  })

  test('should handle complex batch object freezing scenarios', () => {
    const obj = {
      users: [{ name: 'John', profile: { age: 30 } }],
      settings: new Map([['theme', { color: 'dark', size: 'medium' }]]),
      tags: new Set([{ id: 1, name: 'important' }]),
    }

    const result = fork.do(obj, (draft) => {
      // Use setIn instead of edit.batch to avoid readonly issues
      patch(draft).users[0]({ name: 'Jane', profile: { age: 31 } })
      patch(draft).settings[key]('theme')({ color: 'light', size: 'medium' })

      // For Set, use proper patchfork operations
      const newTags = new Set([{ id: 2, name: 'urgent' }])
      patch(draft).tags(newTags)
    })

    // Everything should be frozen
    expect(Object.isFrozen(result)).toBe(true)
    expect(Object.isFrozen(result.users[0])).toBe(true)
    expect(Object.isFrozen(result.users[0].profile)).toBe(true)
    expect(Object.isFrozen(result.settings.get('theme'))).toBe(true)

    // Verify mutations worked
    expect(result.users[0].name).toBe('Jane')
    expect(result.users[0].profile.age).toBe(31)
    expect(result.settings.get('theme')?.color).toBe('light')
    expect([...result.tags]).toEqual([{ id: 2, name: 'urgent' }])
  })
})
