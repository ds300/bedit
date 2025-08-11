# bedit

A weird (and cool) immutable state utility for TypeScript.

It's like `immer` but:

- 🕵️‍♀️ No Proxies getting in the way when you're trying to debug.
- 📈 10x faster (tbh [only 5x](#performance) but emotionally 10x)
- 📉 Tiny (2kB minified)
- 💅 An "innovative" API (give your complacent AI agent something to chew on)

## Installation

```sh
npm install bedit
```

## Usage

The `edit` function creates a shallow clone of the input, and passes it to a callback.

```ts
import { edit, setIn, updateIn, editIn } from 'bedit'
const state = {
  user: { name: 'Nick Cave', preferences: { theme: 'dark' } },
  todos: [
    { id: '0', title: 'Go fishing', completed: false },
    { id: '1', title: 'Buy milk', completed: true },
    { id: '2', title: 'Write a song', completed: false },
  ],
  filter: 'all',
}

const nextState = edit(state, (draft) => {
  // `draft` is a regular JS object, not a Proxy.
  // You can edit it at the top level.
  draft.filter = 'completed'

  // TypeScript will prevent you from making deep edits.
  // ❌ Type error: `theme` is readonly
  draft.user.preferences.theme = 'light'

  // Instead, call `setIn` on the draft object to assign deeply.
  setIn(draft).user.preferences.theme('light')
  setIn(draft).todos[2].completed(true)

  // Use `updateIn` to apply a function to a value (without cloning it first).
  updateIn(draft).todos[1].title((title) => title.toUpperCase() + '!!!')

  // Use `editIn` to edit a shallow clone of a subtree.
  editIn(draft).todos[0]((todo) => {
    todo.title = 'Do the dishes'
    todo.completed = false
  })
})
```

You can call `setIn` and friends on non-draft objects too, it will return a new state with the edit applied. This is useful if you only need to make one change at a time.

```ts
const nextState = setIn(state).user.name('Nicholas Cage')
```

Or if you only need to edit one level.

```ts
const nextState = editIn(state).todos[1]((todo) => {
  todo.completed = false
  todo.title = todo.title.toUpperCase() + '!!!'
})
```

There's also `addIn` for adding items to arrays and sets, and `deleteIn` for guess what. See [the full API](#api) for details.

## Maps

Use `.key(k)` to modify values inside a `Map`.

```ts
const state = {
  users: new Map([
    ['user1', { name: 'John', age: 30 }],
    ['user2', { name: 'Jane', age: 25 }],
  ]),
}

const nextState = setIn(state).users.key('user1').name('Wilberforce')
```

## Freezing objects at development time

TypeScript should prevent unsafely mutating data within bedit's draft functions if your data is well-typed and you don't use `as any` ! But who knows what might happen later, in the outside world. Shit's crazy out there.

For extra peace of mind, call `setDevMode(true)` early in your application's boot process to freeze objects at development time.

This will cause errors to be thrown if you try to mutate an object that is supposed to be immutable.

```ts
import { setDevMode } from 'bedit'
if (process.env.NODE_ENV === 'development') {
  setDevMode(true)
}
```

## Performance

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

### `edit`

Edit a shallow clone of a value.

```ts
import { edit } from 'bedit'
const nextState = edit(
  { name: 'John', preferences: { theme: 'dark' } },
  (draft) => {
    // ✅ No type error, safe to mutate the top-level draft object
    draft.name = 'Jane'

    // ❌ Type error: `theme` is readonly
    draft.preferences.theme = 'light'

    // ✅ use `setIn(draft)` to mutate deeply and safely
    setIn(draft).preferences.theme('light')
  },
)
// nextState = {name: 'Jane', preferences: {theme: 'light'}}
```

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

### `editIn`

Edit a shallow clone of a subtree.

```ts
import { editIn } from 'bedit'
const nextState = editIn({ a: { b: { c: 1 } } }).a.b((b) => {
  b.c = 4
})
// nextState = {a: {b: {c: 4}}}
```

TypeScript will prevent you from making deep edits.

```ts
editIn({ a: { b: { c: 1 } } }).a((a) => {
  // ❌ Type error: `c` is readonly
  a.b.c = 3
})
```

All bedit functions can be used inside an `editIn` block. If you call them on the root 'draft' object, you don't need to reassign the result.

```ts
editIn({ a: { b: { c: 1 } } }).a((a) => {
  setIn(a).b.c(3)
})
```

To mutate the root object, you can just not specify a path.

```ts
editIn({ a: { b: { c: 1 } } })((obj) => {
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

It uses .splice on arrays, to avoid leaving a hole behind.

```ts
const nextState = deleteIn({ a: { b: [1, 2, 3] } }).a.b[1]()
// nextState = {a: {b: [1, 3]}}
```

It works on maps too.

```ts
const nextState = deleteIn({ a: { b: new Map([['c', 1]]) } }).a.b.key('c')()
// nextState = {a: {b: Map([])}}
```

And sets.

```ts
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
