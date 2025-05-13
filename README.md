# bedit

Silly (but lowkey kinda good?) idea for a immer-like tool that is super lightweight (and probably faster?) but most importantly doesn't pollute your stack frames with Proxies.

## Example

```ts
type Todo = {
  id: string;
  title: string;
  completed: boolean;
};

type AppState = {
  todos: Todo[];
  filter: "all" | "active" | "completed";
};

const baseState: AppState = {
  todos: [
    { id: "1", title: "Buy milk", completed: false },
    { id: "2", title: "Clean the bath", completed: false },
  ],
  filter: "all",
};
```

### immer

```ts
const nextState = produce(baseState, (draft) => {
  // draft is a proxy (boo)
  draft.todos[1].completed = true;
});
```

### bedit

```ts
const nextState2 = edit(baseState).todos[1]((todo) => {
  // todo is a regular ass JS object, via structuredClone
  todo.completed = true;
});

// or just
const nextState3 = edit(baseState).todos[1].completed(true);
```

## Drawbacks

The main api issue is that it does a deep `structuredClone` on the target object by default, so if you want to do minimum copying while making multiple edits you'd need to be aware of the `shallow` option.

```ts
const nextState4 = edit(baseState, {shallow: true})(state => {
  state.filer = 'active'
  state.todos = edit(state.todos)[0].completed(true)
})
```

It's also just a little weird as an API, but I reckon people would get used to it pretty quickly. Plus with TS and Object.freeze at dev time I reckon it could be pretty on-rails?