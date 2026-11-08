import { runInNewContext } from 'node:vm'
import { fireEvent, render, within } from '@solidjs/testing-library'
import { QueryClient, onlineManager } from '@tanstack/query-core'
import { createSignal } from 'solid-js'
import { clearDelegatedEvents, delegateEvents } from 'solid-js/web'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Explorer, { SearchableExplorer } from '../Explorer'
import { QueryDevtoolsContext, ThemeContext } from '../contexts'

// `goober` compiles every `css\`...\`` template literal at mount time;
// replace it with a no-op factory so label/role-based assertions stay fast.
vi.mock(import('goober'), () => {
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
    props: Parameters<typeof SearchableExplorer>[0],
    options: {
      theme?: 'dark' | 'light'
      searchable?: boolean
      container?: HTMLElement
    } = {},
  ) {
    const theme = options.theme ?? 'dark'
    return render(
      () => (
        <QueryDevtoolsContext.Provider
          value={{
            client: queryClient,
            queryFlavor: 'TanStack Query',
            version: '5',
            onlineManager,
          }}
        >
          <ThemeContext.Provider value={() => theme}>
            {options.searchable ? (
              <SearchableExplorer {...props} />
            ) : (
              <Explorer {...props} />
            )}
          </ThemeContext.Provider>
        </QueryDevtoolsContext.Provider>
      ),
      { container: options.container },
    )
  }

  function renderSearchable(props: Parameters<typeof SearchableExplorer>[0]) {
    return renderExplorer(props, { searchable: true })
  }

  function searchData(
    rendered: ReturnType<typeof renderExplorer>,
    term: string,
  ) {
    fireEvent.input(rendered.getByRole('searchbox', { name: 'Search data' }), {
      target: { value: term },
    })
    vi.advanceTimersByTime(150)
  }

  function highlightedText() {
    return [...CSS.highlights.values()].flatMap((highlight) =>
      [...highlight].map((range) => range.toString()),
    )
  }

  describe('nested search', () => {
    it('bounds the number of native ranges for a repeated match', () => {
      const rendered = renderSearchable({
        label: 'Data',
        value: 'a'.repeat(2000),
      })
      searchData(rendered, 'a')
      expect(highlightedText()).toHaveLength(1000)
      expect(rendered.container).toHaveTextContent('a'.repeat(2000))
    })

    it('shares the range limit across rows and resets it for each search', () => {
      const [value, setValue] = createSignal({
        first: 'a'.repeat(600),
        second: 'a'.repeat(600),
      })
      const rendered = renderSearchable({
        label: 'Data',
        get value() {
          return value()
        },
      })
      searchData(rendered, 'a')
      expect(highlightedText()).toHaveLength(1000)
      setValue({ first: 'b'.repeat(600), second: 'a'.repeat(600) })
      expect(highlightedText()).toStrictEqual(Array(600).fill('a'))
      setValue({ first: 'b'.repeat(600), second: 'a'.repeat(1000) })
      expect(highlightedText()).toHaveLength(1000)
      searchData(rendered, 'b')
      expect(highlightedText()).toStrictEqual(Array(600).fill('b'))
      setValue({ first: 'b'.repeat(800), second: '' })
      expect(highlightedText()).toHaveLength(800)
      fireEvent.click(rendered.getByText('Clear'))
      expect(highlightedText()).toHaveLength(0)
    })

    it('uses native ranges and replaces them when the search or data changes', () => {
      const highlights = new Map<string, Set<Range>>()
      vi.stubGlobal('CSS', { highlights })
      vi.stubGlobal('Highlight', Set)
      const [value, setValue] = createSignal({
        material: '\ud83d\udccd \u0130pek \u0130pek',
      })
      const rendered = renderSearchable({
        label: 'Data',
        get value() {
          return value()
        },
      })
      searchData(rendered, 'PEK')
      expect(highlights.size).toBe(1)
      expect(highlightedText()).toStrictEqual(['pek', 'pek'])

      searchData(rendered, 'i')
      expect(highlightedText()).toStrictEqual(['i', 'İ', 'İ'])
      setValue({ material: 'Izmir' })
      expect(highlightedText().sort()).toStrictEqual(['I', 'i', 'i'])

      fireEvent.click(rendered.getByText('Clear'))
      expect(highlightedText()).toStrictEqual([])
      rendered.unmount()
      expect(highlights.size).toBe(0)
    })

    it('keeps native highlights separate for each explorer and cleans up on unmount', () => {
      const foreign = new Set<Range>()
      const highlights = new Map([['other-feature', foreign]])
      vi.stubGlobal('CSS', { highlights })
      vi.stubGlobal('Highlight', Set)
      const first = renderSearchable({
        label: 'Data',
        value: { text: 'first' },
      })
      const second = renderSearchable({
        label: 'Data',
        value: { text: 'second' },
      })
      for (const [rendered, term] of [
        [first, 'first'],
        [second, 'second'],
      ] as const) {
        fireEvent.input(within(rendered.container).getByRole('searchbox'), {
          target: { value: term },
        })
        vi.advanceTimersByTime(150)
      }
      expect(highlights.size).toBe(3)
      first.unmount()
      expect(highlights.size).toBe(2)
      expect(
        [...highlights.values()].flatMap((ranges) =>
          [...ranges].map((range) => range.toString()),
        ),
      ).toStrictEqual(['second'])
      second.unmount()
      expect([...highlights]).toStrictEqual([['other-feature', foreign]])
    })

    it('registers highlights in the document that contains the explorer', () => {
      const highlights = new Map<string, Set<Range>>()
      vi.stubGlobal('CSS', { highlights: new Map() })
      vi.stubGlobal('Highlight', Set)
      const frame = document.createElement('iframe')
      document.body.append(frame)
      const frameDocument = frame.contentDocument!
      Object.defineProperty(frame.contentWindow, 'CSS', {
        value: { highlights },
      })
      Object.defineProperty(frame.contentWindow, 'Highlight', { value: Set })
      const rendered = renderExplorer(
        { label: 'Data', value: { text: 'needle' } },
        { searchable: true, container: frameDocument.body },
      )
      expect(highlights.size).toBe(1)
      delegateEvents(['input'], frameDocument)
      fireEvent.input(within(rendered.container).getByRole('searchbox'), {
        target: { value: 'needle' },
      })
      vi.advanceTimersByTime(150)
      expect(
        [...highlights.values()].flatMap((ranges) =>
          [...ranges].map((range) => range.toString()),
        ),
      ).toStrictEqual(['needle'])
      expect(
        [...highlights.values()].flatMap((ranges) => [...ranges])[0]!
          .startContainer.ownerDocument,
      ).toBe(frameDocument)
      expect(rendered.container.firstElementChild!.ownerDocument).toBe(
        frameDocument,
      )
      expect(CSS.highlights.size).toBe(0)
      rendered.unmount()
      expect(highlights.size).toBe(0)
      clearDelegatedEvents(frameDocument)
      frame.remove()
    })

    it('debounces nested label matches and leaves ordinary siblings visible', () => {
      const rendered = renderSearchable({
        label: 'Data',
        value: { users: { profile: { firstName: 'Anna' } }, unrelated: 42 },
      })
      fireEvent.input(rendered.getByLabelText('Search data'), {
        target: { value: 'FIRSTname' },
      })
      vi.advanceTimersByTime(149)
      expect(rendered.queryByText('"Anna"')).not.toBeInTheDocument()
      vi.advanceTimersByTime(1)
      expect(highlightedText()).toContain('firstName')
      expect(rendered.getByText('"Anna"')).toBeVisible()
      expect(rendered.getByText('unrelated:')).toBeVisible()
      expect(rendered.getByText('42')).toBeVisible()
    })

    it('matches nested primitive values with case-insensitive literal substrings', () => {
      const rendered = renderSearchable({
        label: 'Data',
        value: {
          nested: {
            text: 'Before A.*[B] after',
            count: 12345,
            flag: false,
            empty: null,
          },
        },
      })
      searchData(rendered, 'a.*[b]')
      expect(highlightedText()).toContain('A.*[B]')
      expect(rendered.getByText('text:')).toBeVisible()
      searchData(rendered, '234')
      expect(highlightedText()).toContain('234')
      searchData(rendered, 'FALSE')
      expect(highlightedText()).toContain('false')
      searchData(rendered, 'null')
      expect(highlightedText()).toContain('null')
    })

    it('highlights literal backslashes and quotes in string values', () => {
      const rendered = renderSearchable({
        label: 'Data',
        value: { text: 'a\\b"c' },
      })
      searchData(rendered, 'a\\b"c')
      expect(highlightedText()).toContain('a\\b"c')
    })

    it('highlights original text when Unicode lowercasing changes its length', () => {
      const rendered = renderSearchable({
        label: 'Data',
        value: { material: '\ud83d\udccd \u0130pek' },
      })
      searchData(rendered, 'PEK')
      expect(highlightedText()).toContain('pek')
      expect(
        rendered.getByText('material:').nextElementSibling,
      ).toHaveTextContent('"\ud83d\udccd \u0130pek"')
      searchData(rendered, 'i')
      expect(highlightedText()).toContain('\u0130')
    })

    it('reports no matches without matching the synthetic Data label', () => {
      const rendered = renderSearchable({ label: 'Data', value: { count: 1 } })
      searchData(rendered, 'Data')
      expect(rendered.getByRole('status')).toHaveTextContent('No matches')
      expect(rendered.getByRole('button', { expanded: false })).toBeVisible()
      fireEvent.click(rendered.getByLabelText('Clear search'))
      expect(rendered.getByRole('status')).toHaveTextContent(/^$/)
    })

    it('reveals a matching container label without opening unrelated descendants', () => {
      const rendered = renderSearchable({
        label: 'Data',
        value: { profile: { secret: 'hidden' } },
      })
      searchData(rendered, 'profile')
      expect(
        rendered.getByRole('button', {
          name: 'profile 1 item',
          expanded: false,
        }),
      ).toBeVisible()
      expect(rendered.queryByText('secret:')).not.toBeInTheDocument()
    })

    it('restores manual expansion immediately on clear and Escape', () => {
      const rendered = renderSearchable({
        label: 'Data',
        defaultExpanded: ['Data'],
        value: { manual: { keep: 'open' }, automatic: { target: 'found' } },
      })
      fireEvent.click(rendered.getByRole('button', { name: 'manual 1 item' }))
      searchData(rendered, 'found')
      expect(rendered.getByText('"found"')).toBeVisible()
      expect(rendered.getByText('"open"')).toBeVisible()
      fireEvent.click(rendered.getByLabelText('Clear search'))
      expect(rendered.getByLabelText('Search data')).toHaveValue('')
      expect(rendered.queryByText('target:')).not.toBeInTheDocument()
      expect(rendered.getByText('"open"')).toBeVisible()
      searchData(rendered, 'found')
      fireEvent.keyDown(rendered.getByLabelText('Search data'), {
        key: 'Escape',
      })
      expect(rendered.queryByText('target:')).not.toBeInTheDocument()
      expect(rendered.getByText('"open"')).toBeVisible()
      expect(highlightedText()).toHaveLength(0)
    })

    it('keeps manual expansion when clicking search-open branches', () => {
      const rendered = renderSearchable({
        label: 'Data',
        defaultExpanded: ['Data', 'opened'],
        value: {
          opened: { text: 'needle' },
          automatic: { text: 'needle' },
          other: { text: 'unrelated' },
        },
      })
      searchData(rendered, 'needle')
      fireEvent.click(rendered.getByRole('button', { name: 'opened 1 item' }))
      fireEvent.click(
        rendered.getByRole('button', { name: 'automatic 1 item' }),
      )
      fireEvent.click(rendered.getByRole('button', { name: 'other 1 item' }))
      fireEvent.click(rendered.getByText('Clear'))
      expect(
        rendered.getByRole('button', { name: 'opened 1 item' }),
      ).toHaveAttribute('aria-expanded', 'true')
      expect(
        rendered.getByRole('button', { name: 'automatic 1 item' }),
      ).toHaveAttribute('aria-expanded', 'false')
      expect(
        rendered.getByRole('button', { name: 'other 1 item' }),
      ).toHaveAttribute('aria-expanded', 'true')
    })

    it('cancels a pending search on Escape', () => {
      const rendered = renderSearchable({
        label: 'Data',
        value: { nested: { target: 1 } },
      })
      fireEvent.input(rendered.getByLabelText('Search data'), {
        target: { value: 'target' },
      })
      fireEvent.keyDown(rendered.getByLabelText('Search data'), {
        key: 'Escape',
      })
      vi.advanceTimersByTime(150)
      expect(rendered.queryByText('target:')).not.toBeInTheDocument()
      expect(rendered.getByLabelText('Search data')).toHaveValue('')
    })

    it('highlights the full editable input and edits original index 150 without changing manual pages', () => {
      const value = Array.from({ length: 200 }, (_, index) => `value-${index}`)
      queryClient.setQueryData(['data'], value)
      const rendered = renderSearchable({
        label: 'Data',
        value,
        defaultExpanded: ['Data'],
        editable: true,
        activeQuery: queryClient.getQueryCache().find({ queryKey: ['data'] }),
      })
      fireEvent.click(rendered.getByText('[0...99]'))
      searchData(rendered, 'VALUE-150')
      const input = rendered.getByDisplayValue('value-150')
      expect(input).toHaveValue('value-150')
      expect(input).toHaveAttribute('data-search-match', 'true')
      expect(rendered.getByDisplayValue('value-0')).toHaveValue('value-0')
      fireEvent.change(input, { target: { value: 'edited' } })
      const expected = [...value]
      expected[150] = 'edited'
      expect(queryClient.getQueryData(['data'])).toStrictEqual(expected)
      fireEvent.click(rendered.getByText('Clear'))
      expect(rendered.getByDisplayValue('value-0')).toBeVisible()
      expect(rendered.queryByText('150:')).not.toBeInTheDocument()
      fireEvent.click(rendered.getByText('[100...199]'))
      expect(rendered.getByText('150:')).toBeVisible()
    })

    it('keeps property paths distinct when labels contain separators', () => {
      const value = { 'a.b': { name: 'needle' }, a: { b: { name: 'needle' } } }
      queryClient.setQueryData(['data'], value)
      const rendered = renderSearchable({
        label: 'Data',
        value,
        editable: true,
        activeQuery: queryClient.getQueryCache().find({ queryKey: ['data'] }),
      })
      searchData(rendered, 'needle')
      const fields = rendered.getAllByLabelText('name:')
      expect(fields).toHaveLength(2)
      fireEvent.change(fields[0]!, { target: { value: 'edited' } })
      expect(queryClient.getQueryData(['data'])).toStrictEqual({
        'a.b': { name: 'edited' },
        a: { b: { name: 'needle' } },
      })
    })

    it('opens only the first matching page and marks other pages with matches', () => {
      const rendered = renderSearchable({
        label: 'Data',
        defaultExpanded: ['Data'],
        value: Array.from({ length: 201 }, (_, index) => ({
          name: `Person ${index}`,
        })),
      })
      searchData(rendered, 'name')
      expect(rendered.getAllByText('name:')).toHaveLength(100)
      expect(highlightedText()).toStrictEqual(Array(100).fill('name'))
      const first = rendered.getByText('[0...99]').closest('button')!
      const next = rendered.getByText('[100...199]').closest('button')!
      expect(first).toHaveAttribute('aria-expanded', 'true')
      expect(next).toHaveAttribute('aria-expanded', 'false')
      expect(next).toHaveAccessibleDescription('Contains search matches')
      fireEvent.click(first)
      fireEvent.click(next)
      expect(rendered.getAllByText('name:')).toHaveLength(200)
      expect(highlightedText()).toStrictEqual(Array(200).fill('name'))
      fireEvent.click(rendered.getByText('Clear'))
      expect(next).toHaveAttribute('aria-expanded', 'true')
      expect(first).toHaveAttribute('aria-expanded', 'false')
    })

    it('updates search results when root data changes', () => {
      const [value, setValue] = createSignal({ nested: { text: 'old' } })
      const rendered = renderSearchable({
        label: 'Data',
        get value() {
          return value()
        },
      })
      searchData(rendered, 'needle')
      expect(rendered.getByRole('status')).toHaveTextContent('No matches')
      setValue({ nested: { text: 'new needle' } })
      expect(highlightedText()).toContain('needle')
      expect(rendered.getByRole('status')).toHaveTextContent(/^$/)
      setValue({ nested: { text: 'gone' } })
      expect(rendered.getByRole('status')).toHaveTextContent('No matches')
      expect(highlightedText()).toHaveLength(0)
    })

    it('clears the term when the selected root changes', () => {
      const [key, setKey] = createSignal('first')
      const rendered = renderSearchable({
        label: 'Data',
        value: { text: 'needle' },
        get searchKey() {
          return key()
        },
      })
      searchData(rendered, 'needle')
      setKey('second')
      expect(rendered.getByLabelText('Search data')).toHaveValue('')
      expect(highlightedText()).toHaveLength(0)
    })

    it('starts with the initial search and restores it when the selected root changes', () => {
      const [key, setKey] = createSignal('first')
      const [initialSearch, setInitialSearch] = createSignal('Needle')
      const rendered = renderSearchable({
        label: 'Data',
        value: { text: 'a needle' },
        get searchKey() {
          return key()
        },
        get initialSearch() {
          return initialSearch()
        },
      })
      const input = rendered.getByLabelText('Search data')
      expect(input).toHaveValue('Needle')
      expect(highlightedText()).toStrictEqual(['needle'])
      searchData(rendered, 'other')
      setInitialSearch('a')
      expect(input).toHaveValue('other')
      setKey('second')
      expect(input).toHaveValue('a')
      expect(highlightedText()).toStrictEqual(['a'])
    })

    it('searches Map and Set entries and keeps distinct object keys', () => {
      const first = {
        toString() {
          throw new Error('Do not convert keys')
        },
      }
      const second = {}
      const rendered = renderSearchable({
        label: 'Data',
        value: {
          map: new Map<unknown, unknown>([
            [first, { text: 'first needle' }],
            [second, { text: 'second needle' }],
            ['named', new Set(['set needle'])],
          ]),
        },
      })
      searchData(rendered, 'needle')
      expect(
        highlightedText().filter((text) => text === 'needle'),
      ).toHaveLength(3)
      expect(
        rendered.getAllByRole('button', {
          name: '[Object key] 1 item',
          expanded: true,
        }),
      ).toHaveLength(2)
      searchData(rendered, 'NAMED')
      expect(highlightedText()).toContain('named')
    })

    it.each([
      {
        kind: 'Map',
        populated: "new Map([['entry', 'needle']])",
        empty: 'new Map()',
      },
      { kind: 'Set', populated: "new Set(['needle'])", empty: 'new Set()' },
    ])(
      'renders cross-realm $kind labels and empty values',
      ({ kind, populated, empty }) => {
        const collection: unknown = runInNewContext(populated)
        const [value, setValue] = createSignal({ collection })
        const rendered = renderSearchable({
          label: 'Data',
          get value() {
            return value()
          },
        })
        searchData(rendered, 'needle')
        expect(
          rendered.getByRole('button', {
            name: /collection \(iterable\) 1 item/i,
          }),
        ).toBeVisible()
        const emptyCollection: unknown = runInNewContext(empty)
        setValue({ collection: emptyCollection })
        searchData(rendered, 'collection')
        expect(rendered.getByText(`${kind}(0)`)).toBeVisible()
      },
    )

    it.each([
      {
        kind: 'Map',
        expression: "new Map([['entry', 'needle'], ['other', 'kept']])",
        label: 'entry:',
        values: (value: unknown) =>
          Array.from(Map.prototype.values.call(value)),
      },
      {
        kind: 'Set',
        expression: "new Set(['needle', 'kept'])",
        label: '0:',
        values: (value: unknown) =>
          Array.from(Set.prototype.values.call(value)),
      },
    ])(
      'edits and deletes cross-realm $kind entries',
      ({ expression, label, values }) => {
        const initial: unknown = runInNewContext(expression)
        const [value, setValue] = createSignal<unknown>(initial)
        queryClient.setQueryData(['data'], initial)
        const rendered = renderSearchable({
          label: 'Data',
          get value() {
            return value()
          },
          defaultExpanded: ['Data'],
          editable: true,
          activeQuery: queryClient.getQueryCache().find({ queryKey: ['data'] }),
        })
        searchData(rendered, 'needle')
        expect(rendered.getByLabelText(label)).toHaveAttribute(
          'data-search-match',
          'true',
        )
        fireEvent.change(rendered.getByLabelText(label), {
          target: { value: 'edited' },
        })
        expect(values(queryClient.getQueryData(['data']))).toStrictEqual([
          'edited',
          'kept',
        ])
        setValue(queryClient.getQueryData(['data']))
        expect(rendered.getByLabelText(label)).not.toHaveAttribute(
          'data-search-match',
        )
        queryClient.setQueryData(['data'], initial)
        setValue(initial)
        const row = rendered.getByLabelText(label).closest('div')!
        fireEvent.click(within(row).getByLabelText('Delete item'))
        expect(values(queryClient.getQueryData(['data']))).toStrictEqual([
          'kept',
        ])
      },
    )

    it('edits and deletes entries through a foreign object ancestor with a getter', () => {
      const initial: unknown = runInNewContext(
        "({ nested: new Map([['entry', 'needle'], ['other', 'kept']]), sibling: 'kept', get unread() { throw new Error('Do not read') } })",
      )
      queryClient.setQueryData(['data'], initial)
      const [value, setValue] = createSignal<unknown>({})
      const rendered = renderSearchable({
        label: 'Data',
        get value() {
          return value()
        },
        editable: true,
        activeQuery: queryClient.getQueryCache().find({ queryKey: ['data'] }),
      })
      searchData(rendered, 'needle')
      setValue(initial)
      fireEvent.change(rendered.getByLabelText('entry:'), {
        target: { value: 'edited' },
      })
      const edited = queryClient.getQueryData<{
        nested: unknown
        sibling: string
      }>(['data'])
      expect(Map.prototype.get.call(edited?.nested, 'entry')).toBe('edited')
      expect(edited?.sibling).toBe('kept')
      queryClient.setQueryData(['data'], initial)
      const row = rendered.getByLabelText('entry:').closest('div')!
      fireEvent.click(within(row).getByLabelText('Delete item'))
      const deleted = queryClient.getQueryData<{
        nested: unknown
        sibling: string
      }>(['data'])
      expect(Map.prototype.has.call(deleted?.nested, 'entry')).toBe(false)
      expect(Map.prototype.get.call(deleted?.nested, 'other')).toBe('kept')
      expect(deleted?.sibling).toBe('kept')
    })

    it.each([
      {
        kind: 'class',
        create: () =>
          Object.assign(new (class Data {})(), {
            text: 'needle',
            nested: { text: 'needle nested' },
            enabled: true,
            count: 1,
          }),
      },
      {
        kind: 'Date',
        create: () =>
          Object.assign(new Date('2026-01-01'), {
            text: 'needle',
            nested: { text: 'needle nested' },
            enabled: true,
            count: 1,
          }),
      },
      {
        kind: 'paginated class',
        create: () =>
          Object.assign(
            new (class Data {})(),
            Object.fromEntries(
              Array.from({ length: 101 }, (_, index) => [
                `item${index}`,
                'needle',
              ]),
            ),
          ),
      },
    ])('shows $kind fields as read-only', ({ create }) => {
      const value = create()
      queryClient.setQueryData(['data'], value)
      const rendered = renderSearchable({
        label: 'Data',
        value,
        editable: true,
        activeQuery: queryClient.getQueryCache().find({ queryKey: ['data'] }),
      })
      searchData(rendered, 'needle')
      expect(rendered.queryAllByRole('textbox')).toHaveLength(0)
      expect(rendered.queryAllByRole('spinbutton')).toHaveLength(0)
      expect(
        rendered.queryAllByRole('button', { name: 'Delete item' }),
      ).toHaveLength(0)
      expect(
        rendered.queryByRole('button', { name: 'Toggle value' }),
      ).not.toBeInTheDocument()
      expect(highlightedText()).toContain('needle')
      expect(queryClient.getQueryData(['data'])).toBe(value)
    })

    it('edits Map values through original non-string keys during search', () => {
      const key = {}
      const value = new Map<unknown, unknown>([
        [key, { name: 'needle' }],
        [1, 'number needle'],
        ['1', 'string needle'],
      ])
      queryClient.setQueryData(['data'], value)
      const rendered = renderSearchable({
        label: 'Data',
        value,
        editable: true,
        activeQuery: queryClient.getQueryCache().find({ queryKey: ['data'] }),
      })
      searchData(rendered, 'needle')
      fireEvent.change(rendered.getByLabelText('name:'), {
        target: { value: 'edited' },
      })
      fireEvent.change(rendered.getByDisplayValue('number needle'), {
        target: { value: 'updated number' },
      })
      expect(queryClient.getQueryData(['data'])).toStrictEqual(
        new Map<unknown, unknown>([
          [key, { name: 'edited' }],
          [1, 'updated number'],
          ['1', 'string needle'],
        ]),
      )
    })

    it('stops cycles and searches shared values under each original path', () => {
      const shared = { text: 'needle' }
      const value: {
        left: typeof shared
        right: typeof shared
        self?: unknown
      } = { left: shared, right: shared }
      value.self = value
      const rendered = renderSearchable({ label: 'Data', value })
      searchData(rendered, 'needle')
      expect(
        highlightedText().filter((text) => text === 'needle'),
      ).toHaveLength(2)
      expect(rendered.getByText('[Circular]')).toBeVisible()
    })

    it('does not read accessors, consume generators, or serialize opaque objects during search', () => {
      const getter = vi.fn<() => never>(() => {
        throw new Error('Do not read')
      })
      const iterate = vi.fn<() => void>()
      function* generator() {
        iterate()
        yield 'never'
      }
      const opaque = {
        toJSON: vi.fn<() => never>(() => {
          throw new Error('Do not serialize')
        }),
      }
      Object.setPrototypeOf(opaque, { custom: true })
      const [editable, setEditable] = createSignal(false)
      const nested = { text: 'needle', generator: generator(), opaque }
      Object.defineProperty(nested, 'getter', { enumerable: true, get: getter })
      const rendered = renderSearchable({
        label: 'Data',
        value: { nested },
        onEdit: vi.fn<() => void>(),
        get editable() {
          return editable()
        },
      })
      searchData(rendered, 'needle')
      expect(highlightedText()).toContain('needle')
      setEditable(true)
      expect(rendered.getByText('[Getter]')).toBeVisible()
      expect(rendered.getAllByText('[Object]')).toHaveLength(2)
      expect(getter).not.toHaveBeenCalled()
      expect(iterate).not.toHaveBeenCalled()
      expect(opaque.toJSON).not.toHaveBeenCalled()
    })
  })

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
      expect(
        rendered.queryByRole('button', { expanded: false }),
      ).not.toBeInTheDocument()
    })

    it('should render an array with an expander showing the item count', () => {
      const rendered = renderExplorer({
        label: 'list',
        value: ['a', 'b', 'c'],
      })

      const expander = rendered.getByRole('button', { expanded: false })
      expect(expander).toBeInTheDocument()
      expect(expander).toHaveTextContent('list')
      expect(expander).toHaveTextContent('3 items')
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
        rendered.getByRole('button', { expanded: false }),
      ).toHaveTextContent('(Iterable)')
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
      const writeText = vi
        .fn<Clipboard['writeText']>()
        .mockResolvedValue(undefined)
      vi.stubGlobal('navigator', { clipboard: { writeText } })
      queryClient.setQueryData(['data'], { name: 'Anna' })

      const rendered = renderExplorer({
        label: 'data',
        value: { name: 'Anna' },
        editable: true,
        activeQuery: queryClient.getQueryCache().find({ queryKey: ['data'] }),
      })

      fireEvent.click(rendered.getByLabelText('Copy object to clipboard'))
      expect(writeText).toHaveBeenCalledTimes(1)
      const [arg] = writeText.mock.calls[0]!
      expect(JSON.parse(arg)).toMatchObject({
        json: { name: 'Anna' },
      })
    })

    it('should switch the copy button to an error state when clipboard write fails', async () => {
      const writeText = vi
        .fn<Clipboard['writeText']>()
        .mockRejectedValue(new Error('denied'))
      vi.stubGlobal('navigator', { clipboard: { writeText } })
      const consoleErrorMock = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      queryClient.setQueryData(['data'], { name: 'Anna' })

      const rendered = renderExplorer({
        label: 'data',
        value: { name: 'Anna' },
        editable: true,
        activeQuery: queryClient.getQueryCache().find({ queryKey: ['data'] }),
      })

      fireEvent.click(rendered.getByLabelText('Copy object to clipboard'))
      await vi.advanceTimersByTimeAsync(0)
      expect(
        rendered.getByLabelText('Error copying object to clipboard'),
      ).toBeInTheDocument()
      expect(consoleErrorMock).toHaveBeenCalledWith(
        'Failed to copy: ',
        new Error('denied'),
      )
    })

    it('should reset the copy button to the idle state 1500ms after a successful copy', async () => {
      const writeText = vi
        .fn<Clipboard['writeText']>()
        .mockResolvedValue(undefined)
      vi.stubGlobal('navigator', { clipboard: { writeText } })
      queryClient.setQueryData(['data'], { name: 'Anna' })

      const rendered = renderExplorer({
        label: 'data',
        value: { name: 'Anna' },
        editable: true,
        activeQuery: queryClient.getQueryCache().find({ queryKey: ['data'] }),
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
      const writeText = vi
        .fn<Clipboard['writeText']>()
        .mockRejectedValue(new Error('denied'))
      vi.stubGlobal('navigator', { clipboard: { writeText } })
      vi.spyOn(console, 'error').mockImplementation(() => {})
      queryClient.setQueryData(['data'], { name: 'Anna' })

      const rendered = renderExplorer({
        label: 'data',
        value: { name: 'Anna' },
        editable: true,
        activeQuery: queryClient.getQueryCache().find({ queryKey: ['data'] }),
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
        activeQuery: queryClient.getQueryCache().find({ queryKey: ['data'] }),
      })

      fireEvent.click(rendered.getByLabelText('Remove all items'))
      expect(queryClient.getQueryData(['data'])).toStrictEqual([])
    })

    it('should delete the entry at the current "dataPath" when the delete button is clicked', () => {
      queryClient.setQueryData(['data'], ['a', 'b', 'c'])

      const rendered = renderExplorer({
        label: 'list',
        value: ['a', 'b', 'c'],
        editable: true,
        itemsDeletable: true,
        activeQuery: queryClient.getQueryCache().find({ queryKey: ['data'] }),
        dataPath: ['1'],
      })

      fireEvent.click(rendered.getByLabelText('Delete item'))
      expect(queryClient.getQueryData(['data'])).toStrictEqual(['a', 'c'])
    })

    it('should toggle a boolean value via "setQueryData" when the toggle button is clicked', () => {
      queryClient.setQueryData(['data'], { flag: true })

      const rendered = renderExplorer({
        label: 'flag',
        value: true,
        editable: true,
        activeQuery: queryClient.getQueryCache().find({ queryKey: ['data'] }),
        dataPath: ['flag'],
      })

      fireEvent.click(rendered.getByLabelText('Toggle value'))
      expect(queryClient.getQueryData(['data'])).toStrictEqual({ flag: false })
    })

    it.each([true, false])(
      'should expose "aria-pressed" on the toggle button when the value is %s',
      (value) => {
        queryClient.setQueryData(['data'], { flag: value })

        const rendered = renderExplorer({
          label: 'flag',
          value,
          editable: true,
          activeQuery: queryClient.getQueryCache().find({ queryKey: ['data'] }),
          dataPath: ['flag'],
        })

        expect(rendered.getByLabelText('Toggle value')).toHaveAttribute(
          'aria-pressed',
          String(value),
        )
      },
    )

    it('should not render action buttons when "editable" is false', () => {
      queryClient.setQueryData(['data'], ['a'])

      const rendered = renderExplorer({
        label: 'list',
        value: ['a'],
        editable: false,
        activeQuery: queryClient.getQueryCache().find({ queryKey: ['data'] }),
      })

      expect(
        rendered.queryByLabelText('Copy object to clipboard'),
      ).not.toBeInTheDocument()
      expect(
        rendered.queryByLabelText('Remove all items'),
      ).not.toBeInTheDocument()
    })

    it('should not render "ClearArrayButton" when value is not an array', () => {
      queryClient.setQueryData(['data'], { name: 'Anna' })

      const rendered = renderExplorer({
        label: 'user',
        value: { name: 'Anna' },
        editable: true,
        activeQuery: queryClient.getQueryCache().find({ queryKey: ['data'] }),
      })

      expect(
        rendered.queryByLabelText('Remove all items'),
      ).not.toBeInTheDocument()
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
      expect(rendered.queryByText('0:')).not.toBeInTheDocument()
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
      expect(rendered.queryByText('"item-0"')).not.toBeInTheDocument()
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
        activeQuery: queryClient.getQueryCache().find({ queryKey: ['data'] }),
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
        activeQuery: queryClient.getQueryCache().find({ queryKey: ['data'] }),
        dataPath: ['name'],
      })

      const input = rendered.getByLabelText('name:')
      expect(input).toHaveAttribute('type', 'text')

      fireEvent.change(input, { target: { value: 'Bob' } })
      expect(queryClient.getQueryData(['data'])).toStrictEqual({ name: 'Bob' })
    })

    it('should write the new number value via "setQueryData" when a number input is changed', () => {
      queryClient.setQueryData(['data'], { count: 1 })

      const rendered = renderExplorer({
        label: 'count',
        value: 1,
        editable: true,
        activeQuery: queryClient.getQueryCache().find({ queryKey: ['data'] }),
        dataPath: ['count'],
      })

      const input = rendered.getByLabelText('count:')
      expect(input).toHaveAttribute('type', 'number')

      fireEvent.change(input, {
        target: { value: '42', valueAsNumber: 42 },
      })
      expect(queryClient.getQueryData(['data'])).toStrictEqual({ count: 42 })
    })

    it('should render "ToggleValueButton" inline for a boolean primitive row', () => {
      queryClient.setQueryData(['data'], { flag: false })

      const rendered = renderExplorer({
        label: 'flag',
        value: false,
        editable: true,
        activeQuery: queryClient.getQueryCache().find({ queryKey: ['data'] }),
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
        activeQuery: queryClient.getQueryCache().find({ queryKey: ['data'] }),
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
        activeQuery: queryClient.getQueryCache().find({ queryKey: ['data'] }),
      })

      const ageRow = rendered.getByText('age:').parentElement!
      fireEvent.click(within(ageRow).getByLabelText('Delete item'))
      expect(queryClient.getQueryData(['data'])).toStrictEqual({ name: 'Anna' })

      const nameRow = rendered.getByText('name:').parentElement!
      fireEvent.click(within(nameRow).getByLabelText('Delete item'))
      expect(queryClient.getQueryData(['data'])).toStrictEqual({})
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
              .find({ queryKey: ['data'] }),
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
                  activeQuery={queryClient
                    .getQueryCache()
                    .find({ queryKey: ['data'] })}
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
