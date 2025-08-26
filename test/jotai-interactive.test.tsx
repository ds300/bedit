import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { atom } from 'jotai'
import { usePatchable, usePatchableAtom } from '../src/jotai.mjs'
import { patch, setDevMode } from '../src/patchfork.mjs'

setDevMode(true)

describe('Jotai + patchfork - Interactive Tests', () => {
  it('should update atom state when clicking buttons', async () => {
    const counterAtom = atom({ count: 0 })

    function Counter() {
      const [state, store] = usePatchable(counterAtom)

      const increment = () => {
        patch(store).count((count) => count + 1)
      }

      const decrement = () => {
        patch(store).count((count) => count - 1)
      }

      const reset = () => {
        patch(store).count(0)
      }

      return (
        <div data-testid="counter">
          <span data-testid="count">{state.count}</span>
          <button data-testid="increment" onClick={increment}>
            +
          </button>
          <button data-testid="decrement" onClick={decrement}>
            -
          </button>
          <button data-testid="reset" onClick={reset}>
            Reset
          </button>
        </div>
      )
    }

    const user = userEvent.setup()
    render(<Counter />)

    // Initial state
    expect(screen.getByTestId('count')).toHaveTextContent('0')

    // Click increment
    await user.click(screen.getByTestId('increment'))
    expect(screen.getByTestId('count')).toHaveTextContent('1')

    // Click increment again
    await user.click(screen.getByTestId('increment'))
    expect(screen.getByTestId('count')).toHaveTextContent('2')

    // Click decrement
    await user.click(screen.getByTestId('decrement'))
    expect(screen.getByTestId('count')).toHaveTextContent('1')

    // Click reset
    await user.click(screen.getByTestId('reset'))
    expect(screen.getByTestId('count')).toHaveTextContent('0')
  })

  it('should handle complex nested state updates with jotai atom', async () => {
    const userProfileAtom = atom({
      user: { name: 'John', age: 25, active: true },
      settings: { theme: 'dark', notifications: false },
    })

    function UserProfile() {
      const [state, store] = usePatchable(userProfileAtom)

      const updateName = (newName: string) => {
        patch(store).user.name(newName)
      }

      const incrementAge = () => {
        patch(store).user.age((age) => age + 1)
      }

      const toggleActive = () => {
        patch(store).user.active((active) => !active)
      }

      const toggleTheme = () => {
        patch(store).settings.theme((theme) =>
          theme === 'dark' ? 'light' : 'dark',
        )
      }

      const toggleNotifications = () => {
        patch(store).settings.notifications((notifications) => !notifications)
      }

      return (
        <div data-testid="user-profile">
          <div data-testid="user-info">
            <span data-testid="name">{state.user.name}</span>
            <span data-testid="age">{state.user.age}</span>
            <span data-testid="active">{String(state.user.active)}</span>
          </div>
          <div data-testid="settings-info">
            <span data-testid="theme">{state.settings.theme}</span>
            <span data-testid="notifications">
              {String(state.settings.notifications)}
            </span>
          </div>
          <div data-testid="controls">
            <button
              data-testid="change-name"
              onClick={() => updateName('Jane')}
            >
              Change Name
            </button>
            <button data-testid="increment-age" onClick={incrementAge}>
              Age++
            </button>
            <button data-testid="toggle-active" onClick={toggleActive}>
              Toggle Active
            </button>
            <button data-testid="toggle-theme" onClick={toggleTheme}>
              Toggle Theme
            </button>
            <button
              data-testid="toggle-notifications"
              onClick={toggleNotifications}
            >
              Toggle Notifications
            </button>
          </div>
        </div>
      )
    }

    const user = userEvent.setup()
    render(<UserProfile />)

    // Initial state
    expect(screen.getByTestId('name')).toHaveTextContent('John')
    expect(screen.getByTestId('age')).toHaveTextContent('25')
    expect(screen.getByTestId('active')).toHaveTextContent('true')
    expect(screen.getByTestId('theme')).toHaveTextContent('dark')
    expect(screen.getByTestId('notifications')).toHaveTextContent('false')

    // Change name
    await user.click(screen.getByTestId('change-name'))
    expect(screen.getByTestId('name')).toHaveTextContent('Jane')

    // Increment age
    await user.click(screen.getByTestId('increment-age'))
    expect(screen.getByTestId('age')).toHaveTextContent('26')

    // Toggle active
    await user.click(screen.getByTestId('toggle-active'))
    expect(screen.getByTestId('active')).toHaveTextContent('false')

    // Toggle theme
    await user.click(screen.getByTestId('toggle-theme'))
    expect(screen.getByTestId('theme')).toHaveTextContent('light')

    // Toggle notifications
    await user.click(screen.getByTestId('toggle-notifications'))
    expect(screen.getByTestId('notifications')).toHaveTextContent('true')
  })

  it('should handle array operations with jotai atom', async () => {
    const todoAtom = atom({
      todos: ['Learn React', 'Learn patchfork', 'Try Jotai'],
      nextId: 4,
    })

    function TodoList() {
      const [state, store] = usePatchable(todoAtom)

      const addTodo = (text: string) => {
        patch(store).todos.push(text)
      }

      const removeTodo = (index: number) => {
        patch(store).todos.splice(index, 1)
      }

      const updateTodo = (index: number, newText: string) => {
        patch(store).todos[index](newText)
      }

      return (
        <div data-testid="todo-list">
          <div data-testid="todos">
            {state.todos.map((todo, index) => (
              <div key={index} data-testid={`todo-${index}`}>
                <span data-testid={`todo-text-${index}`}>{todo}</span>
                <button
                  data-testid={`remove-${index}`}
                  onClick={() => removeTodo(index)}
                >
                  Remove
                </button>
                <button
                  data-testid={`edit-${index}`}
                  onClick={() => updateTodo(index, `${todo} (edited)`)}
                >
                  Edit
                </button>
              </div>
            ))}
          </div>
          <div data-testid="controls">
            <button
              data-testid="add-todo"
              onClick={() => addTodo('New jotai todo')}
            >
              Add Todo
            </button>
            <span data-testid="count">{state.todos.length}</span>
          </div>
        </div>
      )
    }

    const user = userEvent.setup()
    render(<TodoList />)

    // Initial state
    expect(screen.getByTestId('count')).toHaveTextContent('3')
    expect(screen.getByTestId('todo-text-0')).toHaveTextContent('Learn React')
    expect(screen.getByTestId('todo-text-1')).toHaveTextContent(
      'Learn patchfork',
    )
    expect(screen.getByTestId('todo-text-2')).toHaveTextContent('Try Jotai')

    // Add a todo
    await user.click(screen.getByTestId('add-todo'))
    expect(screen.getByTestId('count')).toHaveTextContent('4')
    expect(screen.getByTestId('todo-text-3')).toHaveTextContent(
      'New jotai todo',
    )

    // Edit a todo
    await user.click(screen.getByTestId('edit-0'))
    expect(screen.getByTestId('todo-text-0')).toHaveTextContent(
      'Learn React (edited)',
    )

    // Remove a todo
    await user.click(screen.getByTestId('remove-1'))
    expect(screen.getByTestId('count')).toHaveTextContent('3')
    expect(screen.getByTestId('todo-text-1')).toHaveTextContent('Try Jotai')
  })

  it('should handle batch updates with jotai atoms', async () => {
    const batchUpdateAtom = atom({
      user: { name: 'John', age: 25, email: 'john@example.com' },
      stats: { posts: 0, likes: 0, comments: 0 },
    })

    function BatchUpdater() {
      const [state, store] = usePatchable(batchUpdateAtom)

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

      const resetAll = () => {
        patch.do(store, (draft) => {
          patch(draft).user.name('Anonymous')
          patch(draft).user.age(0)
          patch(draft).user.email('')
          patch(draft).stats.posts(0)
          patch(draft).stats.likes(0)
          patch(draft).stats.comments(0)
        })
      }

      return (
        <div data-testid="batch-updater">
          <div data-testid="user-section">
            <span data-testid="name">{state.user.name}</span>
            <span data-testid="age">{state.user.age}</span>
            <span data-testid="email">{state.user.email}</span>
          </div>
          <div data-testid="stats-section">
            <span data-testid="posts">{state.stats.posts}</span>
            <span data-testid="likes">{state.stats.likes}</span>
            <span data-testid="comments">{state.stats.comments}</span>
          </div>
          <div data-testid="controls">
            <button data-testid="update-profile" onClick={updateProfile}>
              Update Profile
            </button>
            <button data-testid="increment-stats" onClick={incrementStats}>
              Increment Stats
            </button>
            <button data-testid="reset-all" onClick={resetAll}>
              Reset All
            </button>
          </div>
        </div>
      )
    }

    const user = userEvent.setup()
    render(<BatchUpdater />)

    // Initial state
    expect(screen.getByTestId('name')).toHaveTextContent('John')
    expect(screen.getByTestId('age')).toHaveTextContent('25')
    expect(screen.getByTestId('email')).toHaveTextContent('john@example.com')
    expect(screen.getByTestId('posts')).toHaveTextContent('0')
    expect(screen.getByTestId('likes')).toHaveTextContent('0')
    expect(screen.getByTestId('comments')).toHaveTextContent('0')

    // Update profile (batch operation)
    await user.click(screen.getByTestId('update-profile'))
    expect(screen.getByTestId('name')).toHaveTextContent('Jane Doe')
    expect(screen.getByTestId('age')).toHaveTextContent('30')
    expect(screen.getByTestId('email')).toHaveTextContent('jane@example.com')

    // Increment stats (batch operation)
    await user.click(screen.getByTestId('increment-stats'))
    expect(screen.getByTestId('posts')).toHaveTextContent('1')
    expect(screen.getByTestId('likes')).toHaveTextContent('5')
    expect(screen.getByTestId('comments')).toHaveTextContent('2')

    // Increment again
    await user.click(screen.getByTestId('increment-stats'))
    expect(screen.getByTestId('posts')).toHaveTextContent('2')
    expect(screen.getByTestId('likes')).toHaveTextContent('10')
    expect(screen.getByTestId('comments')).toHaveTextContent('4')

    // Reset all (batch operation)
    await user.click(screen.getByTestId('reset-all'))
    expect(screen.getByTestId('name')).toHaveTextContent('Anonymous')
    expect(screen.getByTestId('age')).toHaveTextContent('0')
    expect(screen.getByTestId('email')).toHaveTextContent('')
    expect(screen.getByTestId('posts')).toHaveTextContent('0')
    expect(screen.getByTestId('likes')).toHaveTextContent('0')
    expect(screen.getByTestId('comments')).toHaveTextContent('0')
  })

  it('should work with usePatchableAtom for store-only operations', async () => {
    const counterAtom = atom({ count: 0, name: 'Counter' })

    function CounterActions() {
      const store = usePatchableAtom(counterAtom)

      const increment = () => {
        patch(store).count((count) => count + 1)
      }

      const decrement = () => {
        patch(store).count((count) => count - 1)
      }

      const reset = () => {
        patch(store).count(0)
      }

      const changeName = () => {
        patch(store).name('Updated Counter')
      }

      return (
        <div data-testid="counter-actions">
          <button data-testid="increment" onClick={increment}>
            +
          </button>
          <button data-testid="decrement" onClick={decrement}>
            -
          </button>
          <button data-testid="reset" onClick={reset}>
            Reset
          </button>
          <button data-testid="change-name" onClick={changeName}>
            Change Name
          </button>
        </div>
      )
    }

    // We need a separate component to read the state since usePatchableAtom doesn't return it
    function CounterDisplay() {
      const [state] = usePatchable(counterAtom)
      return (
        <div data-testid="counter-display">
          <span data-testid="count">{state.count}</span>
          <span data-testid="name">{state.name}</span>
        </div>
      )
    }

    const user = userEvent.setup()
    render(
      <div>
        <CounterDisplay />
        <CounterActions />
      </div>,
    )

    // Initial state
    expect(screen.getByTestId('count')).toHaveTextContent('0')
    expect(screen.getByTestId('name')).toHaveTextContent('Counter')

    // Test increment
    await user.click(screen.getByTestId('increment'))
    expect(screen.getByTestId('count')).toHaveTextContent('1')

    // Test decrement
    await user.click(screen.getByTestId('decrement'))
    expect(screen.getByTestId('count')).toHaveTextContent('0')

    // Test reset
    await user.click(screen.getByTestId('increment'))
    await user.click(screen.getByTestId('increment'))
    expect(screen.getByTestId('count')).toHaveTextContent('2')
    await user.click(screen.getByTestId('reset'))
    expect(screen.getByTestId('count')).toHaveTextContent('0')

    // Test name change
    await user.click(screen.getByTestId('change-name'))
    expect(screen.getByTestId('name')).toHaveTextContent('Updated Counter')
  })

  it('should handle nested updates with usePatchableAtom', async () => {
    const userAtom = atom({
      profile: { name: 'John', age: 25 },
      settings: { theme: 'dark', notifications: true },
    })

    function UserActions() {
      const store = usePatchableAtom(userAtom)

      const updateName = () => {
        patch(store).profile.name('Jane')
      }

      const incrementAge = () => {
        patch(store).profile.age((age) => age + 1)
      }

      const toggleTheme = () => {
        patch(store).settings.theme((theme) =>
          theme === 'dark' ? 'light' : 'dark',
        )
      }

      const toggleNotifications = () => {
        patch(store).settings.notifications((notifications) => !notifications)
      }

      return (
        <div data-testid="user-actions">
          <button data-testid="update-name" onClick={updateName}>
            Update Name
          </button>
          <button data-testid="increment-age" onClick={incrementAge}>
            Age++
          </button>
          <button data-testid="toggle-theme" onClick={toggleTheme}>
            Toggle Theme
          </button>
          <button
            data-testid="toggle-notifications"
            onClick={toggleNotifications}
          >
            Toggle Notifications
          </button>
        </div>
      )
    }

    function UserDisplay() {
      const [state] = usePatchable(userAtom)
      return (
        <div data-testid="user-display">
          <span data-testid="name">{state.profile.name}</span>
          <span data-testid="age">{state.profile.age}</span>
          <span data-testid="theme">{state.settings.theme}</span>
          <span data-testid="notifications">
            {String(state.settings.notifications)}
          </span>
        </div>
      )
    }

    const user = userEvent.setup()
    render(
      <div>
        <UserDisplay />
        <UserActions />
      </div>,
    )

    // Initial state
    expect(screen.getByTestId('name')).toHaveTextContent('John')
    expect(screen.getByTestId('age')).toHaveTextContent('25')
    expect(screen.getByTestId('theme')).toHaveTextContent('dark')
    expect(screen.getByTestId('notifications')).toHaveTextContent('true')

    // Test name update
    await user.click(screen.getByTestId('update-name'))
    expect(screen.getByTestId('name')).toHaveTextContent('Jane')

    // Test age increment
    await user.click(screen.getByTestId('increment-age'))
    expect(screen.getByTestId('age')).toHaveTextContent('26')

    // Test theme toggle
    await user.click(screen.getByTestId('toggle-theme'))
    expect(screen.getByTestId('theme')).toHaveTextContent('light')
    await user.click(screen.getByTestId('toggle-theme'))
    expect(screen.getByTestId('theme')).toHaveTextContent('dark')

    // Test notifications toggle
    await user.click(screen.getByTestId('toggle-notifications'))
    expect(screen.getByTestId('notifications')).toHaveTextContent('false')
    await user.click(screen.getByTestId('toggle-notifications'))
    expect(screen.getByTestId('notifications')).toHaveTextContent('true')
  })
})
