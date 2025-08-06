# bedit

A weird (and cool) immutable state utility for TypeScript.

It's like `immer` but:

- 🕵️‍♀️ No Proxies getting in the way when you're trying to debug.
- 📈 A billion times faster (exaggeration but emotionally true)
- 📉 Tiny (2kB minified)
- 💅 An "innovative" API (your LLM agent will appreciate the challenge)

## Installation

```sh
npm install bedit
```

## Usage

Use `setIn` to deeply assign values within nested objects and arrays.

```ts
import { setIn } from 'bedit'
const state = {
  user: { name: 'Nick Cave', preferences: { theme: 'dark' } },
  todos: [
    { id: '1', title: 'Buy milk', completed: true },
    { id: '2', title: 'Write a song', completed: false },
  ],
  filter: 'all',
}
const nextState = setIn(state).todos[1].completed(true)
```

Use `updateIn` to get the previous value and return a new version.

```ts
import { updateIn } from 'bedit'
const nextState = updateIn(state).todos((todos) =>
  todos.filter((todo) => !todo.completed),
)
```

Use `mutateIn` to edit a shallow clone of a subtree.

```ts
import { mutateIn } from 'bedit'
const nextState = mutateIn(state).user((user) => {
  user.name = 'Nicholas Cage'
  // TypeScript will prevent you from making deep edits.
  // ❌ Type error: `theme` is readonly
  user.preferences.theme = 'light'
})
```

If you need to make edits at multiple depths, bedit functions work inside of a `mutateIn` block.

```ts
import { mutateIn } from 'bedit'
const nextState = mutateIn(state).user((user) => {
  user.name = 'Nicholas Cage'
  // Calling bedit functions on the root `user` mutable object means you
  // don't need to reassign the result.
  setIn(user).preferences.theme('light')
})
```

> [!NOTE]
> bedit will reuse already-cloned objects in a `mutateIn` block.
> Minimal allocations means maximum speed 🏎️💨

bedit includes a few other functions for deleting things and suchlike. See [the full API](#api)

## Maps

Use `.key(k)` to modify values inside a `Map`.

```ts
let state = {
  users: new Map([
    ['user1', { name: 'John', age: 30 }],
    ['user2', { name: 'Jane', age: 25 }],
  ]),
}

state = setIn(state).users.key('user1').name('John Doe')
```

## Freezing objects at development time

TypeScript should prevent accidentally mutating data within bedit's mutator functions if your data is well-typed and you don't use `as any` ! But bedit can't help you once your bedit function has returned.

For extra peace of mind, call `setDevMode(true)` early in your application's boot process to freeze objects at development time.

This will cause errors to be thrown when you try to mutate an object that is supposed to be immutable.

```ts
import { setDevMode } from 'bedit'
if (process.env.NODE_ENV === 'development') {
  setDevMode(true)
}
```

# Performance

`bedit` seems to be:

- About 5x faster than `immer`'s production mode.
- About 3x faster than `mutative` (same API as `immer` but highly optimized)

<p align="center">
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://github.com/ds300/bedit/raw/main/bench/bench.dark.svg#gh-dark-mode-only">
  <source media="(prefers-color-scheme: light)" srcset="https://github.com/ds300/bedit/raw/main/bench/bench.light.svg#gh-light-mode-only">
  <img alt="Benchmarks" src="https://github.com/ds300/bedit/raw/main/bench/bench.light.svg#gh-light-mode-only">
</picture>
</p>

The benchmarks could be more thorough so take this for what it's worth.

https://github.com/ds300/bedit/tree/main/bench

## Limitations

- 👭 Works only with data supported by [`structuredClone`](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm) (So yes ✅ to `Map`, `Set`, plain objects, and arrays. And no ❌ to custom classes, objects with symbol keys or getters/setters, etc)
- 🩹 No support for patch generation/application.

## API

### `setIn`

Assign a value to a nested property.

```ts
import { setIn } from 'bedit'
const nextState = setIn({ a: { b: { c: 1 } } }).a.b.c(2)
// nextState = {a: {b: {c: 2}}}
```

### `updateIn`

Get the previous value (without cloning it) and return a new version.

```ts
import { updateIn } from 'bedit'
const nextState = updateIn({ a: { b: { c: 1 } } }).a.b.c((c) => c + 4)
// nextState = {a: {b: {c: 5}}}
```

### `mutateIn`

Edit a shallow clone of a subtree.

```ts
import { mutateIn } from 'bedit'
const nextState = mutateIn({ a: { b: { c: 1 } } }).a.b((b) => {
  b.c = 4
})
// nextState = {a: {b: {c: 4}}}
```

TypeScript will prevent you from making deep edits.

```ts
mutateIn({ a: { b: { c: 1 } } }).a((a) => {
  // ❌ Type error: `c` is readonly
  a.b.c = 3
})
```

All bedit functions can be used inside a `mutateIn` block. If you call them on the root mutable object, you don't need to reassign the result.

```ts
mutateIn({ a: { b: { c: 1 } } }).a((a) => {
  setIn(a).b.c(3)
})
```

To mutate the root object, you can just not specify a path.

```ts
mutateIn({ a: { b: { c: 1 } } })((obj) => {
  obj.a = { b: { c: 3 } }
})
```

### `deleteIn`

Delete a nested property.

```ts
import { deleteIn } from 'bedit'
const nextState = deleteIn({ a: { b: { c: 1 } } }).a.b.c()
// nextState = {a: {b: {}}}
```

It works on maps too.

```ts
import { deleteIn } from 'bedit'
const nextState = deleteIn({ a: { b: new Map([['c', 1]]) } }).a.b.key('c')()
// nextState = {a: {b: Map([])}}
```

And sets.

```ts
import { deleteIn } from 'bedit'
const nextState = deleteIn({ a: { b: new Set(['c', 'd']) } }).a.b.key('c')()
// nextState = {a: {b: Set(['d'])}}
```

### `addIn`

Add items to arrays and sets.

```ts
import { addIn } from 'bedit'

// Add to arrays (via .push())
const newUsers = addIn({ users: [{ name: 'John' }, { name: 'Jane' }] })({
  name: 'Bob',
})
// newUsers = [{ name: 'John' }, { name: 'Jane' }, { name: 'Bob' }]

// Add to Sets
const newTags = addIn({ tags: new Set(['admin', 'user']) })(
  'moderator',
  'vip',
)
// newTags = { tags: Set(['admin', 'user', 'moderator', 'vip']) }
```

### `deepMutateIn`

Like `mutateIn` but uses `structuredClone` to copy the entire subtree. You'd be surprised how fast this can be for relatively small values.

```ts
import { deepMutateIn } from 'bedit'
const nextState = deepMutateIn({ a: { b: { c: 1 } } }).a((a) => {
  a.b.c = 4
})
// nextState = {a: {b: {c: 4}}}
```
