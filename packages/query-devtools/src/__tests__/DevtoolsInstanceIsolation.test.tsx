import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient, onlineManager } from '@tanstack/query-core'
import { fireEvent, render } from '@solidjs/testing-library'
import { createLocalStorage } from '@solid-primitives/storage'
import { Devtools } from '../Devtools'
import { PiPProvider, QueryDevtoolsContext, ThemeContext } from '../contexts'
import type { QueryDevtoolsProps } from '../contexts'

// Same stubs as `Devtools.test.tsx` — see comments there for rationale.
vi.mock('solid-transition-group', () => ({
  TransitionGroup: (props: { children: unknown }) => props.children,
}))

vi.mock('goober', () => {
  let counter = 0
  const css = Object.assign(() => `tsqd-${++counter}`, {
    bind: () => css,
  })
  return { css, glob: () => {}, setup: () => {} }
})

describe('Devtools instance isolation', () => {
  let previousRootFontSize = ''

  beforeEach(() => {
    previousRootFontSize = document.documentElement.style.fontSize
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
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
    document.documentElement.style.fontSize = '16px'
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    onlineManager.setOnline(true)
    document.documentElement.style.fontSize = previousRootFontSize
  })

  // `@tanstack/query-core` only exports the default `onlineManager`
  // singleton, not the `OnlineManager` class, so a minimal stand-in with the
  // same shape is used to give each instance its own online manager.
  function createFakeOnlineManager(): typeof onlineManager {
    let online = true
    const listeners = new Set<(online: boolean) => void>()
    return {
      subscribe: (listener: (online: boolean) => void) => {
        listeners.add(listener)
        return () => listeners.delete(listener)
      },
      setOnline: (next: boolean) => {
        online = next
        listeners.forEach((listener) => listener(online))
      },
      isOnline: () => online,
    } as typeof onlineManager
  }

  function renderDevtools(
    queryClient: QueryClient,
    overrides: Partial<QueryDevtoolsProps> = {},
  ) {
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

  it('should not highlight the matching row in instance B when the same query key is selected in instance A', () => {
    // Both clients cache a query under the same key, so the two panels render
    // a row with the same `queryHash` — this is what makes a shared
    // `selectedQueryHash` signal visibly leak between instances.
    const clientA = new QueryClient()
    const clientB = new QueryClient()
    clientA.setQueryData(['shared-key'], { from: 'a' })
    clientB.setQueryData(['shared-key'], { from: 'b' })

    const a = renderDevtools(clientA, { initialIsOpen: true })
    const b = renderDevtools(clientB, { initialIsOpen: true })

    const bRow = b.getByLabelText(/Query key \["shared-key"\]/)
    const classNameBefore = bRow.className

    fireEvent.click(a.getByLabelText(/Query key \["shared-key"\]/))

    expect(a.getByText('Query Details')).toBeInTheDocument()
    // Selecting the row in A must not add the "selected" style to B's row
    // for the same query key.
    expect(bRow.className).toBe(classNameBefore)
    expect(b.queryByText('Query Details')).not.toBeInTheDocument()

    clientA.clear()
    clientB.clear()
  })

  it('should not clear the selected query of instance B when instance A is dragged below its minimum height', () => {
    const clientA = new QueryClient()
    const clientB = new QueryClient()
    clientA.setQueryData(['a-query'], { from: 'a' })
    clientB.setQueryData(['b-query'], { from: 'b' })

    const a = renderDevtools(clientA, { position: 'bottom', initialIsOpen: true })
    const b = renderDevtools(clientB, { position: 'bottom', initialIsOpen: true })

    fireEvent.click(b.getByLabelText(/Query key \["b-query"\]/))
    expect(b.getByText('Query Details')).toBeInTheDocument()

    const handle = a.getByLabelText('Resize devtools panel')
    const panel = handle.parentElement
    expect(panel).toBeInstanceOf(HTMLElement)
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

    // Shrinking instance A's panel below the minimum height clears A's own
    // selection — it must not clear instance B's independently selected query.
    fireEvent.mouseDown(handle, { clientX: 0, clientY: 100 })
    fireEvent(document, new MouseEvent('mousemove', { clientX: 0, clientY: 200 }))
    fireEvent(document, new MouseEvent('mouseup'))

    expect(b.getByText('Query Details')).toBeInTheDocument()

    clientA.clear()
    clientB.clear()
  })

  it('should not toggle the offline mock button of instance B when instance A mocks offline', () => {
    const clientA = new QueryClient()
    const clientB = new QueryClient()
    // Each instance gets its own `onlineManager`, matching how a real app
    // would isolate two independent clients — the devtools' own "mock
    // offline" UI state must follow the same isolation.
    const a = renderDevtools(clientA, {
      initialIsOpen: true,
      onlineManager: createFakeOnlineManager(),
    })
    const b = renderDevtools(clientB, {
      initialIsOpen: true,
      onlineManager: createFakeOnlineManager(),
    })

    fireEvent.click(a.getByLabelText('Mock offline behavior'))

    expect(
      a.getByLabelText('Unset offline mocking behavior'),
    ).toBeInTheDocument()
    // Instance B never had its offline mock toggled, so its button must still
    // read the "not mocked" label.
    expect(b.getByLabelText('Mock offline behavior')).toBeInTheDocument()

    clientA.clear()
    clientB.clear()
  })
})
