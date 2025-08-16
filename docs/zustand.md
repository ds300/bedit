# Zustand Integration

bedit provides seamless integration with [Zustand](https://zustand-demo.pmnd.rs/), allowing you to use bedit functions directly on stores and define custom mutator functions (both sync and async) with automatic type inference.

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
    const idx = draft.todos.findIndex(t => t.id === id)
    if (idx !== -1) {
      updateIn(draft).todos[idx].completed(c => !c)
    }
  }
})

// Call your custom functions directly
store.increment(5)
store.updateTheme('dark')
store.addTodo('Learn TypeScript')
store.toggleTodo('1')
```

## Async Mutator Functions

bedit fully supports async operations in mutator functions. This is perfect for handling API calls, data fetching, or any asynchronous operations:

```typescript
const store = beditify(useStore, {
  // Async mutator function
  async loadUser(draft, userId: string) {
    draft.loading = true
    draft.error = null
    
    try {
      const user = await fetch(`/api/users/${userId}`).then(r => r.json())
      setIn(draft).user(user)
      draft.loading = false
    } catch (error) {
      draft.error = error.message
      draft.loading = false
    }
  },
  
  async addTodoFromAPI(draft, title: string) {
    const todo = await fetch('/api/todos', {
      method: 'POST',
      body: JSON.stringify({ title }),
      headers: { 'Content-Type': 'application/json' }
    }).then(r => r.json())
    
    addIn(draft).todos(todo)
  },
  
  // Mix async and sync operations
  async batchUpdate(draft, updates: string[]) {
    setIn(draft).count(0) // Sync operation
    
    for (const update of updates) {
      await new Promise(resolve => setTimeout(resolve, 100)) // Simulate delay
      updateIn(draft).count(c => c + 1) // Update count after each operation
    }
  }
})

// Async functions return promises
await store.loadUser('user123')
await store.addTodoFromAPI('New task from server')
await store.batchUpdate(['a', 'b', 'c'])

// Handle errors with try/catch
try {
  await store.loadUser('invalid-id')
} catch (error) {
  console.error('Failed to load user:', error)
}

// Note: If an async mutator throws an unhandled error, 
// the store state remains unchanged and the error is propagated
const store = beditify(useStore, {
  async riskyOperation(draft, data: any) {
    // If this throws, store state won't be modified
    const result = await someRiskyApiCall(data) 
    setIn(draft).result(result)
  }
})

try {
  await store.riskyOperation(badData) // May throw
} catch (error) {
  // Store state is unchanged, error is caught here
  console.log('Operation failed, store state preserved')
}
```

## Mixing Approaches

You can freely combine custom mutators with direct bedit functions:

```typescript
const store = beditify(useStore, {
  reset(draft) {
    draft.count = 0
    setIn(draft).todos([])
  },
  
  async syncWithServer(draft) {
    const data = await fetch('/api/sync').then(r => r.json())
    setIn(draft).user(data.user)
    setIn(draft).todos(data.todos)
  }
})

// Mix all approaches seamlessly
store.reset()                           // Custom sync mutator
setIn(store).user.name('Alice')        // Direct bedit function
await store.syncWithServer()            // Custom async mutator
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

bedit provides excellent TypeScript support with full type safety:

- **Automatic type inference** - No need to annotate `draft` parameter types
- **Full type safety** - All mutations are type-checked at compile time  
- **Async/sync function detection** - Return types automatically inferred
- **Works with both `create()` and `createStore()`**

```typescript
const store = beditify(useStore, {
  // Sync function - returns void
  updateUser(draft, name: string, theme: 'light' | 'dark') {
    // draft is automatically typed as Editable<State>
    draft.user.name = name        // ❌ TypeScript error - use bedit functions for nested
    setIn(draft).user.name(name)  // ✅ Correct
    setIn(draft).user.theme(theme) // ✅ Fully type-checked
  },
  
  // Async function - returns Promise<void>
  async loadData(draft, id: string) {
    const data = await fetchData(id) // TypeScript knows this returns Promise<void>
    setIn(draft).user(data.user)
  }
})

store.updateUser('Bob', 'dark')      // ✅ Type-safe sync call
await store.loadData('123')          // ✅ Type-safe async call  
store.updateUser(123, 'invalid')     // ❌ TypeScript errors
const result = store.loadData('123') // ✅ result is typed as Promise<void>
```

## Key Features

- **🔄 Direct bedit integration** - Use `setIn`, `updateIn`, `addIn`, `deleteIn` directly on stores
- **🎯 Custom mutators** - Define reusable, type-safe mutation functions
- **⚡ Async support** - Full support for async operations with proper Promise handling
- **📝 TypeScript first** - Automatic type inference and compile-time safety
- **🏪 Zustand compatibility** - Works with both `create()` and `createStore()`
- **🔧 Zero overhead** - All original store methods preserved
