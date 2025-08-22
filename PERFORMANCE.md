# Performance Comparison: patchfork vs Immer vs Mutative

All benchmarks were run with 10,000 iterations.

### Simple Property Updates

- **patchfork setIn**: 6.48ms
- **patchfork updateIn**: 5.96ms
- **patchfork edit.batch**: 5.61ms
- **patchfork edit.batch (shallow)**: 7.02ms
- **immer**: 34.91ms
- **mutative**: 27.63ms

**Performance vs Immer:**

- patchfork setIn: 5.39x slower
- patchfork updateIn: 5.86x slower
- patchfork edit.batch: 6.22x slower
- patchfork edit.batch (shallow): 4.97x slower

**Performance vs Mutative:**

- patchfork setIn: 4.26x slower
- patchfork updateIn: 4.64x slower
- patchfork edit.batch: 4.92x slower
- patchfork edit.batch (shallow): 3.94x slower

### Nested Property Updates

- **patchfork setIn**: 5.97ms
- **patchfork updateIn**: 13.19ms
- **patchfork edit.batch**: 19.00ms
- **patchfork edit.batch (shallow)**: 28.72ms
- **immer**: 65.84ms
- **mutative**: 47.87ms

**Performance vs Immer:**

- patchfork setIn: 11.03x slower
- patchfork updateIn: 4.99x slower
- patchfork edit.batch: 3.46x slower
- patchfork edit.batch (shallow): 2.29x slower

**Performance vs Mutative:**

- patchfork setIn: 8.02x slower
- patchfork updateIn: 3.63x slower
- patchfork edit.batch: 2.52x slower
- patchfork edit.batch (shallow): 1.67x slower

### Array Element Updates

- **patchfork setIn**: 10.47ms
- **patchfork updateIn**: 7.05ms
- **patchfork edit.batch**: 7.17ms
- **patchfork edit.batch (shallow)**: 6.98ms
- **immer**: 277.31ms
- **mutative**: 37.78ms

**Performance vs Immer:**

- patchfork setIn: 26.48x slower
- patchfork updateIn: 39.32x slower
- patchfork edit.batch: 38.68x slower
- patchfork edit.batch (shallow): 39.74x slower

**Performance vs Mutative:**

- patchfork setIn: 3.61x slower
- patchfork updateIn: 5.36x slower
- patchfork edit.batch: 5.27x slower
- patchfork edit.batch (shallow): 5.41x slower

### Deep Object Updates

- **patchfork setIn**: 33.35ms
- **patchfork updateIn**: 32.84ms
- **patchfork edit.batch**: 31.83ms
- **patchfork edit.batch (shallow)**: 32.19ms
- **immer**: 312.69ms
- **mutative**: 228.27ms

**Performance vs Immer:**

- patchfork setIn: 9.38x slower
- patchfork updateIn: 9.52x slower
- patchfork edit.batch: 9.82x slower
- patchfork edit.batch (shallow): 9.71x slower

**Performance vs Mutative:**

- patchfork setIn: 6.84x slower
- patchfork updateIn: 6.95x slower
- patchfork edit.batch: 7.17x slower
- patchfork edit.batch (shallow): 7.09x slower

### Function-based Updates

- **patchfork setIn**: 5.21ms
- **patchfork updateIn**: 7.26ms
- **patchfork edit.batch**: 5.99ms
- **patchfork edit.batch (shallow)**: 5.08ms
- **immer**: 43.96ms
- **mutative**: 36.00ms

**Performance vs Immer:**

- patchfork setIn: 8.44x slower
- patchfork updateIn: 6.06x slower
- patchfork edit.batch: 7.34x slower
- patchfork edit.batch (shallow): 8.66x slower

**Performance vs Mutative:**

- patchfork setIn: 6.91x slower
- patchfork updateIn: 4.96x slower
- patchfork edit.batch: 6.01x slower
- patchfork edit.batch (shallow): 7.09x slower

### Multiple Updates in Single Operation

- **patchfork setIn**: 24.01ms
- **patchfork updateIn**: 24.86ms
- **patchfork edit.batch**: 23.87ms
- **patchfork edit.batch (shallow)**: 11.64ms
- **immer**: 133.50ms
- **mutative**: 86.93ms

**Performance vs Immer:**

- patchfork setIn: 5.56x slower
- patchfork updateIn: 5.37x slower
- patchfork edit.batch: 5.59x slower
- patchfork edit.batch (shallow): 11.47x slower

**Performance vs Mutative:**

- patchfork setIn: 3.62x slower
- patchfork updateIn: 3.50x slower
- patchfork edit.batch: 3.64x slower
- patchfork edit.batch (shallow): 7.47x slower

### Shallow Mutations (Objects and Arrays)

- patchforkShallowObject6.79- patchforkShallowArray8.47- patchforkShallowReplace4.75- patchforkDeepObject16.81- patchforkDeepArray22.14- immer58.10- mutative44.01- shallowVsDeepObject2.47- shallowVsDeepArray2.61- shallowVsImmer8.55- shallowVsMutative6.48### Memory Usage (MB)

- **patchfork setIn**: 1.36MB
- **patchfork updateIn**: 2.23MB
- **patchfork edit.batch**: 2.24MB
- **patchfork edit.batch (shallow)**: 3.41MB
- **immer**: 0.93MB
- **mutative**: 7.87MB

**Performance vs Immer:**

- patchfork setIn: 0.68x less memory
- patchfork updateIn: 0.42x less memory
- patchfork edit.batch: 0.42x less memory
- patchfork edit.batch (shallow): 0.27x less memory

**Performance vs Mutative:**

- patchfork setIn: 5.79x more memory
- patchfork updateIn: 3.53x more memory
- patchfork edit.batch: 3.52x more memory
- patchfork edit.batch (shallow): 2.30x more memory

_Last updated: 2025-08-03T21:11:45.416Z_
