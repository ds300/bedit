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

The `bedit` function creates a shallow clone of the input, and passes it to a callback.

```ts
import { bedit, setIn, updateIn, mutateIn } from 'bedit'

const state = {
  user: { name: 'Nick Cave', preferences: { theme: 'dark' } },
  todos: [
    { id: '0', title: 'Go fishing', completed: false },
    { id: '1', title: 'Buy milk', completed: true },
    { id: '2', title: 'Write a song', completed: false },
  ],
  filter: 'all',
}

const nextState = bedit(state, (draft) => {
  // You can edit the top level draft object safely
  draft.filter = 'completed'

  // The draft is a regular ass JS object
  console.log(draft.todos[0])

  // TypeScript will prevent you from making deep edits.
  // ❌ Type error: `theme` is readonly
  draft.user.preferences.theme = 'light'

  // Instead, call setIn on the draft object to assign deeply.
  setIn(draft).user.preferences.theme('light')
  setIn(draft).todos[2].completed(true)

  // Use updateIn to apply a function to a value (without cloning it first).
  updateIn(draft).todos[1].title(title => title.toUpperCase() + '!!!')

  // Use mutateIn to edit a shallow clone of a subtree.
  mutateIn(draft).todos[0]((todo) => {
    todo.title = 'Do the dishes'
    todo.completed = false
  })
})
```

You don't need to use `bedit` if you only need to make one edit at a time. `setIn` and friends return the new state if called on their own.

```ts
const nextState2 = setIn(state).user.name('Nicholas Cage')
```

bedit includes a few other functions for deleting things and suchlike. See [the full API](#api)

## Maps

Use `.key(k)` to modify values inside a `Map`.

```ts
const state = {
  users: new Map([
    ['user1', { name: 'John', age: 30 }],
    ['user2', { name: 'Jane', age: 25 }],
  ]),
}

const nextState = setIn(state).users.key('user1').name('John Doe')
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
const newUsers = addIn({ users: [{ name: 'John' }, { name: 'Jane' }] }).users({
  name: 'Bob',
})
// newUsers = [{ name: 'John' }, { name: 'Jane' }, { name: 'Bob' }]

// Add to Sets
const newTags = addIn({ tags: new Set(['admin', 'user']) }).tags(
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
