# Performance Comparison: bedit vs Immer vs Mutative

All benchmarks were run with 10,000 iterations.

### Simple Property Updates

- **bedit setIn**: 6.48ms
- **bedit updateIn**: 5.96ms
- **bedit editIn**: 5.61ms
- **bedit editIn (shallow)**: 7.02ms
- **immer**: 34.91ms
- **mutative**: 27.63ms

**Performance vs Immer:**

- bedit setIn: 5.39x slower
- bedit updateIn: 5.86x slower
- bedit editIn: 6.22x slower
- bedit editIn (shallow): 4.97x slower

**Performance vs Mutative:**

- bedit setIn: 4.26x slower
- bedit updateIn: 4.64x slower
- bedit editIn: 4.92x slower
- bedit editIn (shallow): 3.94x slower

### Nested Property Updates

- **bedit setIn**: 5.97ms
- **bedit updateIn**: 13.19ms
- **bedit editIn**: 19.00ms
- **bedit editIn (shallow)**: 28.72ms
- **immer**: 65.84ms
- **mutative**: 47.87ms

**Performance vs Immer:**

- bedit setIn: 11.03x slower
- bedit updateIn: 4.99x slower
- bedit editIn: 3.46x slower
- bedit editIn (shallow): 2.29x slower

**Performance vs Mutative:**

- bedit setIn: 8.02x slower
- bedit updateIn: 3.63x slower
- bedit editIn: 2.52x slower
- bedit editIn (shallow): 1.67x slower

### Array Element Updates

- **bedit setIn**: 10.47ms
- **bedit updateIn**: 7.05ms
- **bedit editIn**: 7.17ms
- **bedit editIn (shallow)**: 6.98ms
- **immer**: 277.31ms
- **mutative**: 37.78ms

**Performance vs Immer:**

- bedit setIn: 26.48x slower
- bedit updateIn: 39.32x slower
- bedit editIn: 38.68x slower
- bedit editIn (shallow): 39.74x slower

**Performance vs Mutative:**

- bedit setIn: 3.61x slower
- bedit updateIn: 5.36x slower
- bedit editIn: 5.27x slower
- bedit editIn (shallow): 5.41x slower

### Deep Object Updates

- **bedit setIn**: 33.35ms
- **bedit updateIn**: 32.84ms
- **bedit editIn**: 31.83ms
- **bedit editIn (shallow)**: 32.19ms
- **immer**: 312.69ms
- **mutative**: 228.27ms

**Performance vs Immer:**

- bedit setIn: 9.38x slower
- bedit updateIn: 9.52x slower
- bedit editIn: 9.82x slower
- bedit editIn (shallow): 9.71x slower

**Performance vs Mutative:**

- bedit setIn: 6.84x slower
- bedit updateIn: 6.95x slower
- bedit editIn: 7.17x slower
- bedit editIn (shallow): 7.09x slower

### Function-based Updates

- **bedit setIn**: 5.21ms
- **bedit updateIn**: 7.26ms
- **bedit editIn**: 5.99ms
- **bedit editIn (shallow)**: 5.08ms
- **immer**: 43.96ms
- **mutative**: 36.00ms

**Performance vs Immer:**

- bedit setIn: 8.44x slower
- bedit updateIn: 6.06x slower
- bedit editIn: 7.34x slower
- bedit editIn (shallow): 8.66x slower

**Performance vs Mutative:**

- bedit setIn: 6.91x slower
- bedit updateIn: 4.96x slower
- bedit editIn: 6.01x slower
- bedit editIn (shallow): 7.09x slower

### Multiple Updates in Single Operation

- **bedit setIn**: 24.01ms
- **bedit updateIn**: 24.86ms
- **bedit editIn**: 23.87ms
- **bedit editIn (shallow)**: 11.64ms
- **immer**: 133.50ms
- **mutative**: 86.93ms

**Performance vs Immer:**

- bedit setIn: 5.56x slower
- bedit updateIn: 5.37x slower
- bedit editIn: 5.59x slower
- bedit editIn (shallow): 11.47x slower

**Performance vs Mutative:**

- bedit setIn: 3.62x slower
- bedit updateIn: 3.50x slower
- bedit editIn: 3.64x slower
- bedit editIn (shallow): 7.47x slower

### Shallow Mutations (Objects and Arrays)

- beditShallowObject6.79- beditShallowArray8.47- beditShallowReplace4.75- beditDeepObject16.81- beditDeepArray22.14- immer58.10- mutative44.01- shallowVsDeepObject2.47- shallowVsDeepArray2.61- shallowVsImmer8.55- shallowVsMutative6.48### Memory Usage (MB)

- **bedit setIn**: 1.36MB
- **bedit updateIn**: 2.23MB
- **bedit editIn**: 2.24MB
- **bedit editIn (shallow)**: 3.41MB
- **immer**: 0.93MB
- **mutative**: 7.87MB

**Performance vs Immer:**

- bedit setIn: 0.68x less memory
- bedit updateIn: 0.42x less memory
- bedit editIn: 0.42x less memory
- bedit editIn (shallow): 0.27x less memory

**Performance vs Mutative:**

- bedit setIn: 5.79x more memory
- bedit updateIn: 3.53x more memory
- bedit editIn: 3.52x more memory
- bedit editIn (shallow): 2.30x more memory

_Last updated: 2025-08-03T21:11:45.416Z_
