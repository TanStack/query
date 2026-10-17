import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent } from '@testing-library/react'
import * as React from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import {
  IsRestoringProvider,
  QueryClient,
  QueryErrorResetBoundary,
  QueryStrictMode,
  QueryStrictModeError,
  dehydrate,
  hydrate,
  noop,
  usePrefetchQuery,
  useQueries,
  useQuery,
  useSuspenseInfiniteQuery,
  useSuspenseQueries,
  useSuspenseQuery,
} from '..'
import { renderWithClient } from './utils'
import type { QueryKey, QueryStrictModeEvent, QueryStrictModeLogger } from '..'

describe('QueryStrictMode', () => {
  let queryClient: QueryClient
  let logger: ReturnType<typeof vi.fn<QueryStrictModeLogger>>

  beforeEach(() => {
    vi.useFakeTimers()
    queryClient = new QueryClient()
    logger = vi.fn<QueryStrictModeLogger>()
  })

  afterEach(() => {
    queryClient.clear()
    vi.useRealTimers()
  })

  const getQuery = (key: QueryKey) =>
    queryClient.getQueryCache().find({ queryKey: key })

  const loggedTypes = () => logger.mock.calls.map(([event]) => event.type)

  function SuspenseQuery({ id, ms = 10 }: { id: QueryKey; ms?: number }) {
    const { data } = useSuspenseQuery({
      queryKey: id,
      queryFn: () => sleep(ms).then(() => `data ${String(id)}`),
    })
    return <div>{data}</div>
  }

  describe('missing-prefetch', () => {
    it('should log once when a suspense hook starts a fetch during render', async () => {
      const key = queryKey()

      const rendered = renderWithClient(
        queryClient,
        <React.StrictMode>
          <QueryStrictMode logger={logger}>
            <React.Suspense fallback="loading">
              <SuspenseQuery id={key} />
            </React.Suspense>
          </QueryStrictMode>
        </React.StrictMode>,
      )

      expect(rendered.getByText('loading')).toBeInTheDocument()
      expect(logger).toHaveBeenCalledTimes(1)
      expect(logger).toHaveBeenCalledWith({
        type: 'missing-prefetch',
        suspense: true,
        message: expect.stringContaining(getQuery(key)!.queryHash),
        query: getQuery(key),
      })

      await act(() => vi.advanceTimersByTimeAsync(10))
      expect(rendered.getByText(`data ${String(key)}`)).toBeInTheDocument()

      // The suspense fetch itself must not count as an unused prefetch
      await act(() => vi.advanceTimersByTimeAsync(10_000))
      expect(logger).toHaveBeenCalledTimes(1)
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
        <QueryStrictMode logger={logger}>
          <React.Suspense fallback="loading">
            <Page />
          </React.Suspense>
        </QueryStrictMode>,
      )

      await act(() => vi.advanceTimersByTimeAsync(10))
      expect(rendered.getByText('pages: 1')).toBeInTheDocument()
      expect(logger).toHaveBeenCalledTimes(1)
      expect(logger.mock.calls[0]![0]).toMatchObject({
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
        <QueryStrictMode logger={logger}>
          <React.Suspense fallback="loading">
            <SuspenseQuery id={key} />
          </React.Suspense>
        </QueryStrictMode>,
      )

      expect(rendered.getByText('loading')).toBeInTheDocument()
      await act(() => vi.advanceTimersByTimeAsync(10))
      expect(rendered.getByText(`data ${String(key)}`)).toBeInTheDocument()

      await act(() => vi.advanceTimersByTimeAsync(10_000))
      expect(logger).not.toHaveBeenCalled()
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
        <QueryStrictMode logger={logger}>
          <Parent />
        </QueryStrictMode>,
      )

      await act(() => vi.advanceTimersByTimeAsync(10))
      expect(rendered.getByText(`data ${String(key)}`)).toBeInTheDocument()

      await act(() => vi.advanceTimersByTimeAsync(10_000))
      expect(logger).not.toHaveBeenCalled()
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
        <QueryStrictMode logger={logger}>
          <React.Suspense fallback="loading">
            <Page />
          </React.Suspense>
        </QueryStrictMode>,
      )

      await act(() => vi.advanceTimersByTimeAsync(10))
      expect(rendered.getByText('data: 1,2')).toBeInTheDocument()

      await act(() => vi.advanceTimersByTimeAsync(10_000))
      expect(logger).toHaveBeenCalledTimes(1)
      expect(logger.mock.calls[0]![0]).toMatchObject({
        type: 'missing-prefetch',
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
          <QueryStrictMode logger={logger}>
            <Page />
          </QueryStrictMode>
        </React.StrictMode>,
      )

      expect(rendered.getByText('pending')).toBeInTheDocument()
      expect(logger).toHaveBeenCalledTimes(1)
      expect(logger).toHaveBeenCalledWith({
        type: 'missing-prefetch',
        suspense: false,
        message: expect.stringContaining(getQuery(key)!.queryHash),
        query: getQuery(key),
      })

      await act(() => vi.advanceTimersByTimeAsync(11))
      expect(rendered.getByText('data')).toBeInTheDocument()

      await act(() => vi.advanceTimersByTimeAsync(10_000))
      expect(logger).toHaveBeenCalledTimes(1)
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
        <QueryStrictMode logger={logger}>
          <Page />
        </QueryStrictMode>,
      )

      await act(() => vi.advanceTimersByTimeAsync(11))
      expect(rendered.getByText('data,data')).toBeInTheDocument()

      await act(() => vi.advanceTimersByTimeAsync(10_000))
      expect(logger).not.toHaveBeenCalled()
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
        <QueryStrictMode logger={logger}>
          <Page enabled={false} />
        </QueryStrictMode>,
      )

      await act(() => vi.advanceTimersByTimeAsync(11))
      expect(rendered.getByText('pending')).toBeInTheDocument()
      expect(logger).not.toHaveBeenCalled()

      rendered.rerender(
        <QueryStrictMode logger={logger}>
          <Page enabled />
        </QueryStrictMode>,
      )
      await act(() => vi.advanceTimersByTimeAsync(11))
      expect(rendered.getByText('data')).toBeInTheDocument()
      expect(logger).toHaveBeenCalledTimes(1)
      expect(logger.mock.calls[0]![0]).toMatchObject({
        type: 'missing-prefetch',
        suspense: false,
        query: getQuery(key),
      })
    })

    it('should not log for a refetch of a query that has data', async () => {
      const key = queryKey()

      queryClient.setQueryData(key, 'cached')

      function Page() {
        const { data } = useQuery({
          queryKey: key,
          queryFn: () => sleep(10).then(() => 'data'),
          refetchOnMount: 'always',
        })
        return <div>{data}</div>
      }

      const rendered = renderWithClient(
        queryClient,
        <QueryStrictMode logger={logger}>
          <Page />
        </QueryStrictMode>,
      )

      await act(() => vi.advanceTimersByTimeAsync(11))
      expect(rendered.getByText('data')).toBeInTheDocument()
      expect(logger).not.toHaveBeenCalled()
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
        <QueryStrictMode logger={logger}>
          <Page />
        </QueryStrictMode>,
      )

      await act(() => vi.advanceTimersByTimeAsync(11))
      expect(rendered.getByText('data: 1,2')).toBeInTheDocument()

      await act(() => vi.advanceTimersByTimeAsync(10_000))
      expect(logger).toHaveBeenCalledTimes(1)
      expect(logger.mock.calls[0]![0]).toMatchObject({
        type: 'missing-prefetch',
        suspense: false,
        query: getQuery(key2),
      })
    })

    it('should not log for hooks outside of QueryStrictMode', async () => {
      const key = queryKey()

      const rendered = renderWithClient(
        queryClient,
        <>
          <QueryStrictMode logger={logger}>{null}</QueryStrictMode>
          <React.Suspense fallback="loading">
            <SuspenseQuery id={key} />
          </React.Suspense>
        </>,
      )

      await act(() => vi.advanceTimersByTimeAsync(10))
      expect(rendered.getByText(`data ${String(key)}`)).toBeInTheDocument()

      await act(() => vi.advanceTimersByTimeAsync(10_000))
      expect(logger).not.toHaveBeenCalled()
    })

    it('should not log again when an error boundary is reset', async () => {
      const consoleMock = vi
        .spyOn(console, 'error')
        .mockImplementation(() => undefined)
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
        <QueryStrictMode logger={logger}>
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

      expect(loggedTypes()).toEqual(['missing-prefetch'])
      consoleMock.mockRestore()
    })

    it('should log with console.error by default', async () => {
      const consoleMock = vi
        .spyOn(console, 'error')
        .mockImplementation(() => undefined)
      const key = queryKey()

      renderWithClient(
        queryClient,
        <QueryStrictMode>
          <React.Suspense fallback="loading">
            <SuspenseQuery id={key} />
          </React.Suspense>
        </QueryStrictMode>,
      )

      expect(consoleMock).toHaveBeenCalledTimes(1)
      expect(consoleMock).toHaveBeenCalledWith(
        expect.stringContaining(getQuery(key)!.queryHash),
      )

      await act(() => vi.advanceTimersByTimeAsync(10))
      consoleMock.mockRestore()
    })

    describe('throwOnMissingPrefetch', () => {
      function renderThrowing(
        id: QueryKey,
        throwOnMissingPrefetch: React.ComponentProps<
          typeof QueryStrictMode
        >['throwOnMissingPrefetch'],
        queryFn = vi.fn(() => sleep(10).then(() => `data ${String(id)}`)),
      ) {
        const errors: Array<unknown> = []

        function Page() {
          const { data } = useSuspenseQuery({ queryKey: id, queryFn })
          return <div>{data}</div>
        }

        const rendered = renderWithClient(
          queryClient,
          <QueryStrictMode
            logger={logger}
            throwOnMissingPrefetch={throwOnMissingPrefetch}
          >
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
        const consoleMock = vi
          .spyOn(console, 'error')
          .mockImplementation(() => undefined)
        const key = queryKey()

        const { rendered, queryFn, errors } = renderThrowing(key, true)

        expect(
          rendered.getByText(
            new RegExp(`error: .*${getQuery(key)!.queryHash}`),
          ),
        ).toBeInTheDocument()
        expect(logger).not.toHaveBeenCalled()

        const error = errors[0]
        expect(error).toBeInstanceOf(QueryStrictModeError)
        expect(error).toBeInstanceOf(Error)
        expect(error).toMatchObject({
          name: 'QueryStrictModeError',
          type: 'missing-prefetch',
          message: expect.stringContaining(getQuery(key)!.queryHash),
          query: getQuery(key),
        })

        await act(() => vi.advanceTimersByTimeAsync(10))
        expect(queryFn).not.toHaveBeenCalled()
        expect(rendered.queryByText(`data ${String(key)}`)).toBeNull()
        consoleMock.mockRestore()
      })

      it('should throw again after the error boundary is reset', async () => {
        const consoleMock = vi
          .spyOn(console, 'error')
          .mockImplementation(() => undefined)
        const key = queryKey()

        const { rendered, queryFn } = renderThrowing(key, true)
        expect(rendered.getByText(/error:/)).toBeInTheDocument()

        fireEvent.click(rendered.getByText('retry'))
        await act(() => vi.advanceTimersByTimeAsync(10))
        expect(rendered.getByText(/error:/)).toBeInTheDocument()
        expect(queryFn).not.toHaveBeenCalled()
        consoleMock.mockRestore()
      })

      it('should only throw when the function returns true, and log otherwise', async () => {
        const consoleMock = vi
          .spyOn(console, 'error')
          .mockImplementation(() => undefined)
        const thrown = queryKey()
        const logged = queryKey()
        const shouldThrow = (event: QueryStrictModeEvent) =>
          event.query.queryHash === getQuery(thrown)?.queryHash

        const first = renderThrowing(thrown, shouldThrow)
        expect(first.rendered.getByText(/error:/)).toBeInTheDocument()
        first.rendered.unmount()

        const second = renderThrowing(logged, shouldThrow)
        await act(() => vi.advanceTimersByTimeAsync(10))
        expect(
          second.rendered.getByText(`data ${String(logged)}`),
        ).toBeInTheDocument()
        expect(logger).toHaveBeenCalledTimes(1)
        expect(logger.mock.calls[0]![0]).toMatchObject({
          type: 'missing-prefetch',
          query: getQuery(logged),
        })
        consoleMock.mockRestore()
      })

      it('should throw from useQuery instead of fetching', async () => {
        const consoleMock = vi
          .spyOn(console, 'error')
          .mockImplementation(() => undefined)
        const key = queryKey()
        const queryFn = vi.fn(() => sleep(10).then(() => 'data'))

        function Page() {
          const { data } = useQuery({ queryKey: key, queryFn })
          return <div>{data ?? 'pending'}</div>
        }

        const rendered = renderWithClient(
          queryClient,
          <QueryStrictMode logger={logger} throwOnMissingPrefetch>
            <ErrorBoundary
              fallbackRender={({ error }) => (
                <div>
                  {error instanceof QueryStrictModeError
                    ? `strict: ${error.type}`
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
        await act(() => vi.advanceTimersByTimeAsync(10))
        expect(queryFn).not.toHaveBeenCalled()
        expect(logger).not.toHaveBeenCalled()
        consoleMock.mockRestore()
      })

      it('should not throw when the query is being prefetched', async () => {
        const key = queryKey()

        void queryClient
          .query({
            queryKey: key,
            queryFn: () => sleep(10).then(() => `data ${String(key)}`),
          })
          .catch(noop)

        const { rendered } = renderThrowing(key, true)

        await act(() => vi.advanceTimersByTimeAsync(10))
        expect(rendered.getByText(`data ${String(key)}`)).toBeInTheDocument()
        expect(logger).not.toHaveBeenCalled()
      })
    })
  })

  describe('unused-prefetch', () => {
    it('should log when a prefetched query is not used within 5000ms of its data arriving', async () => {
      const key = queryKey()

      renderWithClient(
        queryClient,
        <QueryStrictMode logger={logger}>{null}</QueryStrictMode>,
      )

      void queryClient
        .query({
          queryKey: key,
          queryFn: () => sleep(10).then(() => 'data'),
        })
        .catch(noop)

      // The timer starts when the data arrives, not when the fetch starts
      await act(() => vi.advanceTimersByTimeAsync(10 + 4999))
      expect(logger).not.toHaveBeenCalled()

      await act(() => vi.advanceTimersByTimeAsync(1))
      expect(logger).toHaveBeenCalledTimes(1)
      expect(logger).toHaveBeenCalledWith({
        type: 'unused-prefetch',
        message: expect.stringContaining(getQuery(key)!.queryHash),
        query: getQuery(key),
      })
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
            <QueryStrictMode logger={logger}>{null}</QueryStrictMode>
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
      expect(rendered.queryByText('data')).toBeNull()

      await act(() => vi.advanceTimersByTimeAsync(5000))
      expect(loggedTypes()).toEqual(['unused-prefetch'])
      expect(logger.mock.calls[0]![0].query).toBe(getQuery(key))
    })

    it('should respect a custom unusedPrefetchTimeout', async () => {
      const key = queryKey()

      renderWithClient(
        queryClient,
        <QueryStrictMode logger={logger} unusedPrefetchTimeout={1000}>
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
      expect(logger).not.toHaveBeenCalled()

      await act(() => vi.advanceTimersByTimeAsync(1))
      expect(loggedTypes()).toEqual(['unused-prefetch'])
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
        <QueryStrictMode logger={logger}>{null}</QueryStrictMode>,
      )

      void queryClient.query({ queryKey: key, queryFn }).catch(noop)
      await act(() => vi.advanceTimersByTimeAsync(10 + 1000))

      rendered.rerender(
        <QueryStrictMode logger={logger}>
          <Page />
        </QueryStrictMode>,
      )
      expect(rendered.getByText('data')).toBeInTheDocument()

      await act(() => vi.advanceTimersByTimeAsync(10_000))
      expect(logger).not.toHaveBeenCalled()
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
        <QueryStrictMode logger={logger}>
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
      expect(logger).not.toHaveBeenCalled()
    })

    it('should only log once per query', async () => {
      const key = queryKey()

      renderWithClient(
        queryClient,
        <QueryStrictMode logger={logger}>{null}</QueryStrictMode>,
      )

      void queryClient
        .query({
          queryKey: key,
          queryFn: () => sleep(10).then(() => 'data'),
        })
        .catch(noop)

      await act(() => vi.advanceTimersByTimeAsync(10 + 5000))
      expect(loggedTypes()).toEqual(['unused-prefetch'])

      void queryClient.invalidateQueries({ queryKey: key, refetchType: 'all' })

      await act(() => vi.advanceTimersByTimeAsync(10 + 10_000))
      expect(loggedTypes()).toEqual(['unused-prefetch'])
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
        <QueryStrictMode logger={logger}>{null}</QueryStrictMode>,
      )

      await act(() => vi.advanceTimersByTimeAsync(10_000))
      expect(logger).not.toHaveBeenCalled()
    })

    it('should not start a timer for setQueryData', async () => {
      const key = queryKey()

      renderWithClient(
        queryClient,
        <QueryStrictMode logger={logger}>{null}</QueryStrictMode>,
      )

      act(() => {
        queryClient.setQueryData(key, 'data')
      })

      await act(() => vi.advanceTimersByTimeAsync(10_000))
      expect(logger).not.toHaveBeenCalled()
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
        <QueryStrictMode logger={logger}>{null}</QueryStrictMode>,
      )

      act(() => {
        hydrate(queryClient, dehydrated)
      })

      await act(() => vi.advanceTimersByTimeAsync(10_000))
      expect(logger).not.toHaveBeenCalled()
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
        <QueryStrictMode logger={logger}>
          <Page />
        </QueryStrictMode>,
      )

      await act(() => vi.advanceTimersByTimeAsync(11))
      expect(rendered.getByText('data')).toBeInTheDocument()

      rendered.rerender(
        <QueryStrictMode logger={logger}>{null}</QueryStrictMode>,
      )
      void queryClient.invalidateQueries({ queryKey: key, refetchType: 'all' })

      await act(() => vi.advanceTimersByTimeAsync(10 + 10_000))
      // Only the initial fetch of `Page` is reported
      expect(loggedTypes()).toEqual(['missing-prefetch'])
    })

    it('should clear its timers on unmount', async () => {
      const key = queryKey()

      const rendered = renderWithClient(
        queryClient,
        <QueryStrictMode logger={logger}>{null}</QueryStrictMode>,
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
      expect(logger).not.toHaveBeenCalled()
    })

    it('should only log once when QueryStrictMode is nested', async () => {
      const key = queryKey()
      const innerLogger = vi.fn<QueryStrictModeLogger>()

      renderWithClient(
        queryClient,
        <QueryStrictMode logger={logger}>
          <QueryStrictMode logger={innerLogger}>{null}</QueryStrictMode>
        </QueryStrictMode>,
      )

      void queryClient
        .query({
          queryKey: key,
          queryFn: () => sleep(10).then(() => 'data'),
        })
        .catch(noop)

      await act(() => vi.advanceTimersByTimeAsync(10 + 5000))
      expect(loggedTypes()).toEqual(['unused-prefetch'])
      expect(innerLogger).not.toHaveBeenCalled()
    })

    describe('throwOnUnusedPrefetch', () => {
      const prefetch = (key: QueryKey, ms = 10) =>
        void queryClient
          .query({ queryKey: key, queryFn: () => sleep(ms).then(() => 'data') })
          .catch(noop)

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

      it('should throw from QueryStrictMode to the nearest error boundary', async () => {
        const consoleMock = vi
          .spyOn(console, 'error')
          .mockImplementation(() => undefined)
        const key = queryKey()

        const { rendered, errors } = renderThrowing((children) => (
          <QueryStrictMode logger={logger} throwOnUnusedPrefetch>
            {children}
          </QueryStrictMode>
        ))

        prefetch(key)

        await act(() => vi.advanceTimersByTimeAsync(10 + 4999))
        expect(rendered.getByText('content')).toBeInTheDocument()

        await act(() => vi.advanceTimersByTimeAsync(1))
        expect(rendered.queryByText('content')).toBeNull()
        expect(
          rendered.getByText(
            new RegExp(`error: .*${getQuery(key)!.queryHash}`),
          ),
        ).toBeInTheDocument()
        expect(logger).not.toHaveBeenCalled()

        const error = errors[0]
        expect(error).toBeInstanceOf(QueryStrictModeError)
        expect(error).toMatchObject({
          name: 'QueryStrictModeError',
          type: 'unused-prefetch',
          message: expect.stringContaining(getQuery(key)!.queryHash),
          query: getQuery(key),
        })
        consoleMock.mockRestore()
      })

      it('should only throw when the function returns true, and log otherwise', async () => {
        const consoleMock = vi
          .spyOn(console, 'error')
          .mockImplementation(() => undefined)
        const logged = queryKey()
        const thrown = queryKey()

        const { rendered, errors } = renderThrowing((children) => (
          <QueryStrictMode
            logger={logger}
            throwOnUnusedPrefetch={(event) =>
              event.query.queryHash === getQuery(thrown)?.queryHash
            }
          >
            {children}
          </QueryStrictMode>
        ))

        prefetch(logged, 10)
        prefetch(thrown, 20)

        await act(() => vi.advanceTimersByTimeAsync(10 + 5000))
        expect(rendered.getByText('content')).toBeInTheDocument()
        expect(logger).toHaveBeenCalledTimes(1)
        expect(logger.mock.calls[0]![0]).toMatchObject({
          type: 'unused-prefetch',
          query: getQuery(logged),
        })

        await act(() => vi.advanceTimersByTimeAsync(10))
        expect(rendered.queryByText('content')).toBeNull()
        expect(errors[0]).toMatchObject({ query: getQuery(thrown) })
        expect(logger).toHaveBeenCalledTimes(1)
        consoleMock.mockRestore()
      })

      it('should not throw when the prefetched query is used before the timeout', async () => {
        const key = queryKey()

        function Reader() {
          const { data } = useQuery({
            queryKey: key,
            queryFn: () => sleep(10).then(() => 'data'),
          })
          return <div>{data}</div>
        }

        const { rendered } = renderThrowing((children) => (
          <QueryStrictMode logger={logger} throwOnUnusedPrefetch>
            {children}
            <Reader />
          </QueryStrictMode>
        ))

        prefetch(key)

        await act(() => vi.advanceTimersByTimeAsync(10 + 10_000))
        expect(rendered.getByText('content')).toBeInTheDocument()
        expect(rendered.getByText('data')).toBeInTheDocument()
        // `Reader` mounts before the prefetch, so it starts the fetch itself
        expect(loggedTypes()).toEqual(['missing-prefetch'])
      })

      it('should ignore throwOnUnusedPrefetch of a nested QueryStrictMode', async () => {
        const key = queryKey()

        const { rendered } = renderThrowing((children) => (
          <QueryStrictMode logger={logger}>
            <QueryStrictMode throwOnUnusedPrefetch>{children}</QueryStrictMode>
          </QueryStrictMode>
        ))

        prefetch(key)

        await act(() => vi.advanceTimersByTimeAsync(10 + 5000))
        expect(rendered.getByText('content')).toBeInTheDocument()
        expect(loggedTypes()).toEqual(['unused-prefetch'])
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
        <QueryStrictMode logger={logger}>
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
    expect(logger).not.toHaveBeenCalled()
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
      <QueryStrictMode logger={logger}>
        <React.Suspense fallback="loading">
          <SuspenseQuery id={key} />
        </React.Suspense>
      </QueryStrictMode>,
    )

    await act(() => vi.advanceTimersByTimeAsync(10 + 10_000))
    expect(rendered.getByText(`data ${String(key)}`)).toBeInTheDocument()
    expect(logger).not.toHaveBeenCalled()
    vi.unstubAllEnvs()
  })
})
