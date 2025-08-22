# Zustand Integration

patchfork integrates with [Zustand](https://zustand-demo.pmnd.rs/) stores by making them compatible with patchfork functions.

## Usage

```typescript
import { patchforkify } from 'patchfork/zustand'
import { create } from 'zustand'

const useStore = create(() => ({
  count: 0,
  user: { name: 'John' },
  todos: [],
}))

// Patchforkify the store to use patchfork functions
const store = patchforkify(useStore)
```

You can now use patchfork functions directly on the store:

```typescript
import { patch } from 'patchfork'

patch(store).count(42)
patch(store).user.name((name) => name.toUpperCase())
patch(store).todos.push({ id: 1, text: 'Learn patchfork' })
```

You can also write helper functions that operate on the store:

```typescript
const increment = (n: number) => {
  patch(store).count((c) => c + n)
}

const loadUser = async (userId: string) => {
  const user = await fetch(`/api/users/${userId}`).then((r) => r.json())
  patch(store).user(user)
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
