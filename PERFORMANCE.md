# Performance Comparison: bedit vs Immer vs Mutative

All benchmarks were run with 10,000 iterations.

### Simple Property Updates

- **bedit**: 4.39ms
- **immer**: 29.02ms (6.62x slower)
- **mutative**: 26.32ms (6.00x slower)

### Nested Property Updates

- **bedit**: 8.79ms
- **immer**: 60.62ms (6.90x slower)
- **mutative**: 45.97ms (5.23x slower)

### Array Element Updates

- **bedit**: 8.95ms
- **immer**: 279.95ms (31.29x slower)
- **mutative**: 38.66ms (4.32x slower)

### Deep Object Updates

- **bedit**: 41.61ms
- **immer**: 316.19ms (7.60x slower)
- **mutative**: 223.91ms (5.38x slower)

### Function-based Updates

- **bedit**: 8.87ms
- **immer**: 43.67ms (4.92x slower)
- **mutative**: 33.00ms (3.72x slower)

### Multiple Updates in Single Operation

- **bedit**: 27.10ms
- **immer**: 132.04ms (4.87x slower)
- **mutative**: 82.92ms (3.06x slower)

### Memory Usage (MB)

- **bedit**: 1.36MB
- **immer**: 1.00MB (0.74x more)
- **mutative**: 7.84MB (5.77x more)



*Last updated: 2025-08-01T10:42:59.273Z*
