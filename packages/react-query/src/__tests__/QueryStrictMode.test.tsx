import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  onTestFinished,
  vi,
} from 'vitest'
import { act, fireEvent, render } from '@testing-library/react'
import * as React from 'react'
import * as ReactDOMClient from 'react-dom/client'
import { ErrorBoundary } from 'react-error-boundary'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import {
  IsRestoringProvider,
  QueryClient,
  QueryClientProvider,
  QueryErrorResetBoundary,
  QueryObserver,
  QueryStrictMode,
  QueryStrictModeError,
  QueryStrictModeMissingPrefetchError,
  QueryStrictModeUnusedPrefetchError,
  dehydrate,
  hydrate,
  noop,
  notifyManager,
  usePrefetchQuery,
  useQueries,
  useQuery,
  useSuspenseInfiniteQuery,
  useSuspenseQueries,
  useSuspenseQuery,
} from '..'
import { renderWithClient } from './utils'
import type {
  QueryKey,
  QueryStrictModeEvent,
  QueryStrictModeUnusedPrefetchEvent,
} from '..'

type Handler = (event: QueryStrictModeEvent) => void

const toStrictModeError = (event: QueryStrictModeEvent) =>
  event.type === 'missing-prefetch'
    ? new QueryStrictModeMissingPrefetchError(event)
    : new QueryStrictModeUnusedPrefetchError(event)

describe('QueryStrictMode', () => {
  let queryClient: QueryClient
  let handler: ReturnType<typeof vi.fn<Handler>>

  beforeEach(() => {
    vi.useFakeTimers()
    queryClient = new QueryClient()
    handler = vi.fn<Handler>()
  })

  afterEach(() => {
    queryClient.clear()
    vi.useRealTimers()
  })

  const getQuery = (key: QueryKey) =>
    queryClient.getQueryCache().find({ queryKey: key })

  const handledTypes = () => handler.mock.calls.map(([event]) => event.type)

  function SuspenseQuery({ id, ms = 10 }: { id: QueryKey; ms?: number }) {
    const { data } = useSuspenseQuery({
      queryKey: id,
      queryFn: () => sleep(ms).then(() => `data ${String(id)}`),
    })
    return <div>{data}</div>
  }

  // Renders like an app does, outside of `act`. `act` flushes effects as soon as it renders, but an
  // app flushes passive effects in a later task, after any data that arrives in a microtask. React
  // schedules that task with the real `setImmediate`, so this uses real timers. `React.StrictMode`
  // only mounts, unmounts and mounts effects again at the root, so `strictMode` wraps the provider
  const renderOutsideAct = (
    ui: React.ReactElement,
    { strictMode = false }: { strictMode?: boolean } = {},
  ) => {
    vi.useRealTimers()
    const globals = globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
    const previousIsReactActEnvironment = globals.IS_REACT_ACT_ENVIRONMENT
    globals.IS_REACT_ACT_ENVIRONMENT = false
    notifyManager.setNotifyFunction((fn) => fn())

    const container = document.createElement('div')
    const root = ReactDOMClient.createRoot(container)
    const tree = (
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    )
    root.render(strictMode ? <React.StrictMode>{tree}</React.StrictMode> : tree)

    onTestFinished(() => {
      root.unmount()
      notifyManager.setNotifyFunction((fn) => {
        act(fn)
      })
      globals.IS_REACT_ACT_ENVIRONMENT = previousIsReactActEnvironment
    })

    return container
  }

  // Prefetches a query whose data arrives in a microtask
  function ResolvedPrefetch({ id }: { id: QueryKey }) {
    usePrefetchQuery({ queryKey: id, queryFn: () => Promise.resolve('data') })
    return null
  }

  // Reads the query that `ResolvedPrefetch` prefetches
  function ResolvedQuery({ id }: { id: QueryKey }) {
    const { data } = useQuery({
      queryKey: id,
      queryFn: () => Promise.resolve('data'),
    })
    return <div>{data}</div>
  }

  describe('missing-prefetch', () => {
    it('should log once when a suspense hook starts a fetch during render', async () => {
      const key = queryKey()

      const rendered = renderWithClient(
        queryClient,
        <React.StrictMode>
          <QueryStrictMode handleMissingPrefetch={handler}>
            <React.Suspense fallback="loading">
              <SuspenseQuery id={key} />
            </React.Suspense>
          </QueryStrictMode>
        </React.StrictMode>,
      )

      expect(rendered.getByText('loading')).toBeInTheDocument()
      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler).toHaveBeenCalledWith({
        type: 'missing-prefetch',
        suspense: true,
        message: expect.stringContaining(getQuery(key)!.queryHash),
        query: getQuery(key),
      })

      await act(() => vi.advanceTimersByTimeAsync(10))
      expect(rendered.getByText(`data ${String(key)}`)).toBeInTheDocument()

      // The suspense fetch itself must not count as an unused prefetch
      await act(() => vi.advanceTimersByTimeAsync(10_000))
      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should log for useSuspenseInfiniteQuery', async () => {
      const key = queryKey()

      function Page() {
        const { data } = useSuspenseInfiniteQuery({
          queryKey: key,
          queryFn: ({ pageParam }) => sleep(10).then(() => pageParam),
          initialPageParam: 1,
          getNextPageParam: (lastPage) => lastPage + 1,
        })
        return <div>pages: {data.pages.join(',')}</div>
      }

      const rendered = renderWithClient(
        queryClient,
        <QueryStrictMode handleMissingPrefetch={handler}>
          <React.Suspense fallback="loading">
            <Page />
          </React.Suspense>
        </QueryStrictMode>,
      )

      await act(() => vi.advanceTimersByTimeAsync(10))
      expect(rendered.getByText('pages: 1')).toBeInTheDocument()
      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler.mock.calls[0]![0]).toMatchObject({
        type: 'missing-prefetch',
        query: getQuery(key),
      })
    })

    it('should not log when the query is being prefetched', async () => {
      const key = queryKey()

      void queryClient
        .query({
          queryKey: key,
          queryFn: () => sleep(10).then(() => `data ${String(key)}`),
        })
        .catch(noop)

      const rendered = renderWithClient(
        queryClient,
        <QueryStrictMode handleMissingPrefetch={handler}>
          <React.Suspense fallback="loading">
            <SuspenseQuery id={key} />
          </React.Suspense>
        </QueryStrictMode>,
      )

      expect(rendered.getByText('loading')).toBeInTheDocument()
      await act(() => vi.advanceTimersByTimeAsync(10))
      expect(rendered.getByText(`data ${String(key)}`)).toBeInTheDocument()

      await act(() => vi.advanceTimersByTimeAsync(10_000))
      expect(handler).not.toHaveBeenCalled()
    })

    it('should not log when the query was prefetched with usePrefetchQuery', async () => {
      const key = queryKey()
      const queryFn = () => sleep(10).then(() => `data ${String(key)}`)

      function Parent() {
        usePrefetchQuery({ queryKey: key, queryFn })
        return (
          <React.Suspense fallback="loading">
            <SuspenseQuery id={key} />
          </React.Suspense>
        )
      }

      const rendered = renderWithClient(
        queryClient,
        <QueryStrictMode handleMissingPrefetch={handler}>
          <Parent />
        </QueryStrictMode>,
      )

      await act(() => vi.advanceTimersByTimeAsync(10))
      expect(rendered.getByText(`data ${String(key)}`)).toBeInTheDocument()

      await act(() => vi.advanceTimersByTimeAsync(10_000))
      expect(handler).not.toHaveBeenCalled()
    })

    it('should only log the queries of useSuspenseQueries that were not prefetched', async () => {
      const key1 = queryKey()
      const key2 = queryKey()

      void queryClient
        .query({
          queryKey: key1,
          queryFn: () => sleep(10).then(() => 1),
        })
        .catch(noop)

      function Page() {
        const [result1, result2] = useSuspenseQueries({
          queries: [
            { queryKey: key1, queryFn: () => sleep(10).then(() => 1) },
            { queryKey: key2, queryFn: () => sleep(10).then(() => 2) },
          ],
        })
        return (
          <div>
            data: {result1.data},{result2.data}
          </div>
        )
      }

      const rendered = renderWithClient(
        queryClient,
        <QueryStrictMode handleMissingPrefetch={handler}>
          <React.Suspense fallback="loading">
            <Page />
          </React.Suspense>
        </QueryStrictMode>,
      )

      await act(() => vi.advanceTimersByTimeAsync(10))
      expect(rendered.getByText('data: 1,2')).toBeInTheDocument()

      await act(() => vi.advanceTimersByTimeAsync(10_000))
      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler.mock.calls[0]![0]).toMatchObject({
        type: 'missing-prefetch',
        suspense: true,
        query: getQuery(key2),
      })
    })

    it('should log once when useQuery starts a fetch after rendering', async () => {
      const key = queryKey()

      function Page() {
        const { data } = useQuery({
          queryKey: key,
          queryFn: () => sleep(10).then(() => 'data'),
        })
        return <div>{data ?? 'pending'}</div>
      }

      const rendered = renderWithClient(
        queryClient,
        <React.StrictMode>
          <QueryStrictMode handleMissingPrefetch={handler}>
            <Page />
          </QueryStrictMode>
        </React.StrictMode>,
      )

      expect(rendered.getByText('pending')).toBeInTheDocument()
      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler).toHaveBeenCalledWith({
        type: 'missing-prefetch',
        suspense: false,
        message: expect.stringContaining(getQuery(key)!.queryHash),
        query: getQuery(key),
      })

      await act(() => vi.advanceTimersByTimeAsync(11))
      expect(rendered.getByText('data')).toBeInTheDocument()

      await act(() => vi.advanceTimersByTimeAsync(10_000))
      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should not log when useQuery reads a prefetched query', async () => {
      const inFlight = queryKey()
      const cached = queryKey()
      const queryFn = () => sleep(10).then(() => 'data')

      queryClient.setQueryData(cached, 'data')
      void queryClient.query({ queryKey: inFlight, queryFn }).catch(noop)

      function Page() {
        const first = useQuery({ queryKey: inFlight, queryFn })
        const second = useQuery({ queryKey: cached, queryFn })
        return (
          <div>
            {first.data ?? 'pending'},{second.data}
          </div>
        )
      }

      const rendered = renderWithClient(
        queryClient,
        <QueryStrictMode handleMissingPrefetch={handler}>
          <Page />
        </QueryStrictMode>,
      )

      await act(() => vi.advanceTimersByTimeAsync(11))
      expect(rendered.getByText('data,data')).toBeInTheDocument()

      await act(() => vi.advanceTimersByTimeAsync(10_000))
      expect(handler).not.toHaveBeenCalled()
    })

    it('should not log for a disabled useQuery, but log once it is enabled', async () => {
      const key = queryKey()

      function Page({ enabled }: { enabled: boolean }) {
        const { data } = useQuery({
          queryKey: key,
          queryFn: () => sleep(10).then(() => 'data'),
          enabled,
        })
        return <div>{data ?? 'pending'}</div>
      }

      const rendered = renderWithClient(
        queryClient,
        <QueryStrictMode handleMissingPrefetch={handler}>
          <Page enabled={false} />
        </QueryStrictMode>,
      )

      await act(() => vi.advanceTimersByTimeAsync(11))
      expect(rendered.getByText('pending')).toBeInTheDocument()
      expect(handler).not.toHaveBeenCalled()

      rendered.rerender(
        <QueryStrictMode handleMissingPrefetch={handler}>
          <Page enabled />
        </QueryStrictMode>,
      )
      await act(() => vi.advanceTimersByTimeAsync(11))
      expect(rendered.getByText('data')).toBeInTheDocument()
      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler.mock.calls[0]![0]).toMatchObject({
        type: 'missing-prefetch',
        suspense: false,
        query: getQuery(key),
      })
    })

    it('should only log the queries of useQueries that were not prefetched', async () => {
      const key1 = queryKey()
      const key2 = queryKey()

      void queryClient
        .query({
          queryKey: key1,
          queryFn: () => sleep(10).then(() => 1),
        })
        .catch(noop)

      function Page() {
        const [result1, result2] = useQueries({
          queries: [
            { queryKey: key1, queryFn: () => sleep(10).then(() => 1) },
            { queryKey: key2, queryFn: () => sleep(10).then(() => 2) },
          ],
        })
        return (
          <div>
            data: {result1.data},{result2.data}
          </div>
        )
      }

      const rendered = renderWithClient(
        queryClient,
        <QueryStrictMode handleMissingPrefetch={handler}>
          <Page />
        </QueryStrictMode>,
      )

      await act(() => vi.advanceTimersByTimeAsync(11))
      expect(rendered.getByText('data: 1,2')).toBeInTheDocument()

      await act(() => vi.advanceTimersByTimeAsync(10_000))
      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler.mock.calls[0]![0]).toMatchObject({
        type: 'missing-prefetch',
        suspense: false,
        query: getQuery(key2),
      })
    })

    it('should use the handleMissingPrefetch of the parent when a nested QueryStrictMode has none', async () => {
      const key = queryKey()

      const rendered = renderWithClient(
        queryClient,
        <QueryStrictMode handleMissingPrefetch={handler}>
          <QueryStrictMode>
            <React.Suspense fallback="loading">
              <SuspenseQuery id={key} />
            </React.Suspense>
          </QueryStrictMode>
        </QueryStrictMode>,
      )

      await act(() => vi.advanceTimersByTimeAsync(10))
      expect(rendered.getByText(`data ${String(key)}`)).toBeInTheDocument()
      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler.mock.calls[0]![0]).toMatchObject({
        type: 'missing-prefetch',
        query: getQuery(key),
      })
    })

    it('should use its own handleMissingPrefetch when a nested QueryStrictMode has one', async () => {
      const key = queryKey()
      const innerHandler = vi.fn<Handler>()

      renderWithClient(
        queryClient,
        <QueryStrictMode handleMissingPrefetch={handler}>
          <QueryStrictMode handleMissingPrefetch={innerHandler}>
            <React.Suspense fallback="loading">
              <SuspenseQuery id={key} />
            </React.Suspense>
          </QueryStrictMode>
        </QueryStrictMode>,
      )

      await act(() => vi.advanceTimersByTimeAsync(10))
      expect(innerHandler).toHaveBeenCalledTimes(1)
      expect(handler).not.toHaveBeenCalled()
    })

    it('should not log for hooks outside of QueryStrictMode', async () => {
      const key = queryKey()

      const rendered = renderWithClient(
        queryClient,
        <>
          <QueryStrictMode handleMissingPrefetch={handler}>
            {null}
          </QueryStrictMode>
          <React.Suspense fallback="loading">
            <SuspenseQuery id={key} />
          </React.Suspense>
        </>,
      )

      await act(() => vi.advanceTimersByTimeAsync(10))
      expect(rendered.getByText(`data ${String(key)}`)).toBeInTheDocument()

      await act(() => vi.advanceTimersByTimeAsync(10_000))
      expect(handler).not.toHaveBeenCalled()
    })

    it('should not log again when an error boundary is reset', async () => {
      vi.spyOn(console, 'error').mockReturnValue(undefined)
      const key = queryKey()
      let succeed = false

      function Page() {
        const { data } = useSuspenseQuery({
          queryKey: key,
          queryFn: () =>
            sleep(10).then(() => {
              if (!succeed) throw new Error('Suspense Error')
              return 'data'
            }),
          retry: false,
        })
        return <div>{data}</div>
      }

      const rendered = renderWithClient(
        queryClient,
        <QueryStrictMode handleMissingPrefetch={handler}>
          <QueryErrorResetBoundary>
            {({ reset }) => (
              <ErrorBoundary
                onReset={reset}
                fallbackRender={({ resetErrorBoundary }) => (
                  <button onClick={() => resetErrorBoundary()}>retry</button>
                )}
              >
                <React.Suspense fallback="loading">
                  <Page />
                </React.Suspense>
              </ErrorBoundary>
            )}
          </QueryErrorResetBoundary>
        </QueryStrictMode>,
      )

      await act(() => vi.advanceTimersByTimeAsync(10))
      expect(rendered.getByText('retry')).toBeInTheDocument()

      succeed = true
      fireEvent.click(rendered.getByText('retry'))
      await act(() => vi.advanceTimersByTimeAsync(10))
      expect(rendered.getByText('data')).toBeInTheDocument()

      expect(handledTypes()).toStrictEqual(['missing-prefetch'])
    })

    it('should throw a QueryStrictModeMissingPrefetchError by default', async () => {
      vi.spyOn(console, 'error').mockReturnValue(undefined)
      const key = queryKey()
      const errors: Array<unknown> = []

      const rendered = renderWithClient(
        queryClient,
        <QueryStrictMode>
          <ErrorBoundary
            onError={(error) => errors.push(error)}
            fallbackRender={() => <div>error</div>}
          >
            <React.Suspense fallback="loading">
              <SuspenseQuery id={key} />
            </React.Suspense>
          </ErrorBoundary>
        </QueryStrictMode>,
      )

      expect(rendered.getByText('error')).toBeInTheDocument()
      expect(errors[0]).toBeInstanceOf(QueryStrictModeMissingPrefetchError)
      expect(errors[0]).toMatchObject({
        message: expect.stringContaining(getQuery(key)!.queryHash),
        event: { type: 'missing-prefetch', query: getQuery(key) },
      })

      await act(() => vi.advanceTimersByTimeAsync(10))
    })

    describe('with a handler that throws', () => {
      const throwStrictModeError = (event: QueryStrictModeEvent) => {
        throw toStrictModeError(event)
      }

      function renderThrowing(
        id: QueryKey,
        queryFn = vi.fn<() => Promise<string>>(() =>
          sleep(10).then(() => `data ${String(id)}`),
        ),
      ) {
        const errors: Array<unknown> = []

        function Page() {
          const { data } = useSuspenseQuery({ queryKey: id, queryFn })
          return <div>{data}</div>
        }

        const rendered = renderWithClient(
          queryClient,
          <QueryStrictMode handleMissingPrefetch={handler}>
            <ErrorBoundary
              onError={(error) => errors.push(error)}
              fallbackRender={({ error, resetErrorBoundary }) => (
                <div>
                  <div>error: {(error as Error).message}</div>
                  <button onClick={() => resetErrorBoundary()}>retry</button>
                </div>
              )}
            >
              <React.Suspense fallback="loading">
                <Page />
              </React.Suspense>
            </ErrorBoundary>
          </QueryStrictMode>,
        )
        return { rendered, queryFn, errors }
      }

      it('should throw to the nearest error boundary instead of fetching', async () => {
        vi.spyOn(console, 'error').mockReturnValue(undefined)
        const key = queryKey()
        handler.mockImplementation(throwStrictModeError)

        const { rendered, queryFn, errors } = renderThrowing(key)

        expect(
          rendered.getByText(
            new RegExp(`error: .*${getQuery(key)!.queryHash}`),
          ),
        ).toBeInTheDocument()
        expect(handler).toHaveBeenCalledWith({
          type: 'missing-prefetch',
          suspense: true,
          message: expect.stringContaining(getQuery(key)!.queryHash),
          query: getQuery(key),
        })

        const error = errors[0]
        expect(error).toBeInstanceOf(QueryStrictModeMissingPrefetchError)
        expect(error).toBeInstanceOf(QueryStrictModeError)
        expect(error).toBeInstanceOf(Error)
        expect(error).toMatchObject({
          name: 'QueryStrictModeMissingPrefetchError',
          message: expect.stringContaining(getQuery(key)!.queryHash),
          event: {
            type: 'missing-prefetch',
            suspense: true,
            query: getQuery(key),
          },
        })

        await act(() => vi.advanceTimersByTimeAsync(10))
        expect(queryFn).not.toHaveBeenCalled()
        expect(
          rendered.queryByText(`data ${String(key)}`),
        ).not.toBeInTheDocument()
      })

      it('should throw a custom error to the error boundary unchanged', async () => {
        vi.spyOn(console, 'error').mockReturnValue(undefined)
        const key = queryKey()
        const customError = new Error('custom missing-prefetch')
        handler.mockImplementation(() => {
          throw customError
        })

        const { rendered, queryFn, errors } = renderThrowing(key)

        expect(
          rendered.getByText('error: custom missing-prefetch'),
        ).toBeInTheDocument()
        expect(errors[0]).toBe(customError)

        await act(() => vi.advanceTimersByTimeAsync(10))
        expect(queryFn).not.toHaveBeenCalled()
      })

      it('should throw again after the error boundary is reset', async () => {
        vi.spyOn(console, 'error').mockReturnValue(undefined)
        const key = queryKey()
        handler.mockImplementation(throwStrictModeError)

        const { rendered, queryFn, errors } = renderThrowing(key)
        expect(rendered.getByText(/error:/)).toBeInTheDocument()
        const callsBeforeReset = handler.mock.calls.length
        const errorsBeforeReset = errors.length

        fireEvent.click(rendered.getByText('retry'))
        await act(() => vi.advanceTimersByTimeAsync(10))
        expect(rendered.getByText(/error:/)).toBeInTheDocument()
        expect(handler.mock.calls.length).toBeGreaterThan(callsBeforeReset)
        expect(errors.length).toBeGreaterThan(errorsBeforeReset)
        expect(queryFn).not.toHaveBeenCalled()
      })

      it('should only be called once more for the query state when it returns after an error boundary reset', async () => {
        vi.spyOn(console, 'error').mockReturnValue(undefined)
        const key = queryKey()
        const queryFn = vi.fn<() => Promise<string>>(() =>
          sleep(10).then(() => 'data'),
        )
        let shouldThrow = true
        handler.mockImplementation((event) => {
          if (shouldThrow) throw toStrictModeError(event)
        })

        function Page() {
          const { data } = useSuspenseQuery({ queryKey: key, queryFn })
          return <div>{data}</div>
        }

        // React.StrictMode renders `Page` twice, but the handler is only called for the first render
        const rendered = renderWithClient(
          queryClient,
          <React.StrictMode>
            <QueryStrictMode handleMissingPrefetch={handler}>
              <ErrorBoundary
                fallbackRender={({ resetErrorBoundary }) => (
                  <button onClick={() => resetErrorBoundary()}>retry</button>
                )}
              >
                <React.Suspense fallback="loading">
                  <Page />
                </React.Suspense>
              </ErrorBoundary>
            </QueryStrictMode>
          </React.StrictMode>,
        )

        expect(rendered.getByText('retry')).toBeInTheDocument()
        const callsBeforeReset = handler.mock.calls.length

        shouldThrow = false
        fireEvent.click(rendered.getByText('retry'))
        expect(rendered.getByText('loading')).toBeInTheDocument()
        await act(() => vi.advanceTimersByTimeAsync(10))
        expect(rendered.getByText('data')).toBeInTheDocument()

        await act(() => vi.advanceTimersByTimeAsync(10_000))
        expect(handler).toHaveBeenCalledTimes(callsBeforeReset + 1)
        expect(handler.mock.lastCall![0]).toMatchObject({
          type: 'missing-prefetch',
          query: getQuery(key),
        })
        expect(queryFn).toHaveBeenCalledTimes(1)
      })

      it('should throw for some queries and report the others', async () => {
        vi.spyOn(console, 'error').mockReturnValue(undefined)
        const thrown = queryKey()
        const reported = queryKey()
        handler.mockImplementation((event) => {
          if (event.query.queryHash === getQuery(thrown)?.queryHash) {
            throw toStrictModeError(event)
          }
        })

        const first = renderThrowing(thrown)
        expect(first.rendered.getByText(/error:/)).toBeInTheDocument()
        first.rendered.unmount()
        handler.mockClear()

        const second = renderThrowing(reported)
        await act(() => vi.advanceTimersByTimeAsync(10))
        expect(
          second.rendered.getByText(`data ${String(reported)}`),
        ).toBeInTheDocument()
        expect(second.errors).toStrictEqual([])
        expect(handler).toHaveBeenCalledTimes(1)
        expect(handler.mock.calls[0]![0]).toMatchObject({
          type: 'missing-prefetch',
          query: getQuery(reported),
        })
      })

      it('should throw from useQuery instead of fetching', async () => {
        vi.spyOn(console, 'error').mockReturnValue(undefined)
        const key = queryKey()
        const queryFn = vi.fn<() => Promise<string>>(() =>
          sleep(10).then(() => 'data'),
        )
        handler.mockImplementation(throwStrictModeError)

        function Page() {
          const { data } = useQuery({ queryKey: key, queryFn })
          return <div>{data ?? 'pending'}</div>
        }

        const rendered = renderWithClient(
          queryClient,
          <QueryStrictMode handleMissingPrefetch={handler}>
            <ErrorBoundary
              fallbackRender={({ error }) => (
                <div>
                  {error instanceof QueryStrictModeError
                    ? `strict: ${error.event.type}`
                    : 'other'}
                </div>
              )}
            >
              <Page />
            </ErrorBoundary>
          </QueryStrictMode>,
        )

        expect(
          rendered.getByText('strict: missing-prefetch'),
        ).toBeInTheDocument()
        expect(handler).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'missing-prefetch',
            suspense: false,
            query: getQuery(key),
          }),
        )
        await act(() => vi.advanceTimersByTimeAsync(10))
        expect(queryFn).not.toHaveBeenCalled()
      })
    })
  })

  describe('unused-prefetch', () => {
    it('should log when a prefetched query is not used within 5000ms of its data arriving', async () => {
      const key = queryKey()

      renderWithClient(
        queryClient,
        <QueryStrictMode handleUnusedPrefetch={handler}>
          {null}
        </QueryStrictMode>,
      )

      void queryClient
        .query({
          queryKey: key,
          queryFn: () => sleep(10).then(() => 'data'),
        })
        .catch(noop)

      // The timer starts when the data arrives, not when the fetch starts
      await act(() => vi.advanceTimersByTimeAsync(10 + 4999))
      expect(handler).not.toHaveBeenCalled()

      await act(() => vi.advanceTimersByTimeAsync(1))
      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler).toHaveBeenCalledWith({
        type: 'unused-prefetch',
        message: expect.stringContaining(getQuery(key)!.queryHash),
        query: getQuery(key),
      })
    })

    it('should warn instead of throwing by default', async () => {
      const consoleMock = vi.spyOn(console, 'warn').mockReturnValue(undefined)
      const key = queryKey()

      const rendered = renderWithClient(
        queryClient,
        <ErrorBoundary fallback={<div>error</div>}>
          <QueryStrictMode>
            <div>content</div>
          </QueryStrictMode>
        </ErrorBoundary>,
      )

      void queryClient
        .query({
          queryKey: key,
          queryFn: () => sleep(10).then(() => 'data'),
        })
        .catch(noop)

      await act(() => vi.advanceTimersByTimeAsync(10 + 5000))
      expect(rendered.getByText('content')).toBeInTheDocument()
      expect(consoleMock).toHaveBeenCalledTimes(1)
      expect(consoleMock).toHaveBeenCalledWith(
        expect.stringContaining(getQuery(key)!.queryHash),
      )
    })

    it('should log when the prefetched query is only read outside of QueryStrictMode, by a component that unmounted', async () => {
      const key = queryKey()

      function Reader() {
        const { data } = useQuery({
          queryKey: key,
          queryFn: () => sleep(10).then(() => 'data'),
        })
        return <div>{data}</div>
      }

      function App({ showReader }: { showReader: boolean }) {
        return (
          <>
            <QueryStrictMode handleUnusedPrefetch={handler}>
              {null}
            </QueryStrictMode>
            {showReader && <Reader />}
          </>
        )
      }

      const rendered = renderWithClient(queryClient, <App showReader={false} />)

      void queryClient
        .query({
          queryKey: key,
          queryFn: () => sleep(10).then(() => 'data'),
        })
        .catch(noop)

      // The data arrives with no observers, which starts the timer
      await act(() => vi.advanceTimersByTimeAsync(10))

      rendered.rerender(<App showReader />)
      expect(rendered.getByText('data')).toBeInTheDocument()
      await act(() => vi.advanceTimersByTimeAsync(10))

      rendered.rerender(<App showReader={false} />)
      expect(rendered.queryByText('data')).not.toBeInTheDocument()

      await act(() => vi.advanceTimersByTimeAsync(5000))
      expect(handledTypes()).toStrictEqual(['unused-prefetch'])
      expect(handler.mock.calls[0]![0].query).toBe(getQuery(key))
    })

    it('should respect a custom unusedPrefetchTimeout', async () => {
      const key = queryKey()

      renderWithClient(
        queryClient,
        <QueryStrictMode
          handleUnusedPrefetch={handler}
          unusedPrefetchTimeout={1000}
        >
          {null}
        </QueryStrictMode>,
      )

      void queryClient
        .query({
          queryKey: key,
          queryFn: () => sleep(10).then(() => 'data'),
        })
        .catch(noop)

      await act(() => vi.advanceTimersByTimeAsync(10 + 999))
      expect(handler).not.toHaveBeenCalled()

      await act(() => vi.advanceTimersByTimeAsync(1))
      expect(handledTypes()).toStrictEqual(['unused-prefetch'])
    })

    it('should not log when the prefetched query is used before the timeout', async () => {
      const key = queryKey()
      const queryFn = () => sleep(10).then(() => 'data')

      function Page() {
        const { data } = useQuery({ queryKey: key, queryFn })
        return <div>{data ?? 'pending'}</div>
      }

      const rendered = renderWithClient(
        queryClient,
        <QueryStrictMode handleUnusedPrefetch={handler}>
          {null}
        </QueryStrictMode>,
      )

      void queryClient.query({ queryKey: key, queryFn }).catch(noop)
      await act(() => vi.advanceTimersByTimeAsync(10 + 1000))

      rendered.rerender(
        <QueryStrictMode handleUnusedPrefetch={handler}>
          <Page />
        </QueryStrictMode>,
      )
      expect(rendered.getByText('data')).toBeInTheDocument()

      await act(() => vi.advanceTimersByTimeAsync(10_000))
      expect(handler).not.toHaveBeenCalled()
    })

    it('should not log for a prefetched query whose reader is waiting on a slow sibling', async () => {
      const fast = queryKey()
      const slow = queryKey()

      void queryClient
        .query({
          queryKey: fast,
          queryFn: () => sleep(10).then(() => `data ${String(fast)}`),
        })
        .catch(noop)
      void queryClient
        .query({
          queryKey: slow,
          queryFn: () => sleep(10_000).then(() => `data ${String(slow)}`),
        })
        .catch(noop)

      const rendered = renderWithClient(
        queryClient,
        <QueryStrictMode handleUnusedPrefetch={handler}>
          <React.Suspense fallback="loading">
            <SuspenseQuery id={fast} />
            <SuspenseQuery id={slow} ms={10_000} />
          </React.Suspense>
        </QueryStrictMode>,
      )

      // The fast query has data, but nothing commits (and subscribes to it) until the slow one has
      await act(() => vi.advanceTimersByTimeAsync(10_000))
      expect(rendered.getByText(`data ${String(fast)}`)).toBeInTheDocument()
      expect(rendered.getByText(`data ${String(slow)}`)).toBeInTheDocument()

      await act(() => vi.advanceTimersByTimeAsync(10_000))
      expect(handler).not.toHaveBeenCalled()
    })

    it('should only log once per query', async () => {
      const key = queryKey()

      renderWithClient(
        queryClient,
        <QueryStrictMode handleUnusedPrefetch={handler}>
          {null}
        </QueryStrictMode>,
      )

      void queryClient
        .query({
          queryKey: key,
          queryFn: () => sleep(10).then(() => 'data'),
        })
        .catch(noop)

      await act(() => vi.advanceTimersByTimeAsync(10 + 5000))
      expect(handledTypes()).toStrictEqual(['unused-prefetch'])

      void queryClient.invalidateQueries({ queryKey: key, refetchType: 'all' })

      await act(() => vi.advanceTimersByTimeAsync(10 + 10_000))
      expect(handledTypes()).toStrictEqual(['unused-prefetch'])
    })

    it('should not log for queries prefetched before QueryStrictMode mounted', async () => {
      const key = queryKey()

      void queryClient
        .query({
          queryKey: key,
          queryFn: () => sleep(10).then(() => 'data'),
        })
        .catch(noop)
      await vi.advanceTimersByTimeAsync(10)
      expect(queryClient.getQueryData(key)).toBe('data')

      renderWithClient(
        queryClient,
        <QueryStrictMode handleUnusedPrefetch={handler}>
          {null}
        </QueryStrictMode>,
      )

      await act(() => vi.advanceTimersByTimeAsync(10_000))
      expect(handler).not.toHaveBeenCalled()
    })

    it('should log for a render-time prefetch whose data arrives before QueryStrictMode subscribes', async () => {
      const key = queryKey()

      renderOutsideAct(
        <QueryStrictMode
          handleUnusedPrefetch={handler}
          unusedPrefetchTimeout={10}
        >
          <ResolvedPrefetch id={key} />
        </QueryStrictMode>,
      )

      await vi.waitFor(() => expect(getQuery(key)?.state.data).toBe('data'))
      await sleep(50)
      expect(handledTypes()).toStrictEqual(['unused-prefetch'])
    })

    it('should log for a render-time prefetch whose data arrives while a sibling suspends the first mount of QueryStrictMode', async () => {
      const key = queryKey()
      const otherKey = queryKey()

      // The sibling is outside of QueryStrictMode, so it doesn't report a missing prefetch, but it
      // keeps QueryStrictMode from committing until its data arrives
      const container = renderOutsideAct(
        <React.Suspense fallback="loading">
          <QueryStrictMode
            handleUnusedPrefetch={handler}
            unusedPrefetchTimeout={10}
          >
            <ResolvedPrefetch id={key} />
          </QueryStrictMode>
          <SuspenseQuery id={otherKey} ms={50} />
        </React.Suspense>,
      )

      await vi.waitFor(() => expect(getQuery(key)?.state.data).toBe('data'))
      // React can wait a little after the data of the sibling arrives before it reveals the content
      await vi.waitFor(() =>
        expect(container.textContent).toBe(`data ${String(otherKey)}`),
      )
      await sleep(50)
      expect(handledTypes()).toStrictEqual(['unused-prefetch'])
    })

    it('should not log for a prefetch whose data arrives before QueryStrictMode commits, if a component reads it once it commits', async () => {
      const key = queryKey()
      const otherKey = queryKey()

      // The reader only subscribes to the query when QueryStrictMode commits, after its data arrived
      const container = renderOutsideAct(
        <React.Suspense fallback="loading">
          <QueryStrictMode
            handleUnusedPrefetch={handler}
            unusedPrefetchTimeout={10}
          >
            <ResolvedPrefetch id={key} />
            <ResolvedQuery id={key} />
          </QueryStrictMode>
          <SuspenseQuery id={otherKey} ms={50} />
        </React.Suspense>,
      )

      await vi.waitFor(() =>
        expect(container.textContent).toBe(`datadata ${String(otherKey)}`),
      )
      await sleep(50)
      expect(handler).not.toHaveBeenCalled()
    })

    it('should only log once in React.StrictMode', async () => {
      const key = queryKey()

      // React.StrictMode renders QueryStrictMode twice, and mounts it, unmounts it and mounts it again
      renderOutsideAct(
        <QueryStrictMode
          handleUnusedPrefetch={handler}
          unusedPrefetchTimeout={10}
        >
          <ResolvedPrefetch id={key} />
        </QueryStrictMode>,
        { strictMode: true },
      )

      await vi.waitFor(() => expect(getQuery(key)?.state.data).toBe('data'))
      await sleep(50)
      expect(handledTypes()).toStrictEqual(['unused-prefetch'])
    })

    it('should still log a prefetch whose timer started before unusedPrefetchTimeout changed', async () => {
      const key = queryKey()

      const rendered = renderWithClient(
        queryClient,
        <QueryStrictMode handleUnusedPrefetch={handler}>
          {null}
        </QueryStrictMode>,
      )

      void queryClient
        .query({
          queryKey: key,
          queryFn: () => sleep(10).then(() => 'data'),
        })
        .catch(noop)
      await act(() => vi.advanceTimersByTimeAsync(10))

      await act(() => vi.advanceTimersByTimeAsync(10))
      rendered.rerender(
        <QueryStrictMode
          handleUnusedPrefetch={handler}
          unusedPrefetchTimeout={6000}
        >
          {null}
        </QueryStrictMode>,
      )

      // The data arrived at 10ms, so the new timeout ends at 6010ms, not 6000ms after the rerender
      await act(() => vi.advanceTimersByTimeAsync(6010 - 20 - 1))
      expect(handler).not.toHaveBeenCalled()
      await act(() => vi.advanceTimersByTimeAsync(1))
      expect(handledTypes()).toStrictEqual(['unused-prefetch'])
    })

    it('should not check a prefetch again when it runs its effect again', async () => {
      const key = queryKey()

      const rendered = renderWithClient(
        queryClient,
        <QueryStrictMode
          handleUnusedPrefetch={handler}
          unusedPrefetchTimeout={20}
        >
          {null}
        </QueryStrictMode>,
      )

      void queryClient
        .query({
          queryKey: key,
          queryFn: () => sleep(10).then(() => 'data'),
        })
        .catch(noop)
      await act(() => vi.advanceTimersByTimeAsync(10))

      // Observed when its timer ends, so it counts as used
      const observer = new QueryObserver(queryClient, {
        queryKey: key,
        staleTime: Infinity,
      })
      const unsubscribe = observer.subscribe(noop)
      await act(() => vi.advanceTimersByTimeAsync(20))
      unsubscribe()

      rendered.rerender(
        <QueryStrictMode
          handleUnusedPrefetch={handler}
          unusedPrefetchTimeout={30}
        >
          {null}
        </QueryStrictMode>,
      )
      await act(() => vi.advanceTimersByTimeAsync(10_000))
      expect(handler).not.toHaveBeenCalled()

      // A new prefetch of the same query is checked again
      void queryClient
        .query({
          queryKey: key,
          queryFn: () => sleep(10).then(() => 'new data'),
          staleTime: 0,
        })
        .catch(noop)
      await act(() => vi.advanceTimersByTimeAsync(10 + 30))
      expect(handledTypes()).toStrictEqual(['unused-prefetch'])
    })

    it('should not start a timer for setQueryData', async () => {
      const key = queryKey()

      renderWithClient(
        queryClient,
        <QueryStrictMode handleUnusedPrefetch={handler}>
          {null}
        </QueryStrictMode>,
      )

      act(() => {
        queryClient.setQueryData(key, 'data')
      })

      await act(() => vi.advanceTimersByTimeAsync(10_000))
      expect(handler).not.toHaveBeenCalled()
    })

    it('should not log for hydrated queries', async () => {
      const key = queryKey()
      const serverClient = new QueryClient()
      await serverClient.query({
        queryKey: key,
        queryFn: () => 'data',
      })
      const dehydrated = dehydrate(serverClient)

      renderWithClient(
        queryClient,
        <QueryStrictMode handleUnusedPrefetch={handler}>
          {null}
        </QueryStrictMode>,
      )

      act(() => {
        hydrate(queryClient, dehydrated)
      })

      await act(() => vi.advanceTimersByTimeAsync(10_000))
      expect(handler).not.toHaveBeenCalled()
      serverClient.clear()
    })

    it('should not log for a background refetch of a query that was used before', async () => {
      const key = queryKey()
      const queryFn = () => sleep(10).then(() => 'data')

      function Page() {
        const { data } = useQuery({ queryKey: key, queryFn })
        return <div>{data ?? 'pending'}</div>
      }

      const rendered = renderWithClient(
        queryClient,
        <QueryStrictMode
          handleMissingPrefetch={handler}
          handleUnusedPrefetch={handler}
        >
          <Page />
        </QueryStrictMode>,
      )

      await act(() => vi.advanceTimersByTimeAsync(11))
      expect(rendered.getByText('data')).toBeInTheDocument()

      rendered.rerender(
        <QueryStrictMode
          handleMissingPrefetch={handler}
          handleUnusedPrefetch={handler}
        >
          {null}
        </QueryStrictMode>,
      )
      void queryClient.invalidateQueries({ queryKey: key, refetchType: 'all' })

      await act(() => vi.advanceTimersByTimeAsync(10 + 10_000))
      // Only the initial fetch of `Page` is reported
      expect(handledTypes()).toStrictEqual(['missing-prefetch'])
    })

    it('should clear its timers on unmount', async () => {
      const key = queryKey()

      const rendered = renderWithClient(
        queryClient,
        <QueryStrictMode handleUnusedPrefetch={handler}>
          {null}
        </QueryStrictMode>,
      )

      void queryClient
        .query({
          queryKey: key,
          queryFn: () => sleep(10).then(() => 'data'),
        })
        .catch(noop)
      await act(() => vi.advanceTimersByTimeAsync(10))

      rendered.unmount()

      await act(() => vi.advanceTimersByTimeAsync(10_000))
      expect(handler).not.toHaveBeenCalled()
    })

    it('should stop listening to the cache on unmount', async () => {
      const rendered = render(
        <QueryClientProvider client={queryClient}>
          <QueryStrictMode handleUnusedPrefetch={handler}>
            {null}
          </QueryStrictMode>
        </QueryClientProvider>,
        { reactStrictMode: true },
      )
      expect(queryClient.getQueryCache().hasListeners()).toBe(true)

      rendered.unmount()
      await act(() => vi.advanceTimersByTimeAsync(0))

      expect(queryClient.getQueryCache().hasListeners()).toBe(false)
    })

    it('should only log once when QueryStrictMode is nested', async () => {
      const key = queryKey()
      const innerHandler = vi.fn<Handler>()

      renderWithClient(
        queryClient,
        <QueryStrictMode handleUnusedPrefetch={handler}>
          <QueryStrictMode handleUnusedPrefetch={innerHandler}>
            {null}
          </QueryStrictMode>
        </QueryStrictMode>,
      )

      void queryClient
        .query({
          queryKey: key,
          queryFn: () => sleep(10).then(() => 'data'),
        })
        .catch(noop)

      await act(() => vi.advanceTimersByTimeAsync(10 + 5000))
      expect(handledTypes()).toStrictEqual(['unused-prefetch'])
      expect(innerHandler).not.toHaveBeenCalled()
    })

    it('should not log for a prefetched query that was read inside a nested QueryStrictMode', async () => {
      const key = queryKey()

      function Page({ read }: { read: boolean }) {
        usePrefetchQuery({
          queryKey: key,
          queryFn: () => sleep(10).then(() => `data ${String(key)}`),
        })
        return (
          <QueryStrictMode handleUnusedPrefetch={handler}>
            {read && <SuspenseQuery id={key} />}
          </QueryStrictMode>
        )
      }

      const rendered = renderWithClient(
        queryClient,
        <QueryStrictMode
          handleUnusedPrefetch={handler}
          unusedPrefetchTimeout={100}
        >
          <React.Suspense fallback="loading">
            <Page read />
          </React.Suspense>
        </QueryStrictMode>,
      )
      await act(() => vi.advanceTimersByTimeAsync(10))
      expect(rendered.getByText(`data ${String(key)}`)).toBeInTheDocument()

      // Nothing observes it after its reader unmounts, but it was read
      rendered.rerender(
        <QueryStrictMode
          handleUnusedPrefetch={handler}
          unusedPrefetchTimeout={100}
        >
          <React.Suspense fallback="loading">
            <Page read={false} />
          </React.Suspense>
        </QueryStrictMode>,
      )
      await act(() => vi.advanceTimersByTimeAsync(10_000))
      expect(handler).not.toHaveBeenCalled()
    })

    describe('with sibling QueryStrictModes', () => {
      const prefetch = (key: QueryKey) =>
        void queryClient
          .query({
            queryKey: key,
            queryFn: () => sleep(10).then(() => `data ${String(key)}`),
          })
          .catch(noop)

      it('should not log for a prefetched query that was read inside the other one', async () => {
        const key = queryKey()
        const otherHandler = vi.fn<Handler>()

        function Page({ read }: { read: boolean }) {
          return (
            <>
              <QueryStrictMode
                handleUnusedPrefetch={handler}
                unusedPrefetchTimeout={100}
              >
                <React.Suspense fallback="loading">
                  {read && <SuspenseQuery id={key} />}
                </React.Suspense>
              </QueryStrictMode>
              <QueryStrictMode
                handleUnusedPrefetch={otherHandler}
                unusedPrefetchTimeout={100}
              >
                {null}
              </QueryStrictMode>
            </>
          )
        }

        const rendered = renderWithClient(queryClient, <Page read={false} />)
        prefetch(key)
        rendered.rerender(<Page read />)
        await act(() => vi.advanceTimersByTimeAsync(10))
        expect(rendered.getByText(`data ${String(key)}`)).toBeInTheDocument()

        // Nothing observes it after its reader unmounts, but it was read
        rendered.rerender(<Page read={false} />)
        await act(() => vi.advanceTimersByTimeAsync(10_000))
        expect(handler).not.toHaveBeenCalled()
        expect(otherHandler).not.toHaveBeenCalled()
      })

      it('should only log an unused prefetch once', async () => {
        const key = queryKey()
        const otherHandler = vi.fn<Handler>()

        renderWithClient(
          queryClient,
          <>
            <QueryStrictMode handleUnusedPrefetch={handler}>
              {null}
            </QueryStrictMode>
            <QueryStrictMode handleUnusedPrefetch={otherHandler}>
              {null}
            </QueryStrictMode>
          </>,
        )
        prefetch(key)

        await act(() => vi.advanceTimersByTimeAsync(10 + 5000))
        expect(handler.mock.calls.length + otherHandler.mock.calls.length).toBe(
          1,
        )
      })

      it('should only throw an unused prefetch to one error boundary', async () => {
        const key = queryKey()
        const throwingHandler = (event: QueryStrictModeUnusedPrefetchEvent) => {
          throw new QueryStrictModeUnusedPrefetchError(event)
        }

        const rendered = renderWithClient(
          queryClient,
          <>
            {['first', 'second'].map((name) => (
              <ErrorBoundary key={name} fallback={<div>error</div>}>
                <QueryStrictMode handleUnusedPrefetch={throwingHandler}>
                  <div>{name}</div>
                </QueryStrictMode>
              </ErrorBoundary>
            ))}
          </>,
        )
        prefetch(key)

        await act(() => vi.advanceTimersByTimeAsync(10 + 5000))
        expect(rendered.getAllByText('error')).toHaveLength(1)
      })

      it('should not log for the one that unmounted', async () => {
        const key = queryKey()
        const otherHandler = vi.fn<Handler>()

        function Page({ both }: { both: boolean }) {
          return (
            <>
              {both && (
                <QueryStrictMode handleUnusedPrefetch={otherHandler}>
                  {null}
                </QueryStrictMode>
              )}
              <QueryStrictMode handleUnusedPrefetch={handler}>
                {null}
              </QueryStrictMode>
            </>
          )
        }

        const rendered = renderWithClient(queryClient, <Page both />)
        rendered.rerender(<Page both={false} />)
        prefetch(key)

        await act(() => vi.advanceTimersByTimeAsync(10 + 5000))
        expect(otherHandler).not.toHaveBeenCalled()
        expect(handledTypes()).toStrictEqual(['unused-prefetch'])
      })
    })

    describe('with a handler that throws', () => {
      const prefetch = (key: QueryKey, ms = 10) =>
        void queryClient
          .query({ queryKey: key, queryFn: () => sleep(ms).then(() => 'data') })
          .catch(noop)

      const throwUnusedPrefetch = (event: QueryStrictModeEvent) => {
        throw toStrictModeError(event)
      }

      function renderThrowing(
        strictMode: (children: React.ReactNode) => React.ReactNode,
      ) {
        const errors: Array<unknown> = []
        const rendered = renderWithClient(
          queryClient,
          <ErrorBoundary
            onError={(error) => errors.push(error)}
            fallbackRender={({ error }) => (
              <div>error: {(error as Error).message}</div>
            )}
          >
            {strictMode(<div>content</div>)}
          </ErrorBoundary>,
        )
        return { rendered, errors }
      }

      it('should throw from QueryStrictMode to the error boundary above it', async () => {
        vi.spyOn(console, 'error').mockReturnValue(undefined)
        const key = queryKey()
        handler.mockImplementation(throwUnusedPrefetch)

        const { rendered, errors } = renderThrowing((children) => (
          <QueryStrictMode handleUnusedPrefetch={handler}>
            {children}
          </QueryStrictMode>
        ))

        prefetch(key)

        await act(() => vi.advanceTimersByTimeAsync(10 + 4999))
        expect(rendered.getByText('content')).toBeInTheDocument()
        expect(handler).not.toHaveBeenCalled()

        await act(() => vi.advanceTimersByTimeAsync(1))
        expect(rendered.queryByText('content')).not.toBeInTheDocument()
        expect(
          rendered.getByText(
            new RegExp(`error: .*${getQuery(key)!.queryHash}`),
          ),
        ).toBeInTheDocument()
        expect(handler).toHaveBeenCalledTimes(1)
        expect(handler).toHaveBeenCalledWith({
          type: 'unused-prefetch',
          message: expect.stringContaining(getQuery(key)!.queryHash),
          query: getQuery(key),
        })

        const error = errors[0]
        expect(error).toBeInstanceOf(QueryStrictModeUnusedPrefetchError)
        expect(error).toBeInstanceOf(QueryStrictModeError)
        expect(error).toMatchObject({
          name: 'QueryStrictModeUnusedPrefetchError',
          message: expect.stringContaining(getQuery(key)!.queryHash),
          event: { type: 'unused-prefetch', query: getQuery(key) },
        })
      })

      it('should throw a custom error to the error boundary unchanged', async () => {
        vi.spyOn(console, 'error').mockReturnValue(undefined)
        const key = queryKey()
        const customError = new Error('custom unused-prefetch')
        handler.mockImplementation(() => {
          throw customError
        })

        const { rendered, errors } = renderThrowing((children) => (
          <QueryStrictMode handleUnusedPrefetch={handler}>
            {children}
          </QueryStrictMode>
        ))

        prefetch(key)

        await act(() => vi.advanceTimersByTimeAsync(10 + 5000))
        expect(rendered.queryByText('content')).not.toBeInTheDocument()
        expect(
          rendered.getByText('error: custom unused-prefetch'),
        ).toBeInTheDocument()
        expect(errors[0]).toBe(customError)
      })

      it('should throw for some queries and report the others', async () => {
        vi.spyOn(console, 'error').mockReturnValue(undefined)
        const reported = queryKey()
        const thrown = queryKey()
        handler.mockImplementation((event) => {
          if (event.query.queryHash === getQuery(thrown)?.queryHash) {
            throw toStrictModeError(event)
          }
        })

        const { rendered, errors } = renderThrowing((children) => (
          <QueryStrictMode handleUnusedPrefetch={handler}>
            {children}
          </QueryStrictMode>
        ))

        prefetch(reported, 10)
        prefetch(thrown, 20)

        await act(() => vi.advanceTimersByTimeAsync(10 + 5000))
        expect(rendered.getByText('content')).toBeInTheDocument()
        expect(handler).toHaveBeenCalledTimes(1)
        expect(handler.mock.calls[0]![0]).toMatchObject({
          type: 'unused-prefetch',
          query: getQuery(reported),
        })

        await act(() => vi.advanceTimersByTimeAsync(10))
        expect(rendered.queryByText('content')).not.toBeInTheDocument()
        expect(errors[0]).toMatchObject({ event: { query: getQuery(thrown) } })
        expect(handler).toHaveBeenCalledTimes(2)
      })
    })
  })

  it('should not log anything when QueryStrictMode is not used', async () => {
    const consoleErrorMock = vi.spyOn(console, 'error')
    const consoleWarnMock = vi.spyOn(console, 'warn')
    const suspended = queryKey()
    const prefetched = queryKey()

    const rendered = renderWithClient(
      queryClient,
      <React.Suspense fallback="loading">
        <SuspenseQuery id={suspended} />
      </React.Suspense>,
    )

    void queryClient
      .query({
        queryKey: prefetched,
        queryFn: () => sleep(10).then(() => 'data'),
      })
      .catch(noop)

    await act(() => vi.advanceTimersByTimeAsync(10 + 10_000))
    expect(rendered.getByText(`data ${String(suspended)}`)).toBeInTheDocument()
    expect(consoleErrorMock).not.toHaveBeenCalled()
    expect(consoleWarnMock).not.toHaveBeenCalled()
  })

  it('should not log anything while restoring', async () => {
    const prefetched = queryKey()
    const suspended = queryKey()

    const rendered = renderWithClient(
      queryClient,
      <IsRestoringProvider value={true}>
        <QueryStrictMode
          handleMissingPrefetch={handler}
          handleUnusedPrefetch={handler}
        >
          <React.Suspense fallback="loading">
            <SuspenseQuery id={suspended} />
          </React.Suspense>
        </QueryStrictMode>
      </IsRestoringProvider>,
    )

    void queryClient
      .query({
        queryKey: prefetched,
        queryFn: () => sleep(10).then(() => 'data'),
      })
      .catch(noop)

    await act(() => vi.advanceTimersByTimeAsync(10 + 10_000))
    expect(rendered.getByText(`data ${String(suspended)}`)).toBeInTheDocument()
    expect(handler).not.toHaveBeenCalled()
  })

  it('should only render children in production', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const key = queryKey()

    void queryClient
      .query({
        queryKey: queryKey(),
        queryFn: () => sleep(10).then(() => 'data'),
      })
      .catch(noop)

    const rendered = renderWithClient(
      queryClient,
      <QueryStrictMode
        handleMissingPrefetch={handler}
        handleUnusedPrefetch={handler}
      >
        <React.Suspense fallback="loading">
          <SuspenseQuery id={key} />
        </React.Suspense>
      </QueryStrictMode>,
    )

    await act(() => vi.advanceTimersByTimeAsync(10 + 10_000))
    expect(rendered.getByText(`data ${String(key)}`)).toBeInTheDocument()
    expect(handler).not.toHaveBeenCalled()
    vi.unstubAllEnvs()
  })
})
