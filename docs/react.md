# React Integration

Patchfork provides a minimal wrapper for react's `useState` hook that allows you to use patchfork's immutable update functions.

## usePatchableState Hook

The `usePatchableState` hook works like React's `useState` but returns a patchable store that integrates with patchfork's `patch` function.

```ts
import { usePatchableState } from 'patchfork/react'
import { patch } from 'patchfork'

function MyComponent() {
  const [state, store] = usePatchableState({ count: 0, name: 'John' })

  const increment = () => {
    patch(store).count(count => count + 1)
  }

  const updateName = (newName: string) => {
    patch(store).name(newName)
  }

  return (
    <div>
      <p>Count: {state.count}</p>
      <p>Name: {state.name}</p>
      <button onClick={increment}>+</button>
      <button onClick={() => updateName('Jane')}>Change Name</button>
    </div>
  )
}
```

## Hook Signature

```ts
function usePatchableState<T extends object>(
  init: T | (() => T),
): [T, AsyncPatchable<T>]
```

- **Parameters**:
  - `init`: Initial state value or a function that returns the initial state
- **Returns**: A tuple containing:
  - `state`: The current state (like `useState`)
  - `store`: A patchable store that implements `AsyncPatchable<T>`

## Supported Data Types

The hook supports all object types that patchfork can work with:

### Objects

```ts
const [state, store] = usePatchableState({
  user: { name: 'John', age: 25 },
  settings: { theme: 'dark' },
})

// Update nested properties
patch(store).user.name('Jane')
patch(store).user.age((age) => age + 1)
patch(store).settings.theme('light')
```

### Arrays

```ts
const [todos, store] = usePatchableState([
  { id: 1, text: 'Learn React', done: false },
])

// Add items
patch(store).push({ id: 2, text: 'Learn Patchfork', done: false })

// Update items
patch(store)[0].done(true)
```

### Maps

```ts
const [state, store] = usePatchableState({
  data: new Map([['key1', 'value1']]),
})

// Update map entries
patch(store).data[key]('key1')('new value')
patch(store).data[key]('key2')('another value')
```

### Sets

```ts
const [state, store] = usePatchableState({
  tags: new Set(['react', 'typescript']),
})

// Add to set
patch(store).tags.add('patchfork')

// Remove from set
patch(store).tags.delete('react')
```

## Function Initialization

Like `useState`, you can pass a function to initialize state:

```ts
const [state, store] = usePatchableState(() => ({
  expensive: computeExpensiveInitialValue(),
  timestamp: Date.now(),
}))
```

## Real-World Examples

### Todo List

```ts
interface Todo {
  id: number
  text: string
  done: boolean
}

function TodoApp() {
  const [state, store] = usePatchableState({
    todos: [] as Todo[],
    filter: 'all' as 'all' | 'active' | 'completed'
  })

  const addTodo = (text: string) => {
    const newTodo = {
      id: Date.now(),
      text,
      done: false
    }
    patch(store).todos.push(newTodo)
  }

  const toggleTodo = (id: number) => {
    const index = state.todos.findIndex(todo => todo.id === id)
    if (index !== -1) {
      patch(store).todos[index].done(done => !done)
    }
  }

  const setFilter = (filter: typeof state.filter) => {
    patch(store).filter(filter)
  }

  return (
    <div>
      <input
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            addTodo(e.currentTarget.value)
            e.currentTarget.value = ''
          }
        }}
        placeholder="Add todo..."
      />

      {state.todos.map(todo => (
        <div key={todo.id}>
          <input
            type="checkbox"
            checked={todo.done}
            onChange={() => toggleTodo(todo.id)}
          />
          <span style={{ textDecoration: todo.done ? 'line-through' : 'none' }}>
            {todo.text}
          </span>
        </div>
      ))}

      <div>
        <button onClick={() => setFilter('all')}>All</button>
        <button onClick={() => setFilter('active')}>Active</button>
        <button onClick={() => setFilter('completed')}>Completed</button>
      </div>
    </div>
  )
}
```

### User Profile Form

```ts
function UserProfile() {
  const [state, store] = usePatchableState({
    user: {
      name: '',
      email: '',
      preferences: {
        theme: 'light' as 'light' | 'dark',
        notifications: true
      }
    },
    isEditing: false
  })

  const updateField = <K extends keyof typeof state.user>(
    field: K,
    value: typeof state.user[K]
  ) => {
    patch(store).user[field](value)
  }

  const toggleEditing = () => {
    patch(store).isEditing(editing => !editing)
  }

  const toggleTheme = () => {
    patch(store).user.preferences.theme(theme =>
      theme === 'light' ? 'dark' : 'light'
    )
  }

  return (
    <div>
      {state.isEditing ? (
        <form>
          <input
            value={state.user.name}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder="Name"
          />
          <input
            value={state.user.email}
            onChange={(e) => updateField('email', e.target.value)}
            placeholder="Email"
          />
          <button type="button" onClick={toggleEditing}>
            Save
          </button>
        </form>
      ) : (
        <div>
          <h2>{state.user.name}</h2>
          <p>{state.user.email}</p>
          <button onClick={toggleEditing}>Edit</button>
        </div>
      )}

      <div>
        <label>
          <input
            type="checkbox"
            checked={state.user.preferences.notifications}
            onChange={(e) =>
              patch(store).user.preferences.notifications(e.target.checked)
            }
          />
          Enable notifications
        </label>
      </div>

      <button onClick={toggleTheme}>
        Switch to {state.user.preferences.theme === 'light' ? 'dark' : 'light'} theme
      </button>
    </div>
  )
}
```

## Error Handling

The hook will throw an error if you try to use it with non-object types:

```ts
// ❌ These will throw errors:
usePatchableState('string') // Error: must be object, array, map, or set
usePatchableState(42) // Error: must be object, array, map, or set
usePatchableState(true) // Error: must be object, array, map, or set
usePatchableState(null) // Error: must be object, array, map, or set

// ✅ These work:
usePatchableState({}) // Object
usePatchableState([]) // Array
usePatchableState(new Map()) // Map
usePatchableState(new Set()) // Set
```

## Performance Notes

- The hook uses `useMemo` internally to create a stable store reference
- State updates trigger React re-renders as expected
- The hook implements `AsyncPatchable` so all patchfork operations work with `await`
- Like `useState`, the hook preserves referential stability for the store across re-renders
