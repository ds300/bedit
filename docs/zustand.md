# Zustand Integration

bedit provides seamless integration with [Zustand](https://zustand-demo.pmnd.rs/), allowing you to use bedit functions directly on stores and define custom mutator functions with automatic type inference.

## Installation

```bash
npm install bedit zustand
```

## Basic Usage

```typescript
import { beditify } from 'bedit/zustand'
import { setIn, updateIn, deleteIn, addIn } from 'bedit'
import { create } from 'zustand'

interface State {
  count: number
  user: { name: string; theme: 'light' | 'dark' }
  todos: Array<{ id: string; title: string; completed: boolean }>
}

const useStore = create<State>(() => ({
  count: 0,
  user: { name: 'John', theme: 'light' },
  todos: [],
}))

const store = beditify(useStore)

// Use bedit functions directly on the store
setIn(store).user.name('Jane')
updateIn(store).count(c => c + 1)
addIn(store).todos({ id: '1', title: 'Learn bedit', completed: false })
```

## Custom Mutator Functions

Define type-safe mutator functions with automatic type inference:

```typescript
const store = beditify(useStore, {
  // TypeScript automatically infers draft type - no annotations needed!
  increment(draft, n: number) {
    draft.count += n  // Top-level mutations allowed
  },
  
  updateTheme(draft, theme: 'light' | 'dark') {
    setIn(draft).user.theme(theme)  // Use bedit for nested mutations
  },
  
  addTodo(draft, title: string) {
    const id = crypto.randomUUID()
    addIn(draft).todos({ id, title, completed: false })
  },
  
  toggleTodo(draft, id: string) {
    const todo = draft.todos.find(t => t.id === id)
    if (todo) {
      updateIn(draft).todos.find(t => t.id === id).completed(c => !c)
    }
  }
})

// Call your custom functions directly
store.increment(5)
store.updateTheme('dark')
store.addTodo('Learn TypeScript')
store.toggleTodo('1')
```

## Both Approaches Work Together

```typescript
const store = beditify(useStore, {
  reset(draft) {
    draft.count = 0
    setIn(draft).todos([])
  }
})

// Mix custom mutators with direct bedit functions
store.reset()                           // Custom mutator
setIn(store).user.name('Alice')        // Direct bedit function
store.addTodo('New task')              // Custom mutator
updateIn(store).count(c => c + 10)     // Direct bedit function
```

## Preserved Store Properties

All original Zustand methods remain available:

```typescript
store.getState()    // ✅ Original Zustand method
store.setState()    // ✅ Original Zustand method  
store.subscribe()   // ✅ Original Zustand method
```

## TypeScript Support

- **Automatic type inference** - No need to annotate `draft` parameter types
- **Full type safety** - All mutations are type-checked
- **Works with both `create()` and `createStore()`**

```typescript
const store = beditify(useStore, {
  updateUser(draft, name: string, theme: 'light' | 'dark') {
    // draft is automatically typed as Editable<State>
    draft.user.name = name        // ❌ TypeScript error - use bedit functions for nested
    setIn(draft).user.name(name)  // ✅ Correct
    setIn(draft).user.theme(theme) // ✅ Fully type-checked
  }
})

store.updateUser('Bob', 'dark')  // ✅ Type-safe function call
store.updateUser(123, 'invalid') // ❌ TypeScript errors
```
