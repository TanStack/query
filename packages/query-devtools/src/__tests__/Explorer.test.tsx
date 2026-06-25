import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, within } from '@solidjs/testing-library'
import { QueryClient, onlineManager } from '@tanstack/query-core'
import Explorer from '../Explorer'
import { QueryDevtoolsContext, ThemeContext } from '../contexts'
import type { Query } from '@tanstack/query-core'

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
    vi.useFakeTimers()
    queryClient = new QueryClient()
  })

  afterEach(() => {
    queryClient.clear()
    vi.useRealTimers()
  })

  function renderExplorer(
    props: Parameters<typeof Explorer>[0],
    options: { theme?: 'dark' | 'light' } = {},
  ) {
    const theme = options.theme ?? 'dark'
    return render(() => (
      <QueryDevtoolsContext.Provider
        value={{
          client: queryClient,
          queryFlavor: 'TanStack Query',
          version: '5',
          onlineManager,
        }}
      >
        <ThemeContext.Provider value={() => theme}>
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

  describe('Map and iterable values', () => {
    it('should preserve "Map" keys as labels when expanded', () => {
      const rendered = renderExplorer({
        label: 'm',
        value: new Map([
          ['first', 1],
          ['second', 2],
        ]),
      })

      fireEvent.click(rendered.getByRole('button', { expanded: false }))

      expect(rendered.getByText('first:')).toBeInTheDocument()
      expect(rendered.getByText('second:')).toBeInTheDocument()
    })

    it('should mark an iterable value with an "(Iterable)" prefix on the expander', () => {
      const rendered = renderExplorer({
        label: 's',
        value: new Set(['x', 'y']),
      })

      expect(
        rendered.getByRole('button', { expanded: false }).textContent,
      ).toContain('(Iterable)')
    })

    it('should render iterable children under their numeric index when expanded', () => {
      const rendered = renderExplorer({
        label: 's',
        value: new Set(['x', 'y']),
      })

      fireEvent.click(rendered.getByRole('button', { expanded: false }))

      expect(rendered.getByText('0:')).toBeInTheDocument()
      expect(rendered.getByText('1:')).toBeInTheDocument()
    })
  })

  describe('"defaultExpanded"', () => {
    it('should render children eagerly when the label is in "defaultExpanded"', () => {
      const rendered = renderExplorer({
        label: 'list',
        value: ['a'],
        defaultExpanded: ['list'],
      })

      expect(
        rendered.getByRole('button', { expanded: true }),
      ).toBeInTheDocument()
      expect(rendered.getByText('0:')).toBeInTheDocument()
    })
  })

  describe('action menu', () => {
    it('should copy the serialized value to the clipboard when the copy button is clicked', () => {
      const writeText = vi.fn().mockResolvedValue(undefined)
      vi.stubGlobal('navigator', { clipboard: { writeText } })
      queryClient.setQueryData(['data'], { name: 'Anna' })

      const rendered = renderExplorer({
        label: 'data',
        value: { name: 'Anna' },
        editable: true,
        activeQuery: queryClient
          .getQueryCache()
          .find({ queryKey: ['data'] }) as Query,
      })

      fireEvent.click(rendered.getByLabelText('Copy object to clipboard'))

      expect(writeText).toHaveBeenCalledTimes(1)
      const [arg] = writeText.mock.calls[0]!
      expect(JSON.parse(arg as string)).toMatchObject({
        json: { name: 'Anna' },
      })
    })

    it('should switch the copy button to an error state when clipboard write fails', async () => {
      const writeText = vi.fn().mockRejectedValue(new Error('denied'))
      vi.stubGlobal('navigator', { clipboard: { writeText } })
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      queryClient.setQueryData(['data'], { name: 'Anna' })

      const rendered = renderExplorer({
        label: 'data',
        value: { name: 'Anna' },
        editable: true,
        activeQuery: queryClient
          .getQueryCache()
          .find({ queryKey: ['data'] }) as Query,
      })

      fireEvent.click(rendered.getByLabelText('Copy object to clipboard'))
      await vi.advanceTimersByTimeAsync(0)

      expect(
        rendered.getByLabelText('Error copying object to clipboard'),
      ).toBeInTheDocument()
      expect(consoleError).toHaveBeenCalledWith(
        'Failed to copy: ',
        expect.any(Error),
      )
    })

    it('should reset the copy button to the idle state 1500ms after a successful copy', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined)
      vi.stubGlobal('navigator', { clipboard: { writeText } })
      queryClient.setQueryData(['data'], { name: 'Anna' })

      const rendered = renderExplorer({
        label: 'data',
        value: { name: 'Anna' },
        editable: true,
        activeQuery: queryClient
          .getQueryCache()
          .find({ queryKey: ['data'] }) as Query,
      })

      fireEvent.click(rendered.getByLabelText('Copy object to clipboard'))
      await vi.advanceTimersByTimeAsync(0)

      expect(
        rendered.getByLabelText('Object copied to clipboard'),
      ).toBeInTheDocument()

      await vi.advanceTimersByTimeAsync(1500)

      expect(
        rendered.getByLabelText('Copy object to clipboard'),
      ).toBeInTheDocument()
    })

    it('should reset the copy button to the idle state 1500ms after a failed copy', async () => {
      const writeText = vi.fn().mockRejectedValue(new Error('denied'))
      vi.stubGlobal('navigator', { clipboard: { writeText } })
      vi.spyOn(console, 'error').mockImplementation(() => {})
      queryClient.setQueryData(['data'], { name: 'Anna' })

      const rendered = renderExplorer({
        label: 'data',
        value: { name: 'Anna' },
        editable: true,
        activeQuery: queryClient
          .getQueryCache()
          .find({ queryKey: ['data'] }) as Query,
      })

      fireEvent.click(rendered.getByLabelText('Copy object to clipboard'))
      await vi.advanceTimersByTimeAsync(0)

      expect(
        rendered.getByLabelText('Error copying object to clipboard'),
      ).toBeInTheDocument()

      await vi.advanceTimersByTimeAsync(1500)

      expect(
        rendered.getByLabelText('Copy object to clipboard'),
      ).toBeInTheDocument()
    })

    it('should clear array items via "setQueryData" when the clear-array button is clicked', () => {
      queryClient.setQueryData(['data'], ['a', 'b', 'c'])

      const rendered = renderExplorer({
        label: 'list',
        value: ['a', 'b', 'c'],
        editable: true,
        activeQuery: queryClient
          .getQueryCache()
          .find({ queryKey: ['data'] }) as Query,
      })

      fireEvent.click(rendered.getByLabelText('Remove all items'))

      expect(queryClient.getQueryData(['data'])).toEqual([])
    })

    it('should delete the entry at the current "dataPath" when the delete button is clicked', () => {
      queryClient.setQueryData(['data'], ['a', 'b', 'c'])

      const rendered = renderExplorer({
        label: 'list',
        value: ['a', 'b', 'c'],
        editable: true,
        itemsDeletable: true,
        activeQuery: queryClient
          .getQueryCache()
          .find({ queryKey: ['data'] }) as Query,
        dataPath: ['1'],
      })

      fireEvent.click(rendered.getByLabelText('Delete item'))

      expect(queryClient.getQueryData(['data'])).toEqual(['a', 'c'])
    })

    it('should toggle a boolean value via "setQueryData" when the toggle button is clicked', () => {
      queryClient.setQueryData(['data'], { flag: true })

      const rendered = renderExplorer({
        label: 'flag',
        value: true,
        editable: true,
        activeQuery: queryClient
          .getQueryCache()
          .find({ queryKey: ['data'] }) as Query,
        dataPath: ['flag'],
      })

      fireEvent.click(rendered.getByLabelText('Toggle value'))

      expect(queryClient.getQueryData(['data'])).toEqual({ flag: false })
    })

    it('should not render action buttons when "editable" is false', () => {
      queryClient.setQueryData(['data'], ['a'])

      const rendered = renderExplorer({
        label: 'list',
        value: ['a'],
        editable: false,
        activeQuery: queryClient
          .getQueryCache()
          .find({ queryKey: ['data'] }) as Query,
      })

      expect(rendered.queryByLabelText('Copy object to clipboard')).toBeNull()
      expect(rendered.queryByLabelText('Remove all items')).toBeNull()
    })

    it('should not render "ClearArrayButton" when value is not an array', () => {
      queryClient.setQueryData(['data'], { name: 'Anna' })

      const rendered = renderExplorer({
        label: 'user',
        value: { name: 'Anna' },
        editable: true,
        activeQuery: queryClient
          .getQueryCache()
          .find({ queryKey: ['data'] }) as Query,
      })

      expect(rendered.queryByLabelText('Remove all items')).toBeNull()
      expect(
        rendered.getByLabelText('Copy object to clipboard'),
      ).toBeInTheDocument()
    })
  })

  describe('pagination', () => {
    it('should group entries into 100-item pages when the array has more than 100 entries', () => {
      const rendered = renderExplorer({
        label: 'big',
        value: Array.from({ length: 101 }, (_, i) => i),
      })

      fireEvent.click(rendered.getByRole('button', { expanded: false }))

      expect(rendered.getByText('[0...99]')).toBeInTheDocument()
      expect(rendered.getByText('[100...199]')).toBeInTheDocument()
    })

    it('should keep the items of a page hidden until the page header is clicked', () => {
      const rendered = renderExplorer({
        label: 'big',
        value: Array.from({ length: 101 }, (_, i) => `item-${i}`),
      })

      fireEvent.click(rendered.getByRole('button', { expanded: false }))

      expect(rendered.queryByText('0:')).toBeNull()
    })

    it('should reveal the items of a page when the page header is clicked', () => {
      const rendered = renderExplorer({
        label: 'big',
        value: Array.from({ length: 101 }, (_, i) => `item-${i}`),
      })

      fireEvent.click(rendered.getByRole('button', { expanded: false }))
      fireEvent.click(rendered.getByText('[0...99]'))

      expect(rendered.getByText('0:')).toBeInTheDocument()
      expect(rendered.getByText('"item-0"')).toBeInTheDocument()
    })

    it('should independently toggle two pages when their headers are clicked', () => {
      const rendered = renderExplorer({
        label: 'big',
        value: Array.from({ length: 200 }, (_, i) => `item-${i}`),
      })

      fireEvent.click(rendered.getByRole('button', { expanded: false }))
      fireEvent.click(rendered.getByText('[0...99]'))
      fireEvent.click(rendered.getByText('[100...199]'))

      expect(rendered.getByText('"item-0"')).toBeInTheDocument()
      expect(rendered.getByText('"item-100"')).toBeInTheDocument()

      fireEvent.click(rendered.getByText('[0...99]'))

      expect(rendered.queryByText('"item-0"')).toBeNull()
      expect(rendered.getByText('"item-100"')).toBeInTheDocument()
    })

    it('should render action buttons for items inside a paginated page', () => {
      const value: Array<Array<number>> = Array.from(
        { length: 200 },
        (_, i) => [i],
      )
      queryClient.setQueryData(['data'], value)

      const rendered = renderExplorer({
        label: 'Data',
        value,
        defaultExpanded: ['Data'],
        editable: true,
        activeQuery: queryClient
          .getQueryCache()
          .find({ queryKey: ['data'] }) as Query,
      })

      fireEvent.click(rendered.getByText('[0...99]'))

      expect(
        rendered.getAllByLabelText('Remove all items').length,
      ).toBeGreaterThan(1)
    })
  })

  describe('inline edit', () => {
    it('should write the new string value via "setQueryData" when a text input is changed', () => {
      queryClient.setQueryData(['data'], { name: 'Anna' })

      const rendered = renderExplorer({
        label: 'name',
        value: 'Anna',
        editable: true,
        activeQuery: queryClient
          .getQueryCache()
          .find({ queryKey: ['data'] }) as Query,
        dataPath: ['name'],
      })

      const input = rendered.getByLabelText('name:')
      expect(input).toHaveAttribute('type', 'text')

      fireEvent.change(input, { target: { value: 'Bob' } })

      expect(queryClient.getQueryData(['data'])).toEqual({ name: 'Bob' })
    })

    it('should write the new number value via "setQueryData" when a number input is changed', () => {
      queryClient.setQueryData(['data'], { count: 1 })

      const rendered = renderExplorer({
        label: 'count',
        value: 1,
        editable: true,
        activeQuery: queryClient
          .getQueryCache()
          .find({ queryKey: ['data'] }) as Query,
        dataPath: ['count'],
      })

      const input = rendered.getByLabelText('count:')
      expect(input).toHaveAttribute('type', 'number')

      fireEvent.change(input, {
        target: { value: '42', valueAsNumber: 42 },
      })

      expect(queryClient.getQueryData(['data'])).toEqual({ count: 42 })
    })

    it('should render "ToggleValueButton" inline for a boolean primitive row', () => {
      queryClient.setQueryData(['data'], { flag: false })

      const rendered = renderExplorer({
        label: 'flag',
        value: false,
        editable: true,
        activeQuery: queryClient
          .getQueryCache()
          .find({ queryKey: ['data'] }) as Query,
        dataPath: ['flag'],
      })

      expect(rendered.getByLabelText('Toggle value')).toBeInTheDocument()
    })

    it('should render "DeleteItemButton" inline when a primitive row has "itemsDeletable"', () => {
      queryClient.setQueryData(['data'], { name: 'Anna' })

      const rendered = renderExplorer({
        label: 'name',
        value: 'Anna',
        editable: true,
        itemsDeletable: true,
        activeQuery: queryClient
          .getQueryCache()
          .find({ queryKey: ['data'] }) as Query,
        dataPath: ['name'],
      })

      expect(rendered.getByLabelText('Delete item')).toBeInTheDocument()
    })

    it('should delete fields from the active query when their inline delete buttons are clicked', () => {
      const value = { name: 'Anna', age: 30 }
      queryClient.setQueryData(['data'], value)

      const rendered = renderExplorer({
        label: 'Data',
        value,
        defaultExpanded: ['Data'],
        editable: true,
        activeQuery: queryClient
          .getQueryCache()
          .find({ queryKey: ['data'] }) as Query,
      })

      const ageRow = rendered.getByText('age:').parentElement!
      fireEvent.click(within(ageRow).getByLabelText('Delete item'))

      expect(queryClient.getQueryData(['data'])).toEqual({ name: 'Anna' })

      const nameRow = rendered.getByText('name:').parentElement!
      fireEvent.click(within(nameRow).getByLabelText('Delete item'))

      expect(queryClient.getQueryData(['data'])).toEqual({})
    })
  })

  describe('theme', () => {
    it('should render without throwing under the "light" theme', () => {
      const value = { items: ['a'], flag: true }
      queryClient.setQueryData(['data'], value)

      expect(() =>
        renderExplorer(
          {
            label: 'Data',
            value,
            defaultExpanded: ['Data'],
            editable: true,
            activeQuery: queryClient
              .getQueryCache()
              .find({ queryKey: ['data'] }) as Query,
          },
          { theme: 'light' },
        ),
      ).not.toThrow()
    })
  })

  describe('"shadowDOMTarget"', () => {
    it('should render without throwing when a "shadowDOMTarget" is provided', () => {
      const host = document.createElement('div')
      document.body.appendChild(host)
      const shadowRoot = host.attachShadow({ mode: 'open' })
      const value = { items: ['a'], flag: true }
      queryClient.setQueryData(['data'], value)

      try {
        expect(() =>
          render(() => (
            <QueryDevtoolsContext.Provider
              value={{
                client: queryClient,
                queryFlavor: 'TanStack Query',
                version: '5',
                onlineManager,
                shadowDOMTarget: shadowRoot,
              }}
            >
              <ThemeContext.Provider value={() => 'dark'}>
                <Explorer
                  label="Data"
                  value={value}
                  defaultExpanded={['Data']}
                  editable={true}
                  activeQuery={
                    queryClient
                      .getQueryCache()
                      .find({ queryKey: ['data'] }) as Query
                  }
                />
              </ThemeContext.Provider>
            </QueryDevtoolsContext.Provider>
          )),
        ).not.toThrow()
      } finally {
        host.remove()
      }
    })
  })
})
