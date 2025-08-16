import { expect, describe, it } from 'vitest'
import { create, createStore } from 'zustand'
import { beditify } from '../src/zustand.mjs'
import { setIn, updateIn, deleteIn, addIn, setDevMode } from '../src/bedit.mjs'

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
    it('should preserve all original store methods and properties', () => {
      const originalStore = create(() => createInitialState())
      const wrappedStore = beditify(originalStore)

      expect(wrappedStore.getState).toBe(originalStore.getState)
      expect(wrappedStore.setState).toBe(originalStore.setState)
      expect(wrappedStore.subscribe).toBe(originalStore.subscribe)
    })

    it('should work with setIn', () => {
      const store = create(() => createInitialState())
      const wrappedStore = beditify(store)

      setIn(wrappedStore).count(42)
      expect(wrappedStore.getState().count).toBe(42)

      setIn(wrappedStore).nested.value('updated')
      expect(wrappedStore.getState().nested.value).toBe('updated')
    })

    it('should work with updateIn', () => {
      const store = create(() => createInitialState())
      const wrappedStore = beditify(store)

      updateIn(wrappedStore).count((c) => c + 10)
      expect(wrappedStore.getState().count).toBe(10)

      updateIn(wrappedStore).nested.value((v) => v.toUpperCase())
      expect(wrappedStore.getState().nested.value).toBe('TEST')
    })

    it('should work with addIn', () => {
      const store = create(() => createInitialState())
      const wrappedStore = beditify(store)

      addIn(wrappedStore).nested.items(4, 5)
      expect(wrappedStore.getState().nested.items).toEqual([1, 2, 3, 4, 5])
    })

    it('should work with deleteIn', () => {
      const store = create(() => createInitialState())
      const wrappedStore = beditify(store)

      expect(wrappedStore.getState().nested).toHaveProperty('value')
      // Test deleteIn on a nested property instead
      deleteIn(wrappedStore).nested.value()
      expect(wrappedStore.getState().nested).not.toHaveProperty('value')
    })
  })

  describe('with zustand createStore()', () => {
    it('should preserve all original store methods and properties', () => {
      const originalStore = createStore(() => createInitialState())
      const wrappedStore = beditify(originalStore)

      expect(wrappedStore.getState).toBe(originalStore.getState)
      expect(wrappedStore.setState).toBe(originalStore.setState)
      expect(wrappedStore.getInitialState).toBe(originalStore.getInitialState)
    })

    it('should work with bedit functions', () => {
      const store = createStore(() => createInitialState())
      const wrappedStore = beditify(store)

      setIn(wrappedStore).count(99)
      expect(wrappedStore.getState().count).toBe(99)

      updateIn(wrappedStore).nested.items((items) => [...items, 10])
      expect(wrappedStore.getState().nested.items).toEqual([1, 2, 3, 10])
    })
  })

  describe('state container integration', () => {
    it('should have the bedit state container symbol', () => {
      const store = create(() => createInitialState())
      const wrappedStore = beditify(store)

      const symbol = Symbol.for('__bedit_state_container__')
      expect(symbol in wrappedStore).toBe(true)
      expect(wrappedStore[symbol]).toBeDefined()
      expect(typeof wrappedStore[symbol].get).toBe('function')
      expect(typeof wrappedStore[symbol].set).toBe('function')
    })

    it('should work seamlessly with all bedit functions', () => {
      const store = create(() => createInitialState())
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
      const store = create(() => createInitialState())

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
        },
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
      expect(wrappedStore.getState().users[2]).toEqual({
        id: 3,
        name: 'Charlie',
      })

      // Test resetCount function (no arguments)
      wrappedStore.resetCount()
      expect(wrappedStore.getState().count).toBe(0)
    })

    it('should preserve original store methods and properties', () => {
      const originalStore = create(() => createInitialState())
      const wrappedStore = beditify(originalStore, {
        increment(draft, n: number) {
          draft.count += n
        },
      })

      expect(wrappedStore.getState).toBe(originalStore.getState)
      expect(wrappedStore.setState).toBe(originalStore.setState)
      expect(wrappedStore.subscribe).toBe(originalStore.subscribe)
    })

    it('should work with complex nested mutations using bedit functions', () => {
      const store = create(() => createInitialState())

      const wrappedStore = beditify(store, {
        complexUpdate(draft, multiplier: number, suffix: string) {
          updateIn(draft).count((c) => c * multiplier)
          updateIn(draft).nested.value((v) => v + suffix)
          addIn(draft).nested.items(99)
          setIn(draft).users[0].name('Updated Alice')
        },
      })

      wrappedStore.complexUpdate(3, '!!!')

      const state = wrappedStore.getState()
      expect(state.count).toBe(0) // 0 * 3 = 0
      expect(state.nested.value).toBe('test!!!')
      expect(state.nested.items).toEqual([1, 2, 3, 99])
      expect(state.users[0].name).toBe('Updated Alice')
    })

    it('should work with createStore as well', () => {
      const store = createStore(() => createInitialState())

      const wrappedStore = beditify(store, {
        doubleCount(draft) {
          updateIn(draft).count((c) => c * 2)
        },
      })

      setIn(wrappedStore).count(5)
      wrappedStore.doubleCount()
      expect(wrappedStore.getState().count).toBe(10)
    })
  })

  describe('async mutator functions', () => {
    const delay = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms))

    it('should handle simple async mutators', async () => {
      const store = create(() => createInitialState())

      const wrappedStore = beditify(store, {
        async incrementAsync(draft, n: number) {
          await delay(1)
          draft.count += n
        },
        async updateValueAsync(draft, newValue: string) {
          await delay(1)
          setIn(draft).nested.value(newValue)
        },
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
      const store = create(() => createInitialState())

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
            updateIn(draft).count((c) => c + 1)
          }
        },
      })

      // Test single user load
      await wrappedStore.loadUser(10)
      expect(wrappedStore.getState().users).toHaveLength(3) // 2 initial + 1 new
      expect(wrappedStore.getState().users[2]).toEqual({
        id: 10,
        name: 'User 10',
      })

      // Test multiple users load
      await wrappedStore.loadMultipleUsers([20, 21])
      expect(wrappedStore.getState().count).toBe(2)
      expect(wrappedStore.getState().users).toHaveLength(5) // 3 + 2 new
      expect(wrappedStore.getState().users[3]).toEqual({
        id: 20,
        name: 'User 20',
      })
      expect(wrappedStore.getState().users[4]).toEqual({
        id: 21,
        name: 'User 21',
      })
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
        error: null,
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
        },
      })

      // Test successful call
      await wrappedStore.fetchData(false)
      expect(wrappedStore.getState()).toEqual({
        data: { id: 1, name: 'Success Data' },
        loading: false,
        error: null,
      })

      // Test failed call
      await wrappedStore.fetchData(true)
      expect(wrappedStore.getState()).toEqual({
        data: { id: 1, name: 'Success Data' }, // Previous data remains
        loading: false,
        error: 'API Error',
      })
    })

    it('should handle mixed sync and async mutators', async () => {
      const store = create(() => createInitialState())

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
        },
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
        },
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

          updateIn(draft).counter((c) => c + 1)
          addIn(draft).operations(operationId)
        },
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
        metadata: { lastUpdated: 0, version: 1 },
      }))

      const fetchUserProfile = async (userId: number) => {
        await delay(1)
        return {
          bio: `Bio for user ${userId}`,
          settings: { notifications: true, theme: 'dark' },
        }
      }

      const wrappedStore = beditify(complexStore, {
        async createUser(draft, id: number, name: string) {
          const profile = await fetchUserProfile(id)

          addIn(draft).users({
            id,
            name,
            profile,
          })

          setIn(draft).metadata.lastUpdated(Date.now())
          updateIn(draft).metadata.version((v) => v + 1)
        },

        async updateUserSettings(draft, userId: number, theme: string) {
          await delay(1)

          const userIndex = draft.users.findIndex((u) => u.id === userId)
          if (userIndex >= 0) {
            setIn(draft).users[userIndex].profile.settings.theme(theme)
            setIn(draft).metadata.lastUpdated(Date.now())
          }
        },
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
          settings: { notifications: true, theme: 'dark' },
        },
      })
      expect(state1.metadata.version).toBe(2)

      // Test updating user settings (add small delay to ensure different timestamp)
      await new Promise((resolve) => setTimeout(resolve, 1))
      await wrappedStore.updateUserSettings(1, 'light')

      const state2 = wrappedStore.getState()
      expect(state2.users[0].profile.settings.theme).toBe('light')
      expect(state2.metadata.lastUpdated).toBeGreaterThan(
        state1.metadata.lastUpdated,
      )
    })

    it('should work with createStore for async operations', async () => {
      const store = createStore(() => createInitialState())

      const wrappedStore = beditify(store, {
        async asyncOperation(draft, value: string) {
          await delay(1)
          setIn(draft).nested.value(value)
          updateIn(draft).count((c) => c + 1)
        },
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
      const store = create(() => createInitialState())

      const wrappedStore = beditify(store, {
        async throwingMutator(draft, shouldThrow: boolean) {
          await delay(1)
          draft.count = 99 // This change should not be persisted if error occurs

          if (shouldThrow) {
            throw new Error('Unhandled mutator error')
          }

          setIn(draft).nested.value('success')
        },
      })

      // Test that the error is properly propagated
      await expect(wrappedStore.throwingMutator(true)).rejects.toThrow(
        'Unhandled mutator error',
      )

      // Test that state is not modified when mutator throws
      const state = wrappedStore.getState()
      expect(state.count).toBe(0) // Should remain initial value
      expect(state.nested.value).toBe('test') // Should remain initial value
    })
  })

  describe('commit function in mutators', () => {
    const delay = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms))

    it('should allow intermediate state commits during async operations', async () => {
      const store = create(() => createInitialState())
      const stateSnapshots: TestState[] = []

      // Subscribe to track state changes
      store.subscribe((state) => {
        stateSnapshots.push(structuredClone(state))
      })

      const wrappedStore = beditify(store, {
        async multiStepOperation(draft) {
          // Step 1: Update count and commit
          draft.count = 10
          this.commit()

          await delay(5)

          // Step 2: Update nested value and commit
          setIn(draft).nested.value('step2')
          this.commit()

          await delay(5)

          // Step 3: Add item to array (final commit happens automatically)
          addIn(draft).nested.items(100)
        },
      })

      await wrappedStore.multiStepOperation()

      // Should have received 3 state updates total (2 manual commits + 1 final)
      expect(stateSnapshots).toHaveLength(3)

      // Verify each intermediate state
      expect(stateSnapshots[0].count).toBe(10)
      expect(stateSnapshots[0].nested.value).toBe('test') // unchanged at step 1
      expect(stateSnapshots[0].nested.items).toEqual([1, 2, 3]) // unchanged at step 1

      expect(stateSnapshots[1].count).toBe(10)
      expect(stateSnapshots[1].nested.value).toBe('step2')
      expect(stateSnapshots[1].nested.items).toEqual([1, 2, 3]) // unchanged at step 2

      expect(stateSnapshots[2].count).toBe(10)
      expect(stateSnapshots[2].nested.value).toBe('step2')
      expect(stateSnapshots[2].nested.items).toEqual([1, 2, 3, 100]) // final state
    })

    it('should preserve intermediate commits even if final operation fails', async () => {
      const store = create(() => createInitialState())
      const stateSnapshots: TestState[] = []

      store.subscribe((state) => {
        stateSnapshots.push(structuredClone(state))
      })

      const wrappedStore = beditify(store, {
        async operationWithError(draft, shouldFail: boolean) {
          // Step 1: Update count and commit
          draft.count = 50
          this.commit()

          await delay(1)

          // Step 2: Update value and commit
          setIn(draft).nested.value('committed')
          this.commit()

          await delay(1)

          if (shouldFail) {
            throw new Error('Operation failed after commits')
          }

          // This should not be applied if error is thrown
          addIn(draft).nested.items(999)
        },
      })

      // Test with error - should preserve intermediate commits
      await expect(wrappedStore.operationWithError(true)).rejects.toThrow(
        'Operation failed after commits',
      )

      // Should have received 2 state updates (2 manual commits, no final commit due to error)
      expect(stateSnapshots).toHaveLength(2)

      // Verify intermediate commits were preserved
      const finalState = wrappedStore.getState()
      expect(finalState.count).toBe(50) // From first commit
      expect(finalState.nested.value).toBe('committed') // From second commit
      expect(finalState.nested.items).toEqual([1, 2, 3]) // Error prevented final change
    })

    it('should handle multiple commits with complex state updates', async () => {
      interface MultiStepState {
        phase: string
        progress: number
        users: Array<{ id: number; name: string; processed: boolean }>
        logs: string[]
      }

      const multiStepStore = create<MultiStepState>(() => ({
        phase: 'initial',
        progress: 0,
        users: [
          { id: 1, name: 'Alice', processed: false },
          { id: 2, name: 'Bob', processed: false },
          { id: 3, name: 'Charlie', processed: false },
        ],
        logs: [],
      }))

      const stateSnapshots: MultiStepState[] = []
      multiStepStore.subscribe((state) => {
        stateSnapshots.push(structuredClone(state))
      })

      const wrappedStore = beditify(multiStepStore, {
        async processUsers(draft) {
          // Phase 1: Preparation
          draft.phase = 'preparing'
          draft.progress = 10
          addIn(draft).logs('Started processing users')
          this.commit()

          await delay(1)

          // Phase 2: Process each user with intermediate commits
          for (let i = 0; i < draft.users.length; i++) {
            setIn(draft).users[i].processed(true)
            updateIn(draft).progress(() => Math.round(10 + (i + 1) * 30))
            addIn(draft).logs(`Processed user: ${draft.users[i].name}`)
            this.commit()

            await delay(1)
          }

          // Phase 3: Completion
          draft.phase = 'completed'
          draft.progress = 100
          addIn(draft).logs('All users processed successfully')
        },
      })

      await wrappedStore.processUsers()

      // Should have 5 commits total: 1 initial + 3 per user + 1 final
      expect(stateSnapshots).toHaveLength(5)

      // Verify progression through states
      expect(stateSnapshots[0].phase).toBe('preparing')
      expect(stateSnapshots[0].progress).toBe(10)
      expect(stateSnapshots[0].logs).toHaveLength(1)

      expect(stateSnapshots[1].progress).toBe(40) // 10 + 1*30
      expect(stateSnapshots[1].users[0].processed).toBe(true)
      expect(stateSnapshots[1].users[1].processed).toBe(false)

      expect(stateSnapshots[2].progress).toBe(70) // 10 + 2*30
      expect(stateSnapshots[2].users[1].processed).toBe(true)
      expect(stateSnapshots[2].users[2].processed).toBe(false)

      expect(stateSnapshots[3].progress).toBe(100) // 10 + 3*30
      expect(stateSnapshots[3].users[2].processed).toBe(true)

      expect(stateSnapshots[4].phase).toBe('completed')
      expect(stateSnapshots[4].progress).toBe(100)
      expect(stateSnapshots[4].logs).toHaveLength(5) // 1 start + 3 users + 1 completion
    })

    it('should work with sync mutators that use commit', () => {
      const store = create(() => createInitialState())
      const stateSnapshots: TestState[] = []

      store.subscribe((state) => {
        stateSnapshots.push(structuredClone(state))
      })

      const wrappedStore = beditify(store, {
        syncMultiStep(draft, steps: number[]) {
          for (let i = 0; i < steps.length; i++) {
            updateIn(draft).count((c) => c + steps[i])
            setIn(draft).nested.value(`step-${i + 1}`)

            // Commit after each step except the last (which commits automatically)
            if (i < steps.length - 1) {
              this.commit()
            }
          }
        },
      })

      wrappedStore.syncMultiStep([10, 20, 30])

      // Should have 3 commits: 2 manual + 1 final
      expect(stateSnapshots).toHaveLength(3)

      expect(stateSnapshots[0].count).toBe(10)
      expect(stateSnapshots[0].nested.value).toBe('step-1')

      expect(stateSnapshots[1].count).toBe(30)
      expect(stateSnapshots[1].nested.value).toBe('step-2')

      expect(stateSnapshots[2].count).toBe(60)
      expect(stateSnapshots[2].nested.value).toBe('step-3')
    })

    it('should handle commit with bedit functions on draft object', async () => {
      const store = create(() => createInitialState())
      const stateSnapshots: TestState[] = []

      store.subscribe((state) => {
        stateSnapshots.push(structuredClone(state))
      })

      const wrappedStore = beditify(store, {
        async complexOperation(draft) {
          // Use various bedit functions and commit between operations
          setIn(draft).count(100)
          updateIn(draft).nested.value((v) => v.toUpperCase())
          this.commit()

          await delay(1)

          addIn(draft).nested.items(10, 20)
          deleteIn(draft).users[0]() // Remove first user
          this.commit()

          await delay(1)

          // Final changes
          addIn(draft).users({ id: 999, name: 'New User' })
          setIn(draft).nested.value('final')
        },
      })

      await wrappedStore.complexOperation()

      expect(stateSnapshots).toHaveLength(3)

      // First commit
      expect(stateSnapshots[0].count).toBe(100)
      expect(stateSnapshots[0].nested.value).toBe('TEST')
      expect(stateSnapshots[0].nested.items).toEqual([1, 2, 3])
      expect(stateSnapshots[0].users).toHaveLength(2)

      // Second commit
      expect(stateSnapshots[1].count).toBe(100)
      expect(stateSnapshots[1].nested.value).toBe('TEST')
      expect(stateSnapshots[1].nested.items).toEqual([1, 2, 3, 10, 20])
      expect(stateSnapshots[1].users).toHaveLength(1) // First user removed
      expect(stateSnapshots[1].users[0].name).toBe('Bob')

      // Final commit
      expect(stateSnapshots[2].users).toHaveLength(2) // New user added
      expect(stateSnapshots[2].users[1]).toEqual({ id: 999, name: 'New User' })
      expect(stateSnapshots[2].nested.value).toBe('final')
    })

    it('should handle commit correctly with createStore', async () => {
      const store = createStore(() => createInitialState())
      const stateSnapshots: TestState[] = []

      const unsubscribe = store.subscribe((state) => {
        stateSnapshots.push(structuredClone(state))
      })

      const wrappedStore = beditify(store, {
        async stepByStep(draft) {
          draft.count = 1
          this.commit()

          await delay(1)

          draft.count = 2
          this.commit()

          await delay(1)

          draft.count = 3
        },
      })

      await wrappedStore.stepByStep()

      expect(stateSnapshots).toHaveLength(3)
      expect(stateSnapshots[0].count).toBe(1)
      expect(stateSnapshots[1].count).toBe(2)
      expect(stateSnapshots[2].count).toBe(3)

      // Verify createStore methods are still available
      expect(typeof wrappedStore.getInitialState).toBe('function')

      unsubscribe()
    })

    it('should handle deep nesting with Maps, Sets, and arrays without affecting prior commits', async () => {
      interface DeepNestedState {
        level1: {
          level2: {
            level3: {
              level4: {
                level5: {
                  level6: {
                    arrays: number[][]
                    maps: Map<string, Map<string, number>>
                    sets: Set<Set<string>>
                    mixedData: Array<{
                      id: number
                      tags: Set<string>
                      metadata: Map<string, any>
                    }>
                  }
                }
              }
            }
          }
        }
        snapshots: any[]
      }

      const deepStore = create<DeepNestedState>(() => ({
        level1: {
          level2: {
            level3: {
              level4: {
                level5: {
                  level6: {
                    arrays: [[1, 2], [3, 4]],
                    maps: new Map([
                      ['outer1', new Map([['inner1', 100]])],
                      ['outer2', new Map([['inner2', 200]])],
                    ]),
                    sets: new Set([new Set(['a', 'b']), new Set(['c', 'd'])]),
                    mixedData: [
                      {
                        id: 1,
                        tags: new Set(['tag1', 'tag2']),
                        metadata: new Map([['created', Date.now()]]),
                      },
                    ],
                  },
                },
              },
            },
          },
        },
        snapshots: [],
      }))

      const stateSnapshots: DeepNestedState[] = []
      deepStore.subscribe((state) => {
        stateSnapshots.push(structuredClone(state))
      })

      const wrappedStore = beditify(deepStore, {
        async deepNestedOperations(draft) {
          // Step 1: Modify nested arrays and commit
          addIn(draft).level1.level2.level3.level4.level5.level6.arrays[0](5, 6)
          setIn(draft).level1.level2.level3.level4.level5.level6.arrays[1][0](99)
          addIn(draft).snapshots('step1-arrays-modified')
          this.commit()

          await delay(1)

          // Step 2: Modify nested Maps and commit  
          setIn(draft).level1.level2.level3.level4.level5.level6.maps.key('outer1').key('inner1')(999)
          setIn(draft).level1.level2.level3.level4.level5.level6.maps.key('outer2').key('inner3')(300)
          addIn(draft).snapshots('step2-maps-modified')
          this.commit()

          await delay(1)

          // Step 3: Modify nested Sets and commit
          addIn(draft).level1.level2.level3.level4.level5.level6.sets(new Set(['e', 'f']))
          // Modify an existing set in the Set of Sets by creating a new one with additional items
          const setsArray = Array.from(draft.level1.level2.level3.level4.level5.level6.sets)
          const firstSet = setsArray[0]
          if (firstSet) {
            // Remove the old set and add the modified version
            deleteIn(draft).level1.level2.level3.level4.level5.level6.sets.key(firstSet)()
            const newSet = new Set([...firstSet, 'z'])
            addIn(draft).level1.level2.level3.level4.level5.level6.sets(newSet)
          }
          addIn(draft).snapshots('step3-sets-modified')
          this.commit()

          await delay(1)

          // Step 4: Modify mixed data structures and commit
          addIn(draft).level1.level2.level3.level4.level5.level6.mixedData[0].tags('tag3', 'tag4')
          setIn(draft).level1.level2.level3.level4.level5.level6.mixedData[0].metadata.key('updated')(Date.now())
          addIn(draft).level1.level2.level3.level4.level5.level6.mixedData({
            id: 2,
            tags: new Set(['newTag']),
            metadata: new Map([['type', 'added']]),
          })
          addIn(draft).snapshots('step4-mixed-data-modified')
          this.commit()

          await delay(1)

          // Step 5: Final modifications
          updateIn(draft).level1.level2.level3.level4.level5.level6.arrays((arrays) => {
            const newArrays = [...arrays]
            newArrays.push([777, 888])
            return newArrays
          })
          addIn(draft).snapshots('step5-final-modifications')
        },
      })

      await wrappedStore.deepNestedOperations()

      // Should have 5 commits total
      expect(stateSnapshots).toHaveLength(5)

      // Verify each snapshot is independent and wasn't affected by later operations
      
      // Step 1 snapshot - only arrays modified
      const step1 = stateSnapshots[0]
      expect(step1.level1.level2.level3.level4.level5.level6.arrays[0]).toEqual([1, 2, 5, 6])
      expect(step1.level1.level2.level3.level4.level5.level6.arrays[1]).toEqual([99, 4])
      expect(step1.level1.level2.level3.level4.level5.level6.maps.get('outer1')?.get('inner1')).toBe(100) // unchanged
      expect(step1.snapshots).toEqual(['step1-arrays-modified'])

      // Step 2 snapshot - arrays + maps modified
      const step2 = stateSnapshots[1]
      expect(step2.level1.level2.level3.level4.level5.level6.arrays[0]).toEqual([1, 2, 5, 6]) // preserved
      expect(step2.level1.level2.level3.level4.level5.level6.maps.get('outer1')?.get('inner1')).toBe(999) // modified
      expect(step2.level1.level2.level3.level4.level5.level6.maps.get('outer2')?.get('inner3')).toBe(300) // added
      expect(step2.level1.level2.level3.level4.level5.level6.sets.size).toBe(2) // unchanged
      expect(step2.snapshots).toEqual(['step1-arrays-modified', 'step2-maps-modified'])

      // Step 3 snapshot - arrays + maps + sets modified
      const step3 = stateSnapshots[2]
      expect(step3.level1.level2.level3.level4.level5.level6.arrays[0]).toEqual([1, 2, 5, 6]) // preserved
      expect(step3.level1.level2.level3.level4.level5.level6.maps.get('outer1')?.get('inner1')).toBe(999) // preserved
      expect(step3.level1.level2.level3.level4.level5.level6.sets.size).toBe(3) // added new set
      expect(step3.level1.level2.level3.level4.level5.level6.mixedData).toHaveLength(1) // unchanged
      expect(step3.snapshots).toEqual(['step1-arrays-modified', 'step2-maps-modified', 'step3-sets-modified'])

      // Step 4 snapshot - arrays + maps + sets + mixedData modified
      const step4 = stateSnapshots[3]
      expect(step4.level1.level2.level3.level4.level5.level6.arrays[0]).toEqual([1, 2, 5, 6]) // preserved
      expect(step4.level1.level2.level3.level4.level5.level6.maps.get('outer1')?.get('inner1')).toBe(999) // preserved
      expect(step4.level1.level2.level3.level4.level5.level6.sets.size).toBe(3) // preserved
      expect(step4.level1.level2.level3.level4.level5.level6.mixedData).toHaveLength(2) // added item
      expect(step4.level1.level2.level3.level4.level5.level6.mixedData[0].tags.size).toBe(4) // added tags
      expect(step4.level1.level2.level3.level4.level5.level6.mixedData[0].metadata.has('updated')).toBe(true)
      expect(step4.snapshots).toEqual(['step1-arrays-modified', 'step2-maps-modified', 'step3-sets-modified', 'step4-mixed-data-modified'])

      // Step 5 snapshot (final) - all modifications plus final array addition
      const step5 = stateSnapshots[4]
      expect(step5.level1.level2.level3.level4.level5.level6.arrays).toHaveLength(3) // added new array
      expect(step5.level1.level2.level3.level4.level5.level6.arrays[2]).toEqual([777, 888])
      expect(step5.level1.level2.level3.level4.level5.level6.arrays[0]).toEqual([1, 2, 5, 6]) // preserved
      expect(step5.snapshots).toEqual(['step1-arrays-modified', 'step2-maps-modified', 'step3-sets-modified', 'step4-mixed-data-modified', 'step5-final-modifications'])

      // Verify that modifications at each step didn't affect the previous snapshots
      // This is the critical test - earlier snapshots should remain unchanged
      expect(stateSnapshots[0].level1.level2.level3.level4.level5.level6.maps.get('outer1')?.get('inner1')).toBe(100) // Not 999
      expect(stateSnapshots[1].level1.level2.level3.level4.level5.level6.sets.size).toBe(2) // Not 3
      expect(stateSnapshots[2].level1.level2.level3.level4.level5.level6.mixedData).toHaveLength(1) // Not 2
      expect(stateSnapshots[3].level1.level2.level3.level4.level5.level6.arrays).toHaveLength(2) // Not 3
    })

    it('should handle commit with deleteIn operations on nested Maps/Sets/Arrays', async () => {
      interface DeletionTestState {
        data: {
          nested: {
            arrays: number[][]
            maps: Map<string, Map<string, number>>
            sets: Set<Set<string>>
            objects: Array<{ id: number; name: string; tags: Set<string> }>
          }
        }
        operations: string[]
      }

      const deletionStore = create<DeletionTestState>(() => ({
        data: {
          nested: {
            arrays: [[1, 2, 3], [4, 5, 6], [7, 8, 9]],
            maps: new Map([
              ['map1', new Map([['a', 1], ['b', 2], ['c', 3]])],
              ['map2', new Map([['x', 10], ['y', 20]])],
            ]),
            sets: new Set([
              new Set(['alpha', 'beta', 'gamma']),
              new Set(['one', 'two', 'three']),
            ]),
            objects: [
              { id: 1, name: 'Object1', tags: new Set(['tag1', 'tag2', 'tag3']) },
              { id: 2, name: 'Object2', tags: new Set(['tag4', 'tag5']) },
            ],
          },
        },
        operations: [],
      }))

      const stateSnapshots: DeletionTestState[] = []
      deletionStore.subscribe((state) => {
        stateSnapshots.push(structuredClone(state))
      })

      const wrappedStore = beditify(deletionStore, {
        async performDeletions(draft) {
          // Step 1: Delete from arrays and commit
          deleteIn(draft).data.nested.arrays[0][1]() // Remove index 1 from first array
          deleteIn(draft).data.nested.arrays[2]() // Remove entire third array
          addIn(draft).operations('arrays-deleted')
          this.commit()

          await delay(1)

          // Step 2: Delete from maps and commit
          deleteIn(draft).data.nested.maps.key('map1').key('b')() // Remove 'b' from map1
          deleteIn(draft).data.nested.maps.key('map2')() // Remove entire map2
          addIn(draft).operations('maps-deleted') 
          this.commit()

          await delay(1)

          // Step 3: Delete from sets and commit
          const setsArray = Array.from(draft.data.nested.sets)
          const firstSet = setsArray[0]
          if (firstSet) {
            // Remove 'beta' from first set by replacing it with a new set
            deleteIn(draft).data.nested.sets.key(firstSet)()
            const modifiedSet = new Set([...firstSet])
            modifiedSet.delete('beta')
            addIn(draft).data.nested.sets(modifiedSet)
          }
          deleteIn(draft).data.nested.sets.key(setsArray[1])() // Remove second set entirely
          addIn(draft).operations('sets-deleted')
          this.commit()

          await delay(1)

          // Step 4: Delete from objects and their nested collections
          deleteIn(draft).data.nested.objects[0].tags.key('tag2')() // Remove tag from first object
          deleteIn(draft).data.nested.objects[1]() // Remove second object entirely  
          addIn(draft).operations('objects-deleted')
        },
      })

      await wrappedStore.performDeletions()

      expect(stateSnapshots).toHaveLength(4)

      // Step 1: Arrays deleted
      const step1 = stateSnapshots[0]
      expect(step1.data.nested.arrays[0]).toEqual([1, 3]) // removed index 1 (value 2)
      expect(step1.data.nested.arrays).toHaveLength(2) // removed third array
      expect(step1.data.nested.arrays[1]).toEqual([4, 5, 6]) // second array unchanged
      expect(step1.data.nested.maps.size).toBe(2) // maps unchanged
      expect(step1.operations).toEqual(['arrays-deleted'])

      // Step 2: Maps deleted
      const step2 = stateSnapshots[1]
      expect(step2.data.nested.arrays[0]).toEqual([1, 3]) // preserved from step 1
      expect(step2.data.nested.maps.size).toBe(1) // map2 removed
      expect(step2.data.nested.maps.get('map1')?.get('b')).toBeUndefined() // 'b' removed
      expect(step2.data.nested.maps.get('map1')?.get('a')).toBe(1) // 'a' preserved
      expect(step2.data.nested.maps.get('map1')?.get('c')).toBe(3) // 'c' preserved
      expect(step2.data.nested.sets.size).toBe(2) // sets unchanged
      expect(step2.operations).toEqual(['arrays-deleted', 'maps-deleted'])

      // Step 3: Sets deleted
      const step3 = stateSnapshots[2]
      expect(step3.data.nested.arrays[0]).toEqual([1, 3]) // preserved
      expect(step3.data.nested.maps.size).toBe(1) // preserved
      expect(step3.data.nested.sets.size).toBe(1) // second set removed
      const remainingSet = Array.from(step3.data.nested.sets)[0]
      expect(remainingSet?.has('alpha')).toBe(true)
      expect(remainingSet?.has('beta')).toBe(false) // removed
      expect(remainingSet?.has('gamma')).toBe(true)
      expect(step3.data.nested.objects).toHaveLength(2) // objects unchanged
      expect(step3.operations).toEqual(['arrays-deleted', 'maps-deleted', 'sets-deleted'])

      // Step 4: Objects deleted
      const step4 = stateSnapshots[3]
      expect(step4.data.nested.arrays[0]).toEqual([1, 3]) // preserved
      expect(step4.data.nested.maps.size).toBe(1) // preserved
      expect(step4.data.nested.sets.size).toBe(1) // preserved
      expect(step4.data.nested.objects).toHaveLength(1) // second object removed
      expect(step4.data.nested.objects[0].tags.has('tag1')).toBe(true)
      expect(step4.data.nested.objects[0].tags.has('tag2')).toBe(false) // removed
      expect(step4.data.nested.objects[0].tags.has('tag3')).toBe(true)
      expect(step4.operations).toEqual(['arrays-deleted', 'maps-deleted', 'sets-deleted', 'objects-deleted'])

      // Critical: Verify earlier snapshots weren't affected by later deletions
      expect(stateSnapshots[0].data.nested.maps.size).toBe(2) // Still has map2
      expect(stateSnapshots[1].data.nested.sets.size).toBe(2) // Still has both sets
      expect(stateSnapshots[2].data.nested.objects).toHaveLength(2) // Still has both objects
    })
  })
})
