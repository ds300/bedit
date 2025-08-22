import { describe, it, expect } from 'vitest'
import { patch, fork, key } from '../src/patchfork.mjs'
import {
  $asyncPatchable,
  $patchable,
  AsyncPatchable,
  Patchable,
} from '../src/symbols.mjs'

class MySyncSignal<T extends object> implements Patchable<T> {
  constructor(private value: T) {}
  get() {
    return this.value
  }
  set(value: T) {
    this.value = value
  }
  [$patchable] = this
}

class MyAsyncGetSignal<T extends object> implements AsyncPatchable<T> {
  constructor(private value: T) {}
  async get() {
    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 1))
    return this.value
  }
  set(value: T) {
    this.value = value
  }
  [$asyncPatchable] = this
}

class MyAsyncSetSignal<T> {
  constructor(private value: T) {}
  get() {
    return this.value
  }
  async set(value: T) {
    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 1))
    this.value = value
  }
  [$patchable] = this
}

class MyFullyAsyncSignal<T extends object> implements AsyncPatchable<T> {
  constructor(private value: T) {}
  async get() {
    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 1))
    return this.value
  }
  async set(value: T) {
    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 1))
    this.value = value
  }
  [$asyncPatchable] = this
}

describe('synchronous state container', () => {
  it('should work with patch', () => {
    const original = {
      count: 0,
      user: { name: 'John', age: 25 },
    }
    const signal = new MySyncSignal(original)
    const result = patch(signal).count(1)
    expect(result.count).toBe(1)
    expect(signal.get().count).toBe(1)
    expect(signal.get().user).toBe(original.user) // unchanged reference
  })

  it('should work with fork on plain objects', () => {
    const original = {
      count: 0,
      user: { name: 'John', age: 25 },
    }
    const signal = new MySyncSignal(original)
    const result = fork(signal.get()).count(1)
    expect(result.count).toBe(1)
    expect(signal.get().count).toBe(0) // original unchanged
  })

  it('should work with nested updates', () => {
    const original = {
      user: { name: 'John', age: 25, preferences: { theme: 'dark' } },
    }
    const signal = new MySyncSignal(original)

    patch(signal).user.name('Jane')
    expect(signal.get().user.name).toBe('Jane')
    expect(signal.get().user.age).toBe(25)

    patch(signal).user.preferences.theme('light')
    expect(signal.get().user.preferences.theme).toBe('light')
  })
})

describe('async get only state container', () => {
  it('should work with patch', async () => {
    const original = {
      count: 0,
      user: { name: 'John', age: 25 },
    }
    const signal = new MyAsyncGetSignal(original)
    const result = await patch(signal).count(1)
    expect(result.count).toBe(1)
    expect((await signal.get()).count).toBe(1)
    expect((await signal.get()).user).toBe(original.user) // unchanged reference
  })

  it('should work with fork on plain objects', async () => {
    const original = {
      count: 0,
      user: { name: 'John', age: 25 },
    }
    const signal = new MyAsyncGetSignal(original)
    const currentState = await signal.get()
    const result = fork(currentState).count(1)
    expect(result.count).toBe(1)
    expect((await signal.get()).count).toBe(0) // original unchanged
  })

  it('should work with nested updates', async () => {
    const original = {
      user: { name: 'John', age: 25, preferences: { theme: 'dark' } },
    }
    const signal = new MyAsyncGetSignal(original)

    await patch(signal).user.name('Jane')
    expect((await signal.get()).user.name).toBe('Jane')
    expect((await signal.get()).user.age).toBe(25)

    await patch(signal).user.preferences.theme('light')
    expect((await signal.get()).user.preferences.theme).toBe('light')
  })

  it('should work with complex state updates', async () => {
    const original = {
      items: [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
      ],
      meta: { count: 2, lastUpdated: null as string | null },
    }
    const signal = new MyAsyncGetSignal(original)

    // Add new item
    await patch(signal).items.push({ id: 3, name: 'Item 3' })
    expect((await signal.get()).items).toHaveLength(3)
    expect((await signal.get()).items[2].name).toBe('Item 3')

    // Update meta
    await patch(signal).meta.count(3)
    await patch(signal).meta.lastUpdated('2023-01-01')
    expect((await signal.get()).meta.count).toBe(3)
    expect((await signal.get()).meta.lastUpdated).toBe('2023-01-01')
  })
})

describe('async set only state container', () => {
  it('should work with patch', async () => {
    const original = {
      count: 0,
      user: { name: 'John', age: 25 },
    }
    const signal = new MyAsyncSetSignal(original)
    const result = await patch(signal).count(1)
    expect(result.count).toBe(1)
    expect(signal.get().count).toBe(1)
    expect(signal.get().user).toBe(original.user) // unchanged reference
  })

  it('should work with fork on plain objects', () => {
    const original = {
      count: 0,
      user: { name: 'John', age: 25 },
    }
    const signal = new MyAsyncSetSignal(original)
    const currentState = signal.get()
    const result = fork(currentState).count(1)
    expect(result.count).toBe(1)
    expect(signal.get().count).toBe(0) // original unchanged
  })

  it('should work with nested updates', async () => {
    const original = {
      user: { name: 'John', age: 25, preferences: { theme: 'dark' } },
    }
    const signal = new MyAsyncSetSignal(original)

    await patch(signal).user.name('Jane')
    expect(signal.get().user.name).toBe('Jane')
    expect(signal.get().user.age).toBe(25)

    await patch(signal).user.preferences.theme('light')
    expect(signal.get().user.preferences.theme).toBe('light')
  })

  it('should work with array operations', async () => {
    const original = {
      items: [1, 2, 3],
      tags: new Set(['tag1', 'tag2']),
      data: new Map([['key1', 'value1']]),
    }
    const signal = new MyAsyncSetSignal(original)

    // Array operations
    await patch(signal).items.push(4)
    expect(signal.get().items).toEqual([1, 2, 3, 4])

    await patch(signal).items[0](10)
    expect(signal.get().items[0]).toBe(10)

    // Set operations
    await patch(signal).tags.add('tag3')
    expect(signal.get().tags.has('tag3')).toBe(true)

    await patch(signal).tags.delete('tag1')
    expect(signal.get().tags.has('tag1')).toBe(false)

    // Map operations - using the key symbol
    await patch(signal).data[key]('key2')('value2')
    expect(signal.get().data.get('key2')).toBe('value2')
  })
})

describe('fully async state container', () => {
  it('should work with patch', async () => {
    const original = {
      count: 0,
      user: { name: 'John', age: 25 },
    }
    const signal = new MyFullyAsyncSignal(original)
    const result = await patch(signal).count(1)
    expect(result.count).toBe(1)
    expect((await signal.get()).count).toBe(1)
    expect((await signal.get()).user).toBe(original.user) // unchanged reference
  })

  it('should work with fork on plain objects', async () => {
    const original = {
      count: 0,
      user: { name: 'John', age: 25 },
    }
    const signal = new MyFullyAsyncSignal(original)
    const currentState = await signal.get()
    const result = fork(currentState).count(1)
    expect(result.count).toBe(1)
    expect((await signal.get()).count).toBe(0) // original unchanged
  })

  it('should work with complex nested operations', async () => {
    const original = {
      app: {
        users: [
          {
            id: 1,
            profile: { name: 'John', settings: { notifications: true } },
          },
          {
            id: 2,
            profile: { name: 'Jane', settings: { notifications: false } },
          },
        ],
        meta: {
          version: '1.0.0',
          features: new Set(['auth', 'notifications']),
          config: new Map([
            ['debug', 'false'],
            ['theme', 'light'],
          ]),
        },
      },
    }
    const signal = new MyFullyAsyncSignal(original)

    // Deep nested update
    await patch(signal).app.users[0].profile.name('Johnny')
    expect((await signal.get()).app.users[0].profile.name).toBe('Johnny')

    // Update user settings
    await patch(signal).app.users[1].profile.settings.notifications(true)
    expect(
      (await signal.get()).app.users[1].profile.settings.notifications,
    ).toBe(true)

    // Add new user
    await patch(signal).app.users.push({
      id: 3,
      profile: { name: 'Bob', settings: { notifications: true } },
    })
    expect((await signal.get()).app.users).toHaveLength(3)
    expect((await signal.get()).app.users[2].profile.name).toBe('Bob')

    // Update meta features
    await patch(signal).app.meta.features.add('analytics')
    expect((await signal.get()).app.meta.features.has('analytics')).toBe(true)

    // Update meta config
    await patch(signal).app.meta.config[key]('debug')('true')
    expect((await signal.get()).app.meta.config.get('debug')).toBe('true')
  })

  it('should handle function updates', async () => {
    const original = {
      counter: { value: 5 },
      multiplier: 2,
    }
    const signal = new MyFullyAsyncSignal(original)

    // Function-based updates
    await patch(signal).counter.value((v) => v * 2)
    expect((await signal.get()).counter.value).toBe(10)

    await patch(signal).multiplier((m) => m + 1)
    expect((await signal.get()).multiplier).toBe(3)

    // Combined operations - need to get current state first
    const currentState = await signal.get()
    await patch(signal).counter.value((v) => v + currentState.multiplier)
    expect((await signal.get()).counter.value).toBe(13) // 10 + 3
  })

  it('should maintain structural sharing', async () => {
    const original = {
      shared: { data: 'unchanged' },
      target: { value: 1 },
    }
    const signal = new MyFullyAsyncSignal(original)

    await patch(signal).target.value(2)
    const result = await signal.get()

    expect(result.target.value).toBe(2)
    expect(result.shared).toBe(original.shared) // Reference should be preserved
  })
})
