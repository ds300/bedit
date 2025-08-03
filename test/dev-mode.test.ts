import { describe, beforeEach, afterEach, test, expect } from 'vitest'
import {
  setIn,
  updateIn,
  deepMutateIn,
  mutateIn,
  batchEdits,
  setDevMode,
} from '../bedit.mts'

describe('Dev Mode', () => {
  beforeEach(() => {
    setDevMode(true)
  })

  afterEach(() => {
    setDevMode(false)
  })

  test('should freeze objects after setIn when dev mode is enabled', () => {
    const obj = { a: 1, b: { c: 2 } }

    const result = setIn(obj).a(3)

    expect(Object.isFrozen(result)).toBe(true)
    expect(Object.isFrozen(result.b)).toBe(true)
    expect(result.a).toBe(3)
  })

  test('should not freeze objects when dev mode is disabled', () => {
    const obj = { a: 1, b: { c: 2 } }

    setDevMode(false)
    const result = setIn(obj).a(3)

    expect(Object.isFrozen(result)).toBe(false)
    expect(Object.isFrozen(result.b)).toBe(false)
    expect(result.a).toBe(3)
  })

  test('should freeze objects after updateIn when dev mode is enabled', () => {
    const obj = { a: 1, b: { c: 2 } }

    const result = updateIn(obj).a((x) => x + 1)

    expect(Object.isFrozen(result)).toBe(true)
    expect(Object.isFrozen(result.b)).toBe(true)
    expect(result.a).toBe(2)
  })

  test('should freeze objects after mutateIn when dev mode is enabled', () => {
    const obj = { a: 1, b: { c: 2 } }

    const result = deepMutateIn(obj).a((x) => 3)

    expect(Object.isFrozen(result)).toBe(true)
    expect(Object.isFrozen(result.b)).toBe(true)
    expect(result.a).toBe(3)
  })

  test('should freeze objects after mutateIn when dev mode is enabled', () => {
    const obj = { a: 1, b: { c: 2 } }

    const result = mutateIn(obj).a((x) => {
      return 3
    })

    expect(Object.isFrozen(result)).toBe(true)
    expect(Object.isFrozen(result.b)).toBe(true)
    expect(result.a).toBe(3)
  })

  test('should freeze objects after batchEdits when dev mode is enabled', () => {
    const obj = { a: 1, b: { c: 2 } }

    const result = batchEdits(obj, (draft) => {
      setIn(draft).a(3)
      setIn(draft).b.c(4)
    })

    expect(Object.isFrozen(result)).toBe(true)
    expect(Object.isFrozen(result.b)).toBe(true)
    expect(result.a).toBe(3)
    expect(result.b.c).toBe(4)
  })

  test('should not freeze non-objects', () => {
    const obj = { a: 1, b: 'string', c: 42, d: null, e: undefined }

    const result = setIn(obj).a(3)

    expect(Object.isFrozen(result)).toBe(true)
    expect(result.b).toBe('string')
    expect(result.c).toBe(42)
    expect(result.d).toBe(null)
    expect(result.e).toBe(undefined)
  })

  test('should handle arrays correctly', () => {
    const arr = [1 as number, 2, { a: 3 }] as const

    const result = setIn(arr)[0](10)

    expect(Object.isFrozen(result)).toBe(true)
    expect(Object.isFrozen(result[2])).toBe(true)
    expect(result[0]).toBe(10)
    expect(result[1]).toBe(2)
    expect(result[2].a).toBe(3)
  })

  test('should freeze Map keys and values in dev mode', () => {
    const map = new Map([
      ['key1', { value: 1 }],
      ['key2', { value: 2 }],
    ])

    const result = setIn(map).key('key1')({ value: 3 })

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

    const result = setIn(obj).config.key('theme')({ color: 'light' })

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

    const result = updateIn(obj).config.key('theme')((theme) =>
      theme.toUpperCase(),
    )

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

    const result = deepMutateIn(obj)((draft) => {
      draft.config.set('debug', { color: 'light' })
      draft.tags.add('typescript')
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
})
