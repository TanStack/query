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
})
