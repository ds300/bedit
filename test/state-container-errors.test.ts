import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  setIn,
  updateIn,
  editIn,
  edit,
  setDevMode,
  key,
} from '../src/bedit.mjs'
import { $beditStateContainer } from '../src/symbols.mjs'

describe('state container error handling', () => {
  beforeEach(() => {
    setDevMode(true)
  })

  afterEach(() => {
    setDevMode(false)
  })

  it('should handle state container get() errors', () => {
    const container = {
      get: (): { prop: string } => {
        throw new Error('Get error')
      },
      set: vi.fn<[{ prop: string }], void>(),
    }
    const obj = { [$beditStateContainer]: container }

    expect(() => setIn(obj).prop('value')).toThrow('Get error')
    expect(container.set).not.toHaveBeenCalled()
  })

  it('should handle state container set() errors', () => {
    const originalState = { prop: 'initial' }
    const container = {
      get: () => originalState,
      set: () => {
        throw new Error('Set error')
      },
    }
    const obj = { [$beditStateContainer]: container }

    expect(() => setIn(obj).prop('value')).toThrow('Set error')
  })

  it('should handle state container get() returning null', () => {
    const container = {
      get: () => null,
      set: vi.fn(),
    }
    const obj = { [$beditStateContainer]: container }

    // @ts-expect-error
    const result = setIn(obj).prop('value')

    expect(result).toBeUndefined()
    expect(container.set).not.toHaveBeenCalled()
  })

  it('should handle state container get() returning undefined', () => {
    const container = {
      get: () => undefined,
      set: vi.fn(),
    }
    const obj = { [$beditStateContainer]: container }

    // @ts-expect-error
    const result = setIn(obj).prop('value')

    expect(result).toBeUndefined()
    expect(container.set).not.toHaveBeenCalled()
  })

  it('should handle state container get() returning non-object', () => {
    const container = {
      get: () => 'not an object',
      set: vi.fn(),
    }
    const obj = { [$beditStateContainer]: container }

    expect(() => {
      // @ts-expect-error
      setIn(obj).prop('value')
    }).toThrow('Cannot edit property "prop" of string')
  })

  it('should handle async state container operations with errors', async () => {
    const container = {
      get: () => ({ value: 1 }),
      set: () => {
        throw new Error('Async set error')
      },
    }
    const obj = { [$beditStateContainer]: container }

    await expect(async () => {
      await editIn(obj)(async (draft) => {
        await new Promise((resolve) => setTimeout(resolve, 1))
        draft.value += 1
      })
    }).rejects.toThrow('Async set error')
  })

  it('should handle state container with complex nested operations', () => {
    let state = { user: { name: 'John', profile: { age: 30 } } }
    const container = {
      get: () => state,
      set: (newState: typeof state) => {
        if (newState.user.name === 'Error') {
          throw new Error('Invalid name')
        }
        state = newState
      },
    }
    const obj = { [$beditStateContainer]: container }

    // This should work
    const result1 = setIn(obj).user.name('Jane')
    expect(result1.user.name).toBe('Jane')
    expect(state.user.name).toBe('Jane')

    // This should throw
    expect(() => {
      setIn(obj).user.name('Error')
    }).toThrow('Invalid name')
  })

  it('should handle state container errors in batch operations', () => {
    let callCount = 0
    const container = {
      get: () => ({ a: 1, b: 2 }),
      set: () => {
        callCount++
        if (callCount > 1) {
          throw new Error('Multiple set calls not allowed')
        }
      },
    }
    const obj = { [$beditStateContainer]: container }

    // Batch operations should only call set once
    const result = edit(obj, (draft) => {
      setIn(draft).a(10)
      setIn(draft).b(20)
    })

    expect(result).toEqual({ a: 10, b: 20 })
    expect(callCount).toBe(1)
  })

  it('should handle state container with Map and Set operations', () => {
    let state = {
      cache: new Map([['key1', 'value1']]),
      tags: new Set(['tag1']),
    }
    const container = {
      get: () => state,
      set: (newState: typeof state) => {
        if (newState.cache.size > 5) {
          throw new Error('Cache size limit exceeded')
        }
        state = newState
      },
    }
    const obj = { [$beditStateContainer]: container }

    // This should work
    const result1 = setIn(obj).cache[key]('key2')('value2')
    expect(result1.cache.get('key2')).toBe('value2')
    expect(state.cache.get('key2')).toBe('value2')

    // Add more items to test the limit
    for (let i = 3; i <= 5; i++) {
      setIn(obj).cache[key](`key${i}`)(`value${i}`)
    }

    // This should throw (exceeds limit)
    expect(() => {
      setIn(obj).cache[key]('key6')('value6')
    }).toThrow('Cache size limit exceeded')
  })

  it('should handle state container errors with updateIn operations', () => {
    const container = {
      get: () => ({ count: 5 }),
      set: (newState: { count: number }) => {
        if (newState.count < 0) {
          throw new Error('Count cannot be negative')
        }
      },
    }
    const obj = { [$beditStateContainer]: container }

    // This should work
    const result1 = updateIn(obj).count((count) => count + 1)
    expect(result1.count).toBe(6)

    // This should throw
    expect(() => {
      updateIn(obj).count((count) => -1)
    }).toThrow('Count cannot be negative')
  })
})
