# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

bedit is an immutable state utility library for TypeScript that serves as an alternative to Immer. It provides 5-10x performance improvements over Immer while maintaining a smaller bundle size (2kB minified). Unlike Immer, bedit doesn't use Proxies, making debugging easier.

## Core Architecture

### Main Files Structure

- `bedit.mts` - Development version with full dev mode support and object freezing
- `bedit.production.mts` - Production version (auto-generated from bedit.mts via preprocessing)
- `dist/` - Compiled output directory containing built .mjs and .d.ts files

### Key Concepts

1. **Frame-based Operation System**: bedit uses a pooled frame system to track property paths and minimize allocations
2. **Batch Processing**: Shared object tracking for efficient batch operations via `batchStack`
3. **Conditional Development Features**: Dev mode features (object freezing, validation) are conditionally compiled out in production
4. **Proxy-based Path Recording**: Uses Proxy objects to record property access paths before applying mutations

### Core APIs

- `edit(obj).path.to.prop(value)` - Set values at any depth
- `edit(obj).path.to.prop(fn)` - Update values using functions (also supports method calls on collections)
- `edit.batch(obj, fn)` - Batch mutations for optimal performance (2-arity)
- `edit.batch(subObj, fn)` - Shallow clone and mutate specific subtrees (1-arity)

### State Container Integration

bedit supports state container integration via the `BeditStateContainer` interface and `$beditStateContainer` symbol, allowing automatic state updates in frameworks like Zustand.

## Development Commands

### Testing

```bash
npm test                 # Run all tests
npm run test:watch       # Run tests in watch mode
npm run test:ui          # Run tests with UI
```

### Building

```bash
npm run build           # Build both development and production versions
npm run prepack         # Build before publishing (same as build)
```

### Code Quality

```bash
npm run format          # Format code with Prettier
npm run format:check    # Check code formatting
```

### Performance Analysis

```bash
npm run size            # Check bedit bundle size
npm run size:immer      # Check Immer bundle size for comparison
npm run bench           # Run performance benchmarks
npm run benchmark       # Run custom benchmarks (uses tsx)
npm run benchmark:comprehensive  # Run comprehensive benchmarks
```

## Testing Architecture

- **Test Framework**: Vitest with global test functions (describe, it, expect)
- **Test Structure**: Modular tests by feature (setIn.test.ts, updateIn.test.ts, etc.)
- **Test Utilities**: Shared test data factories in `test/test-utils.ts`
- **Coverage Areas**: Each core function has dedicated test files plus edge cases and dev mode tests

### Test Categories

- Core functionality tests for each API function
- Edge case handling (edge-cases.test.ts)
- Development mode validation (dev-mode.test.ts)
- Batch edit.batchg scenarios (batchEdits.test.ts)
- State container integration (stateContainer.test.ts)
- Zustand integration (zustand.test.ts)

## Build Process

The build process uses a preprocessing step to create two versions:

1. **Development**: Full feature set with dev mode support
2. **Production**: Optimized version with dev mode code stripped out

Key build steps:

1. Preprocess `bedit.mts` → `bedit.production.mts` (strips dev mode code)
2. TypeScript compilation via `tsc`
3. Outputs ESM modules with declarations and source maps

**IMPORTANT**: To update the production file, run `npm run build`. The production file (`bedit.production.mts`) is auto-generated from the main development file (`bedit.mts`) during the build process.

## Performance Considerations

bedit achieves superior performance through:

- Object pooling for operation frames (avoids garbage collection)
- Minimal cloning (only necessary objects are cloned)
- Batch operation optimization with shared clone tracking
- No Proxy overhead during actual mutations (Proxies only used for path recording)

## Development Mode Features

When `setDevMode(true)` is called in development:

- Objects are automatically frozen after mutations to detect accidental mutations
- Recursive freezing of nested structures
- WeakSet tracking of frozen objects to avoid duplicate freezing
- Development-only validation and error checking

This mode is completely stripped from production builds for optimal performance.

## Important Design Principles & Testing Guidelines

### Readonly Nested Properties

bedit's core design principle is that nested properties in draft objects are **readonly**. This is enforced both by TypeScript and at runtime in dev mode:

- ✅ **Top-level mutations**: `draft.count = 5` - Direct assignment to top-level properties is allowed
- ❌ **Nested mutations**: `draft.user.name = 'John'` - TypeScript error and runtime error in dev mode
- ✅ **Bedit functions**: `edit(draft).user.name('John')` - Use bedit functions for nested mutations

### Testing Best Practices

1. **Always enable dev mode in tests** - Use `setDevMode(true)` to catch mutation errors early
2. **Use actual libraries, not mocks** - Test with real zustand stores, not mock implementations
3. **Don't disable dev mode to "fix" failing tests** - Fix the underlying issues instead
4. **Don't use type assertions to bypass readonly restrictions** - Use proper bedit functions
5. **Custom functions in zustand integration must use bedit functions**:

   ```ts
   // ❌ Wrong - will fail in dev mode
   const functions = {
     addUser: (draft, user) => draft.users.push(user),
   }

   // ✅ Correct - use bedit functions
   const functions = {
     addUser: (draft, user) => edit(draft).users.push(user),
   }
   ```

### Common Patterns

- Use `edit(draft).array.push(item)` instead of `draft.array.push(item)`
- Use `edit(draft).set.add(item)` for adding to Sets
- Use `edit(draft).map.delete('key')` for deleting from Maps
- Use `edit(draft).nested.prop(value)` instead of `draft.nested.prop = value`
- Use `edit(draft).prop(fn)` for functional updates
- Use `edit.batch(draft.subtree, fn)` to edit shallow clones of subtrees
