import { describe, it, expect } from 'vitest'
import { update } from '../src/bedit.mjs'
import { $beditStateContainer } from '../src/symbols.mjs'

class MySignal<T> {
  constructor(private value: T) {}
  get() {
    return this.value
  }
  set(value: T) {
    this.value = value
  }
  [$beditStateContainer] = this
}

class MyAsyncSignal<T> {
  constructor(private value: T) {}
  async get() {
    return this.value
  }
  async set(value: T) {
    this.value = value
  }
  [$beditStateContainer] = this
}

describe('state container', () => {
  it.only('should work', () => {
    const original = {
      count: 0,
    }
    const signal = new MySignal(original)
    const result = update(signal).count(1)
    expect(result.count).toBe(1)
    expect(signal.get().count).toBe(1)
  })
})

describe('async state container', () => {
  it('should work', async () => {
    const original = {
      count: 0,
    }
    const signal = new MyAsyncSignal(original)
    const result = await update(signal).count(1)
    expect(result.count).toBe(1)
    expect((await signal.get()).count).toBe(1)
  })
})
