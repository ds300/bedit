import { expectTypeOf, describe, it } from 'vitest'
import { edit, key } from '../src/bedit.mjs'

describe('optional object properties', () => {
  type Obj = {
    nested?: {
      name: string
      count: number
    }
    nullableNested?: {
      value: string
    } | null
    maybeUndefinedNested?:
      | {
          data: number[]
        }
      | undefined
  }
  const obj: Obj = {}

  it('should return maybe undefined for top-level optional object properties', () => {
    const result = edit.batch(obj).nested((draft) => {
      expectTypeOf(draft).toEqualTypeOf<{ name: string; count: number }>()
      draft.name = 'test'
      draft.count = 42
    })
    expectTypeOf(result).toEqualTypeOf<Obj | undefined>()
  })

  it('should handle nullable optional object properties', () => {
    const result = edit.batch(obj).nullableNested((draft) => {
      expectTypeOf(draft).toEqualTypeOf<{ value: string }>()
      if (draft) {
        draft.value = 'test'
      }
    })
    expectTypeOf(result).toEqualTypeOf<Obj | undefined>()
  })

  it('should handle maybe undefined object properties', () => {
    const result = edit.batch(obj).maybeUndefinedNested((draft) => {
      expectTypeOf(draft).toEqualTypeOf<{ data: readonly number[] }>()
      draft.data = [1, 2, 3]
    })
    expectTypeOf(result).toEqualTypeOf<Obj | undefined>()
  })
})

describe('required object properties', () => {
  type Obj = {
    profile: {
      name: string
      age: number
    }
    settings: {
      theme: string
      notifications: boolean
    }
    metadata: {
      created: Date
      tags: string[]
    }
  }
  const obj: Obj = {
    profile: { name: 'John', age: 30 },
    settings: { theme: 'dark', notifications: true },
    metadata: { created: new Date(), tags: ['user'] },
  }

  it('should accept mutator for required object property', () => {
    const result = edit.batch(obj).profile((draft) => {
      expectTypeOf(draft).toEqualTypeOf<{ name: string; age: number }>()
      draft.name = 'Jane'
      draft.age = 31
    })
    expectTypeOf(result).toEqualTypeOf<Obj>()
  })

  it('should accept mutator for nested required object', () => {
    const result = edit.batch(obj).settings((draft) => {
      expectTypeOf(draft).toEqualTypeOf<{
        theme: string
        notifications: boolean
      }>()
      draft.theme = 'light'
      draft.notifications = false
    })
    expectTypeOf(result).toEqualTypeOf<Obj>()
  })

  it('should accept mutator for object with mixed property types', () => {
    const result = edit.batch(obj).metadata((draft) => {
      expectTypeOf(draft).toEqualTypeOf<{
        created: Date
        tags: readonly string[]
      }>()
      draft.created = new Date()
      draft.tags = [...draft.tags, 'admin']
    })
    expectTypeOf(result).toEqualTypeOf<Obj>()
  })
})

describe('nested object properties', () => {
  type User = {
    profile: {
      name: string
      settings?: {
        theme: 'light' | 'dark'
        notifications?: boolean
      }
    }
    metadata?: {
      lastLogin: Date
    }
  }
  const user: User = {
    profile: { name: 'John', settings: { theme: 'light' } },
  }

  it('should edit nested optional property', () => {
    const result = edit.batch(user).profile.settings((draft) => {
      expectTypeOf(draft).toEqualTypeOf<{
        theme: 'light' | 'dark'
        notifications?: boolean
      }>()
      draft.theme = 'dark'
      draft.notifications = true
    })
    expectTypeOf(result).toEqualTypeOf<User | undefined>()
  })

  it('should edit optional nested object', () => {
    const result = edit.batch(user).metadata((draft) => {
      expectTypeOf(draft).toEqualTypeOf<{ lastLogin: Date }>()
      draft.lastLogin = new Date()
    })
    expectTypeOf(result).toEqualTypeOf<User | undefined>()
  })
})

describe('arrays', () => {
  type TodoList = {
    todos: Array<{ id: number; text: string; completed: boolean }>
    tags?: string[]
  }
  const todoList: TodoList = {
    todos: [{ id: 1, text: 'Learn TypeScript', completed: false }],
  }

  it('should edit array with mutator function', () => {
    const result = edit.batch(todoList).todos((draft) => {
      expectTypeOf(draft).toEqualTypeOf<
        Array<
          Readonly<{
            id: number
            text: string
            completed: boolean
          }>
        >
      >
      draft.push({ id: 2, text: 'New todo', completed: true })
    })
    expectTypeOf(result).toEqualTypeOf<TodoList>()
  })

  it('should edit array element by index', () => {
    const result = edit.batch(todoList).todos[0]((draft) => {
      expectTypeOf(draft).toEqualTypeOf<{
        id: number
        text: string
        completed: boolean
      }>()
      draft.completed = true
    })
    expectTypeOf(result).toEqualTypeOf<TodoList>()
  })

  it('should edit optional array property', () => {
    const result = edit.batch(todoList).tags((draft) => {
      expectTypeOf(draft).toEqualTypeOf<string[]>()
      draft.push('urgent', 'important')
    })
    expectTypeOf(result).toEqualTypeOf<TodoList | undefined>()
  })
})

describe('arrays within optional nested objects', () => {
  type UserProfile = {
    user?: {
      preferences: string[]
      optionalLists?: {
        favorites: number[]
        bookmarks?: string[]
      }
    }
    groups?: {
      admin: string[]
      member?: string[]
    }
  }
  const profile: UserProfile = {}

  it('should return undefined when edit.batchg arrays in optional objects', () => {
    const prefsResult = edit.batch(profile).user.preferences((draft) => {
      expectTypeOf(draft).toEqualTypeOf<string[]>()
      draft.push('dark-mode')
    })
    expectTypeOf(prefsResult).toEqualTypeOf<UserProfile | undefined>()

    const bookmarksResult = edit
      .batch(profile)
      .user.optionalLists.bookmarks((draft) => {
        expectTypeOf(draft).toEqualTypeOf<string[]>()
        draft.push('https://example.com')
      })
    expectTypeOf(bookmarksResult).toEqualTypeOf<UserProfile | undefined>()
  })

  it('should return maybe undefined when edit.batchg array elements in optional objects', () => {
    const prefResult = edit.batch(profile).user.preferences((draft) => {
      expectTypeOf(draft).toEqualTypeOf<string[]>()
      draft[0] = 'dark-mode'
    })
    expectTypeOf(prefResult).toEqualTypeOf<UserProfile | undefined>()

    const bookmarkResult = edit
      .batch(profile)
      .user.optionalLists.bookmarks((draft) => {
        expectTypeOf(draft).toEqualTypeOf<string[]>()
        draft[0] = 'https://example.com'
      })
    expectTypeOf(bookmarkResult).toEqualTypeOf<UserProfile | undefined>()
  })

  it('should handle deeply nested optional arrays', () => {
    type DeepNested = {
      level1?: {
        level2?: {
          level3?: {
            items: string[]
            optionalItems?: number[]
          }
        }
      }
    }
    const deep: DeepNested = {}

    const itemsEdit = edit.batch(deep).level1.level2.level3.items((draft) => {
      expectTypeOf(draft).toEqualTypeOf<string[]>()
      draft.push('new-item')
    })
    expectTypeOf(itemsEdit).toEqualTypeOf<DeepNested | undefined>()

    const optionalEdit = edit
      .batch(deep)
      .level1.level2.level3.optionalItems((draft) => {
        expectTypeOf(draft).toEqualTypeOf<number[]>()
        draft.push(42)
      })
    expectTypeOf(optionalEdit).toEqualTypeOf<DeepNested | undefined>()

    const itemUpdate = edit.batch(deep).level1.level2.level3.items((draft) => {
      expectTypeOf(draft).toEqualTypeOf<string[]>()
      draft[0] = 'new-item'
    })
    expectTypeOf(itemUpdate).toEqualTypeOf<DeepNested | undefined>()
  })
})

describe('Map properties', () => {
  type Config = {
    settings: Map<string, string>
    users: Map<string, { name: string; age: number }>
    optionalMappings?: Map<number, boolean>
  }
  const config: Config = {
    settings: new Map([['theme', 'dark']]),
    users: new Map([['user1', { name: 'John', age: 30 }]]),
  }

  it('should edit Map property with mutator function', () => {
    const result = edit.batch(config).settings((draft) => {
      expectTypeOf(draft).toEqualTypeOf<Map<string, string>>
      draft.set('theme', 'light')
      draft.set('debug', 'true')
    })
    expectTypeOf(result).toEqualTypeOf<Config>()

    const result2 = edit.batch(config).users((draft) => {
      expectTypeOf(draft).toEqualTypeOf<
        Map<string, { readonly name: string; readonly age: number }>
      >
      draft.set('user1', { name: 'Jane', age: 31 })
    })
    expectTypeOf(result2).toEqualTypeOf<Config>()
  })

  it('should edit Map value by key', () => {
    const result = edit.batch(config).users[key]('user1')((draft) => {
      expectTypeOf(draft).toEqualTypeOf<{ name: string; age: number }>()
      draft.name = 'Jane'
      draft.age = 31
    })
    expectTypeOf(result).toEqualTypeOf<Config | undefined>()
  })

  it('should edit optional Map property', () => {
    const result = edit.batch(config).optionalMappings((draft) => {
      expectTypeOf(draft).toEqualTypeOf<Map<number, boolean>>()
      draft.set(1, true)
    })
    expectTypeOf(result).toEqualTypeOf<Config | undefined>()
  })
})

describe('Maps within optional nested objects', () => {
  type ServiceConfig = {
    database?: {
      connections: Map<string, string>
      optionalCache?: {
        settings: Map<string, number>
        fallbacks?: Map<string, boolean>
      }
      users?: Map<string, { name: string; age: number }>
    }
  }
  const serviceConfig: ServiceConfig = {}

  it('should return undefined when edit.batchg Maps in optional objects', () => {
    const connectionsEdit = edit
      .batch(serviceConfig)
      .database.connections((draft) => {
        expectTypeOf(draft).toEqualTypeOf<Map<string, string>>
        draft.set('primary', 'localhost:5432')
      })
    expectTypeOf(connectionsEdit).toEqualTypeOf<ServiceConfig | undefined>()

    const fallbacksEdit = edit
      .batch(serviceConfig)
      .database.optionalCache.fallbacks((draft) => {
        expectTypeOf(draft).toEqualTypeOf<Map<string, boolean>>
        draft.set('redis', true)
      })
    expectTypeOf(fallbacksEdit).toEqualTypeOf<ServiceConfig | undefined>()
  })

  it('should return undefined when edit.batchg Map values by key in optional objects', () => {
    const connectionResult = edit
      .batch(serviceConfig)
      .database.users[key]('user1')((draft) => {
      expectTypeOf(draft).toEqualTypeOf<{ name: string; age: number }>()
      draft.name = 'Jane'
      draft.age = 31
    })
    expectTypeOf(connectionResult).toEqualTypeOf<ServiceConfig | undefined>()
  })

  it('should handle deeply nested optional Maps', () => {
    type DeepMapNested = {
      level1?: {
        level2?: {
          level3?: {
            data: Map<string, number>
            optionalData?: Map<number, string>
          }
        }
      }
    }
    const deepMap: DeepMapNested = {}

    const dataEdit = edit.batch(deepMap).level1.level2.level3.data((draft) => {
      expectTypeOf(draft).toEqualTypeOf<Map<string, number>>
      draft.set('key1', 100)
    })
    expectTypeOf(dataEdit).toEqualTypeOf<DeepMapNested | undefined>()

    const optionalEdit = edit
      .batch(deepMap)
      .level1.level2.level3.optionalData((draft) => {
        expectTypeOf(draft).toEqualTypeOf<Map<number, string>>
        draft.set(1, 'value1')
      })
    expectTypeOf(optionalEdit).toEqualTypeOf<DeepMapNested | undefined>()

    const dataKeyEdit = edit
      .batch(deepMap)
      .level1.level2.level3.data((draft) => {
        expectTypeOf(draft).toEqualTypeOf<Map<string, number>>
        draft.set('key1', 100)
      })
    expectTypeOf(dataKeyEdit).toEqualTypeOf<DeepMapNested | undefined>()

    const optionalKeyEdit = edit
      .batch(deepMap)
      .level1.level2.level3.optionalData((draft) => {
        expectTypeOf(draft).toEqualTypeOf<Map<number, string>>
        draft.set(1, 'value1')
      })
    expectTypeOf(optionalKeyEdit).toEqualTypeOf<DeepMapNested | undefined>()
  })
})

describe('Set properties', () => {
  type UserGroups = {
    groups: Set<string>
    optionalTags?: Set<number>
  }
  const userGroups: UserGroups = {
    groups: new Set(['admin', 'user']),
  }

  it('should edit Set property with mutator function', () => {
    const result = edit.batch(userGroups).groups((draft) => {
      expectTypeOf(draft).toEqualTypeOf<Set<string>>
      draft.add('moderator')
      draft.delete('user')
    })
    expectTypeOf(result).toEqualTypeOf<UserGroups>()
  })

  it('should edit optional Set property', () => {
    const result = edit.batch(userGroups).optionalTags((draft) => {
      expectTypeOf(draft).toEqualTypeOf<Set<number>>
      draft.add(1)
      draft.add(2)
      draft.add(3)
    })
    expectTypeOf(result).toEqualTypeOf<UserGroups | undefined>()
  })
})

describe('Sets within optional nested objects', () => {
  type PermissionSystem = {
    users?: {
      activeUsers: Set<string>
      optionalGroups?: {
        moderators?: Set<{ name: string; age: number }>
      }
    }
  }
  const permissions: PermissionSystem = {}

  it('should return undefined when edit.batchg Sets in optional objects', () => {
    const activeUsersEdit = edit
      .batch(permissions)
      .users.activeUsers((draft) => {
        expectTypeOf(draft).toEqualTypeOf<Set<string>>
        draft.add('user123')
      })
    expectTypeOf(activeUsersEdit).toEqualTypeOf<PermissionSystem | undefined>()

    const moderatorsEdit = edit
      .batch(permissions)
      .users.optionalGroups.moderators((draft) => {
        expectTypeOf(draft).toEqualTypeOf<Set<{ name: string; age: number }>>()
        draft.add({ name: 'mod123', age: 20 })
      })
    expectTypeOf(moderatorsEdit).toEqualTypeOf<PermissionSystem | undefined>()
  })

  it('should handle deeply nested optional Sets', () => {
    type DeepSetNested = {
      level1?: {
        level2?: {
          level3?: {
            tags: Set<string>
            optionalLabels?: Set<number>
          }
        }
      }
    }
    const deepSet: DeepSetNested = {}

    const tagsEdit = edit.batch(deepSet).level1.level2.level3.tags((draft) => {
      expectTypeOf(draft).toEqualTypeOf<Set<string>>()
      draft.add('important')
    })
    expectTypeOf(tagsEdit).toEqualTypeOf<DeepSetNested | undefined>()

    const labelsEdit = edit
      .batch(deepSet)
      .level1.level2.level3.optionalLabels((draft) => {
        expectTypeOf(draft).toEqualTypeOf<Set<number>>()
        draft.add(999)
      })
    expectTypeOf(labelsEdit).toEqualTypeOf<DeepSetNested | undefined>()
  })

  it('should handle Sets with union types in optional contexts', () => {
    type ComplexSetConfig = {
      categories?: {
        activeCategories: Set<'news' | 'sports' | 'tech'>
        optionalPriorities?: Set<'high' | 'medium' | 'low'>
      }
      metadata?: {
        statusFlags: Set<boolean>
        optionalIds?: Set<string | number>
      }
    }
    const complexSet: ComplexSetConfig = {}

    const categoriesEdit = edit
      .batch(complexSet)
      .categories.activeCategories((draft) => {
        expectTypeOf(draft).toEqualTypeOf<Set<'news' | 'sports' | 'tech'>>()
        draft.add('tech')
      })
    expectTypeOf(categoriesEdit).toEqualTypeOf<ComplexSetConfig | undefined>()

    const prioritiesEdit = edit
      .batch(complexSet)
      .categories.optionalPriorities((draft) => {
        expectTypeOf(draft).toEqualTypeOf<Set<'high' | 'medium' | 'low'>>()
        draft.add('high')
      })
    expectTypeOf(prioritiesEdit).toEqualTypeOf<ComplexSetConfig | undefined>()

    const flagsEdit = edit.batch(complexSet).metadata.statusFlags((draft) => {
      expectTypeOf(draft).toEqualTypeOf<Set<boolean>>()
      draft.add(true)
    })
    expectTypeOf(flagsEdit).toEqualTypeOf<ComplexSetConfig | undefined>()

    const idsEdit = edit.batch(complexSet).metadata.optionalIds((draft) => {
      expectTypeOf(draft).toEqualTypeOf<Set<string | number>>()
      draft.add('id123')
      draft.add(456)
    })
    expectTypeOf(idsEdit).toEqualTypeOf<ComplexSetConfig | undefined>()
  })

  it('should handle Sets containing complex object types in optional contexts', () => {
    type ObjectSetConfig = {
      cache?: {
        userRoles: Set<{ userId: string; role: 'admin' | 'user' }>
        optionalSessions?: Set<{ sessionId: string; expiry?: Date }>
      }
    }
    const objectSet: ObjectSetConfig = {}

    const rolesEdit = edit.batch(objectSet).cache.userRoles((draft) => {
      expectTypeOf(draft).toEqualTypeOf<
        Set<{ userId: string; role: 'admin' | 'user' }>
      >()
      draft.add({ userId: 'user123', role: 'admin' })
    })
    expectTypeOf(rolesEdit).toEqualTypeOf<ObjectSetConfig | undefined>()

    const sessionsEdit = edit
      .batch(objectSet)
      .cache.optionalSessions((draft) => {
        expectTypeOf(draft).toEqualTypeOf<
          Set<{ sessionId: string; expiry?: Date }>
        >()
        draft.add({ sessionId: 'session456', expiry: new Date() })
      })
    expectTypeOf(sessionsEdit).toEqualTypeOf<ObjectSetConfig | undefined>()
  })
})

describe('async mutators', () => {
  type TestObj = {
    name: string
    nested: {
      map: Map<string, string>
    }
    optionalNested?: {
      array: string[]
    }
  }
  const obj: TestObj = {
    name: 'test',
    nested: { map: new Map() },
  }

  it('should handle async mutators correctly', async () => {
    const asyncResult = edit.batch(obj).nested.map(async (draft) => {
      expectTypeOf(draft).toEqualTypeOf<Map<string, string>>()
      await Promise.resolve()
      draft.set('key', 'value')
    })
    expectTypeOf(asyncResult).toEqualTypeOf<Promise<TestObj>>()
  })

  it('should handle async mutators correctly with optional nested objects', async () => {
    const asyncResult = edit.batch(obj).optionalNested.array(async (draft) => {
      expectTypeOf(draft).toEqualTypeOf<string[]>()
      await Promise.resolve()
      draft.push('value')
    })
    expectTypeOf(asyncResult).toEqualTypeOf<Promise<TestObj> | undefined>()
  })
})

describe('root collection objects', () => {
  // Tests for Maps/Arrays/Sets as root objects
  const rootArray = ['a', 'b', 'c']
  const rootMap = new Map([
    ['key1', 'value1'],
    ['key2', 'value2'],
  ])
  const rootSet = new Set(['item1', 'item2'])

  it('should work with Array as root object', () => {
    const result1 = edit.batch(rootArray)((draft) => {
      expectTypeOf(draft).toEqualTypeOf<Array<Readonly<string>>>()
      draft.push('new')
      draft[0] = 'modified'
    })
    expectTypeOf(result1).toMatchTypeOf<string[]>()

    // Should support element access for object elements and return root type
    const result2 = edit.batch([{ a: 2 }])[0]((draft) => {
      expectTypeOf(draft).toEqualTypeOf<{ a: number }>()
      draft.a = 3
    })
    expectTypeOf(result2).toMatchTypeOf<{ a: number }[]>()

    // Cannot call edit.batch on primitive elements - should be never
    expectTypeOf(edit.batch(rootArray)[0]).toEqualTypeOf<never>()
  })

  it('should work with Map as root object', () => {
    const result1 = edit.batch(rootMap)((draft) => {
      expectTypeOf(draft).toEqualTypeOf<Map<string, string>>()
      draft.set('newKey', 'newValue')
      draft.delete('key1')
    })
    expectTypeOf(result1).toMatchTypeOf<Map<string, string>>()

    // Cannot call edit.batch on primitive Map values - should be never
    expectTypeOf(edit.batch(rootMap)[key]('key1')).toEqualTypeOf<never>()

    // But can call on object Map values
    const objectMap = new Map([['key1', { name: 'test' }]])
    const result2 = edit.batch(objectMap)[key]('key1')((draft) => {
      expectTypeOf(draft).toEqualTypeOf<{ name: string }>()
      draft.name = 'updated'
    })
    expectTypeOf(result2).toMatchTypeOf<
      Map<string, { name: string }> | undefined
    >()
  })

  it('should work with Set as root object', () => {
    const result = edit.batch(rootSet)((draft) => {
      expectTypeOf(draft).toEqualTypeOf<Set<string>>()
      draft.add('newItem')
      draft.delete('item1')
    })
    expectTypeOf(result).toMatchTypeOf<Set<string>>()
  })
})

describe('nullable root collection objects', () => {
  // Nullable Maps/Arrays/Sets as root objects
  const nullableArray: string[] | null = ['a', 'b']
  const nullableMap: Map<string, string> | null = new Map([['key', 'value']])
  const nullableSet: Set<string> | null = new Set(['item'])

  it('should work with nullable Array as root', () => {
    const result1 = edit.batch(nullableArray)((draft) => {
      expectTypeOf(draft).toEqualTypeOf<string[]>()
      if (draft) {
        draft.push('new')
      }
    })
    expectTypeOf(result1).toMatchTypeOf<string[] | undefined>()

    // Cannot call edit.batch on primitive elements - should be never
    expectTypeOf(edit.batch(nullableArray)[0]).toEqualTypeOf<never>()

    // But can call on object elements
    const nullableObjectArray: { name: string }[] | null = [{ name: 'test' }]
    const result2 = edit.batch(nullableObjectArray)[0]((draft) => {
      expectTypeOf(draft).toEqualTypeOf<{ name: string }>()
      draft.name = 'updated'
    })
    expectTypeOf(result2).toMatchTypeOf<{ name: string }[] | undefined>()
  })

  it('should work with nullable Map as root', () => {
    const result1 = edit.batch(nullableMap)((draft) => {
      expectTypeOf(draft).toEqualTypeOf<Map<string, string>>()
      if (draft) {
        draft.set('newKey', 'newValue')
      }
    })
    expectTypeOf(result1).toMatchTypeOf<Map<string, string> | undefined>()

    // Cannot call edit.batch on primitive Map values - should be never
    expectTypeOf(edit.batch(nullableMap)[key]('key')).toEqualTypeOf<never>()

    // But can call on object Map values
    const nullableObjectMap: Map<string, { name: string }> | null = new Map([
      ['key', { name: 'test' }],
    ])
    const result2 = edit.batch(nullableObjectMap)[key]('key')((draft) => {
      expectTypeOf(draft).toEqualTypeOf<{ name: string }>()
      draft.name = 'updated'
    })
    expectTypeOf(result2).toMatchTypeOf<
      Map<string, { name: string }> | undefined
    >()
  })

  it('should work with nullable Set as root', () => {
    const result = edit.batch(nullableSet)((draft) => {
      expectTypeOf(draft).toEqualTypeOf<Set<string>>()
      if (draft) {
        draft.add('newItem')
      }
    })
    expectTypeOf(result).toMatchTypeOf<Set<string> | undefined>()
  })
})

describe('undefinable root collection objects', () => {
  // Undefinable Maps/Arrays/Sets as root objects
  const undefinableArray: string[] | undefined = ['a', 'b']
  const undefinableMap: Map<string, string> | undefined = new Map([
    ['key', 'value'],
  ])
  const undefinableSet: Set<string> | undefined = new Set(['item'])

  it('should work with undefinable Array as root', () => {
    const result1 = edit.batch(undefinableArray)((draft) => {
      expectTypeOf(draft).toEqualTypeOf<string[]>()
      draft.push('new')
    })
    expectTypeOf(result1).toMatchTypeOf<string[] | undefined>()

    // Cannot call edit.batch on primitive elements - should be never
    expectTypeOf(edit.batch(undefinableArray)[0]).toEqualTypeOf<never>()

    // But can call on object elements
    const undefinableObjectArray: { name: string }[] | undefined = [
      { name: 'test' },
    ]
    const result2 = edit.batch(undefinableObjectArray)[0]((draft) => {
      expectTypeOf(draft).toEqualTypeOf<{ name: string }>()
      draft.name = 'updated'
    })
    expectTypeOf(result2).toMatchTypeOf<{ name: string }[] | undefined>()
  })

  it('should work with undefinable Map as root', () => {
    const result1 = edit.batch(undefinableMap)((draft) => {
      expectTypeOf(draft).toEqualTypeOf<Map<string, string>>()
      draft.set('newKey', 'newValue')
    })
    expectTypeOf(result1).toMatchTypeOf<Map<string, string> | undefined>()

    // Cannot call edit.batch on primitive Map values - should be never
    expectTypeOf(edit.batch(undefinableMap)[key]('key')).toEqualTypeOf<never>()

    // But can call on object Map values
    const undefinableObjectMap: Map<string, { name: string }> | undefined =
      new Map([['key', { name: 'test' }]])
    const result2 = edit.batch(undefinableObjectMap)[key]('key')((draft) => {
      expectTypeOf(draft).toEqualTypeOf<{ name: string }>()
      draft.name = 'updated'
    })
    expectTypeOf(result2).toMatchTypeOf<
      Map<string, { name: string }> | undefined
    >()
  })

  it('should work with undefinable Set as root', () => {
    const result = edit.batch(undefinableSet)((draft) => {
      expectTypeOf(draft).toEqualTypeOf<Set<string>>()
      draft.add('newItem')
    })
    expectTypeOf(result).toMatchTypeOf<Set<string> | undefined>()
  })
})

describe('type error counterexamples', () => {
  type TestObj = {
    name: string
    age: number
    optional?: string
    nested: {
      value: number
      optionalNested?: {
        data: string[]
        tags?: Set<string>
      }
    }
    items: Array<{ id: number; label: string }>
    config: Map<string, boolean>
    groups: Set<string>
  }
  const obj: TestObj = {
    name: 'test',
    age: 30,
    nested: { value: 42 },
    items: [{ id: 1, label: 'item1' }],
    config: new Map([['debug', true]]),
    groups: new Set(['admin']),
  }

  describe('property access errors', () => {
    it('should error when accessing non-existent properties', () => {
      expectTypeOf(edit.batch(obj)).not.toHaveProperty('nonExistent')
      expectTypeOf(edit.batch(obj)).toHaveProperty('nested')

      expectTypeOf(edit.batch(obj).nested).not.toHaveProperty('wrongProperty')
      expectTypeOf(edit.batch(obj).nested).toHaveProperty('optionalNested')
    })

    it('should error when using wrong method types on collections', () => {
      expectTypeOf(edit.batch(obj).config).not.toHaveProperty('push')
      expectTypeOf(edit.batch(obj).config).toBeCallableWith(
        (draft: Map<string, boolean>) => {},
      )

      expectTypeOf(edit.batch(obj).items).not.toHaveProperty('key')
      expectTypeOf(edit.batch(obj).items).toHaveProperty(0)

      expectTypeOf(edit.batch(obj).groups).not.toHaveProperty('set')
      expectTypeOf(edit.batch(obj).groups).not.toHaveProperty('key')
    })
  })

  describe('primitive property errors', () => {
    it('should not allow edit.batch on primitive properties', () => {
      expectTypeOf(edit.batch(obj).name).toEqualTypeOf<never>()
      expectTypeOf(edit.batch(obj).age).toEqualTypeOf<never>()
      expectTypeOf(edit.batch(obj).optional).toEqualTypeOf<never>()
      expectTypeOf(edit.batch(obj).nested.value).toEqualTypeOf<never>()
    })
  })

  describe('mutator function type errors', () => {
    it('should error if the function returns a value', () => {
      expectTypeOf(edit.batch(obj).nested).toBeCallableWith(
        (draft: { value: number }) => {},
      )
      expectTypeOf(edit.batch(obj).nested)
        .parameter(0)
        .not.toMatchTypeOf<(arg: { value: number }) => { value: number }>()

      expectTypeOf(edit.batch(obj).nested)
        .parameter(0)
        .toMatchTypeOf<(arg: { value: number }) => void>()
    })
    it('should error when using wrong mutator function signatures', () => {
      expectTypeOf(edit.batch(obj).nested).toBeCallableWith(
        (draft: {
          value: number
          optionalNested?:
            | {
                readonly data: readonly string[]
                readonly tags?: ReadonlySet<string>
              }
            | undefined
        }) => {},
      )
      expectTypeOf(edit.batch(obj).nested)
        .parameter(0)
        .not.toMatchTypeOf<(draft: { wrongProperty: string }) => void>()

      expectTypeOf(edit.batch(obj).nested.optionalNested.data).toBeCallableWith(
        (draft: string[]) => {
          draft.push('valid', 'array')
        },
      )
      expectTypeOf(edit.batch(obj).nested.optionalNested.data)
        .parameter(0)
        .not.toMatchTypeOf<(draft: number[]) => void>()
    })

    it('should error when passing wrong types to array mutators', () => {
      expectTypeOf(edit.batch(obj).items).toBeCallableWith(
        (draft: Array<{ id: number; label: string }>) => {
          draft.push({ id: 1, label: 'test' })
        },
      )
      expectTypeOf(edit.batch(obj).items)
        .parameter(0)
        .not.toMatchTypeOf<(draft: string[]) => void>()

      expectTypeOf(edit.batch(obj).items[0]).toBeCallableWith(
        (draft: { id: number; label: string }) => {
          draft.id = 1
          draft.label = 'test'
        },
      )
      expectTypeOf(edit.batch(obj).items[0])
        .parameter(0)
        .not.toMatchTypeOf<(draft: string) => void>()
    })

    it('should error when passing wrong types to Map mutators', () => {
      expectTypeOf(edit.batch(obj).config).toBeCallableWith(
        (draft: Map<string, boolean>) => {
          draft.set('key', true)
        },
      )
      expectTypeOf(edit.batch(obj).config)
        .parameter(0)
        .not.toMatchTypeOf<(draft: Map<string, string>) => void>()
    })

    it('should error when passing wrong types to Set mutators', () => {
      expectTypeOf(edit.batch(obj).groups).toBeCallableWith(
        (draft: Set<string>) => {
          draft.add('admin')
        },
      )
      expectTypeOf(edit.batch(obj).groups)
        .parameter(0)
        .not.toMatchTypeOf<(draft: Set<number>) => void>()
    })
  })

  describe('Map key type errors', () => {
    it('should error when using wrong Map key types in mutators', () => {
      expectTypeOf(edit.batch(obj).config).toBeCallableWith(
        (draft: Map<string, boolean>) => {
          draft.set('validKey', true)
        },
      )
      expectTypeOf(edit.batch(obj).config)
        .parameter(0)
        .not.toMatchTypeOf<(draft: Map<number, boolean>) => void>()
    })
  })

  describe('array method access errors', () => {
    it('should not allow direct array method access on properties', () => {
      // edit.batch should NOT provide array methods directly on the property
      expectTypeOf(edit.batch(obj).items).not.toHaveProperty('push')
      expectTypeOf(edit.batch(obj).items).not.toHaveProperty('pop')
      expectTypeOf(edit.batch(obj).items).not.toHaveProperty('shift')
      expectTypeOf(edit.batch(obj).items).not.toHaveProperty('unshift')
      expectTypeOf(edit.batch(obj).items).not.toHaveProperty('splice')
      expectTypeOf(edit.batch(obj).items).not.toHaveProperty('sort')
      expectTypeOf(edit.batch(obj).items).not.toHaveProperty('reverse')
      expectTypeOf(edit.batch(obj).items).not.toHaveProperty('forEach')
      expectTypeOf(edit.batch(obj).items).not.toHaveProperty('map')
      expectTypeOf(edit.batch(obj).items).not.toHaveProperty('filter')
      expectTypeOf(edit.batch(obj).items).not.toHaveProperty('find')

      // Array methods should only be available within the callback
      expectTypeOf(edit.batch(obj).items).toBeCallableWith(
        (draft: Array<{ id: number; label: string }>) => {
          draft.push({ id: 2, label: 'test' }) // This is allowed inside the callback
        },
      )
    })

    it('should not allow direct array method access on nested arrays', () => {
      expectTypeOf(
        edit.batch(obj).nested.optionalNested.data,
      ).not.toHaveProperty('push')
      expectTypeOf(
        edit.batch(obj).nested.optionalNested.data,
      ).not.toHaveProperty('pop')
      expectTypeOf(
        edit.batch(obj).nested.optionalNested.data,
      ).not.toHaveProperty('splice')

      // But should allow callback-based edit.batchg
      expectTypeOf(edit.batch(obj).nested.optionalNested.data).toBeCallableWith(
        (draft: readonly string[]) => {
          // Note: arrays in drafts are readonly, so reassignment is the way to mutate
        },
      )
    })
  })

  describe('map method access errors', () => {
    it('should not allow direct Map method access on properties', () => {
      // edit.batch should NOT provide Map methods directly on the property
      expectTypeOf(edit.batch(obj).config).not.toHaveProperty('set')
      expectTypeOf(edit.batch(obj).config).not.toHaveProperty('get')
      expectTypeOf(edit.batch(obj).config).not.toHaveProperty('delete')
      expectTypeOf(edit.batch(obj).config).not.toHaveProperty('clear')
      expectTypeOf(edit.batch(obj).config).not.toHaveProperty('has')
      expectTypeOf(edit.batch(obj).config).not.toHaveProperty('forEach')
      expectTypeOf(edit.batch(obj).config).not.toHaveProperty('entries')
      expectTypeOf(edit.batch(obj).config).not.toHaveProperty('keys')
      expectTypeOf(edit.batch(obj).config).not.toHaveProperty('values')

      // Map methods should only be available within the callback
      expectTypeOf(edit.batch(obj).config).toBeCallableWith(
        (draft: Map<string, boolean>) => {
          draft.set('key', true) // This is allowed inside the callback
          draft.delete('key')
          draft.clear()
        },
      )
    })
  })

  describe('set method access errors', () => {
    it('should not allow direct Set method access on properties', () => {
      // edit.batch should NOT provide Set methods directly on the property
      expectTypeOf(edit.batch(obj).groups).not.toHaveProperty('add')
      expectTypeOf(edit.batch(obj).groups).not.toHaveProperty('delete')
      expectTypeOf(edit.batch(obj).groups).not.toHaveProperty('clear')
      expectTypeOf(edit.batch(obj).groups).not.toHaveProperty('has')
      expectTypeOf(edit.batch(obj).groups).not.toHaveProperty('forEach')
      expectTypeOf(edit.batch(obj).groups).not.toHaveProperty('entries')
      expectTypeOf(edit.batch(obj).groups).not.toHaveProperty('keys')
      expectTypeOf(edit.batch(obj).groups).not.toHaveProperty('values')

      // Set methods should only be available within the callback
      expectTypeOf(edit.batch(obj).groups).toBeCallableWith(
        (draft: Set<string>) => {
          draft.add('newItem') // This is allowed inside the callback
          draft.delete('oldItem')
          draft.clear()
        },
      )
    })
  })
})
