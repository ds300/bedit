import { describe, it, expect, afterAll } from 'vitest'
import { setIn, updateIn } from './index'
import { produce } from 'immer'
import { create } from 'mutative'
import { writeFileSync } from 'fs'
import { join } from 'path'

// Type declarations for Node.js globals
declare const global: any

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

// Results collection
const results: Record<string, any> = {}

const logResult = (testName: string, data: any) => {
  results[testName] = data
}

describe('Performance Benchmarks', () => {
  const iterations = 10000

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

      const data = {
        bedit: beditTime,
        immer: immerTime,
        mutative: mutativeTime,
        beditVsImmer: immerTime / beditTime,
        beditVsMutative: mutativeTime / beditTime,
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

      const data = {
        bedit: beditTime,
        immer: immerTime,
        mutative: mutativeTime,
        beditVsImmer: immerTime / beditTime,
        beditVsMutative: mutativeTime / beditTime,
      }
      logResult('Nested Property Updates', data)
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

      const data = {
        bedit: beditTime,
        immer: immerTime,
        mutative: mutativeTime,
        beditVsImmer: immerTime / beditTime,
        beditVsMutative: mutativeTime / beditTime,
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

      const data = {
        bedit: beditTime,
        immer: immerTime,
        mutative: mutativeTime,
        beditVsImmer: immerTime / beditTime,
        beditVsMutative: mutativeTime / beditTime,
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

      const data = {
        bedit: beditTime,
        immer: immerTime,
        mutative: mutativeTime,
        beditVsImmer: immerTime / beditTime,
        beditVsMutative: mutativeTime / beditTime,
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

      const data = {
        bedit: beditTime,
        immer: immerTime,
        mutative: mutativeTime,
        beditVsImmer: immerTime / beditTime,
        beditVsMutative: mutativeTime / beditTime,
      }
      logResult('Multiple Updates in Single Operation', data)
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

      const beditMemoryStart = process.memoryUsage().heapUsed
      for (let i = 0; i < iterations; i++) {
        setIn(baseObj).a.b.c.d.e.f.g.h.i.j.k.l.m.n.o.p.q.r.s.t.u.v.w.x.y.z(
          `value${i}`,
        )
      }
      const beditMemoryEnd = process.memoryUsage().heapUsed
      const beditMemory = beditMemoryEnd - beditMemoryStart

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
        bedit: beditMemory / 1024 / 1024,
        immer: immerMemory / 1024 / 1024,
        mutative: mutativeMemory / 1024 / 1024,
        beditVsImmer: immerMemory / beditMemory,
        beditVsMutative: mutativeMemory / beditMemory,
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
          table += `- **bedit**: ${data.bedit.toFixed(2)}MB\n`
          table += `- **immer**: ${data.immer.toFixed(2)}MB (${data.beditVsImmer.toFixed(2)}x ${data.beditVsImmer > 0 ? 'more' : 'less'})\n`
          table += `- **mutative**: ${data.mutative.toFixed(2)}MB (${data.beditVsMutative.toFixed(2)}x ${data.beditVsMutative > 0 ? 'more' : 'less'})\n\n`
        } else {
          table += `### ${testName}\n\n`
          table += `- **bedit**: ${data.bedit.toFixed(2)}ms\n`
          table += `- **immer**: ${data.immer.toFixed(2)}ms (${data.beditVsImmer.toFixed(2)}x slower)\n`
          table += `- **mutative**: ${data.mutative.toFixed(2)}ms (${data.beditVsMutative.toFixed(2)}x slower)\n\n`
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
