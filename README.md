# bedit

A tiny and crazy-fast immutable state utility for TypeScript.

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

Use `updateIn` to compute new values.

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
  // todo is a normal JavaScript object, not a Proxy.
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
  console.log('Last todo', state.todos.at(-1))
  // => { id: '3', title: 'Buy bread', completed: false }
  setIn(state).filter('all')

  // For nested updates, use the normal bedit functions.
  // The only difference is that you don't need to keep track of the return values.
  setIn(state).todos[1].completed(true)
  setIn(state).todos[2].completed(false)
  setIn(state).todos[3].completed(true)
})
```
