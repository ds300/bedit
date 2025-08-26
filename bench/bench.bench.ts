import { describe, bench, expect, afterEach } from 'vitest'
import { fork, key, patch } from '../src/patchfork.production.mts'
import {
  produce,
  enableMapSet,
} from '../node_modules/immer/dist/immer.production.mjs'
import { create } from 'mutative'

enableMapSet()

function warmup() {
  let max = 0
  for (let i = 0; i < 100000; i++) {
    max = Math.max(max, fork({ a: 1 }).a(Math.random()).a)
    max = Math.max(
      max,
      produce({ a: 1 }, (draft) => {
        draft.a = Math.random()
      }).a,
    )
    max = Math.max(
      max,
      create({ a: 1 }, (draft) => {
        draft.a = Math.random()
      }).a,
    )
  }
  console.log(max)
}
warmup()

describe('shallow object clone with 1 property', () => {
  const data = {
    a: 1,
  }

  let result = data

  afterEach(() => {
    expect(result.a).not.toBe(1)
    expect(data.a).toBe(1)
  })

  bench('patchfork – setIn', () => {
    result = fork(data).a(Math.random())
  })

  bench('patchfork - edit.batch', () => {
    result = fork.do(data)((draft) => {
      draft.a = Math.random()
    })
  })

  bench('immer', () => {
    result = produce(data, (draft) => {
      draft.a = Math.random()
    })
  })

  bench('mutative', () => {
    result = create(data, (draft) => {
      draft.a = Math.random()
    })
  })
})

describe('shallow object clone with 10 properties', () => {
  const data = {
    a: 1,
    b: 2,
    c: 3,
    d: 4,
    e: 5,
    f: 6,
    g: 7,
    h: 8,
    i: 9,
    j: 10,
  }

  let result = data

  afterEach(() => {
    expect(result.a).not.toBe(1)
    expect(data.a).toBe(1)
  })

  bench('patchfork – setIn', () => {
    result = fork(data).a(Math.random())
  })

  bench('patchfork - edit.batch', () => {
    result = fork.do(data)((draft) => {
      draft.a = Math.random()
    })
  })

  bench('immer', () => {
    result = produce(data, (draft) => {
      draft.a = Math.random()
    })
  })

  bench('mutative', () => {
    result = create(data, (draft) => {
      draft.a = Math.random()
    })
  })
})

describe('shallow array clone with 10 items', () => {
  const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

  let result = data

  afterEach(() => {
    expect(result[4]).not.toBe(5)
    expect(data[4]).toBe(5)
  })

  bench('patchfork – setIn', () => {
    result = fork(data)[4](Math.random())
  })

  bench('patchfork - edit.batch', () => {
    result = fork.do(data)((draft) => {
      draft[4] = Math.random()
    })
  })

  bench('immer', () => {
    result = produce(data, (draft) => {
      draft[4] = Math.random()
    })
  })

  bench('mutative', () => {
    result = create(data, (draft) => {
      draft[4] = Math.random()
    })
  })
})

describe('shallow array clone with 10_000 items', () => {
  const data = Array.from({ length: 10_000 }, (_, i) => i)

  let result = data

  afterEach(() => {
    expect(result[4]).not.toBe(4)
    expect(data[4]).toBe(4)
  })

  bench('patchfork – setIn', () => {
    result = fork(data)[4](Math.random())
  })

  bench('patchfork - edit.batch', () => {
    result = fork.do(data)((draft) => {
      draft[4] = Math.random()
    })
  })

  bench('immer', () => {
    result = produce(data, (draft) => {
      draft[4] = Math.random()
    })
  })

  bench('mutative', () => {
    result = create(data, (draft) => {
      draft[4] = Math.random()
    })
  })
})

describe('deep object clone', () => {
  const data = {
    a: {
      b: {
        c: {
          d: {
            e: {
              f: {
                g: {
                  h: {
                    i: {
                      j: {
                        k: {
                          l: {
                            m: {
                              n: {
                                o: {
                                  p: 1,
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  }

  let result = data

  afterEach(() => {
    expect(result.a.b.c.d.e.f.g.h.i.j.k.l.m.n.o.p).not.toBe(1)
    expect(data.a.b.c.d.e.f.g.h.i.j.k.l.m.n.o.p).toBe(1)
  })

  bench('patchfork – setIn', () => {
    result = fork(data).a.b.c.d.e.f.g.h.i.j.k.l.m.n.o.p(Math.random())
  })

  bench('patchfork - edit.batch', () => {
    result = fork.do(data).a.b.c.d.e.f.g.h.i.j.k.l.m.n.o((draft) => {
      draft.p = Math.random()
    })
  })

  bench('immer', () => {
    result = produce(data, (draft) => {
      draft.a.b.c.d.e.f.g.h.i.j.k.l.m.n.o.p = Math.random()
    })
  })

  bench('mutative', () => {
    result = create(data, (draft) => {
      draft.a.b.c.d.e.f.g.h.i.j.k.l.m.n.o.p = Math.random()
    })
  })
})

describe('marking a todo as completed', () => {
  const data = {
    user: {
      name: 'John Doe',
    },
    filter: 'all',
    todos: new Array(100)
      .fill(0)
      .map((_, i) => ({ id: i, title: `Todo ${i}`, completed: false })),
  }

  let result = data

  bench('patchfork – setIn', () => {
    result = fork(data).todos[0].completed(true)
  })

  bench('patchfork - edit.batch', () => {
    result = fork.do(data).todos[0]((draft) => {
      draft.completed = true
    })
  })

  bench('immer', () => {
    result = produce(data, (draft) => {
      draft.todos[0].completed = true
    })
  })

  bench('mutative', () => {
    result = create(data, (draft) => {
      draft.todos[0].completed = true
    })
  })

  afterEach(() => {
    expect(result.todos[0].completed).toBe(true)
    expect(data.todos[0].completed).toBe(false)
  })
})

describe('marking four todos as completed and changing the filter', () => {
  const data = {
    user: {
      name: 'John Doe',
    },
    filter: 'all',
    todos: new Array(100)
      .fill(0)
      .map((_, i) => ({ id: i, title: `Todo ${i}`, completed: false })),
  }

  let result = data

  afterEach(() => {
    expect(result.todos[0].completed).toBe(true)
    expect(data.todos[0].completed).toBe(false)
  })

  bench('patchfork – setIn', () => {
    result = fork.do(data, (data) => {
      patch(data).todos[0].completed(true)
      patch(data).todos[1].completed(true)
      patch(data).todos[2].completed(true)
      patch(data).todos[3].completed(true)
      patch(data).filter('completed')
    })
  })

  bench('patchfork - edit.batch', () => {
    result = fork.do(data, (data) => {
      patch.do(data).todos[0]((draft) => {
        draft.completed = true
      })
      patch.do(data).todos[1]((draft) => {
        draft.completed = true
      })
      patch.do(data).todos[2]((draft) => {
        draft.completed = true
      })
      patch.do(data).todos[3]((draft) => {
        draft.completed = true
      })

      data.filter = 'completed'
    })
  })

  bench('immer', () => {
    result = produce(data, (draft) => {
      draft.todos[0].completed = true
      draft.todos[1].completed = true
      draft.todos[2].completed = true
      draft.todos[3].completed = true
      draft.filter = 'completed'
    })
  })

  bench('mutative', () => {
    result = create(data, (draft) => {
      draft.todos[0].completed = true
      draft.todos[1].completed = true
      draft.todos[2].completed = true
      draft.todos[3].completed = true
      draft.filter = 'completed'
    })
  })
})

describe('shallow Map clone with 5 elements', () => {
  const data = new Map([
    ['a', 1],
    ['b', 2],
    ['c', 3],
    ['d', 4],
    ['e', 5],
  ])

  let result = data

  afterEach(() => {
    expect(result.get('a')).not.toBe(1)
    expect(data.get('a')).toBe(1)
  })

  bench('patchfork – setIn', () => {
    result = fork(data)[key]('a')(Math.random())
  })

  bench('patchfork - edit.batch', () => {
    result = fork.do(data)((draft) => {
      draft.set('a', Math.random())
    })
  })

  bench('immer', () => {
    result = produce(data, (draft) => {
      draft.set('a', Math.random())
    })
  })

  bench('mutative', () => {
    result = create(data, (draft) => {
      draft.set('a', Math.random())
    })
  })
})

describe('shallow Map clone with 10,000 elements', () => {
  const data = new Map(Array.from({ length: 10_000 }, (_, i) => [`key${i}`, i]))

  let result = data

  afterEach(() => {
    expect(result.get('key0')).not.toBe(0)
    expect(data.get('key0')).toBe(0)
  })

  bench('patchfork – setIn', () => {
    result = fork(data)[key]('key0')(Math.random())
  })

  bench('patchfork - edit.batch', () => {
    result = fork.do(data)((draft) => {
      draft.set('key0', Math.random())
    })
  })

  bench('immer', () => {
    result = produce(data, (draft) => {
      draft.set('key0', Math.random())
    })
  })

  bench('mutative', () => {
    result = create(data, (draft) => {
      draft.set('key0', Math.random())
    })
  })
})

describe('shallow Set clone with 5 elements', () => {
  const data = new Set(['a', 'b', 'c', 'd', 'e'])

  let result = data

  afterEach(() => {
    expect(result.has('a')).not.toBe(true)
    expect(data.has('a')).toBe(true)
  })

  bench('patchfork - edit.batch', () => {
    result = fork.do(data)((draft) => {
      draft.add('f')
    })
  })

  bench('immer', () => {
    result = produce(data, (draft) => {
      draft.add('f')
    })
  })

  bench('mutative', () => {
    result = create(data, (draft) => {
      draft.add('f')
    })
  })
})

describe('shallow Set clone with 10,000 elements', () => {
  const data = new Set(Array.from({ length: 10_000 }, (_, i) => `item${i}`))

  let result = data

  afterEach(() => {
    expect(result.has('newItem')).not.toBe(true)
    expect(data.has('newItem')).toBe(true)
  })

  bench('patchfork - edit.batch', () => {
    result = fork.do(data)((draft) => {
      draft.add('newItem')
    })
  })

  bench('immer', () => {
    result = produce(data, (draft) => {
      draft.add('newItem')
    })
  })

  bench('mutative', () => {
    result = create(data, (draft) => {
      draft.add('newItem')
    })
  })
})

describe('complex nested structure with Maps and Sets using mutate', () => {
  const data = {
    users: new Map([
      [
        'user1',
        {
          name: 'John',
          preferences: { theme: 'dark' },
          tags: new Set(['admin', 'moderator']),
          posts: [
            { id: 1, title: 'First Post', likes: new Set(['user2', 'user3']) },
            { id: 2, title: 'Second Post', likes: new Set(['user4']) },
          ],
        },
      ],
      [
        'user2',
        {
          name: 'Jane',
          preferences: { theme: 'light' },
          tags: new Set(['user']),
          posts: [{ id: 3, title: 'Jane Post', likes: new Set(['user1']) }],
        },
      ],
    ]),
    categories: new Map([
      [
        'tech',
        {
          name: 'Technology',
          subscribers: new Set(['user1', 'user2']),
          articles: [
            {
              id: 1,
              title: 'Tech Article',
              tags: new Set(['javascript', 'react']),
            },
          ],
        },
      ],
    ]),
    settings: {
      global: {
        features: new Set(['chat', 'notifications']),
        limits: new Map([
          ['posts_per_day', 10],
          ['max_followers', 1000],
        ]),
      },
    },
  }

  let result = data

  afterEach(() => {
    expect(result.users.get('user1')!.name).not.toBe('John Doe')
    expect(data.users.get('user1')!.name).toBe('John Doe')
    expect(result.users.get('user1')!.tags.has('vip')).not.toBe(true)
    expect(data.users.get('user1')!.tags.has('vip')).toBe(true)
    expect(result.users.get('user1')!.posts[0].likes.has('user5')).not.toBe(
      true,
    )
    expect(data.users.get('user1')!.posts[0].likes.has('user5')).toBe(true)
    expect(result.users.get('user2')!.preferences.theme).not.toBe('auto')
    expect(data.users.get('user2')!.preferences.theme).toBe('auto')
    expect(result.categories.get('tech')!.subscribers.has('user3')).not.toBe(
      true,
    )
  })

  bench('patchfork', () => {
    result = fork.do(data, (draft) => {
      // Update user1's name
      patch(draft).users[key]('user1').name('John Doe')
      // Add a new tag to user1
      patch
        .do(draft)
        .users[key]('user1')
        .tags((tags) => {
          tags.add('vip')
        })
      // Add a like to user1's first post
      patch
        .do(draft)
        .users[key]('user1')
        .posts[0].likes((likes) => {
          likes.add('user5')
        })
      // Update user2's theme preference
      patch(draft).users[key]('user2').preferences.theme('auto')
      // Add a new subscriber to tech category
      patch
        .do(draft)
        .categories[key]('tech')
        .subscribers((subs) => {
          subs.add('user3')
        })
      // Update global post limit
      patch(draft).settings.global.limits[key]('posts_per_day')(15)
      // Add a new global feature
      patch.do(draft).settings.global.features((features) => {
        features.add('analytics')
      })
    })
  })

  bench('immer', () => {
    result = produce(data, (draft) => {
      // Update user1's name
      draft.users.get('user1')!.name = 'John Doe'
      // Add a new tag to user1
      draft.users.get('user1')!.tags.add('vip')
      // Add a like to user1's first post
      draft.users.get('user1')!.posts[0].likes.add('user5')
      // Update user2's theme preference
      draft.users.get('user2')!.preferences.theme = 'auto'
      // Add a new subscriber to tech category
      draft.categories.get('tech')!.subscribers.add('user3')
      // Update global post limit
      draft.settings.global.limits.set('posts_per_day', 15)
      // Add a new global feature
      draft.settings.global.features.add('analytics')
    })
  })

  bench('mutative', () => {
    result = create(data, (draft) => {
      // Update user1's name
      draft.users.get('user1')!.name = 'John Doe'
      // Add a new tag to user1
      draft.users.get('user1')!.tags.add('vip')
      // Add a like to user1's first post
      draft.users.get('user1')!.posts[0].likes.add('user5')
      // Update user2's theme preference
      draft.users.get('user2')!.preferences.theme = 'auto'
      // Add a new subscriber to tech category
      draft.categories.get('tech')!.subscribers.add('user3')
      // Update global post limit
      draft.settings.global.limits.set('posts_per_day', 15)
      // Add a new global feature
      draft.settings.global.features.add('analytics')
    })
  })
})
