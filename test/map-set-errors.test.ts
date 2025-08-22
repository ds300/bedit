import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { fork, setDevMode, key } from '../src/patchfork.mjs'

describe('Map/Set error handling', () => {
  beforeEach(() => {
    setDevMode(true)
  })

  afterEach(() => {
    setDevMode(false)
  })

  it('should throw error for invalid Map property access with setIn', () => {
    const obj = { data: new Map([['key', 'value']]) }
    // @ts-expect-error
    ;() => fork(obj).data.invalidProp('test')
  })

  it('should throw error for invalid Set property access with setIn', () => {
    const obj = { tags: new Set(['tag1']) }
    // @ts-expect-error
    ;() => fork(obj).tags.invalidProp('test')
  })

  it('should throw type error for invalid Map property access with updateIn', () => {
    const obj = { config: new Map([['theme', 'dark']]) }
    // @ts-expect-error
    ;() => fork(obj).config.theme((theme) => theme.toUpperCase())
  })

  it('should throw type error for invalid Set property access with updateIn', () => {
    const obj = { tags: new Set(['react', 'typescript']) }
    // @ts-expect-error
    ;() => fork(obj).tags.size((_size) => 3)
  })

  it('should throw type error for invalid Map property access with edit.batch', () => {
    const obj = { cache: new Map([['user1', { name: 'John' }]]) }
    const updater = vi.fn((user) => {
      user.name = 'Jane'
      return user
    })
    // @ts-expect-error
    const result = fork.do(obj).cache.user1(updater)
    expect(result).toBeUndefined()
    expect(updater).not.toHaveBeenCalled()
  })

  it('should throw error for invalid Set property access with edit.batch', () => {
    const obj = { permissions: new Set(['read', 'write']) }
    // @ts-expect-error
    ;() => fork.do(obj).permissions.add('admin')
  })

  it('should work correctly with proper [key]() usage on Maps', () => {
    const obj = { data: new Map([['key1', 'value1']]) }

    // These should all work properly
    const result1 = fork(obj).data[key]('key2')('value2')
    expect(result1.data.get('key2')).toBe('value2')

    const result2 = fork(obj).data[key]('key1')((val) => val.toUpperCase())!
    expect(result2.data.get('key1')).toBe('VALUE1')
  })

  it('should handle nested Map/Set error scenarios', () => {
    const obj = {
      config: {
        cache: new Map<string, Set<string> | Map<string, string>>([
          ['users', new Set(['user1', 'user2'])],
          ['settings', new Map([['theme', 'dark']])],
        ]),
      },
    }

    // Invalid nested Map access
    // @ts-expect-error
    fork(obj).config.cache.users('user3')

    // Invalid nested Set access
    // @ts-expect-error
    fork(obj).config.cache[key]('users').add('user3')
  })

  it('should handle errors with symbol properties', () => {
    const symbolKey = Symbol('test')
    const obj = { data: new Map([[symbolKey, 'value']]) }

    // @ts-expect-error
    fork(obj).data[symbolKey]('new value')
  })

  it('should handle errors with numeric property access on Maps', () => {
    const obj = {
      items: new Map([
        ['0', 'first'],
        ['1', 'second'],
      ]),
    }

    // @ts-expect-error
    fork(obj).items[0]('updated')
  })
})
