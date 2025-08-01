# Performance Comparison: bedit vs Immer vs Mutative

All benchmarks were run with 10,000 iterations.

### Simple Property Updates

- **bedit setIn**: 7.36ms
- **bedit updateIn**: 5.91ms
- **bedit mutateIn**: 5.98ms
- **bedit mutateIn (shallow)**: 5.38ms
- **immer**: 25.67ms
- **mutative**: 27.63ms

**Performance vs Immer:**
- bedit setIn: 3.49x slower
- bedit updateIn: 4.35x slower
- bedit mutateIn: 4.29x slower
- bedit mutateIn (shallow): 4.77x slower

**Performance vs Mutative:**
- bedit setIn: 3.75x slower
- bedit updateIn: 4.68x slower
- bedit mutateIn: 4.62x slower
- bedit mutateIn (shallow): 5.13x slower

### Nested Property Updates

- **bedit setIn**: 11.06ms
- **bedit updateIn**: 10.90ms
- **bedit mutateIn**: 9.09ms
- **bedit mutateIn (shallow)**: 8.23ms
- **immer**: 60.87ms
- **mutative**: 46.56ms

**Performance vs Immer:**
- bedit setIn: 5.50x slower
- bedit updateIn: 5.59x slower
- bedit mutateIn: 6.70x slower
- bedit mutateIn (shallow): 7.40x slower

**Performance vs Mutative:**
- bedit setIn: 4.21x slower
- bedit updateIn: 4.27x slower
- bedit mutateIn: 5.12x slower
- bedit mutateIn (shallow): 5.66x slower

### Array Element Updates

- **bedit setIn**: 9.79ms
- **bedit updateIn**: 8.01ms
- **bedit mutateIn**: 7.95ms
- **bedit mutateIn (shallow)**: 7.82ms
- **immer**: 276.74ms
- **mutative**: 38.76ms

**Performance vs Immer:**
- bedit setIn: 28.27x slower
- bedit updateIn: 34.54x slower
- bedit mutateIn: 34.80x slower
- bedit mutateIn (shallow): 35.38x slower

**Performance vs Mutative:**
- bedit setIn: 3.96x slower
- bedit updateIn: 4.84x slower
- bedit mutateIn: 4.87x slower
- bedit mutateIn (shallow): 4.95x slower

### Deep Object Updates

- **bedit setIn**: 44.05ms
- **bedit updateIn**: 43.97ms
- **bedit mutateIn**: 43.24ms
- **bedit mutateIn (shallow)**: 42.69ms
- **immer**: 317.98ms
- **mutative**: 216.02ms

**Performance vs Immer:**
- bedit setIn: 7.22x slower
- bedit updateIn: 7.23x slower
- bedit mutateIn: 7.35x slower
- bedit mutateIn (shallow): 7.45x slower

**Performance vs Mutative:**
- bedit setIn: 4.90x slower
- bedit updateIn: 4.91x slower
- bedit mutateIn: 5.00x slower
- bedit mutateIn (shallow): 5.06x slower

### Function-based Updates

- **bedit setIn**: 7.11ms
- **bedit updateIn**: 7.53ms
- **bedit mutateIn**: 7.76ms
- **bedit mutateIn (shallow)**: 7.52ms
- **immer**: 43.77ms
- **mutative**: 83.54ms

**Performance vs Immer:**
- bedit setIn: 6.16x slower
- bedit updateIn: 5.82x slower
- bedit mutateIn: 5.64x slower
- bedit mutateIn (shallow): 5.82x slower

**Performance vs Mutative:**
- bedit setIn: 11.75x slower
- bedit updateIn: 11.10x slower
- bedit mutateIn: 10.77x slower
- bedit mutateIn (shallow): 11.11x slower

### Multiple Updates in Single Operation

- **bedit setIn**: 35.15ms
- **bedit updateIn**: 30.26ms
- **bedit mutateIn**: 29.33ms
- **bedit mutateIn (shallow)**: 29.92ms
- **immer**: 133.66ms
- **mutative**: 84.03ms

**Performance vs Immer:**
- bedit setIn: 3.80x slower
- bedit updateIn: 4.42x slower
- bedit mutateIn: 4.56x slower
- bedit mutateIn (shallow): 4.47x slower

**Performance vs Mutative:**
- bedit setIn: 2.39x slower
- bedit updateIn: 2.78x slower
- bedit mutateIn: 2.87x slower
- bedit mutateIn (shallow): 2.81x slower

### Memory Usage (MB)

- **bedit setIn**: 4.06MB
- **bedit updateIn**: 5.04MB
- **bedit mutateIn**: 5.07MB
- **bedit mutateIn (shallow)**: 5.18MB
- **immer**: 0.92MB
- **mutative**: 7.87MB

**Performance vs Immer:**
- bedit setIn: 0.23x less memory
- bedit updateIn: 0.18x less memory
- bedit mutateIn: 0.18x less memory
- bedit mutateIn (shallow): 0.18x less memory

**Performance vs Mutative:**
- bedit setIn: 1.94x more memory
- bedit updateIn: 1.56x more memory
- bedit mutateIn: 1.55x more memory
- bedit mutateIn (shallow): 1.52x more memory



*Last updated: 2025-08-01T12:53:40.519Z*
