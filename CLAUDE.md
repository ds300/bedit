# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**patchfork** is a tiny, fast, and clever immutable state utility for TypeScript. The project has been renamed from "bedit" (which is why you might see references to bedit in the directory name). It provides two core functions: `fork` and `patch` for immutable state updates using a proxy-based API.

## Development Commands

### Testing

- `npm test` - Run all tests with typecheck
- `npm run test:watch` - Run tests in watch mode
- `npm run test:ui` - Run tests with UI

### Building & Development

- `npm run build` - Build the project (creates production and development builds)
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

### Performance & Benchmarking

- `npm run size` - Check bundle size of production build
- `npm run size:immer` - Check Immer's bundle size for comparison
- `npm run bench` - Run benchmarks and save results
- `npm run benchmark` - Run simple benchmark
- `npm run benchmark:comprehensive` - Run comprehensive benchmarks

## Architecture

### Core Files Structure

- `src/patchfork.mts` - Main implementation with proxy-based immutable updates
- `src/patchfork.production.mts` - Production build (generated from main file with dev features stripped)
- `src/symbols.mts` - TypeScript symbols and interfaces for state container integration
- `src/zustand.mts` - Zustand state management integration
- `src/react.mts` - React hooks integration
- `src/utils.mts` - Utility functions

### Key Architectural Concepts

#### Frame-based Proxy System

The core uses a frame pool system (`src/patchfork.mts:577-592`) for managing nested edit operations. Each frame tracks:

- Object paths during traversal
- Key paths for property access
- Cloning operations for structural sharing

#### State Container Pattern

Uses symbol-based interfaces (`$patchable`) to integrate with external state management:

- `Patchable<T>` - Synchronous state containers
- `AsyncPatchable<T>` - Asynchronous state containers (like React's useState)

#### Development vs Production Builds

- Development build includes object freezing for mutation detection
- Production build strips dev-mode code using preprocess
- Build process (`scripts/build.mjs`) creates both versions

### Testing Architecture

- Uses Vitest with jsdom environment
- Type-level tests with `.test-d.ts` files
- Property-based testing with fast-check
- React component testing with React Testing Library

### Integration Patterns

- **Zustand**: `patchable(store)` wrapper adds patchfork capabilities
- **React**: `usePatchableState(init)` hook for component state
- **Custom Containers**: Implement `Patchable` interface

## Development Notes

### Type System

- Heavy use of conditional types for deep readonly/mutable transformations
- `Updatable<T>` provides the main API interface with method overloading
- Optional chaining built into the type system and runtime

### Performance Optimizations

- Object pooling for frames to reduce allocations
- Structural sharing through selective cloning
- Proxy-based lazy evaluation of property access

### Map/Set Special Handling

- Maps use special `key` symbol for property access: `fork(obj).map[key]('keyname')`
- Different method handling for immutable vs mutable array operations
