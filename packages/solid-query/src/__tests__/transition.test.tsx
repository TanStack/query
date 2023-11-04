import { describe, it } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@solidjs/testing-library'
import { Show, Suspense, createSignal, startTransition } from 'solid-js'
import { QueryCache, QueryClientProvider, createQuery } from '..'
import { createQueryClient, queryKey, sleep } from './utils'

describe("createQuery's in Suspense mode with transitions", () => {
  const queryCache = new QueryCache()
  const queryClient = createQueryClient({ queryCache })

  it('should render the content when the transition is done', async () => {
    const key = queryKey()

    function Suspended() {
      const state = createQuery(() => ({
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

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await waitFor(() => screen.getByText('Show'))
    fireEvent.click(screen.getByLabelText('toggle'))

    await waitFor(() => screen.getByText('Message'))
    // verify that the button also updated. See https://github.com/solidjs/solid/issues/1249
    await waitFor(() => screen.getByText('Hide'))
  })
})
