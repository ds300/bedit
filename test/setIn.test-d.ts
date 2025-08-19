import { expectTypeOf, describe, it } from 'vitest'
import { setIn } from '../src/bedit.mjs'

describe('optional properties', () => {
  type Obj = {
    key?: string
    nullableKey?: string | null
    maybeUndefinedKey?: string | undefined
    maybeUndefinedNullableKey?: string | undefined | null
  }
  const obj: Obj = {}

  it('should not return undefined for top-level optional properties', () => {
    const result = setIn(obj).key('test')
    expectTypeOf(result).toEqualTypeOf<Obj>()
  })

  it('should handle nullable properties', () => {
    const result = setIn(obj).nullableKey('test')
    expectTypeOf(result).toEqualTypeOf<Obj>()

    const result2 = setIn(obj).nullableKey(null)
    expectTypeOf(result2).toEqualTypeOf<Obj>()
  })

  it('should handle nullable and undefined properties', () => {
    const result = setIn(obj).maybeUndefinedNullableKey('test')
    expectTypeOf(result).toEqualTypeOf<Obj>()

    const result2 = setIn(obj).maybeUndefinedNullableKey(null)
    expectTypeOf(result2).toEqualTypeOf<Obj>()

    const result3 = setIn(obj).maybeUndefinedNullableKey(undefined)
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
    const result = setIn(obj).name('Jane')
    expectTypeOf(result).toEqualTypeOf<Obj>()
  })

  it('should accept value for required number property', () => {
    const result = setIn(obj).age(31)
    expectTypeOf(result).toEqualTypeOf<Obj>()
  })

  it('should accept value for required boolean property', () => {
    const result = setIn(obj).isActive(false)
    expectTypeOf(result).toEqualTypeOf<Obj>()
  })

  it('should accept value for nullable property', () => {
    const result = setIn(obj).nullableValue('test')
    expectTypeOf(result).toEqualTypeOf<Obj>()

    const result2 = setIn(obj).nullableValue(null)
    expectTypeOf(result2).toEqualTypeOf<Obj>()
  })

  it('should accept value for undefined property', () => {
    const result = setIn(obj).maybeUndefinedValue('test')
    expectTypeOf(result).toEqualTypeOf<Obj>()

    const result2 = setIn(obj).maybeUndefinedValue(undefined)
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
    const result = setIn(user).profile.name('Jane')
    expectTypeOf(result).toEqualTypeOf<User>()
  })

  it('should set nested optional property', () => {
    const result = setIn(user).profile.settings({
      theme: 'dark',
      notifications: true,
    })
    expectTypeOf(result).toEqualTypeOf<User>()
  })

  it('should set deeply nested property', () => {
    const result = setIn(user).profile.settings.theme('dark')
    expectTypeOf(result).toEqualTypeOf<User | undefined>()
  })

  it('should set optional nested object', () => {
    const result = setIn(user).metadata({ lastLogin: new Date() })
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
    const result = setIn(todoList).todos[0]({
      id: 2,
      text: 'New todo',
      completed: true,
    })
    expectTypeOf(result).toEqualTypeOf<TodoList>()
  })

  it('should set nested property in array element', () => {
    const result = setIn(todoList).todos[0].completed(true)
    expectTypeOf(result).toEqualTypeOf<TodoList>()
  })

  it('should set optional array property', () => {
    const result = setIn(todoList).tags(['urgent', 'important'])
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
    const prefsResult = setIn(profile).user.preferences(['dark-mode'])
    expectTypeOf(prefsResult).toEqualTypeOf<UserProfile | undefined>()

    const bookmarksResult = setIn(profile).user.optionalLists.bookmarks([
      'https://example.com',
    ])
    expectTypeOf(bookmarksResult).toEqualTypeOf<UserProfile | undefined>()
  })

  it('should return undefined when setting array elements in optional objects', () => {
    const prefResult = setIn(profile).user.preferences[0]('dark-mode')
    expectTypeOf(prefResult).toEqualTypeOf<UserProfile | undefined>()

    const bookmarkResult = setIn(profile).user.optionalLists.bookmarks[0](
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

    const itemsSet = setIn(deep).level1.level2.level3.items(['new-item'])
    expectTypeOf(itemsSet).toEqualTypeOf<DeepNested | undefined>()

    const optionalSet = setIn(deep).level1.level2.level3.optionalItems([42])
    expectTypeOf(optionalSet).toEqualTypeOf<DeepNested | undefined>()

    const itemUpdate = setIn(deep).level1.level2.level3.items[0]('new-item')
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
    const result = setIn(config).settings.key('theme')('light')
    expectTypeOf(result).toEqualTypeOf<Config>()
  })

  it('should set optional Map property', () => {
    const result = setIn(config).optionalMappings(new Map([[1, true]]))
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
    const connectionsSet = setIn(serviceConfig).database.connections(
      new Map([['primary', 'localhost:5432']]),
    )
    expectTypeOf(connectionsSet).toEqualTypeOf<ServiceConfig | undefined>()

    const fallbacksSet = setIn(serviceConfig).database.optionalCache.fallbacks(
      new Map([['redis', true]]),
    )
    expectTypeOf(fallbacksSet).toEqualTypeOf<ServiceConfig | undefined>()
  })

  it('should return undefined when setting Map values by key in optional objects', () => {
    const connectionResult =
      setIn(serviceConfig).database.connections.key('primary')('localhost:5432')
    expectTypeOf(connectionResult).toEqualTypeOf<ServiceConfig | undefined>()

    const settingResult =
      setIn(serviceConfig).database.optionalCache.settings.key('timeout')(5000)
    expectTypeOf(settingResult).toEqualTypeOf<ServiceConfig | undefined>()

    const fallbackResult =
      setIn(serviceConfig).database.optionalCache.fallbacks.key('redis')(true)
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

    const dataSet = setIn(deepMap).level1.level2.level3.data(
      new Map([['key1', 100]]),
    )
    expectTypeOf(dataSet).toEqualTypeOf<DeepMapNested | undefined>()

    const optionalSet = setIn(deepMap).level1.level2.level3.optionalData(
      new Map([[1, 'value1']]),
    )
    expectTypeOf(optionalSet).toEqualTypeOf<DeepMapNested | undefined>()

    const dataKeySet = setIn(deepMap).level1.level2.level3.data.key('key1')(100)
    expectTypeOf(dataKeySet).toEqualTypeOf<DeepMapNested | undefined>()

    const optionalKeySet =
      setIn(deepMap).level1.level2.level3.optionalData.key(1)('value1')
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

    const sessionSet = setIn(complexConfig).cache.userSessions(
      new Map([['session1', { userId: 123, expiry: new Date() }]]),
    )
    expectTypeOf(sessionSet).toEqualTypeOf<ComplexMapConfig | undefined>()

    const sessionKeySet = setIn(complexConfig).cache.userSessions.key(
      'session1',
    )({
      userId: 123,
      expiry: new Date(),
    })
    expectTypeOf(sessionKeySet).toEqualTypeOf<ComplexMapConfig | undefined>()

    const metricsKeySet = setIn(complexConfig).cache.optionalMetrics.key(
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
    const result = setIn(userGroups).groups(new Set(['admin', 'moderator']))
    expectTypeOf(result).toEqualTypeOf<UserGroups>()
  })

  it('should set optional Set property', () => {
    const result = setIn(userGroups).optionalTags(new Set([1, 2, 3]))
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
    const activeUsersSet = setIn(permissions).users.activeUsers(
      new Set(['user123']),
    )
    expectTypeOf(activeUsersSet).toEqualTypeOf<PermissionSystem | undefined>()

    const moderatorsSet = setIn(permissions).users.optionalGroups.moderators(
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

    const tagsSet = setIn(deepSet).level1.level2.level3.tags(
      new Set(['important']),
    )
    expectTypeOf(tagsSet).toEqualTypeOf<DeepSetNested | undefined>()

    const labelsSet = setIn(deepSet).level1.level2.level3.optionalLabels(
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

    const categoriesSet = setIn(complexSet).categories.activeCategories(
      new Set(['tech']),
    )
    expectTypeOf(categoriesSet).toEqualTypeOf<ComplexSetConfig | undefined>()

    const prioritiesSet = setIn(complexSet).categories.optionalPriorities(
      new Set(['high']),
    )
    expectTypeOf(prioritiesSet).toEqualTypeOf<ComplexSetConfig | undefined>()

    const flagsSet = setIn(complexSet).metadata.statusFlags(new Set([true]))
    expectTypeOf(flagsSet).toEqualTypeOf<ComplexSetConfig | undefined>()

    const idsSet = setIn(complexSet).metadata.optionalIds(
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

    const rolesSet = setIn(objectSet).cache.userRoles(
      new Set([{ userId: 'user123', role: 'admin' }]),
    )
    expectTypeOf(rolesSet).toEqualTypeOf<ObjectSetConfig | undefined>()

    const sessionsSet = setIn(objectSet).cache.optionalSessions(
      new Set([{ sessionId: 'session456', expiry: new Date() }]),
    )
    expectTypeOf(sessionsSet).toEqualTypeOf<ObjectSetConfig | undefined>()
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
      expectTypeOf(setIn(obj)).not.toHaveProperty('nonExistent')
      expectTypeOf(setIn(obj)).toHaveProperty('name')

      expectTypeOf(setIn(obj).nested).not.toHaveProperty('wrongProperty')
      expectTypeOf(setIn(obj).nested).toHaveProperty('value')
    })

    it('should error when using wrong method types on collections', () => {
      expectTypeOf(setIn(obj).config).not.toHaveProperty('push')
      expectTypeOf(setIn(obj).config).toHaveProperty('key')

      expectTypeOf(setIn(obj).items).not.toHaveProperty('key')
      expectTypeOf(setIn(obj).items).toHaveProperty(0)

      expectTypeOf(setIn(obj).groups).not.toHaveProperty('set')
      expectTypeOf(setIn(obj).groups).not.toHaveProperty('key')
    })
  })

  describe('value type errors', () => {
    it('should error when setting wrong value types', () => {
      expectTypeOf(setIn(obj).name).toBeCallableWith('valid string')
      expectTypeOf(setIn(obj).name).parameter(0).not.toMatchTypeOf<number>()

      expectTypeOf(setIn(obj).age).toBeCallableWith(42)
      expectTypeOf(setIn(obj).age).parameter(0).not.toMatchTypeOf<string>()

      expectTypeOf(setIn(obj).nested.optionalNested.data).toBeCallableWith([
        'valid',
        'array',
      ])
      expectTypeOf(setIn(obj).nested.optionalNested.data)
        .parameter(0)
        .not.toMatchTypeOf<number[]>()
    })

    it('should error when passing wrong types to array setters', () => {
      expectTypeOf(setIn(obj).items).toBeCallableWith([
        { id: 1, label: 'test' },
      ])
      expectTypeOf(setIn(obj).items).parameter(0).not.toMatchTypeOf<string[]>()

      expectTypeOf(setIn(obj).items[0]).toBeCallableWith({
        id: 1,
        label: 'test',
      })
      expectTypeOf(setIn(obj).items[0]).parameter(0).not.toMatchTypeOf<string>()
    })

    it('should error when passing wrong types to Map setters', () => {
      expectTypeOf(setIn(obj).config).toBeCallableWith(new Map([['key', true]]))
      expectTypeOf(setIn(obj).config)
        .parameter(0)
        .not.toMatchTypeOf<Map<string, string>>()

      expectTypeOf(setIn(obj).config.key('test')).toBeCallableWith(true)
      expectTypeOf(setIn(obj).config.key('test'))
        .parameter(0)
        .not.toMatchTypeOf<string>()
    })

    it('should error when passing wrong types to Set setters', () => {
      expectTypeOf(setIn(obj).groups).toBeCallableWith(new Set(['admin']))
      expectTypeOf(setIn(obj).groups)
        .parameter(0)
        .not.toMatchTypeOf<Set<number>>()
    })
  })

  describe('optional property access errors', () => {
    it('should error when assuming optional properties are required', () => {
      // Test that top-level optional properties return Root, not Root | undefined
      expectTypeOf(setIn(obj).optional('test')).toEqualTypeOf<TestObj>()
      expectTypeOf(setIn(obj).optional('test')).not.toEqualTypeOf<
        TestObj | undefined
      >()

      expectTypeOf(
        setIn(obj).nested.optionalNested({ data: [], tags: new Set() }),
      ).toEqualTypeOf<TestObj>()
      expectTypeOf(
        setIn(obj).nested.optionalNested({ data: [], tags: new Set() }),
      ).not.toEqualTypeOf<TestObj | undefined>()

      expectTypeOf(
        setIn(obj).nested.optionalNested.data(['item']),
      ).toEqualTypeOf<TestObj | undefined>()
      expectTypeOf(
        setIn(obj).nested.optionalNested.data(['item']),
      ).not.toEqualTypeOf<TestObj>()
    })
  })

  describe('Map key type errors', () => {
    it('should error when using wrong Map key types', () => {
      expectTypeOf(setIn(obj).config.key).toBeCallableWith('validKey')
      expectTypeOf(setIn(obj).config.key)
        .parameter(0)
        .not.toMatchTypeOf<number>()
      expectTypeOf(setIn(obj).config.key)
        .parameter(0)
        .not.toMatchTypeOf<boolean>()
    })
  })
})
