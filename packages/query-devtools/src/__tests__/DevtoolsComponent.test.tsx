import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient, onlineManager } from '@tanstack/query-core'
import { render } from '@solidjs/testing-library'
import DevtoolsComponent from '../DevtoolsComponent'

// `solid-transition-group` internally imports from
// `@solid-primitives/transition-group`, whose `exports` field points at
// `src/index.ts` (not published) under a `@solid-primitives/source` condition
// that Vite can't fall through, so we stub it with a transparent pass-through.
vi.mock('solid-transition-group', () => ({
  TransitionGroup: (props: { children: unknown }) => props.children,
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
        observe = vi.fn()
        unobserve = vi.fn()
        disconnect = vi.fn()
      },
    )
    queryClient = new QueryClient()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    Object.keys(storage).forEach((key) => delete storage[key])
    queryClient.clear()
  })

  it('should render without throwing', () => {
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
})
