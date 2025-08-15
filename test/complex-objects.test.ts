import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { setIn, updateIn, editIn, setDevMode } from '../src/bedit.mjs'

describe('complex object cloning', () => {
  beforeEach(() => {
    setDevMode(true)
  })

  afterEach(() => {
    setDevMode(false)
  })

  it('should use structuredClone for class instances', () => {
    class CustomClass { 
      constructor(public value: number) {} 
      method() { return this.value * 2 }
    }
    const obj = { custom: new CustomClass(42) }
    const newInstance = new CustomClass(100)
    const result = setIn(obj).custom(newInstance)
    
    expect(result.custom.value).toBe(100)
    expect(result.custom.method()).toBe(200)
    expect(result.custom).not.toBe(obj.custom) // Should be cloned
    expect(result.custom).toBe(newInstance) // Should be the new instance
  })
  
  it('should handle Date objects', () => {
    const obj = { timestamp: new Date('2023-01-01') }
    const newDate = new Date('2024-01-01')
    const result = setIn(obj).timestamp(newDate)
    
    expect(result.timestamp).toEqual(newDate)
    expect(result.timestamp).toBe(newDate) // Should be the same reference for primitives
    expect(result.timestamp.getFullYear()).toBe(2024)
  })

  it('should handle RegExp objects', () => {
    const obj = { pattern: /old-pattern/gi }
    const newPattern = /new-pattern/im
    const result = setIn(obj).pattern(newPattern)
    
    expect(result.pattern).toBe(newPattern)
    expect(result.pattern.source).toBe('new-pattern')
    expect(result.pattern.flags).toBe('im')
    expect(result.pattern).not.toBe(obj.pattern)
  })

  it('should handle RegExp in nested structures', () => {
    const obj = { config: { validation: { email: /\S+@\S+\.\S+/ } } }
    const newEmailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    
    const result = setIn(obj).config.validation.email(newEmailPattern)
    
    expect(result.config.validation.email).toBe(newEmailPattern)
    expect(result.config.validation.email.test('test@example.com')).toBe(true)
  })

  it('should handle ArrayBuffer and typed arrays', () => {
    // Disable dev mode for this test since ArrayBuffers can't be frozen
    setDevMode(false)
    
    const buffer = new ArrayBuffer(8)
    const view = new Int32Array(buffer)
    view[0] = 42
    view[1] = 84
    
    const obj = { data: { buffer: view } }
    
    const newBuffer = new ArrayBuffer(4)
    const newView = new Int32Array(newBuffer)
    newView[0] = 999
    
    const result = setIn(obj).data.buffer(newView)
    
    expect(result.data.buffer).toBe(newView)
    expect(result.data.buffer[0]).toBe(999)
    expect(result.data.buffer).not.toBe(obj.data.buffer)
    
    // Re-enable dev mode
    setDevMode(true)
  })

  it('should handle Error objects', () => {
    const obj = { lastError: new Error('Original error') }
    const newError = new TypeError('New error')
    
    const result = setIn(obj).lastError(newError)
    
    expect(result.lastError).toBe(newError)
    expect(result.lastError.message).toBe('New error')
    expect(result.lastError instanceof TypeError).toBe(true)
  })

  it('should handle functions', () => {
    const obj = { callback: () => 'original' }
    const newCallback = () => 'updated'
    
    const result = setIn(obj).callback(newCallback)
    
    expect(result.callback).toBe(newCallback)
    expect(result.callback()).toBe('updated')
    expect(result.callback).not.toBe(obj.callback)
  })

  it('should handle primitives unchanged', () => {
    // Primitives don't need cloning, should pass through unchanged
    const obj = { 
      str: 'hello',
      num: 42,
      bool: true,
      nullVal: null,
      undefinedVal: undefined
    }
    
    const result = setIn(obj).str('world')
    
    expect(result.str).toBe('world')
    expect(result.num).toBe(42)
    expect(result.bool).toBe(true)
    expect(result.nullVal).toBe(null)
    expect(result.undefinedVal).toBe(undefined)
  })

  it('should handle complex nested objects with mixed types', () => {
    class Service { 
      constructor(public name: string) {}
      getName() { return this.name }
    }
    
    const obj = {
      service: new Service('auth'),
      config: {
        patterns: [/\d+/, /[a-z]+/gi],
        dates: [new Date('2023-01-01'), new Date('2023-12-31')],
        buffer: new ArrayBuffer(16)
      }
    }
    
    const newService = new Service('user')
    const result = setIn(obj).service(newService)
    
    expect(result.service.getName()).toBe('user')
    expect(result.config.patterns[0]).toBe(obj.config.patterns[0]) // Unchanged
    expect(result.config.dates[0]).toBe(obj.config.dates[0]) // Unchanged
  })
})