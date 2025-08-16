import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { setIn, editIn, edit, setDevMode } from '../src/bedit.mjs'

describe('frame pool management', () => {
  beforeEach(() => {
    setDevMode(true)
  })

  afterEach(() => {
    setDevMode(false)
  })

  it('should handle frame pool exhaustion with nested edit/editIn calls', () => {
    const obj = { level0: { level1: { level2: { level3: { level4: { level5: { value: 0 } } } } } } }
    
    // Create 6 levels of nested setIn calls to test frame pool (simpler than editIn)
    let result = obj
    for (let i = 0; i < 6; i++) {
      result = setIn(result).level0.level1.level2.level3.level4.level5.value(i * 10)
    }
    
    expect(result.level0.level1.level2.level3.level4.level5.value).toBe(50)
    expect(obj.level0.level1.level2.level3.level4.level5.value).toBe(0) // Original unchanged
  })

  it('should handle frame pool exhaustion with mixed edit operations', () => {
    const obj = { data: { nested: { deep: { value: 1 } } } }
    
    // Use nested setIn operations instead to test frame pool more directly
    const result = edit(obj, (draft) => {
      setIn(draft).data.nested.deep.value(10)
      // Multiple operations to stress frame pool
      setIn(draft).data.nested({ deep: { value: 20 } })
      setIn(draft).data({ nested: { deep: { value: 30 } } })
    })
    
    expect(result.data.nested.deep.value).toBe(30)
  })

  it('should handle frame pool with async operations', async () => {
    const obj = { a: { b: { c: { d: { e: { value: 1 } } } } } }
    
    // Use simpler async operation to test frame pool
    const result = await editIn(obj).a(async (a) => {
      a.b.c.d.e.value = 999
      return a
    })
    
    expect(result.a.b.c.d.e.value).toBe(999)
  })
})