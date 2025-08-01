# Performance Comparison: bedit vs Immer vs Mutative

This document contains performance benchmarks comparing bedit against Immer and Mutative, the two most popular immutable update libraries.

## Benchmark Results

All benchmarks were run with 1000 iterations on a MacBook Pro with Node.js 18.

### Simple Property Updates

- **bedit**: 1.05ms
- **immer**: 7.31ms (6.93x slower)
- **mutative**: 6.08ms (5.77x slower)

### Nested Property Updates

- **bedit**: 1.81ms
- **immer**: 13.81ms (7.63x slower)
- **mutative**: 13.48ms (7.44x slower)

### Array Element Updates

- **bedit**: 2.93ms
- **immer**: 36.81ms (12.55x slower)
- **mutative**: 9.79ms (3.34x slower)

### Deep Object Updates (26 levels deep)

- **bedit**: 5.55ms
- **immer**: 34.19ms (6.16x slower)
- **mutative**: 31.05ms (5.59x slower)

### Function-based Updates

- **bedit**: 1.66ms
- **immer**: 4.43ms (2.68x slower)
- **mutative**: 5.07ms (3.06x slower)

### Multiple Updates in Single Operation

- **bedit**: 3.00ms
- **immer**: 14.80ms (4.93x slower)
- **mutative**: 14.37ms (4.78x slower)

### Memory Usage

- **bedit**: 1.19MB
- **immer**: -0.72MB (negative due to garbage collection)
- **mutative**: 2.36MB (1.99x more memory)

## Key Findings

1. **bedit is significantly faster** than both Immer and Mutative across all scenarios
2. **Array operations** show the biggest performance difference - bedit is 12.55x faster than Immer
3. **Deep object updates** are 5-6x faster with bedit
4. **Memory usage** is reasonable, though Immer shows negative memory usage due to aggressive garbage collection
5. **Function-based updates** are 2.5-3x faster with bedit

## Why bedit is faster

1. **No Proxy overhead**: bedit doesn't use JavaScript Proxies, which have significant performance costs
2. **Direct structuredClone**: Uses the native `structuredClone` API for deep cloning
3. **Simpler implementation**: Less abstraction layers and fewer function calls
4. **No draft state management**: Unlike Immer, bedit doesn't need to track draft state

## Trade-offs

### bedit advantages:

- Much faster performance
- No Proxy pollution in stack traces
- Simpler mental model
- Smaller bundle size

### bedit disadvantages:

- Less intuitive API (chaining not supported)
- Requires manual shallow option for performance optimization
- Less mature ecosystem
- No built-in support for complex transformations

## Conclusion

bedit shows impressive performance gains over both Immer and Mutative, particularly for array operations and deep object updates. The performance improvements come at the cost of a less intuitive API, but for performance-critical applications, bedit could be an excellent choice.

The benchmarks show that bedit is consistently 2.5-12x faster than the competition, making it a compelling alternative for applications where performance is a priority.
