import { expect, describe, it } from 'vitest'
import { create, createStore } from 'zustand'
import { beditify } from '../src/zustand.mjs'
import { setIn, updateIn, addIn, setDevMode } from '../src/bedit.mjs'
import { $beditStateContainer } from '../src/symbols.mjs'

setDevMode(true)

interface TestState {
  count: number
  nested: {
    value: string
    items: number[]
  }
  users: Array<{ id: number; name: string }>
}

describe('beditify', () => {
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
    it('should preserve all original store methods and work with bedit functions', () => {
      const originalStore = create(() => createInitialState())
      const wrappedStore = beditify(originalStore)

      // Preserve original methods
      expect(wrappedStore.getState).toBe(originalStore.getState)
      expect(wrappedStore.setState).toBe(originalStore.setState)
      expect(wrappedStore.subscribe).toBe(originalStore.subscribe)

      // Test basic bedit functions work
      setIn(wrappedStore).count(42)
      expect(wrappedStore.getState().count).toBe(42)

      updateIn(wrappedStore).nested.value((v) => v.toUpperCase())
      expect(wrappedStore.getState().nested.value).toBe('TEST')

      addIn(wrappedStore).users({ id: 99, name: 'Test User' })
      expect(wrappedStore.getState().users).toHaveLength(3)
    })

    it('should have the bedit state container symbol', () => {
      const store = create(() => createInitialState())
      const wrappedStore = beditify(store)

      expect($beditStateContainer in wrappedStore).toBe(true)
      expect(wrappedStore[$beditStateContainer]).toBeDefined()
      expect(typeof wrappedStore[$beditStateContainer].get).toBe('function')
      expect(typeof wrappedStore[$beditStateContainer].set).toBe('function')
    })
  })

  describe('with zustand createStore()', () => {
    it('should preserve all original store methods and work with bedit functions', () => {
      const originalStore = createStore(() => createInitialState())
      const wrappedStore = beditify(originalStore)

      // Preserve original methods
      expect(wrappedStore.getState).toBe(originalStore.getState)
      expect(wrappedStore.setState).toBe(originalStore.setState)
      expect(wrappedStore.getInitialState).toBe(originalStore.getInitialState)

      // Test basic bedit functions work
      setIn(wrappedStore).count(99)
      expect(wrappedStore.getState().count).toBe(99)

      updateIn(wrappedStore).nested.items((items) => [...items, 10])
      expect(wrappedStore.getState().nested.items).toEqual([1, 2, 3, 10])
    })
  })
})
