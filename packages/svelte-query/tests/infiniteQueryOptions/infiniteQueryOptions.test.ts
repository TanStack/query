import { describe, expectTypeOf, test } from 'vitest'
import { type InfiniteData } from '@tanstack/query-core'
import { infiniteQueryOptions } from '../../src/infiniteQueryOptions'

describe('queryOptions', () => {
  test('Should not allow excess properties', () => {
    infiniteQueryOptions({
      queryKey: ['key'],
      queryFn: () => Promise.resolve('data'),
      getNextPageParam: () => 1,
      initialPageParam: 1,
      // @ts-expect-error this is a good error, because stallTime does not exist!
      stallTime: 1000,
    })
  })
  test('Should infer types for callbacks', () => {
    infiniteQueryOptions({
      queryKey: ['key'],
      queryFn: () => Promise.resolve('data'),
      staleTime: 1000,
      getNextPageParam: () => 1,
      initialPageParam: 1,
      select: (data) => {
        expectTypeOf(data).toEqualTypeOf<InfiniteData<string, number>>()
      },
    })
  })
})
