# bedit

A tiny immutable state utility for TypeScript.

```ts
import { edit } from 'bedit'

// Pass a value to assign
edit({ settings: { theme: 'light' } }).settings.theme('dark')
// => { settings: { theme: 'dark' } }

// Pass a function to update
edit({ user: { name: 'Nick Cave' } }).user.name(
  (name) => name.toUpperCase() + '!!!',
)
// => { user: { name: 'NICK CAVE!!!' } }

// Array, Map, and Set methods work too
edit({ nums: [1, 2, 3] }).nums.push(4)
// => { nums: [1, 2, 3, 4] }
```

- 📉 2kB minified
- 📈 Fast [as heck](#performance)
- 💅 Objectively cool (impress your AI agent)
- ⚛️ Works with [React](./docs/react.md), [Zustand](./docs/zustand.md), and any other state management library

## Installation

```sh
npm install bedit
```

## Usage

The `edit.batch` function creates a shallow clone of the input, and passes it to a callback.

```ts
import { edit } from 'bedit'
const state = {
  user: { name: 'Nick Cave', preferences: { theme: 'dark' } },
  todos: [
    { id: '0', title: 'Go fishing', completed: false },
    { id: '1', title: 'Buy milk', completed: true },
    { id: '2', title: 'Write a song', completed: false },
  ],
  filter: 'all',
}

const nextState = edit.batch(state, (draft) => {
  // `draft` is a regular JS object, not a Proxy.
  // You can edit it at the top level.
  draft.filter = 'completed'

  // TypeScript will prevent you from making deep edits.
  // ❌ Type error: `theme` is readonly
  draft.user.preferences.theme = 'light'

  // Instead, call `edit` on the draft object to assign deeply.
  edit(draft).user.preferences.theme('light')
  edit(draft).todos[2].completed(true)

  // Use `edit` with functions to apply transformations.
  edit(draft).todos[1].title((title) => title.toUpperCase() + '!!!')

  // `edit` can also be used to call methods on collections.
  edit(draft).todos.push({ id: '3', title: 'Buy bread', completed: false })
  edit(draft).todos.filter((todo) => !todo.completed)
  edit(draft).todos.sort((a, b) => a.title.localeCompare(b.title))

  // Use `edit.batch` with 1-arity to edit a shallow clone of a subtree.
  edit.batch(draft.todos[0], (todo) => {
    todo.title = 'Do the dishes'
    todo.completed = false
  })
})
```

You can call `edit` on non-draft objects too, it will return a new state with the edit applied. This is useful if you only need to make one change at a time.

```ts
const nextState = edit(state).user.name('Nicholas Cage')
```

Or if you only need to edit one level.

```ts
const nextState = edit.batch(state.todos[1], (todo) => {
  todo.completed = false
  todo.title = todo.title.toUpperCase() + '!!!'
})
```

## Maps

Use `[key](k)` to drill into values inside a `Map`.

```ts
import { key, edit } from 'bedit'
const state = {
  users: new Map([
    ['user1', { name: 'John', age: 30 }],
    ['user2', { name: 'Jane', age: 25 }],
  ]),
}

const nextState = edit(state).users[key]('user1').name('Wilberforce')
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

- 🩹 No support for patch generation/application.
- 👭 Works only with data supported by [`structuredClone`](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm) (So yes ✅ to `Map`, `Set`, plain objects, and arrays. And no ❌ to custom classes, objects with symbol keys or getters/setters, etc)
- 🤷‍♂️ LLMs really do suck at using bedit. They get it if you point them at the README but otherwise they make a lot of mistakes (which is bad !!) !
- It currently returns a new object even if an edit is ineffectual, e.g.

  ```ts
  const foo = { bar: 'baz' }
  const nextState = edit(foo).bar('baz')
  newState !== foo // sadly true
  ```

  This could be fixed partially for certain usage patterns (PRs welcome).

## API

### `edit`

Assign or update a value at a nested property.

```ts
import { edit } from 'bedit'
// Assign a value
const nextState = edit({ a: { b: { c: 1 } } }).a.b.c(2)
// nextState = {a: {b: {c: 2}}}

// Update with a function
const nextState = edit({ a: { b: { c: 1 } } }).a.b.c((c) => c + 4)
// nextState = {a: {b: {c: 5}}}

// Call methods on collections
const nextState = edit({ nums: [1, 2, 3] }).nums.push(4)
// nextState = {nums: [1, 2, 3, 4]}
```

### `edit.batch`

Edit a shallow clone of a value using a callback function.

#### 2-arity: Batch edit.batchg

```ts
import { edit } from 'bedit'
const nextState = edit.batch(
  { name: 'John', preferences: { theme: 'dark' } },
  (draft) => {
    // ✅ No type error, safe to mutate the top-level draft object
    draft.name = 'Jane'

    // ❌ Type error: `theme` is readonly
    draft.preferences.theme = 'light'

    // ✅ use `edit(draft)` to mutate deeply and safely
    edit(draft).preferences.theme('light')
  },
)
// nextState = {name: 'Jane', preferences: {theme: 'light'}}
```

#### 1-arity: Edit a subtree

```ts
import { edit } from 'bedit'
const nextState = edit.batch({ a: { b: { c: 1 } } }.a.b, (b) => {
  b.c = 4
})
// nextState would be applied to the parent object
```

## Quirks

- Nullability
- Type refinement
- edit(obj)[key]('blah')(blah) vs edit(obj).set('blah', blah)

## Zustand Integration

bedit provides integration with [Zustand](https://github.com/pmndrs/zustand) stores. Simply beditify your store and use bedit functions directly:

```ts
import { beditify } from 'bedit/zustand'
import { edit } from 'bedit'
import { create } from 'zustand'

const useStore = create(() => ({
  count: 0,
  user: { name: 'John', theme: 'light' },
  todos: [],
}))

// Beditify the store to enable bedit functions
const store = beditify(useStore)

// Use bedit functions directly on the store
edit(store).user.name('Jane')
edit(store).count((c) => c + 1)
edit(store).todos.push({ id: 1, text: 'Learn bedit' })

// Write your own helper functions as needed
const increment = (n: number) => {
  edit(store).count((c) => c + n)
}

const loadUser = async (userId: string) => {
  const user = await fetch(`/api/users/${userId}`).then((r) => r.json())
  edit(store).user(user)
}

increment(5)
await loadUser('user123')

// Your original useStore hook still works as usual
function MyComponent() {
  const count = useStore((s) => s.count)
  return <div>{count}</div>
}
```

## Custom State Container Integration

You can integrate bedit with any state container by implementing the `BeditStateContainer` interface. This allows bedit functions to work directly with your store.

See [Custom State Container Integration docs](./docs/custom-state-containers.md) for implementation details and examples.
