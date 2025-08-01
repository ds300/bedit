import { describe, it, expect } from 'vitest'
import { setIn, updateIn } from './index'
import { produce } from 'immer'
import { create } from 'mutative'

// Test data setup
const createDeepObject = (depth: number, width: number) => {
  const obj: any = {}
  const createNested = (current: any, currentDepth: number) => {
    if (currentDepth >= depth) {
      current.value = 'leaf'
      return
    }
    for (let i = 0; i < width; i++) {
      current[`key${i}`] = {}
      createNested(current[`key${i}`], currentDepth + 1)
    }
  }
  createNested(obj, 0)
  return obj
}

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

describe('Performance Benchmarks', () => {
  const iterations = 1000

  describe('Simple Property Updates', () => {
    const baseObj = { name: 'John', age: 30, active: true }

    it('should benchmark simple property updates', () => {
      const beditStart = performance.now()
      for (let i = 0; i < iterations; i++) {
        setIn(baseObj).name(`User${i}`)
      }
      const beditTime = performance.now() - beditStart

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

      console.log('\n=== Simple Property Updates ===')
      console.log(`bedit: ${beditTime.toFixed(2)}ms`)
      console.log(`immer: ${immerTime.toFixed(2)}ms`)
      console.log(`mutative: ${mutativeTime.toFixed(2)}ms`)
      console.log(`bedit vs immer: ${(immerTime / beditTime).toFixed(2)}x`)
      console.log(
        `bedit vs mutative: ${(mutativeTime / beditTime).toFixed(2)}x`,
      )
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
      const beditStart = performance.now()
      for (let i = 0; i < iterations; i++) {
        setIn(baseObj).user.profile.settings.theme(`theme${i}`)
      }
      const beditTime = performance.now() - beditStart

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

      console.log('\n=== Nested Property Updates ===')
      console.log(`bedit: ${beditTime.toFixed(2)}ms`)
      console.log(`immer: ${immerTime.toFixed(2)}ms`)
      console.log(`mutative: ${mutativeTime.toFixed(2)}ms`)
      console.log(`bedit vs immer: ${(immerTime / beditTime).toFixed(2)}x`)
      console.log(
        `bedit vs mutative: ${(mutativeTime / beditTime).toFixed(2)}x`,
      )
    })
  })

  describe('Array Updates', () => {
    const baseObj = {
      todos: createArray(100),
    }

    it('should benchmark array element updates', () => {
      const beditStart = performance.now()
      for (let i = 0; i < iterations; i++) {
        setIn(baseObj).todos[0].name(`Todo${i}`)
      }
      const beditTime = performance.now() - beditStart

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

      console.log('\n=== Array Element Updates ===')
      console.log(`bedit: ${beditTime.toFixed(2)}ms`)
      console.log(`immer: ${immerTime.toFixed(2)}ms`)
      console.log(`mutative: ${mutativeTime.toFixed(2)}ms`)
      console.log(`bedit vs immer: ${(immerTime / beditTime).toFixed(2)}x`)
      console.log(
        `bedit vs mutative: ${(mutativeTime / beditTime).toFixed(2)}x`,
      )
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
      const beditStart = performance.now()
      for (let i = 0; i < iterations; i++) {
        setIn(baseObj).a.b.c.d.e.f.g.h.i.j.k.l.m.n.o.p.q.r.s.t.u.v.w.x.y.z(
          `value${i}`,
        )
      }
      const beditTime = performance.now() - beditStart

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

      console.log('\n=== Deep Object Updates ===')
      console.log(`bedit: ${beditTime.toFixed(2)}ms`)
      console.log(`immer: ${immerTime.toFixed(2)}ms`)
      console.log(`mutative: ${mutativeTime.toFixed(2)}ms`)
      console.log(`bedit vs immer: ${(immerTime / beditTime).toFixed(2)}x`)
      console.log(
        `bedit vs mutative: ${(mutativeTime / beditTime).toFixed(2)}x`,
      )
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
      const beditStart = performance.now()
      for (let i = 0; i < iterations; i++) {
        updateIn(baseObj).user.profile.name((name) => `${name} ${i}`)
      }
      const beditTime = performance.now() - beditStart

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

      console.log('\n=== Function-based Updates ===')
      console.log(`bedit: ${beditTime.toFixed(2)}ms`)
      console.log(`immer: ${immerTime.toFixed(2)}ms`)
      console.log(`mutative: ${mutativeTime.toFixed(2)}ms`)
      console.log(`bedit vs immer: ${(immerTime / beditTime).toFixed(2)}x`)
      console.log(
        `bedit vs mutative: ${(mutativeTime / beditTime).toFixed(2)}x`,
      )
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
      const beditStart = performance.now()
      for (let i = 0; i < iterations; i++) {
        // Multiple separate operations since chaining isn't supported
        setIn(baseObj).user.profile.name(`User${i}`)
        setIn(baseObj).user.profile.age(30 + i)
        setIn(baseObj).user.profile.settings.theme(`theme${i}`)
        setIn(baseObj).todos[0].name(`Todo${i}`)
      }
      const beditTime = performance.now() - beditStart

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

      console.log('\n=== Multiple Updates in Single Operation ===')
      console.log(`bedit: ${beditTime.toFixed(2)}ms`)
      console.log(`immer: ${immerTime.toFixed(2)}ms`)
      console.log(`mutative: ${mutativeTime.toFixed(2)}ms`)
      console.log(`bedit vs immer: ${(immerTime / beditTime).toFixed(2)}x`)
      console.log(
        `bedit vs mutative: ${(mutativeTime / beditTime).toFixed(2)}x`,
      )
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

      const beditStart = performance.now()
      const beditMemoryStart = process.memoryUsage().heapUsed
      for (let i = 0; i < iterations; i++) {
        setIn(baseObj).a.b.c.d.e.f.g.h.i.j.k.l.m.n.o.p.q.r.s.t.u.v.w.x.y.z(
          `value${i}`,
        )
      }
      const beditMemoryEnd = process.memoryUsage().heapUsed
      const beditTime = performance.now() - beditStart
      const beditMemory = beditMemoryEnd - beditMemoryStart

      gc()

      const immerStart = performance.now()
      const immerMemoryStart = process.memoryUsage().heapUsed
      for (let i = 0; i < iterations; i++) {
        produce(baseObj, (draft) => {
          draft.a.b.c.d.e.f.g.h.i.j.k.l.m.n.o.p.q.r.s.t.u.v.w.x.y.z = `value${i}`
        })
      }
      const immerMemoryEnd = process.memoryUsage().heapUsed
      const immerTime = performance.now() - immerStart
      const immerMemory = immerMemoryEnd - immerMemoryStart

      gc()

      const mutativeStart = performance.now()
      const mutativeMemoryStart = process.memoryUsage().heapUsed
      for (let i = 0; i < iterations; i++) {
        create(baseObj, (draft) => {
          draft.a.b.c.d.e.f.g.h.i.j.k.l.m.n.o.p.q.r.s.t.u.v.w.x.y.z = `value${i}`
        })
      }
      const mutativeMemoryEnd = process.memoryUsage().heapUsed
      const mutativeTime = performance.now() - mutativeStart
      const mutativeMemory = mutativeMemoryEnd - mutativeMemoryStart

      console.log('\n=== Memory Usage (MB) ===')
      console.log(`bedit: ${(beditMemory / 1024 / 1024).toFixed(2)}MB`)
      console.log(`immer: ${(immerMemory / 1024 / 1024).toFixed(2)}MB`)
      console.log(`mutative: ${(mutativeMemory / 1024 / 1024).toFixed(2)}MB`)
      console.log(`bedit vs immer: ${(immerMemory / beditMemory).toFixed(2)}x`)
      console.log(
        `bedit vs mutative: ${(mutativeMemory / beditMemory).toFixed(2)}x`,
      )
    })
  })
})
