import { assertType, describe, expectTypeOf, it } from 'vitest'
import { QueryClient } from '@tanstack/query-core'
import { queryKey } from '@tanstack/query-test-utils'
import { createInfiniteQuery, infiniteQueryOptions } from '../src/index.js'
import type { InfiniteData } from '@tanstack/query-core'

describe('infiniteQueryOptions', () => {
  it('should not allow excess properties', () => {
    const key = queryKey()
    assertType(
      infiniteQueryOptions({
        queryKey: key,
        queryFn: () => Promise.resolve('data'),
        getNextPageParam: () => 1,
        initialPageParam: 1,
        // @ts-expect-error this is a good error, because stallTime does not exist!
        stallTime: 1000,
      }),
    )
  })

  it('should infer types for callbacks', () => {
    const key = queryKey()
    infiniteQueryOptions({
      queryKey: key,
      queryFn: () => Promise.resolve('data'),
      staleTime: 1000,
      getNextPageParam: () => 1,
      initialPageParam: 1,
      select: (data) => {
        expectTypeOf(data).toEqualTypeOf<InfiniteData<string, number>>()
      },
    })
  })

  it('should work when passed to createInfiniteQuery', () => {
    const key = queryKey()
    const options = infiniteQueryOptions({
      queryKey: key,
      queryFn: () => Promise.resolve('string'),
      getNextPageParam: () => 1,
      initialPageParam: 1,
    })

    const query = createInfiniteQuery(() => options)

    // known issue: type of pageParams is unknown when returned from useInfiniteQuery
    expectTypeOf(query.data).toEqualTypeOf<
      InfiniteData<string, unknown> | undefined
    >()
  })

  it('should work when passed to fetchInfiniteQuery', async () => {
    const key = queryKey()
    const options = infiniteQueryOptions({
      queryKey: key,
      queryFn: () => Promise.resolve('string'),
      getNextPageParam: () => 1,
      initialPageParam: 1,
    })

    const data = await new QueryClient().fetchInfiniteQuery(options)

    expectTypeOf(data).toEqualTypeOf<InfiniteData<string, number>>()
  })
})
