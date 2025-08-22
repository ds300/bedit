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

  it('should return undefined if the property is optional', () => {
    const result = fork(obj).key((key) => key.toUpperCase())
    expectTypeOf(result).toEqualTypeOf<Obj | undefined>()
  })

  it('should not pass undefined into the updater if the property is optional but not nullable', () => {
    const result = fork(obj).key((key) => {
      expectTypeOf(key).toEqualTypeOf<string>()
      return key.toUpperCase()
    })
    expectTypeOf(result).toEqualTypeOf<Obj | undefined>()
  })

  it('should pass null into the updater if the property is nullable', () => {
    const result = fork(obj).nullableKey((key) => {
      expectTypeOf(key).toEqualTypeOf<string | null>()
      return key?.toUpperCase() ?? null
    })
    expectTypeOf(result).toEqualTypeOf<Obj | undefined>()
  })

  it('should pass null (but not undefined) into the updater if the property is nullable and undefined', () => {
    const result = fork(obj).maybeUndefinedNullableKey((key) => {
      expectTypeOf(key).toEqualTypeOf<string | null>()
      if (Math.random() > 0.5) {
        return 'string'
      }
      if (Math.random() > 0.5) {
        return undefined
      }
      return null
    })
    expectTypeOf(result).toEqualTypeOf<Obj | undefined>()
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

  it('should accept updater for required string property', () => {
    const result = fork(obj).name((name) => {
      expectTypeOf(name).toEqualTypeOf<string>()
      return name.toUpperCase()
    })
    expectTypeOf(result).toEqualTypeOf<Obj>()
  })

  it('should accept updater for required number property', () => {
    const result = fork(obj).age((age) => {
      expectTypeOf(age).toEqualTypeOf<number>()
      return age + 1
    })
    expectTypeOf(result).toEqualTypeOf<Obj>()
  })

  it('should accept updater for required boolean property', () => {
    const result = fork(obj).isActive((active) => {
      expectTypeOf(active).toEqualTypeOf<boolean>()
      return !active
    })
    expectTypeOf(result).toEqualTypeOf<Obj>()
  })

  it('should pass null into the updater for nullable property', () => {
    const result = fork(obj).nullableValue((value) => {
      expectTypeOf(value).toEqualTypeOf<string | null>()
      return value?.toUpperCase() ?? null
    })
    expectTypeOf(result).toEqualTypeOf<Obj>()
  })

  it('should not pass undefined into the updater if the property is required and undefined-able', () => {
    const result = fork(obj).maybeUndefinedValue((value) => {
      expectTypeOf(value).toEqualTypeOf<string>()
      return value.toUpperCase()
    })
    // but it might not return a value if the property is undefined
    expectTypeOf(result).toEqualTypeOf<Obj | undefined>()
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

  it('should update nested required property', () => {
    const result = fork(user).profile.name((name) => {
      expectTypeOf(name).toEqualTypeOf<string>()
      return name.toUpperCase()
    })
    expectTypeOf(result).toEqualTypeOf<User>()
  })

  it('should update nested optional property', () => {
    const result = fork(user).profile.settings((settings) => {
      expectTypeOf(settings).toEqualTypeOf<
        Readonly<{
          theme: 'light' | 'dark'
          notifications?: boolean
        }>
      >()
      return { ...settings, notifications: true }
    })
    expectTypeOf(result).toEqualTypeOf<User | undefined>()
  })

  it('should update deeply nested optional property', () => {
    const result = fork(user).profile.settings.theme((theme) => {
      expectTypeOf(theme).toEqualTypeOf<'light' | 'dark'>()
      return theme === 'light' ? 'dark' : 'light'
    })
    expectTypeOf(result).toEqualTypeOf<User | undefined>()
  })

  it('should update optional nested object', () => {
    const result = fork(user).metadata((metadata) => {
      expectTypeOf(metadata).toEqualTypeOf<
        Readonly<{
          lastLogin: Date
        }>
      >()
      return { lastLogin: new Date() }
    })
    expectTypeOf(result).toEqualTypeOf<User | undefined>()
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

  it('should update array element by index', () => {
    const result = fork(todoList).todos[0]((todo) => {
      expectTypeOf(todo).toEqualTypeOf<
        Readonly<{
          id: number
          text: string
          completed: boolean
        }>
      >()
      return { ...todo, completed: true }
    })
    expectTypeOf(result).toEqualTypeOf<TodoList>()
  })

  it('should update nested property in array element', () => {
    const result = fork(todoList).todos[0].completed((completed) => {
      expectTypeOf(completed).toEqualTypeOf<boolean>()
      return !completed
    })
    expectTypeOf(result).toEqualTypeOf<TodoList>()
  })

  it('should call array methods and return root type', () => {
    const pushResult = fork(todoList).todos.push({
      id: 2,
      text: 'New todo',
      completed: false,
    })
    expectTypeOf(pushResult).toEqualTypeOf<TodoList>()

    const mapResult = fork(todoList).todos.map((todo) => ({
      ...todo,
      completed: true,
    }))
    expectTypeOf(mapResult).toEqualTypeOf<TodoList>()
  })

  it('should update optional array property', () => {
    const result = fork(todoList).tags((tags) => {
      expectTypeOf(tags).toEqualTypeOf<Readonly<string[]>>()
      return [...tags, 'urgent']
    })
    expectTypeOf(result).toEqualTypeOf<TodoList | undefined>()
  })

  it('should return undefined when calling array methods on optional arrays', () => {
    const pushResult = fork(todoList).tags.push('urgent')
    expectTypeOf(pushResult).toEqualTypeOf<TodoList | undefined>()

    const popResult = fork(todoList).tags.pop()
    expectTypeOf(popResult).toEqualTypeOf<TodoList | undefined>()

    const mapResult = fork(todoList).tags.map((tag) => tag.toUpperCase())
    expectTypeOf(mapResult).toEqualTypeOf<TodoList | undefined>()

    const filterResult = fork(todoList).tags.filter((tag) => tag.length > 3)
    expectTypeOf(filterResult).toEqualTypeOf<TodoList | undefined>()
  })

  it('should return undefined when accessing optional array elements', () => {
    const result = fork(todoList).tags[0]((tag) => {
      expectTypeOf(tag).toEqualTypeOf<string>()
      return tag.toUpperCase()
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

  it('should return undefined when calling methods on arrays in optional objects', () => {
    // Array in required nested property of optional object
    const prefsResult = fork(profile).user.preferences.push('dark-mode')
    expectTypeOf(prefsResult).toEqualTypeOf<UserProfile | undefined>()

    const prefsMapResult = fork(profile).user.preferences.map((p) =>
      p.toUpperCase(),
    )
    expectTypeOf(prefsMapResult).toEqualTypeOf<UserProfile | undefined>()

    // Array in optional nested property of optional object
    const bookmarksResult = fork(profile).user.optionalLists.bookmarks.push(
      'https://example.com',
    )
    expectTypeOf(bookmarksResult).toEqualTypeOf<UserProfile | undefined>()
  })

  it('should return undefined when accessing array elements in optional objects', () => {
    const prefResult = fork(profile).user.preferences[0]((pref) => {
      expectTypeOf(pref).toEqualTypeOf<string>()
      return pref.toUpperCase()
    })
    expectTypeOf(prefResult).toEqualTypeOf<UserProfile | undefined>()

    const bookmarkResult = fork(profile).user.optionalLists.bookmarks[0](
      (bookmark) => {
        expectTypeOf(bookmark).toEqualTypeOf<string>()
        return bookmark.toUpperCase()
      },
    )
    expectTypeOf(bookmarkResult).toEqualTypeOf<UserProfile | undefined>()
  })

  it('should return undefined when updating arrays in optional objects', () => {
    const prefsUpdate = fork(profile).user.preferences((prefs) => {
      expectTypeOf(prefs).toEqualTypeOf<Readonly<string[]>>()
      return [...prefs, 'new-preference']
    })
    expectTypeOf(prefsUpdate).toEqualTypeOf<UserProfile | undefined>()

    const groupsUpdate = fork(profile).groups.admin((admin) => {
      expectTypeOf(admin).toEqualTypeOf<Readonly<string[]>>()
      return [...admin, 'new-admin']
    })
    expectTypeOf(groupsUpdate).toEqualTypeOf<UserProfile | undefined>()

    const memberUpdate = fork(profile).groups.member((members) => {
      expectTypeOf(members).toEqualTypeOf<Readonly<string[]>>()
      return [...members, 'new-member']
    })
    expectTypeOf(memberUpdate).toEqualTypeOf<UserProfile | undefined>()
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

    const itemsPush = fork(deep).level1.level2.level3.items.push('new-item')
    expectTypeOf(itemsPush).toEqualTypeOf<DeepNested | undefined>()

    const optionalPush = fork(deep).level1.level2.level3.optionalItems.push(42)
    expectTypeOf(optionalPush).toEqualTypeOf<DeepNested | undefined>()

    const itemUpdate = fork(deep).level1.level2.level3.items[0]((item) => {
      expectTypeOf(item).toEqualTypeOf<string>()
      return item.toUpperCase()
    })
    expectTypeOf(itemUpdate).toEqualTypeOf<DeepNested | undefined>()
  })
})

describe('Map properties', () => {
  type Config = {
    settings: Map<string, string>
    optionalMappings?: Map<number, boolean>
  }
  const config: Config = {
    settings: new Map([['blah', 'dark']]),
  }

  it('should update Map value by key', () => {
    const result = fork(config).settings[key]('theme')((value) => {
      expectTypeOf(value).toEqualTypeOf<string>()
      return value.toUpperCase()
    })
    expectTypeOf(result).toEqualTypeOf<Config | undefined>()
  })

  it('should call Map methods and return root type', () => {
    const setResult = fork(config).settings.set('newKey', 'newValue')
    expectTypeOf(setResult).toEqualTypeOf<Config>()

    const deleteResult = fork(config).settings.delete('oldKey')
    expectTypeOf(deleteResult).toEqualTypeOf<Config>()
  })

  it('should update optional Map property', () => {
    const result = fork(config).optionalMappings((mappings) => {
      expectTypeOf(mappings).toEqualTypeOf<ReadonlyMap<number, boolean>>()
      return new Map([[1, true]])
    })
    expectTypeOf(result).toEqualTypeOf<Config | undefined>()
  })

  it('should return undefined when calling Map methods on optional Maps', () => {
    const setResult = fork(config).optionalMappings.set(1, true)
    expectTypeOf(setResult).toEqualTypeOf<Config | undefined>()

    const deleteResult = fork(config).optionalMappings.delete(1)
    expectTypeOf(deleteResult).toEqualTypeOf<Config | undefined>()

    const clearResult = fork(config).optionalMappings.clear()
    expectTypeOf(clearResult).toEqualTypeOf<Config | undefined>()
  })

  it('should return undefined when accessing optional Map values by key', () => {
    const result = fork(config).optionalMappings[key](1)((value) => {
      expectTypeOf(value).toEqualTypeOf<boolean>()
      return !value
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
    }
    api?: {
      endpoints: Map<string, string>
      headers?: Map<string, string>
    }
  }
  const serviceConfig: ServiceConfig = {}

  it('should return undefined when calling methods on Maps in optional objects', () => {
    // Map in required nested property of optional object
    const connectionsSet = fork(serviceConfig).database.connections.set(
      'primary',
      'localhost:5432',
    )
    expectTypeOf(connectionsSet).toEqualTypeOf<ServiceConfig | undefined>()

    const connectionsDelete =
      fork(serviceConfig).database.connections.delete('backup')
    expectTypeOf(connectionsDelete).toEqualTypeOf<ServiceConfig | undefined>()

    // Map in optional nested property of optional object
    const fallbacksSet = fork(
      serviceConfig,
    ).database.optionalCache.fallbacks.set('redis', true)
    expectTypeOf(fallbacksSet).toEqualTypeOf<ServiceConfig | undefined>()

    const fallbacksDelete =
      fork(serviceConfig).database.optionalCache.fallbacks.delete('memcached')
    expectTypeOf(fallbacksDelete).toEqualTypeOf<ServiceConfig | undefined>()
  })

  it('should return undefined when accessing Map values by key in optional objects', () => {
    const connectionResult = fork(serviceConfig).database.connections[key](
      'primary',
    )((conn) => {
      expectTypeOf(conn).toEqualTypeOf<string>()
      return conn.toUpperCase()
    })
    expectTypeOf(connectionResult).toEqualTypeOf<ServiceConfig | undefined>()

    const settingResult = fork(serviceConfig).database.optionalCache.settings[
      key
    ]('timeout')((timeout) => {
      expectTypeOf(timeout).toEqualTypeOf<number>()
      return timeout * 2
    })
    expectTypeOf(settingResult).toEqualTypeOf<ServiceConfig | undefined>()

    const fallbackResult = fork(serviceConfig).database.optionalCache.fallbacks[
      key
    ]('redis')((enabled) => {
      expectTypeOf(enabled).toEqualTypeOf<boolean>()
      return !enabled
    })
    expectTypeOf(fallbackResult).toEqualTypeOf<ServiceConfig | undefined>()
  })

  it('should return undefined when updating Maps in optional objects', () => {
    const connectionsUpdate = fork(serviceConfig).database.connections(
      (connections) => {
        expectTypeOf(connections).toEqualTypeOf<ReadonlyMap<string, string>>()
        return new Map([...connections, ['backup', 'localhost:5433']])
      },
    )
    expectTypeOf(connectionsUpdate).toEqualTypeOf<ServiceConfig | undefined>()

    const endpointsUpdate = fork(serviceConfig).api.endpoints((endpoints) => {
      expectTypeOf(endpoints).toEqualTypeOf<ReadonlyMap<string, string>>()
      return new Map([...endpoints, ['health', '/api/health']])
    })
    expectTypeOf(endpointsUpdate).toEqualTypeOf<ServiceConfig | undefined>()

    const headersUpdate = fork(serviceConfig).api.headers((headers) => {
      expectTypeOf(headers).toEqualTypeOf<ReadonlyMap<string, string>>()
      return new Map([...headers, ['Content-Type', 'application/json']])
    })
    expectTypeOf(headersUpdate).toEqualTypeOf<ServiceConfig | undefined>()
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

    const dataSet = fork(deepMap).level1.level2.level3.data.set('key1', 100)
    expectTypeOf(dataSet).toEqualTypeOf<DeepMapNested | undefined>()

    const optionalSet = fork(deepMap).level1.level2.level3.optionalData.set(
      1,
      'value1',
    )
    expectTypeOf(optionalSet).toEqualTypeOf<DeepMapNested | undefined>()

    const dataKeyUpdate = fork(deepMap).level1.level2.level3.data[key]('key1')(
      (value) => {
        expectTypeOf(value).toEqualTypeOf<number>()
        return value * 2
      },
    )
    expectTypeOf(dataKeyUpdate).toEqualTypeOf<DeepMapNested | undefined>()

    const optionalKeyUpdate = fork(deepMap).level1.level2.level3.optionalData[
      key
    ](1)((value) => {
      expectTypeOf(value).toEqualTypeOf<string>()
      return value.toUpperCase()
    })
    expectTypeOf(optionalKeyUpdate).toEqualTypeOf<DeepMapNested | undefined>()
  })

  it('should handle Maps with complex value types in optional contexts', () => {
    type ComplexMapConfig = {
      cache?: {
        userSessions: Map<string, { userId: number; expiry: Date }>
        optionalMetrics?: Map<string, { count: number; lastAccessed?: Date }>
      }
    }
    const complexConfig: ComplexMapConfig = {}

    const sessionSet = fork(complexConfig).cache.userSessions.set('session1', {
      userId: 123,
      expiry: new Date(),
    })
    expectTypeOf(sessionSet).toEqualTypeOf<ComplexMapConfig | undefined>()

    const sessionUpdate = fork(complexConfig).cache.userSessions[key](
      'session1',
    )((session) => {
      expectTypeOf(session).toEqualTypeOf<
        Readonly<{ userId: number; expiry: Date }>
      >()
      return { ...session, expiry: new Date(Date.now() + 3600000) }
    })
    expectTypeOf(sessionUpdate).toEqualTypeOf<ComplexMapConfig | undefined>()

    const metricsKeyUpdate = fork(complexConfig).cache.optionalMetrics[key](
      'page-views',
    )((metric) => {
      expectTypeOf(metric).toEqualTypeOf<
        Readonly<{ count: number; lastAccessed?: Date }>
      >()
      return { ...metric, count: metric.count + 1, lastAccessed: new Date() }
    })
    expectTypeOf(metricsKeyUpdate).toEqualTypeOf<ComplexMapConfig | undefined>()
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

  it('should call Set methods and return root type', () => {
    const addResult = fork(userGroups).groups.add('moderator')
    expectTypeOf(addResult).toEqualTypeOf<UserGroups>()

    const deleteResult = fork(userGroups).groups.delete('user')
    expectTypeOf(deleteResult).toEqualTypeOf<UserGroups>()

    const clearResult = fork(userGroups).groups.clear()
    expectTypeOf(clearResult).toEqualTypeOf<UserGroups>()
  })

  it('should update optional Set property', () => {
    const result = fork(userGroups).optionalTags((tags) => {
      expectTypeOf(tags).toEqualTypeOf<ReadonlySet<number>>()
      return new Set([1, 2, 3])
    })
    expectTypeOf(result).toEqualTypeOf<UserGroups | undefined>()
  })

  it('should return undefined when calling Set methods on optional Sets', () => {
    const addResult = fork(userGroups).optionalTags.add(42)
    expectTypeOf(addResult).toEqualTypeOf<UserGroups | undefined>()

    const deleteResult = fork(userGroups).optionalTags.delete(1)
    expectTypeOf(deleteResult).toEqualTypeOf<UserGroups | undefined>()

    const clearResult = fork(userGroups).optionalTags.clear()
    expectTypeOf(clearResult).toEqualTypeOf<UserGroups | undefined>()
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

  it('should return undefined when calling methods on Sets in optional objects', () => {
    // Set in required nested property of optional object
    const activeUsersAdd = fork(permissions).users.activeUsers.add('user123')
    expectTypeOf(activeUsersAdd).toEqualTypeOf<PermissionSystem | undefined>()

    const activeUsersDelete =
      fork(permissions).users.activeUsers.delete('user456')
    expectTypeOf(activeUsersDelete).toEqualTypeOf<
      PermissionSystem | undefined
    >()

    // Set in optional nested property of optional object
    const moderatorsAdd =
      fork(permissions).users.optionalGroups.moderators.add('mod123')
    expectTypeOf(moderatorsAdd).toEqualTypeOf<PermissionSystem | undefined>()

    const moderatorsDelete =
      fork(permissions).users.optionalGroups.moderators.delete('mod456')
    expectTypeOf(moderatorsDelete).toEqualTypeOf<PermissionSystem | undefined>()
  })

  it('should return undefined when updating Sets in optional objects', () => {
    const activeUsersUpdate = fork(permissions).users.activeUsers((users) => {
      expectTypeOf(users).toEqualTypeOf<ReadonlySet<string>>()
      return new Set([...users, 'newUser'])
    })
    expectTypeOf(activeUsersUpdate).toEqualTypeOf<
      PermissionSystem | undefined
    >()

    const adminsUpdate = fork(permissions).users.optionalGroups.admins(
      (admins) => {
        expectTypeOf(admins).toEqualTypeOf<ReadonlySet<string>>()
        return new Set([...admins, 'newAdmin'])
      },
    )
    expectTypeOf(adminsUpdate).toEqualTypeOf<PermissionSystem | undefined>()

    const publicUpdate = fork(permissions).resources.publicAccess((access) => {
      expectTypeOf(access).toEqualTypeOf<ReadonlySet<string>>()
      return new Set([...access, 'resource123'])
    })
    expectTypeOf(publicUpdate).toEqualTypeOf<PermissionSystem | undefined>()

    const restrictedUpdate = fork(permissions).resources.restrictedAccess(
      (restricted) => {
        expectTypeOf(restricted).toEqualTypeOf<ReadonlySet<string>>()
        return new Set([...restricted, 'secretResource'])
      },
    )
    expectTypeOf(restrictedUpdate).toEqualTypeOf<PermissionSystem | undefined>()
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

    const tagsAdd = fork(deepSet).level1.level2.level3.tags.add('important')
    expectTypeOf(tagsAdd).toEqualTypeOf<DeepSetNested | undefined>()

    const labelsAdd = fork(deepSet).level1.level2.level3.optionalLabels.add(999)
    expectTypeOf(labelsAdd).toEqualTypeOf<DeepSetNested | undefined>()

    const tagsDelete =
      fork(deepSet).level1.level2.level3.tags.delete('outdated')
    expectTypeOf(tagsDelete).toEqualTypeOf<DeepSetNested | undefined>()

    const labelsClear =
      fork(deepSet).level1.level2.level3.optionalLabels.clear()
    expectTypeOf(labelsClear).toEqualTypeOf<DeepSetNested | undefined>()

    const tagsUpdate = fork(deepSet).level1.level2.level3.tags((tags) => {
      expectTypeOf(tags).toEqualTypeOf<ReadonlySet<string>>()
      return new Set([...tags, 'newTag'])
    })
    expectTypeOf(tagsUpdate).toEqualTypeOf<DeepSetNested | undefined>()
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

    const categoriesAdd =
      fork(complexSet).categories.activeCategories.add('tech')
    expectTypeOf(categoriesAdd).toEqualTypeOf<ComplexSetConfig | undefined>()

    const prioritiesAdd =
      fork(complexSet).categories.optionalPriorities.add('high')
    expectTypeOf(prioritiesAdd).toEqualTypeOf<ComplexSetConfig | undefined>()

    const flagsUpdate = fork(complexSet).metadata.statusFlags((flags) => {
      expectTypeOf(flags).toEqualTypeOf<ReadonlySet<boolean>>()
      return new Set([...flags, true])
    })
    expectTypeOf(flagsUpdate).toEqualTypeOf<ComplexSetConfig | undefined>()

    const idsUpdate = fork(complexSet).metadata.optionalIds((ids) => {
      expectTypeOf(ids).toEqualTypeOf<ReadonlySet<string | number>>()
      return new Set([...ids, 'id123', 456])
    })
    expectTypeOf(idsUpdate).toEqualTypeOf<ComplexSetConfig | undefined>()
  })

  it('should handle Sets containing complex object types in optional contexts', () => {
    type ObjectSetConfig = {
      cache?: {
        userRoles: Set<{ userId: string; role: 'admin' | 'user' }>
        optionalSessions?: Set<{ sessionId: string; expiry?: Date }>
      }
    }
    const objectSet: ObjectSetConfig = {}

    const rolesAdd = fork(objectSet).cache.userRoles.add({
      userId: 'user123',
      role: 'admin',
    })
    expectTypeOf(rolesAdd).toEqualTypeOf<ObjectSetConfig | undefined>()

    const sessionsAdd = fork(objectSet).cache.optionalSessions.add({
      sessionId: 'session456',
      expiry: new Date(),
    })
    expectTypeOf(sessionsAdd).toEqualTypeOf<ObjectSetConfig | undefined>()

    const rolesUpdate = fork(objectSet).cache.userRoles((roles) => {
      expectTypeOf(roles).toEqualTypeOf<
        ReadonlySet<{ userId: string; role: 'admin' | 'user' }>
      >()
      return new Set([...roles, { userId: 'newUser', role: 'user' }])
    })
    expectTypeOf(rolesUpdate).toEqualTypeOf<ObjectSetConfig | undefined>()

    const sessionsUpdate = fork(objectSet).cache.optionalSessions(
      (sessions) => {
        expectTypeOf(sessions).toEqualTypeOf<
          ReadonlySet<{ sessionId: string; expiry?: Date }>
        >()
        return new Set([...sessions, { sessionId: 'newSession' }])
      },
    )
    expectTypeOf(sessionsUpdate).toEqualTypeOf<ObjectSetConfig | undefined>()
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
    expectTypeOf(fork(rootArray)[0])
      .parameter(0)
      .toMatchTypeOf<((value: string) => string) | string>()
    expectTypeOf(fork(rootArray)[0]((val) => val.toUpperCase())).toMatchTypeOf<
      string[]
    >()
    expectTypeOf(fork(rootArray).push('new')).toMatchTypeOf<string[]>()
    expectTypeOf(fork(rootArray).pop()).toMatchTypeOf<string[]>()
    expectTypeOf(fork(rootArray).map((x) => x.toUpperCase())).toMatchTypeOf<
      string[]
    >()
  })

  it('should work with Map as root object', () => {
    expectTypeOf(fork(rootMap)[key]('key1'))
      .parameter(0)
      .toMatchTypeOf<((value: string) => string) | string>()
    expectTypeOf(
      fork(rootMap)[key]('key1')((val) => val.toUpperCase()),
    ).toMatchTypeOf<Map<string, string> | undefined>()
    expectTypeOf(
      fork(rootMap)[key]('nonexistent')((val) => val.toUpperCase()),
    ).toMatchTypeOf<Map<string, string> | undefined>()
    expectTypeOf(fork(rootMap).set('newKey', 'newValue')).toMatchTypeOf<
      Map<string, string>
    >()
    expectTypeOf(fork(rootMap).delete('key1')).toMatchTypeOf<
      Map<string, string>
    >()
  })

  it('should work with Set as root object', () => {
    expectTypeOf(fork(rootSet).add('newItem')).toMatchTypeOf<Set<string>>()
    expectTypeOf(fork(rootSet).delete('item1')).toMatchTypeOf<Set<string>>()
    expectTypeOf(fork(rootSet).clear()).toMatchTypeOf<Set<string>>()
  })
})

describe('nullable root collection objects', () => {
  // Nullable Maps/Arrays/Sets as root objects
  const nullableArray: string[] | null = ['a', 'b']
  const nullableMap: Map<string, string> | null = new Map([['key', 'value']])
  const nullableSet: Set<string> | null = new Set(['item'])

  it('should work with nullable Array as root', () => {
    expectTypeOf(fork(nullableArray)[0])
      .parameter(0)
      .toMatchTypeOf<((value: string) => string) | string>()
    expectTypeOf(
      fork(nullableArray)[0]((val) => val.toUpperCase()),
    ).toMatchTypeOf<string[] | undefined>()
    expectTypeOf(fork(nullableArray).push('new')).toMatchTypeOf<
      string[] | undefined
    >()
    expectTypeOf(fork(nullableArray).pop()).toMatchTypeOf<
      string[] | undefined
    >()
    expectTypeOf(fork(nullableArray).map((x) => x.toUpperCase())).toMatchTypeOf<
      string[] | undefined
    >()
  })

  it('should work with nullable Map as root', () => {
    expectTypeOf(fork(nullableMap)[key]('key'))
      .parameter(0)
      .toMatchTypeOf<((value: string) => string) | string>()
    expectTypeOf(
      fork(nullableMap)[key]('key')((val) => val.toUpperCase()),
    ).toMatchTypeOf<Map<string, string> | undefined>()
    expectTypeOf(fork(nullableMap).set('newKey', 'value')).toMatchTypeOf<
      Map<string, string> | undefined
    >()
    expectTypeOf(fork(nullableMap).delete('key')).toMatchTypeOf<
      Map<string, string> | undefined
    >()
  })

  it('should work with nullable Set as root', () => {
    expectTypeOf(fork(nullableSet).add('newItem')).toMatchTypeOf<
      Set<string> | undefined
    >()
    expectTypeOf(fork(nullableSet).delete('item')).toMatchTypeOf<
      Set<string> | undefined
    >()
    expectTypeOf(fork(nullableSet).clear()).toMatchTypeOf<
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
    expectTypeOf(fork(undefinableArray)[0])
      .parameter(0)
      .toMatchTypeOf<((value: string) => string) | string>()
    expectTypeOf(
      fork(undefinableArray)[0]((val) => val.toUpperCase()),
    ).toMatchTypeOf<string[] | undefined>()
    expectTypeOf(fork(undefinableArray).push('new')).toMatchTypeOf<
      string[] | undefined
    >()
    expectTypeOf(fork(undefinableArray).pop()).toMatchTypeOf<
      string[] | undefined
    >()
    expectTypeOf(
      fork(undefinableArray).map((x) => x.toUpperCase()),
    ).toMatchTypeOf<string[] | undefined>()
  })

  it('should work with undefinable Map as root', () => {
    expectTypeOf(fork(undefinableMap)[key]('key'))
      .parameter(0)
      .toMatchTypeOf<((value: string) => string) | string>()
    expectTypeOf(
      fork(undefinableMap)[key]('key')((val) => val.toUpperCase()),
    ).toMatchTypeOf<Map<string, string> | undefined>()
    expectTypeOf(fork(undefinableMap).set('newKey', 'value')).toMatchTypeOf<
      Map<string, string> | undefined
    >()
    expectTypeOf(fork(undefinableMap).delete('key')).toMatchTypeOf<
      Map<string, string> | undefined
    >()
  })

  it('should work with undefinable Set as root', () => {
    expectTypeOf(fork(undefinableSet).add('newItem')).toMatchTypeOf<
      Set<string> | undefined
    >()
    expectTypeOf(fork(undefinableSet).delete('item')).toMatchTypeOf<
      Set<string> | undefined
    >()
    expectTypeOf(fork(undefinableSet).clear()).toMatchTypeOf<
      Set<string> | undefined
    >()
  })
})

describe('return type variations', () => {
  type Data = {
    value: string
    optional?: number
  }
  const data: Data = { value: 'test' }

  it('should allow updater to return same type', () => {
    const result = fork(data).value((v) => v.toUpperCase())
    expectTypeOf(result).toEqualTypeOf<Data>()
  })

  it('should allow updater to return different type', () => {
    const result = fork(data).value(() => '42')
    expectTypeOf(result).toEqualTypeOf<Data>()
  })

  it('should allow updater to return undefined for optional properties', () => {
    // that's how TS works 🤷‍♂️
    data.optional = undefined
    const result = fork(data).optional((_val) => undefined)
    expectTypeOf(result).toEqualTypeOf<Data | undefined>()
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
      expectTypeOf(fork(obj).config).toHaveProperty('set')

      expectTypeOf(fork(obj).items).not.toHaveProperty('key')
      expectTypeOf(fork(obj).items).toHaveProperty('push')

      expectTypeOf(fork(obj).groups).not.toHaveProperty('set')
      expectTypeOf(fork(obj).groups).toHaveProperty('add')
    })
  })

  describe('updater function parameter errors', () => {
    it('should error when updater expects wrong parameter type', () => {
      expectTypeOf(fork(obj).name)
        .parameter(0)
        .toMatchTypeOf<string | ((name: string) => string)>()
      expectTypeOf(fork(obj).name)
        .parameter(0)
        .not.toMatchTypeOf<(name: number) => string>()

      expectTypeOf(fork(obj).age)
        .parameter(0)
        .toMatchTypeOf<number | ((age: number) => number)>()
      expectTypeOf(fork(obj).age)
        .parameter(0)
        .not.toMatchTypeOf<(age: string) => number>()

      expectTypeOf(fork(obj).nested.optionalNested.data).toBeCallableWith(
        (data: readonly string[]) => data,
      )
      expectTypeOf(fork(obj).nested.optionalNested.data)
        .parameter(0)
        .not.toMatchTypeOf<(data: string[]) => string[]>()
    })

    it('should error when updater returns wrong type', () => {
      expectTypeOf(fork(obj).name).toBeCallableWith((name: string) =>
        name.toUpperCase(),
      )
      expectTypeOf(fork(obj).name)
        .parameter(0)
        .not.toMatchTypeOf<() => number>()

      expectTypeOf(fork(obj).age).toBeCallableWith((age: number) => age + 1)
      expectTypeOf(fork(obj).age).parameter(0).not.toMatchTypeOf<() => string>()

      expectTypeOf(fork(obj).nested.optionalNested.data).toBeCallableWith(
        (data: readonly string[]) => [...data, 'new'],
      )
      expectTypeOf(fork(obj).nested.optionalNested.data)
        .parameter(0)
        .not.toMatchTypeOf<() => number[]>()
    })
  })

  describe('method parameter errors', () => {
    it('should error when passing wrong types to array methods', () => {
      expectTypeOf(fork(obj).items.push).toBeCallableWith({
        id: 1,
        label: 'test',
      })
      expectTypeOf(fork(obj).items.push)
        .parameter(0)
        .not.toMatchTypeOf<string>()

      expectTypeOf(fork(obj).items.map).toBeCallableWith(
        (item: { id: number; label: string }) => ({
          ...item,
          label: item.label.toUpperCase(),
        }),
      )
      expectTypeOf(fork(obj).items.map)
        .parameter(0)
        .not.toMatchTypeOf<() => string>()

      // Should accept both T and DeepReadonly<T> return types
      expectTypeOf(fork(obj).items.map).toBeCallableWith(
        (item: { readonly id: number; readonly label: string }) => ({
          id: item.id + 1,
          label: item.label.toUpperCase(),
        }),
      )
      expectTypeOf(fork(obj).items.map).toBeCallableWith(
        (item: { readonly id: number; readonly label: string }) => item, // Return the readonly item directly
      )

      // Should accept readonly parameters for other array methods too
      expectTypeOf(fork(obj).items.filter).toBeCallableWith(
        (item: { readonly id: number; readonly label: string }) => item.id > 0,
      )

      // Should work with 3-levels-deep complex readonly objects
      type ThreeLevelItem = {
        readonly id: number
        readonly level1?: {
          readonly data: readonly string[]
          readonly level2?: {
            readonly theme: string
            readonly level3: {
              readonly value: number
            }
          }
        }
      }

      const deepArray: Array<{
        id: number
        level1?: {
          data: string[]
          level2?: {
            theme: string
            level3: {
              value: number
            }
          }
        }
      }> = []

      expectTypeOf(fork({ deepArray }).deepArray.map).toBeCallableWith(
        (item: ThreeLevelItem) => ({
          ...item,
          level1: item.level1
            ? {
                ...item.level1,
                data: [...item.level1.data, 'updated'],
              }
            : undefined,
        }),
      )
      expectTypeOf(fork({ deepArray }).deepArray.map).toBeCallableWith(
        (item) => item, // Return readonly item directly
      )

      // Should NOT allow returning different types (unlike native Array.map)
      expectTypeOf(fork({ deepArray }).deepArray.map)
        .parameter(0)
        .not.toMatchTypeOf<(item: ThreeLevelItem) => number>()

      // More explicit example: string array cannot be mapped to numbers
      expectTypeOf(fork(['a', 'b']).map)
        .parameter(0)
        .not.toMatchTypeOf<(item: string) => number>()

      expectTypeOf(fork({ deepArray }).deepArray.filter).toBeCallableWith(
        (item: ThreeLevelItem) => item.level1?.level2?.level3.value! > 10,
      )
    })

    // @ts-expect-error
    fork([2, 3, 4]).map((x) => '3')
    fork([2, 3, 4]).map((x) => 3)

    fork([{ a: 1, b: { c: 2 } }]).map((x) => x)
    fork([{ a: 1, b: { c: 2 } }]).map((x) => ({ a: 2, b: { c: 3 } }))

    it('should error when passing wrong types to Map methods', () => {
      expectTypeOf(fork(obj).config.set).toBeCallableWith('key', true)
      expectTypeOf(fork(obj).config.set)
        .parameter(0)
        .not.toMatchTypeOf<number>()
      expectTypeOf(fork(obj).config.set)
        .parameter(1)
        .not.toMatchTypeOf<string>()

      expectTypeOf(fork(obj).config[key]).toBeCallableWith('validKey')
      expectTypeOf(fork(obj).config[key])
        .parameter(0)
        .not.toMatchTypeOf<number>()
    })

    it('should error when passing wrong types to Set methods', () => {
      expectTypeOf(fork(obj).groups.add).toBeCallableWith('newGroup')
      expectTypeOf(fork(obj).groups.add)
        .parameter(0)
        .not.toMatchTypeOf<number>()

      expectTypeOf(fork(obj).groups.delete).toBeCallableWith('existingGroup')
      expectTypeOf(fork(obj).groups.delete)
        .parameter(0)
        .not.toMatchTypeOf<boolean>()
    })
  })

  describe('optional property access errors', () => {
    it('should error when assuming optional properties are required', () => {
      // Test that optional properties return Root | undefined, not just Root
      expectTypeOf(fork(obj).optional(() => 'test')).toEqualTypeOf<
        TestObj | undefined
      >()
      expectTypeOf(
        fork(obj).optional(() => 'test'),
      ).not.toEqualTypeOf<TestObj>()

      expectTypeOf(
        fork(obj).nested.optionalNested((nested) => nested),
      ).toEqualTypeOf<TestObj | undefined>()
      expectTypeOf(
        fork(obj).nested.optionalNested((nested) => nested),
      ).not.toEqualTypeOf<TestObj>()

      expectTypeOf(
        fork(obj).nested.optionalNested.data.push('item'),
      ).toEqualTypeOf<TestObj | undefined>()
      expectTypeOf(
        fork(obj).nested.optionalNested.data.push('item'),
      ).not.toEqualTypeOf<TestObj>()
    })
  })

  describe('readonly violations', () => {
    it('should error when trying to mutate readonly properties in updaters', () => {
      fork(obj).nested.optionalNested.data((data) => {
        expectTypeOf(data).toEqualTypeOf<readonly string[]>()
        expectTypeOf(data).not.toHaveProperty('push')
        expectTypeOf(data).toHaveProperty('length')
        return [...data, 'newItem'] // Correct way
      })

      fork(obj).config((config) => {
        expectTypeOf(config).toEqualTypeOf<ReadonlyMap<string, boolean>>()
        expectTypeOf(config).not.toHaveProperty('set')
        expectTypeOf(config).toHaveProperty('get')
        return new Map([...config, ['newKey', true]]) // Correct way
      })

      fork(obj).groups((groups) => {
        expectTypeOf(groups).toEqualTypeOf<ReadonlySet<string>>()
        expectTypeOf(groups).not.toHaveProperty('add')
        expectTypeOf(groups).toHaveProperty('has')
        return new Set([...groups, 'newGroup']) // Correct way
      })
    })

    it('should error when trying to assign to readonly properties', () => {
      fork(obj).items((items) => {
        expectTypeOf(items).toEqualTypeOf<
          readonly { readonly id: number; readonly label: string }[]
        >()
        expectTypeOf(items[0]).toEqualTypeOf<{
          readonly id: number
          readonly label: string
        }>()
        // Cannot mutate items[0].id directly - it's readonly
        return items.map((item) => ({ ...item, id: item.id + 1 })) // Correct way
      })

      fork(obj).nested((nested) => {
        expectTypeOf(nested).toEqualTypeOf<{
          readonly value: number
          readonly optionalNested?: {
            readonly data: readonly string[]
            readonly tags?: ReadonlySet<string>
          }
        }>()
        // Cannot mutate nested.value directly - it's readonly
        return { ...nested, value: 123 } // Correct way
      })
    })
  })

  describe('undefined handling errors', () => {
    it('should correctly handle undefined exclusion in optional contexts', () => {
      // Optional properties exclude undefined in updaters - val is never undefined
      fork(obj).optional((val) => {
        expectTypeOf(val).toEqualTypeOf<string>() // val is never undefined in the updater
        expectTypeOf(val).not.toEqualTypeOf<string | undefined>()
        return val.toUpperCase()
      })
    })

    it('should error when trying to pass undefined where not allowed', () => {
      expectTypeOf(fork(obj).name).toBeCallableWith((name: string) =>
        name.toUpperCase(),
      )
      expectTypeOf(fork(obj).name)
        .parameter(0)
        .not.toMatchTypeOf<() => undefined>()
      expectTypeOf(fork(obj).name).parameter(0).not.toMatchTypeOf<() => null>()
    })
  })
})
