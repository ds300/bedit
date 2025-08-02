import { describe, beforeEach, afterEach, test, expect } from 'vitest'
import {
  setIn,
  updateIn,
  mutateIn,
  shallowMutateIn,
  batchEdits,
  enableDevMode,
  disableDevMode,
  isDevModeEnabled,
} from './index'

describe('Dev Mode', () => {
  beforeEach(() => {
    disableDevMode()
  })

  afterEach(() => {
    disableDevMode()
  })

  test('should enable and disable dev mode', () => {
    expect(isDevModeEnabled()).toBe(false)

    enableDevMode()
    expect(isDevModeEnabled()).toBe(true)

    disableDevMode()
    expect(isDevModeEnabled()).toBe(false)
  })

  test('should freeze objects after setIn when dev mode is enabled', () => {
    const obj = { a: 1, b: { c: 2 } }

    enableDevMode()
    const result = setIn(obj).a(3)

    expect(Object.isFrozen(result)).toBe(true)
    expect(Object.isFrozen(result.b)).toBe(true)
    expect(result.a).toBe(3)
  })

  test('should not freeze objects when dev mode is disabled', () => {
    const obj = { a: 1, b: { c: 2 } }

    disableDevMode()
    const result = setIn(obj).a(3)

    expect(Object.isFrozen(result)).toBe(false)
    expect(Object.isFrozen(result.b)).toBe(false)
    expect(result.a).toBe(3)
  })

  test('should freeze objects after updateIn when dev mode is enabled', () => {
    const obj = { a: 1, b: { c: 2 } }

    enableDevMode()
    const result = updateIn(obj).a((x) => x + 1)

    expect(Object.isFrozen(result)).toBe(true)
    expect(Object.isFrozen(result.b)).toBe(true)
    expect(result.a).toBe(2)
  })

  test('should freeze objects after mutateIn when dev mode is enabled', () => {
    const obj = { a: 1, b: { c: 2 } }

    enableDevMode()
    const result = mutateIn(obj).a((x) => 3)

    expect(Object.isFrozen(result)).toBe(true)
    expect(Object.isFrozen(result.b)).toBe(true)
    expect(result.a).toBe(3)
  })

  test('should freeze objects after shallowMutateIn when dev mode is enabled', () => {
    const obj = { a: 1, b: { c: 2 } }

    enableDevMode()
    const result = shallowMutateIn(obj).a((x) => {
      return 3
    })

    expect(Object.isFrozen(result)).toBe(true)
    expect(Object.isFrozen(result.b)).toBe(true)
    expect(result.a).toBe(3)
  })

  test('should freeze objects after batchEdits when dev mode is enabled', () => {
    const obj = { a: 1, b: { c: 2 } }

    enableDevMode()
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

    enableDevMode()
    const result = setIn(obj).a(3)

    expect(Object.isFrozen(result)).toBe(true)
    expect(result.b).toBe('string')
    expect(result.c).toBe(42)
    expect(result.d).toBe(null)
    expect(result.e).toBe(undefined)
  })

  test('should handle arrays correctly', () => {
    const arr = [1 as number, 2, { a: 3 }] as const

    enableDevMode()
    const result = setIn(arr)[0](10)

    expect(Object.isFrozen(result)).toBe(true)
    expect(Object.isFrozen(result[2])).toBe(true)
    expect(result[0]).toBe(10)
    expect(result[1]).toBe(2)
    expect(result[2].a).toBe(3)
  })
})
