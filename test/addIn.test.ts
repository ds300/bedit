import { describe, it, expect } from './test-utils'
import { addIn } from '../src/bedit.mjs'

describe('addIn', () => {
  it('should add items to an array', () => {
    const arr = [1, 2, 3]
    const backup = structuredClone(arr)
    const mutable = structuredClone(arr)
    mutable.push(4, 5)

    const result = addIn(arr)(4, 5)

    expect(result).toEqual(mutable)
    expect(arr).toEqual(backup)
  })

  it('should add items to a Set', () => {
    const set = new Set(['a', 'b', 'c'])
    const backup = structuredClone(set)
    const mutable = structuredClone(set)
    mutable.add('d')
    mutable.add('e')

    const result = addIn(set)('d', 'e')

    expect(result).toEqual(mutable)
    expect(set).toEqual(backup)
  })

  it('should add items to nested arrays', () => {
    const obj = {
      users: [
        { name: 'John', tags: ['admin'] },
        { name: 'Jane', tags: ['user'] },
      ],
    }
    const backup = structuredClone(obj)
    const mutable = structuredClone(obj)
    mutable.users[0].tags.push('moderator', 'vip')

    const result = addIn(obj).users[0].tags('moderator', 'vip')

    expect(result).toEqual(mutable)
    expect(obj).toEqual(backup)
  })

  it('should add items to nested Sets', () => {
    const obj = {
      categories: {
        tech: new Set(['javascript', 'typescript']),
        design: new Set(['css', 'ui']),
      },
    }
    const backup = structuredClone(obj)
    const mutable = structuredClone(obj)
    mutable.categories.tech.add('react')
    mutable.categories.tech.add('vue')

    const result = addIn(obj).categories.tech('react', 'vue')

    expect(result).toEqual(mutable)
    expect(obj).toEqual(backup)
  })

  it('should add items to nested Maps', () => {
    const obj = {
      users: new Map([
        ['user1', { name: 'John', tags: new Set(['admin']) }],
        ['user2', { name: 'Jane', tags: new Set(['user']) }],
      ]),
    }
    const backup = structuredClone(obj)
    const mutable = structuredClone(obj)
    mutable.users.get('user1')!.tags.add('moderator')
    mutable.users.get('user1')!.tags.add('vip')

    const result = addIn(obj).users.key('user1').tags('moderator', 'vip')

    expect(result).toEqual(mutable)
    expect(obj).toEqual(backup)
  })

  it('should throw error when trying to add to non-array/non-Set', () => {
    const obj = { name: 'John', age: 30 }
    const backup = structuredClone(obj)

    expect(() => {
      // @ts-expect-error
      addIn(obj)('new property')
    }).toThrow('Cannot add to Object')
    expect(obj).toEqual(backup)
  })

  it('should maintain immutability of original objects', () => {
    const originalArray = [1, 2, 3]
    const originalSet = new Set(['a', 'b'])
    const originalObj = {
      users: [{ name: 'John', tags: ['admin'] }],
    }

    const arrayBackup = structuredClone(originalArray)
    const setBackup = structuredClone(originalSet)
    const objBackup = structuredClone(originalObj)

    // Perform multiple operations
    const result1 = addIn(originalArray)(4, 5)
    const result2 = addIn(originalSet)('c', 'd')
    const result3 = addIn(originalObj).users[0].tags('moderator')

    // Verify originals are unchanged
    expect(originalArray).toEqual(arrayBackup)
    expect(originalSet).toEqual(setBackup)
    expect(originalObj).toEqual(objBackup)

    // Verify results are new objects
    expect(result1).not.toBe(originalArray)
    expect(result2).not.toBe(originalSet)
    expect(result3).not.toBe(originalObj)
  })
})
