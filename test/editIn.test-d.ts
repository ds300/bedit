import { expectTypeOf, describe, it } from 'vitest'
import { Editable, fork, key } from '../src/patchfork.mjs'

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
    const result = fork.do(obj).nested((draft) => {
      expectTypeOf(draft).toEqualTypeOf<
        Editable<{ name: string; count: number }>
      >()
      draft.name = 'test'
      draft.count = 42
    })
    expectTypeOf(result).toEqualTypeOf<Obj | undefined>()
  })

  it('should handle nullable optional object properties', () => {
    const result = fork.do(obj).nullableNested((draft) => {
      expectTypeOf(draft).toEqualTypeOf<Editable<{ value: string }>>()
      if (draft) {
        draft.value = 'test'
      }
    })
    expectTypeOf(result).toEqualTypeOf<Obj | undefined>()
  })

  it('should handle maybe undefined object properties', () => {
    const result = fork.do(obj).maybeUndefinedNested((draft) => {
      expectTypeOf(draft).toEqualTypeOf<Editable<{ data: number[] }>>()
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
    const result = fork.do(obj).profile((draft) => {
      expectTypeOf(draft).toEqualTypeOf<
        Editable<{ name: string; age: number }>
      >()
      draft.name = 'Jane'
      draft.age = 31
    })
    expectTypeOf(result).toEqualTypeOf<Obj>()
  })

  it('should accept mutator for nested required object', () => {
    const result = fork.do(obj).settings((draft) => {
      expectTypeOf(draft).toEqualTypeOf<
        Editable<{
          theme: string
          notifications: boolean
        }>
      >()
      draft.theme = 'light'
      draft.notifications = false
    })
    expectTypeOf(result).toEqualTypeOf<Obj>()
  })

  it('should accept mutator for object with mixed property types', () => {
    const result = fork.do(obj).metadata((draft) => {
      expectTypeOf(draft).toEqualTypeOf<
        Editable<{
          created: Date
          tags: readonly string[]
        }>
      >()
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
    const result = fork.do(user).profile.settings((draft) => {
      expectTypeOf(draft).toEqualTypeOf<
        Editable<{
          theme: 'light' | 'dark'
          notifications?: boolean
        }>
      >()
      draft.theme = 'dark'
      draft.notifications = true
    })
    expectTypeOf(result).toEqualTypeOf<User | undefined>()
  })

  it('should edit optional nested object', () => {
    const result = fork.do(user).metadata((draft) => {
      expectTypeOf(draft).toEqualTypeOf<Editable<{ lastLogin: Date }>>()
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
    const result = fork.do(todoList).todos((draft) => {
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
    const result = fork.do(todoList).todos[0]((draft) => {
      expectTypeOf(draft).toEqualTypeOf<
        Editable<{
          id: number
          text: string
          completed: boolean
        }>
      >()
      draft.completed = true
    })
    expectTypeOf(result).toEqualTypeOf<TodoList>()
  })

  it('should edit optional array property', () => {
    const result = fork.do(todoList).tags((draft) => {
      expectTypeOf(draft).toEqualTypeOf<Editable<string[]>>()
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
    const prefsResult = fork.do(profile).user.preferences((draft) => {
      expectTypeOf(draft).toEqualTypeOf<Editable<string[]>>()
      draft.push('dark-mode')
    })
    expectTypeOf(prefsResult).toEqualTypeOf<UserProfile | undefined>()

    const bookmarksResult = fork
      .do(profile)
      .user.optionalLists.bookmarks((draft) => {
        expectTypeOf(draft).toEqualTypeOf<Editable<string[]>>()
        draft.push('https://example.com')
      })
    expectTypeOf(bookmarksResult).toEqualTypeOf<UserProfile | undefined>()
  })

  it('should return maybe undefined when edit.batchg array elements in optional objects', () => {
    const prefResult = fork.do(profile).user.preferences((draft) => {
      expectTypeOf(draft).toEqualTypeOf<Editable<string[]>>()
      draft[0] = 'dark-mode'
    })
    expectTypeOf(prefResult).toEqualTypeOf<UserProfile | undefined>()

    const bookmarkResult = fork
      .do(profile)
      .user.optionalLists.bookmarks((draft) => {
        expectTypeOf(draft).toEqualTypeOf<Editable<string[]>>()
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

    const itemsEdit = fork.do(deep).level1.level2.level3.items((draft) => {
      expectTypeOf(draft).toEqualTypeOf<Editable<string[]>>()
      draft.push('new-item')
    })
    expectTypeOf(itemsEdit).toEqualTypeOf<DeepNested | undefined>()

    const optionalEdit = fork
      .do(deep)
      .level1.level2.level3.optionalItems((draft) => {
        expectTypeOf(draft).toEqualTypeOf<Editable<number[]>>()
        draft.push(42)
      })
    expectTypeOf(optionalEdit).toEqualTypeOf<DeepNested | undefined>()

    const itemUpdate = fork.do(deep).level1.level2.level3.items((draft) => {
      expectTypeOf(draft).toEqualTypeOf<Editable<string[]>>()
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
    const result = fork.do(config).settings((draft) => {
      expectTypeOf(draft).toEqualTypeOf<Editable<Map<string, string>>>()
      draft.set('theme', 'light')
      draft.set('debug', 'true')
    })
    expectTypeOf(result).toEqualTypeOf<Config>()

    const result2 = fork.do(config).users((draft) => {
      expectTypeOf(draft).toEqualTypeOf<
        Editable<Map<string, { readonly name: string; readonly age: number }>>
      >()
      draft.set('user1', { name: 'Jane', age: 31 })
    })
    expectTypeOf(result2).toEqualTypeOf<Config>()
  })

  it('should edit Map value by key', () => {
    const result = fork.do(config).users[key]('user1')((draft) => {
      expectTypeOf(draft).toEqualTypeOf<
        Editable<{ name: string; age: number }>
      >()
      draft.name = 'Jane'
      draft.age = 31
    })
    expectTypeOf(result).toEqualTypeOf<Config | undefined>()
  })

  it('should edit optional Map property', () => {
    const result = fork.do(config).optionalMappings((draft) => {
      expectTypeOf(draft).toEqualTypeOf<Editable<Map<number, boolean>>>()
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
    const connectionsEdit = fork
      .do(serviceConfig)
      .database.connections((draft) => {
        expectTypeOf(draft).toEqualTypeOf<Editable<Map<string, string>>>()
        draft.set('primary', 'localhost:5432')
      })
    expectTypeOf(connectionsEdit).toEqualTypeOf<ServiceConfig | undefined>()

    const fallbacksEdit = fork
      .do(serviceConfig)
      .database.optionalCache.fallbacks((draft) => {
        expectTypeOf(draft).toEqualTypeOf<Editable<Map<string, boolean>>>()
        draft.set('redis', true)
      })
    expectTypeOf(fallbacksEdit).toEqualTypeOf<ServiceConfig | undefined>()
  })

  it('should return undefined when edit.batchg Map values by key in optional objects', () => {
    const connectionResult = fork
      .do(serviceConfig)
      .database.users[key]('user1')((draft) => {
      expectTypeOf(draft).toEqualTypeOf<
        Editable<{ name: string; age: number }>
      >()
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

    const dataEdit = fork.do(deepMap).level1.level2.level3.data((draft) => {
      expectTypeOf(draft).toEqualTypeOf<Editable<Map<string, number>>>()
      draft.set('key1', 100)
    })
    expectTypeOf(dataEdit).toEqualTypeOf<DeepMapNested | undefined>()

    const optionalEdit = fork
      .do(deepMap)
      .level1.level2.level3.optionalData((draft) => {
        expectTypeOf(draft).toEqualTypeOf<Editable<Map<number, string>>>()
        draft.set(1, 'value1')
      })
    expectTypeOf(optionalEdit).toEqualTypeOf<DeepMapNested | undefined>()

    const dataKeyEdit = fork.do(deepMap).level1.level2.level3.data((draft) => {
      expectTypeOf(draft).toEqualTypeOf<Editable<Map<string, number>>>()
      draft.set('key1', 100)
    })
    expectTypeOf(dataKeyEdit).toEqualTypeOf<DeepMapNested | undefined>()

    const optionalKeyEdit = fork
      .do(deepMap)
      .level1.level2.level3.optionalData((draft) => {
        expectTypeOf(draft).toEqualTypeOf<Editable<Map<number, string>>>()
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
    const result = fork.do(userGroups).groups((draft) => {
      expectTypeOf(draft).toEqualTypeOf<Editable<Set<string>>>()
      draft.add('moderator')
      draft.delete('user')
    })
    expectTypeOf(result).toEqualTypeOf<UserGroups>()
  })

  it('should edit optional Set property', () => {
    const result = fork.do(userGroups).optionalTags((draft) => {
      expectTypeOf(draft).toEqualTypeOf<Editable<Set<number>>>()
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
    const activeUsersEdit = fork.do(permissions).users.activeUsers((draft) => {
      expectTypeOf(draft).toEqualTypeOf<Editable<Set<string>>>()
      draft.add('user123')
    })
    expectTypeOf(activeUsersEdit).toEqualTypeOf<PermissionSystem | undefined>()

    const moderatorsEdit = fork
      .do(permissions)
      .users.optionalGroups.moderators((draft) => {
        expectTypeOf(draft).toEqualTypeOf<
          Editable<Set<{ name: string; age: number }>>
        >()
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

    const tagsEdit = fork.do(deepSet).level1.level2.level3.tags((draft) => {
      expectTypeOf(draft).toEqualTypeOf<Editable<Set<string>>>()
      draft.add('important')
    })
    expectTypeOf(tagsEdit).toEqualTypeOf<DeepSetNested | undefined>()

    const labelsEdit = fork
      .do(deepSet)
      .level1.level2.level3.optionalLabels((draft) => {
        expectTypeOf(draft).toEqualTypeOf<Editable<Set<number>>>()
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

    const categoriesEdit = fork
      .do(complexSet)
      .categories.activeCategories((draft) => {
        expectTypeOf(draft).toEqualTypeOf<
          Editable<Set<'news' | 'sports' | 'tech'>>
        >()
        draft.add('tech')
      })
    expectTypeOf(categoriesEdit).toEqualTypeOf<ComplexSetConfig | undefined>()

    const prioritiesEdit = fork
      .do(complexSet)
      .categories.optionalPriorities((draft) => {
        expectTypeOf(draft).toEqualTypeOf<
          Editable<Set<'high' | 'medium' | 'low'>>
        >()
        draft.add('high')
      })
    expectTypeOf(prioritiesEdit).toEqualTypeOf<ComplexSetConfig | undefined>()

    const flagsEdit = fork.do(complexSet).metadata.statusFlags((draft) => {
      expectTypeOf(draft).toEqualTypeOf<Editable<Set<boolean>>>()
      draft.add(true)
    })
    expectTypeOf(flagsEdit).toEqualTypeOf<ComplexSetConfig | undefined>()

    const idsEdit = fork.do(complexSet).metadata.optionalIds((draft) => {
      expectTypeOf(draft).toEqualTypeOf<Editable<Set<string | number>>>()
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

    const rolesEdit = fork.do(objectSet).cache.userRoles((draft) => {
      expectTypeOf(draft).toEqualTypeOf<
        Editable<Set<{ userId: string; role: 'admin' | 'user' }>>
      >()
      draft.add({ userId: 'user123', role: 'admin' })
    })
    expectTypeOf(rolesEdit).toEqualTypeOf<ObjectSetConfig | undefined>()

    const sessionsEdit = fork.do(objectSet).cache.optionalSessions((draft) => {
      expectTypeOf(draft).toEqualTypeOf<
        Editable<Set<{ sessionId: string; expiry?: Date }>>
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
    const asyncResult = fork.do(obj).nested.map(async (draft) => {
      expectTypeOf(draft).toEqualTypeOf<Editable<Map<string, string>>>()
      await Promise.resolve()
      draft.set('key', 'value')
    })
    expectTypeOf(asyncResult).toEqualTypeOf<Promise<TestObj>>()
  })

  it('should handle async mutators correctly with optional nested objects', async () => {
    const asyncResult = fork.do(obj).optionalNested.array(async (draft) => {
      expectTypeOf(draft).toEqualTypeOf<Editable<string[]>>()
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
    const result1 = fork.do(rootArray)((draft) => {
      expectTypeOf(draft).toEqualTypeOf<Editable<Array<string>>>()
      draft.push('new')
      draft[0] = 'modified'
    })
    expectTypeOf(result1).toMatchTypeOf<string[]>()

    // Should support element access for object elements and return root type
    const result2 = fork.do([{ a: 2 }])[0]((draft) => {
      expectTypeOf(draft).toEqualTypeOf<Editable<{ a: number }>>()
      draft.a = 3
    })
    expectTypeOf(result2).toMatchTypeOf<{ a: number }[]>()

    // Cannot call edit.batch on primitive elements - should be never
    expectTypeOf(fork.do(rootArray)[0]).toEqualTypeOf<never>()
  })

  it('should work with Map as root object', () => {
    const result1 = fork.do(rootMap)((draft) => {
      expectTypeOf(draft).toEqualTypeOf<Editable<Map<string, string>>>()
      draft.set('newKey', 'newValue')
      draft.delete('key1')
    })
    expectTypeOf(result1).toMatchTypeOf<Map<string, string>>()

    // Cannot call edit.batch on primitive Map values - should be never
    expectTypeOf(fork.do(rootMap)[key]('key1')).toEqualTypeOf<never>()

    // But can call on object Map values
    const objectMap = new Map([['key1', { name: 'test' }]])
    const result2 = fork.do(objectMap)[key]('key1')((draft) => {
      expectTypeOf(draft).toEqualTypeOf<Editable<{ name: string }>>()
      draft.name = 'updated'
    })
    expectTypeOf(result2).toMatchTypeOf<
      Map<string, { name: string }> | undefined
    >()
  })

  it('should work with Set as root object', () => {
    const result = fork.do(rootSet)((draft) => {
      expectTypeOf(draft).toEqualTypeOf<Editable<Set<string>>>()
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
    const result1 = fork.do(nullableArray)((draft) => {
      expectTypeOf(draft).toEqualTypeOf<Editable<string[]>>()
      if (draft) {
        draft.push('new')
      }
    })
    expectTypeOf(result1).toMatchTypeOf<string[] | undefined>()

    // Cannot call edit.batch on primitive elements - should be never
    expectTypeOf(fork.do(nullableArray)[0]).toEqualTypeOf<never>()

    // But can call on object elements
    const nullableObjectArray: { name: string }[] | null = [{ name: 'test' }]
    const result2 = fork.do(nullableObjectArray)[0]((draft) => {
      expectTypeOf(draft).toEqualTypeOf<Editable<{ name: string }>>()
      draft.name = 'updated'
    })
    expectTypeOf(result2).toMatchTypeOf<{ name: string }[] | undefined>()
  })

  it('should work with nullable Map as root', () => {
    const result1 = fork.do(nullableMap)((draft) => {
      expectTypeOf(draft).toEqualTypeOf<Editable<Map<string, string>>>()
      if (draft) {
        draft.set('newKey', 'newValue')
      }
    })
    expectTypeOf(result1).toMatchTypeOf<Map<string, string> | undefined>()

    // Cannot call edit.batch on primitive Map values - should be never
    expectTypeOf(fork.do(nullableMap)[key]('key')).toEqualTypeOf<never>()

    // But can call on object Map values
    const nullableObjectMap: Map<string, { name: string }> | null = new Map([
      ['key', { name: 'test' }],
    ])
    const result2 = fork.do(nullableObjectMap)[key]('key')((draft) => {
      expectTypeOf(draft).toEqualTypeOf<Editable<{ name: string }>>()
      draft.name = 'updated'
    })
    expectTypeOf(result2).toMatchTypeOf<
      Map<string, { name: string }> | undefined
    >()
  })

  it('should work with nullable Set as root', () => {
    const result = fork.do(nullableSet)((draft) => {
      expectTypeOf(draft).toEqualTypeOf<Editable<Set<string>>>()
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
    const result1 = fork.do(undefinableArray)((draft) => {
      expectTypeOf(draft).toEqualTypeOf<Editable<string[]>>()
      draft.push('new')
    })
    expectTypeOf(result1).toMatchTypeOf<string[] | undefined>()

    // Cannot call edit.batch on primitive elements - should be never
    expectTypeOf(fork.do(undefinableArray)[0]).toEqualTypeOf<never>()

    // But can call on object elements
    const undefinableObjectArray: { name: string }[] | undefined = [
      { name: 'test' },
    ]
    const result2 = fork.do(undefinableObjectArray)[0]((draft) => {
      expectTypeOf(draft).toEqualTypeOf<Editable<{ name: string }>>()
      draft.name = 'updated'
    })
    expectTypeOf(result2).toMatchTypeOf<{ name: string }[] | undefined>()
  })

  it('should work with undefinable Map as root', () => {
    const result1 = fork.do(undefinableMap)((draft) => {
      expectTypeOf(draft).toEqualTypeOf<Editable<Map<string, string>>>()
      draft.set('newKey', 'newValue')
    })
    expectTypeOf(result1).toMatchTypeOf<Map<string, string> | undefined>()

    // Cannot call edit.batch on primitive Map values - should be never
    expectTypeOf(fork.do(undefinableMap)[key]('key')).toEqualTypeOf<never>()

    // But can call on object Map values
    const undefinableObjectMap: Map<string, { name: string }> | undefined =
      new Map([['key', { name: 'test' }]])
    const result2 = fork.do(undefinableObjectMap)[key]('key')((draft) => {
      expectTypeOf(draft).toEqualTypeOf<Editable<{ name: string }>>()
      draft.name = 'updated'
    })
    expectTypeOf(result2).toMatchTypeOf<
      Map<string, { name: string }> | undefined
    >()
  })

  it('should work with undefinable Set as root', () => {
    const result = fork.do(undefinableSet)((draft) => {
      expectTypeOf(draft).toEqualTypeOf<Editable<Set<string>>>()
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
      expectTypeOf(fork.do(obj)).not.toHaveProperty('nonExistent')
      expectTypeOf(fork.do(obj)).toHaveProperty('nested')

      expectTypeOf(fork.do(obj).nested).not.toHaveProperty('wrongProperty')
      expectTypeOf(fork.do(obj).nested).toHaveProperty('optionalNested')
    })

    it('should error when using wrong method types on collections', () => {
      expectTypeOf(fork.do(obj).config).not.toHaveProperty('push')
      expectTypeOf(fork.do(obj).config).toBeCallableWith(
        (draft: Map<string, boolean>) => {},
      )

      expectTypeOf(fork.do(obj).items).not.toHaveProperty('key')
      expectTypeOf(fork.do(obj).items).toHaveProperty(0)

      expectTypeOf(fork.do(obj).groups).not.toHaveProperty('set')
      expectTypeOf(fork.do(obj).groups).not.toHaveProperty('key')
    })
  })

  describe('primitive property errors', () => {
    it('should not allow edit.batch on primitive properties', () => {
      expectTypeOf(fork.do(obj).name).toEqualTypeOf<never>()
      expectTypeOf(fork.do(obj).age).toEqualTypeOf<never>()
      expectTypeOf(fork.do(obj).optional).toEqualTypeOf<never>()
      expectTypeOf(fork.do(obj).nested.value).toEqualTypeOf<never>()
    })
  })

  describe('mutator function type errors', () => {
    it('should error if the function returns a value', () => {
      expectTypeOf(fork.do(obj).nested).toBeCallableWith(
        (draft: { value: number }) => {},
      )
      expectTypeOf(fork.do(obj).nested)
        .parameter(0)
        .not.toMatchTypeOf<(arg: { value: number }) => { value: number }>()

      expectTypeOf(fork.do(obj).nested)
        .parameter(0)
        .toMatchTypeOf<(arg: Editable<{ value: number }>) => void>()
    })
    it('should error when using wrong mutator function signatures', () => {
      expectTypeOf(fork.do(obj).nested).toBeCallableWith(
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
      expectTypeOf(fork.do(obj).nested)
        .parameter(0)
        .not.toMatchTypeOf<(draft: { wrongProperty: string }) => void>()

      expectTypeOf(fork.do(obj).nested.optionalNested.data).toBeCallableWith(
        (draft: string[]) => {
          draft.push('valid', 'array')
        },
      )
      expectTypeOf(fork.do(obj).nested.optionalNested.data)
        .parameter(0)
        .not.toMatchTypeOf<(draft: number[]) => void>()
    })

    it('should error when passing wrong types to array mutators', () => {
      expectTypeOf(fork.do(obj).items).toBeCallableWith(
        (draft: Array<{ id: number; label: string }>) => {
          draft.push({ id: 1, label: 'test' })
        },
      )
      expectTypeOf(fork.do(obj).items)
        .parameter(0)
        .not.toMatchTypeOf<(draft: string[]) => void>()

      expectTypeOf(fork.do(obj).items[0]).toBeCallableWith(
        (draft: { id: number; label: string }) => {
          draft.id = 1
          draft.label = 'test'
        },
      )
      expectTypeOf(fork.do(obj).items[0])
        .parameter(0)
        .not.toMatchTypeOf<(draft: string) => void>()
    })

    it('should error when passing wrong types to Map mutators', () => {
      expectTypeOf(fork.do(obj).config).toBeCallableWith(
        (draft: Map<string, boolean>) => {
          draft.set('key', true)
        },
      )
      expectTypeOf(fork.do(obj).config)
        .parameter(0)
        .not.toMatchTypeOf<(draft: Map<string, string>) => void>()
    })

    it('should error when passing wrong types to Set mutators', () => {
      expectTypeOf(fork.do(obj).groups).toBeCallableWith(
        (draft: Set<string>) => {
          draft.add('admin')
        },
      )
      expectTypeOf(fork.do(obj).groups)
        .parameter(0)
        .not.toMatchTypeOf<(draft: Set<number>) => void>()
    })
  })

  describe('Map key type errors', () => {
    it('should error when using wrong Map key types in mutators', () => {
      expectTypeOf(fork.do(obj).config).toBeCallableWith(
        (draft: Map<string, boolean>) => {
          draft.set('validKey', true)
        },
      )
      expectTypeOf(fork.do(obj).config)
        .parameter(0)
        .not.toMatchTypeOf<(draft: Map<number, boolean>) => void>()
    })
  })

  describe('array method access errors', () => {
    it('should not allow direct array method access on properties', () => {
      // edit.batch should NOT provide array methods directly on the property
      expectTypeOf(fork.do(obj).items).not.toHaveProperty('push')
      expectTypeOf(fork.do(obj).items).not.toHaveProperty('pop')
      expectTypeOf(fork.do(obj).items).not.toHaveProperty('shift')
      expectTypeOf(fork.do(obj).items).not.toHaveProperty('unshift')
      expectTypeOf(fork.do(obj).items).not.toHaveProperty('splice')
      expectTypeOf(fork.do(obj).items).not.toHaveProperty('sort')
      expectTypeOf(fork.do(obj).items).not.toHaveProperty('reverse')
      expectTypeOf(fork.do(obj).items).not.toHaveProperty('forEach')
      expectTypeOf(fork.do(obj).items).not.toHaveProperty('map')
      expectTypeOf(fork.do(obj).items).not.toHaveProperty('filter')
      expectTypeOf(fork.do(obj).items).not.toHaveProperty('find')

      // Array methods should only be available within the callback
      expectTypeOf(fork.do(obj).items).toBeCallableWith(
        (draft: Array<{ id: number; label: string }>) => {
          draft.push({ id: 2, label: 'test' }) // This is allowed inside the callback
        },
      )
    })

    it('should not allow direct array method access on nested arrays', () => {
      expectTypeOf(fork.do(obj).nested.optionalNested.data).not.toHaveProperty(
        'push',
      )
      expectTypeOf(fork.do(obj).nested.optionalNested.data).not.toHaveProperty(
        'pop',
      )
      expectTypeOf(fork.do(obj).nested.optionalNested.data).not.toHaveProperty(
        'splice',
      )

      // But should allow callback-based edit.batchg
      expectTypeOf(fork.do(obj).nested.optionalNested.data).toBeCallableWith(
        (draft: readonly string[]) => {
          // Note: arrays in drafts are readonly, so reassignment is the way to mutate
        },
      )
    })
  })

  describe('map method access errors', () => {
    it('should not allow direct Map method access on properties', () => {
      // edit.batch should NOT provide Map methods directly on the property
      expectTypeOf(fork.do(obj).config).not.toHaveProperty('set')
      expectTypeOf(fork.do(obj).config).not.toHaveProperty('get')
      expectTypeOf(fork.do(obj).config).not.toHaveProperty('delete')
      expectTypeOf(fork.do(obj).config).not.toHaveProperty('clear')
      expectTypeOf(fork.do(obj).config).not.toHaveProperty('has')
      expectTypeOf(fork.do(obj).config).not.toHaveProperty('forEach')
      expectTypeOf(fork.do(obj).config).not.toHaveProperty('entries')
      expectTypeOf(fork.do(obj).config).not.toHaveProperty('keys')
      expectTypeOf(fork.do(obj).config).not.toHaveProperty('values')

      // Map methods should only be available within the callback
      expectTypeOf(fork.do(obj).config).toBeCallableWith(
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
      expectTypeOf(fork.do(obj).groups).not.toHaveProperty('add')
      expectTypeOf(fork.do(obj).groups).not.toHaveProperty('delete')
      expectTypeOf(fork.do(obj).groups).not.toHaveProperty('clear')
      expectTypeOf(fork.do(obj).groups).not.toHaveProperty('has')
      expectTypeOf(fork.do(obj).groups).not.toHaveProperty('forEach')
      expectTypeOf(fork.do(obj).groups).not.toHaveProperty('entries')
      expectTypeOf(fork.do(obj).groups).not.toHaveProperty('keys')
      expectTypeOf(fork.do(obj).groups).not.toHaveProperty('values')

      // Set methods should only be available within the callback
      expectTypeOf(fork.do(obj).groups).toBeCallableWith(
        (draft: Set<string>) => {
          draft.add('newItem') // This is allowed inside the callback
          draft.delete('oldItem')
          draft.clear()
        },
      )
    })
  })
})
