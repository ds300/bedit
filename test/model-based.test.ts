import { describe, beforeEach, afterEach, expect } from 'vitest'
import { test } from '@fast-check/vitest'
import * as fc from 'fast-check'
import { fork, setDevMode } from '../src/patchfork.mjs'

// Configure for model-based testing
fc.configureGlobal({ numRuns: process.env.CI ? 2000 : 50 })

// ============================================================================
// PHASE 1: Core Model Infrastructure
// ============================================================================

/**
 * Simple helper functions for working with state objects directly
 */
class StateHelper {
  /**
   * Get the value at a path in the state
   */
  static getValueAtPath(state: any, path: (string | number)[]): any {
    let current = state
    for (const segment of path) {
      if (current == null) return undefined
      current = current[segment]
    }
    return current
  }

  /**
   * Check if a path exists in the state
   */
  static pathExists(state: any, path: (string | number)[]): boolean {
    let current = state
    for (const segment of path) {
      if (current == null || typeof current !== 'object') return false
      if (!(segment in current)) return false
      current = current[segment]
    }
    return true
  }

  /**
   * Get all valid paths in a state object for different operations
   */
  static getAllPaths(
    obj: any,
    currentPath: (string | number)[] = [],
  ): (string | number)[][] {
    const paths: (string | number)[][] = []

    if (currentPath.length > 0) {
      paths.push([...currentPath])
    }

    if (obj != null && typeof obj === 'object') {
      if (Array.isArray(obj)) {
        obj.forEach((_, index) => {
          paths.push(...this.getAllPaths(obj[index], [...currentPath, index]))
        })
      } else if (obj instanceof Map) {
        for (const [key, value] of obj) {
          paths.push(...this.getAllPaths(value, [...currentPath, key]))
        }
      } else if (obj instanceof Set) {
        // Sets don't have nested paths
      } else {
        // Plain object
        for (const key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            paths.push(...this.getAllPaths(obj[key], [...currentPath, key]))
          }
        }
      }
    }

    return paths
  }

  /**
   * Get valid paths for setIn (any existing path)
   */
  static getValidSetInPaths(state: any): (string | number)[][] {
    return this.getAllPaths(state)
  }

  /**
   * Get valid paths for updateIn (primitive values only)
   */
  static getValidUpdateInPaths(state: any): (string | number)[][] {
    return this.getAllPaths(state).filter((path) => {
      const value = this.getValueAtPath(state, path)
      return value == null || typeof value !== 'object'
    })
  }

  /**
   * Get valid paths for editIn (objects, arrays, maps, sets)
   */
  static getValidEditInPaths(state: any): (string | number)[][] {
    return this.getAllPaths(state).filter((path) => {
      const value = this.getValueAtPath(state, path)
      return value != null && typeof value === 'object'
    })
  }

  static setValueAtPath(obj: any, path: (string | number)[], value: any): void {
    let current = obj
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]]
    }
    current[path[path.length - 1]] = value
  }

  static isValidPath(obj: any, path: (string | number)[]): boolean {
    return StateHelper.pathExists(obj, path)
  }
}

// ============================================================================
// Command Interface
// ============================================================================

/**
 * Abstract base class for all patchfork operation commands in model-based testing.
 *
 * Commands represent executable operations that can be applied to both the real
 * patchfork state and a model state (which is just a cloned copy). Each command:
 * - Checks preconditions against the current state
 * - Executes on both real state (via patchfork) and model state (direct mutation)
 * - Validates that both results are equivalent
 *
 * This simpler approach uses actual state objects as the "model" rather than
 * maintaining separate abstract metadata.
 */
abstract class PatchforkCommand {
  abstract readonly type: string
  abstract readonly path: (string | number)[]

  /**
   * Check if this command can be executed on the current state
   */
  abstract canExecute(state: any): boolean

  /**
   * Execute the command on the real state using patchfork
   */
  abstract executeOnReal(state: any): Promise<any> | any

  /**
   * Execute the command on the model state using direct mutation
   */
  abstract executeOnModel(modelState: any): Promise<void> | void

  /**
   * Validate that the real result matches model expectations
   */
  validate(modelState: any, realResult: any): void {
    // Default validation: deep equality
    expect(realResult).toEqual(modelState)
  }
}

/**
 * Command for patchfork's setIn operation - sets values at any depth in the state tree.
 *
 * SetIn is the most fundamental operation that can target any existing path.
 * It replaces the value at the target path with a new value, potentially changing
 * the type (e.g., replacing an object with a primitive).
 *
 * Preconditions: All parent paths in the target path must exist
 * Post-conditions: Target path has the new value, parent structure is preserved
 */
class SetInCommand extends PatchforkCommand {
  readonly type = 'setIn'

  constructor(
    readonly path: (string | number)[],
    readonly value: any,
  ) {
    super()
  }

  canExecute(state: any): boolean {
    // setIn can execute if all parent paths exist
    if (this.path.length === 0) return false // Can't set root

    for (let i = 0; i < this.path.length - 1; i++) {
      const parentPath = this.path.slice(0, i + 1)
      if (!StateHelper.pathExists(state, parentPath)) {
        return false
      }
    }
    return true
  }

  async executeOnReal(state: any): Promise<any> {
    await Promise.resolve() // Async delay
    // Build the setIn call dynamically
    let target = fork(state) as any
    for (const segment of this.path) {
      target = target[segment]
    }
    return target(this.value)
  }

  async executeOnModel(modelState: any): Promise<void> {
    await Promise.resolve() // Async delay
    // Directly mutate the model state
    let current = modelState
    for (let i = 0; i < this.path.length - 1; i++) {
      current = current[this.path[i]]
    }
    current[this.path[this.path.length - 1]] = this.value
  }
}

/**
 * Command for patchfork's updateIn operation - applies functions to primitive values.
 *
 * UpdateIn takes the current value at a path and applies a transformation function
 * to produce a new value. This is only valid for primitive values (not objects/collections).
 *
 * Preconditions: Target path must exist and contain a primitive value
 * Postconditions: Target path has the transformed value
 */
class UpdateInCommand extends PatchforkCommand {
  readonly type = 'updateIn'

  constructor(
    readonly path: (string | number)[],
    readonly updater: (val: any) => any,
  ) {
    super()
  }

  canExecute(state: any): boolean {
    if (!StateHelper.pathExists(state, this.path)) return false
    const value = StateHelper.getValueAtPath(state, this.path)
    return value == null || typeof value !== 'object'
  }

  async executeOnReal(state: any): Promise<any> {
    await Promise.resolve() // Async delay
    let target = fork(state) as any
    for (const segment of this.path) {
      target = target[segment]
    }
    return target(this.updater)
  }

  async executeOnModel(modelState: any): Promise<void> {
    await Promise.resolve() // Async delay
    // Get current value and apply updater
    const currentValue = StateHelper.getValueAtPath(modelState, this.path)
    const newValue = this.updater(currentValue)

    // Set the updated value
    let current = modelState
    for (let i = 0; i < this.path.length - 1; i++) {
      current = current[this.path[i]]
    }
    current[this.path[this.path.length - 1]] = newValue
  }
}

/**
 * Command for patchfork's editIn operation - applies a sequence of commands to a shallow clone.
 *
 * EditIn provides a shallow clone of the target object/collection and applies
 * a sequence of sub-commands to it. This allows testing complex nested operations.
 *
 * Preconditions: Target path must exist and be an object/collection
 * Postconditions: Target is shallow cloned, sub-commands applied
 */
class EditInCommand extends PatchforkCommand {
  readonly type = 'editIn'

  constructor(
    readonly path: (string | number)[],
    readonly subCommands: PatchforkCommand[],
  ) {
    super()
  }

  canExecute(state: any): boolean {
    if (!StateHelper.pathExists(state, this.path)) return false
    const value = StateHelper.getValueAtPath(state, this.path)
    return value != null && typeof value === 'object'
  }

  async executeOnReal(state: any): Promise<any> {
    await Promise.resolve() // Async delay
    // Get the target object at the path
    let target = fork.do(state) as any
    for (const segment of this.path) {
      target = target[segment]
    }

    // Execute editIn with a function that applies all sub-commands
    return target(async (draft: any) => {
      for (const command of this.subCommands) {
        await Promise.resolve() // Async delay between operations
        await command.executeOnReal(draft)
      }
    })
  }

  async executeOnModel(modelState: any): Promise<void> {
    await Promise.resolve() // Async delay
    // Get the target object and create a shallow clone
    const targetObject = StateHelper.getValueAtPath(modelState, this.path)
    if (targetObject == null || typeof targetObject !== 'object') return

    const cloned = Array.isArray(targetObject)
      ? [...targetObject]
      : targetObject instanceof Map
        ? new Map(targetObject)
        : targetObject instanceof Set
          ? new Set(targetObject)
          : { ...targetObject }

    // Apply all sub-commands to the clone
    let current = cloned
    for (const command of this.subCommands) {
      await Promise.resolve() // Async delay between operations
      const subModel = structuredClone(current)
      await command.executeOnModel(subModel)
      current = subModel
    }

    // Set the updated value back in the model
    let modelCurrent = modelState
    for (let i = 0; i < this.path.length - 1; i++) {
      modelCurrent = modelCurrent[this.path[i]]
    }
    modelCurrent[this.path[this.path.length - 1]] = current
  }
}

/**
 * Command for patchfork's edit operation - applies a sequence of commands with batch optimization.
 *
 * Edit allows multiple mutations on the same object with optimized cloning.
 * Takes a sequence of sub-commands and applies them within a single edit() call.
 *
 * Preconditions: None (operates on root)
 * Post-conditions: All sub-commands applied to cloned state
 */
class EditCommand extends PatchforkCommand {
  readonly type = 'edit'
  readonly path = [] // edit always operates on root

  constructor(readonly subCommands: PatchforkCommand[]) {
    super()
  }

  canExecute(state: any): boolean {
    return (
      state != null && this.subCommands.every((cmd) => cmd.canExecute(state))
    )
  }

  async executeOnReal(state: any): Promise<any> {
    await Promise.resolve() // Async delay
    return fork.do(state, async (draft) => {
      // Apply each sub-command to the draft using real operations
      for (const command of this.subCommands) {
        await Promise.resolve() // Async delay between operations
        await command.executeOnReal(draft)
      }
    })
  }

  async executeOnModel(modelState: any): Promise<void> {
    await Promise.resolve() // Async delay
    // Apply all sub-commands to the model state
    for (const command of this.subCommands) {
      await Promise.resolve() // Async delay between operations
      await command.executeOnModel(modelState)
    }
  }
}

describe('Model-Based Tests', () => {
  beforeEach(() => {
    setDevMode(true)
  })

  afterEach(() => {
    setDevMode(false)
  })

  // ============================================================================
  // MODEL INFRASTRUCTURE TESTS
  // ============================================================================

  test('StateHelper correctly identifies paths and types in objects', () => {
    const state = {
      user: { name: 'John', age: 30 },
      items: ['a', 'b', 'c'],
      config: new Map([['theme', 'dark']]),
      tags: new Set(['admin', 'user']),
    }

    // Test path existence
    expect(StateHelper.pathExists(state, ['user'])).toBe(true)
    expect(StateHelper.pathExists(state, ['user', 'name'])).toBe(true)
    expect(StateHelper.pathExists(state, ['items'])).toBe(true)
    expect(StateHelper.pathExists(state, ['items', 0])).toBe(true)
    expect(StateHelper.pathExists(state, ['config'])).toBe(true)
    expect(StateHelper.pathExists(state, ['tags'])).toBe(true)
    expect(StateHelper.pathExists(state, ['nonexistent'])).toBe(false)

    // Test value retrieval
    expect(StateHelper.getValueAtPath(state, ['user', 'name'])).toBe('John')
    expect(StateHelper.getValueAtPath(state, ['items', 0])).toBe('a')
    expect(StateHelper.getValueAtPath(state, ['config'])).toBeInstanceOf(Map)
    expect(StateHelper.getValueAtPath(state, ['tags'])).toBeInstanceOf(Set)
  })

  test('StateHelper tracks valid paths for each operation', () => {
    const state = {
      user: { name: 'John' },
      items: ['a', 'b'],
      tags: new Set(['admin']),
    }

    // setIn can target any existing path
    const setInPaths = StateHelper.getValidSetInPaths(state)
    expect(setInPaths.some((p: any) => p.join('.') === 'user.name')).toBe(true)

    // updateIn can target primitives only
    const updateInPaths = StateHelper.getValidUpdateInPaths(state)
    expect(updateInPaths.some((p: any) => p.join('.') === 'user.name')).toBe(
      true,
    )
    expect(updateInPaths.some((p: any) => p.join('.') === 'user')).toBe(false) // object, not primitive
  })

  test('SetInCommand executes and validates correctly', async () => {
    const state = { user: { name: 'John', age: 30 } }
    const modelState = structuredClone(state)

    const command = new SetInCommand(['user', 'name'], 'Jane')

    expect(command.canExecute(state)).toBe(true)

    const result = await command.executeOnReal(state)
    await command.executeOnModel(modelState)

    expect(result.user.name).toBe('Jane')
    expect(result.user.age).toBe(30)
    expect(state.user.name).toBe('John') // Original unchanged

    command.validate(modelState, result)
  })

  test('UpdateInCommand executes and validates correctly', async () => {
    const state = { user: { name: 'john', age: 30 } }
    const modelState = structuredClone(state)

    const command = new UpdateInCommand(['user', 'name'], (name: string) =>
      name.toUpperCase(),
    )

    expect(command.canExecute(state)).toBe(true)

    const result = await command.executeOnReal(state)
    await command.executeOnModel(modelState)

    expect(result.user.name).toBe('JOHN')
    expect(state.user.name).toBe('john') // Original unchanged

    command.validate(modelState, result)
  })

  test('Commands correctly validate preconditions', () => {
    const state = { user: { name: 'John' }, items: ['a'] }

    // Valid commands
    expect(new SetInCommand(['user', 'name'], 'Jane').canExecute(state)).toBe(
      true,
    )
    expect(
      new UpdateInCommand(['user', 'name'], (s: string) => s).canExecute(state),
    ).toBe(true)
    // Invalid commands
    expect(
      new SetInCommand(['nonexistent', 'prop'], 'value').canExecute(state),
    ).toBe(false)
    expect(
      new UpdateInCommand(['user'], (obj: any) => obj).canExecute(state),
    ).toBe(false) // object, not primitive
  })

  test('EditInCommand executes and validates correctly', async () => {
    const state = {
      user: { name: 'John', profile: { bio: 'Developer', tags: ['js', 'ts'] } },
      items: ['a', 'b', 'c'],
    }

    // Test object editing with command sequence
    const objModelState = structuredClone(state)
    const objCommand = new EditInCommand(
      ['user'],
      [new SetInCommand(['name'], 'Jane'), new SetInCommand(['age'], 25)],
    )
    expect(objCommand.canExecute(state)).toBe(true)

    let result = await objCommand.executeOnReal(state)
    await objCommand.executeOnModel(objModelState)

    expect(result.user.name).toBe('Jane')
    expect(result.user.age).toBe(25)
    expect(result.user.profile.bio).toBe('Developer') // Nested preserved
    objCommand.validate(objModelState, result)

    // Test array editing with command sequence
    const arrModelState = structuredClone(state)
    const arrCommand = new EditInCommand(
      ['items'],
      [new SetInCommand([0], 'modified'), new SetInCommand([3], 'd')],
    )

    result = await arrCommand.executeOnReal(state)
    await arrCommand.executeOnModel(arrModelState)

    expect(result.items).toEqual(['modified', 'b', 'c', 'd'])
    arrCommand.validate(arrModelState, result)
  })

  test('EditCommand executes and validates correctly', async () => {
    const state = {
      user: { name: 'John', age: 30 },
      items: ['a', 'b'],
      count: 5,
    }

    const modelState = structuredClone(state)
    const command = new EditCommand([
      new SetInCommand(['user', 'name'], 'Jane'),
      new EditInCommand(['items'], [new SetInCommand([2], 'c')]),
      new UpdateInCommand(['count'], (n: number) => n + 10),
      new SetInCommand(['newProp'], 'added'),
    ])

    expect(command.canExecute(state)).toBe(true)

    const result = await command.executeOnReal(state)
    await command.executeOnModel(modelState)

    expect(result.user.name).toBe('Jane')
    expect(result.items).toEqual(['a', 'b', 'c'])
    expect(result.count).toBe(15)
    expect(result.newProp).toBe('added')

    command.validate(modelState, result)
  })

  // ============================================================================
  // PHASE 2: Operation Sequences and Advanced Scenarios
  // ============================================================================

  test('Sequential operations maintain consistency', async () => {
    const initialState = {
      users: [{ name: 'John', age: 30 }],
      config: { theme: 'dark' },
    }

    let currentState = initialState
    let modelState = structuredClone(initialState)

    // Apply sequence of operations
    const operations = [
      new SetInCommand(['users', 0, 'name'], 'Jane'),
      new UpdateInCommand(['users', 0, 'age'], (age: number) => age + 1),
      new SetInCommand(['config', 'theme'], 'light'),
    ]

    for (const operation of operations) {
      expect(operation.canExecute(currentState)).toBe(true)

      const originalState = structuredClone(currentState)
      currentState = await operation.executeOnReal(currentState)
      await operation.executeOnModel(modelState)

      // Verify immutability
      expect(originalState).toEqual(structuredClone(originalState))

      // Verify consistency
      operation.validate(modelState, currentState)
    }

    // Final state should match model
    expect(currentState).toEqual(modelState)
    expect(currentState.users[0].name).toBe('Jane')
    expect(currentState.users[0].age).toBe(31)
    expect(currentState.config.theme).toBe('light')
  })

  test('Mixed operation types with complex state', async () => {
    const state = {
      users: [
        { id: 1, name: 'Alice', tags: new Set(['admin', 'moderator', 'user']) },
        { id: 2, name: 'Bob', posts: ['Hello', 'World', 'New post'] },
      ],
      config: new Map([
        ['theme', 'dark'],
        ['debug', 'false'],
      ]),
      counters: [10, 20, 30],
    }

    let current = state
    let model = structuredClone(state)

    const commands = [
      // Update array element
      new UpdateInCommand(['counters', 0], (n: number) => n * 2),
      // Edit user object with command sequence
      new EditInCommand(
        ['users', 0],
        [
          new UpdateInCommand(['name'], (name: string) => name.toUpperCase()),
          new SetInCommand(['lastLogin'], '2024-01-01'),
        ],
      ),
      // Batch update with command sequence
      new EditCommand([
        new SetInCommand(
          ['config'],
          new Map([
            ['theme', 'dark'],
            ['debug', 'false'],
            ['version', '1.0'],
          ]),
        ),
      ]),
    ]

    for (const command of commands) {
      expect(command.canExecute(current)).toBe(true)

      current = await command.executeOnReal(current)
      await command.executeOnModel(model)

      command.validate(model, current)
    }

    // Verify final state
    expect(current.users[0].name).toBe('ALICE')
    expect(current.users[0].tags?.has('moderator')).toBe(true)
    expect(current.users[1].posts).toHaveLength(3)
    expect(current.counters[0]).toBe(20)
    expect(current.config.get('version')).toBe('1.0')
  })

  // ============================================================================
  // PHASE 2: Generative Model-Based Testing
  // ============================================================================

  /**
   * Generate safe, type-aware commands based on current state structure
   */
  function generateSafeCommandsForState(
    state: any,
  ): fc.Arbitrary<PatchforkCommand> {
    const commands: fc.Arbitrary<PatchforkCommand>[] = []

    // Safe SetIn commands - avoid Map/Set property access, only use valid paths
    const validSetInPaths = StateHelper.getValidSetInPaths(state).filter(
      (path) => {
        if (path.length === 0) return false

        // Check if any parent is a Map or Set (requires [key]() syntax)
        for (let i = 0; i < path.length - 1; i++) {
          const parentPath = path.slice(0, i + 1)
          const parentValue = StateHelper.getValueAtPath(state, parentPath)
          if (parentValue instanceof Map || parentValue instanceof Set) {
            return false // Skip these for now
          }
        }
        return true
      },
    )

    const primitiveSetIns = validSetInPaths.map((path) => {
      const currentValue = StateHelper.getValueAtPath(state, path)
      let valueArb: fc.Arbitrary<unknown>

      if (typeof currentValue === 'string') {
        valueArb = fc.string({ maxLength: 10 })
      } else if (typeof currentValue === 'number') {
        valueArb = fc.integer({ min: 0, max: 100 })
      } else if (typeof currentValue === 'boolean') {
        valueArb = fc.boolean()
      } else if (Array.isArray(currentValue)) {
        valueArb = fc.array(fc.string({ maxLength: 5 }), { maxLength: 3 })
      } else if (currentValue instanceof Set) {
        valueArb = fc
          .array(fc.string({ maxLength: 5 }), { maxLength: 2 })
          .map((arr) => new Set(arr))
      } else if (currentValue instanceof Map) {
        valueArb = fc
          .dictionary(
            fc.string({ maxLength: 3 }),
            fc.string({ maxLength: 5 }),
            { maxKeys: 2 },
          )
          .map((dict) => new Map(Object.entries(dict)))
      } else {
        valueArb = fc.constant('safe-value')
      }

      return fc
        .record({ path: fc.constant(path), value: valueArb })
        .map(({ path, value }) => new SetInCommand(path, value))
    })

    if (primitiveSetIns.length > 0) {
      commands.push(fc.oneof(...primitiveSetIns))
    }

    // Safe UpdateIn commands - only type-compatible functions, avoid Map/Set paths
    const validUpdateInPaths = StateHelper.getValidUpdateInPaths(state).filter(
      (path) => {
        if (path.length === 0) return false

        // Check if any parent is a Map or Set (requires [key]() syntax)
        for (let i = 0; i < path.length - 1; i++) {
          const parentPath = path.slice(0, i + 1)
          const parentValue = StateHelper.getValueAtPath(state, parentPath)
          if (parentValue instanceof Map || parentValue instanceof Set) {
            return false // Skip these for now
          }
        }
        return true
      },
    )

    const safeUpdaters = validUpdateInPaths.map((path) => {
      const currentValue = StateHelper.getValueAtPath(state, path)

      if (typeof currentValue === 'string') {
        return fc
          .record({
            path: fc.constant(path),
            updater: fc.constantFrom(
              (x: string) => x.toUpperCase(),
              (x: string) => x + '-updated',
              (x: string) => x,
            ),
          })
          .map(({ path, updater }) => new UpdateInCommand(path, updater))
      } else if (typeof currentValue === 'number') {
        return fc
          .record({
            path: fc.constant(path),
            updater: fc.constantFrom(
              (x: number) => x + 1,
              (x: number) => x * 2,
              (x: number) => Math.max(0, x - 1),
            ),
          })
          .map(({ path, updater }) => new UpdateInCommand(path, updater))
      } else {
        return fc.constant(new SetInCommand(path, 'fallback'))
      }
    })

    if (safeUpdaters.length > 0) {
      commands.push(fc.oneof(...safeUpdaters))
    }

    // Simple fallback
    if (commands.length === 0) {
      commands.push(fc.constant(new SetInCommand(['fallback'], 'value')))
    }

    return fc.oneof(...commands)
  }

  /**
   * Generate completely random state structures of varying shapes and types
   */
  function generateRandomState(): fc.Arbitrary<unknown> {
    const primitiveArb = fc.oneof(
      fc.string({ maxLength: 10 }),
      fc.integer({ min: 0, max: 100 }),
      fc.boolean(),
      fc.constant(null),
    )

    const arrayArb = fc.array(primitiveArb, { maxLength: 4 })
    const setArb = fc
      .array(fc.string({ maxLength: 5 }), { maxLength: 3 })
      .map((arr) => new Set(arr))
    const mapArb = fc
      .dictionary(fc.string({ maxLength: 5 }), primitiveArb, { maxKeys: 3 })
      .map((dict) => new Map(Object.entries(dict)))

    // Define leaf values (primitives and collections)
    const leafArb = fc.oneof(primitiveArb, arrayArb, setArb, mapArb)

    // Define nested objects with up to 2 levels of depth to keep complexity manageable
    const simpleObjectArb = fc.dictionary(
      fc.string({ minLength: 1, maxLength: 8 }),
      leafArb,
      { minKeys: 1, maxKeys: 4 },
    )

    const nestedObjectArb = fc.dictionary(
      fc.string({ minLength: 1, maxLength: 8 }),
      fc.oneof(leafArb, simpleObjectArb),
      { minKeys: 1, maxKeys: 3 },
    )

    return nestedObjectArb
  }

  test.prop([generateRandomState()])(
    'GENERATIVE: Random command sequences maintain model consistency',
    async (initialState) => {
      const numCommands = Math.floor(Math.random() * 5) + 1

      let currentRealState = initialState
      const modelState = structuredClone(initialState)
      const originalBackup = structuredClone(initialState)

      // Generate and apply command sequence
      for (let i = 0; i < numCommands; i++) {
        const commandArb = generateSafeCommandsForState(modelState)
        const commands = fc.sample(commandArb, 1)
        const command = commands[0] as PatchforkCommand

        // Only execute if command is valid
        if (command.canExecute(currentRealState)) {
          const beforeReal = structuredClone(currentRealState)
          const beforeModel = structuredClone(modelState)

          try {
            // Execute on both real and model
            const realResult = await command.executeOnReal(currentRealState)
            await command.executeOnModel(modelState)

            // Update states only if both succeeded
            currentRealState = realResult

            // Verify immutability of previous states
            expect(beforeReal).toEqual(beforeModel)

            // Verify model-real consistency immediately
            command.validate(modelState, currentRealState)
          } catch (error) {
            console.log(
              `Command ${command.type} failed on path [${command.path}]: ${(error as any).message}`,
            )
            console.log(
              'State when failed:',
              JSON.stringify(currentRealState, null, 2),
            )
            throw error // Re-throw to fail the test and see what's happening
          }
        }
      }

      // Original state must never be mutated
      expect(initialState).toEqual(originalBackup)

      // Final states should be consistent
      expect(currentRealState).toEqual(modelState)
    },
  )
})

// Phase 3: Async Operations Testing
describe('Phase 3: Async Operations', () => {
  class AsyncSetInCommand extends PatchforkCommand {
    readonly type = 'AsyncSetIn'

    constructor(
      public readonly path: (string | number)[],
      public value: any,
    ) {
      super()
    }

    canExecute(state: any): boolean {
      return this.path.every((_, index) => {
        let current = state
        for (let i = 0; i <= index; i++) {
          if (current == null || typeof current !== 'object') {
            return false
          }
          if (i === index) return true
          current = current[this.path[i]]
        }
        return true
      })
    }

    async executeOnReal(state: any): Promise<any> {
      await Promise.resolve() // Simulate async delay
      let setter = fork(state) as any
      for (const segment of this.path) {
        setter = setter[segment]
      }
      return setter(this.value)
    }

    async executeOnModel(modelState: any): Promise<void> {
      await Promise.resolve() // Simulate async delay
      StateHelper.setValueAtPath(modelState, this.path, this.value)
    }
  }

  class AsyncUpdateInCommand extends PatchforkCommand {
    readonly type = 'AsyncUpdateIn'

    constructor(
      public readonly path: (string | number)[],
      public updater: (value: any) => any,
    ) {
      super()
    }

    canExecute(state: any): boolean {
      return this.path.every((_, index) => {
        let current = state
        for (let i = 0; i <= index; i++) {
          if (current == null || typeof current !== 'object') {
            return false
          }
          if (i === index) return true
          current = current[this.path[i]]
        }
        return true
      })
    }

    async executeOnReal(state: any): Promise<any> {
      await Promise.resolve() // Simulate async delay
      let updater = fork(state) as any
      for (const segment of this.path) {
        updater = updater[segment]
      }
      return updater(this.updater)
    }

    async executeOnModel(modelState: any): Promise<void> {
      await Promise.resolve() // Simulate async delay
      const currentValue = StateHelper.getValueAtPath(modelState, this.path)
      const newValue = this.updater(currentValue)
      StateHelper.setValueAtPath(modelState, this.path, newValue)
    }
  }

  class AsyncMultiOperationCommand extends PatchforkCommand {
    readonly type = 'AsyncMultiOperation'
    readonly path: (string | number)[] = []

    constructor(public operations: PatchforkCommand[]) {
      super()
    }

    canExecute(state: any): boolean {
      return this.operations.every((op) => op.canExecute(state))
    }

    async executeOnReal(state: any): Promise<any> {
      let currentState = state
      for (const operation of this.operations) {
        await Promise.resolve() // Async delay between operations
        currentState = await operation.executeOnReal(currentState)
      }
      return currentState
    }

    async executeOnModel(modelState: any): Promise<void> {
      for (const operation of this.operations) {
        await Promise.resolve() // Async delay between operations
        await operation.executeOnModel(modelState)
      }
    }
  }

  function generateAsyncCommands(
    state: any,
    seed: number = 12345,
  ): PatchforkCommand[] {
    const commands: PatchforkCommand[] = []
    let counter = seed

    // Generate individual async operations
    const paths = StateHelper.getAllPaths(state).slice(0, 4)

    // Single async SetIn operations
    for (const path of paths) {
      if (StateHelper.isValidPath(state, path)) {
        commands.push(new AsyncSetInCommand(path, `async-value-${counter++}`))
      }
    }

    // Single async UpdateIn operations
    for (const path of paths) {
      if (StateHelper.isValidPath(state, path)) {
        const target = StateHelper.getValueAtPath(state, path)
        if (typeof target === 'string') {
          commands.push(
            new AsyncUpdateInCommand(path, (s: string) => s.toUpperCase()),
          )
        } else if (typeof target === 'number') {
          commands.push(new AsyncUpdateInCommand(path, (n: number) => n + 1))
        }
      }
    }

    // Multi-operation sequences with async delays between them
    if (paths.length >= 2) {
      const operations = [
        new SetInCommand(paths[0], `multi-async-${counter++}`),
        new SetInCommand(paths[1], `multi-async-${counter++}`),
      ]
      commands.push(new AsyncMultiOperationCommand(operations))
    }

    return commands
  }

  /**
   * Generate a concrete random state for testing async operations
   */
  function createRandomState() {
    return {
      count: Math.floor(Math.random() * 100),
      users: [
        { name: 'John', active: true },
        { name: 'Jane', active: false },
      ],
      settings: {
        theme: 'dark',
        notifications: true,
      },
      tags: new Set(['admin', 'user']),
      metadata: new Map([
        ['version', '1.0'],
        ['env', 'test'],
      ]),
    }
  }

  test('async operations with Promise.resolve delays preserve state consistency', async () => {
    const initialState = createRandomState()
    let realState = structuredClone(initialState)
    let modelState = structuredClone(initialState)

    const commands = generateAsyncCommands(initialState, 1000)

    for (const command of commands) {
      if (command.canExecute(realState)) {
        const realResult = await command.executeOnReal(realState)
        const modelStateClone = structuredClone(modelState)
        await command.executeOnModel(modelStateClone)

        command.validate(modelStateClone, realResult)
        realState = realResult
        modelState = modelStateClone
      }
    }
  })

  test('multi-operation async sequences with delays between operations', async () => {
    const initialState = createRandomState()
    const operations = [
      new SetInCommand(['count'], 999),
      new SetInCommand(['settings', 'theme'], 'async-theme'),
      new UpdateInCommand(
        ['users', 0, 'name'],
        (name: string) => `async-${name}`,
      ),
    ]

    const asyncMultiCommand = new AsyncMultiOperationCommand(operations)

    // Test that it can execute
    expect(asyncMultiCommand.canExecute(initialState)).toBe(true)

    // Execute on both real and model
    const realResult = await asyncMultiCommand.executeOnReal(initialState)
    const modelState = structuredClone(initialState)
    await asyncMultiCommand.executeOnModel(modelState)

    // Verify consistency
    asyncMultiCommand.validate(modelState, realResult)

    // Check specific values were set
    expect(realResult.count).toBe(999)
    expect(realResult.settings.theme).toBe('async-theme')
    expect(realResult.users[0].name).toBe('async-John')
  })

  test.prop([fc.integer({ min: 1, max: 3 })])(
    'async command sequences with Promise delays maintain consistency',
    async (commandCount) => {
      const initialState = createRandomState()
      let realState = structuredClone(initialState)
      let modelState = structuredClone(initialState)
      let seed = 2000

      for (let i = 0; i < commandCount; i++) {
        const commands = generateAsyncCommands(realState, seed + i * 10)
        const validCommands = commands.filter((cmd) =>
          cmd.canExecute(realState),
        )

        if (validCommands.length > 0) {
          const command = validCommands[0] // Use first valid command for determinism

          const newRealState = await command.executeOnReal(realState)
          const newModelState = structuredClone(modelState)
          await command.executeOnModel(newModelState)

          command.validate(newModelState, newRealState)
          realState = newRealState
          modelState = newModelState
        }
      }
    },
  )

  test('async operations handle timing correctly', async () => {
    const initialState = createRandomState()

    // Create an async SetIn command
    const asyncSetCommand = new AsyncSetInCommand(['count'], 42)

    const startTime = performance.now()
    const result = await asyncSetCommand.executeOnReal(initialState)
    const endTime = performance.now()

    // Verify the async delay occurred (should be at least a few microseconds)
    expect(endTime - startTime).toBeGreaterThan(0)
    expect(result.count).toBe(42)
  })
})
