import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render } from '@solidjs/testing-library'
import { Show, Suspense, createSignal, startTransition } from 'solid-js'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import { QueryCache, QueryClient, QueryClientProvider, useQuery } from '..'

describe("useQuery's in Suspense mode with transitions", () => {
  let queryCache: QueryCache
  let queryClient: QueryClient

  beforeEach(() => {
    vi.useFakeTimers()
    queryCache = new QueryCache()
    queryClient = new QueryClient({ queryCache })
  })

  afterEach(() => {
    vi.useRealTimers()
    queryClient.clear()
  })

  it('should render the content when the transition is done', async () => {
    const key = queryKey()

    function Suspended() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => true),
      }))
      return <Show when={state.data}>Message</Show>
    }

    function Page() {
      const [showSignal, setShowSignal] = createSignal(false)

      return (
        <div>
          <button
            aria-label="toggle"
            onClick={() =>
              startTransition(() => setShowSignal((value) => !value))
            }
          >
            {showSignal() ? 'Hide' : 'Show'}
          </button>
          <Suspense fallback="Loading">
            <Show when={showSignal()}>
              <Suspended />
            </Show>
          </Suspense>
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    expect(rendered.getByText('Show')).toBeInTheDocument()
    fireEvent.click(rendered.getByLabelText('toggle'))

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('Message')).toBeInTheDocument()
    // verify that the button also updated. See https://github.com/solidjs/solid/issues/1249
    expect(rendered.getByText('Hide')).toBeInTheDocument()
  })
})
