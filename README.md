# bedit

A weird (but cool) immutable state utility for TypeScript.

It's like `immer` but:

- 📈 A billion times faster (slight exaggeration but spiritually true)
- 📉 A fraction of the size (1.9kB vs 13.8kB)
- 🕵️‍♀️ No Proxy getting in the way when you're trying to debug state changes.
- 💅 A more idiosyncratic API (peers will respect your 'unique' style).

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

Use `updateIn` to compute new values based on the current state.

```ts
import { updateIn } from 'bedit'
const nextState = updateIn(state).todos((todos) =>
  todos.filter((todo) => !todo.completed),
)
```

Use `mutateIn` to deeply clone a sub-object (with `structuredClone`) and mutate it.

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

Use `batchEdits` to group updates with minimal cloning.

```ts
const nextState = batchEdits(state, (state) => {
  // `state` is a normal JavaScript object, not a Proxy
  // To apply updates, use the normal bedit functions.
  // No need to keep track of the return values though.
  setIn(state).todos[1].completed(true)
  setIn(state).todos[2].completed(false)
  setIn(state).todos[3].completed(true)
})
```
