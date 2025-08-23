# Jotai Integration

The `patchfork/jotai` module provides integration with [Jotai](https://jotai.org/) atoms.

## Usage

### `usePatchableAtom`

The `usePatchableAtom` hook wraps Jotai's `useAtom` to provide a patchfork-compatible store.

```tsx
import { atom } from 'jotai'
import { usePatchableAtom } from 'patchfork/jotai'
import { patch } from 'patchfork'

const userAtom = atom({ name: 'John', age: 30, settings: { theme: 'dark' } })

function UserProfile() {
  const [user, store] = usePatchableAtom(userAtom)

  const updateName = (newName: string) => {
    patch(store).name(newName)
  }

  const incrementAge = () => {
    patch(store).age(age => age + 1)
  }

  const toggleTheme = () => {
    patch(store).settings.theme(theme => 
      theme === 'dark' ? 'light' : 'dark'
    )
  }

  return (
    <div>
      <h1>{user.name}</h1>
      <p>Age: {user.age}</p>
      <p>Theme: {user.settings.theme}</p>
      <button onClick={() => updateName('Jane')}>Change Name</button>
      <button onClick={incrementAge}>Increment Age</button>
      <button onClick={toggleTheme}>Toggle Theme</button>
    </div>
  )
}
```

### Working with Arrays

```tsx
import { atom } from 'jotai'
import { usePatchableAtom } from 'patchfork/jotai'
import { patch } from 'patchfork'

const todosAtom = atom({
  todos: [
    { text: 'Buy milk', completed: false },
    { text: 'Buy eggs', completed: false },
  ]
})

function TodoList() {
  const [state, store] = usePatchableAtom(todosAtom)

  const addTodo = (text: string) => {
    patch(store).todos.push({ text, completed: false })
  }

  const toggleTodo = (index: number) => {
    patch(store).todos[index].completed(completed => !completed)
  }

  const removeTodo = (index: number) => {
    patch(store).todos.splice(index, 1)
  }

  return (
    <div>
      <button onClick={() => addTodo('New todo')}>Add Todo</button>
      <ul>
        {state.todos.map((todo, i) => (
          <li key={i}>
            <span 
              style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}
              onClick={() => toggleTodo(i)}
            >
              {todo.text}
            </span>
            <button onClick={() => removeTodo(i)}>×</button>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

### Batch Operations

Use `patch.do` for efficient batch updates:

```tsx
import { atom } from 'jotai'
import { usePatchableAtom } from 'patchfork/jotai'
import { patch } from 'patchfork'

const userAtom = atom({
  user: { name: 'John', age: 25, email: 'john@example.com' },
  stats: { posts: 0, likes: 0, comments: 0 }
})

function UserDashboard() {
  const [state, store] = usePatchableAtom(userAtom)

  const updateProfile = () => {
    patch.do(store, (draft) => {
      patch(draft).user.name('Jane Doe')
      patch(draft).user.age(30)
      patch(draft).user.email('jane@example.com')
    })
  }

  const incrementStats = () => {
    patch.do(store, (draft) => {
      patch(draft).stats.posts(state.stats.posts + 1)
      patch(draft).stats.likes(state.stats.likes + 5)
      patch(draft).stats.comments(state.stats.comments + 2)
    })
  }

  return (
    <div>
      <h2>{state.user.name}</h2>
      <p>Age: {state.user.age}</p>
      <p>Email: {state.user.email}</p>
      
      <div>
        <p>Posts: {state.stats.posts}</p>
        <p>Likes: {state.stats.likes}</p>
        <p>Comments: {state.stats.comments}</p>
      </div>

      <button onClick={updateProfile}>Update Profile</button>
      <button onClick={incrementStats}>Increment Stats</button>
    </div>
  )
}
```

### Working with Maps and Sets

```tsx
import { atom } from 'jotai'
import { usePatchableAtom } from 'patchfork/jotai'
import { patch, key } from 'patchfork'

const appStateAtom = atom({
  config: new Map([
    ['theme', 'dark'],
    ['language', 'en']
  ]),
  tags: new Set(['react', 'typescript'])
})

function AppSettings() {
  const [state, store] = usePatchableAtom(appStateAtom)

  const updateConfig = (configKey: string, value: string) => {
    patch(store).config.set(configKey, value)
  }

  const addTag = (tag: string) => {
    patch(store).tags.add(tag)
  }

  const removeTag = (tag: string) => {
    patch(store).tags.delete(tag)
  }

  return (
    <div>
      <h3>Config</h3>
      {Array.from(state.config.entries()).map(([key, value]) => (
        <div key={key}>
          {key}: {value}
          <button onClick={() => updateConfig(key, value === 'dark' ? 'light' : 'dark')}>
            Toggle
          </button>
        </div>
      ))}

      <h3>Tags</h3>
      {Array.from(state.tags).map((tag) => (
        <span key={tag}>
          {tag}
          <button onClick={() => removeTag(tag)}>×</button>
        </span>
      ))}
      <button onClick={() => addTag('jotai')}>Add Jotai Tag</button>
    </div>
  )
}
```

## API Reference

### `usePatchableAtom<T>(atom, options?)`

- **`atom`**: A Jotai `WritableAtom<T, Args, Result>`
- **`options`**: Optional Jotai `useAtom` options
- **Returns**: `[T, AsyncPatchable<T>]` - A tuple of the current atom value and a patchfork store

The returned store can be used with all patchfork functions (`patch`, `patch.do`, etc.) and supports async operations since Jotai atoms can be asynchronous.

## TypeScript Support

The integration provides full TypeScript support with proper type inference for nested object properties, arrays, Maps, and Sets. The types ensure that only valid property paths can be accessed and updated.

```tsx
const userAtom = atom({
  profile: { name: string, age: number },
  settings: { theme: 'dark' | 'light' }
})

function Example() {
  const [user, store] = usePatchableAtom(userAtom)
  
  // ✅ Type-safe property access
  patch(store).profile.name('New Name')
  patch(store).settings.theme('light')
  
  // ❌ TypeScript errors for invalid paths
  patch(store).profile.invalid('value')  // Error: Property 'invalid' does not exist
  patch(store).settings.theme('blue')    // Error: Argument not assignable to 'dark' | 'light'
}
```