import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient, onlineManager } from '@tanstack/query-core'
import { render } from '@solidjs/testing-library'
import DevtoolsComponent from '../DevtoolsComponent'

// `solid-transition-group` internally imports from
// `@solid-primitives/transition-group`, whose `exports` field points at
// `src/index.ts` (not published) under a `@solid-primitives/source` condition
// that Vite can't fall through, so we stub it with a transparent pass-through.
vi.mock(import('solid-transition-group'), () => ({
  TransitionGroup: (props) => props.children,
}))

describe('DevtoolsComponent', () => {
  const storage: { [key: string]: string } = {}
  let queryClient: QueryClient

  beforeEach(() => {
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
        addEventListener: vi.fn<MediaQueryList['addEventListener']>(),
        removeEventListener: vi.fn<MediaQueryList['removeEventListener']>(),
        addListener: vi.fn<MediaQueryList['addListener']>(),
        removeListener: vi.fn<MediaQueryList['removeListener']>(),
        dispatchEvent: vi.fn<MediaQueryList['dispatchEvent']>(),
      })),
    )
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe = vi.fn<ResizeObserver['observe']>()
        unobserve = vi.fn<ResizeObserver['unobserve']>()
        disconnect = vi.fn<ResizeObserver['disconnect']>()
      },
    )
    queryClient = new QueryClient()
  })

  afterEach(() => {
    Object.keys(storage).forEach((key) => delete storage[key])
    queryClient.clear()
  })

  it('should render without throwing when only required props are provided', () => {
    expect(() =>
      render(() => (
        <DevtoolsComponent
          client={queryClient}
          queryFlavor="TanStack Query"
          version="5"
          onlineManager={onlineManager}
        />
      )),
    ).not.toThrow()
  })

  it('should render without throwing when all props are provided', () => {
    expect(() =>
      render(() => (
        <DevtoolsComponent
          client={queryClient}
          queryFlavor="TanStack Query"
          version="5"
          onlineManager={onlineManager}
          buttonPosition="top-left"
          position="left"
          initialIsOpen={true}
          errorTypes={[
            { name: 'NetworkError', initializer: () => new Error('Network') },
          ]}
          hideDisabledQueries={true}
          theme="dark"
        />
      )),
    ).not.toThrow()
  })
})
