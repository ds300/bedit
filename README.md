# bedit

A weird (and cool) immutable state utility for TypeScript.

It's like `immer` but:

- 📈 A billion times faster (slight exaggeration but emotionally true)
- 📉 A fraction of the size (2kB vs 12kB)
- 🕵️‍♀️ No Proxy getting in the way when you're trying to debug state changes.
- 💅 A more idiosyncratic API (LLMs will respect the flex).
- 👭 Works only with data supported by [`structuredClone`](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm) (So yes ✅ to `Map`, `Set`, `BigInt` etc. And no ❌ to class instances, objects with symbol keys or getters/setters, etc)

```sh
npm install bedit
```

## Usage

Use `setIn` to immutably assign values within deeply-nested objects and arrays.

```ts
import { setIn } from 'bedit'
const state = {
  todos: [
    { id: '1', title: 'Buy milk', completed: true },
    { id: '2', title: 'Clean the bath', completed: false },
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

Use `mutateIn` to clone a sub-object (with `structuredClone`) and mutate it.

```ts
import { mutateIn } from 'bedit'
const nextState = mutateIn(state).todos[1]((todo) => {
  // `todo` is a normal JavaScript object, not a Proxy.
  todo.completed = true
})
```

Use `shallowMutateIn` to shallowly clone a sub-object and mutate it.

```ts
import { shallowMutateIn } from 'bedit'
const nextState = shallowMutateIn(state).todos((todos) => {
  todos.pop()
})
```

Use `deleteIn` to immutably delete properties from objects or remove elements from arrays.

```ts
import { deleteIn } from 'bedit'
// For arrays, it uses .splice(index, 1) instead of the `delete` operator,
// to avoid leaving a hole in the array.
const nextState = deleteIn(state).todos[0]()
```

Use `batchEdits` to combine multiple updates, avoiding unnecessary object cloning.

```ts
const nextState = batchEdits(state, (state) => {
  // To apply batched edits, use the normal bedit functions.
  setIn(state).todos[1].completed(true)
  // The `todos` array was cloned by the setIn call, so this mutateIn will reuse the clone.
  mutateIn(state).todos((todos) => {
    todos.push({ id: '4', title: 'Buy bread', completed: false })
  })

  // `state` is a normal JavaScript object, and always up to date.
  if (state.todos.length > 3) {
    console.log('wtf!!!', state.todos[3])
    // => wtf!!! { id: '4', title: 'Buy bread', completed: false }
  }
})
```

## Maps

Use `map.key(k)` instead of `map[k]` to update/delete a `Map` value.

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

## Freezing objects at development time

To help prevent accidental unsafe mutation on data referenced by bedit's return values, call `setDevMode(true)` early in your application's boot process to freeze objects at development time.

This will cause errors to be thrown when you try to mutate an object that is supposed to be immutable.

```ts
import { setDevMode } from 'bedit'
if (process.env.NODE_ENV === 'development') {
  setDevMode(true)
}
```
