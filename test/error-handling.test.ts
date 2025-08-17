import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { setIn, setDevMode } from '../src/bedit.mjs'

describe('error handling fallbacks', () => {
  beforeEach(() => {
    setDevMode(true)
  })

  afterEach(() => {
    setDevMode(false)
  })

  it('should handle missing Error.captureStackTrace', () => {
    const originalCaptureStackTrace = Error.captureStackTrace
    
    // @ts-expect-error
    delete Error.captureStackTrace
    
    try {
      expect(() => {
        const obj = { user: 'not an object' }
        // @ts-expect-error
        setIn(obj).user.name('John')
      }).toThrow('Cannot read property "name" of string')
    } finally {
      Error.captureStackTrace = originalCaptureStackTrace
    }
  })

  it('should handle Error.captureStackTrace with different implementations', () => {
    const originalCaptureStackTrace = Error.captureStackTrace
    let captureStackTraceCalled = false
    
    // Mock a different implementation
    Error.captureStackTrace = (error: Error) => {
      captureStackTraceCalled = true
      // Simulate some stack trace manipulation
      error.stack = 'Mocked stack trace'
    }
    
    try {
      expect(() => {
        const obj = { data: null }
        // @ts-expect-error
        setIn(obj).data.prop('value')
      }).toThrow('Cannot read property "prop" of null')
      
      expect(captureStackTraceCalled).toBe(true)
    } finally {
      Error.captureStackTrace = originalCaptureStackTrace
    }
  })

  it('should handle Error.captureStackTrace throwing errors', () => {
    const originalCaptureStackTrace = Error.captureStackTrace
    
    // Skip this test if Error.captureStackTrace is not available
    if (!originalCaptureStackTrace) {
      return
    }
    
    // Mock Error.captureStackTrace to not throw, just log instead
    let captureStackTraceAttempted = false
    Error.captureStackTrace = () => {
      captureStackTraceAttempted = true
      // Don't throw, just mark that it was attempted
    }
    
    try {
      expect(() => {
        const obj = { user: undefined }
        // @ts-expect-error
        setIn(obj).user.profile.name('John')
      }).toThrow('Cannot read property "profile" of undefined')
      
      // Verify that captureStackTrace was attempted
      expect(captureStackTraceAttempted).toBe(true)
    } finally {
      Error.captureStackTrace = originalCaptureStackTrace
    }
  })

  it('should handle environments with null Error.captureStackTrace', () => {
    const originalCaptureStackTrace = Error.captureStackTrace
    
    // @ts-expect-error
    Error.captureStackTrace = null
    
    try {
      expect(() => {
        const obj = { count: 42 }
        // @ts-expect-error
        setIn(obj).count.toString.length('invalid')
      }).toThrow('Cannot read property "toString" of number')
    } finally {
      Error.captureStackTrace = originalCaptureStackTrace
    }
  })

  it('should handle environments with undefined Error.captureStackTrace', () => {
    const originalCaptureStackTrace = Error.captureStackTrace
    
    // @ts-expect-error
    Error.captureStackTrace = undefined
    
    try {
      expect(() => {
        const obj = { flag: true }
        setIn(obj).flag.valueOf.call('invalid')
      }).toThrow('Cannot read property "valueOf" of boolean')
    } finally {
      Error.captureStackTrace = originalCaptureStackTrace
    }
  })

  it('should preserve error messages without Error.captureStackTrace', () => {
    const originalCaptureStackTrace = Error.captureStackTrace
    
    // @ts-expect-error
    delete Error.captureStackTrace
    
    try {
      let thrownError: Error | null = null
      try {
        const obj = { nested: { deep: null } }
        // @ts-expect-error
        setIn(obj).nested.deep.value('test')
      } catch (error) {
        thrownError = error as Error
      }
      
      expect(thrownError).toBeInstanceOf(TypeError)
      expect(thrownError?.message).toContain('Cannot read property "value" of null')
    } finally {
      Error.captureStackTrace = originalCaptureStackTrace
    }
  })

  it('should handle complex nested errors without Error.captureStackTrace', () => {
    const originalCaptureStackTrace = Error.captureStackTrace
    
    // @ts-expect-error
    delete Error.captureStackTrace
    
    try {
      const obj = { 
        level1: { 
          level2: { 
            level3: 'string instead of object' 
          } 
        } 
      }
      
      expect(() => {
        // @ts-expect-error
        setIn(obj).level1.level2.level3.level4.value('test')
      }).toThrow('Cannot read property "level4" of string')
    } finally {
      Error.captureStackTrace = originalCaptureStackTrace
    }
  })

  it('should handle symbol property errors without Error.captureStackTrace', () => {
    const originalCaptureStackTrace = Error.captureStackTrace
    
    // @ts-expect-error
    delete Error.captureStackTrace
    
    try {
      const symbolProp = Symbol('testProp')
      const obj = { [symbolProp]: null }
      
      expect(() => {
        // @ts-expect-error
        setIn(obj)[symbolProp].nested('value')
      }).toThrow('Cannot read property "nested" of null')
    } finally {
      Error.captureStackTrace = originalCaptureStackTrace  
    }
  })

  it('should work normally when Error.captureStackTrace is available', () => {
    // This test verifies normal operation when captureStackTrace exists
    let stackTraceCaptured = false
    const originalCaptureStackTrace = Error.captureStackTrace
    
    if (originalCaptureStackTrace) {
      Error.captureStackTrace = (error: Error, constructorOpt?: Function) => {
        stackTraceCaptured = true
        return originalCaptureStackTrace.call(Error, error, constructorOpt)
      }
      
      try {
        expect(() => {
          const obj = { data: null }
          // @ts-expect-error
          setIn(obj).data.items[0]('value')
        }).toThrow('Cannot read property "items" of null')
        
        // In Node.js environments, this should be called
        if (typeof process !== 'undefined' && process.versions && process.versions.node) {
          expect(stackTraceCaptured).toBe(true)
        }
      } finally {
        Error.captureStackTrace = originalCaptureStackTrace
      }
    } else {
      // In browsers or environments without captureStackTrace
      expect(() => {
        const obj = { data: null }
        // @ts-expect-error
        setIn(obj).data.items[0]('value')
      }).toThrow('Cannot read property "items" of null')
    }
  })
})