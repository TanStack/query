import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient, onlineManager } from '@tanstack/query-core'
import { render } from '@solidjs/testing-library'
import DevtoolsPanelComponent from '../DevtoolsPanelComponent'

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

describe('DevtoolsPanelComponent', () => {
  const storage: { [key: string]: string } = {}
  let queryClient: QueryClient
  let previousRootFontSize = ''

  beforeEach(() => {
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
        observe = vi.fn()
        unobserve = vi.fn()
        disconnect = vi.fn()
      },
    )
    queryClient = new QueryClient()
    document.documentElement.style.fontSize = '16px'
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    Object.keys(storage).forEach((key) => delete storage[key])
    queryClient.clear()
    document.documentElement.style.fontSize = previousRootFontSize
  })

  it('should render the panel without throwing', () => {
    expect(() =>
      render(() => (
        <DevtoolsPanelComponent
          client={queryClient}
          queryFlavor="TanStack Query"
          version="5"
          onlineManager={onlineManager}
        />
      )),
    ).not.toThrow()
  })

  it('should not render the open devtools button in panel-only mode', () => {
    const rendered = render(() => (
      <DevtoolsPanelComponent
        client={queryClient}
        queryFlavor="TanStack Query"
        version="5"
        onlineManager={onlineManager}
      />
    ))

    expect(
      rendered.queryByLabelText('Open Tanstack query devtools'),
    ).not.toBeInTheDocument()
  })

  it('should call "onClose" when the close button is clicked', () => {
    const onClose = vi.fn()
    const rendered = render(() => (
      <DevtoolsPanelComponent
        client={queryClient}
        queryFlavor="TanStack Query"
        version="5"
        onlineManager={onlineManager}
        onClose={onClose}
      />
    ))

    rendered.getByLabelText('Close Tanstack query devtools').click()

    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
