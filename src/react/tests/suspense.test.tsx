import { waitFor, fireEvent } from '@testing-library/react'
import { ErrorBoundary } from 'react-error-boundary'
import React from 'react'

import { sleep, queryKey, mockConsoleError, renderWithClient } from './utils'
import {
  useQuery,
  QueryClient,
  QueryCache,
  QueryErrorResetBoundary,
  useQueryErrorResetBoundary,
  UseQueryResult,
  UseInfiniteQueryResult,
  useInfiniteQuery,
} from '../..'

describe("useQuery's in Suspense mode", () => {
  const queryCache = new QueryCache()
  const queryClient = new QueryClient({ queryCache })

  it('should render the correct amount of times in Suspense mode', async () => {
    const key = queryKey()
    const states: UseQueryResult<number>[] = []

    let count = 0
    let renders = 0

    function Page() {
      renders++

      const [stateKey, setStateKey] = React.useState(key)

      const state = useQuery(
        stateKey,
        async () => {
          count++
          await sleep(10)
          return count
        },
        { suspense: true }
      )

      states.push(state)

      return (
        <button aria-label="toggle" onClick={() => setStateKey(queryKey())} />
      )
    }

    const rendered = renderWithClient(
      queryClient,
      <React.Suspense fallback="loading">
        <Page />
      </React.Suspense>
    )

    await sleep(20)

    await waitFor(() => rendered.getByLabelText('toggle'))
    fireEvent.click(rendered.getByLabelText('toggle'))

    await sleep(20)

    expect(renders).toBe(4)
    expect(states.length).toBe(2)
    expect(states[0]).toMatchObject({ data: 1, status: 'success' })
    expect(states[1]).toMatchObject({ data: 2, status: 'success' })
  })

  it('should return the correct states for a successful infinite query', async () => {
    const key = queryKey()
    const states: UseInfiniteQueryResult<number>[] = []

    function Page() {
      const [multiplier, setMultiplier] = React.useState(1)
      const state = useInfiniteQuery(
        `${key}_${multiplier}`,
        ({ pageParam = 1 }) => Number(pageParam * multiplier),
        {
          suspense: true,
          getNextPageParam: lastPage => lastPage + 1,
        }
      )
      states.push(state)
      return <button onClick={() => setMultiplier(2)}>next</button>
    }

    const rendered = renderWithClient(
      queryClient,
      <React.Suspense fallback="loading">
        <Page />
      </React.Suspense>
    )

    await sleep(10)

    expect(states.length).toBe(1)
    expect(states[0]).toMatchObject({
      data: { pages: [1], pageParams: [undefined] },
      status: 'success',
    })

    fireEvent.click(rendered.getByText('next'))
    await sleep(10)

    expect(states.length).toBe(3)
    expect(states[2]).toMatchObject({
      data: { pages: [2], pageParams: [undefined] },
      status: 'success',
    })
  })

  it('should not call the queryFn twice when used in Suspense mode', async () => {
    const key = queryKey()

    const queryFn = jest.fn()
    queryFn.mockImplementation(() => sleep(10))

    function Page() {
      useQuery([key], queryFn, { suspense: true })

      return <>rendered</>
    }

    const rendered = renderWithClient(
      queryClient,
      <React.Suspense fallback="loading">
        <Page />
      </React.Suspense>
    )

    await waitFor(() => rendered.getByText('rendered'))

    expect(queryFn).toHaveBeenCalledTimes(1)
  })

  it('should remove query instance when component unmounted', async () => {
    const key = queryKey()

    function Page() {
      useQuery(key, () => sleep(10), { suspense: true })

      return <>rendered</>
    }

    function App() {
      const [show, setShow] = React.useState(false)

      return (
        <>
          <React.Suspense fallback="loading">{show && <Page />}</React.Suspense>
          <button aria-label="toggle" onClick={() => setShow(prev => !prev)} />
        </>
      )
    }

    const rendered = renderWithClient(queryClient, <App />)

    expect(rendered.queryByText('rendered')).toBeNull()
    expect(queryCache.find(key)).toBeFalsy()

    fireEvent.click(rendered.getByLabelText('toggle'))
    await waitFor(() => rendered.getByText('rendered'))

    expect(queryCache.find(key)?.getObserversCount()).toBe(1)

    fireEvent.click(rendered.getByLabelText('toggle'))

    expect(rendered.queryByText('rendered')).toBeNull()
    expect(queryCache.find(key)?.getObserversCount()).toBe(0)
  })

  it('should call onSuccess on the first successful call', async () => {
    const key = queryKey()

    const successFn = jest.fn()

    function Page() {
      useQuery(
        [key],
        async () => {
          await sleep(10)
          return key
        },
        {
          suspense: true,
          select: () => 'selected',
          onSuccess: successFn,
        }
      )

      return <>rendered</>
    }

    const rendered = renderWithClient(
      queryClient,
      <React.Suspense fallback="loading">
        <Page />
      </React.Suspense>
    )

    await waitFor(() => rendered.getByText('rendered'))

    expect(successFn).toHaveBeenCalledTimes(1)
    expect(successFn).toHaveBeenCalledWith('selected')
  })

  it('should call every onSuccess handler within a suspense boundary', async () => {
    const key = queryKey()

    const successFn1 = jest.fn()
    const successFn2 = jest.fn()

    function FirstComponent() {
      useQuery(key, () => sleep(10), {
        suspense: true,
        onSuccess: successFn1,
      })

      return <span>first</span>
    }

    function SecondComponent() {
      useQuery(key, () => sleep(20), {
        suspense: true,
        onSuccess: successFn2,
      })

      return <span>second</span>
    }

    const rendered = renderWithClient(
      queryClient,
      <React.Suspense fallback="loading">
        <FirstComponent />
        <SecondComponent />
      </React.Suspense>
    )

    await waitFor(() => rendered.getByText('second'))

    expect(successFn1).toHaveBeenCalledTimes(1)
    expect(successFn2).toHaveBeenCalledTimes(1)
  })

  // https://github.com/tannerlinsley/react-query/issues/468
  it('should reset error state if new component instances are mounted', async () => {
    const key = queryKey()

    let succeed = false
    const consoleMock = mockConsoleError()

    function Page() {
      useQuery(
        key,
        async () => {
          await sleep(10)

          if (!succeed) {
            throw new Error('Suspense Error Bingo')
          } else {
            return 'data'
          }
        },
        {
          retryDelay: 10,
          suspense: true,
        }
      )

      return <div>rendered</div>
    }

    const rendered = renderWithClient(
      queryClient,
      <QueryErrorResetBoundary>
        {({ reset }) => (
          <ErrorBoundary
            onReset={reset}
            fallbackRender={({ resetErrorBoundary }) => (
              <div>
                <div>error boundary</div>
                <button
                  onClick={() => {
                    succeed = true
                    resetErrorBoundary()
                  }}
                >
                  retry
                </button>
              </div>
            )}
          >
            <React.Suspense fallback={'Loading...'}>
              <Page />
            </React.Suspense>
          </ErrorBoundary>
        )}
      </QueryErrorResetBoundary>
    )

    await waitFor(() => rendered.getByText('Loading...'))

    await waitFor(() => rendered.getByText('error boundary'))

    await waitFor(() => rendered.getByText('retry'))

    fireEvent.click(rendered.getByText('retry'))

    await waitFor(() => rendered.getByText('rendered'))

    consoleMock.mockRestore()
  })

  it('should retry fetch if the reset error boundary has been reset', async () => {
    const key = queryKey()

    let succeed = false
    const consoleMock = mockConsoleError()

    function Page() {
      useQuery(
        key,
        async () => {
          await sleep(10)
          if (!succeed) {
            throw new Error('Suspense Error Bingo')
          } else {
            return 'data'
          }
        },
        {
          retry: false,
          suspense: true,
        }
      )
      return <div>rendered</div>
    }

    const rendered = renderWithClient(
      queryClient,
      <QueryErrorResetBoundary>
        {({ reset }) => (
          <ErrorBoundary
            onReset={reset}
            fallbackRender={({ resetErrorBoundary }) => (
              <div>
                <div>error boundary</div>
                <button
                  onClick={() => {
                    resetErrorBoundary()
                  }}
                >
                  retry
                </button>
              </div>
            )}
          >
            <React.Suspense fallback="Loading...">
              <Page />
            </React.Suspense>
          </ErrorBoundary>
        )}
      </QueryErrorResetBoundary>
    )

    await waitFor(() => rendered.getByText('Loading...'))
    await waitFor(() => rendered.getByText('error boundary'))
    await waitFor(() => rendered.getByText('retry'))
    fireEvent.click(rendered.getByText('retry'))
    await waitFor(() => rendered.getByText('error boundary'))
    await waitFor(() => rendered.getByText('retry'))
    succeed = true
    fireEvent.click(rendered.getByText('retry'))
    await waitFor(() => rendered.getByText('rendered'))

    consoleMock.mockRestore()
  })

  it('should refetch when re-mounting', async () => {
    const key = queryKey()
    let count = 0

    function Component() {
      const result = useQuery(
        key,
        async () => {
          await sleep(100)
          count++
          return count
        },
        {
          retry: false,
          suspense: true,
          staleTime: 0,
        }
      )
      return (
        <div>
          <span>data: {result.data}</span>
          <span>fetching: {result.isFetching ? 'true' : 'false'}</span>
        </div>
      )
    }

    function Page() {
      const [show, setShow] = React.useState(true)
      return (
        <div>
          <button
            onClick={() => {
              setShow(!show)
            }}
          >
            {show ? 'hide' : 'show'}
          </button>
          <React.Suspense fallback="Loading...">
            {show && <Component />}
          </React.Suspense>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    await waitFor(() => rendered.getByText('Loading...'))
    await waitFor(() => rendered.getByText('data: 1'))
    await waitFor(() => rendered.getByText('fetching: false'))
    await waitFor(() => rendered.getByText('hide'))
    fireEvent.click(rendered.getByText('hide'))
    await waitFor(() => rendered.getByText('show'))
    fireEvent.click(rendered.getByText('show'))
    await waitFor(() => rendered.getByText('fetching: true'))
    await waitFor(() => rendered.getByText('data: 2'))
    await waitFor(() => rendered.getByText('fetching: false'))
  })

  it('should suspend when switching to a new query', async () => {
    const key1 = queryKey()
    const key2 = queryKey()

    function Component(props: { queryKey: string }) {
      const result = useQuery(
        props.queryKey,
        async () => {
          await sleep(100)
          return props.queryKey
        },
        {
          retry: false,
          suspense: true,
        }
      )
      return <div>data: {result.data}</div>
    }

    function Page() {
      const [key, setKey] = React.useState(key1)
      return (
        <div>
          <button
            onClick={() => {
              setKey(key2)
            }}
          >
            switch
          </button>
          <React.Suspense fallback="Loading...">
            <Component queryKey={key} />
          </React.Suspense>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    await waitFor(() => rendered.getByText('Loading...'))
    await waitFor(() => rendered.getByText(`data: ${key1}`))
    fireEvent.click(rendered.getByText('switch'))
    await waitFor(() => rendered.getByText('Loading...'))
    await waitFor(() => rendered.getByText(`data: ${key2}`))
    expect(
      // @ts-expect-error
      queryClient.getQueryCache().find(key2)!.observers[0].listeners.length
    ).toBe(1)
  })

  it('should retry fetch if the reset error boundary has been reset with global hook', async () => {
    const key = queryKey()

    let succeed = false
    const consoleMock = mockConsoleError()

    function Page() {
      useQuery(
        key,
        async () => {
          await sleep(10)
          if (!succeed) {
            throw new Error('Suspense Error Bingo')
          } else {
            return 'data'
          }
        },
        {
          retry: false,
          suspense: true,
        }
      )
      return <div>rendered</div>
    }

    function App() {
      const { reset } = useQueryErrorResetBoundary()
      return (
        <ErrorBoundary
          onReset={reset}
          fallbackRender={({ resetErrorBoundary }) => (
            <div>
              <div>error boundary</div>
              <button
                onClick={() => {
                  resetErrorBoundary()
                }}
              >
                retry
              </button>
            </div>
          )}
        >
          <React.Suspense fallback="Loading...">
            <Page />
          </React.Suspense>
        </ErrorBoundary>
      )
    }

    const rendered = renderWithClient(queryClient, <App />)

    await waitFor(() => rendered.getByText('Loading...'))
    await waitFor(() => rendered.getByText('error boundary'))
    await waitFor(() => rendered.getByText('retry'))
    fireEvent.click(rendered.getByText('retry'))
    await waitFor(() => rendered.getByText('error boundary'))
    await waitFor(() => rendered.getByText('retry'))
    succeed = true
    fireEvent.click(rendered.getByText('retry'))
    await waitFor(() => rendered.getByText('rendered'))

    consoleMock.mockRestore()
  })

  it('should not call the queryFn when not enabled', async () => {
    const key = queryKey()

    const queryFn = jest.fn()
    queryFn.mockImplementation(() => sleep(10))

    function Page() {
      const [enabled, setEnabled] = React.useState(false)
      useQuery([key], queryFn, { suspense: true, enabled })

      return <button aria-label="fire" onClick={() => setEnabled(true)} />
    }

    const rendered = renderWithClient(
      queryClient,
      <React.Suspense fallback="loading">
        <Page />
      </React.Suspense>
    )

    expect(queryFn).toHaveBeenCalledTimes(0)

    fireEvent.click(rendered.getByLabelText('fire'))

    expect(queryFn).toHaveBeenCalledTimes(1)
    await waitFor(() => rendered.getByLabelText('fire'))
  })
})
