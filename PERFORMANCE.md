# Performance Comparison: bedit vs Immer vs Mutative

All benchmarks were run with 10,000 iterations.

### Simple Property Updates

- **bedit setIn**: 5.97ms
- **bedit updateIn**: 8.64ms
- **bedit mutateIn**: 9.23ms
- **bedit mutateIn (shallow)**: 5.38ms
- **immer**: 28.33ms
- **mutative**: 27.63ms

**Performance vs Immer:**
- bedit setIn: 4.74x slower
- bedit updateIn: 3.28x slower
- bedit mutateIn: 3.07x slower
- bedit mutateIn (shallow): 5.26x slower

**Performance vs Mutative:**
- bedit setIn: 4.62x slower
- bedit updateIn: 3.20x slower
- bedit mutateIn: 2.99x slower
- bedit mutateIn (shallow): 5.13x slower

### Nested Property Updates

- **bedit setIn**: 7.84ms
- **bedit updateIn**: 8.23ms
- **bedit mutateIn**: 6.52ms
- **bedit mutateIn (shallow)**: 5.39ms
- **immer**: 61.40ms
- **mutative**: 48.39ms

**Performance vs Immer:**
- bedit setIn: 7.83x slower
- bedit updateIn: 7.46x slower
- bedit mutateIn: 9.42x slower
- bedit mutateIn (shallow): 11.38x slower

**Performance vs Mutative:**
- bedit setIn: 6.17x slower
- bedit updateIn: 5.88x slower
- bedit mutateIn: 7.43x slower
- bedit mutateIn (shallow): 8.97x slower

### Array Element Updates

- **bedit setIn**: 8.31ms
- **bedit updateIn**: 7.23ms
- **bedit mutateIn**: 6.64ms
- **bedit mutateIn (shallow)**: 6.38ms
- **immer**: 283.71ms
- **mutative**: 38.78ms

**Performance vs Immer:**
- bedit setIn: 34.14x slower
- bedit updateIn: 39.25x slower
- bedit mutateIn: 42.76x slower
- bedit mutateIn (shallow): 44.49x slower

**Performance vs Mutative:**
- bedit setIn: 4.67x slower
- bedit updateIn: 5.36x slower
- bedit mutateIn: 5.84x slower
- bedit mutateIn (shallow): 6.08x slower

### Deep Object Updates

- **bedit setIn**: 25.79ms
- **bedit updateIn**: 25.27ms
- **bedit mutateIn**: 24.89ms
- **bedit mutateIn (shallow)**: 24.57ms
- **immer**: 319.69ms
- **mutative**: 229.95ms

**Performance vs Immer:**
- bedit setIn: 12.40x slower
- bedit updateIn: 12.65x slower
- bedit mutateIn: 12.84x slower
- bedit mutateIn (shallow): 13.01x slower

**Performance vs Mutative:**
- bedit setIn: 8.92x slower
- bedit updateIn: 9.10x slower
- bedit mutateIn: 9.24x slower
- bedit mutateIn (shallow): 9.36x slower

### Function-based Updates

- **bedit setIn**: 4.47ms
- **bedit updateIn**: 6.40ms
- **bedit mutateIn**: 5.69ms
- **bedit mutateIn (shallow)**: 5.12ms
- **immer**: 44.14ms
- **mutative**: 33.35ms

**Performance vs Immer:**
- bedit setIn: 9.88x slower
- bedit updateIn: 6.90x slower
- bedit mutateIn: 7.76x slower
- bedit mutateIn (shallow): 8.62x slower

**Performance vs Mutative:**
- bedit setIn: 7.46x slower
- bedit updateIn: 5.21x slower
- bedit mutateIn: 5.86x slower
- bedit mutateIn (shallow): 6.52x slower

### Multiple Updates in Single Operation

- **bedit setIn**: 20.27ms
- **bedit updateIn**: 21.78ms
- **bedit mutateIn**: 20.39ms
- **bedit mutateIn (shallow)**: 20.77ms
- **immer**: 136.68ms
- **mutative**: 84.22ms

**Performance vs Immer:**
- bedit setIn: 6.74x slower
- bedit updateIn: 6.28x slower
- bedit mutateIn: 6.70x slower
- bedit mutateIn (shallow): 6.58x slower

**Performance vs Mutative:**
- bedit setIn: 4.16x slower
- bedit updateIn: 3.87x slower
- bedit mutateIn: 4.13x slower
- bedit mutateIn (shallow): 4.05x slower

### Memory Usage (MB)

- **bedit setIn**: 1.36MB
- **bedit updateIn**: 2.23MB
- **bedit mutateIn**: 2.24MB
- **bedit mutateIn (shallow)**: 2.37MB
- **immer**: 0.95MB
- **mutative**: 7.86MB

**Performance vs Immer:**
- bedit setIn: 0.70x less memory
- bedit updateIn: 0.43x less memory
- bedit mutateIn: 0.42x less memory
- bedit mutateIn (shallow): 0.40x less memory

**Performance vs Mutative:**
- bedit setIn: 5.78x more memory
- bedit updateIn: 3.53x more memory
- bedit mutateIn: 3.52x more memory
- bedit mutateIn (shallow): 3.32x more memory



*Last updated: 2025-08-02T18:20:22.212Z*
