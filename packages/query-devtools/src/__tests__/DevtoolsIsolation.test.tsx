import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient, onlineManager } from '@tanstack/query-core'
import { fireEvent, render } from '@solidjs/testing-library'
import DevtoolsComponent from '../DevtoolsComponent'
import type { render as renderType } from '@solidjs/testing-library'

// `solid-transition-group` internally imports from
// `@solid-primitives/transition-group`, whose `exports` field points at
// `src/index.ts` (not published) under a `@solid-primitives/source` condition
// that Vite can't fall through, so we stub it with a transparent pass-through.
vi.mock('solid-transition-group', () => ({
  TransitionGroup: (props: { children: unknown }) => props.children,
}))

describe('Devtools instance isolation', () => {
  const storage: { [key: string]: string } = {}
  let clientA: QueryClient
  let clientB: QueryClient
  let renderedA: ReturnType<typeof renderType> | undefined
  let renderedB: ReturnType<typeof renderType> | undefined

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
    clientA = new QueryClient()
    clientB = new QueryClient()
    // Both clients hold a query with the same key, mirroring the issue's
    // repro where each panel has its own QueryClient with similar queries.
    clientA.setQueryData(['shared'], { owner: 'a' })
    clientB.setQueryData(['shared'], { owner: 'b' })
  })

  afterEach(() => {
    renderedA?.unmount()
    renderedB?.unmount()
    renderedA = undefined
    renderedB = undefined
    vi.unstubAllGlobals()
    Object.keys(storage).forEach((key) => delete storage[key])
    clientA.clear()
    clientB.clear()
  })

  function renderPair() {
    renderedA = render(() => (
      <DevtoolsComponent
        client={clientA}
        queryFlavor="TanStack Query"
        version="5"
        onlineManager={onlineManager}
        initialIsOpen={true}
      />
    ))
    renderedB = render(() => (
      <DevtoolsComponent
        client={clientB}
        queryFlavor="TanStack Query"
        version="5"
        onlineManager={onlineManager}
        initialIsOpen={true}
      />
    ))
  }

  function detailsOf(rendered: ReturnType<typeof renderType>): Element | null {
    return rendered.container.querySelector('.tsqd-query-details-container')
  }

  it('selecting a query in one panel does not affect the other panel', () => {
    renderPair()

    // Both panels render their own query list
    expect(
      renderedA!.getByLabelText(/Query key \["shared"\]/),
    ).toBeInTheDocument()
    expect(
      renderedB!.getByLabelText(/Query key \["shared"\]/),
    ).toBeInTheDocument()

    // Select the query in panel A
    fireEvent.click(renderedA!.getByLabelText(/Query key \["shared"\]/))

    // Panel A shows the query details...
    expect(detailsOf(renderedA!)).toBeInTheDocument()
    // ...but panel B must stay unaffected (https://github.com/TanStack/query/issues/9681)
    expect(detailsOf(renderedB!)).not.toBeInTheDocument()
  })

  it('deselecting in one panel does not clear the selection of the other panel', () => {
    renderPair()

    fireEvent.click(renderedA!.getByLabelText(/Query key \["shared"\]/))
    fireEvent.click(renderedB!.getByLabelText(/Query key \["shared"\]/))

    // Both panels show their own details
    expect(detailsOf(renderedA!)).toBeInTheDocument()
    expect(detailsOf(renderedB!)).toBeInTheDocument()

    // Deselect in panel A by clicking the row again
    fireEvent.click(renderedA!.getByLabelText(/Query key \["shared"\]/))

    // Panel A hides its details, panel B keeps its own selection
    expect(detailsOf(renderedA!)).not.toBeInTheDocument()
    expect(detailsOf(renderedB!)).toBeInTheDocument()
  })
})
