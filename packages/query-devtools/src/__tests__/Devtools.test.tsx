import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient, onlineManager } from '@tanstack/query-core'
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
    // jsdom doesn't implement `PointerEvent`; the DropdownMenu trigger checks
    // `e.pointerType !== 'touch'` on pointerdown to decide whether to open,
    // so we polyfill it as a thin wrapper around `MouseEvent`.
    if (typeof window.PointerEvent === 'undefined') {
      class FakePointerEvent extends MouseEvent {
        pointerType: string
        constructor(type: string, init: PointerEventInit = {}) {
          super(type, init)
          this.pointerType = init.pointerType ?? 'mouse'
        }
      }
      vi.stubGlobal('PointerEvent', FakePointerEvent)
    }
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
})
