# patchfork

A tiny, fast, and clever (derogatory) immutable state utility for TypeScript.

```sh
npm install patchfork
```

## Basic Usage

`patchfork` has two core functions: `patch` and `fork`.

### fork

The `fork` function 'forks' an immutable object, creating a new version with changes applied.

```ts
import { fork } from 'patchfork'

fork({ settings: { theme: 'light' } }).settings.theme('dark')
// => { settings: { theme: 'dark' } }

// Pass a function to update a value
fork({ user: { name: 'Nick Cave' } }).user.name(
  (name) => name.toUpperCase() + '!!!',
)
// => { user: { name: 'NICK CAVE!!!' } }

// Array, Map, and Set methods work as expected.
fork({ nums: [1, 2, 3] }).nums.push(4)
// => { nums: [1, 2, 3, 4] }
```

So it's kinda like Immer's `produce` function, but with a wacky API optimized for one-liners.

### patch

`patch` has the same interface as `fork`, but it operates on a state container to immutably update it.

Any state container with 'get' and 'set' operations [can be adapted to work with `patch`](./docs/custom-state-containers.md). We provide minimal adapters for [React useState](./docs/react.md), [Zustand](./docs/zustand.md), and [Jotai](./docs/jotai.md) (PRs welcome for others!).

```tsx
import { patch } from 'patchfork'
import { usePatchableState } from 'patchfork/react'

function App() {
  const [state, store] = usePatchableState({
    todos: [
      { text: 'Buy milk', completed: false },
      { text: 'Buy eggs', completed: false },
    ],
  })
  const addTodo = (text: string) => {
    const text = window.prompt('Enter a todo')
    if (text) {
      patch(store).todos.push({ text, completed: false })
    }
  }
  const toggleTodo = (index: number) => {
    patch(store).todos[index].completed((completed) => !completed)
  }

  return (
    <div>
      <button onClick={() => addTodo()}>Add</button>
      <ul>
        {state.todos.map((todo, i) => (
          <li key={i} onClick={() => toggleTodo(i)}>
            {todo.text}
          </li>
        ))}
      </ul>
    </div>
  )
}
```

## Batching operations

Use `fork.do` or `patch.do` to batch operations efficiently.

```ts
import { fork, patch } from 'patchfork'

const nextState = fork.do({ user: { name: 'Nick Cave', age: 50 } }, (state) => {
  // `state` is a shallow clone of the input object,
  // i.e. it's a regular JS object, not a Proxy.
  console.log(state) // { user: { name: 'Nick Cave', age: 50 } }
  // Call `patch(state)` to make changes.
  patch(state).user.name('Nicholas Cage')
  patch(state).user.age(51)

  // TypeScript will prevent you from doing unsafe mutation.
  // ❌ Error: Property 'age' is readonly
  state.user.age = 52
  // ❌ Error: state.user not patchable
  patch(state.user).name('Nicholas Cage')
})
```

## Optional chaining

`fork` and `patch` always do optional chaining. It works just like JavaScript optional chaining. i.e. the whole expression will evaluate to `undefined` if the operation can't be performed.

```ts
import { fork } from 'patchfork'

interface User {
  name?: string
  settings?: Map<string, string>
}
const user: User = {}

// 'assignment' operations on optional properties always execute.
fork(user).name('Joe')
// => { name: 'Joe' }
// TS type: User

// 'update' operations on optional properties will only execute if the property is not undefined.
fork(user).name((name) => name.toUpperCase())
// => undefined
// TS type: User | undefined

// Collection methods will only succeed if the collection is not undefined or null.
fork(user).settings.set('theme', 'dark')
// => undefined
// TS type: User | undefined
```

You can use the `??` operator to perform a fallback operation if the first fails.

```ts
const y =
  fork(user).name((name) => name.toUpperCase()) ?? fork(user).name('default')
// => { name: 'default' }
// TS type: User
```

### Updating values inside Maps

Maps allow keys of any type, so they need a separate syntax.

Use the special `key` symbol followed by the key itself in parentheses to operate on Map values.

```ts
import { key, fork } from 'patchfork'
const state = {
  users: new Map([['user1', { name: 'John', age: 30 }]]),
}

const nextState = fork(state).users[key]('user1').name('Wilberforce')
// => { users: new Map([['user1', { name: 'Wilberforce', age: 30 }]]) }
```

### Async operations

`patch` operations on `AsyncPatchable` (e.g. the [React useState](./docs/react.md) adapter) stores will always return a promise.

Additionally, `patch.do` and `fork.do` will return a promise if the callback is async.

If you are checking whether the return value is undefined to perform a fallback operation, remember to await the promise.

```ts
const updateTodo = async (title: string) => {
  ;(await patch.do(store).todos[0].title(title)) ??
    patch.do(store).todos.push({ title, completed: false })
}
```

## Advanced Usage

You can also use `fork.do` and `patch.do` on nested paths.

```ts
import { fork, patch } from 'patchfork'

const state = {
  user: {
    name: 'Nick Cave',
    settings: {
      theme: 'light',
      fontSize: 16,
    },
  },
}
const nextState = fork.do(state).user.settings((settings) => {
  patch(settings).theme('dark')
  patch(settings).fontSize(20)
})
```

### Freezing objects at development time

TypeScript should prevent unsafely mutating data within patchfork's draft functions if your data is well-typed and you don't use `as any` ! But who knows what might happen later, in the outside world. Shit's crazy out there.

For extra peace of mind, call `setDevMode(true)` early in your application's boot process to freeze objects at development time.

This will cause errors to be thrown if you try to mutate an object that is supposed to be immutable.

```ts
import { setDevMode } from 'patchfork'
if (process.env.NODE_ENV === 'development') {
  setDevMode(true)
}
```

### Custom State Container Integration

See [Custom State Container Integration docs](./docs/custom-state-containers.md) for implementation details and examples.

## Performance

`patchfork` seems to be:

- About 5x faster than `immer`'s production mode.
- About 3x faster than `mutative` (same API as `immer` but highly optimized)

<p align="center">
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://github.com/ds300/patchfork/raw/main/bench/bench.dark.svg#gh-dark-mode-only">
  <source media="(prefers-color-scheme: light)" srcset="https://github.com/ds300/patchfork/raw/main/bench/bench.light.svg#gh-light-mode-only">
  <img alt="Benchmarks" src="https://github.com/ds300/patchfork/raw/main/bench/bench.light.svg#gh-light-mode-only">
</picture>
</p>

The benchmarks could be more thorough so take this for what it's worth.

https://github.com/ds300/patchfork/tree/main/bench

## Limitations

- 🩹 No support for patch generation/application.
- 👭 It currently only with data supported by [`structuredClone`](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm) (So yes ✅ to `Map`, `Set`, plain objects, and arrays. And no ❌ to custom classes, objects with symbol keys or getters/setters, etc)
- It currently returns a new object even if an edit is ineffectual, e.g.

  ```ts
  const foo = { bar: 'baz' }
  const nextState = edit(foo).bar('baz')
  newState !== foo // sadly true
  ```

  This could be fixed partially for certain usage patterns (PRs welcome).
