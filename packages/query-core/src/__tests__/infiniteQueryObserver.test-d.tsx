import { afterEach, beforeEach, describe, expectTypeOf, it, vi } from 'vitest'
import { queryKey } from '@tanstack/query-test-utils'
import { InfiniteQueryObserver, QueryClient } from '..'
import type { InfiniteData } from '..'

describe('InfiniteQueryObserver', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient()
    queryClient.mount()
  })

  afterEach(() => {
    queryClient.clear()
  })

  it('should be inferred as a correct result type', () => {
    const next: number | undefined = 2
    const queryFn = vi.fn(({ pageParam }) => String(pageParam))
    const observer = new InfiniteQueryObserver(queryClient, {
      queryKey: queryKey(),
      queryFn,
      initialPageParam: 1,
      getNextPageParam: () => next,
    })

    const result = observer.getCurrentResult()

    if (result.isPending) {
      expectTypeOf(result.data).toEqualTypeOf<undefined>()
      expectTypeOf(result.error).toEqualTypeOf<null>()
      expectTypeOf(result.isLoading).toEqualTypeOf<boolean>()
      expectTypeOf(result.status).toEqualTypeOf<'pending'>()
      expectTypeOf(result.isPlaceholderData).toEqualTypeOf<false>()
    }

    if (result.isLoading) {
      expectTypeOf(result.data).toEqualTypeOf<undefined>()
      expectTypeOf(result.error).toEqualTypeOf<null>()
      expectTypeOf(result.isPending).toEqualTypeOf<true>()
      expectTypeOf(result.status).toEqualTypeOf<'pending'>()
      expectTypeOf(result.isPlaceholderData).toEqualTypeOf<false>()
    }

    if (result.isLoadingError) {
      expectTypeOf(result.data).toEqualTypeOf<undefined>()
      expectTypeOf(result.error).toEqualTypeOf<Error>()
      expectTypeOf(result.status).toEqualTypeOf<'error'>()
      expectTypeOf(result.isPlaceholderData).toEqualTypeOf<false>()
    }

    if (result.isRefetchError) {
      expectTypeOf(result.data).toEqualTypeOf<InfiniteData<string, unknown>>()
      expectTypeOf(result.error).toEqualTypeOf<Error>()
      expectTypeOf(result.status).toEqualTypeOf<'error'>()
      expectTypeOf(result.isFetchNextPageError).toEqualTypeOf<boolean>()
      expectTypeOf(result.isFetchPreviousPageError).toEqualTypeOf<boolean>()
      expectTypeOf(result.isPlaceholderData).toEqualTypeOf<false>()
    }

    if (result.isSuccess) {
      expectTypeOf(result.data).toEqualTypeOf<InfiniteData<string, unknown>>()
      expectTypeOf(result.error).toEqualTypeOf<null>()
      expectTypeOf(result.status).toEqualTypeOf<'success'>()
      expectTypeOf(result.isPlaceholderData).toEqualTypeOf<boolean>()
    }

    if (result.isPlaceholderData) {
      expectTypeOf(result.data).toEqualTypeOf<InfiniteData<string, unknown>>()
      expectTypeOf(result.error).toEqualTypeOf<null>()
      expectTypeOf(result.status).toEqualTypeOf<'success'>()
    }
  })

  it('should not allow pageParam on fetchNextPage / fetchPreviousPage if getNextPageParam is defined', async () => {
    const observer = new InfiniteQueryObserver(queryClient, {
      queryKey: queryKey(),
      queryFn: ({ pageParam }) => String(pageParam),
      initialPageParam: 1,
      getNextPageParam: (page) => Number(page) + 1,
    })

    observer.fetchNextPage()
    observer.fetchPreviousPage({ cancelRefetch: false })

    // @ts-expect-error pageParam is not allowed in declarative mode
    observer.fetchNextPage({ pageParam: 2 })

    // @ts-expect-error pageParam is not allowed in declarative mode
    observer.fetchPreviousPage({ pageParam: 0 })
  })

  it('should require pageParam on fetchNextPage / fetchPreviousPage if getNextPageParam is missing', async () => {
    const observer = new InfiniteQueryObserver<
      string,
      Error,
      InfiniteData<string>,
      ReturnType<typeof queryKey>,
      number,
      'manual'
    >(queryClient, {
      queryKey: queryKey(),
      queryFn: ({ pageParam }) => String(pageParam),
      mode: 'manual',
      initialPageParam: 1,
    })

    observer.fetchNextPage({ pageParam: 2 })
    observer.fetchPreviousPage({ pageParam: 0, cancelRefetch: false })

    // @ts-expect-error pageParam is required in manual mode
    observer.fetchNextPage()

    // @ts-expect-error pageParam is required in manual mode
    observer.fetchPreviousPage()
  })

  it('should reject missing mode / getNextPageParam', () => {
    // @ts-expect-error getNextPageParam is required unless mode is manual
    new InfiniteQueryObserver(queryClient, {
      queryKey: queryKey(),
      queryFn: ({ pageParam }) => String(pageParam),
      initialPageParam: 1,
    })
  })

  it('should reject page param getters in manual mode', () => {
    // @ts-expect-error getNextPageParam is not allowed in manual mode
    new InfiniteQueryObserver<
      string,
      Error,
      InfiniteData<string>,
      ReturnType<typeof queryKey>,
      number,
      'manual'
    >(queryClient, {
      queryKey: queryKey(),
      queryFn: ({ pageParam }) => String(pageParam),
      mode: 'manual',
      initialPageParam: 1,
      getNextPageParam: () => 2,
    })

    // @ts-expect-error getPreviousPageParam is not allowed in manual mode
    new InfiniteQueryObserver<
      string,
      Error,
      InfiniteData<string>,
      ReturnType<typeof queryKey>,
      number,
      'manual'
    >(queryClient, {
      queryKey: queryKey(),
      queryFn: ({ pageParam }) => String(pageParam),
      mode: 'manual',
      initialPageParam: 1,
      getPreviousPageParam: () => 0,
    })
  })
})
