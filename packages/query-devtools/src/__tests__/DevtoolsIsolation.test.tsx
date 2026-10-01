import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient, onlineManager } from '@tanstack/query-core'
import { fireEvent, render } from '@solidjs/testing-library'
import DevtoolsComponent from '../DevtoolsComponent'
import DevtoolsPanelComponent from '../DevtoolsPanelComponent'
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

  // The Data Explorer renders string values as editable inputs, so the
  // displayed data value is read from the input rather than textContent.
  function dataOwnerValue(
    rendered: ReturnType<typeof renderType>,
  ): string | undefined {
    const input = detailsOf(rendered)?.querySelector('input')
    return input ? (input as HTMLInputElement).value : undefined
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

  it('cache updates in one client do not leak into the other panel', () => {
    renderPair()

    // Both panels show details for their own client's `["shared"]` query
    fireEvent.click(renderedA!.getByLabelText(/Query key \["shared"\]/))
    fireEvent.click(renderedB!.getByLabelText(/Query key \["shared"\]/))
    expect(dataOwnerValue(renderedA!)).toBe('a')
    expect(dataOwnerValue(renderedB!)).toBe('b')

    // Update the query in client A only
    clientA.setQueryData(['shared'], { owner: 'a-updated' })

    // Panel A reflects the update...
    expect(dataOwnerValue(renderedA!)).toBe('a-updated')
    // ...but panel B must keep showing its own client's data
    expect(dataOwnerValue(renderedB!)).toBe('b')
  })

  it('unmounting one panel does not break cache updates in the other panel', () => {
    renderPair()

    fireEvent.click(renderedB!.getByLabelText(/Query key \["shared"\]/))
    expect(detailsOf(renderedB!)).toBeInTheDocument()

    // Unmount panel A entirely; its cleanup must not wipe panel B's
    // cache-subscription registrations
    renderedA!.unmount()
    renderedA = undefined

    clientB.setQueryData(['shared'], { owner: 'b-updated' })
    expect(dataOwnerValue(renderedB!)).toBe('b-updated')
  })

  it('a panel-only instance reflects the onlineManager status', () => {
    // DevtoolsPanelComponent renders ContentView without Devtools, so the
    // offline indicator must be driven by the provider-level subscription
    const renderedPanel = render(() => (
      <DevtoolsPanelComponent
        client={clientA}
        queryFlavor="TanStack Query"
        version="5"
        onlineManager={onlineManager}
        initialIsOpen={true}
      />
    ))
    try {
      const offlineButton = () =>
        renderedPanel.container.querySelector(
          '.tsqd-action-mock-offline-behavior',
        )

      expect(offlineButton()!.getAttribute('aria-pressed')).toBe('false')

      onlineManager.setOnline(false)
      expect(offlineButton()!.getAttribute('aria-pressed')).toBe('true')

      onlineManager.setOnline(true)
      expect(offlineButton()!.getAttribute('aria-pressed')).toBe('false')
    } finally {
      onlineManager.setOnline(true)
      renderedPanel.unmount()
    }
  })
})
