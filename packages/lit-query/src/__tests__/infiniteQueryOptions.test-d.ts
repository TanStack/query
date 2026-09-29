import {
  QueryClient,
  dataTagErrorSymbol,
  dataTagSymbol,
} from '@tanstack/query-core'
import { queryKey } from '@tanstack/query-test-utils'
import { LitElement } from 'lit'
import { describe, expectTypeOf, it } from 'vitest'
import { createInfiniteQueryController } from '../createInfiniteQueryController.js'
import { infiniteQueryOptions } from '../infiniteQueryOptions.js'
import type { InfiniteData } from '@tanstack/query-core'

class Host extends LitElement {}

describe('infiniteQueryOptions', () => {
  it('should work when passed to createInfiniteQueryController', () => {
    const infinite = createInfiniteQueryController(
      new Host(),
      infiniteQueryOptions({
        queryKey: queryKey(),
        initialPageParam: 0,
        queryFn: () => Promise.resolve({ page: 1 }),
        getNextPageParam: (lastPage) => lastPage.page + 1,
      }),
      new QueryClient(),
    )

    expectTypeOf(infinite().data?.pages).toEqualTypeOf<
      Array<{ page: number }> | undefined
    >()
  })

  it('should work when passed to infiniteQuery', async () => {
    const options = infiniteQueryOptions({
      queryKey: queryKey(),
      queryFn: () => Promise.resolve('data'),
      getNextPageParam: () => 1,
      initialPageParam: 1,
    })

    const data = await new QueryClient().infiniteQuery(options)
    expectTypeOf(data).toEqualTypeOf<InfiniteData<string, number>>()
  })

  it('should work when passed to infiniteQuery with select', async () => {
    const options = infiniteQueryOptions({
      queryKey: queryKey(),
      queryFn: () => Promise.resolve('data'),
      getNextPageParam: () => 1,
      initialPageParam: 1,
      select: (data) => data.pages,
    })

    const data = await new QueryClient().infiniteQuery(options)
    expectTypeOf(data).toEqualTypeOf<Array<string>>()
  })

  it('should work when passed to infiniteQuery with enabled: false', async () => {
    const options = infiniteQueryOptions({
      queryKey: queryKey(),
      queryFn: () => Promise.resolve('data'),
      getNextPageParam: () => 1,
      initialPageParam: 1,
      enabled: false,
    })

    const data = await new QueryClient().infiniteQuery(options)
    expectTypeOf(data).toEqualTypeOf<InfiniteData<string, number>>()
  })

  it('should tag the queryKey with the result type of the QueryFn', () => {
    const { queryKey: tagged } = infiniteQueryOptions({
      queryKey: queryKey(),
      initialPageParam: 0,
      queryFn: () => Promise.resolve({ page: 3 }),
      getNextPageParam: (lastPage) => lastPage.page + 1,
    })

    expectTypeOf(tagged[dataTagSymbol]).toEqualTypeOf<
      InfiniteData<{ page: number }>
    >()
    expectTypeOf(tagged[dataTagErrorSymbol]).toEqualTypeOf<Error>()
  })

  it('should return the proper type when passed to getQueryData', () => {
    const { queryKey: tagged } = infiniteQueryOptions({
      queryKey: queryKey(),
      initialPageParam: 0,
      queryFn: () => Promise.resolve({ page: 3 }),
      getNextPageParam: (lastPage) => lastPage.page + 1,
    })

    const data = new QueryClient().getQueryData(tagged)
    expectTypeOf(data).toEqualTypeOf<
      InfiniteData<{ page: number }> | undefined
    >()
  })

  it('should properly type when passed to setQueryData', () => {
    const { queryKey: tagged } = infiniteQueryOptions({
      queryKey: queryKey(),
      initialPageParam: 0,
      queryFn: () => Promise.resolve({ page: 3 }),
      getNextPageParam: (lastPage) => lastPage.page + 1,
    })

    const queryClient = new QueryClient()
    const updatedPages = queryClient.setQueryData(tagged, {
      pages: [{ page: 4 }],
      pageParams: [0],
    })
    expectTypeOf(updatedPages).toEqualTypeOf<
      InfiniteData<{ page: number }> | undefined
    >()

    const updatedPagesViaCallback = queryClient.setQueryData(
      tagged,
      (previous) => {
        expectTypeOf(previous).toEqualTypeOf<
          InfiniteData<{ page: number }> | undefined
        >()
        return previous
      },
    )
    expectTypeOf(updatedPagesViaCallback).toEqualTypeOf<
      InfiniteData<{ page: number }> | undefined
    >()
  })
})
