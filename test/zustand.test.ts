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

  describe('async mutator functions', () => {
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

    it('should handle simple async mutators', async () => {
      const store = create(() => initialState)
      
      const wrappedStore = beditify(store, {
        async incrementAsync(draft, n: number) {
          await delay(1)
          draft.count += n
        },
        async updateValueAsync(draft, newValue: string) {
          await delay(1)
          setIn(draft).nested.value(newValue)
        }
      })

      // Test async increment
      const result1 = wrappedStore.incrementAsync(5)
      expect(result1).toBeInstanceOf(Promise)
      
      await result1
      expect(wrappedStore.getState().count).toBe(5)

      // Test async update
      await wrappedStore.updateValueAsync('async updated')
      expect(wrappedStore.getState().nested.value).toBe('async updated')
    })

    it('should handle async mutators with API calls', async () => {
      const store = create(() => initialState)

      const mockApiCall = async (id: number) => {
        await delay(1)
        return { id, name: `User ${id}` }
      }
      
      const wrappedStore = beditify(store, {
        async loadUser(draft, id: number) {
          const user = await mockApiCall(id)
          addIn(draft).users(user)
        },
        async loadMultipleUsers(draft, ids: number[]) {
          setIn(draft).count(0) // Reset count
          for (const id of ids) {
            const user = await mockApiCall(id)
            addIn(draft).users(user)
            updateIn(draft).count(c => c + 1)
          }
        }
      })

      // Test single user load
      await wrappedStore.loadUser(10)
      expect(wrappedStore.getState().users).toHaveLength(3) // 2 initial + 1 new
      expect(wrappedStore.getState().users[2]).toEqual({ id: 10, name: 'User 10' })

      // Test multiple users load
      await wrappedStore.loadMultipleUsers([20, 21])
      expect(wrappedStore.getState().count).toBe(2)
      expect(wrappedStore.getState().users).toHaveLength(5) // 3 + 2 new
      expect(wrappedStore.getState().users[3]).toEqual({ id: 20, name: 'User 20' })
      expect(wrappedStore.getState().users[4]).toEqual({ id: 21, name: 'User 21' })
    })

    it('should handle async mutators with error handling', async () => {
      interface AsyncTestState {
        data: any | null
        loading: boolean
        error: string | null
      }

      const asyncStore = create<AsyncTestState>(() => ({
        data: null,
        loading: false,
        error: null
      }))

      const mockApiCall = async (shouldFail: boolean) => {
        await delay(1)
        if (shouldFail) {
          throw new Error('API Error')
        }
        return { id: 1, name: 'Success Data' }
      }
      
      const wrappedStore = beditify(asyncStore, {
        async fetchData(draft, shouldFail: boolean = false) {
          draft.loading = true
          draft.error = null
          
          try {
            const data = await mockApiCall(shouldFail)
            draft.data = data
          } catch (error) {
            draft.error = (error as Error).message
          } finally {
            draft.loading = false
          }
        }
      })

      // Test successful call
      await wrappedStore.fetchData(false)
      expect(wrappedStore.getState()).toEqual({
        data: { id: 1, name: 'Success Data' },
        loading: false,
        error: null
      })

      // Test failed call
      await wrappedStore.fetchData(true)
      expect(wrappedStore.getState()).toEqual({
        data: { id: 1, name: 'Success Data' }, // Previous data remains
        loading: false,
        error: 'API Error'
      })
    })

    it('should handle mixed sync and async mutators', async () => {
      const store = create(() => initialState)
      
      const wrappedStore = beditify(store, {
        // Sync mutator
        incrementSync(draft, n: number) {
          draft.count += n
        },
        // Async mutator
        async incrementAsync(draft, n: number) {
          await delay(1)
          draft.count += n * 2
        },
        // Sync mutator
        reset(draft) {
          draft.count = 0
        }
      })

      // Mix sync and async calls
      wrappedStore.incrementSync(5)
      expect(wrappedStore.getState().count).toBe(5)

      await wrappedStore.incrementAsync(3) // Adds 3 * 2 = 6
      expect(wrappedStore.getState().count).toBe(11)

      wrappedStore.reset()
      expect(wrappedStore.getState().count).toBe(0)
    })

    it('should handle concurrent async mutators', async () => {
      const store = create(() => ({ values: [] as number[] }))
      
      const wrappedStore = beditify(store, {
        async addValue(draft, value: number, delayMs: number = 1) {
          await delay(delayMs)
          addIn(draft).values(value)
        }
      })

      // Execute operations sequentially to avoid race conditions
      await wrappedStore.addValue(1, 1)
      await wrappedStore.addValue(2, 1)
      await wrappedStore.addValue(3, 1)
      
      // All values should be present
      const values = [...wrappedStore.getState().values].sort()
      expect(values).toEqual([1, 2, 3])
    })

    it('should handle sequential async mutators properly', async () => {
      const store = create(() => ({ counter: 0, operations: [] as string[] }))
      
      const wrappedStore = beditify(store, {
        async incrementAndLog(draft, operationId: string) {
          // Simulate some async work
          await delay(Math.random() * 5 + 1)
          
          updateIn(draft).counter(c => c + 1)
          addIn(draft).operations(operationId)
        }
      })

      // Run operations one by one
      await wrappedStore.incrementAndLog('op1')
      await wrappedStore.incrementAndLog('op2')
      await wrappedStore.incrementAndLog('op3')
      
      const finalState = wrappedStore.getState()
      expect(finalState.counter).toBe(3)
      expect(finalState.operations).toEqual(['op1', 'op2', 'op3'])
    })

    it('should handle async mutators with complex nested operations', async () => {
      interface ComplexState {
        users: Array<{
          id: number
          name: string
          profile: {
            bio: string
            settings: {
              notifications: boolean
              theme: string
            }
          }
        }>
        metadata: {
          lastUpdated: number
          version: number
        }
      }

      const complexStore = create<ComplexState>(() => ({
        users: [],
        metadata: { lastUpdated: 0, version: 1 }
      }))

      const fetchUserProfile = async (userId: number) => {
        await delay(1)
        return {
          bio: `Bio for user ${userId}`,
          settings: { notifications: true, theme: 'dark' }
        }
      }
      
      const wrappedStore = beditify(complexStore, {
        async createUser(draft, id: number, name: string) {
          const profile = await fetchUserProfile(id)
          
          addIn(draft).users({
            id,
            name,
            profile
          })
          
          setIn(draft).metadata.lastUpdated(Date.now())
          updateIn(draft).metadata.version(v => v + 1)
        },
        
        async updateUserSettings(draft, userId: number, theme: string) {
          await delay(1)
          
          const userIndex = draft.users.findIndex(u => u.id === userId)
          if (userIndex >= 0) {
            setIn(draft).users[userIndex].profile.settings.theme(theme)
            setIn(draft).metadata.lastUpdated(Date.now())
          }
        }
      })

      // Test creating user
      await wrappedStore.createUser(1, 'John')
      
      const state1 = wrappedStore.getState()
      expect(state1.users).toHaveLength(1)
      expect(state1.users[0]).toEqual({
        id: 1,
        name: 'John',
        profile: {
          bio: 'Bio for user 1',
          settings: { notifications: true, theme: 'dark' }
        }
      })
      expect(state1.metadata.version).toBe(2)

      // Test updating user settings (add small delay to ensure different timestamp)
      await new Promise(resolve => setTimeout(resolve, 1))
      await wrappedStore.updateUserSettings(1, 'light')
      
      const state2 = wrappedStore.getState()
      expect(state2.users[0].profile.settings.theme).toBe('light')
      expect(state2.metadata.lastUpdated).toBeGreaterThan(state1.metadata.lastUpdated)
    })

    it('should work with createStore for async operations', async () => {
      const store = createStore(() => initialState)
      
      const wrappedStore = beditify(store, {
        async asyncOperation(draft, value: string) {
          await delay(1)
          setIn(draft).nested.value(value)
          updateIn(draft).count(c => c + 1)
        }
      })

      await wrappedStore.asyncOperation('async with createStore')
      
      const state = wrappedStore.getState()
      expect(state.nested.value).toBe('async with createStore')
      expect(state.count).toBe(1)
      
      // Verify store methods are still available
      expect(typeof wrappedStore.getInitialState).toBe('function')
      expect(typeof wrappedStore.getState).toBe('function')
      expect(typeof wrappedStore.setState).toBe('function')
    })

    it('should handle unhandled async mutator errors', async () => {
      const store = create(() => initialState)
      
      const wrappedStore = beditify(store, {
        async throwingMutator(draft, shouldThrow: boolean) {
          await delay(1)
          draft.count = 99 // This change should not be persisted if error occurs
          
          if (shouldThrow) {
            throw new Error('Unhandled mutator error')
          }
          
          setIn(draft).nested.value('success')
        }
      })

      // Test that the error is properly propagated
      await expect(wrappedStore.throwingMutator(true)).rejects.toThrow('Unhandled mutator error')
      
      // Test that state is not modified when mutator throws
      const state = wrappedStore.getState()
      expect(state.count).toBe(0) // Should remain initial value
      expect(state.nested.value).toBe('test') // Should remain initial value
    })
  })
})
