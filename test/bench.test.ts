import { describe, it, afterAll } from 'vitest'
import { setIn, updateIn, mutateIn, shallowMutateIn } from '../bedit.mjs'
import { produce } from 'immer'
import { create } from 'mutative'
import { writeFileSync } from 'fs'
import { join } from 'path'

// Type declarations for Node.js globals
declare const global: any

const createArray = (size: number) => {
  return Array.from({ length: size }, (_, i) => ({
    id: i,
    name: `Item ${i}`,
    completed: i % 2 === 0,
    metadata: {
      createdAt: new Date(i * 1000),
      tags: [`tag${i}`, `tag${i + 1}`],
    },
  }))
}

// Results collection
const results: Record<string, any> = {}

const logResult = (testName: string, data: any) => {
  results[testName] = data
}

describe.skipIf(!global.gc)('Performance Benchmarks', () => {
  const iterations = 10000

  describe('Simple Property Updates', () => {
    const baseObj = {
      name: 'John',
      age: 30,
      active: true,
      profile: { theme: 'dark', notifications: true },
      tags: ['user', 'active'],
    }

    it('should benchmark simple property updates', () => {
      // bedit setIn
      const beditSetStart = performance.now()
      for (let i = 0; i < iterations; i++) {
        setIn(baseObj).name(`User${i}`)
      }
      const beditSetTime = performance.now() - beditSetStart

      // bedit updateIn
      const beditUpdateStart = performance.now()
      for (let i = 0; i < iterations; i++) {
        updateIn(baseObj).name(() => `User${i}`)
      }
      const beditUpdateTime = performance.now() - beditUpdateStart

      // bedit mutateIn (deep clone)
      const beditMutateStart = performance.now()
      for (let i = 0; i < iterations; i++) {
        mutateIn(baseObj).name(() => `User${i}`)
      }
      const beditMutateTime = performance.now() - beditMutateStart

      // bedit mutateIn (shallow clone) - updating object property
      const beditMutateShallowStart = performance.now()
      for (let i = 0; i < iterations; i++) {
        shallowMutateIn(baseObj).profile(() => ({
          theme: `theme${i}`,
          notifications: i % 2 === 0,
        }))
      }
      const beditMutateShallowTime = performance.now() - beditMutateShallowStart

      const immerStart = performance.now()
      for (let i = 0; i < iterations; i++) {
        produce(baseObj, (draft) => {
          draft.name = `User${i}`
        })
      }
      const immerTime = performance.now() - immerStart

      const mutativeStart = performance.now()
      for (let i = 0; i < iterations; i++) {
        create(baseObj, (draft) => {
          draft.name = `User${i}`
        })
      }
      const mutativeTime = performance.now() - mutativeStart

      const data = {
        beditSet: beditSetTime,
        beditUpdate: beditUpdateTime,
        beditMutate: beditMutateTime,
        beditMutateShallow: beditMutateShallowTime,
        immer: immerTime,
        mutative: mutativeTime,
        beditSetVsImmer: immerTime / beditSetTime,
        beditUpdateVsImmer: immerTime / beditUpdateTime,
        beditMutateVsImmer: immerTime / beditMutateTime,
        beditMutateShallowVsImmer: immerTime / beditMutateShallowTime,
        beditSetVsMutative: mutativeTime / beditSetTime,
        beditUpdateVsMutative: mutativeTime / beditUpdateTime,
        beditMutateVsMutative: mutativeTime / beditMutateTime,
        beditMutateShallowVsMutative: mutativeTime / beditMutateShallowTime,
      }
      logResult('Simple Property Updates', data)
    })
  })

  describe('Nested Property Updates', () => {
    const baseObj = {
      user: {
        profile: {
          name: 'John',
          settings: {
            theme: 'dark',
            notifications: true,
          },
        },
      },
    }

    it('should benchmark nested property updates', () => {
      // bedit setIn
      const beditSetStart = performance.now()
      for (let i = 0; i < iterations; i++) {
        setIn(baseObj).user.profile.settings.theme(`theme${i}`)
      }
      const beditSetTime = performance.now() - beditSetStart

      // bedit updateIn
      const beditUpdateStart = performance.now()
      for (let i = 0; i < iterations; i++) {
        updateIn(baseObj).user.profile.settings.theme(() => `theme${i}`)
      }
      const beditUpdateTime = performance.now() - beditUpdateStart

      // bedit mutateIn (deep clone)
      const beditMutateStart = performance.now()
      for (let i = 0; i < iterations; i++) {
        mutateIn(baseObj).user.profile.settings.theme(() => `theme${i}`)
      }
      const beditMutateTime = performance.now() - beditMutateStart

      // bedit mutateIn (shallow clone) - replacing entire settings object
      const beditMutateShallowStart = performance.now()
      for (let i = 0; i < iterations; i++) {
        shallowMutateIn(baseObj).user.profile.settings(() => ({
          theme: `theme${i}`,
          notifications: i % 2 === 0,
        }))
      }
      const beditMutateShallowTime = performance.now() - beditMutateShallowStart

      const immerStart = performance.now()
      for (let i = 0; i < iterations; i++) {
        produce(baseObj, (draft) => {
          draft.user.profile.settings.theme = `theme${i}`
        })
      }
      const immerTime = performance.now() - immerStart

      const mutativeStart = performance.now()
      for (let i = 0; i < iterations; i++) {
        create(baseObj, (draft) => {
          draft.user.profile.settings.theme = `theme${i}`
        })
      }
      const mutativeTime = performance.now() - mutativeStart

      const data = {
        beditSet: beditSetTime,
        beditUpdate: beditUpdateTime,
        beditMutate: beditMutateTime,
        beditMutateShallow: beditMutateShallowTime,
        immer: immerTime,
        mutative: mutativeTime,
        beditSetVsImmer: immerTime / beditSetTime,
        beditUpdateVsImmer: immerTime / beditUpdateTime,
        beditMutateVsImmer: immerTime / beditMutateTime,
        beditMutateShallowVsImmer: immerTime / beditMutateShallowTime,
        beditSetVsMutative: mutativeTime / beditSetTime,
        beditUpdateVsMutative: mutativeTime / beditUpdateTime,
        beditMutateVsMutative: mutativeTime / beditMutateTime,
        beditMutateShallowVsMutative: mutativeTime / beditMutateShallowTime,
      }
      logResult('Nested Property Updates', data)
    })
  })

  describe('Array Updates', () => {
    const baseObj = {
      todos: createArray(100),
    }

    it('should benchmark array element updates', () => {
      // bedit setIn
      const beditSetStart = performance.now()
      for (let i = 0; i < iterations; i++) {
        setIn(baseObj).todos[0].name(`Todo${i}`)
      }
      const beditSetTime = performance.now() - beditSetStart

      // bedit updateIn
      const beditUpdateStart = performance.now()
      for (let i = 0; i < iterations; i++) {
        updateIn(baseObj).todos[0].name(() => `Todo${i}`)
      }
      const beditUpdateTime = performance.now() - beditUpdateStart

      // bedit mutateIn (deep clone)
      const beditMutateStart = performance.now()
      for (let i = 0; i < iterations; i++) {
        mutateIn(baseObj).todos[0].name(() => `Todo${i}`)
      }
      const beditMutateTime = performance.now() - beditMutateStart

      // bedit mutateIn (shallow clone) - replacing entire todo object
      const beditMutateShallowStart = performance.now()
      for (let i = 0; i < iterations; i++) {
        shallowMutateIn(baseObj).todos[0](() => ({
          id: i,
          name: `Todo${i}`,
          completed: i % 2 === 0,
          metadata: {
            createdAt: new Date(i * 1000),
            tags: [`tag${i}`, `tag${i + 1}`],
          },
        }))
      }
      const beditMutateShallowTime = performance.now() - beditMutateShallowStart

      const immerStart = performance.now()
      for (let i = 0; i < iterations; i++) {
        produce(baseObj, (draft) => {
          draft.todos[0].name = `Todo${i}`
        })
      }
      const immerTime = performance.now() - immerStart

      const mutativeStart = performance.now()
      for (let i = 0; i < iterations; i++) {
        create(baseObj, (draft) => {
          draft.todos[0].name = `Todo${i}`
        })
      }
      const mutativeTime = performance.now() - mutativeStart

      const data = {
        beditSet: beditSetTime,
        beditUpdate: beditUpdateTime,
        beditMutate: beditMutateTime,
        beditMutateShallow: beditMutateShallowTime,
        immer: immerTime,
        mutative: mutativeTime,
        beditSetVsImmer: immerTime / beditSetTime,
        beditUpdateVsImmer: immerTime / beditUpdateTime,
        beditMutateVsImmer: immerTime / beditMutateTime,
        beditMutateShallowVsImmer: immerTime / beditMutateShallowTime,
        beditSetVsMutative: mutativeTime / beditSetTime,
        beditUpdateVsMutative: mutativeTime / beditUpdateTime,
        beditMutateVsMutative: mutativeTime / beditMutateTime,
        beditMutateShallowVsMutative: mutativeTime / beditMutateShallowTime,
      }
      logResult('Array Element Updates', data)
    })
  })

  describe('Deep Object Updates', () => {
    const baseObj = {
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
                                    p: {
                                      q: {
                                        r: {
                                          s: {
                                            t: {
                                              u: {
                                                v: {
                                                  w: {
                                                    x: {
                                                      y: {
                                                        z: 'value',
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

    it('should benchmark deep object updates', () => {
      // bedit setIn
      const beditSetStart = performance.now()
      for (let i = 0; i < iterations; i++) {
        setIn(baseObj).a.b.c.d.e.f.g.h.i.j.k.l.m.n.o.p.q.r.s.t.u.v.w.x.y.z(
          `value${i}`,
        )
      }
      const beditSetTime = performance.now() - beditSetStart

      // bedit updateIn
      const beditUpdateStart = performance.now()
      for (let i = 0; i < iterations; i++) {
        updateIn(baseObj).a.b.c.d.e.f.g.h.i.j.k.l.m.n.o.p.q.r.s.t.u.v.w.x.y.z(
          () => `value${i}`,
        )
      }
      const beditUpdateTime = performance.now() - beditUpdateStart

      // bedit mutateIn (deep clone)
      const beditMutateStart = performance.now()
      for (let i = 0; i < iterations; i++) {
        mutateIn(baseObj).a.b.c.d.e.f.g.h.i.j.k.l.m.n.o.p.q.r.s.t.u.v.w.x.y.z(
          () => `value${i}`,
        )
      }
      const beditMutateTime = performance.now() - beditMutateStart

      // bedit mutateIn (shallow clone) - replacing deep object
      const beditMutateShallowStart = performance.now()
      for (let i = 0; i < iterations; i++) {
        shallowMutateIn(
          baseObj,
        ).a.b.c.d.e.f.g.h.i.j.k.l.m.n.o.p.q.r.s.t.u.v.w.x.y(() => ({
          z: `value${i}`,
          metadata: { updated: i, timestamp: Date.now() },
        }))
      }
      const beditMutateShallowTime = performance.now() - beditMutateShallowStart

      const immerStart = performance.now()
      for (let i = 0; i < iterations; i++) {
        produce(baseObj, (draft) => {
          draft.a.b.c.d.e.f.g.h.i.j.k.l.m.n.o.p.q.r.s.t.u.v.w.x.y.z = `value${i}`
        })
      }
      const immerTime = performance.now() - immerStart

      const mutativeStart = performance.now()
      for (let i = 0; i < iterations; i++) {
        create(baseObj, (draft) => {
          draft.a.b.c.d.e.f.g.h.i.j.k.l.m.n.o.p.q.r.s.t.u.v.w.x.y.z = `value${i}`
        })
      }
      const mutativeTime = performance.now() - mutativeStart

      const data = {
        beditSet: beditSetTime,
        beditUpdate: beditUpdateTime,
        beditMutate: beditMutateTime,
        beditMutateShallow: beditMutateShallowTime,
        immer: immerTime,
        mutative: mutativeTime,
        beditSetVsImmer: immerTime / beditSetTime,
        beditUpdateVsImmer: immerTime / beditUpdateTime,
        beditMutateVsImmer: immerTime / beditMutateTime,
        beditMutateShallowVsImmer: immerTime / beditMutateShallowTime,
        beditSetVsMutative: mutativeTime / beditSetTime,
        beditUpdateVsMutative: mutativeTime / beditUpdateTime,
        beditMutateVsMutative: mutativeTime / beditMutateTime,
        beditMutateShallowVsMutative: mutativeTime / beditMutateShallowTime,
      }
      logResult('Deep Object Updates', data)
    })
  })

  describe('Function-based Updates', () => {
    const baseObj = {
      user: {
        profile: {
          name: 'John Doe',
          age: 30,
        },
      },
    }

    it('should benchmark function-based updates', () => {
      // bedit setIn (direct value)
      const beditSetStart = performance.now()
      for (let i = 0; i < iterations; i++) {
        setIn(baseObj).user.profile.name(`John Doe ${i}`)
      }
      const beditSetTime = performance.now() - beditSetStart

      // bedit updateIn (function-based)
      const beditUpdateStart = performance.now()
      for (let i = 0; i < iterations; i++) {
        updateIn(baseObj).user.profile.name((name) => `${name} ${i}`)
      }
      const beditUpdateTime = performance.now() - beditUpdateStart

      // bedit mutateIn (deep clone)
      const beditMutateStart = performance.now()
      for (let i = 0; i < iterations; i++) {
        mutateIn(baseObj).user.profile.name((name) => `${name} ${i}`)
      }
      const beditMutateTime = performance.now() - beditMutateStart

      // bedit mutateIn (shallow clone) - updating profile object
      const beditMutateShallowStart = performance.now()
      for (let i = 0; i < iterations; i++) {
        shallowMutateIn(baseObj).user.profile((profile) => ({
          ...profile,
          name: `${profile.name} ${i}`,
          age: profile.age + i,
        }))
      }
      const beditMutateShallowTime = performance.now() - beditMutateShallowStart

      const immerStart = performance.now()
      for (let i = 0; i < iterations; i++) {
        produce(baseObj, (draft) => {
          draft.user.profile.name = `${draft.user.profile.name} ${i}`
        })
      }
      const immerTime = performance.now() - immerStart

      const mutativeStart = performance.now()
      for (let i = 0; i < iterations; i++) {
        create(baseObj, (draft) => {
          draft.user.profile.name = `${draft.user.profile.name} ${i}`
        })
      }
      const mutativeTime = performance.now() - mutativeStart

      const data = {
        beditSet: beditSetTime,
        beditUpdate: beditUpdateTime,
        beditMutate: beditMutateTime,
        beditMutateShallow: beditMutateShallowTime,
        immer: immerTime,
        mutative: mutativeTime,
        beditSetVsImmer: immerTime / beditSetTime,
        beditUpdateVsImmer: immerTime / beditUpdateTime,
        beditMutateVsImmer: immerTime / beditMutateTime,
        beditMutateShallowVsImmer: immerTime / beditMutateShallowTime,
        beditSetVsMutative: mutativeTime / beditSetTime,
        beditUpdateVsMutative: mutativeTime / beditUpdateTime,
        beditMutateVsMutative: mutativeTime / beditMutateTime,
        beditMutateShallowVsMutative: mutativeTime / beditMutateShallowTime,
      }
      logResult('Function-based Updates', data)
    })
  })

  describe('Multiple Updates in Single Operation', () => {
    const baseObj = {
      user: {
        profile: {
          name: 'John',
          age: 30,
          settings: {
            theme: 'dark',
            notifications: true,
          },
        },
        preferences: {
          language: 'en',
          timezone: 'UTC',
        },
      },
      todos: createArray(10),
    }

    it('should benchmark multiple updates in single operation', () => {
      // bedit setIn (multiple separate operations)
      const beditSetStart = performance.now()
      for (let i = 0; i < iterations; i++) {
        setIn(baseObj).user.profile.name(`User${i}`)
        setIn(baseObj).user.profile.age(30 + i)
        setIn(baseObj).user.profile.settings.theme(`theme${i}`)
        setIn(baseObj).todos[0].name(`Todo${i}`)
      }
      const beditSetTime = performance.now() - beditSetStart

      // bedit updateIn (multiple separate operations)
      const beditUpdateStart = performance.now()
      for (let i = 0; i < iterations; i++) {
        updateIn(baseObj).user.profile.name(() => `User${i}`)
        updateIn(baseObj).user.profile.age(() => 30 + i)
        updateIn(baseObj).user.profile.settings.theme(() => `theme${i}`)
        updateIn(baseObj).todos[0].name(() => `Todo${i}`)
      }
      const beditUpdateTime = performance.now() - beditUpdateStart

      // bedit mutateIn (deep clone, multiple separate operations)
      const beditMutateStart = performance.now()
      for (let i = 0; i < iterations; i++) {
        mutateIn(baseObj).user.profile.name(() => `User${i}`)
        mutateIn(baseObj).user.profile.age(() => 30 + i)
        mutateIn(baseObj).user.profile.settings.theme(() => `theme${i}`)
        mutateIn(baseObj).todos[0].name(() => `Todo${i}`)
      }
      const beditMutateTime = performance.now() - beditMutateStart

      // bedit mutateIn (shallow clone, multiple separate operations)
      const beditMutateShallowStart = performance.now()
      for (let i = 0; i < iterations; i++) {
        shallowMutateIn(baseObj).user.profile(() => ({
          name: `User${i}`,
          age: 30 + i,
          settings: { theme: `theme${i}`, notifications: i % 2 === 0 },
        }))
        shallowMutateIn(baseObj).todos[0](() => ({
          id: i,
          name: `Todo${i}`,
          completed: i % 2 === 0,
          metadata: { createdAt: new Date(i * 1000), tags: [`tag${i}`] },
        }))
      }
      const beditMutateShallowTime = performance.now() - beditMutateShallowStart

      const immerStart = performance.now()
      for (let i = 0; i < iterations; i++) {
        produce(baseObj, (draft) => {
          draft.user.profile.name = `User${i}`
          draft.user.profile.age = 30 + i
          draft.user.profile.settings.theme = `theme${i}`
          draft.todos[0].name = `Todo${i}`
        })
      }
      const immerTime = performance.now() - immerStart

      const mutativeStart = performance.now()
      for (let i = 0; i < iterations; i++) {
        create(baseObj, (draft) => {
          draft.user.profile.name = `User${i}`
          draft.user.profile.age = 30 + i
          draft.user.profile.settings.theme = `theme${i}`
          draft.todos[0].name = `Todo${i}`
        })
      }
      const mutativeTime = performance.now() - mutativeStart

      const data = {
        beditSet: beditSetTime,
        beditUpdate: beditUpdateTime,
        beditMutate: beditMutateTime,
        beditMutateShallow: beditMutateShallowTime,
        immer: immerTime,
        mutative: mutativeTime,
        beditSetVsImmer: immerTime / beditSetTime,
        beditUpdateVsImmer: immerTime / beditUpdateTime,
        beditMutateVsImmer: immerTime / beditMutateTime,
        beditMutateShallowVsImmer: immerTime / beditMutateShallowTime,
        beditSetVsMutative: mutativeTime / beditSetTime,
        beditUpdateVsMutative: mutativeTime / beditUpdateTime,
        beditMutateVsMutative: mutativeTime / beditMutateTime,
        beditMutateShallowVsMutative: mutativeTime / beditMutateShallowTime,
      }
      logResult('Multiple Updates in Single Operation', data)
    })
  })

  describe('Shallow Mutations (Objects and Arrays)', () => {
    const baseObj = {
      user: {
        profile: {
          name: 'John',
          settings: {
            theme: 'dark',
            notifications: true,
          },
        },
        preferences: {
          language: 'en',
          timezone: 'UTC',
        },
      },
      todos: createArray(50),
      metadata: {
        lastUpdated: new Date(),
        version: '1.0.0',
      },
    }

    it('should benchmark shallow mutations on objects and arrays', () => {
      // bedit shallowMutateIn - updating object properties
      const beditShallowObjectStart = performance.now()
      for (let i = 0; i < iterations; i++) {
        shallowMutateIn(baseObj).user.profile.settings(() => ({
          theme: `theme${i}`,
          notifications: i % 2 === 0,
        }))
      }
      const beditShallowObjectTime = performance.now() - beditShallowObjectStart

      // bedit shallowMutateIn - updating array elements
      const beditShallowArrayStart = performance.now()
      for (let i = 0; i < iterations; i++) {
        shallowMutateIn(baseObj).todos[0](() => ({
          id: i,
          name: `Todo ${i}`,
          completed: i % 2 === 0,
          metadata: {
            createdAt: new Date(i * 1000),
            tags: [`tag${i}`, `tag${i + 1}`],
          },
        }))
      }
      const beditShallowArrayTime = performance.now() - beditShallowArrayStart

      // bedit shallowMutateIn - replacing entire objects
      const beditShallowReplaceStart = performance.now()
      for (let i = 0; i < iterations; i++) {
        shallowMutateIn(baseObj).user(() => ({
          profile: {
            name: `User${i}`,
            settings: {
              theme: `theme${i}`,
              notifications: i % 2 === 0,
            },
          },
          preferences: {
            language: 'en',
            timezone: 'UTC',
          },
        }))
      }
      const beditShallowReplaceTime =
        performance.now() - beditShallowReplaceStart

      // bedit mutateIn (deep clone) - for comparison
      const beditDeepObjectStart = performance.now()
      for (let i = 0; i < iterations; i++) {
        mutateIn(baseObj).user.profile.settings(() => ({
          theme: `theme${i}`,
          notifications: i % 2 === 0,
        }))
      }
      const beditDeepObjectTime = performance.now() - beditDeepObjectStart

      const beditDeepArrayStart = performance.now()
      for (let i = 0; i < iterations; i++) {
        mutateIn(baseObj).todos[0](() => ({
          id: i,
          name: `Todo ${i}`,
          completed: i % 2 === 0,
          metadata: {
            createdAt: new Date(i * 1000),
            tags: [`tag${i}`, `tag${i + 1}`],
          },
        }))
      }
      const beditDeepArrayTime = performance.now() - beditDeepArrayStart

      const immerStart = performance.now()
      for (let i = 0; i < iterations; i++) {
        produce(baseObj, (draft) => {
          draft.user.profile.settings = {
            theme: `theme${i}`,
            notifications: i % 2 === 0,
          }
        })
      }
      const immerTime = performance.now() - immerStart

      const mutativeStart = performance.now()
      for (let i = 0; i < iterations; i++) {
        create(baseObj, (draft) => {
          draft.user.profile.settings = {
            theme: `theme${i}`,
            notifications: i % 2 === 0,
          }
        })
      }
      const mutativeTime = performance.now() - mutativeStart

      const data = {
        beditShallowObject: beditShallowObjectTime,
        beditShallowArray: beditShallowArrayTime,
        beditShallowReplace: beditShallowReplaceTime,
        beditDeepObject: beditDeepObjectTime,
        beditDeepArray: beditDeepArrayTime,
        immer: immerTime,
        mutative: mutativeTime,
        shallowVsDeepObject: beditDeepObjectTime / beditShallowObjectTime,
        shallowVsDeepArray: beditDeepArrayTime / beditShallowArrayTime,
        shallowVsImmer: immerTime / beditShallowObjectTime,
        shallowVsMutative: mutativeTime / beditShallowObjectTime,
      }
      logResult('Shallow Mutations (Objects and Arrays)', data)
    })
  })

  describe('Memory Usage', () => {
    const baseObj = {
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
                                    p: {
                                      q: {
                                        r: {
                                          s: {
                                            t: {
                                              u: {
                                                v: {
                                                  w: {
                                                    x: {
                                                      y: {
                                                        z: 'value',
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

    it('should measure memory usage', () => {
      const gc = () => {
        if (global.gc) {
          console.log('GC')
          global.gc()
        }
      }

      // Warm up
      for (let i = 0; i < 100; i++) {
        setIn(baseObj).a.b.c.d.e.f.g.h.i.j.k.l.m.n.o.p.q.r.s.t.u.v.w.x.y.z(
          `warmup${i}`,
        )
      }
      gc()

      // bedit setIn memory
      const beditSetMemoryStart = process.memoryUsage().heapUsed
      for (let i = 0; i < iterations; i++) {
        setIn(baseObj).a.b.c.d.e.f.g.h.i.j.k.l.m.n.o.p.q.r.s.t.u.v.w.x.y.z(
          `value${i}`,
        )
      }
      const beditSetMemoryEnd = process.memoryUsage().heapUsed
      const beditSetMemory = beditSetMemoryEnd - beditSetMemoryStart

      gc()

      // bedit updateIn memory
      const beditUpdateMemoryStart = process.memoryUsage().heapUsed
      for (let i = 0; i < iterations; i++) {
        updateIn(baseObj).a.b.c.d.e.f.g.h.i.j.k.l.m.n.o.p.q.r.s.t.u.v.w.x.y.z(
          () => `value${i}`,
        )
      }
      const beditUpdateMemoryEnd = process.memoryUsage().heapUsed
      const beditUpdateMemory = beditUpdateMemoryEnd - beditUpdateMemoryStart

      gc()

      // bedit mutateIn (deep) memory
      const beditMutateMemoryStart = process.memoryUsage().heapUsed
      for (let i = 0; i < iterations; i++) {
        mutateIn(baseObj).a.b.c.d.e.f.g.h.i.j.k.l.m.n.o.p.q.r.s.t.u.v.w.x.y.z(
          () => `value${i}`,
        )
      }
      const beditMutateMemoryEnd = process.memoryUsage().heapUsed
      const beditMutateMemory = beditMutateMemoryEnd - beditMutateMemoryStart

      gc()

      // bedit mutateIn (shallow) memory
      const beditMutateShallowMemoryStart = process.memoryUsage().heapUsed
      for (let i = 0; i < iterations; i++) {
        shallowMutateIn(
          baseObj,
        ).a.b.c.d.e.f.g.h.i.j.k.l.m.n.o.p.q.r.s.t.u.v.w.x.y(() => ({
          z: `value${i}`,
          metadata: { updated: i, timestamp: Date.now() },
        }))
      }
      const beditMutateShallowMemoryEnd = process.memoryUsage().heapUsed
      const beditMutateShallowMemory =
        beditMutateShallowMemoryEnd - beditMutateShallowMemoryStart

      gc()

      const immerMemoryStart = process.memoryUsage().heapUsed
      for (let i = 0; i < iterations; i++) {
        produce(baseObj, (draft) => {
          draft.a.b.c.d.e.f.g.h.i.j.k.l.m.n.o.p.q.r.s.t.u.v.w.x.y.z = `value${i}`
        })
      }
      const immerMemoryEnd = process.memoryUsage().heapUsed
      const immerMemory = immerMemoryEnd - immerMemoryStart

      gc()

      const mutativeMemoryStart = process.memoryUsage().heapUsed
      for (let i = 0; i < iterations; i++) {
        create(baseObj, (draft) => {
          draft.a.b.c.d.e.f.g.h.i.j.k.l.m.n.o.p.q.r.s.t.u.v.w.x.y.z = `value${i}`
        })
      }
      const mutativeMemoryEnd = process.memoryUsage().heapUsed
      const mutativeMemory = mutativeMemoryEnd - mutativeMemoryStart

      const data = {
        beditSet: beditSetMemory / 1024 / 1024,
        beditUpdate: beditUpdateMemory / 1024 / 1024,
        beditMutate: beditMutateMemory / 1024 / 1024,
        beditMutateShallow: beditMutateShallowMemory / 1024 / 1024,
        immer: immerMemory / 1024 / 1024,
        mutative: mutativeMemory / 1024 / 1024,
        beditSetVsImmer: immerMemory / beditSetMemory,
        beditUpdateVsImmer: immerMemory / beditUpdateMemory,
        beditMutateVsImmer: immerMemory / beditMutateMemory,
        beditMutateShallowVsImmer: immerMemory / beditMutateShallowMemory,
        beditSetVsMutative: mutativeMemory / beditSetMemory,
        beditUpdateVsMutative: mutativeMemory / beditUpdateMemory,
        beditMutateVsMutative: mutativeMemory / beditMutateMemory,
        beditMutateShallowVsMutative: mutativeMemory / beditMutateShallowMemory,
      }
      logResult('Memory Usage (MB)', data)
    })
  })

  // Write results to PERFORMANCE.md after all tests complete
  afterAll(() => {
    const filepath = join(process.cwd(), 'PERFORMANCE.md')

    const generateTable = (results: Record<string, any>) => {
      let table = ''
      for (const [testName, data] of Object.entries(results)) {
        if (testName === 'Memory Usage (MB)') {
          table += `### ${testName}\n\n`
          table += `- **bedit setIn**: ${data.beditSet.toFixed(2)}MB\n`
          table += `- **bedit updateIn**: ${data.beditUpdate.toFixed(2)}MB\n`
          table += `- **bedit mutateIn**: ${data.beditMutate.toFixed(2)}MB\n`
          table += `- **bedit mutateIn (shallow)**: ${data.beditMutateShallow.toFixed(2)}MB\n`
          table += `- **immer**: ${data.immer.toFixed(2)}MB\n`
          table += `- **mutative**: ${data.mutative.toFixed(2)}MB\n\n`
          table += `**Performance vs Immer:**\n`
          table += `- bedit setIn: ${data.beditSetVsImmer.toFixed(2)}x ${data.beditSetVsImmer > 1 ? 'more' : 'less'} memory\n`
          table += `- bedit updateIn: ${data.beditUpdateVsImmer.toFixed(2)}x ${data.beditUpdateVsImmer > 1 ? 'more' : 'less'} memory\n`
          table += `- bedit mutateIn: ${data.beditMutateVsImmer.toFixed(2)}x ${data.beditMutateVsImmer > 1 ? 'more' : 'less'} memory\n`
          table += `- bedit mutateIn (shallow): ${data.beditMutateShallowVsImmer.toFixed(2)}x ${data.beditMutateShallowVsImmer > 1 ? 'more' : 'less'} memory\n\n`
          table += `**Performance vs Mutative:**\n`
          table += `- bedit setIn: ${data.beditSetVsMutative.toFixed(2)}x ${data.beditSetVsMutative > 1 ? 'more' : 'less'} memory\n`
          table += `- bedit updateIn: ${data.beditUpdateVsMutative.toFixed(2)}x ${data.beditUpdateVsMutative > 1 ? 'more' : 'less'} memory\n`
          table += `- bedit mutateIn: ${data.beditMutateVsMutative.toFixed(2)}x ${data.beditMutateVsMutative > 1 ? 'more' : 'less'} memory\n`
          table += `- bedit mutateIn (shallow): ${data.beditMutateShallowVsMutative.toFixed(2)}x ${data.beditMutateShallowVsMutative > 1 ? 'more' : 'less'} memory\n\n`
        } else {
          table += `### ${testName}\n\n`
          table += `- **bedit setIn**: ${data.beditSet.toFixed(2)}ms\n`
          table += `- **bedit updateIn**: ${data.beditUpdate.toFixed(2)}ms\n`
          table += `- **bedit mutateIn**: ${data.beditMutate.toFixed(2)}ms\n`
          table += `- **bedit mutateIn (shallow)**: ${data.beditMutateShallow.toFixed(2)}ms\n`
          table += `- **immer**: ${data.immer.toFixed(2)}ms\n`
          table += `- **mutative**: ${data.mutative.toFixed(2)}ms\n\n`
          table += `**Performance vs Immer:**\n`
          table += `- bedit setIn: ${data.beditSetVsImmer.toFixed(2)}x ${data.beditSetVsImmer > 1 ? 'slower' : 'faster'}\n`
          table += `- bedit updateIn: ${data.beditUpdateVsImmer.toFixed(2)}x ${data.beditUpdateVsImmer > 1 ? 'slower' : 'faster'}\n`
          table += `- bedit mutateIn: ${data.beditMutateVsImmer.toFixed(2)}x ${data.beditMutateVsImmer > 1 ? 'slower' : 'faster'}\n`
          table += `- bedit mutateIn (shallow): ${data.beditMutateShallowVsImmer.toFixed(2)}x ${data.beditMutateShallowVsImmer > 1 ? 'slower' : 'faster'}\n\n`
          table += `**Performance vs Mutative:**\n`
          table += `- bedit setIn: ${data.beditSetVsMutative.toFixed(2)}x ${data.beditSetVsMutative > 1 ? 'slower' : 'faster'}\n`
          table += `- bedit updateIn: ${data.beditUpdateVsMutative.toFixed(2)}x ${data.beditUpdateVsMutative > 1 ? 'slower' : 'faster'}\n`
          table += `- bedit mutateIn: ${data.beditMutateVsMutative.toFixed(2)}x ${data.beditMutateVsMutative > 1 ? 'slower' : 'faster'}\n`
          table += `- bedit mutateIn (shallow): ${data.beditMutateShallowVsMutative.toFixed(2)}x ${data.beditMutateShallowVsMutative > 1 ? 'slower' : 'faster'}\n\n`
        }
      }
      return table
    }

    const content = `# Performance Comparison: bedit vs Immer vs Mutative

All benchmarks were run with ${iterations.toLocaleString()} iterations.

${generateTable(results)}

*Last updated: ${new Date().toISOString()}*
`

    writeFileSync(filepath, content)
    console.log('Performance results written to PERFORMANCE.md')
  })
})
