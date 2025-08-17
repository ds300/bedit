# Zustand Integration

bedit integrates with [Zustand](https://zustand-demo.pmnd.rs/) stores by making them compatible with bedit functions.

## Usage

```typescript
import { beditify } from 'bedit/zustand'
import { create } from 'zustand'

const useStore = create(() => ({
  count: 0,
  user: { name: 'John' },
  todos: [],
}))

// Beditify the store to use bedit functions
const store = beditify(useStore)
```

You can now use bedit functions directly on the store:

```typescript
import { setIn, updateIn, addIn } from 'bedit'

setIn(store).count(42)
updateIn(store).user.name((name) => name.toUpperCase())
addIn(store).todos({ id: 1, text: 'Learn bedit' })
```

You can also write helper functions that operate on the store:

```typescript
const increment = (n: number) => {
  updateIn(store).count((c) => c + n)
}

const loadUser = async (userId: string) => {
  const user = await fetch(`/api/users/${userId}`).then((r) => r.json())
  setIn(store).user(user)
}
```

Your original useStore hook still works as usual.

```typescript
function MyComponent() {
  const count = useStore((s) => s.count)
  return (
    <div>
      The count is {count}.
      <button onClick={() => increment(1)}>Increment</button>
    </div>
  )
}
```

## Compatibility

- Works with both `create()` and `createStore()`
- Preserves all original zustand methods and behavior.
