# bedit

A weird (and cool) immutable state utility for TypeScript.

It's like `immer` but:

- 🕵️‍♀️ No Proxy instances getting in the way when you're trying to debug stuff.
- 📉 Tiny (2kB minified)
- 📈 A billion times faster (exaggeration but emotionally true)
- 💅 An "innovative" API (your LLM agent will appreciate the challenge)

## Installation

```sh
npm install bedit
```

## Usage

Use `setIn` to immutably assign values within deeply-nested objects and arrays.

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

Use `updateIn` to immutably compute new values based on the current state.

```ts
import { updateIn } from 'bedit'
const nextState = updateIn(state).todos((todos) =>
  todos.filter((todo) => !todo.completed),
)
```

Use `mutateIn` to shallowly clone a sub-object and mutate it.

```ts
import { mutateIn } from 'bedit'
const nextState = mutateIn(state).user((user) => {
  user.name = 'Nicholas Cage'

  // ❌ Type error: `theme` is readonly
  user.preferences.theme = 'light'
})
```

Use `deepMutateIn` to fully clone a sub-object (with `structuredClone`) and mutate it.

```ts
import { deepMutateIn } from 'bedit'
const nextState = deepMutateIn(state).user((user) => {
  user.name = 'Nicholas Cage'

  // ✅ `theme` is safe to mutate
  user.preferences.theme = 'light'
})
```

Use `deleteIn` to immutably delete properties from objects or remove elements from arrays.

```ts
import { deleteIn } from 'bedit'
// For arrays, it uses .splice(index, 1) instead of the `delete` operator,
// to avoid leaving a hole in the array.
const nextState = deleteIn({ nums: [1, 2, 3] }).nums[1]()
// => { nums: [1, 3] }
```

Use `batchEdits` to keep allocations minimal across multiple updates.

```ts
const nextState = batchEdits(state, (draft) => {
  // To apply batched edits, use the normal bedit functions.
  setIn(draft).todos[1].completed(true)
  // The `todos` array was already cloned shallowly by the `setIn` call, so this `mutateIn` call will reuse the existing clone.
  mutateIn(draft).todos((todos) => {
    todos.push({ id: '4', title: 'Buy bread', completed: false })
  })

  // `draft` is a normal JavaScript object, and always up to date.
  // It's even safe to retain references as long as you treat them as immutable.
  if (draft.todos.length > 3) {
    console.log('wtf!!!', draft.todos[3])
    // => wtf!!! { id: '4', title: 'Buy bread', completed: false }
  }
})
```

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
state = deleteIn(state).users.key('user2')()
```

`mutateIn` works well for adding and removing entries.

```ts
state = mutateIn(state).users((users) => {
  users.set('user3', { name: 'Billy Bob', age: 30 })
  users.delete('user2')
})
```

## Sets

Use `mutateIn` to add/remove `Set` elements.

```ts
let state = {
  users: new Set(['user1', 'user2']),
}

state = mutateIn(state).users((users) => {
  users.add('user3')
  users.delete('user2')
})
```

## Freezing objects at development time

TypeScript should catch most of the situations where you might accidentally mutate data within bedit's mutator functions. However we don't control whether the types you pass in are deeply readonly or not. And you might write type-unsafe code!

To help prevent accidental unsafe mutation, call `setDevMode(true)` early in your application's boot process to freeze objects at development time.

This will cause errors to be thrown when you try to mutate an object that is supposed to be immutable.

```ts
import { setDevMode } from 'bedit'
if (process.env.NODE_ENV === 'development') {
  setDevMode(true)
}
```

## Limitations

- 👭 Works only with data supported by [`structuredClone`](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm) (So yes ✅ to `Map`, `Set`, plain objects, and arrays. And no ❌ to custom classes, objects with symbol keys or getters/setters, etc)
- 🩹 No support for patch generation/application.

# Performance

`bedit` seems to be:

- About 5x faster than `immer`'s production mode.
- About 3x faster than `mutative` (same API as `immer` but highly optimized)

<div style="text-align: center; transform: scale(.5);">
  <img alt="Benchmarks" src="https://github.com/ds300/bedit/raw/main/bench/bench.svg" />
</div>

The benchmarks could be more thorough so take this for what it's worth.

https://github.com/ds300/bedit/tree/main/bench
