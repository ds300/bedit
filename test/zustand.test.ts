import { expect, describe, it } from 'vitest'
import { create, createStore } from 'zustand'
import { beditify } from '../src/zustand.mjs'
import {
  setIn,
  updateIn,
  deleteIn,
  addIn,
  setDevMode,
} from '../src/bedit.mjs'

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
  const initialState: TestState = {
    count: 0,
    nested: {
      value: 'test',
      items: [1, 2, 3],
    },
    users: [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ],
  }

  describe('with zustand create()', () => {
    it('should preserve all original store methods and properties', () => {
      const originalStore = create(() => initialState)
      const wrappedStore = beditify(originalStore)

      expect(wrappedStore.getState).toBe(originalStore.getState)
      expect(wrappedStore.setState).toBe(originalStore.setState)
      expect(wrappedStore.subscribe).toBe(originalStore.subscribe)
    })

    it('should work with setIn', () => {
      const store = create(() => initialState)
      const wrappedStore = beditify(store)

      setIn(wrappedStore).count(42)
      expect(wrappedStore.getState().count).toBe(42)

      setIn(wrappedStore).nested.value('updated')
      expect(wrappedStore.getState().nested.value).toBe('updated')
    })

    it('should work with updateIn', () => {
      const store = create(() => initialState)
      const wrappedStore = beditify(store)

      updateIn(wrappedStore).count((c) => c + 10)
      expect(wrappedStore.getState().count).toBe(10)

      updateIn(wrappedStore).nested.value((v) => v.toUpperCase())
      expect(wrappedStore.getState().nested.value).toBe('TEST')
    })

    it('should work with addIn', () => {
      const store = create(() => initialState)
      const wrappedStore = beditify(store)

      addIn(wrappedStore).nested.items(4, 5)
      expect(wrappedStore.getState().nested.items).toEqual([1, 2, 3, 4, 5])
    })

    it('should work with deleteIn', () => {
      const store = create(() => initialState)
      const wrappedStore = beditify(store)

      expect(wrappedStore.getState().nested).toHaveProperty('value')
      // Test deleteIn on a nested property instead
      deleteIn(wrappedStore).nested.value()
      expect(wrappedStore.getState().nested).not.toHaveProperty('value')
    })
  })

  describe('with zustand createStore()', () => {
    it('should preserve all original store methods and properties', () => {
      const originalStore = createStore(() => initialState)
      const wrappedStore = beditify(originalStore)

      expect(wrappedStore.getState).toBe(originalStore.getState)
      expect(wrappedStore.setState).toBe(originalStore.setState)
      expect(wrappedStore.getInitialState).toBe(originalStore.getInitialState)
    })

    it('should work with bedit functions', () => {
      const store = createStore(() => initialState)
      const wrappedStore = beditify(store)

      setIn(wrappedStore).count(99)
      expect(wrappedStore.getState().count).toBe(99)

      updateIn(wrappedStore).nested.items((items) => [...items, 10])
      expect(wrappedStore.getState().nested.items).toEqual([1, 2, 3, 10])
    })
  })

  describe('state container integration', () => {
    it('should have the bedit state container symbol', () => {
      const store = create(() => initialState)
      const wrappedStore = beditify(store)

      const symbol = Symbol.for('__bedit_state_container__')
      expect(symbol in wrappedStore).toBe(true)
      expect(wrappedStore[symbol]).toBeDefined()
      expect(typeof wrappedStore[symbol].get).toBe('function')
      expect(typeof wrappedStore[symbol].set).toBe('function')
    })

    it('should work seamlessly with all bedit functions', () => {
      // Create fresh initial state to avoid interference from other tests
      const freshInitialState: TestState = {
        count: 0,
        nested: {
          value: 'test',
          items: [1, 2, 3],
        },
        users: [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' },
        ],
      }

      const store = create(() => freshInitialState)
      const wrappedStore = beditify(store)

      // Chain multiple operations
      setIn(wrappedStore).count(10)
      updateIn(wrappedStore).nested.value((v) => v + '!')
      addIn(wrappedStore).users({ id: 99, name: 'Test User' })

      const finalState = wrappedStore.getState()
      expect(finalState.count).toBe(10)
      expect(finalState.nested.value).toBe('test!')
      expect(finalState.users).toHaveLength(3)
      expect(finalState.users[2]).toEqual({ id: 99, name: 'Test User' })
    })
  })

  describe('mutator functions', () => {
    it('should create mutator functions with proper type inference', () => {
      const store = create(() => initialState)
      
      const wrappedStore = beditify(store, {
        increment(draft, n: number) {
          draft.count += n
        },
        updateValue(draft, newValue: string) {
          setIn(draft).nested.value(newValue)
        },
        addUser(draft, name: string, id: number) {
          addIn(draft).users({ id, name })
        },
        resetCount(draft) {
          draft.count = 0
        }
      })

      // Test increment function
      wrappedStore.increment(5)
      expect(wrappedStore.getState().count).toBe(5)
      
      wrappedStore.increment(10)
      expect(wrappedStore.getState().count).toBe(15)

      // Test updateValue function
      wrappedStore.updateValue('new value')
      expect(wrappedStore.getState().nested.value).toBe('new value')

      // Test addUser function
      wrappedStore.addUser('Charlie', 3)
      expect(wrappedStore.getState().users).toHaveLength(3)
      expect(wrappedStore.getState().users[2]).toEqual({ id: 3, name: 'Charlie' })

      // Test resetCount function (no arguments)
      wrappedStore.resetCount()
      expect(wrappedStore.getState().count).toBe(0)
    })

    it('should preserve original store methods and properties', () => {
      const originalStore = create(() => initialState)
      const wrappedStore = beditify(originalStore, {
        increment(draft, n: number) {
          draft.count += n
        }
      })

      expect(wrappedStore.getState).toBe(originalStore.getState)
      expect(wrappedStore.setState).toBe(originalStore.setState)
      expect(wrappedStore.subscribe).toBe(originalStore.subscribe)
    })

    it('should work with complex nested mutations using bedit functions', () => {
      const store = create(() => initialState)
      
      const wrappedStore = beditify(store, {
        complexUpdate(draft, multiplier: number, suffix: string) {
          updateIn(draft).count((c) => c * multiplier)
          updateIn(draft).nested.value((v) => v + suffix)
          addIn(draft).nested.items(99)
          setIn(draft).users[0].name('Updated Alice')
        }
      })

      wrappedStore.complexUpdate(3, '!!!')
      
      const state = wrappedStore.getState()
      expect(state.count).toBe(0) // 0 * 3 = 0
      expect(state.nested.value).toBe('test!!!')
      expect(state.nested.items).toEqual([1, 2, 3, 99])
      expect(state.users[0].name).toBe('Updated Alice')
    })

    it('should work with createStore as well', () => {
      const store = createStore(() => initialState)
      
      const wrappedStore = beditify(store, {
        doubleCount(draft) {
          updateIn(draft).count((c) => c * 2)
        }
      })

      setIn(wrappedStore).count(5)
      wrappedStore.doubleCount()
      expect(wrappedStore.getState().count).toBe(10)
    })
  })
})
