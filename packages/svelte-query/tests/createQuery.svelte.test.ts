import { QueryCache, QueryClient, createQuery } from '@tanstack/svelte-query'
import { promiseWithResolvers, withEffectRoot } from './utils.svelte'

describe('useQuery', () => {
  const queryCache = new QueryCache()
  const queryClient = new QueryClient({ queryCache })

  beforeEach(() => {
    queryCache.clear()
  })

  it(
    'should allow to set default data value',
    withEffectRoot(async () => {
      const { promise, resolve } = promiseWithResolvers<string>()

      const { data = 'default' } = $derived.by(
        createQuery(
          {
            queryKey: ['test'],
            queryFn: () => {
              return promise
            },
          },
          queryClient,
        ),
      )

      expect(data).toBe('default')
      resolve('resolved')
      await vi.waitFor(() => expect(data).toBe('resolved'))
    }),
  )

  it(
    'should return the correct states for a successful query',
    withEffectRoot(async () => {
      const { promise, resolve } = promiseWithResolvers<string>()

      const query = $derived.by(
        createQuery<string, Error>(
          {
            queryKey: ['test'],
            queryFn: () => {
              return promise
            },
          },
          queryClient,
        ),
      )

      if (query.isPending) {
        expectTypeOf(query.data).toEqualTypeOf<undefined>()
        expectTypeOf(query.error).toEqualTypeOf<null>()
      } else if (query.isLoadingError) {
        expectTypeOf(query.data).toEqualTypeOf<undefined>()
        expectTypeOf(query.error).toEqualTypeOf<Error>()
      } else {
        expectTypeOf(query.data).toEqualTypeOf<string>()
        expectTypeOf(query.error).toEqualTypeOf<Error | null>()
      }

      let promise1 = query.promise

      expect(query).toEqual({
        data: undefined,
        dataUpdatedAt: 0,
        error: null,
        errorUpdatedAt: 0,
        failureCount: 0,
        failureReason: null,
        errorUpdateCount: 0,
        isError: false,
        isFetched: false,
        isFetchedAfterMount: false,
        isFetching: true,
        isPaused: false,
        isPending: true,
        isInitialLoading: true,
        isLoading: true,
        isLoadingError: false,
        isPlaceholderData: false,
        isRefetchError: false,
        isRefetching: false,
        isStale: true,
        isSuccess: false,
        refetch: expect.any(Function),
        status: 'pending',
        fetchStatus: 'fetching',
        promise: expect.any(Promise),
      })
      resolve('resolved')
      await promise
      expect(query).toEqual({
        data: 'resolved',
        dataUpdatedAt: expect.any(Number),
        error: null,
        errorUpdatedAt: 0,
        failureCount: 0,
        failureReason: null,
        errorUpdateCount: 0,
        isError: false,
        isFetched: true,
        isFetchedAfterMount: true,
        isFetching: false,
        isPaused: false,
        isPending: false,
        isInitialLoading: false,
        isLoading: false,
        isLoadingError: false,
        isPlaceholderData: false,
        isRefetchError: false,
        isRefetching: false,
        isStale: true,
        isSuccess: true,
        refetch: expect.any(Function),
        status: 'success',
        fetchStatus: 'idle',
        promise: expect.any(Promise),
      })

      expect(promise1).toBe(query.promise)
    }),
  )
})
