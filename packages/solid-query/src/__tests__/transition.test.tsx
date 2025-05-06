import { describe, expect, it } from 'vitest'
import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { Show, Suspense, createSignal, startTransition } from 'solid-js'
import { QueryCache, QueryClientProvider, useQuery } from '..'
import { createQueryClient, queryKey, sleep } from './utils'

describe("useQuery's in Suspense mode with transitions", () => {
  const queryCache = new QueryCache()
  const queryClient = createQueryClient({ queryCache })

  it('should render the content when the transition is done', async () => {
    const key = queryKey()

    function Suspended() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: async () => {
          await sleep(10)
          return true
        },
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

    await waitFor(() => expect(rendered.getByText('Show')).toBeInTheDocument())
    fireEvent.click(rendered.getByLabelText('toggle'))

    await waitFor(() =>
      expect(rendered.getByText('Message')).toBeInTheDocument(),
    )
    // verify that the button also updated. See https://github.com/solidjs/solid/issues/1249
    await waitFor(() => expect(rendered.getByText('Hide')).toBeInTheDocument())
  })
})
