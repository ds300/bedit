import { expectTypeOf, describe, it } from 'vitest'
import { key, fork } from '../src/patchfork.mjs'

describe('optional properties', () => {
  type Obj = {
    key?: string
    nullableKey?: string | null
    maybeUndefinedKey?: string | undefined
    maybeUndefinedNullableKey?: string | undefined | null
  }
  const obj: Obj = {}

  it('should not return undefined for top-level optional properties', () => {
    const result = fork(obj).key('test')
    expectTypeOf(result).toEqualTypeOf<Obj>()
  })

  it('should handle nullable properties', () => {
    const result = fork(obj).nullableKey('test')
    expectTypeOf(result).toEqualTypeOf<Obj>()

    const result2 = fork(obj).nullableKey(null)
    expectTypeOf(result2).toEqualTypeOf<Obj>()
  })

  it('should handle nullable and undefined properties', () => {
    const result = fork(obj).maybeUndefinedNullableKey('test')
    expectTypeOf(result).toEqualTypeOf<Obj>()

    const result2 = fork(obj).maybeUndefinedNullableKey(null)
    expectTypeOf(result2).toEqualTypeOf<Obj>()

    const result3 = fork(obj).maybeUndefinedNullableKey(undefined)
    expectTypeOf(result3).toEqualTypeOf<Obj>()
  })
})

describe('required properties', () => {
  type Obj = {
    name: string
    age: number
    isActive: boolean
    nullableValue: string | null
    maybeUndefinedValue: string | undefined
  }
  const obj: Obj = {
    name: 'John',
    age: 30,
    isActive: true,
    nullableValue: null,
    maybeUndefinedValue: undefined,
  }

  it('should accept value for required string property', () => {
    const result = fork(obj).name('Jane')
    expectTypeOf(result).toEqualTypeOf<Obj>()
  })

  it('should accept value for required number property', () => {
    const result = fork(obj).age(31)
    expectTypeOf(result).toEqualTypeOf<Obj>()
  })

  it('should accept value for required boolean property', () => {
    const result = fork(obj).isActive(false)
    expectTypeOf(result).toEqualTypeOf<Obj>()
  })

  it('should accept value for nullable property', () => {
    const result = fork(obj).nullableValue('test')
    expectTypeOf(result).toEqualTypeOf<Obj>()

    const result2 = fork(obj).nullableValue(null)
    expectTypeOf(result2).toEqualTypeOf<Obj>()
  })

  it('should accept value for undefined property', () => {
    const result = fork(obj).maybeUndefinedValue('test')
    expectTypeOf(result).toEqualTypeOf<Obj>()

    const result2 = fork(obj).maybeUndefinedValue(undefined)
    expectTypeOf(result2).toEqualTypeOf<Obj>()
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

  it('should set nested required property', () => {
    const result = fork(user).profile.name('Jane')
    expectTypeOf(result).toEqualTypeOf<User>()
  })

  it('should set nested optional property', () => {
    const result = fork(user).profile.settings({
      theme: 'dark',
      notifications: true,
    })
    expectTypeOf(result).toEqualTypeOf<User>()
  })

  it('should set deeply nested property', () => {
    const result = fork(user).profile.settings.theme('dark')
    expectTypeOf(result).toEqualTypeOf<User | undefined>()
  })

  it('should set optional nested object', () => {
    const result = fork(user).metadata({ lastLogin: new Date() })
    expectTypeOf(result).toEqualTypeOf<User>()
  })
})

describe('array properties', () => {
  type TodoList = {
    todos: Array<{ id: number; text: string; completed: boolean }>
    tags?: string[]
  }
  const todoList: TodoList = {
    todos: [{ id: 1, text: 'Learn TypeScript', completed: false }],
  }

  it('should set array element by index', () => {
    const result = fork(todoList).todos[0]({
      id: 2,
      text: 'New todo',
      completed: true,
    })
    expectTypeOf(result).toEqualTypeOf<TodoList>()
  })

  it('should set nested property in array element', () => {
    const result = fork(todoList).todos[0].completed(true)
    expectTypeOf(result).toEqualTypeOf<TodoList>()
  })

  it('should set optional array property', () => {
    const result = fork(todoList).tags(['urgent', 'important'])
    expectTypeOf(result).toEqualTypeOf<TodoList>()
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

  it('should return undefined when setting arrays in optional objects', () => {
    const prefsResult = fork(profile).user.preferences(['dark-mode'])
    expectTypeOf(prefsResult).toEqualTypeOf<UserProfile | undefined>()

    const bookmarksResult = fork(profile).user.optionalLists.bookmarks([
      'https://example.com',
    ])
    expectTypeOf(bookmarksResult).toEqualTypeOf<UserProfile | undefined>()
  })

  it('should return undefined when setting array elements in optional objects', () => {
    const prefResult = fork(profile).user.preferences[0]('dark-mode')
    expectTypeOf(prefResult).toEqualTypeOf<UserProfile | undefined>()

    const bookmarkResult = fork(profile).user.optionalLists.bookmarks[0](
      'https://example.com',
    )
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

    const itemsSet = fork(deep).level1.level2.level3.items(['new-item'])
    expectTypeOf(itemsSet).toEqualTypeOf<DeepNested | undefined>()

    const optionalSet = fork(deep).level1.level2.level3.optionalItems([42])
    expectTypeOf(optionalSet).toEqualTypeOf<DeepNested | undefined>()

    const itemUpdate = fork(deep).level1.level2.level3.items[0]('new-item')
    expectTypeOf(itemUpdate).toEqualTypeOf<DeepNested | undefined>()
  })
})

describe('Map properties', () => {
  type Config = {
    settings: Map<string, string>
    optionalMappings?: Map<number, boolean>
  }
  const config: Config = {
    settings: new Map([['theme', 'dark']]),
  }

  it('should set Map value by key', () => {
    const result = fork(config).settings[key]('theme')('light')
    expectTypeOf(result).toEqualTypeOf<Config>()
  })

  it('should set optional Map property', () => {
    const result = fork(config).optionalMappings(new Map([[1, true]]))
    expectTypeOf(result).toEqualTypeOf<Config>()
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
    }
    api?: {
      endpoints: Map<string, string>
      headers?: Map<string, string>
    }
  }
  const serviceConfig: ServiceConfig = {}

  it('should return undefined when setting Maps in optional objects', () => {
    const connectionsSet = fork(serviceConfig).database.connections(
      new Map([['primary', 'localhost:5432']]),
    )
    expectTypeOf(connectionsSet).toEqualTypeOf<ServiceConfig | undefined>()

    const fallbacksSet = fork(serviceConfig).database.optionalCache.fallbacks(
      new Map([['redis', true]]),
    )
    expectTypeOf(fallbacksSet).toEqualTypeOf<ServiceConfig | undefined>()
  })

  it('should return undefined when setting Map values by key in optional objects', () => {
    const connectionResult =
      fork(serviceConfig).database.connections[key]('primary')('localhost:5432')
    expectTypeOf(connectionResult).toEqualTypeOf<ServiceConfig | undefined>()

    const settingResult =
      fork(serviceConfig).database.optionalCache.settings[key]('timeout')(5000)
    expectTypeOf(settingResult).toEqualTypeOf<ServiceConfig | undefined>()

    const fallbackResult =
      fork(serviceConfig).database.optionalCache.fallbacks[key]('redis')(true)
    expectTypeOf(fallbackResult).toEqualTypeOf<ServiceConfig | undefined>()
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

    const dataSet = fork(deepMap).level1.level2.level3.data(
      new Map([['key1', 100]]),
    )
    expectTypeOf(dataSet).toEqualTypeOf<DeepMapNested | undefined>()

    const optionalSet = fork(deepMap).level1.level2.level3.optionalData(
      new Map([[1, 'value1']]),
    )
    expectTypeOf(optionalSet).toEqualTypeOf<DeepMapNested | undefined>()

    const dataKeySet = fork(deepMap).level1.level2.level3.data[key]('key1')(100)
    expectTypeOf(dataKeySet).toEqualTypeOf<DeepMapNested | undefined>()

    const optionalKeySet =
      fork(deepMap).level1.level2.level3.optionalData[key](1)('value1')
    expectTypeOf(optionalKeySet).toEqualTypeOf<DeepMapNested | undefined>()
  })

  it('should handle Maps with complex value types in optional contexts', () => {
    type ComplexMapConfig = {
      cache?: {
        userSessions: Map<string, { userId: number; expiry: Date }>
        optionalMetrics?: Map<string, { count: number; lastAccessed?: Date }>
      }
    }
    const complexConfig: ComplexMapConfig = {}

    const sessionSet = fork(complexConfig).cache.userSessions(
      new Map([['session1', { userId: 123, expiry: new Date() }]]),
    )
    expectTypeOf(sessionSet).toEqualTypeOf<ComplexMapConfig | undefined>()

    const sessionKeySet = fork(complexConfig).cache.userSessions[key](
      'session1',
    )({
      userId: 123,
      expiry: new Date(),
    })
    expectTypeOf(sessionKeySet).toEqualTypeOf<ComplexMapConfig | undefined>()

    const metricsKeySet = fork(complexConfig).cache.optionalMetrics[key](
      'page-views',
    )({
      count: 100,
      lastAccessed: new Date(),
    })
    expectTypeOf(metricsKeySet).toEqualTypeOf<ComplexMapConfig | undefined>()
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

  it('should set Set property', () => {
    const result = fork(userGroups).groups(new Set(['admin', 'moderator']))
    expectTypeOf(result).toEqualTypeOf<UserGroups>()
  })

  it('should set optional Set property', () => {
    const result = fork(userGroups).optionalTags(new Set([1, 2, 3]))
    expectTypeOf(result).toEqualTypeOf<UserGroups>()
  })
})

describe('Sets within optional nested objects', () => {
  type PermissionSystem = {
    users?: {
      activeUsers: Set<string>
      optionalGroups?: {
        admins: Set<string>
        moderators?: Set<string>
      }
    }
    resources?: {
      publicAccess: Set<string>
      restrictedAccess?: Set<string>
    }
  }
  const permissions: PermissionSystem = {}

  it('should return undefined when setting Sets in optional objects', () => {
    const activeUsersSet = fork(permissions).users.activeUsers(
      new Set(['user123']),
    )
    expectTypeOf(activeUsersSet).toEqualTypeOf<PermissionSystem | undefined>()

    const moderatorsSet = fork(permissions).users.optionalGroups.moderators(
      new Set(['mod123']),
    )
    expectTypeOf(moderatorsSet).toEqualTypeOf<PermissionSystem | undefined>()
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

    const tagsSet = fork(deepSet).level1.level2.level3.tags(
      new Set(['important']),
    )
    expectTypeOf(tagsSet).toEqualTypeOf<DeepSetNested | undefined>()

    const labelsSet = fork(deepSet).level1.level2.level3.optionalLabels(
      new Set([999]),
    )
    expectTypeOf(labelsSet).toEqualTypeOf<DeepSetNested | undefined>()
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

    const categoriesSet = fork(complexSet).categories.activeCategories(
      new Set(['tech' as const]),
    )
    expectTypeOf(categoriesSet).toEqualTypeOf<ComplexSetConfig | undefined>()

    const prioritiesSet = fork(complexSet).categories.optionalPriorities(
      new Set(['high' as const]),
    )
    expectTypeOf(prioritiesSet).toEqualTypeOf<ComplexSetConfig | undefined>()

    const flagsSet = fork(complexSet).metadata.statusFlags(new Set([true]))
    expectTypeOf(flagsSet).toEqualTypeOf<ComplexSetConfig | undefined>()

    const idsSet = fork(complexSet).metadata.optionalIds(
      new Set(['id123', 456]),
    )
    expectTypeOf(idsSet).toEqualTypeOf<ComplexSetConfig | undefined>()
  })

  it('should handle Sets containing complex object types in optional contexts', () => {
    type ObjectSetConfig = {
      cache?: {
        userRoles: Set<{ userId: string; role: 'admin' | 'user' }>
        optionalSessions?: Set<{ sessionId: string; expiry?: Date }>
      }
    }
    const objectSet: ObjectSetConfig = {}

    const rolesSet = fork(objectSet).cache.userRoles(
      new Set([{ userId: 'user123', role: 'admin' as const }]),
    )
    expectTypeOf(rolesSet).toEqualTypeOf<ObjectSetConfig | undefined>()

    const sessionsSet = fork(objectSet).cache.optionalSessions(
      new Set([{ sessionId: 'session456', expiry: new Date() }]),
    )
    expectTypeOf(sessionsSet).toEqualTypeOf<ObjectSetConfig | undefined>()
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
    expectTypeOf(fork(rootArray)[0]('new')).toMatchTypeOf<string[]>()
    expectTypeOf(fork(rootArray)(rootArray)).toMatchTypeOf<string[]>()
    expectTypeOf(fork(rootArray)(['new', 'array'])).toMatchTypeOf<string[]>()
  })

  it('should work with Map as root object', () => {
    expectTypeOf(fork(rootMap)[key]('key1')('newValue')).toMatchTypeOf<
      Map<string, string>
    >()
    expectTypeOf(fork(rootMap)(rootMap)).toMatchTypeOf<Map<string, string>>()
    expectTypeOf(
      fork(rootMap)(new Map([['newKey', 'newValue']])),
    ).toMatchTypeOf<Map<string, string>>()
  })

  it('should work with Set as root object', () => {
    expectTypeOf(fork(rootSet)(rootSet)).toMatchTypeOf<Set<string>>()
    expectTypeOf(fork(rootSet)(new Set(['newSet']))).toMatchTypeOf<
      Set<string>
    >()
  })
})

describe('nullable root collection objects', () => {
  // Nullable Maps/Arrays/Sets as root objects
  const nullableArray: string[] | null = ['a', 'b']
  const nullableMap: Map<string, string> | null = new Map([['key', 'value']])
  const nullableSet: Set<string> | null = new Set(['item'])

  it('should work with nullable Array as root', () => {
    // Should support same operations as normal array but return Root | undefined
    expectTypeOf(fork(nullableArray)[0]('new')).toMatchTypeOf<
      string[] | undefined
    >()
    expectTypeOf(fork(nullableArray)(nullableArray)).toMatchTypeOf<
      string[] | undefined
    >()
    expectTypeOf(fork(nullableArray)(['new', 'array'])).toMatchTypeOf<
      string[] | undefined
    >()
  })

  it('should work with nullable Map as root', () => {
    // Should support same operations as normal map but return Root | undefined
    expectTypeOf(fork(nullableMap)[key]('key')('newValue')).toMatchTypeOf<
      Map<string, string> | undefined
    >()
    expectTypeOf(fork(nullableMap)(nullableMap)).toMatchTypeOf<
      Map<string, string> | undefined
    >()
    expectTypeOf(
      fork(nullableMap)(new Map([['newKey', 'newValue']])),
    ).toMatchTypeOf<Map<string, string> | undefined>()
  })

  it('should work with nullable Set as root', () => {
    // Should support same operations as normal set but return Root | undefined
    expectTypeOf(fork(nullableSet)(nullableSet)).toMatchTypeOf<
      Set<string> | undefined
    >()
    expectTypeOf(fork(nullableSet)(new Set(['newSet']))).toMatchTypeOf<
      Set<string> | undefined
    >()
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
    expectTypeOf(fork(undefinableArray)[0]('new')).toMatchTypeOf<
      string[] | undefined
    >()
    expectTypeOf(fork(undefinableArray)(undefinableArray)).toMatchTypeOf<
      string[] | undefined
    >()
    expectTypeOf(fork(undefinableArray)(['new', 'array'])).toMatchTypeOf<
      string[] | undefined
    >()
  })

  it('should work with undefinable Map as root', () => {
    expectTypeOf(fork(undefinableMap)[key]('key')('newValue')).toMatchTypeOf<
      Map<string, string> | undefined
    >()
    expectTypeOf(fork(undefinableMap)(undefinableMap)).toMatchTypeOf<
      Map<string, string> | undefined
    >()
    expectTypeOf(
      fork(undefinableMap)(new Map([['newKey', 'newValue']])),
    ).toMatchTypeOf<Map<string, string> | undefined>()
  })

  it('should work with undefinable Set as root', () => {
    expectTypeOf(fork(undefinableSet)(undefinableSet)).toMatchTypeOf<
      Set<string> | undefined
    >()
    expectTypeOf(fork(undefinableSet)(new Set(['newSet']))).toMatchTypeOf<
      Set<string> | undefined
    >()
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
      expectTypeOf(fork(obj)).not.toHaveProperty('nonExistent')
      expectTypeOf(fork(obj)).toHaveProperty('name')

      expectTypeOf(fork(obj).nested).not.toHaveProperty('wrongProperty')
      expectTypeOf(fork(obj).nested).toHaveProperty('value')
    })

    it('should error when using wrong method types on collections', () => {
      expectTypeOf(fork(obj).config).not.toHaveProperty('push')
      expectTypeOf(fork(obj).config).toHaveProperty(key)

      expectTypeOf(fork(obj).items).not.toHaveProperty(key)
      expectTypeOf(fork(obj).items).toHaveProperty(0)

      expectTypeOf(fork(obj).groups).not.toHaveProperty('set')
      expectTypeOf(fork(obj).groups).not.toHaveProperty(key)
    })
  })

  describe('value type errors', () => {
    it('should error when setting wrong value types', () => {
      expectTypeOf(fork(obj).name)
        .parameter(0)
        .toMatchTypeOf<string | ((s: string) => string)>()
      expectTypeOf(fork(obj).name).parameter(0).not.toMatchTypeOf<number>()

      expectTypeOf(fork(obj).age)
        .parameter(0)
        .toMatchTypeOf<number | ((n: number) => number)>()
      expectTypeOf(fork(obj).age).parameter(0).not.toMatchTypeOf<string>()

      fork(obj).nested.optionalNested.data(['a', 'b'])
      fork(obj).nested.optionalNested.data(() => ['a', 'b'])

      // @ts-expect-error
      fork(obj).nested.optionalNested.data(['a', 1])
      // @ts-expect-error
      fork(obj).nested.optionalNested.data(() => ['a', 1])
      // @ts-expect-error
      fork(obj).nested.optionalNested.data(1)

      expectTypeOf(fork(obj).nested.optionalNested.data)
        .parameter(0)
        .not.toMatchTypeOf<number[]>()
    })

    it('should error when passing wrong types to array setters', () => {
      fork(obj).items([{ id: 1, label: 'test' }])
      fork(obj).items(() => [{ id: 1, label: 'test' }])

      // @ts-expect-error
      fork(obj).items(() => 1)
      // @ts-expect-error
      fork(obj).items(() => 'test')
    })

    it('should error when passing wrong types to Map setters', () => {
      fork(obj).config(new Map([['key', true]]))
      fork(obj).config(() => new Map([['key', true]]))

      // @ts-expect-error
      fork(obj).config(() => 1)
      // @ts-expect-error
      fork(obj).config(() => 'test')
    })

    it('should error when passing wrong types to Set setters', () => {
      fork(obj).groups(new Set(['admin']))
      fork(obj).groups(() => new Set(['admin']))

      // @ts-expect-error
      fork(obj).groups(() => 1)
      // @ts-expect-error
      fork(obj).groups(() => 'test')
    })
  })

  describe('optional property access errors', () => {
    it('should error when assuming optional properties are required', () => {
      // Test that top-level optional properties return Root, not Root | undefined
      expectTypeOf(fork(obj).optional('test')).toEqualTypeOf<TestObj>()
      expectTypeOf(fork(obj).optional('test')).not.toEqualTypeOf<
        TestObj | undefined
      >()

      expectTypeOf(
        fork(obj).nested.optionalNested({ data: [], tags: new Set() }),
      ).toEqualTypeOf<TestObj>()
      expectTypeOf(
        fork(obj).nested.optionalNested({ data: [], tags: new Set() }),
      ).not.toEqualTypeOf<TestObj | undefined>()

      expectTypeOf(
        fork(obj).nested.optionalNested.data(['item']),
      ).toEqualTypeOf<TestObj | undefined>()
      expectTypeOf(
        fork(obj).nested.optionalNested.data(['item']),
      ).not.toEqualTypeOf<TestObj>()
    })
  })

  describe('Map key type errors', () => {
    it('should error when using wrong Map key types', () => {
      expectTypeOf(fork(obj).config[key]).toBeCallableWith('validKey')
      expectTypeOf(fork(obj).config[key])
        .parameter(0)
        .not.toMatchTypeOf<number>()
      expectTypeOf(fork(obj).config[key])
        .parameter(0)
        .not.toMatchTypeOf<boolean>()
    })
  })
})
