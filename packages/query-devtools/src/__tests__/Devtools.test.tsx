import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient, QueryObserver, onlineManager } from '@tanstack/query-core'
import { fireEvent, render } from '@solidjs/testing-library'
import { createLocalStorage } from '@solid-primitives/storage'
import { Devtools } from '../Devtools'
import { PiPProvider, QueryDevtoolsContext, ThemeContext } from '../contexts'
import type { QueryDevtoolsProps } from '../contexts'

// `solid-transition-group` internally imports from
// `@solid-primitives/transition-group`, whose `exports` field points at
// `src/index.ts` (not published) under a `@solid-primitives/source` condition
// that Vite can't fall through, so we stub it with a transparent pass-through.
vi.mock('solid-transition-group', () => ({
  TransitionGroup: (props: { children: unknown }) => props.children,
}))

// `goober` compiles every `css\`...\`` template literal at mount time
// (template parsing + class hashing + style serialization), which
// dominates mount cost and produces no value for label/role-based
// assertions, so we replace it with a no-op factory.
vi.mock('goober', () => {
  let counter = 0
  const css = Object.assign(() => `tsqd-${++counter}`, {
    bind: () => css,
  })
  return { css, glob: () => {}, setup: () => {} }
})

describe('Devtools', () => {
  const storage: { [key: string]: string } = {}
  let queryClient: QueryClient
  let previousRootFontSize = ''

  beforeEach(() => {
    vi.useFakeTimers()
    previousRootFontSize = document.documentElement.style.fontSize
    vi.stubGlobal('localStorage', {
      getItem: (key: string) =>
        Object.prototype.hasOwnProperty.call(storage, key)
          ? storage[key]
          : null,
      setItem: (key: string, value: string) => {
        storage[key] = value
      },
      removeItem: (key: string) => {
        delete storage[key]
      },
      clear: () => {
        Object.keys(storage).forEach((key) => delete storage[key])
      },
    })
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    )
    vi.stubGlobal(
      'ResizeObserver',
      class {
        callback: ResizeObserverCallback
        constructor(callback: ResizeObserverCallback) {
          this.callback = callback
        }
        observe = vi.fn((target: Element) => {
          this.callback(
            [
              {
                target,
                contentRect: { width: 1000, height: 500 } as DOMRectReadOnly,
              } as ResizeObserverEntry,
            ],
            this as unknown as ResizeObserver,
          )
        })
        unobserve = vi.fn()
        disconnect = vi.fn()
      },
    )
    queryClient = new QueryClient()
    document.documentElement.style.fontSize = '16px'
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    Object.keys(storage).forEach((key) => delete storage[key])
    queryClient.clear()
    onlineManager.setOnline(true)
    document.documentElement.style.fontSize = previousRootFontSize
  })

  function renderDevtools(
    overrides: Partial<QueryDevtoolsProps> = {},
    initialStorage: Record<string, string> = {},
  ) {
    Object.entries(initialStorage).forEach(([key, value]) => {
      localStorage.setItem(key, value)
    })
    return render(() => {
      const [localStore, setLocalStore] = createLocalStorage({
        prefix: 'TanstackQueryDevtools',
      })
      return (
        <QueryDevtoolsContext.Provider
          value={{
            client: queryClient,
            queryFlavor: 'TanStack Query',
            version: '5',
            onlineManager,
            ...overrides,
          }}
        >
          <PiPProvider localStore={localStore} setLocalStore={setLocalStore}>
            <ThemeContext.Provider value={() => 'dark'}>
              <Devtools localStore={localStore} setLocalStore={setLocalStore} />
            </ThemeContext.Provider>
          </PiPProvider>
        </QueryDevtoolsContext.Provider>
      )
    })
  }

  describe('initial state', () => {
    it('should render the open devtools button', () => {
      const rendered = renderDevtools()

      expect(
        rendered.getByLabelText('Open Tanstack query devtools'),
      ).toBeInTheDocument()
    })

    it('should not render the panel by default', () => {
      const rendered = renderDevtools()

      expect(
        rendered.queryByLabelText('Tanstack query devtools'),
      ).not.toBeInTheDocument()
    })

    it('should render the panel when "initialIsOpen" is "true"', () => {
      const rendered = renderDevtools({ initialIsOpen: true })

      expect(
        rendered.getByLabelText('Tanstack query devtools'),
      ).toBeInTheDocument()
    })

    it('should render the panel when "localStore.open" is "true"', () => {
      const rendered = renderDevtools(
        {},
        { 'TanstackQueryDevtools.open': 'true' },
      )

      expect(
        rendered.getByLabelText('Tanstack query devtools'),
      ).toBeInTheDocument()
    })

    it('should not render the panel when "localStore.open" is "false" even if "initialIsOpen" is "true"', () => {
      const rendered = renderDevtools(
        { initialIsOpen: true },
        { 'TanstackQueryDevtools.open': 'false' },
      )

      expect(
        rendered.queryByLabelText('Tanstack query devtools'),
      ).not.toBeInTheDocument()
    })
  })

  describe('open and close', () => {
    it('should render the panel when the open button is clicked', () => {
      const rendered = renderDevtools()

      fireEvent.click(rendered.getByLabelText('Open Tanstack query devtools'))

      expect(
        rendered.getByLabelText('Tanstack query devtools'),
      ).toBeInTheDocument()
    })

    it('should hide the open button when the panel is open', () => {
      const rendered = renderDevtools()

      fireEvent.click(rendered.getByLabelText('Open Tanstack query devtools'))

      expect(
        rendered.queryByLabelText('Open Tanstack query devtools'),
      ).not.toBeInTheDocument()
    })

    it('should hide the panel when the close button is clicked', () => {
      const rendered = renderDevtools({ initialIsOpen: true })

      fireEvent.click(rendered.getByLabelText('Close tanstack query devtools'))

      expect(
        rendered.queryByLabelText('Tanstack query devtools'),
      ).not.toBeInTheDocument()
    })

    it('should render the open button after the panel is closed', () => {
      const rendered = renderDevtools({ initialIsOpen: true })

      fireEvent.click(rendered.getByLabelText('Close tanstack query devtools'))

      expect(
        rendered.getByLabelText('Open Tanstack query devtools'),
      ).toBeInTheDocument()
    })

    it('should persist "open" as "true" to "localStorage" when the open button is clicked', () => {
      const rendered = renderDevtools()

      fireEvent.click(rendered.getByLabelText('Open Tanstack query devtools'))

      expect(localStorage.getItem('TanstackQueryDevtools.open')).toBe('true')
    })

    it('should persist "open" as "false" to "localStorage" when the close button is clicked', () => {
      const rendered = renderDevtools({ initialIsOpen: true })

      fireEvent.click(rendered.getByLabelText('Close tanstack query devtools'))

      expect(localStorage.getItem('TanstackQueryDevtools.open')).toBe('false')
    })
  })

  describe('query list', () => {
    it('should render a row for each query in the cache', () => {
      queryClient.setQueryData(['posts'], [{ id: 1 }])
      queryClient.setQueryData(['users', 'me'], { id: 'u1' })
      const rendered = renderDevtools({ initialIsOpen: true })

      expect(
        rendered.getByLabelText(/Query key \["posts"\]/),
      ).toBeInTheDocument()
      expect(
        rendered.getByLabelText(/Query key \["users","me"\]/),
      ).toBeInTheDocument()
    })

    it('should reflect a newly added query reactively', () => {
      const rendered = renderDevtools({ initialIsOpen: true })

      expect(
        rendered.queryByLabelText(/Query key \["new"\]/),
      ).not.toBeInTheDocument()

      queryClient.setQueryData(['new'], 'hello')

      expect(rendered.getByLabelText(/Query key \["new"\]/)).toBeInTheDocument()
    })

    it('should filter queries by "queryHash"', () => {
      queryClient.setQueryData(['posts'], [])
      queryClient.setQueryData(['users'], [])
      const rendered = renderDevtools({ initialIsOpen: true })

      fireEvent.input(rendered.getByLabelText('Filter queries by query key'), {
        target: { value: 'posts' },
      })

      expect(
        rendered.getByLabelText(/Query key \["posts"\]/),
      ).toBeInTheDocument()
      expect(
        rendered.queryByLabelText(/Query key \["users"\]/),
      ).not.toBeInTheDocument()
    })

    it('should clear all queries when the clear cache button is clicked', () => {
      queryClient.setQueryData(['posts'], [])
      queryClient.setQueryData(['users'], [])
      const rendered = renderDevtools({ initialIsOpen: true })

      fireEvent.click(rendered.getByLabelText('Clear query cache'))

      expect(
        rendered.queryByLabelText(/Query key \["posts"\]/),
      ).not.toBeInTheDocument()
      expect(
        rendered.queryByLabelText(/Query key \["users"\]/),
      ).not.toBeInTheDocument()
    })

    it('should dispatch a "CLEAR_MUTATION_CACHE" event when clear cache is clicked in mutations view', () => {
      const rendered = renderDevtools({ initialIsOpen: true })
      fireEvent.click(rendered.getByText('Mutations'))

      const listener = vi.fn()
      window.addEventListener('@tanstack/query-devtools-event', listener)

      try {
        fireEvent.click(rendered.getByLabelText('Clear query cache'))

        const dispatched = listener.mock.calls.some(
          ([e]) => (e as CustomEvent).detail.type === 'CLEAR_MUTATION_CACHE',
        )
        expect(dispatched).toBe(true)
      } finally {
        window.removeEventListener('@tanstack/query-devtools-event', listener)
      }
    })
  })

  describe('view toggle', () => {
    it('should switch to mutations view when the mutations toggle is clicked', () => {
      const rendered = renderDevtools({ initialIsOpen: true })

      fireEvent.click(rendered.getByText('Mutations'))

      expect(
        rendered.container.querySelector('.tsqd-mutations-container'),
      ).not.toBeNull()
    })

    it('should render mutations in the mutations view', async () => {
      const rendered = renderDevtools({ initialIsOpen: true })

      fireEvent.click(rendered.getByText('Mutations'))

      const mutation = queryClient.getMutationCache().build(queryClient, {
        mutationKey: ['add-post'],
        mutationFn: () => Promise.resolve('ok'),
      })
      mutation.execute({})
      await vi.advanceTimersByTimeAsync(0)

      expect(
        rendered.getByLabelText(/Mutation submitted at/),
      ).toBeInTheDocument()
    })
  })

  describe('disabled and static queries', () => {
    it('should mark a disabled query in the row label', () => {
      const observer = queryClient.getQueryCache().build(queryClient, {
        queryKey: ['disabled-q'],
        queryFn: () => 'x',
      })
      observer.setOptions({
        ...observer.options,
        enabled: false,
      } as typeof observer.options)
      observer.setState({ ...observer.state, data: 'x' })
      const rendered = renderDevtools({ initialIsOpen: true })

      expect(rendered.getByLabelText(/disabled/)).toBeInTheDocument()
    })
  })

  describe('status counts', () => {
    it('should render status count badges', () => {
      const rendered = renderDevtools({ initialIsOpen: true })

      expect(rendered.getByLabelText(/Fresh: \d+/)).toBeInTheDocument()
      expect(rendered.getByLabelText(/Stale: \d+/)).toBeInTheDocument()
      expect(rendered.getByLabelText(/Fetching: \d+/)).toBeInTheDocument()
      expect(rendered.getByLabelText(/Paused: \d+/)).toBeInTheDocument()
      expect(rendered.getByLabelText(/Inactive: \d+/)).toBeInTheDocument()
    })

    it('should reflect the inactive count when a query is added without observers', () => {
      const rendered = renderDevtools({ initialIsOpen: true })

      expect(rendered.getByLabelText('Inactive: 0')).toBeInTheDocument()

      queryClient.setQueryData(['posts'], [{ id: 1 }])

      expect(rendered.getByLabelText('Inactive: 1')).toBeInTheDocument()
    })
  })

  describe('status tooltip', () => {
    it('should show the tooltip on mouse enter and hide it on mouse leave when the panel is narrow', () => {
      // Re-stub ResizeObserver with a narrow width (< secondBreakpoint = 796)
      // so `showLabel()` is false and the tooltip is rendered conditionally on
      // hover/focus.
      vi.stubGlobal(
        'ResizeObserver',
        class {
          callback: ResizeObserverCallback
          constructor(callback: ResizeObserverCallback) {
            this.callback = callback
          }
          observe = vi.fn((target: Element) => {
            this.callback(
              [
                {
                  target,
                  contentRect: { width: 500, height: 500 } as DOMRectReadOnly,
                } as ResizeObserverEntry,
              ],
              this as unknown as ResizeObserver,
            )
          })
          unobserve = vi.fn()
          disconnect = vi.fn()
        },
      )

      const rendered = renderDevtools({ initialIsOpen: true })
      const fresh = rendered.getByLabelText('Fresh: 0')

      expect(rendered.queryByRole('tooltip')).not.toBeInTheDocument()

      fireEvent.mouseEnter(fresh)
      expect(rendered.getByRole('tooltip')).toBeInTheDocument()

      fireEvent.mouseLeave(fresh)
      expect(rendered.queryByRole('tooltip')).not.toBeInTheDocument()
    })

    it('should show the tooltip on focus and hide it on blur when the panel is narrow', () => {
      vi.stubGlobal(
        'ResizeObserver',
        class {
          callback: ResizeObserverCallback
          constructor(callback: ResizeObserverCallback) {
            this.callback = callback
          }
          observe = vi.fn((target: Element) => {
            this.callback(
              [
                {
                  target,
                  contentRect: { width: 500, height: 500 } as DOMRectReadOnly,
                } as ResizeObserverEntry,
              ],
              this as unknown as ResizeObserver,
            )
          })
          unobserve = vi.fn()
          disconnect = vi.fn()
        },
      )

      const rendered = renderDevtools({ initialIsOpen: true })
      const fresh = rendered.getByLabelText('Fresh: 0')

      expect(rendered.queryByRole('tooltip')).not.toBeInTheDocument()

      fireEvent.focus(fresh)
      expect(rendered.getByRole('tooltip')).toBeInTheDocument()

      fireEvent.blur(fresh)
      expect(rendered.queryByRole('tooltip')).not.toBeInTheDocument()
    })
  })

  describe('query details', () => {
    it('should open the query details panel when a query row is clicked', () => {
      queryClient.setQueryData(['posts'], [{ id: 1 }])
      const rendered = renderDevtools({ initialIsOpen: true })

      fireEvent.click(rendered.getByLabelText(/Query key \["posts"\]/))

      expect(rendered.getByText('Query Details')).toBeInTheDocument()
    })

    it('should close the query details panel when the same row is clicked again', () => {
      queryClient.setQueryData(['details-toggle'], [{ id: 1 }])
      const rendered = renderDevtools({ initialIsOpen: true })

      fireEvent.click(rendered.getByLabelText(/Query key \["details-toggle"\]/))
      fireEvent.click(rendered.getByLabelText(/Query key \["details-toggle"\]/))

      expect(rendered.queryByText('Query Details')).not.toBeInTheDocument()
    })
  })

  describe('query actions', () => {
    it('should remove the query when the "Remove" button is clicked', () => {
      queryClient.setQueryData(['action-remove'], [{ id: 1 }])
      const rendered = renderDevtools({ initialIsOpen: true })

      fireEvent.click(rendered.getByLabelText(/Query key \["action-remove"\]/))
      fireEvent.click(rendered.getByText('Remove'))

      expect(
        rendered.queryByLabelText(/Query key \["action-remove"\]/),
      ).not.toBeInTheDocument()
    })

    it('should reset the query when the "Reset" button is clicked', () => {
      queryClient.setQueryData(['action-reset'], [{ id: 1 }])
      const rendered = renderDevtools({ initialIsOpen: true })

      fireEvent.click(rendered.getByLabelText(/Query key \["action-reset"\]/))
      fireEvent.click(rendered.getByText('Reset'))

      expect(queryClient.getQueryData(['action-reset'])).toBeUndefined()
    })

    it('should invalidate the query when the "Invalidate" button is clicked', () => {
      queryClient.setQueryData(['action-invalidate'], [{ id: 1 }])
      const rendered = renderDevtools({ initialIsOpen: true })

      fireEvent.click(
        rendered.getByLabelText(/Query key \["action-invalidate"\]/),
      )
      fireEvent.click(rendered.getByText('Invalidate'))

      expect(
        queryClient.getQueryState(['action-invalidate'])?.isInvalidated,
      ).toBe(true)
    })

    it('should dispatch a "REFETCH" event when "Refetch" is clicked', () => {
      queryClient.setQueryData(['action-refetch'], [{ id: 1 }])
      const rendered = renderDevtools({ initialIsOpen: true })

      const listener = vi.fn()
      window.addEventListener('@tanstack/query-devtools-event', listener)

      try {
        fireEvent.click(
          rendered.getByLabelText(/Query key \["action-refetch"\]/),
        )
        fireEvent.click(rendered.getByText('Refetch'))

        const dispatched = listener.mock.calls.some(
          ([e]) => (e as CustomEvent).detail.type === 'REFETCH',
        )
        expect(dispatched).toBe(true)
      } finally {
        window.removeEventListener('@tanstack/query-devtools-event', listener)
      }
    })

    it('should set the query status to "error" when "Trigger Error" is clicked', () => {
      queryClient.setQueryData(['action-error'], [{ id: 1 }])
      const rendered = renderDevtools({ initialIsOpen: true })

      fireEvent.click(rendered.getByLabelText(/Query key \["action-error"\]/))
      fireEvent.click(rendered.getByText('Trigger Error'))

      expect(queryClient.getQueryState(['action-error'])?.status).toBe('error')
    })

    it('should restore the query status when "Restore Error" is clicked after "Trigger Error"', () => {
      queryClient.setQueryData(['action-restore-error'], [{ id: 1 }])
      const rendered = renderDevtools({ initialIsOpen: true })

      fireEvent.click(
        rendered.getByLabelText(/Query key \["action-restore-error"\]/),
      )
      fireEvent.click(rendered.getByText('Trigger Error'))
      fireEvent.click(rendered.getByText('Restore Error'))

      expect(queryClient.getQueryState(['action-restore-error'])?.status).toBe(
        'pending',
      )
    })

    it('should restore the previous query options when "Restore Loading" is clicked after "Trigger Loading"', async () => {
      const queryFn = vi.fn(() => Promise.resolve('original'))
      queryClient.prefetchQuery({
        queryKey: ['action-restore-loading'],
        queryFn,
      })
      await vi.advanceTimersByTimeAsync(0)
      expect(queryFn).toHaveBeenCalledTimes(1)

      const rendered = renderDevtools({ initialIsOpen: true })

      fireEvent.click(
        rendered.getByLabelText(/Query key \["action-restore-loading"\]/),
      )

      // First click puts the query into a pending state with `data: undefined`
      // and stashes the original options in `fetchMeta.__previousQueryOptions`.
      fireEvent.click(rendered.getByText('Trigger Loading'))
      expect(
        queryClient.getQueryState(['action-restore-loading'])?.status,
      ).toBe('pending')

      // Second click runs `restoreQueryAfterLoadingOrError`, which cancels the
      // never-resolving fetch and refetches with the stashed options.
      fireEvent.click(rendered.getByText('Restore Loading'))
      await vi.advanceTimersByTimeAsync(0)

      expect(queryFn).toHaveBeenCalledTimes(2)
      expect(queryClient.getQueryData(['action-restore-loading'])).toBe(
        'original',
      )
    })
  })

  describe('mutation details', () => {
    it('should open the mutation details panel when a mutation row is clicked', async () => {
      const rendered = renderDevtools({ initialIsOpen: true })

      fireEvent.click(rendered.getByText('Mutations'))

      const mutation = queryClient.getMutationCache().build(queryClient, {
        mutationKey: ['mutation-detail'],
        mutationFn: () => Promise.resolve('ok'),
      })
      mutation.execute({})
      await vi.advanceTimersByTimeAsync(0)

      fireEvent.click(rendered.getByLabelText(/Mutation submitted at/))

      expect(rendered.getByText('Mutation Details')).toBeInTheDocument()
    })
  })

  describe('mutation sort order', () => {
    it('should toggle the mutation sort order in the mutations view', () => {
      const rendered = renderDevtools({ initialIsOpen: true })
      fireEvent.click(rendered.getByText('Mutations'))

      fireEvent.click(rendered.getByLabelText(/Sort order/))
      const afterFirstToggle = localStorage.getItem(
        'TanstackQueryDevtools.mutationSortOrder',
      )
      expect(afterFirstToggle).not.toBeNull()

      fireEvent.click(rendered.getByLabelText(/Sort order/))
      const afterSecondToggle = localStorage.getItem(
        'TanstackQueryDevtools.mutationSortOrder',
      )
      expect(afterSecondToggle).not.toBe(afterFirstToggle)
    })
  })

  describe('mutation filter', () => {
    it('should filter mutations by their "mutationKey"', async () => {
      const rendered = renderDevtools({ initialIsOpen: true })
      fireEvent.click(rendered.getByText('Mutations'))

      const matching = queryClient.getMutationCache().build(queryClient, {
        mutationKey: ['filter-match'],
        mutationFn: () => Promise.resolve('ok'),
      })
      const other = queryClient.getMutationCache().build(queryClient, {
        mutationKey: ['filter-other'],
        mutationFn: () => Promise.resolve('ok'),
      })
      matching.execute({})
      other.execute({})
      await vi.advanceTimersByTimeAsync(0)

      expect(rendered.getAllByLabelText(/Mutation submitted at/)).toHaveLength(
        2,
      )

      fireEvent.input(rendered.getByLabelText('Filter queries by query key'), {
        target: { value: 'filter-match' },
      })

      expect(rendered.getAllByLabelText(/Mutation submitted at/)).toHaveLength(
        1,
      )
    })
  })

  describe('data edit', () => {
    it('should switch to data editor when "Bulk Edit Data" is clicked', () => {
      queryClient.setQueryData(['edit-data'], { name: 'a' })
      const rendered = renderDevtools({ initialIsOpen: true })

      fireEvent.click(rendered.getByLabelText(/Query key \["edit-data"\]/))
      fireEvent.click(rendered.getByLabelText('Bulk Edit Data'))

      expect(
        rendered.getByLabelText('Edit query data as JSON'),
      ).toBeInTheDocument()
    })

    it('should save the edited data when the form is submitted', () => {
      queryClient.setQueryData(['edit-save'], { name: 'a' })
      const rendered = renderDevtools({ initialIsOpen: true })

      fireEvent.click(rendered.getByLabelText(/Query key \["edit-save"\]/))
      fireEvent.click(rendered.getByLabelText('Bulk Edit Data'))

      const textarea = rendered.getByLabelText('Edit query data as JSON')
      fireEvent.input(textarea, {
        target: { value: JSON.stringify({ name: 'b' }) },
      })
      fireEvent.submit(textarea.closest('form')!)

      expect(queryClient.getQueryData(['edit-save'])).toEqual({ name: 'b' })
    })

    it('should set an error state when the edited data is invalid JSON', () => {
      queryClient.setQueryData(['edit-invalid'], { name: 'a' })
      const rendered = renderDevtools({ initialIsOpen: true })

      fireEvent.click(rendered.getByLabelText(/Query key \["edit-invalid"\]/))
      fireEvent.click(rendered.getByLabelText('Bulk Edit Data'))

      const textarea = rendered.getByLabelText('Edit query data as JSON')
      fireEvent.input(textarea, { target: { value: 'not json' } })
      fireEvent.submit(textarea.closest('form')!)

      expect(rendered.getByText('Invalid Value')).toBeInTheDocument()
    })
  })

  describe('error type select', () => {
    it('should render the error type select when "errorTypes" is provided', () => {
      queryClient.setQueryData(['error-select'], [{ id: 1 }])
      const rendered = renderDevtools({
        initialIsOpen: true,
        errorTypes: [
          {
            name: 'NetworkError',
            initializer: () => new Error('Network'),
          },
        ],
      })

      fireEvent.click(rendered.getByLabelText(/Query key \["error-select"\]/))

      expect(
        rendered.getByLabelText('Select error type to trigger'),
      ).toBeInTheDocument()
    })

    it('should trigger error when an error type is selected', () => {
      queryClient.setQueryData(['error-select-trigger'], [{ id: 1 }])
      const rendered = renderDevtools({
        initialIsOpen: true,
        errorTypes: [
          {
            name: 'NetworkError',
            initializer: () => new Error('Network'),
          },
        ],
      })

      fireEvent.click(
        rendered.getByLabelText(/Query key \["error-select-trigger"\]/),
      )
      const select = rendered.getByLabelText('Select error type to trigger')
      fireEvent.change(select, { target: { value: 'NetworkError' } })

      expect(queryClient.getQueryState(['error-select-trigger'])?.status).toBe(
        'error',
      )
    })
  })

  describe('sort by', () => {
    it('should change sort key when the sort dropdown is changed in queries view', () => {
      const rendered = renderDevtools({ initialIsOpen: true })

      fireEvent.change(rendered.getByLabelText('Sort queries by'), {
        target: { value: 'last updated' },
      })

      expect(localStorage.getItem('TanstackQueryDevtools.sort')).toBe(
        'last updated',
      )
    })

    it('should change sort key when the sort dropdown is changed in mutations view', () => {
      const rendered = renderDevtools({ initialIsOpen: true })
      fireEvent.click(rendered.getByText('Mutations'))

      fireEvent.change(rendered.getByLabelText('Sort mutations by'), {
        target: { value: 'last updated' },
      })

      expect(localStorage.getItem('TanstackQueryDevtools.mutationSort')).toBe(
        'last updated',
      )
    })

    it('should hide disabled queries when "hideDisabledQueries" is enabled in localStorage', () => {
      const disabled = new QueryObserver(queryClient, {
        queryKey: ['hide-test-disabled'],
        queryFn: () => 'x',
        enabled: false,
      })
      const unsubscribe = disabled.subscribe(() => {})
      queryClient.setQueryData(['hide-test-disabled'], 'x')
      queryClient.setQueryData(['hide-test-active'], 'y')

      try {
        const rendered = renderDevtools(
          { initialIsOpen: true },
          { 'TanstackQueryDevtools.hideDisabledQueries': 'true' },
        )

        expect(
          rendered.queryByLabelText(/Query key \["hide-test-disabled"\]/),
        ).not.toBeInTheDocument()
        expect(
          rendered.getByLabelText(/Query key \["hide-test-active"\]/),
        ).toBeInTheDocument()
      } finally {
        unsubscribe()
      }
    })
  })

  describe('sort order', () => {
    it('should toggle the sort order when the sort order button is clicked', () => {
      const rendered = renderDevtools({ initialIsOpen: true })

      fireEvent.click(rendered.getByLabelText(/Sort order/))
      const afterFirstToggle = localStorage.getItem(
        'TanstackQueryDevtools.sortOrder',
      )
      expect(['1', '-1']).toContain(afterFirstToggle)

      fireEvent.click(rendered.getByLabelText(/Sort order/))
      const afterSecondToggle = localStorage.getItem(
        'TanstackQueryDevtools.sortOrder',
      )
      expect(afterSecondToggle).toBe(afterFirstToggle === '1' ? '-1' : '1')
    })
  })

  describe('settings menu', () => {
    it('should show "Position" sub-trigger when the settings menu is opened', () => {
      const rendered = renderDevtools({ initialIsOpen: true })

      fireEvent.keyDown(rendered.getByLabelText('Open settings menu'), {
        key: 'Enter',
      })

      // The menu is rendered through a Portal mounted on `document.body`,
      // outside `rendered.container`, so look it up via `document` directly.
      expect(
        document.querySelector('.tsqd-settings-menu-sub-trigger-position'),
      ).not.toBeNull()
    })

    it('should open "Position" sub-menu when the sub-trigger is activated', () => {
      const rendered = renderDevtools({ initialIsOpen: true })

      fireEvent.keyDown(rendered.getByLabelText('Open settings menu'), {
        key: 'Enter',
      })

      const subTrigger = document.querySelector<HTMLElement>(
        '.tsqd-settings-menu-sub-trigger-position',
      )
      expect(subTrigger).not.toBeNull()
      fireEvent.keyDown(subTrigger!, { key: 'ArrowRight' })

      expect(
        document.querySelector('[aria-label="Position settings"]'),
      ).not.toBeNull()
    })

    it('should persist "position" when a position radio item is selected', () => {
      const rendered = renderDevtools({ initialIsOpen: true })

      fireEvent.keyDown(rendered.getByLabelText('Open settings menu'), {
        key: 'Enter',
      })

      const subTrigger = document.querySelector<HTMLElement>(
        '.tsqd-settings-menu-sub-trigger-position',
      )
      expect(subTrigger).not.toBeNull()
      fireEvent.keyDown(subTrigger!, { key: 'ArrowRight' })

      const topItem = document.querySelector<HTMLElement>(
        '.tsqd-settings-menu-position-btn-top',
      )
      expect(topItem).not.toBeNull()
      fireEvent.keyDown(topItem!, { key: 'Enter' })

      expect(localStorage.getItem('TanstackQueryDevtools.position')).toBe('top')
    })

    it('should open "Theme" sub-menu when the sub-trigger is activated', () => {
      const rendered = renderDevtools({ initialIsOpen: true })

      fireEvent.keyDown(rendered.getByLabelText('Open settings menu'), {
        key: 'Enter',
      })

      const themeTrigger = Array.from(
        document.querySelectorAll<HTMLElement>(
          '.tsqd-settings-menu-sub-trigger',
        ),
      ).find((el) => String(el.textContent).includes('Theme'))
      expect(themeTrigger).not.toBeUndefined()
      fireEvent.keyDown(themeTrigger!, { key: 'ArrowRight' })

      expect(
        document.querySelector('[aria-label="Theme preference"]'),
      ).not.toBeNull()
    })

    it('should persist "theme_preference" when a theme radio item is selected', () => {
      const rendered = renderDevtools({ initialIsOpen: true })

      fireEvent.keyDown(rendered.getByLabelText('Open settings menu'), {
        key: 'Enter',
      })

      const themeTrigger = Array.from(
        document.querySelectorAll<HTMLElement>(
          '.tsqd-settings-menu-sub-trigger',
        ),
      ).find((el) => String(el.textContent).includes('Theme'))
      expect(themeTrigger).not.toBeUndefined()
      fireEvent.keyDown(themeTrigger!, { key: 'ArrowRight' })

      const themeMenu = document.querySelector(
        '[aria-label="Theme preference"]',
      )
      const lightItem = Array.from(
        themeMenu?.querySelectorAll<HTMLElement>('[role="menuitemradio"]') ??
          [],
      ).find((el) => String(el.textContent).includes('Light'))
      expect(lightItem).not.toBeUndefined()
      fireEvent.keyDown(lightItem!, { key: 'Enter' })

      expect(
        localStorage.getItem('TanstackQueryDevtools.theme_preference'),
      ).toBe('light')
    })

    it('should open "Hide disabled queries" sub-menu when the sub-trigger is activated', () => {
      const rendered = renderDevtools({ initialIsOpen: true })

      fireEvent.keyDown(rendered.getByLabelText('Open settings menu'), {
        key: 'Enter',
      })

      const hideTrigger = document.querySelector<HTMLElement>(
        '.tsqd-settings-menu-sub-trigger-disabled-queries',
      )
      expect(hideTrigger).not.toBeNull()
      fireEvent.keyDown(hideTrigger!, { key: 'ArrowRight' })

      expect(
        document.querySelector('[aria-label="Hide disabled queries setting"]'),
      ).not.toBeNull()
    })

    it('should persist "hideDisabledQueries" when a hide-disabled radio item is selected', () => {
      const rendered = renderDevtools({ initialIsOpen: true })

      fireEvent.keyDown(rendered.getByLabelText('Open settings menu'), {
        key: 'Enter',
      })

      const hideTrigger = document.querySelector<HTMLElement>(
        '.tsqd-settings-menu-sub-trigger-disabled-queries',
      )
      expect(hideTrigger).not.toBeNull()
      fireEvent.keyDown(hideTrigger!, { key: 'ArrowRight' })

      const hideItem = document.querySelector<HTMLElement>(
        '.tsqd-settings-menu-position-btn-hide',
      )
      expect(hideItem).not.toBeNull()
      fireEvent.keyDown(hideItem!, { key: 'Enter' })

      expect(
        localStorage.getItem('TanstackQueryDevtools.hideDisabledQueries'),
      ).toBe('true')
    })
  })

  describe('resize handle', () => {
    it('should increase height when "ArrowUp" is pressed on the resize handle in "bottom" position', () => {
      const rendered = renderDevtools(
        { position: 'bottom', initialIsOpen: true },
        { 'TanstackQueryDevtools.height': '500' },
      )

      const handle = rendered.getByLabelText('Resize devtools panel')
      fireEvent.keyDown(handle, { key: 'ArrowUp' })

      expect(
        Number(localStorage.getItem('TanstackQueryDevtools.height')),
      ).toBeGreaterThan(500)
    })

    it('should decrease height when "ArrowDown" is pressed on the resize handle in "bottom" position', () => {
      const rendered = renderDevtools(
        { position: 'bottom', initialIsOpen: true },
        { 'TanstackQueryDevtools.height': '500' },
      )

      const handle = rendered.getByLabelText('Resize devtools panel')
      fireEvent.keyDown(handle, { key: 'ArrowDown' })

      // Assert the value exists before parsing — `Number(null)` is `0`,
      // which would falsely satisfy `toBeLessThan(500)` if the write was missing.
      const nextHeight = localStorage.getItem('TanstackQueryDevtools.height')
      expect(nextHeight).not.toBeNull()
      expect(Number(nextHeight)).toBeLessThan(500)
    })

    it('should increase width when "ArrowLeft" is pressed on the resize handle in "right" position', () => {
      const rendered = renderDevtools(
        { position: 'right', initialIsOpen: true },
        { 'TanstackQueryDevtools.width': '500' },
      )

      const handle = rendered.getByLabelText('Resize devtools panel')
      fireEvent.keyDown(handle, { key: 'ArrowLeft' })

      expect(
        Number(localStorage.getItem('TanstackQueryDevtools.width')),
      ).toBeGreaterThan(500)
    })

    it('should decrease width when "ArrowRight" is pressed on the resize handle in "right" position', () => {
      const rendered = renderDevtools(
        { position: 'right', initialIsOpen: true },
        { 'TanstackQueryDevtools.width': '500' },
      )

      const handle = rendered.getByLabelText('Resize devtools panel')
      fireEvent.keyDown(handle, { key: 'ArrowRight' })

      const nextWidth = localStorage.getItem('TanstackQueryDevtools.width')
      expect(nextWidth).not.toBeNull()
      expect(Number(nextWidth)).toBeLessThan(500)
    })

    it('should increase height while dragging up in "bottom" position', () => {
      const initialHeight = 500
      const rendered = renderDevtools(
        { position: 'bottom', initialIsOpen: true },
        { 'TanstackQueryDevtools.height': String(initialHeight) },
      )

      const handle = rendered.getByLabelText('Resize devtools panel')
      // jsdom returns zeros for `getBoundingClientRect`; stub the panel size so
      // that drag math starts from `initialHeight` instead of 0.
      // Only `height` is read by the production code; other fields are unused.
      const panel = handle.parentElement
      expect(panel).toBeInstanceOf(HTMLElement)
      vi.spyOn(panel!, 'getBoundingClientRect').mockReturnValue({
        height: initialHeight,
        width: 0,
        x: 0,
        y: 0,
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        toJSON: () => ({}),
      })

      // Move the cursor up by 50px (`clientY` 100 → 50), which adds 50px to the
      // drag base of `initialHeight`.
      fireEvent.mouseDown(handle, { clientX: 0, clientY: 100 })
      fireEvent(
        document,
        new MouseEvent('mousemove', { clientX: 0, clientY: 50 }),
      )
      fireEvent(document, new MouseEvent('mouseup'))

      expect(
        Number(localStorage.getItem('TanstackQueryDevtools.height')),
      ).toBeGreaterThan(initialHeight)
    })

    it('should increase width while dragging left in "right" position', () => {
      const initialWidth = 500
      const rendered = renderDevtools(
        { position: 'right', initialIsOpen: true },
        { 'TanstackQueryDevtools.width': String(initialWidth) },
      )

      const handle = rendered.getByLabelText('Resize devtools panel')
      // `width` is read twice during drag: once as the base size, and again to
      // detect when the panel hits its minimum. Returning the same value both
      // times keeps the "minimum reached" branch from firing.
      const panel = handle.parentElement
      expect(panel).toBeInstanceOf(HTMLElement)
      vi.spyOn(panel!, 'getBoundingClientRect').mockReturnValue({
        height: 0,
        width: initialWidth,
        x: 0,
        y: 0,
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        toJSON: () => ({}),
      })

      // Move the cursor left by 50px (`clientX` 100 → 50); in `right` position,
      // moving left grows the panel by 50px from the drag base of `initialWidth`.
      fireEvent.mouseDown(handle, { clientX: 100, clientY: 0 })
      fireEvent(
        document,
        new MouseEvent('mousemove', { clientX: 50, clientY: 0 }),
      )
      fireEvent(document, new MouseEvent('mouseup'))

      expect(
        Number(localStorage.getItem('TanstackQueryDevtools.width')),
      ).toBeGreaterThan(initialWidth)
    })

    it('should clamp the width to the minimum when dragging shrinks the panel below the minimum width', () => {
      const initialWidth = 200
      const rendered = renderDevtools(
        { position: 'left', initialIsOpen: true },
        { 'TanstackQueryDevtools.width': String(initialWidth) },
      )

      const handle = rendered.getByLabelText('Resize devtools panel')
      const panel = handle.parentElement
      expect(panel).toBeInstanceOf(HTMLElement)
      // `width` is read twice during drag: once as the base size, and again
      // after the clamp to detect when the panel has hit its minimum. The
      // first call returns `initialWidth`; the second returns `0` so the
      // `localStore.width < newWidth` restore branch stays inactive and only
      // the `newSize < minWidth` clamp is observed.
      const getBoundingClientRect = vi
        .spyOn(panel!, 'getBoundingClientRect')
        .mockReturnValueOnce({
          height: 0,
          width: initialWidth,
          x: 0,
          y: 0,
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          toJSON: () => ({}),
        })
      getBoundingClientRect.mockReturnValue({
        height: 0,
        width: 0,
        x: 0,
        y: 0,
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        toJSON: () => ({}),
      })

      // In `left` position, dragging the cursor left (`clientX` 100 → 0)
      // shrinks the panel by 100px, which lands well under the 192px minimum.
      fireEvent.mouseDown(handle, { clientX: 100, clientY: 0 })
      fireEvent(
        document,
        new MouseEvent('mousemove', { clientX: 0, clientY: 0 }),
      )
      fireEvent(document, new MouseEvent('mouseup'))

      expect(Number(localStorage.getItem('TanstackQueryDevtools.width'))).toBe(
        192,
      )
    })

    it('should close the query details panel when dragging shrinks the panel below the minimum height', () => {
      queryClient.setQueryData(['shrink-below-min-height'], [{ id: 1 }])
      const rendered = renderDevtools({
        position: 'bottom',
        initialIsOpen: true,
      })

      // Open the query details so `selectedQueryHash` is set.
      fireEvent.click(
        rendered.getByLabelText(/Query key \["shrink-below-min-height"\]/),
      )
      expect(rendered.getByText('Query Details')).toBeInTheDocument()

      const handle = rendered.getByLabelText('Resize devtools panel')
      const panel = handle.parentElement
      expect(panel).toBeInstanceOf(HTMLElement)
      // Stub the base size to a value just above the 56px (`3.5rem`) minimum so
      // a small downward drag pushes `newSize` below `minHeight` and triggers
      // the clamp branch that also resets `selectedQueryHash`.
      vi.spyOn(panel!, 'getBoundingClientRect').mockReturnValue({
        height: 60,
        width: 0,
        x: 0,
        y: 0,
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        toJSON: () => ({}),
      })

      // In `bottom` position, dragging the cursor down (`clientY` 100 → 200)
      // shrinks the panel by 100px, which is well under the 56px minimum.
      fireEvent.mouseDown(handle, { clientX: 0, clientY: 100 })
      fireEvent(
        document,
        new MouseEvent('mousemove', { clientX: 0, clientY: 200 }),
      )
      fireEvent(document, new MouseEvent('mouseup'))

      expect(rendered.queryByText('Query Details')).not.toBeInTheDocument()
    })
  })

  describe('online toggle', () => {
    it('should swap the toggle label after the offline button is clicked', () => {
      const rendered = renderDevtools({ initialIsOpen: true })

      fireEvent.click(rendered.getByLabelText('Mock offline behavior'))

      expect(
        rendered.getByLabelText('Unset offline mocking behavior'),
      ).toBeInTheDocument()
    })
  })

  describe('logo close', () => {
    it('should hide the panel when the TanStack logo is clicked', () => {
      const rendered = renderDevtools({ initialIsOpen: true })

      fireEvent.click(rendered.getByLabelText('Close Tanstack query devtools'))

      expect(
        rendered.queryByLabelText('Tanstack query devtools'),
      ).not.toBeInTheDocument()
    })
  })
})
