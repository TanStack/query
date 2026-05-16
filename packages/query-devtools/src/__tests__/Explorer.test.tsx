import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render } from '@solidjs/testing-library'
import { QueryClient, onlineManager } from '@tanstack/query-core'
import Explorer from '../Explorer'
import { QueryDevtoolsContext, ThemeContext } from '../contexts'

// `goober` compiles every `css\`...\`` template literal at mount time;
// replace it with a no-op factory so label/role-based assertions stay fast.
vi.mock('goober', () => {
  let counter = 0
  const css = Object.assign(() => `tsqd-${++counter}`, {
    bind: () => css,
  })
  return { css, glob: () => {}, setup: () => {} }
})

describe('Explorer', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient()
  })

  afterEach(() => {
    queryClient.clear()
  })

  function renderExplorer(props: Parameters<typeof Explorer>[0]) {
    return render(() => (
      <QueryDevtoolsContext.Provider
        value={{
          client: queryClient,
          queryFlavor: 'TanStack Query',
          version: '5',
          onlineManager,
        }}
      >
        <ThemeContext.Provider value={() => 'dark'}>
          <Explorer {...props} />
        </ThemeContext.Provider>
      </QueryDevtoolsContext.Provider>
    ))
  }

  describe('primitive values', () => {
    it('should render a "label: value" row for a string value', () => {
      const rendered = renderExplorer({ label: 'name', value: 'Anna' })

      expect(rendered.getByText('name:')).toBeInTheDocument()
      expect(rendered.getByText('"Anna"')).toBeInTheDocument()
    })

    it('should render a "label: value" row for a number value', () => {
      const rendered = renderExplorer({ label: 'count', value: 42 })

      expect(rendered.getByText('count:')).toBeInTheDocument()
      expect(rendered.getByText('42')).toBeInTheDocument()
    })

    it('should render a "label: value" row for a boolean value', () => {
      const rendered = renderExplorer({ label: 'active', value: true })

      expect(rendered.getByText('active:')).toBeInTheDocument()
      expect(rendered.getByText('true')).toBeInTheDocument()
    })

    it('should render a "label: value" row for a "null" value', () => {
      const rendered = renderExplorer({ label: 'missing', value: null })

      expect(rendered.getByText('missing:')).toBeInTheDocument()
      expect(rendered.getByText('null')).toBeInTheDocument()
    })
  })

  describe('arrays and objects', () => {
    it('should render an empty object as a primitive row (no expander)', () => {
      const rendered = renderExplorer({ label: 'data', value: {} })

      expect(rendered.getByText('data:')).toBeInTheDocument()
      expect(rendered.queryByRole('button', { expanded: false })).toBeNull()
    })

    it('should render an array with an expander showing the item count', () => {
      const rendered = renderExplorer({
        label: 'list',
        value: ['a', 'b', 'c'],
      })

      const expander = rendered.getByRole('button', { expanded: false })
      expect(expander).toBeInTheDocument()
      expect(expander.textContent).toContain('list')
      expect(expander.textContent).toContain('3 items')
    })

    it('should render children under their index labels when the array expander is clicked', () => {
      const rendered = renderExplorer({
        label: 'list',
        value: ['a', 'b'],
      })

      fireEvent.click(rendered.getByRole('button', { expanded: false }))

      expect(rendered.getByText('0:')).toBeInTheDocument()
      expect(rendered.getByText('1:')).toBeInTheDocument()
      expect(rendered.getByText('"a"')).toBeInTheDocument()
      expect(rendered.getByText('"b"')).toBeInTheDocument()
    })

    it('should render object entries under their keys when expanded', () => {
      const rendered = renderExplorer({
        label: 'user',
        value: { name: 'Anna', age: 30 },
      })

      fireEvent.click(rendered.getByRole('button', { expanded: false }))

      expect(rendered.getByText('name:')).toBeInTheDocument()
      expect(rendered.getByText('"Anna"')).toBeInTheDocument()
      expect(rendered.getByText('age:')).toBeInTheDocument()
      expect(rendered.getByText('30')).toBeInTheDocument()
    })
  })
})
