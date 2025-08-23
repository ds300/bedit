import { expect, describe, it } from 'vitest'
import { create, createStore } from 'zustand'
import { patchable } from '../src/zustand.mjs'
import { setDevMode, patch } from '../src/patchfork.mjs'
import { $patchable } from '../src/symbols.mjs'

setDevMode(true)

interface TestState {
  count: number
  nested: {
    value: string
    items: number[]
  }
  users: Array<{ id: number; name: string }>
}

describe('patchforkify', () => {
  const createInitialState = (): TestState => ({
    count: 0,
    nested: {
      value: 'test',
      items: [1, 2, 3],
    },
    users: [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ],
  })

  describe('with zustand create()', () => {
    it('should preserve all original store methods and work with patchfork functions', () => {
      const originalStore = create(() => createInitialState())
      const wrappedStore = patchable(originalStore)

      // Preserve original methods
      expect(wrappedStore.getState).toBe(originalStore.getState)
      expect(wrappedStore.setState).toBe(originalStore.setState)
      expect(wrappedStore.subscribe).toBe(originalStore.subscribe)

      // Test basic patchfork functions work
      patch(wrappedStore).count(42)
      expect(wrappedStore.getState().count).toBe(42)

      patch(wrappedStore).nested.value((v) => v.toUpperCase())
      expect(wrappedStore.getState().nested.value).toBe('TEST')

      patch(wrappedStore).users.push({ id: 99, name: 'Test User' })
      expect(wrappedStore.getState().users).toHaveLength(3)
    })

    it('should have the patchfork state container symbol', () => {
      const store = create(() => createInitialState())
      const wrappedStore = patchable(store)

      expect($patchable in wrappedStore).toBe(true)
      expect(wrappedStore[$patchable]).toBeDefined()
      expect(typeof wrappedStore[$patchable].get).toBe('function')
      expect(typeof wrappedStore[$patchable].set).toBe('function')
    })
  })

  describe('with zustand createStore()', () => {
    it('should preserve all original store methods and work with patchfork functions', () => {
      const originalStore = createStore(() => createInitialState())
      const wrappedStore = patchable(originalStore)

      // Preserve original methods
      expect(wrappedStore.getState).toBe(originalStore.getState)
      expect(wrappedStore.setState).toBe(originalStore.setState)
      expect(wrappedStore.getInitialState).toBe(originalStore.getInitialState)

      // Test basic patchfork functions work
      patch(wrappedStore).count(99)
      expect(wrappedStore.getState().count).toBe(99)

      patch(wrappedStore).nested.items((items) => [...items, 10])
      expect(wrappedStore.getState().nested.items).toEqual([1, 2, 3, 10])
    })
  })
})
