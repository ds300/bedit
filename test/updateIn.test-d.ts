import { expectTypeOf, describe, it } from 'vitest'
import { updateIn } from '../src/bedit.mjs'

describe('optional properties', () => {
  type Obj = {
    key?: string
    nullableKey?: string | null
    maybeUndefinedKey?: string | undefined
    maybeUndefinedNullableKey?: string | undefined | null
  }
  const obj: Obj = {}

  it('should return undefined if the property is optional', () => {
    const result = updateIn(obj).key((key) => key.toUpperCase())
    expectTypeOf(result).toEqualTypeOf<Obj | undefined>()
  })

  it('should not pass undefined into the updater if the property is optional but not nullable', () => {
    const result = updateIn(obj).key((key) => {
      expectTypeOf(key).toEqualTypeOf<string>()
      return key.toUpperCase()
    })
    expectTypeOf(result).toEqualTypeOf<Obj | undefined>()
  })

  it('should pass null into the updater if the property is nullable', () => {
    const result = updateIn(obj).nullableKey((key) => {
      expectTypeOf(key).toEqualTypeOf<string | null>()
      return key?.toUpperCase() ?? null
    })
    expectTypeOf(result).toEqualTypeOf<Obj | undefined>()
  })

  it('should pass null (but not undefined) into the updater if the property is nullable and undefined', () => {
    const result = updateIn(obj).maybeUndefinedNullableKey((key) => {
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
    const result = updateIn(obj).name((name) => {
      expectTypeOf(name).toEqualTypeOf<string>()
      return name.toUpperCase()
    })
    expectTypeOf(result).toEqualTypeOf<Obj>()
  })

  it('should accept updater for required number property', () => {
    const result = updateIn(obj).age((age) => {
      expectTypeOf(age).toEqualTypeOf<number>()
      return age + 1
    })
    expectTypeOf(result).toEqualTypeOf<Obj>()
  })

  it('should accept updater for required boolean property', () => {
    const result = updateIn(obj).isActive((active) => {
      expectTypeOf(active).toEqualTypeOf<boolean>()
      return !active
    })
    expectTypeOf(result).toEqualTypeOf<Obj>()
  })

  it('should pass null into the updater for nullable property', () => {
    const result = updateIn(obj).nullableValue((value) => {
      expectTypeOf(value).toEqualTypeOf<string | null>()
      return value?.toUpperCase() ?? null
    })
    expectTypeOf(result).toEqualTypeOf<Obj>()
  })

  it('should not pass undefined into the updater if the property is required and undefined-able', () => {
    const result = updateIn(obj).maybeUndefinedValue((value) => {
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
    const result = updateIn(user).profile.name((name) => {
      expectTypeOf(name).toEqualTypeOf<string>()
      return name.toUpperCase()
    })
    expectTypeOf(result).toEqualTypeOf<User>()
  })

  it('should update nested optional property', () => {
    const result = updateIn(user).profile.settings((settings) => {
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
    const result = updateIn(user).profile.settings.theme((theme) => {
      expectTypeOf(theme).toEqualTypeOf<'light' | 'dark'>()
      return theme === 'light' ? 'dark' : 'light'
    })
    expectTypeOf(result).toEqualTypeOf<User | undefined>()
  })

  it('should update optional nested object', () => {
    const result = updateIn(user).metadata((metadata) => {
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
    const result = updateIn(todoList).todos[0]((todo) => {
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
    const result = updateIn(todoList).todos[0].completed((completed) => {
      expectTypeOf(completed).toEqualTypeOf<boolean>()
      return !completed
    })
    expectTypeOf(result).toEqualTypeOf<TodoList>()
  })

  it('should call array methods and return root type', () => {
    const pushResult = updateIn(todoList).todos.push({
      id: 2,
      text: 'New todo',
      completed: false,
    })
    expectTypeOf(pushResult).toEqualTypeOf<TodoList>()

    const mapResult = updateIn(todoList).todos.map((todo) => ({
      ...todo,
      completed: true,
    }))
    expectTypeOf(mapResult).toEqualTypeOf<TodoList>()
  })

  it('should update optional array property', () => {
    const result = updateIn(todoList).tags((tags) => {
      expectTypeOf(tags).toEqualTypeOf<Readonly<string[]>>()
      return [...tags, 'urgent']
    })
    expectTypeOf(result).toEqualTypeOf<TodoList | undefined>()
  })

  it('should return undefined when calling array methods on optional arrays', () => {
    const pushResult = updateIn(todoList).tags.push('urgent')
    expectTypeOf(pushResult).toEqualTypeOf<TodoList | undefined>()

    const popResult = updateIn(todoList).tags.pop()
    expectTypeOf(popResult).toEqualTypeOf<TodoList | undefined>()

    const mapResult = updateIn(todoList).tags.map((tag) => tag.toUpperCase())
    expectTypeOf(mapResult).toEqualTypeOf<TodoList | undefined>()

    const filterResult = updateIn(todoList).tags.filter((tag) => tag.length > 3)
    expectTypeOf(filterResult).toEqualTypeOf<TodoList | undefined>()
  })

  it('should return undefined when accessing optional array elements', () => {
    const result = updateIn(todoList).tags[0]((tag) => {
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
    const prefsResult = updateIn(profile).user.preferences.push('dark-mode')
    expectTypeOf(prefsResult).toEqualTypeOf<UserProfile | undefined>()

    const prefsMapResult = updateIn(profile).user.preferences.map((p) =>
      p.toUpperCase(),
    )
    expectTypeOf(prefsMapResult).toEqualTypeOf<UserProfile | undefined>()

    // Array in optional nested property of optional object
    const bookmarksResult = updateIn(profile).user.optionalLists.bookmarks.push(
      'https://example.com',
    )
    expectTypeOf(bookmarksResult).toEqualTypeOf<UserProfile | undefined>()
  })

  it('should return undefined when accessing array elements in optional objects', () => {
    const prefResult = updateIn(profile).user.preferences[0]((pref) => {
      expectTypeOf(pref).toEqualTypeOf<string>()
      return pref.toUpperCase()
    })
    expectTypeOf(prefResult).toEqualTypeOf<UserProfile | undefined>()

    const bookmarkResult = updateIn(profile).user.optionalLists.bookmarks[0](
      (bookmark) => {
        expectTypeOf(bookmark).toEqualTypeOf<string>()
        return bookmark.toUpperCase()
      },
    )
    expectTypeOf(bookmarkResult).toEqualTypeOf<UserProfile | undefined>()
  })

  it('should return undefined when updating arrays in optional objects', () => {
    const prefsUpdate = updateIn(profile).user.preferences((prefs) => {
      expectTypeOf(prefs).toEqualTypeOf<Readonly<string[]>>()
      return [...prefs, 'new-preference']
    })
    expectTypeOf(prefsUpdate).toEqualTypeOf<UserProfile | undefined>()

    const groupsUpdate = updateIn(profile).groups.admin((admin) => {
      expectTypeOf(admin).toEqualTypeOf<Readonly<string[]>>()
      return [...admin, 'new-admin']
    })
    expectTypeOf(groupsUpdate).toEqualTypeOf<UserProfile | undefined>()

    const memberUpdate = updateIn(profile).groups.member((members) => {
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

    const itemsPush = updateIn(deep).level1.level2.level3.items.push('new-item')
    expectTypeOf(itemsPush).toEqualTypeOf<DeepNested | undefined>()

    const optionalPush =
      updateIn(deep).level1.level2.level3.optionalItems.push(42)
    expectTypeOf(optionalPush).toEqualTypeOf<DeepNested | undefined>()

    const itemUpdate = updateIn(deep).level1.level2.level3.items[0]((item) => {
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
    settings: new Map([['theme', 'dark']]),
  }

  it('should update Map value by key', () => {
    const result = updateIn(config).settings.key('theme')((value) => {
      expectTypeOf(value).toEqualTypeOf<string>()
      return value.toUpperCase()
    })
    expectTypeOf(result).toEqualTypeOf<Config | undefined>()
  })

  it('should call Map methods and return root type', () => {
    const setResult = updateIn(config).settings.set('newKey', 'newValue')
    expectTypeOf(setResult).toEqualTypeOf<Config>()

    const deleteResult = updateIn(config).settings.delete('oldKey')
    expectTypeOf(deleteResult).toEqualTypeOf<Config>()
  })

  it('should update optional Map property', () => {
    const result = updateIn(config).optionalMappings((mappings) => {
      expectTypeOf(mappings).toEqualTypeOf<ReadonlyMap<number, boolean>>()
      return new Map([[1, true]])
    })
    expectTypeOf(result).toEqualTypeOf<Config | undefined>()
  })

  it('should return undefined when calling Map methods on optional Maps', () => {
    const setResult = updateIn(config).optionalMappings.set(1, true)
    expectTypeOf(setResult).toEqualTypeOf<Config | undefined>()

    const deleteResult = updateIn(config).optionalMappings.delete(1)
    expectTypeOf(deleteResult).toEqualTypeOf<Config | undefined>()

    const clearResult = updateIn(config).optionalMappings.clear()
    expectTypeOf(clearResult).toEqualTypeOf<Config | undefined>()
  })

  it('should return undefined when accessing optional Map values by key', () => {
    const result = updateIn(config).optionalMappings.key(1)((value) => {
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
    const connectionsSet = updateIn(serviceConfig).database.connections.set(
      'primary',
      'localhost:5432',
    )
    expectTypeOf(connectionsSet).toEqualTypeOf<ServiceConfig | undefined>()

    const connectionsDelete =
      updateIn(serviceConfig).database.connections.delete('backup')
    expectTypeOf(connectionsDelete).toEqualTypeOf<ServiceConfig | undefined>()

    // Map in optional nested property of optional object
    const fallbacksSet = updateIn(
      serviceConfig,
    ).database.optionalCache.fallbacks.set('redis', true)
    expectTypeOf(fallbacksSet).toEqualTypeOf<ServiceConfig | undefined>()

    const fallbacksDelete =
      updateIn(serviceConfig).database.optionalCache.fallbacks.delete(
        'memcached',
      )
    expectTypeOf(fallbacksDelete).toEqualTypeOf<ServiceConfig | undefined>()
  })

  it('should return undefined when accessing Map values by key in optional objects', () => {
    const connectionResult = updateIn(serviceConfig).database.connections.key(
      'primary',
    )((conn) => {
      expectTypeOf(conn).toEqualTypeOf<string>()
      return conn.toUpperCase()
    })
    expectTypeOf(connectionResult).toEqualTypeOf<ServiceConfig | undefined>()

    const settingResult = updateIn(
      serviceConfig,
    ).database.optionalCache.settings.key('timeout')((timeout) => {
      expectTypeOf(timeout).toEqualTypeOf<number>()
      return timeout * 2
    })
    expectTypeOf(settingResult).toEqualTypeOf<ServiceConfig | undefined>()

    const fallbackResult = updateIn(
      serviceConfig,
    ).database.optionalCache.fallbacks.key('redis')((enabled) => {
      expectTypeOf(enabled).toEqualTypeOf<boolean>()
      return !enabled
    })
    expectTypeOf(fallbackResult).toEqualTypeOf<ServiceConfig | undefined>()
  })

  it('should return undefined when updating Maps in optional objects', () => {
    const connectionsUpdate = updateIn(serviceConfig).database.connections(
      (connections) => {
        expectTypeOf(connections).toEqualTypeOf<ReadonlyMap<string, string>>()
        return new Map([...connections, ['backup', 'localhost:5433']])
      },
    )
    expectTypeOf(connectionsUpdate).toEqualTypeOf<ServiceConfig | undefined>()

    const endpointsUpdate = updateIn(serviceConfig).api.endpoints(
      (endpoints) => {
        expectTypeOf(endpoints).toEqualTypeOf<ReadonlyMap<string, string>>()
        return new Map([...endpoints, ['health', '/api/health']])
      },
    )
    expectTypeOf(endpointsUpdate).toEqualTypeOf<ServiceConfig | undefined>()

    const headersUpdate = updateIn(serviceConfig).api.headers((headers) => {
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

    const dataSet = updateIn(deepMap).level1.level2.level3.data.set('key1', 100)
    expectTypeOf(dataSet).toEqualTypeOf<DeepMapNested | undefined>()

    const optionalSet = updateIn(deepMap).level1.level2.level3.optionalData.set(
      1,
      'value1',
    )
    expectTypeOf(optionalSet).toEqualTypeOf<DeepMapNested | undefined>()

    const dataKeyUpdate = updateIn(deepMap).level1.level2.level3.data.key(
      'key1',
    )((value) => {
      expectTypeOf(value).toEqualTypeOf<number>()
      return value * 2
    })
    expectTypeOf(dataKeyUpdate).toEqualTypeOf<DeepMapNested | undefined>()

    const optionalKeyUpdate = updateIn(
      deepMap,
    ).level1.level2.level3.optionalData.key(1)((value) => {
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

    const sessionSet = updateIn(complexConfig).cache.userSessions.set(
      'session1',
      {
        userId: 123,
        expiry: new Date(),
      },
    )
    expectTypeOf(sessionSet).toEqualTypeOf<ComplexMapConfig | undefined>()

    const sessionUpdate = updateIn(complexConfig).cache.userSessions.key(
      'session1',
    )((session) => {
      expectTypeOf(session).toEqualTypeOf<
        Readonly<{ userId: number; expiry: Date }>
      >()
      return { ...session, expiry: new Date(Date.now() + 3600000) }
    })
    expectTypeOf(sessionUpdate).toEqualTypeOf<ComplexMapConfig | undefined>()

    const metricsKeyUpdate = updateIn(complexConfig).cache.optionalMetrics.key(
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
    const addResult = updateIn(userGroups).groups.add('moderator')
    expectTypeOf(addResult).toEqualTypeOf<UserGroups>()

    const deleteResult = updateIn(userGroups).groups.delete('user')
    expectTypeOf(deleteResult).toEqualTypeOf<UserGroups>()

    const clearResult = updateIn(userGroups).groups.clear()
    expectTypeOf(clearResult).toEqualTypeOf<UserGroups>()
  })

  it('should update optional Set property', () => {
    const result = updateIn(userGroups).optionalTags((tags) => {
      expectTypeOf(tags).toEqualTypeOf<ReadonlySet<number>>()
      return new Set([1, 2, 3])
    })
    expectTypeOf(result).toEqualTypeOf<UserGroups | undefined>()
  })

  it('should return undefined when calling Set methods on optional Sets', () => {
    const addResult = updateIn(userGroups).optionalTags.add(42)
    expectTypeOf(addResult).toEqualTypeOf<UserGroups | undefined>()

    const deleteResult = updateIn(userGroups).optionalTags.delete(1)
    expectTypeOf(deleteResult).toEqualTypeOf<UserGroups | undefined>()

    const clearResult = updateIn(userGroups).optionalTags.clear()
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
    const activeUsersAdd =
      updateIn(permissions).users.activeUsers.add('user123')
    expectTypeOf(activeUsersAdd).toEqualTypeOf<PermissionSystem | undefined>()

    const activeUsersDelete =
      updateIn(permissions).users.activeUsers.delete('user456')
    expectTypeOf(activeUsersDelete).toEqualTypeOf<
      PermissionSystem | undefined
    >()

    // Set in optional nested property of optional object
    const moderatorsAdd =
      updateIn(permissions).users.optionalGroups.moderators.add('mod123')
    expectTypeOf(moderatorsAdd).toEqualTypeOf<PermissionSystem | undefined>()

    const moderatorsDelete =
      updateIn(permissions).users.optionalGroups.moderators.delete('mod456')
    expectTypeOf(moderatorsDelete).toEqualTypeOf<PermissionSystem | undefined>()
  })

  it('should return undefined when updating Sets in optional objects', () => {
    const activeUsersUpdate = updateIn(permissions).users.activeUsers(
      (users) => {
        expectTypeOf(users).toEqualTypeOf<ReadonlySet<string>>()
        return new Set([...users, 'newUser'])
      },
    )
    expectTypeOf(activeUsersUpdate).toEqualTypeOf<
      PermissionSystem | undefined
    >()

    const adminsUpdate = updateIn(permissions).users.optionalGroups.admins(
      (admins) => {
        expectTypeOf(admins).toEqualTypeOf<ReadonlySet<string>>()
        return new Set([...admins, 'newAdmin'])
      },
    )
    expectTypeOf(adminsUpdate).toEqualTypeOf<PermissionSystem | undefined>()

    const publicUpdate = updateIn(permissions).resources.publicAccess(
      (access) => {
        expectTypeOf(access).toEqualTypeOf<ReadonlySet<string>>()
        return new Set([...access, 'resource123'])
      },
    )
    expectTypeOf(publicUpdate).toEqualTypeOf<PermissionSystem | undefined>()

    const restrictedUpdate = updateIn(permissions).resources.restrictedAccess(
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

    const tagsAdd = updateIn(deepSet).level1.level2.level3.tags.add('important')
    expectTypeOf(tagsAdd).toEqualTypeOf<DeepSetNested | undefined>()

    const labelsAdd =
      updateIn(deepSet).level1.level2.level3.optionalLabels.add(999)
    expectTypeOf(labelsAdd).toEqualTypeOf<DeepSetNested | undefined>()

    const tagsDelete =
      updateIn(deepSet).level1.level2.level3.tags.delete('outdated')
    expectTypeOf(tagsDelete).toEqualTypeOf<DeepSetNested | undefined>()

    const labelsClear =
      updateIn(deepSet).level1.level2.level3.optionalLabels.clear()
    expectTypeOf(labelsClear).toEqualTypeOf<DeepSetNested | undefined>()

    const tagsUpdate = updateIn(deepSet).level1.level2.level3.tags((tags) => {
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
      updateIn(complexSet).categories.activeCategories.add('tech')
    expectTypeOf(categoriesAdd).toEqualTypeOf<ComplexSetConfig | undefined>()

    const prioritiesAdd =
      updateIn(complexSet).categories.optionalPriorities.add('high')
    expectTypeOf(prioritiesAdd).toEqualTypeOf<ComplexSetConfig | undefined>()

    const flagsUpdate = updateIn(complexSet).metadata.statusFlags((flags) => {
      expectTypeOf(flags).toEqualTypeOf<ReadonlySet<boolean>>()
      return new Set([...flags, true])
    })
    expectTypeOf(flagsUpdate).toEqualTypeOf<ComplexSetConfig | undefined>()

    const idsUpdate = updateIn(complexSet).metadata.optionalIds((ids) => {
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

    const rolesAdd = updateIn(objectSet).cache.userRoles.add({
      userId: 'user123',
      role: 'admin',
    })
    expectTypeOf(rolesAdd).toEqualTypeOf<ObjectSetConfig | undefined>()

    const sessionsAdd = updateIn(objectSet).cache.optionalSessions.add({
      sessionId: 'session456',
      expiry: new Date(),
    })
    expectTypeOf(sessionsAdd).toEqualTypeOf<ObjectSetConfig | undefined>()

    const rolesUpdate = updateIn(objectSet).cache.userRoles((roles) => {
      expectTypeOf(roles).toEqualTypeOf<
        ReadonlySet<{ userId: string; role: 'admin' | 'user' }>
      >()
      return new Set([...roles, { userId: 'newUser', role: 'user' }])
    })
    expectTypeOf(rolesUpdate).toEqualTypeOf<ObjectSetConfig | undefined>()

    const sessionsUpdate = updateIn(objectSet).cache.optionalSessions(
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

describe('return type variations', () => {
  type Data = {
    value: string
    optional?: number
  }
  const data: Data = { value: 'test' }

  it('should allow updater to return same type', () => {
    const result = updateIn(data).value((v) => v.toUpperCase())
    expectTypeOf(result).toEqualTypeOf<Data>()
  })

  it('should allow updater to return different type', () => {
    const result = updateIn(data).value(() => '42')
    expectTypeOf(result).toEqualTypeOf<Data>()
  })

  it('should allow updater to return undefined for optional properties', () => {
    // that's how TS works 🤷‍♂️
    data.optional = undefined
    const result = updateIn(data).optional(
      (_val) => undefined,
    )
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
      expectTypeOf(updateIn(obj)).not.toHaveProperty('nonExistent')
      expectTypeOf(updateIn(obj)).toHaveProperty('name')

      expectTypeOf(updateIn(obj).nested).not.toHaveProperty('wrongProperty')
      expectTypeOf(updateIn(obj).nested).toHaveProperty('value')
    })

    it('should error when using wrong method types on collections', () => {
      expectTypeOf(updateIn(obj).config).not.toHaveProperty('push')
      expectTypeOf(updateIn(obj).config).toHaveProperty('set')

      expectTypeOf(updateIn(obj).items).not.toHaveProperty('key')
      expectTypeOf(updateIn(obj).items).toHaveProperty('push')

      expectTypeOf(updateIn(obj).groups).not.toHaveProperty('set')
      expectTypeOf(updateIn(obj).groups).toHaveProperty('add')
    })
  })

  describe('updater function parameter errors', () => {
    it('should error when updater expects wrong parameter type', () => {
      expectTypeOf(updateIn(obj).name).toBeCallableWith((name: string) => name)
      expectTypeOf(updateIn(obj).name)
        .parameter(0)
        .not.toMatchTypeOf<(name: number) => string>()

      expectTypeOf(updateIn(obj).age).toBeCallableWith((age: number) => age)
      expectTypeOf(updateIn(obj).age)
        .parameter(0)
        .not.toMatchTypeOf<(age: string) => number>()

      expectTypeOf(updateIn(obj).nested.optionalNested.data).toBeCallableWith(
        (data: readonly string[]) => data,
      )
      expectTypeOf(updateIn(obj).nested.optionalNested.data)
        .parameter(0)
        .not.toMatchTypeOf<(data: string[]) => string[]>()
    })

    it('should error when updater returns wrong type', () => {
      expectTypeOf(updateIn(obj).name).toBeCallableWith((name: string) =>
        name.toUpperCase(),
      )
      expectTypeOf(updateIn(obj).name)
        .parameter(0)
        .not.toMatchTypeOf<() => number>()

      expectTypeOf(updateIn(obj).age).toBeCallableWith((age: number) => age + 1)
      expectTypeOf(updateIn(obj).age)
        .parameter(0)
        .not.toMatchTypeOf<() => string>()

      expectTypeOf(updateIn(obj).nested.optionalNested.data).toBeCallableWith(
        (data: readonly string[]) => [...data, 'new'],
      )
      expectTypeOf(updateIn(obj).nested.optionalNested.data)
        .parameter(0)
        .not.toMatchTypeOf<() => number[]>()
    })
  })

  describe('method parameter errors', () => {
    it('should error when passing wrong types to array methods', () => {
      expectTypeOf(updateIn(obj).items.push).toBeCallableWith({
        id: 1,
        label: 'test',
      })
      expectTypeOf(updateIn(obj).items.push)
        .parameter(0)
        .not.toMatchTypeOf<string>()

      expectTypeOf(updateIn(obj).items.map).toBeCallableWith(
        (item: { id: number; label: string }) => ({
          ...item,
          label: item.label.toUpperCase(),
        }),
      )
      expectTypeOf(updateIn(obj).items.map)
        .parameter(0)
        .not.toMatchTypeOf<() => string>()
    })

    it('should error when passing wrong types to Map methods', () => {
      expectTypeOf(updateIn(obj).config.set).toBeCallableWith('key', true)
      expectTypeOf(updateIn(obj).config.set)
        .parameter(0)
        .not.toMatchTypeOf<number>()
      expectTypeOf(updateIn(obj).config.set)
        .parameter(1)
        .not.toMatchTypeOf<string>()

      expectTypeOf(updateIn(obj).config.key).toBeCallableWith('validKey')
      expectTypeOf(updateIn(obj).config.key)
        .parameter(0)
        .not.toMatchTypeOf<number>()
    })

    it('should error when passing wrong types to Set methods', () => {
      expectTypeOf(updateIn(obj).groups.add).toBeCallableWith('newGroup')
      expectTypeOf(updateIn(obj).groups.add)
        .parameter(0)
        .not.toMatchTypeOf<number>()

      expectTypeOf(updateIn(obj).groups.delete).toBeCallableWith(
        'existingGroup',
      )
      expectTypeOf(updateIn(obj).groups.delete)
        .parameter(0)
        .not.toMatchTypeOf<boolean>()
    })
  })

  describe('optional property access errors', () => {
    it('should error when assuming optional properties are required', () => {
      // Test that optional properties return Root | undefined, not just Root
      expectTypeOf(updateIn(obj).optional(() => 'test')).toEqualTypeOf<
        TestObj | undefined
      >()
      expectTypeOf(
        updateIn(obj).optional(() => 'test'),
      ).not.toEqualTypeOf<TestObj>()

      expectTypeOf(
        updateIn(obj).nested.optionalNested((nested) => nested),
      ).toEqualTypeOf<TestObj | undefined>()
      expectTypeOf(
        updateIn(obj).nested.optionalNested((nested) => nested),
      ).not.toEqualTypeOf<TestObj>()

      expectTypeOf(
        updateIn(obj).nested.optionalNested.data.push('item'),
      ).toEqualTypeOf<TestObj | undefined>()
      expectTypeOf(
        updateIn(obj).nested.optionalNested.data.push('item'),
      ).not.toEqualTypeOf<TestObj>()
    })
  })

  describe('readonly violations', () => {
    it('should error when trying to mutate readonly properties in updaters', () => {
      updateIn(obj).nested.optionalNested.data((data) => {
        expectTypeOf(data).toEqualTypeOf<readonly string[]>()
        expectTypeOf(data).not.toHaveProperty('push')
        expectTypeOf(data).toHaveProperty('length')
        return [...data, 'newItem'] // Correct way
      })

      updateIn(obj).config((config) => {
        expectTypeOf(config).toEqualTypeOf<ReadonlyMap<string, boolean>>()
        expectTypeOf(config).not.toHaveProperty('set')
        expectTypeOf(config).toHaveProperty('get')
        return new Map([...config, ['newKey', true]]) // Correct way
      })

      updateIn(obj).groups((groups) => {
        expectTypeOf(groups).toEqualTypeOf<ReadonlySet<string>>()
        expectTypeOf(groups).not.toHaveProperty('add')
        expectTypeOf(groups).toHaveProperty('has')
        return new Set([...groups, 'newGroup']) // Correct way
      })
    })

    it('should error when trying to assign to readonly properties', () => {
      updateIn(obj).items((items) => {
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

      updateIn(obj).nested((nested) => {
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
      updateIn(obj).optional((val) => {
        expectTypeOf(val).toEqualTypeOf<string>() // val is never undefined in the updater
        expectTypeOf(val).not.toEqualTypeOf<string | undefined>()
        return val.toUpperCase()
      })
    })

    it('should error when trying to pass undefined where not allowed', () => {
      expectTypeOf(updateIn(obj).name).toBeCallableWith((name: string) =>
        name.toUpperCase(),
      )
      expectTypeOf(updateIn(obj).name)
        .parameter(0)
        .not.toMatchTypeOf<() => undefined>()
      expectTypeOf(updateIn(obj).name)
        .parameter(0)
        .not.toMatchTypeOf<() => null>()
    })
  })
})
