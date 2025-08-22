# Custom State Container Integration

You can integrate patchfork with any state container by implementing the `Patchable` interface. This allows patchfork functions to work directly with your store:

```ts
import { $patchable, Patchable } from 'patchfork/symbols'
import { patch } from 'patchfork'

// Example: Custom Redux-like store
class CustomStore<T> implements Patchable<T> {
  private state: T
  private listeners = new Set<() => void>()

  constructor(initialState: T) {
    this.state = initialState
  }

  // Required by Patchable interface
  [$patchable] = {
    get: () => this.state,
    set: (newState: T) => {
      this.state = newState
      this.listeners.forEach((listener) => listener())
    },
  }

  // Your custom store methods
  getState = () => this.state
  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }
}

// Usage
const store = new CustomStore({
  count: 0,
  user: { name: 'John', preferences: { theme: 'dark' } },
})

// Now patchfork functions work directly with your store!
patch(store).count(42)
patch(store).user.name('Jane')
patch(store).user.preferences.theme((theme) =>
  theme === 'dark' ? 'light' : 'dark',
)

console.log(store.getState())
// { count: 42, user: { name: 'Jane', preferences: { theme: 'light' } } }
```

## Async State Containers

For asynchronous state containers, you can implement the `AsyncPatchable` interface instead. This is useful for stores that need to perform async operations when getting or setting state:

```ts
import { $asyncPatchable, AsyncPatchable } from 'patchfork/symbols'
import { patch } from 'patchfork'

// Example: Async store with persistence
class AsyncStore<T> implements AsyncPatchable<T> {
  private state: T
  private listeners = new Set<() => void>()

  constructor(initialState: T) {
    this.state = initialState
  }

  // Required by AsyncPatchable interface
  [$asyncPatchable] = {
    get: async () => {
      // Could load from IndexedDB, fetch from API, etc.
      await this.loadFromStorage()
      return this.state
    },
    set: async (newState: T) => {
      this.state = newState
      // Could persist to IndexedDB, sync to server, etc.
      await this.saveToStorage(newState)
      this.listeners.forEach((listener) => listener())
    },
  }

  private async loadFromStorage(): Promise<void> {
    // Simulate async loading
    await new Promise((resolve) => setTimeout(resolve, 10))
  }

  private async saveToStorage(state: T): Promise<void> {
    // Simulate async persistence
    await new Promise((resolve) => setTimeout(resolve, 10))
  }

  // Your custom store methods
  getState = () => this.state
  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }
}

// Usage with async stores
const asyncStore = new AsyncStore({
  data: { items: [], lastUpdated: null },
})

// patchfork functions work the same way - they handle the async operations automatically
await patch(asyncStore).data.items.push({ id: 1, name: 'Item 1' })
await patch(asyncStore).data.lastUpdated(new Date().toISOString())
```
