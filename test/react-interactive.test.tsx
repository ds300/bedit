import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { usePatchableState } from '../src/react.mjs'
import { patch, setDevMode } from '../src/patchfork.mjs'

setDevMode(true)

describe('usePatchforkState - Interactive Tests', () => {
  it('should update state when clicking buttons', async () => {
    function Counter() {
      const [state, store] = usePatchableState({ count: 0 })

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

  it('should handle complex nested state updates', async () => {
    function UserProfile() {
      const [state, store] = usePatchableState({
        user: { name: 'John', age: 25, active: true },
        settings: { theme: 'dark', notifications: false },
      })

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

  it('should handle array operations with interactive buttons', async () => {
    function TodoList() {
      const [state, store] = usePatchableState({
        todos: ['Learn React', 'Learn patchfork'],
        nextId: 3,
      })

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
              onClick={() => addTodo('New todo item')}
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
    expect(screen.getByTestId('count')).toHaveTextContent('2')
    expect(screen.getByTestId('todo-text-0')).toHaveTextContent('Learn React')
    expect(screen.getByTestId('todo-text-1')).toHaveTextContent(
      'Learn patchfork',
    )

    // Add a todo
    await user.click(screen.getByTestId('add-todo'))
    expect(screen.getByTestId('count')).toHaveTextContent('3')
    expect(screen.getByTestId('todo-text-2')).toHaveTextContent('New todo item')

    // Edit a todo
    await user.click(screen.getByTestId('edit-0'))
    expect(screen.getByTestId('todo-text-0')).toHaveTextContent(
      'Learn React (edited)',
    )

    // Remove a todo
    await user.click(screen.getByTestId('remove-1'))
    expect(screen.getByTestId('count')).toHaveTextContent('2')
    expect(screen.getByTestId('todo-text-1')).toHaveTextContent('New todo item')
  })

  it('should handle Set operations interactively', async () => {
    function TagManager() {
      const [state, store] = usePatchableState({
        tags: new Set(['react', 'javascript']),
        availableTags: ['react', 'javascript', 'typescript', 'node', 'vue'],
      })

      const addTag = (tag: string) => {
        patch(store).tags.add(tag)
      }

      const removeTag = (tag: string) => {
        patch(store).tags.delete(tag)
      }

      const clearTags = () => {
        patch(store).tags.clear()
      }

      return (
        <div data-testid="tag-manager">
          <div data-testid="current-tags">
            <span data-testid="tag-count">{state.tags.size}</span>
            {Array.from(state.tags).map((tag) => (
              <div key={tag} data-testid={`tag-${tag}`}>
                <span>{tag}</span>
                <button
                  data-testid={`remove-${tag}`}
                  onClick={() => removeTag(tag)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div data-testid="available-tags">
            {state.availableTags.map((tag) => (
              <button
                key={tag}
                data-testid={`add-${tag}`}
                onClick={() => addTag(tag)}
                disabled={state.tags.has(tag)}
              >
                Add {tag}
              </button>
            ))}
          </div>
          <button data-testid="clear-all" onClick={clearTags}>
            Clear All
          </button>
        </div>
      )
    }

    const user = userEvent.setup()
    render(<TagManager />)

    // Initial state
    expect(screen.getByTestId('tag-count')).toHaveTextContent('2')
    expect(screen.getByTestId('tag-react')).toBeInTheDocument()
    expect(screen.getByTestId('tag-javascript')).toBeInTheDocument()

    // Add typescript tag
    await user.click(screen.getByTestId('add-typescript'))
    expect(screen.getByTestId('tag-count')).toHaveTextContent('3')
    expect(screen.getByTestId('tag-typescript')).toBeInTheDocument()

    // Remove react tag
    await user.click(screen.getByTestId('remove-react'))
    expect(screen.getByTestId('tag-count')).toHaveTextContent('2')
    expect(screen.queryByTestId('tag-react')).not.toBeInTheDocument()

    // Clear all tags
    await user.click(screen.getByTestId('clear-all'))
    expect(screen.getByTestId('tag-count')).toHaveTextContent('0')
    expect(screen.queryByTestId('tag-javascript')).not.toBeInTheDocument()
    expect(screen.queryByTestId('tag-typescript')).not.toBeInTheDocument()
  })

  it('should handle Map operations with interactive updates', async () => {
    function ConfigManager() {
      const [state, store] = usePatchableState({
        config: new Map([
          ['theme', 'dark'],
          ['language', 'en'],
        ]),
      })

      const updateConfig = (key: string, value: string) => {
        patch(store).config.set(key, value)
      }

      const deleteConfig = (key: string) => {
        patch(store).config.delete(key)
      }

      const clearConfig = () => {
        patch(store).config.clear()
      }

      return (
        <div data-testid="config-manager">
          <div data-testid="config-items">
            <span data-testid="config-size">{state.config.size}</span>
            {Array.from(state.config.entries()).map(([key, value]) => (
              <div key={key} data-testid={`config-${key}`}>
                <span data-testid={`key-${key}`}>{key}</span>
                <span data-testid={`value-${key}`}>{value}</span>
                <button
                  data-testid={`delete-${key}`}
                  onClick={() => deleteConfig(key)}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
          <div data-testid="controls">
            <button
              data-testid="toggle-theme"
              onClick={() => {
                updateConfig(
                  'theme',
                  state.config.get('theme') === 'dark' ? 'light' : 'dark',
                )
              }}
            >
              Toggle Theme
            </button>
            <button
              data-testid="set-lang-es"
              onClick={() => updateConfig('language', 'es')}
            >
              Set Spanish
            </button>
            <button
              data-testid="add-debug"
              onClick={() => updateConfig('debug', 'true')}
            >
              Add Debug
            </button>
            <button data-testid="clear-all" onClick={clearConfig}>
              Clear All
            </button>
          </div>
        </div>
      )
    }

    const user = userEvent.setup()
    render(<ConfigManager />)

    // Initial state
    expect(screen.getByTestId('config-size')).toHaveTextContent('2')
    expect(screen.getByTestId('value-theme')).toHaveTextContent('dark')
    expect(screen.getByTestId('value-language')).toHaveTextContent('en')

    // Toggle theme
    await user.click(screen.getByTestId('toggle-theme'))
    expect(screen.getByTestId('value-theme')).toHaveTextContent('light')

    // Change language
    await user.click(screen.getByTestId('set-lang-es'))
    expect(screen.getByTestId('value-language')).toHaveTextContent('es')

    // Add debug config
    await user.click(screen.getByTestId('add-debug'))
    expect(screen.getByTestId('config-size')).toHaveTextContent('3')
    expect(screen.getByTestId('value-debug')).toHaveTextContent('true')

    // Delete theme config
    await user.click(screen.getByTestId('delete-theme'))
    expect(screen.getByTestId('config-size')).toHaveTextContent('2')
    expect(screen.queryByTestId('config-theme')).not.toBeInTheDocument()

    // Clear all
    await user.click(screen.getByTestId('clear-all'))
    expect(screen.getByTestId('config-size')).toHaveTextContent('0')
  })

  it('should handle batch updates with interactive controls', async () => {
    function BatchUpdater() {
      const [state, store] = usePatchableState({
        user: { name: 'John', age: 25, email: 'john@example.com' },
        stats: { posts: 0, likes: 0, comments: 0 },
      })

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
})
