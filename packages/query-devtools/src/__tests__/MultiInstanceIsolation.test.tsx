import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient, onlineManager } from '@tanstack/query-core'
import { fireEvent, render, within } from '@solidjs/testing-library'
import DevtoolsComponent from '../DevtoolsComponent'

// `solid-transition-group` internally imports from
// `@solid-primitives/transition-group`, whose `exports` field points at
// `src/index.ts` (not published) under a `@solid-primitives/source` condition
// that Vite can't fall through, so we stub it with a transparent pass-through.
vi.mock('solid-transition-group', () => ({
  TransitionGroup: (props: { children: unknown }) => props.children,
}))

// `goober` compiles every `css\`...\`` template literal at mount time, which
// dominates mount cost and produces no value for label/role-based
// assertions, so we replace it with a no-op factory.
vi.mock('goober', () => {
  let counter = 0
  const css = Object.assign(() => `tsqd-${++counter}`, {
    bind: () => css,
  })
  return { css, glob: () => {}, setup: () => {} }
})

// Regression tests for https://github.com/TanStack/query/issues/9681 —
// selection, panel width, offline-mocking, and cache-subscription state used
// to live in module-level signals/maps shared by every mounted Devtools
// instance, so actions in one panel leaked into every other panel on the
// page (e.g. two panels pointing at two different `QueryClient`s).
describe('multiple Devtools instances', () => {
  const storage: { [key: string]: string } = {}
  let queryClientA: QueryClient
  let queryClientB: QueryClient

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
    queryClientA = new QueryClient()
    queryClientB = new QueryClient()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    Object.keys(storage).forEach((key) => delete storage[key])
    queryClientA.clear()
    queryClientB.clear()
  })

  function renderTwoInstances() {
    // Both clients use the same query key on purpose: this is exactly the
    // scenario that leaked through the old module-level `queryCacheMap`,
    // where a notify from client A's cache could invoke client B's row
    // callback with client A's cache accessor.
    queryClientA.setQueryData(['shared-key'], { owner: 'A' })
    queryClientB.setQueryData(['shared-key'], { owner: 'B' })

    return render(() => (
      <>
        <DevtoolsComponent
          client={queryClientA}
          queryFlavor="TanStack Query"
          version="5"
          onlineManager={onlineManager}
          initialIsOpen={true}
        />
        <DevtoolsComponent
          client={queryClientB}
          queryFlavor="TanStack Query"
          version="5"
          onlineManager={onlineManager}
          initialIsOpen={true}
        />
      </>
    ))
  }

  it('should not open the query details panel in instance B when a row is selected in instance A', () => {
    const rendered = renderTwoInstances()
    const panels = rendered.getAllByLabelText('Tanstack query devtools')
    expect(panels).toHaveLength(2)
    const [panelA, panelB] = panels

    fireEvent.click(within(panelA).getByLabelText(/Query key \["shared-key"\]/))

    expect(within(panelA).getByText('Query Details')).toBeInTheDocument()
    expect(within(panelB).queryByText('Query Details')).not.toBeInTheDocument()
  })

  it("should show each instance's own data in its query details, not the other instance's", () => {
    const rendered = renderTwoInstances()
    const panels = rendered.getAllByLabelText('Tanstack query devtools')
    const [panelA, panelB] = panels

    fireEvent.click(within(panelA).getByLabelText(/Query key \["shared-key"\]/))
    fireEvent.click(within(panelB).getByLabelText(/Query key \["shared-key"\]/))

    // The "Data" explorer field is editable, so string values render as an
    // `<input>` rather than plain text.
    expect(within(panelA).getByDisplayValue('A')).toBeInTheDocument()
    expect(within(panelB).getByDisplayValue('B')).toBeInTheDocument()
  })

  it("should not leak client A's cache updates into client B's row data", () => {
    const rendered = renderTwoInstances()
    const panels = rendered.getAllByLabelText('Tanstack query devtools')
    const [panelA, panelB] = panels

    fireEvent.click(within(panelB).getByLabelText(/Query key \["shared-key"\]/))
    expect(within(panelB).getByDisplayValue('B')).toBeInTheDocument()

    // Notify only client A's cache. Under the old module-level
    // `queryCacheMap`, this would also invoke B's row/detail callbacks with
    // A's cache accessor, overwriting B's displayed data with A's.
    queryClientA.setQueryData(['shared-key'], { owner: 'A-updated' })

    expect(within(panelB).getByDisplayValue('B')).toBeInTheDocument()
    expect(
      within(panelB).queryByDisplayValue('A-updated'),
    ).not.toBeInTheDocument()
  })
})
