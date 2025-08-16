# Custom State Container Integration

You can integrate bedit with any state container by implementing the `BeditStateContainer` interface. This allows bedit functions to work directly with your store:

```ts
import { $beditStateContainer, BeditStateContainer } from 'bedit/symbols'
import { setIn, updateIn } from 'bedit'

// Example: Custom Redux-like store
class CustomStore<T> implements BeditStateContainer<T> {
  private state: T
  private listeners = new Set<() => void>()

  constructor(initialState: T) {
    this.state = initialState
  }

  // Required by BeditStateContainer interface
  [$beditStateContainer] = {
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

// Now bedit functions work directly with your store!
setIn(store).count(42)
setIn(store).user.name('Jane')
updateIn(store).user.preferences.theme((theme) =>
  theme === 'dark' ? 'light' : 'dark',
)

console.log(store.getState())
// { count: 42, user: { name: 'Jane', preferences: { theme: 'light' } } }
```

## Interface Requirements

The `BeditStateContainer` interface requires:

- A symbol property `[$beditStateContainer]` with `get()` and `set(newState)` methods
- Import the symbol and interface from `'bedit/symbols'`

This pattern works with any state management library - Redux, MobX, custom stores, etc.

## Implementation Details

### The Symbol Property

The `$beditStateContainer` symbol serves as a private interface that bedit uses to interact with your store. It should contain:

- `get()` - Returns the current state
- `set(newState)` - Updates the state and triggers any necessary side effects (like notifying subscribers)

### TypeScript Support

The interface is fully typed, so you'll get complete type safety when using bedit functions with your custom store.

### Performance Considerations

Since bedit works by creating shallow clones and applying changes, your `set` method will be called with a new state object. This integrates well with most reactive state management patterns that rely on object identity changes for change detection.