import { describe, expect, it } from 'vitest'
import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { Show, createEffect, createRenderEffect, createSignal } from 'solid-js'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
  useIsFetching,
  useQuery,
} from '..'
import { setActTimeout } from './utils'

describe('useIsFetching', () => {
  // See https://github.com/tannerlinsley/react-query/issues/105
  it('should update as queries start and stop fetching', async () => {
    const queryCache = new QueryCache()
    const queryClient = new QueryClient({ queryCache })
    const key = queryKey()

    function IsFetching() {
      const isFetching = useIsFetching()
      return <div>isFetching: {isFetching()}</div>
    }

    function Query() {
      const [ready, setReady] = createSignal(false)

      useQuery(() => ({
        queryKey: key,
        queryFn: async () => {
          await sleep(50)
          return 'test'
        },
        enabled: ready(),
      }))

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

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await waitFor(() =>
      expect(rendered.getByText('isFetching: 0')).toBeInTheDocument(),
    )
    fireEvent.click(rendered.getByRole('button', { name: /setReady/i }))
    await waitFor(() =>
      expect(rendered.getByText('isFetching: 1')).toBeInTheDocument(),
    )
    await waitFor(() =>
      expect(rendered.getByText('isFetching: 0')).toBeInTheDocument(),
    )
  })

  it('should not update state while rendering', async () => {
    const queryCache = new QueryCache()
    const queryClient = new QueryClient({ queryCache })

    const key1 = queryKey()
    const key2 = queryKey()

    const isFetchingArray: Array<number> = []

    function IsFetching() {
      const isFetching = useIsFetching()
      createRenderEffect(() => {
        isFetchingArray.push(isFetching())
      })
      return null
    }

    function FirstQuery() {
      useQuery(() => ({
        queryKey: key1,
        queryFn: async () => {
          await sleep(150)
          return 'data'
        },
      }))
      return null
    }

    function SecondQuery() {
      useQuery(() => ({
        queryKey: key2,
        queryFn: async () => {
          await sleep(200)
          return 'data'
        },
      }))
      return null
    }

    function Page() {
      const [renderSecond, setRenderSecond] = createSignal(false)

      createEffect(() => {
        setActTimeout(() => {
          setRenderSecond(true)
        }, 100)
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
    await waitFor(() => expect(isFetchingArray).toEqual([0, 1, 2, 1, 0]))
  })

  it('should be able to filter', async () => {
    const queryClient = new QueryClient()
    const key1 = queryKey()
    const key2 = queryKey()

    const isFetchingArray: Array<number> = []

    function One() {
      useQuery(() => ({
        queryKey: key1,
        queryFn: async () => {
          await sleep(10)
          return 'test'
        },
      }))
      return null
    }

    function Two() {
      useQuery(() => ({
        queryKey: key2,
        queryFn: async () => {
          await sleep(20)
          return 'test'
        },
      }))
      return null
    }

    function Page() {
      const [started, setStarted] = createSignal(false)
      const isFetching = useIsFetching(() => ({
        queryKey: key1,
      }))

      createRenderEffect(() => {
        isFetchingArray.push(isFetching())
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

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await rendered.findByText('isFetching: 0')
    fireEvent.click(rendered.getByRole('button', { name: /setStarted/i }))
    await rendered.findByText('isFetching: 1')
    await rendered.findByText('isFetching: 0')
    // at no point should we have isFetching: 2
    expect(isFetchingArray).toEqual(expect.not.arrayContaining([2]))
  })

  it('should show the correct fetching state when mounted after a query', async () => {
    const queryClient = new QueryClient()
    const key = queryKey()

    function Page() {
      useQuery(() => ({
        queryKey: key,
        queryFn: async () => {
          await sleep(10)
          return 'test'
        },
      }))

      const isFetching = useIsFetching()

      return (
        <div>
          <div>isFetching: {isFetching()}</div>
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await waitFor(() =>
      expect(rendered.getByText('isFetching: 1')).toBeInTheDocument(),
    )
    await waitFor(() =>
      expect(rendered.getByText('isFetching: 0')).toBeInTheDocument(),
    )
  })

  it('should use provided custom queryClient', async () => {
    const queryClient = new QueryClient()
    const key = queryKey()

    function Page() {
      useQuery(
        () => ({
          queryKey: key,
          queryFn: async () => {
            await sleep(10)
            return 'test'
          },
        }),
        () => queryClient,
      )

      const isFetching = useIsFetching(undefined, () => queryClient)

      return (
        <div>
          <div>isFetching: {isFetching()}</div>
        </div>
      )
    }

    const rendered = render(() => <Page></Page>)

    await waitFor(() =>
      expect(rendered.getByText('isFetching: 1')).toBeInTheDocument(),
    )
  })
})
