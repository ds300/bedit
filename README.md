# bedit

A tiny and crazy-fast immutable state utility for TypeScript.

```sh
npm install bedit
```

## Usage

Use `setIn` to immutably assign values within deeply-nested objects and arrays.

```ts
import { setIn } from 'bedit'
const appState = {
  todos: [
    { id: '1', title: 'Buy milk', completed: true },
    { id: '2', title: 'Clean the bath', completed: false },
  ],
  filter: 'all',
}
const newState = setIn(appState).todos[1].completed(true)
```

Use `updateIn` to compute new values.

```ts
import { updateIn } from 'bedit'
const newState2 = updateIn(appState).todos((todos) =>
  todos.filter((todo) => !todo.completed),
)
```

Use `mutateIn` to deeply clone a sub-object (with `structuredClone`) and mutate it.

```ts
import { mutateIn } from 'bedit'
const newState3 = mutateIn(appState).todos[1]((todo) => {
  // todo is a regular JavaScript object, not a Proxy.
  todo.completed = true
})
```

Use `shallowMutateIn` to shallowly clone a sub-object and mutate it.

```ts
import { shallowMutateIn } from 'bedit'
const newState3 = shallowMutateIn(appState).todos((todos) => {
  todos.pop()
})
```

Use `batchEdits` to group updates with minimal cloning.

```ts
const newState4 = batchEdits(appState, (appState) => {
  // appState is a normal JavaScript object, not a Proxy
  // It is shallowly cloned and safe to mutate at the top level
  appState.filter = 'all'

  // For nested updates, use the normal bedit functions.
  // The only difference is that you don't need to keep track of the return values.
  setIn(appState).todos[1].completed(true)
  setIn(appState).todos[2].completed(false)
  setIn(appState).todos[3].completed(true)
})
```
