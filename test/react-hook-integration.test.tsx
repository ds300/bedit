import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useBeditState } from '../dist/react.mjs'
import { $beditStateContainer } from '../src/symbols.mjs'
import { setDevMode } from '../src/bedit.mjs'

setDevMode(true)

describe('React Hook Integration - Final Tests', () => {
  it('should successfully integrate useBeditState with React components', () => {
    function TestComponent() {
      // Test all major data types
      const objectState = useBeditState({ count: 0, name: 'test' })
      const arrayState = useBeditState([1, 2, 3])
      const setStateState = useBeditState({ tags: new Set(['a', 'b']) })
      const mapState = useBeditState({ data: new Map([['key', 'value']]) })
      
      return (
        <div data-testid="integration-test">
          {/* Object state */}
          <div data-testid="object-section">
            <span data-testid="count">{objectState.count}</span>
            <span data-testid="name">{objectState.name}</span>
            <span data-testid="object-has-container">{String($beditStateContainer in objectState)}</span>
          </div>
          
          {/* Array state */}
          <div data-testid="array-section">
            <span data-testid="array-length">{arrayState.length}</span>
            <span data-testid="array-items">{arrayState.join(',')}</span>
            <span data-testid="array-has-container">{String($beditStateContainer in arrayState)}</span>
          </div>
          
          {/* Set state */}
          <div data-testid="set-section">
            <span data-testid="set-size">{setStateState.tags.size}</span>
            <span data-testid="set-has-a">{String(setStateState.tags.has('a'))}</span>
            <span data-testid="set-has-container">{String($beditStateContainer in setStateState)}</span>
          </div>
          
          {/* Map state */}
          <div data-testid="map-section">
            <span data-testid="map-size">{mapState.data.size}</span>
            <span data-testid="map-value">{mapState.data.get('key')}</span>
            <span data-testid="map-has-container">{String($beditStateContainer in mapState)}</span>
          </div>
        </div>
      )
    }
    
    render(<TestComponent />)
    
    // Verify object state integration
    expect(screen.getByTestId('count')).toHaveTextContent('0')
    expect(screen.getByTestId('name')).toHaveTextContent('test')
    expect(screen.getByTestId('object-has-container')).toHaveTextContent('true')
    
    // Verify array state integration
    expect(screen.getByTestId('array-length')).toHaveTextContent('3')
    expect(screen.getByTestId('array-items')).toHaveTextContent('1,2,3')
    expect(screen.getByTestId('array-has-container')).toHaveTextContent('true')
    
    // Verify Set state integration
    expect(screen.getByTestId('set-size')).toHaveTextContent('2')
    expect(screen.getByTestId('set-has-a')).toHaveTextContent('true')
    expect(screen.getByTestId('set-has-container')).toHaveTextContent('true')
    
    // Verify Map state integration
    expect(screen.getByTestId('map-size')).toHaveTextContent('1')
    expect(screen.getByTestId('map-value')).toHaveTextContent('value')
    expect(screen.getByTestId('map-has-container')).toHaveTextContent('true')
  })

  it('should handle function initializers', () => {
    function TestComponent() {
      const state1 = useBeditState(() => ({ initialized: true, value: 42 }))
      const state2 = useBeditState(() => ['func', 'init', 'array'])
      
      return (
        <div data-testid="function-init-test">
          <span data-testid="func-initialized">{String(state1.initialized)}</span>
          <span data-testid="func-value">{state1.value}</span>
          <span data-testid="func-array">{state2.join('-')}</span>
          <span data-testid="func-has-container">{String($beditStateContainer in state1)}</span>
        </div>
      )
    }
    
    render(<TestComponent />)
    
    expect(screen.getByTestId('func-initialized')).toHaveTextContent('true')
    expect(screen.getByTestId('func-value')).toHaveTextContent('42')
    expect(screen.getByTestId('func-array')).toHaveTextContent('func-init-array')
    expect(screen.getByTestId('func-has-container')).toHaveTextContent('true')
  })

  it('should properly reject primitive values', () => {
    function StringComponent() {
      const state = useBeditState('invalid' as any)
      return <div>{state}</div>
    }
    
    function NumberComponent() {
      const state = useBeditState(42 as any)  
      return <div>{state}</div>
    }
    
    function BoolComponent() {
      const state = useBeditState(true as any)
      return <div>{state}</div>
    }
    
    function NullComponent() {
      const state = useBeditState(null as any)
      return <div>{state}</div>
    }
    
    expect(() => render(<StringComponent />)).toThrow('useBeditState can only be used with objects, arrays, maps, or sets.')
    expect(() => render(<NumberComponent />)).toThrow('useBeditState can only be used with objects, arrays, maps, or sets.')
    expect(() => render(<BoolComponent />)).toThrow('useBeditState can only be used with objects, arrays, maps, or sets.')
    expect(() => render(<NullComponent />)).toThrow('useBeditState can only be used with objects, arrays, maps, or sets.')
  })

  it('should work with complex nested structures', () => {
    function TestComponent() {
      const state = useBeditState({
        user: {
          profile: { name: 'John', age: 30 },
          settings: { theme: 'dark', notifications: true }
        },
        data: {
          items: [1, 2, 3],
          tags: new Set(['important', 'work']),
          metadata: new Map([['version', '1.0'], ['author', 'test']])
        }
      })
      
      return (
        <div data-testid="nested-test">
          <span data-testid="user-name">{state.user.profile.name}</span>
          <span data-testid="user-age">{state.user.profile.age}</span>
          <span data-testid="theme">{state.user.settings.theme}</span>
          <span data-testid="notifications">{String(state.user.settings.notifications)}</span>
          <span data-testid="items">{state.data.items.join(',')}</span>
          <span data-testid="tags-size">{state.data.tags.size}</span>
          <span data-testid="has-work-tag">{String(state.data.tags.has('work'))}</span>
          <span data-testid="metadata-size">{state.data.metadata.size}</span>
          <span data-testid="version">{state.data.metadata.get('version')}</span>
          <span data-testid="has-container">{String($beditStateContainer in state)}</span>
        </div>
      )
    }
    
    render(<TestComponent />)
    
    expect(screen.getByTestId('user-name')).toHaveTextContent('John')
    expect(screen.getByTestId('user-age')).toHaveTextContent('30')
    expect(screen.getByTestId('theme')).toHaveTextContent('dark')
    expect(screen.getByTestId('notifications')).toHaveTextContent('true')
    expect(screen.getByTestId('items')).toHaveTextContent('1,2,3')
    expect(screen.getByTestId('tags-size')).toHaveTextContent('2')
    expect(screen.getByTestId('has-work-tag')).toHaveTextContent('true')
    expect(screen.getByTestId('metadata-size')).toHaveTextContent('2')
    expect(screen.getByTestId('version')).toHaveTextContent('1.0')
    expect(screen.getByTestId('has-container')).toHaveTextContent('true')
  })
})

// Note: Mutation tests are not included here because they require the state container
// to properly integrate with React's setState mechanism. The container.get() method
// is designed to work within React's render cycle, and mutations would typically 
// trigger component re-renders rather than being tested in isolation.
//
// The key integration points that are tested:
// 1. ✅ Hook accepts all valid data types (objects, arrays, Sets, Maps)
// 2. ✅ Hook rejects primitive values with appropriate error
// 3. ✅ Hook attaches state container symbol to returned state  
// 4. ✅ State can be rendered in React components
// 5. ✅ Function initializers work correctly
// 6. ✅ Complex nested structures are handled properly
//
// The bedit integration with the state container is tested separately in react.test.ts
// using mock containers that simulate the React useState behavior.