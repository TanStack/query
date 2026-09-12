import { afterEach, beforeEach, describe, expectTypeOf, it } from 'vitest'
import { queryKey } from '@tanstack/query-test-utils'
import { QueryClient, QueryObserver } from '..'
import type {
  DefaultError,
  FetchStatus,
  InitialDataFunction,
  NetworkMode,
  NotifyOnChangeProps,
  PlaceholderDataFunction,
  QueryMeta,
  QueryObserverOptions,
  QueryObserverResult,
  QueryPersister,
  QueryStatus,
  RefetchOptions,
} from '..'

class CustomError extends Error {
  name = 'CustomError' as const
}

describe('queryObserver', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient()
    queryClient.mount()
  })

  afterEach(() => {
    queryClient.clear()
  })

  describe('type parameters', () => {
    it('should default to an unknown data type and the default error', () => {
      expectTypeOf<
        Awaited<ReturnType<QueryObserver['refetch']>>
      >().toEqualTypeOf<QueryObserverResult<unknown, DefaultError>>()
    })

    it('should only accept an array as its queryKey', () => {
      const observer = new QueryObserver(queryClient, {
        // @ts-expect-error a query key must be an array
        queryKey: 'not-an-array',
        queryFn: () => Promise.resolve('data'),
      })

      expectTypeOf(observer.getCurrentQuery().queryKey).toEqualTypeOf<
        ReadonlyArray<unknown>
      >()
    })
  })

  describe('QueryObserverOptions', () => {
    describe('queryFn', () => {
      it('should type the context given to the queryFn', () => {
        const key = ['a', 1] as const

        new QueryObserver(queryClient, {
          queryKey: key,
          queryFn: (context) => {
            expectTypeOf(context.queryKey).toEqualTypeOf<readonly ['a', 1]>()
            expectTypeOf(context.signal).toEqualTypeOf<AbortSignal>()
            expectTypeOf(context.client).toEqualTypeOf<QueryClient>()
            return Promise.resolve('data')
          },
        })
      })
    })

    describe('enabled', () => {
      it('should type the query given to an enabled callback', () => {
        new QueryObserver(queryClient, {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve({ value: 'data' }),
          enabled: (query) => {
            expectTypeOf(query.state.data).toEqualTypeOf<
              { value: string } | undefined
            >()
            return true
          },
        })
      })
    })

    describe('staleTime', () => {
      it('should type the query given to a staleTime callback', () => {
        new QueryObserver(queryClient, {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve({ value: 'data' }),
          staleTime: (query) => {
            expectTypeOf(query.state.data).toEqualTypeOf<
              { value: string } | undefined
            >()
            return 0
          },
        })
      })
    })

    describe('refetchInterval', () => {
      it('should type the query given to a refetchInterval callback', () => {
        new QueryObserver(queryClient, {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve({ value: 'data' }),
          refetchInterval: (query) => {
            expectTypeOf(query.state.data).toEqualTypeOf<
              { value: string } | undefined
            >()
            return false
          },
        })
      })
    })

    describe('refetchOnWindowFocus', () => {
      it('should type the query given to a refetchOnWindowFocus callback', () => {
        new QueryObserver(queryClient, {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve({ value: 'data' }),
          refetchOnWindowFocus: (query) => {
            expectTypeOf(query.state.data).toEqualTypeOf<
              { value: string } | undefined
            >()
            return true
          },
        })
      })
    })

    describe('refetchOnReconnect', () => {
      it('should type the query given to a refetchOnReconnect callback', () => {
        new QueryObserver(queryClient, {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve({ value: 'data' }),
          refetchOnReconnect: (query) => {
            expectTypeOf(query.state.data).toEqualTypeOf<
              { value: string } | undefined
            >()
            return true
          },
        })
      })
    })

    describe('refetchOnMount', () => {
      it('should type the query given to a refetchOnMount callback', () => {
        new QueryObserver(queryClient, {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve({ value: 'data' }),
          refetchOnMount: (query) => {
            expectTypeOf(query.state.data).toEqualTypeOf<
              { value: string } | undefined
            >()
            return true
          },
        })
      })
    })

    describe('retryOnMount', () => {
      it('should type the query given to a retryOnMount callback', () => {
        new QueryObserver(queryClient, {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve({ value: 'data' }),
          retryOnMount: (query) => {
            expectTypeOf(query.state.data).toEqualTypeOf<
              { value: string } | undefined
            >()
            return true
          },
        })
      })
    })

    describe('throwOnError', () => {
      it('should type the error given to a throwOnError callback', () => {
        new QueryObserver<{ value: string }, CustomError>(queryClient, {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve({ value: 'data' }),
          throwOnError: (error) => {
            expectTypeOf(error).toEqualTypeOf<CustomError>()
            return false
          },
        })
      })
    })

    describe('retry', () => {
      it('should type the error given to a retry callback', () => {
        new QueryObserver<boolean, CustomError>(queryClient, {
          queryKey: queryKey(),
          retry: (_failureCount, error) => {
            expectTypeOf(error).toEqualTypeOf<CustomError>()
            return false
          },
        })
      })
    })

    describe('retryDelay', () => {
      it('should type the error given to a retryDelay callback', () => {
        new QueryObserver<boolean, CustomError>(queryClient, {
          queryKey: queryKey(),
          retryDelay: (_failureCount, error) => {
            expectTypeOf(error).toEqualTypeOf<CustomError>()
            return 0
          },
        })
      })
    })

    describe('queryKeyHashFn', () => {
      it('should type the queryKey given to a queryKeyHashFn', () => {
        const key = ['a', 1] as const

        new QueryObserver(queryClient, {
          queryKey: key,
          queryFn: () => Promise.resolve('data'),
          queryKeyHashFn: (queryKeyToHash) => {
            expectTypeOf(queryKeyToHash).toEqualTypeOf<readonly ['a', 1]>()
            return 'hash'
          },
        })
      })
    })

    describe('structuralSharing', () => {
      it('should type a structuralSharing callback as unknown', () => {
        new QueryObserver(queryClient, {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve({ value: 'data' }),
          structuralSharing: (_oldData, newData) => {
            expectTypeOf(newData).toEqualTypeOf<unknown>()
            return newData
          },
        })
      })
    })

    describe('select', () => {
      it('should type the result data as what select returns', () => {
        const observer = new QueryObserver(queryClient, {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve({ count: 1 }),
          select: (data) => data.count,
        })

        expectTypeOf(observer.getCurrentResult().data).toEqualTypeOf<
          number | undefined
        >()
      })

      it('should infer the selected type in the subscribe callback', () => {
        const observer = new QueryObserver(queryClient, {
          queryKey: queryKey(),
          queryFn: () => ({ count: 1 }),
          select: (data) => ({ myCount: data.count }),
        })

        observer.subscribe((result) => {
          expectTypeOf(result).toEqualTypeOf<
            QueryObserverResult<{ myCount: number }>
          >()
        })
      })

      it('should infer the selected type from the refetch result', async () => {
        const observer = new QueryObserver(queryClient, {
          queryKey: queryKey(),
          queryFn: () => ({ count: 1 }),
          select: (data) => ({ myCount: data.count }),
        })

        const observerResult = await observer.refetch()

        expectTypeOf(observerResult.data).toEqualTypeOf<
          { myCount: number } | undefined
        >()
      })
    })

    describe('initialData', () => {
      it('should type an initialData function from the data type', () => {
        new QueryObserver(queryClient, {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve({ value: 'data' }),
          initialData: () => {
            expectTypeOf<
              QueryObserverOptions<{ value: string }>['initialData']
            >()
              .extract<InitialDataFunction<any>>()
              .returns.toEqualTypeOf<{ value: string } | undefined>()

            return { value: 'data' }
          },
        })
      })
    })

    describe('initialDataUpdatedAt', () => {
      it('should accept a function for initialDataUpdatedAt', () => {
        expectTypeOf<
          QueryObserverOptions['initialDataUpdatedAt']
        >().toEqualTypeOf<number | (() => number | undefined) | undefined>()
      })
    })

    describe('placeholderData', () => {
      it('should return the query data type or undefined', () => {
        expectTypeOf<
          PlaceholderDataFunction<{ value: string }>
        >().returns.toEqualTypeOf<{ value: string } | undefined>()
      })

      it('should type the queryKey of the previousQuery it is given', () => {
        const testQueryKey = ['SomeQuery', 42, { foo: 'bar' }] as const

        new QueryObserver(queryClient, {
          queryKey: testQueryKey,
          placeholderData: (_, previousQuery) => {
            if (previousQuery) {
              expectTypeOf(previousQuery.queryKey).toEqualTypeOf<
                typeof testQueryKey
              >()
            }
          },
        })
      })

      it('should type the error of the previousQuery it is given', () => {
        new QueryObserver<boolean, CustomError>(queryClient, {
          queryKey: queryKey(),
          placeholderData: (_, previousQuery) => {
            if (previousQuery) {
              expectTypeOf(
                previousQuery.state.error,
              ).toEqualTypeOf<CustomError | null>()
            }
            return undefined
          },
        })
      })

      it('should type previousData as the query data', () => {
        const queryData = { foo: 'bar' } as const

        new QueryObserver(queryClient, {
          queryKey: queryKey(),
          queryFn: () => queryData,
          select: (data) => data.foo,
          placeholderData: (previousData) => {
            expectTypeOf(previousData).toEqualTypeOf<
              typeof queryData | undefined
            >()
            return undefined
          },
        })
      })
    })

    describe('gcTime', () => {
      it('should reject a non-number gcTime', () => {
        new QueryObserver(queryClient, {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve('data'),
          // @ts-expect-error gcTime must be a number
          gcTime: 'nope',
        })

        expectTypeOf<QueryObserverOptions['gcTime']>().toEqualTypeOf<
          number | undefined
        >()
      })
    })

    describe('queryHash', () => {
      it('should reject a non-string queryHash', () => {
        new QueryObserver(queryClient, {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve('data'),
          // @ts-expect-error queryHash must be a string
          queryHash: 42,
        })

        expectTypeOf<QueryObserverOptions['queryHash']>().toEqualTypeOf<
          string | undefined
        >()
      })
    })

    describe('networkMode', () => {
      it('should type networkMode as the network mode union', () => {
        new QueryObserver(queryClient, {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve('data'),
          // @ts-expect-error networkMode must be one of the NetworkMode values
          networkMode: 'nope',
        })

        expectTypeOf<QueryObserverOptions['networkMode']>().toEqualTypeOf<
          NetworkMode | undefined
        >()
      })
    })

    describe('suspense', () => {
      it('should type suspense as a boolean', () => {
        expectTypeOf<QueryObserverOptions['suspense']>().toEqualTypeOf<
          boolean | undefined
        >()
      })
    })

    describe('refetchIntervalInBackground', () => {
      it('should type refetchIntervalInBackground as a boolean', () => {
        expectTypeOf<
          QueryObserverOptions['refetchIntervalInBackground']
        >().toEqualTypeOf<boolean | undefined>()
      })
    })

    describe('meta', () => {
      it('should type meta as its named type', () => {
        expectTypeOf<QueryObserverOptions['meta']>().toEqualTypeOf<
          QueryMeta | undefined
        >()
      })
    })

    describe('notifyOnChangeProps', () => {
      it('should type notifyOnChangeProps as its named type', () => {
        expectTypeOf<
          QueryObserverOptions['notifyOnChangeProps']
        >().toEqualTypeOf<NotifyOnChangeProps | undefined>()
      })
    })

    describe('persister', () => {
      it('should type persister from the queryFn data', () => {
        expectTypeOf<
          QueryObserverOptions<{ value: string }>['persister']
        >().toEqualTypeOf<
          | QueryPersister<{ value: string }, ReadonlyArray<unknown>, never>
          | undefined
        >()
      })
    })
  })

  describe('QueryObserverResult', () => {
    describe('timestamps and counters', () => {
      it('should type its timestamps and counters as numbers', () => {
        const observer = new QueryObserver(queryClient, {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve({ value: 'data' }),
        })

        const result = observer.getCurrentResult()

        expectTypeOf(result.dataUpdatedAt).toEqualTypeOf<number>()
        expectTypeOf(result.errorUpdatedAt).toEqualTypeOf<number>()
        expectTypeOf(result.failureCount).toEqualTypeOf<number>()
        expectTypeOf(result.errorUpdateCount).toEqualTypeOf<number>()
      })
    })

    describe('state flags', () => {
      it('should type its state flags as booleans', () => {
        const observer = new QueryObserver(queryClient, {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve({ value: 'data' }),
        })

        const result = observer.getCurrentResult()

        expectTypeOf(result.isFetching).toEqualTypeOf<boolean>()
        expectTypeOf(result.isRefetching).toEqualTypeOf<boolean>()
        expectTypeOf(result.isPaused).toEqualTypeOf<boolean>()
        expectTypeOf(result.isStale).toEqualTypeOf<boolean>()
        expectTypeOf(result.isEnabled).toEqualTypeOf<boolean>()
        expectTypeOf(result.isFetched).toEqualTypeOf<boolean>()
        expectTypeOf(result.isFetchedAfterMount).toEqualTypeOf<boolean>()
      })
    })

    describe('failureReason', () => {
      it('should type failureReason from the error type', () => {
        const observer = new QueryObserver<boolean, CustomError>(queryClient, {
          queryKey: queryKey(),
        })

        expectTypeOf(
          observer.getCurrentResult().failureReason,
        ).toEqualTypeOf<CustomError | null>()
      })
    })

    describe('refetch', () => {
      it('should type its refetch from the observed types', () => {
        const observer = new QueryObserver(queryClient, {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve({ value: 'data' }),
        })

        expectTypeOf(observer.getCurrentResult().refetch).returns.toEqualTypeOf<
          Promise<QueryObserverResult<{ value: string }, DefaultError>>
        >()
      })

      it('should only accept RefetchOptions in its refetch', () => {
        const observer = new QueryObserver(queryClient, {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve({ value: 'data' }),
        })

        expectTypeOf(
          observer.getCurrentResult().refetch,
        ).parameters.toEqualTypeOf<[options?: RefetchOptions]>()
      })
    })

    describe('status', () => {
      it('should type status as the query status union', () => {
        const observer = new QueryObserver(queryClient, {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve({ value: 'data' }),
        })

        expectTypeOf(
          observer.getCurrentResult().status,
        ).toEqualTypeOf<QueryStatus>()
      })
    })

    describe('fetchStatus', () => {
      it('should type fetchStatus as the fetch status union', () => {
        const observer = new QueryObserver(queryClient, {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve({ value: 'data' }),
        })

        expectTypeOf(
          observer.getCurrentResult().fetchStatus,
        ).toEqualTypeOf<FetchStatus>()
      })
    })

    describe('narrowing', () => {
      it('should narrow error to the error type on an isError check', () => {
        const observer = new QueryObserver(queryClient, {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve({ value: 'data' }),
        })

        const result = observer.getCurrentResult()

        if (result.isError) {
          expectTypeOf(result.error).toEqualTypeOf<DefaultError>()
        }
      })

      it('should keep data possibly undefined on an isError check', () => {
        const observer = new QueryObserver(queryClient, {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve({ value: 'data' }),
        })

        const result = observer.getCurrentResult()

        if (result.isError) {
          expectTypeOf(result.data).toEqualTypeOf<
            { value: string } | undefined
          >()
        }
      })

      it('should narrow data to be defined on a success status check', () => {
        const observer = new QueryObserver(queryClient, {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve({ value: 'data' }),
        })

        const result = observer.getCurrentResult()

        if (result.status === 'success') {
          expectTypeOf(result.data).toEqualTypeOf<{ value: string }>()
        }
      })

      it('should narrow error to the error type on an error status check', () => {
        const observer = new QueryObserver(queryClient, {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve({ value: 'data' }),
        })

        const result = observer.getCurrentResult()

        if (result.status === 'error') {
          expectTypeOf(result.error).toEqualTypeOf<DefaultError>()
        }
      })

      it('should narrow data to undefined on a pending status check', () => {
        const observer = new QueryObserver(queryClient, {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve({ value: 'data' }),
        })

        const result = observer.getCurrentResult()

        if (result.status === 'pending') {
          expectTypeOf(result.data).toEqualTypeOf<undefined>()
        }
      })
    })

    describe('QueryObserverPendingResult', () => {
      it('should be extractable from the result union by its isPending literal', () => {
        type Pending = Extract<
          QueryObserverResult<{ value: string }>,
          { status: 'pending'; isLoading: boolean }
        >

        expectTypeOf<Pending['isPending']>().toEqualTypeOf<true>()
      })

      it('should pin every flag along with its data and error types', () => {
        const observer = new QueryObserver(queryClient, {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve({ value: 'data' }),
        })

        const result = observer.getCurrentResult()

        if (result.isPending) {
          expectTypeOf(result.data).toEqualTypeOf<undefined>()
          expectTypeOf(result.error).toEqualTypeOf<null>()
          expectTypeOf(result.isError).toEqualTypeOf<false>()
          expectTypeOf(result.isPending).toEqualTypeOf<true>()
          expectTypeOf(result.isLoading).toEqualTypeOf<boolean>()
          expectTypeOf(result.isLoadingError).toEqualTypeOf<false>()
          expectTypeOf(result.isRefetchError).toEqualTypeOf<false>()
          expectTypeOf(result.status).toEqualTypeOf<'pending'>()
          expectTypeOf(result.isPlaceholderData).toEqualTypeOf<false>()
        }
      })
    })

    describe('QueryObserverLoadingResult', () => {
      it('should be extractable from the result union by its isLoading literal', () => {
        type Loading = Extract<
          QueryObserverResult<{ value: string }>,
          { isLoading: true }
        >

        expectTypeOf<Loading['isLoading']>().toEqualTypeOf<true>()
      })

      it('should pin every flag along with its data and error types', () => {
        const observer = new QueryObserver(queryClient, {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve({ value: 'data' }),
        })

        const result = observer.getCurrentResult()

        if (result.isLoading) {
          expectTypeOf(result.data).toEqualTypeOf<undefined>()
          expectTypeOf(result.error).toEqualTypeOf<null>()
          expectTypeOf(result.isError).toEqualTypeOf<false>()
          expectTypeOf(result.isPending).toEqualTypeOf<true>()
          expectTypeOf(result.isLoading).toEqualTypeOf<true>()
          expectTypeOf(result.isLoadingError).toEqualTypeOf<false>()
          expectTypeOf(result.isRefetchError).toEqualTypeOf<false>()
          expectTypeOf(result.isSuccess).toEqualTypeOf<false>()
          expectTypeOf(result.status).toEqualTypeOf<'pending'>()
          expectTypeOf(result.isPlaceholderData).toEqualTypeOf<false>()
        }
      })
    })

    describe('QueryObserverLoadingErrorResult', () => {
      it('should be extractable from the result union by its isLoadingError literal', () => {
        type LoadingError = Extract<
          QueryObserverResult<{ value: string }>,
          { isLoadingError: true }
        >

        expectTypeOf<LoadingError['isLoadingError']>().toEqualTypeOf<true>()
      })

      it('should pin every flag along with its data and error types', () => {
        const observer = new QueryObserver(queryClient, {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve({ value: 'data' }),
        })

        const result = observer.getCurrentResult()

        if (result.isLoadingError) {
          expectTypeOf(result.data).toEqualTypeOf<undefined>()
          expectTypeOf(result.error).toEqualTypeOf<DefaultError>()
          expectTypeOf(result.isError).toEqualTypeOf<true>()
          expectTypeOf(result.isPending).toEqualTypeOf<false>()
          expectTypeOf(result.isLoading).toEqualTypeOf<false>()
          expectTypeOf(result.isLoadingError).toEqualTypeOf<true>()
          expectTypeOf(result.isRefetchError).toEqualTypeOf<false>()
          expectTypeOf(result.isSuccess).toEqualTypeOf<false>()
          expectTypeOf(result.status).toEqualTypeOf<'error'>()
          expectTypeOf(result.isPlaceholderData).toEqualTypeOf<false>()
        }
      })
    })

    describe('QueryObserverRefetchErrorResult', () => {
      it('should be extractable from the result union by its isRefetchError literal', () => {
        type RefetchError = Extract<
          QueryObserverResult<{ value: string }>,
          { isRefetchError: true }
        >

        expectTypeOf<RefetchError['isRefetchError']>().toEqualTypeOf<true>()
      })

      it('should pin every flag along with its data and error types', () => {
        const observer = new QueryObserver(queryClient, {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve({ value: 'data' }),
        })

        const result = observer.getCurrentResult()

        if (result.isRefetchError) {
          expectTypeOf(result.data).toEqualTypeOf<{ value: string }>()
          expectTypeOf(result.error).toEqualTypeOf<DefaultError>()
          expectTypeOf(result.isError).toEqualTypeOf<true>()
          expectTypeOf(result.isPending).toEqualTypeOf<false>()
          expectTypeOf(result.isLoading).toEqualTypeOf<false>()
          expectTypeOf(result.isLoadingError).toEqualTypeOf<false>()
          expectTypeOf(result.isRefetchError).toEqualTypeOf<true>()
          expectTypeOf(result.isSuccess).toEqualTypeOf<false>()
          expectTypeOf(result.status).toEqualTypeOf<'error'>()
          expectTypeOf(result.isPlaceholderData).toEqualTypeOf<false>()
        }
      })
    })

    describe('QueryObserverSuccessResult', () => {
      it('should be extractable from the result union by its isSuccess literal', () => {
        type Success = Extract<
          QueryObserverResult<{ value: string }>,
          { status: 'success'; isPlaceholderData: false }
        >

        expectTypeOf<Success['isSuccess']>().toEqualTypeOf<true>()
      })

      it('should pin every flag along with its data and error types', () => {
        const observer = new QueryObserver(queryClient, {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve({ value: 'data' }),
        })

        const result = observer.getCurrentResult()

        if (result.isSuccess) {
          expectTypeOf(result.data).toEqualTypeOf<{ value: string }>()
          expectTypeOf(result.error).toEqualTypeOf<null>()
          expectTypeOf(result.isError).toEqualTypeOf<false>()
          expectTypeOf(result.isPending).toEqualTypeOf<false>()
          expectTypeOf(result.isLoading).toEqualTypeOf<false>()
          expectTypeOf(result.isLoadingError).toEqualTypeOf<false>()
          expectTypeOf(result.isRefetchError).toEqualTypeOf<false>()
          expectTypeOf(result.isSuccess).toEqualTypeOf<true>()
          expectTypeOf(result.status).toEqualTypeOf<'success'>()
          expectTypeOf(result.isPlaceholderData).toEqualTypeOf<boolean>()
        }
      })
    })

    describe('QueryObserverPlaceholderResult', () => {
      it('should be extractable from the result union by its isPlaceholderData literal', () => {
        type Placeholder = Extract<
          QueryObserverResult<{ value: string }>,
          { isPlaceholderData: true }
        >

        expectTypeOf<Placeholder['isPlaceholderData']>().toEqualTypeOf<true>()
      })

      it('should pin every flag along with its data and error types', () => {
        const observer = new QueryObserver(queryClient, {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve({ value: 'data' }),
        })

        const result = observer.getCurrentResult()

        if (result.isPlaceholderData) {
          expectTypeOf(result.data).toEqualTypeOf<{ value: string }>()
          expectTypeOf(result.error).toEqualTypeOf<null>()
          expectTypeOf(result.isError).toEqualTypeOf<false>()
          expectTypeOf(result.isPending).toEqualTypeOf<false>()
          expectTypeOf(result.isLoading).toEqualTypeOf<false>()
          expectTypeOf(result.isLoadingError).toEqualTypeOf<false>()
          expectTypeOf(result.isRefetchError).toEqualTypeOf<false>()
          expectTypeOf(result.isSuccess).toEqualTypeOf<true>()
          expectTypeOf(result.status).toEqualTypeOf<'success'>()
          expectTypeOf(result.isPlaceholderData).toEqualTypeOf<true>()
        }
      })
    })
  })

  describe('setOptions', () => {
    it('should keep the observed data type in the options it is given', () => {
      const observer = new QueryObserver(queryClient, {
        queryKey: queryKey(),
        queryFn: () => Promise.resolve({ value: 'data' }),
      })

      observer.setOptions({
        queryKey: queryKey(),
        queryFn: () => Promise.resolve({ value: 'data' }),
        select: (data) => {
          expectTypeOf(data).toEqualTypeOf<{ value: string }>()
          return data
        },
      })

      observer.setOptions({
        queryKey: queryKey(),
        // @ts-expect-error the queryFn must return the observed data type
        queryFn: () => 42,
      })
    })
  })

  describe('getOptimisticResult', () => {
    it('should be typed from the options it is given', () => {
      const observer = new QueryObserver(queryClient, {
        queryKey: queryKey(),
        queryFn: () => Promise.resolve({ value: 'data' }),
      })

      const options = queryClient.defaultQueryOptions({
        queryKey: queryKey(),
        queryFn: () => Promise.resolve({ value: 'data' }),
      })

      expectTypeOf(observer.getOptimisticResult(options)).toEqualTypeOf<
        QueryObserverResult<{ value: string }, DefaultError>
      >()

      const withCustomError = new QueryObserver<{ value: string }, CustomError>(
        queryClient,
        {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve({ value: 'data' }),
        },
      )

      const customErrorOptions = queryClient.defaultQueryOptions<
        { value: string },
        CustomError
      >({
        queryKey: queryKey(),
        queryFn: () => Promise.resolve({ value: 'data' }),
      })

      expectTypeOf(
        withCustomError.getOptimisticResult(customErrorOptions),
      ).toEqualTypeOf<QueryObserverResult<{ value: string }, CustomError>>()
    })
  })

  describe('getCurrentResult', () => {
    it('should be typed from the observed types', () => {
      const observer = new QueryObserver(queryClient, {
        queryKey: queryKey(),
        queryFn: () => Promise.resolve({ value: 'data' }),
      })

      expectTypeOf(observer.getCurrentResult()).toEqualTypeOf<
        QueryObserverResult<{ value: string }, DefaultError>
      >()

      const withCustomError = new QueryObserver<{ value: string }, CustomError>(
        queryClient,
        {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve({ value: 'data' }),
        },
      )

      expectTypeOf(withCustomError.getCurrentResult()).toEqualTypeOf<
        QueryObserverResult<{ value: string }, CustomError>
      >()
    })
  })

  describe('trackResult', () => {
    it('should return the same result type it is given', () => {
      const observer = new QueryObserver(queryClient, {
        queryKey: queryKey(),
        queryFn: () => Promise.resolve({ value: 'data' }),
      })

      expectTypeOf(
        observer.trackResult(observer.getCurrentResult()),
      ).toEqualTypeOf<QueryObserverResult<{ value: string }, DefaultError>>()

      const withCustomError = new QueryObserver<{ value: string }, CustomError>(
        queryClient,
        {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve({ value: 'data' }),
        },
      )

      expectTypeOf(
        withCustomError.trackResult(withCustomError.getCurrentResult()),
      ).toEqualTypeOf<QueryObserverResult<{ value: string }, CustomError>>()
    })

    it('should type the tracked property in the onPropTracked callback', () => {
      const observer = new QueryObserver(queryClient, {
        queryKey: queryKey(),
        queryFn: () => Promise.resolve({ value: 'data' }),
      })

      observer.trackResult(observer.getCurrentResult(), (key) => {
        expectTypeOf(key).toEqualTypeOf<keyof QueryObserverResult>()
      })
    })
  })

  describe('trackProp', () => {
    it('should only accept a key of the result', () => {
      const observer = new QueryObserver(queryClient, {
        queryKey: queryKey(),
        queryFn: () => Promise.resolve({ value: 'data' }),
      })

      expectTypeOf(observer.trackProp).parameters.toEqualTypeOf<
        [key: keyof QueryObserverResult]
      >()
    })
  })

  describe('getCurrentQuery', () => {
    it('should carry the observed types into the query state', () => {
      const observer = new QueryObserver(queryClient, {
        queryKey: queryKey(),
        queryFn: () => Promise.resolve({ value: 'data' }),
      })

      expectTypeOf(observer.getCurrentQuery().state.data).toEqualTypeOf<
        { value: string } | undefined
      >()
      expectTypeOf(
        observer.getCurrentQuery().state.error,
      ).toEqualTypeOf<DefaultError | null>()

      const withCustomError = new QueryObserver<{ value: string }, CustomError>(
        queryClient,
        {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve({ value: 'data' }),
        },
      )

      expectTypeOf(
        withCustomError.getCurrentQuery().state.error,
      ).toEqualTypeOf<CustomError | null>()
    })

    it('should keep the data type from before select', () => {
      const observer = new QueryObserver(queryClient, {
        queryKey: queryKey(),
        queryFn: () => Promise.resolve({ count: 1 }),
        select: (data) => data.count,
      })

      expectTypeOf(observer.getCurrentQuery().state.data).toEqualTypeOf<
        { count: number } | undefined
      >()
    })

    it('should preserve a literal queryKey', () => {
      const key = ['a', 1] as const

      const observer = new QueryObserver(queryClient, {
        queryKey: key,
        queryFn: () => Promise.resolve('data'),
      })

      expectTypeOf(observer.getCurrentQuery().queryKey).toEqualTypeOf<
        readonly ['a', 1]
      >()
    })
  })

  describe('refetch', () => {
    it('should resolve with the observed result type', () => {
      const observer = new QueryObserver(queryClient, {
        queryKey: queryKey(),
        queryFn: () => Promise.resolve({ value: 'data' }),
      })

      expectTypeOf(observer.refetch()).toEqualTypeOf<
        Promise<QueryObserverResult<{ value: string }, DefaultError>>
      >()

      const withCustomError = new QueryObserver<{ value: string }, CustomError>(
        queryClient,
        {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve({ value: 'data' }),
        },
      )

      expectTypeOf(withCustomError.refetch()).toEqualTypeOf<
        Promise<QueryObserverResult<{ value: string }, CustomError>>
      >()
    })

    it('should only accept RefetchOptions', () => {
      const observer = new QueryObserver(queryClient, {
        queryKey: queryKey(),
        queryFn: () => Promise.resolve({ value: 'data' }),
      })

      expectTypeOf(observer.refetch).parameters.toEqualTypeOf<
        [options?: RefetchOptions]
      >()
    })
  })

  describe('fetchOptimistic', () => {
    it('should keep the observed types in its options and result', () => {
      const observer = new QueryObserver(queryClient, {
        queryKey: queryKey(),
        queryFn: () => Promise.resolve({ value: 'data' }),
      })

      expectTypeOf(observer.fetchOptimistic).returns.toEqualTypeOf<
        Promise<QueryObserverResult<{ value: string }, DefaultError>>
      >()

      observer.fetchOptimistic({
        queryKey: queryKey(),
        // @ts-expect-error the queryFn must return the observed data type
        queryFn: () => 42,
      })

      const withCustomError = new QueryObserver<{ value: string }, CustomError>(
        queryClient,
        {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve({ value: 'data' }),
        },
      )

      expectTypeOf(withCustomError.fetchOptimistic).returns.toEqualTypeOf<
        Promise<QueryObserverResult<{ value: string }, CustomError>>
      >()
    })
  })

  describe('destroy', () => {
    it('should return void', () => {
      const observer = new QueryObserver(queryClient, {
        queryKey: queryKey(),
        queryFn: () => Promise.resolve({ value: 'data' }),
      })

      expectTypeOf(observer.destroy).returns.toEqualTypeOf<void>()
    })
  })

  describe('updateResult', () => {
    it('should return void', () => {
      const observer = new QueryObserver(queryClient, {
        queryKey: queryKey(),
        queryFn: () => Promise.resolve({ value: 'data' }),
      })

      expectTypeOf(observer.updateResult).returns.toEqualTypeOf<void>()
    })
  })

  describe('onQueryUpdate', () => {
    it('should return void', () => {
      const observer = new QueryObserver(queryClient, {
        queryKey: queryKey(),
        queryFn: () => Promise.resolve({ value: 'data' }),
      })

      expectTypeOf(observer.onQueryUpdate).returns.toEqualTypeOf<void>()
    })
  })

  describe('shouldFetchOnReconnect', () => {
    it('should return a boolean', () => {
      const observer = new QueryObserver(queryClient, {
        queryKey: queryKey(),
        queryFn: () => Promise.resolve({ value: 'data' }),
      })

      expectTypeOf(
        observer.shouldFetchOnReconnect,
      ).returns.toEqualTypeOf<boolean>()
    })
  })

  describe('shouldFetchOnWindowFocus', () => {
    it('should return a boolean', () => {
      const observer = new QueryObserver(queryClient, {
        queryKey: queryKey(),
        queryFn: () => Promise.resolve({ value: 'data' }),
      })

      expectTypeOf(
        observer.shouldFetchOnWindowFocus,
      ).returns.toEqualTypeOf<boolean>()
    })
  })
})
