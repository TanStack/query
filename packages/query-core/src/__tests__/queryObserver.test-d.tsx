import { afterEach, beforeEach, describe, expectTypeOf, it } from 'vitest'
import { queryKey } from '@tanstack/query-test-utils'
import { QueryClient, QueryObserver } from '..'
import type { DefaultError } from '..'

describe('queryObserver', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient()
    queryClient.mount()
  })

  afterEach(() => {
    queryClient.clear()
  })

  it('should be inferred as a correct result type', () => {
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

  describe('placeholderData', () => {
    it('previousQuery should have typed queryKey', () => {
      const testQueryKey = ['SomeQuery', 42, { foo: 'bar' }] as const

      new QueryObserver(new QueryClient(), {
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

    it('previousQuery should have typed error', () => {
      class CustomError extends Error {
        name = 'CustomError' as const
      }

      new QueryObserver<boolean, CustomError>(new QueryClient(), {
        queryKey: ['key'],
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

    it('previousData should have the same type as query data', () => {
      const queryData = { foo: 'bar' } as const

      new QueryObserver(new QueryClient(), {
        queryKey: ['key'],
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
})
