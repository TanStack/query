import { fireEvent, render, screen, waitFor } from 'solid-testing-library'

import {
  ErrorBoundary,
  Show,
  createContext,
  createEffect,
  createRenderEffect,
  createSignal,
} from 'solid-js'
import { QueryCache, QueryClientProvider, createQuery, useIsFetching } from '..'
import { createQueryClient, queryKey, setActTimeout, sleep } from './utils'
import type { QueryClient } from '..'

describe('useIsFetching', () => {
  // See https://github.com/tannerlinsley/react-query/issues/105
  it('should update as queries start and stop fetching', async () => {
    const queryCache = new QueryCache()
    const queryClient = createQueryClient({ queryCache })
    const key = queryKey()

    function IsFetching() {
      const isFetching = useIsFetching()
      return <div>isFetching: {isFetching()}</div>
    }

    function Query() {
      const [ready, setReady] = createSignal(false)

      createQuery(
        key,
        async () => {
          await sleep(50)
          return 'test'
        },
        {
          get enabled() {
            return ready()
          },
        },
      )

      return <button onClick={() => setReady(true)}>setReady</button>
    }

    function Page() {
      return (
        <div>
          <IsFetching />
          <Query />
        </div>
      )
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await screen.findByText('isFetching: 0')
    fireEvent.click(screen.getByRole('button', { name: /setReady/i }))
    await screen.findByText('isFetching: 1')
    await screen.findByText('isFetching: 0')
  })

  it('should not update state while rendering', async () => {
    const queryCache = new QueryCache()
    const queryClient = createQueryClient({ queryCache })

    const key1 = queryKey()
    const key2 = queryKey()

    const isFetchings: number[] = []

    function IsFetching() {
      const isFetching = useIsFetching()
      createRenderEffect(() => {
        isFetchings.push(isFetching())
      })
      return null
    }

    function FirstQuery() {
      createQuery(key1, async () => {
        await sleep(100)
        return 'data'
      })
      return null
    }

    function SecondQuery() {
      createQuery(key2, async () => {
        await sleep(100)
        return 'data'
      })
      return null
    }

    function Page() {
      const [renderSecond, setRenderSecond] = createSignal(false)

      createEffect(() => {
        setActTimeout(() => {
          setRenderSecond(true)
        }, 50)
      })

      return (
        <>
          <IsFetching />
          <FirstQuery />
          <Show when={renderSecond()}>
            <SecondQuery />
          </Show>
        </>
      )
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))
    // unlike react, Updating renderSecond wont cause a rerender for FirstQuery
    await waitFor(() => expect(isFetchings).toEqual([0, 1, 2, 1, 0]))
  })

  it('should be able to filter', async () => {
    const queryClient = createQueryClient()
    const key1 = queryKey()
    const key2 = queryKey()

    const isFetchings: number[] = []

    function One() {
      createQuery(key1, async () => {
        await sleep(10)
        return 'test'
      })
      return null
    }

    function Two() {
      createQuery(key2, async () => {
        await sleep(20)
        return 'test'
      })
      return null
    }

    function Page() {
      const [started, setStarted] = createSignal(false)
      const isFetching = useIsFetching(key1)

      createRenderEffect(() => {
        isFetchings.push(isFetching())
      })

      return (
        <div>
          <button onClick={() => setStarted(true)}>setStarted</button>
          <div>isFetching: {isFetching()}</div>
          <Show when={started()}>
            <>
              <One />
              <Two />
            </>
          </Show>
        </div>
      )
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await screen.findByText('isFetching: 0')
    fireEvent.click(screen.getByRole('button', { name: /setStarted/i }))
    await screen.findByText('isFetching: 1')
    await screen.findByText('isFetching: 0')
    // at no point should we have isFetching: 2
    expect(isFetchings).toEqual(expect.not.arrayContaining([2]))
  })

  describe('with custom context', () => {
    it('should update as queries start and stop fetching', async () => {
      const context = createContext<QueryClient | undefined>(undefined)

      const queryCache = new QueryCache()
      const queryClient = createQueryClient({ queryCache })
      const key = queryKey()

      function Page() {
        const [ready, setReady] = createSignal(false)

        const isFetching = useIsFetching(undefined, { context: context })

        createQuery(
          key,
          async () => {
            await sleep(50)
            return 'test'
          },
          {
            get enabled() {
              return ready()
            },
            context,
          },
        )

        return (
          <div>
            <div>isFetching: {isFetching}</div>
            <button onClick={() => setReady(true)}>setReady</button>
          </div>
        )
      }

      render(() => (
        <QueryClientProvider client={queryClient} context={context}>
          <Page />
        </QueryClientProvider>
      ))

      await screen.findByText('isFetching: 0')
      fireEvent.click(screen.getByRole('button', { name: /setReady/i }))
      await screen.findByText('isFetching: 1')
      await screen.findByText('isFetching: 0')
    })

    it('should throw if the context is not passed to useIsFetching', async () => {
      const context = createContext<QueryClient | undefined>(undefined)

      const queryCache = new QueryCache()
      const queryClient = createQueryClient({ queryCache })
      const key = queryKey()

      function Page() {
        const isFetching = useIsFetching()

        createQuery(key, async () => 'test', {
          enabled: true,
          context,
          useErrorBoundary: true,
        })

        return (
          <div>
            <div>isFetching: {isFetching}</div>
          </div>
        )
      }

      render(() => (
        <QueryClientProvider client={queryClient} context={context}>
          <ErrorBoundary fallback={() => <div>error boundary</div>}>
            <Page />
          </ErrorBoundary>
        </QueryClientProvider>
      ))

      await waitFor(() => screen.getByText('error boundary'))
    })
  })

  it('should show the correct fetching state when mounted after a query', async () => {
    const queryClient = createQueryClient()
    const key = queryKey()

    function Page() {
      createQuery(key, async () => {
        await sleep(10)
        return 'test'
      })

      const isFetching = useIsFetching()

      return (
        <div>
          <div>isFetching: {isFetching()}</div>
        </div>
      )
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await screen.findByText('isFetching: 1')
    await screen.findByText('isFetching: 0')
  })
})
