import { expectTypeOf, describe, it } from 'vitest'
import { key, edit } from '../src/bedit.mjs'

describe('optional properties', () => {
  type Obj = {
    key?: string
    nullableKey?: string | null
    maybeUndefinedKey?: string | undefined
    maybeUndefinedNullableKey?: string | undefined | null
  }
  const obj: Obj = {}

  it('should not return undefined for top-level optional properties', () => {
    const result = edit(obj).key('test')
    expectTypeOf(result).toEqualTypeOf<Obj>()
  })

  it('should handle nullable properties', () => {
    const result = edit(obj).nullableKey('test')
    expectTypeOf(result).toEqualTypeOf<Obj>()

    const result2 = edit(obj).nullableKey(null)
    expectTypeOf(result2).toEqualTypeOf<Obj>()
  })

  it('should handle nullable and undefined properties', () => {
    const result = edit(obj).maybeUndefinedNullableKey('test')
    expectTypeOf(result).toEqualTypeOf<Obj>()

    const result2 = edit(obj).maybeUndefinedNullableKey(null)
    expectTypeOf(result2).toEqualTypeOf<Obj>()

    const result3 = edit(obj).maybeUndefinedNullableKey(undefined)
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
    const result = edit(obj).name('Jane')
    expectTypeOf(result).toEqualTypeOf<Obj>()
  })

  it('should accept value for required number property', () => {
    const result = edit(obj).age(31)
    expectTypeOf(result).toEqualTypeOf<Obj>()
  })

  it('should accept value for required boolean property', () => {
    const result = edit(obj).isActive(false)
    expectTypeOf(result).toEqualTypeOf<Obj>()
  })

  it('should accept value for nullable property', () => {
    const result = edit(obj).nullableValue('test')
    expectTypeOf(result).toEqualTypeOf<Obj>()

    const result2 = edit(obj).nullableValue(null)
    expectTypeOf(result2).toEqualTypeOf<Obj>()
  })

  it('should accept value for undefined property', () => {
    const result = edit(obj).maybeUndefinedValue('test')
    expectTypeOf(result).toEqualTypeOf<Obj>()

    const result2 = edit(obj).maybeUndefinedValue(undefined)
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
    const result = edit(user).profile.name('Jane')
    expectTypeOf(result).toEqualTypeOf<User>()
  })

  it('should set nested optional property', () => {
    const result = edit(user).profile.settings({
      theme: 'dark',
      notifications: true,
    })
    expectTypeOf(result).toEqualTypeOf<User>()
  })

  it('should set deeply nested property', () => {
    const result = edit(user).profile.settings.theme('dark')
    expectTypeOf(result).toEqualTypeOf<User | undefined>()
  })

  it('should set optional nested object', () => {
    const result = edit(user).metadata({ lastLogin: new Date() })
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
    const result = edit(todoList).todos[0]({
      id: 2,
      text: 'New todo',
      completed: true,
    })
    expectTypeOf(result).toEqualTypeOf<TodoList>()
  })

  it('should set nested property in array element', () => {
    const result = edit(todoList).todos[0].completed(true)
    expectTypeOf(result).toEqualTypeOf<TodoList>()
  })

  it('should set optional array property', () => {
    const result = edit(todoList).tags(['urgent', 'important'])
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
    const prefsResult = edit(profile).user.preferences(['dark-mode'])
    expectTypeOf(prefsResult).toEqualTypeOf<UserProfile | undefined>()

    const bookmarksResult = edit(profile).user.optionalLists.bookmarks([
      'https://example.com',
    ])
    expectTypeOf(bookmarksResult).toEqualTypeOf<UserProfile | undefined>()
  })

  it('should return undefined when setting array elements in optional objects', () => {
    const prefResult = edit(profile).user.preferences[0]('dark-mode')
    expectTypeOf(prefResult).toEqualTypeOf<UserProfile | undefined>()

    const bookmarkResult = edit(profile).user.optionalLists.bookmarks[0](
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

    const itemsSet = edit(deep).level1.level2.level3.items(['new-item'])
    expectTypeOf(itemsSet).toEqualTypeOf<DeepNested | undefined>()

    const optionalSet = edit(deep).level1.level2.level3.optionalItems([42])
    expectTypeOf(optionalSet).toEqualTypeOf<DeepNested | undefined>()

    const itemUpdate = edit(deep).level1.level2.level3.items[0]('new-item')
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
    const result = edit(config).settings[key]('theme')('light')
    expectTypeOf(result).toEqualTypeOf<Config>()
  })

  it('should set optional Map property', () => {
    const result = edit(config).optionalMappings(new Map([[1, true]]))
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
    const connectionsSet = edit(serviceConfig).database.connections(
      new Map([['primary', 'localhost:5432']]),
    )
    expectTypeOf(connectionsSet).toEqualTypeOf<ServiceConfig | undefined>()

    const fallbacksSet = edit(serviceConfig).database.optionalCache.fallbacks(
      new Map([['redis', true]]),
    )
    expectTypeOf(fallbacksSet).toEqualTypeOf<ServiceConfig | undefined>()
  })

  it('should return undefined when setting Map values by key in optional objects', () => {
    const connectionResult =
      edit(serviceConfig).database.connections[key]('primary')('localhost:5432')
    expectTypeOf(connectionResult).toEqualTypeOf<ServiceConfig | undefined>()

    const settingResult =
      edit(serviceConfig).database.optionalCache.settings[key]('timeout')(5000)
    expectTypeOf(settingResult).toEqualTypeOf<ServiceConfig | undefined>()

    const fallbackResult =
      edit(serviceConfig).database.optionalCache.fallbacks[key]('redis')(true)
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

    const dataSet = edit(deepMap).level1.level2.level3.data(
      new Map([['key1', 100]]),
    )
    expectTypeOf(dataSet).toEqualTypeOf<DeepMapNested | undefined>()

    const optionalSet = edit(deepMap).level1.level2.level3.optionalData(
      new Map([[1, 'value1']]),
    )
    expectTypeOf(optionalSet).toEqualTypeOf<DeepMapNested | undefined>()

    const dataKeySet = edit(deepMap).level1.level2.level3.data[key]('key1')(100)
    expectTypeOf(dataKeySet).toEqualTypeOf<DeepMapNested | undefined>()

    const optionalKeySet =
      edit(deepMap).level1.level2.level3.optionalData[key](1)('value1')
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

    const sessionSet = edit(complexConfig).cache.userSessions(
      new Map([['session1', { userId: 123, expiry: new Date() }]]),
    )
    expectTypeOf(sessionSet).toEqualTypeOf<ComplexMapConfig | undefined>()

    const sessionKeySet = edit(complexConfig).cache.userSessions[key](
      'session1',
    )({
      userId: 123,
      expiry: new Date(),
    })
    expectTypeOf(sessionKeySet).toEqualTypeOf<ComplexMapConfig | undefined>()

    const metricsKeySet = edit(complexConfig).cache.optionalMetrics[key](
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
    const result = edit(userGroups).groups(new Set(['admin', 'moderator']))
    expectTypeOf(result).toEqualTypeOf<UserGroups>()
  })

  it('should set optional Set property', () => {
    const result = edit(userGroups).optionalTags(new Set([1, 2, 3]))
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
    const activeUsersSet = edit(permissions).users.activeUsers(
      new Set(['user123']),
    )
    expectTypeOf(activeUsersSet).toEqualTypeOf<PermissionSystem | undefined>()

    const moderatorsSet = edit(permissions).users.optionalGroups.moderators(
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

    const tagsSet = edit(deepSet).level1.level2.level3.tags(
      new Set(['important']),
    )
    expectTypeOf(tagsSet).toEqualTypeOf<DeepSetNested | undefined>()

    const labelsSet = edit(deepSet).level1.level2.level3.optionalLabels(
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

    const categoriesSet = edit(complexSet).categories.activeCategories(
      new Set(['tech' as const]),
    )
    expectTypeOf(categoriesSet).toEqualTypeOf<ComplexSetConfig | undefined>()

    const prioritiesSet = edit(complexSet).categories.optionalPriorities(
      new Set(['high' as const]),
    )
    expectTypeOf(prioritiesSet).toEqualTypeOf<ComplexSetConfig | undefined>()

    const flagsSet = edit(complexSet).metadata.statusFlags(new Set([true]))
    expectTypeOf(flagsSet).toEqualTypeOf<ComplexSetConfig | undefined>()

    const idsSet = edit(complexSet).metadata.optionalIds(
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

    const rolesSet = edit(objectSet).cache.userRoles(
      new Set([{ userId: 'user123', role: 'admin' as const }]),
    )
    expectTypeOf(rolesSet).toEqualTypeOf<ObjectSetConfig | undefined>()

    const sessionsSet = edit(objectSet).cache.optionalSessions(
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
    expectTypeOf(edit(rootArray)[0]('new')).toMatchTypeOf<string[]>()
    expectTypeOf(edit(rootArray)(rootArray)).toMatchTypeOf<string[]>()
    expectTypeOf(edit(rootArray)(['new', 'array'])).toMatchTypeOf<string[]>()
  })

  it('should work with Map as root object', () => {
    expectTypeOf(edit(rootMap)[key]('key1')('newValue')).toMatchTypeOf<
      Map<string, string>
    >()
    expectTypeOf(edit(rootMap)(rootMap)).toMatchTypeOf<Map<string, string>>()
    expectTypeOf(
      edit(rootMap)(new Map([['newKey', 'newValue']])),
    ).toMatchTypeOf<Map<string, string>>()
  })

  it('should work with Set as root object', () => {
    expectTypeOf(edit(rootSet)(rootSet)).toMatchTypeOf<Set<string>>()
    expectTypeOf(edit(rootSet)(new Set(['newSet']))).toMatchTypeOf<
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
    expectTypeOf(edit(nullableArray)[0]('new')).toMatchTypeOf<
      string[] | undefined
    >()
    expectTypeOf(edit(nullableArray)(nullableArray)).toMatchTypeOf<
      string[] | undefined
    >()
    expectTypeOf(edit(nullableArray)(['new', 'array'])).toMatchTypeOf<
      string[] | undefined
    >()
  })

  it('should work with nullable Map as root', () => {
    // Should support same operations as normal map but return Root | undefined
    expectTypeOf(edit(nullableMap)[key]('key')('newValue')).toMatchTypeOf<
      Map<string, string> | undefined
    >()
    expectTypeOf(edit(nullableMap)(nullableMap)).toMatchTypeOf<
      Map<string, string> | undefined
    >()
    expectTypeOf(
      edit(nullableMap)(new Map([['newKey', 'newValue']])),
    ).toMatchTypeOf<Map<string, string> | undefined>()
  })

  it('should work with nullable Set as root', () => {
    // Should support same operations as normal set but return Root | undefined
    expectTypeOf(edit(nullableSet)(nullableSet)).toMatchTypeOf<
      Set<string> | undefined
    >()
    expectTypeOf(edit(nullableSet)(new Set(['newSet']))).toMatchTypeOf<
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
    expectTypeOf(edit(undefinableArray)[0]('new')).toMatchTypeOf<
      string[] | undefined
    >()
    expectTypeOf(edit(undefinableArray)(undefinableArray)).toMatchTypeOf<
      string[] | undefined
    >()
    expectTypeOf(edit(undefinableArray)(['new', 'array'])).toMatchTypeOf<
      string[] | undefined
    >()
  })

  it('should work with undefinable Map as root', () => {
    expectTypeOf(edit(undefinableMap)[key]('key')('newValue')).toMatchTypeOf<
      Map<string, string> | undefined
    >()
    expectTypeOf(edit(undefinableMap)(undefinableMap)).toMatchTypeOf<
      Map<string, string> | undefined
    >()
    expectTypeOf(
      edit(undefinableMap)(new Map([['newKey', 'newValue']])),
    ).toMatchTypeOf<Map<string, string> | undefined>()
  })

  it('should work with undefinable Set as root', () => {
    expectTypeOf(edit(undefinableSet)(undefinableSet)).toMatchTypeOf<
      Set<string> | undefined
    >()
    expectTypeOf(edit(undefinableSet)(new Set(['newSet']))).toMatchTypeOf<
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
      expectTypeOf(edit(obj)).not.toHaveProperty('nonExistent')
      expectTypeOf(edit(obj)).toHaveProperty('name')

      expectTypeOf(edit(obj).nested).not.toHaveProperty('wrongProperty')
      expectTypeOf(edit(obj).nested).toHaveProperty('value')
    })

    it('should error when using wrong method types on collections', () => {
      expectTypeOf(edit(obj).config).not.toHaveProperty('push')
      expectTypeOf(edit(obj).config).toHaveProperty(key)

      expectTypeOf(edit(obj).items).not.toHaveProperty(key)
      expectTypeOf(edit(obj).items).toHaveProperty(0)

      expectTypeOf(edit(obj).groups).not.toHaveProperty('set')
      expectTypeOf(edit(obj).groups).not.toHaveProperty(key)
    })
  })

  describe('value type errors', () => {
    it('should error when setting wrong value types', () => {
      expectTypeOf(edit(obj).name)
        .parameter(0)
        .toMatchTypeOf<string | ((s: string) => string)>()
      expectTypeOf(edit(obj).name).parameter(0).not.toMatchTypeOf<number>()

      expectTypeOf(edit(obj).age)
        .parameter(0)
        .toMatchTypeOf<number | ((n: number) => number)>()
      expectTypeOf(edit(obj).age).parameter(0).not.toMatchTypeOf<string>()

      edit(obj).nested.optionalNested.data(['a', 'b'])
      edit(obj).nested.optionalNested.data(() => ['a', 'b'])

      // @ts-expect-error
      edit(obj).nested.optionalNested.data(['a', 1])
      // @ts-expect-error
      edit(obj).nested.optionalNested.data(() => ['a', 1])
      // @ts-expect-error
      edit(obj).nested.optionalNested.data(1)

      expectTypeOf(edit(obj).nested.optionalNested.data)
        .parameter(0)
        .not.toMatchTypeOf<number[]>()
    })

    it('should error when passing wrong types to array setters', () => {
      edit(obj).items([{ id: 1, label: 'test' }])
      edit(obj).items(() => [{ id: 1, label: 'test' }])

      // @ts-expect-error
      edit(obj).items(() => 1)
      // @ts-expect-error
      edit(obj).items(() => 'test')
    })

    it('should error when passing wrong types to Map setters', () => {
      edit(obj).config(new Map([['key', true]]))
      edit(obj).config(() => new Map([['key', true]]))

      // @ts-expect-error
      edit(obj).config(() => 1)
      // @ts-expect-error
      edit(obj).config(() => 'test')
    })

    it('should error when passing wrong types to Set setters', () => {
      edit(obj).groups(new Set(['admin']))
      edit(obj).groups(() => new Set(['admin']))

      // @ts-expect-error
      edit(obj).groups(() => 1)
      // @ts-expect-error
      edit(obj).groups(() => 'test')
    })
  })

  describe('optional property access errors', () => {
    it('should error when assuming optional properties are required', () => {
      // Test that top-level optional properties return Root, not Root | undefined
      expectTypeOf(edit(obj).optional('test')).toEqualTypeOf<TestObj>()
      expectTypeOf(edit(obj).optional('test')).not.toEqualTypeOf<
        TestObj | undefined
      >()

      expectTypeOf(
        edit(obj).nested.optionalNested({ data: [], tags: new Set() }),
      ).toEqualTypeOf<TestObj>()
      expectTypeOf(
        edit(obj).nested.optionalNested({ data: [], tags: new Set() }),
      ).not.toEqualTypeOf<TestObj | undefined>()

      expectTypeOf(
        edit(obj).nested.optionalNested.data(['item']),
      ).toEqualTypeOf<TestObj | undefined>()
      expectTypeOf(
        edit(obj).nested.optionalNested.data(['item']),
      ).not.toEqualTypeOf<TestObj>()
    })
  })

  describe('Map key type errors', () => {
    it('should error when using wrong Map key types', () => {
      expectTypeOf(edit(obj).config[key]).toBeCallableWith('validKey')
      expectTypeOf(edit(obj).config[key])
        .parameter(0)
        .not.toMatchTypeOf<number>()
      expectTypeOf(edit(obj).config[key])
        .parameter(0)
        .not.toMatchTypeOf<boolean>()
    })
  })
})
