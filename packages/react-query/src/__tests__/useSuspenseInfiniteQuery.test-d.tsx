import { describe, expectTypeOf, it } from 'vitest'
import { skipToken } from '@tanstack/query-core'
import { useSuspenseInfiniteQuery } from '../useSuspenseInfiniteQuery'
import type { InfiniteData } from '@tanstack/query-core'

describe('useSuspenseInfiniteQuery', () => {
  it('should always have data defined', () => {
    const { data } = useSuspenseInfiniteQuery({
      queryKey: ['key'],
      queryFn: () => Promise.resolve(5),
      initialPageParam: 1,
      getNextPageParam: () => 1,
    })

    expectTypeOf(data).toEqualTypeOf<InfiniteData<number, unknown>>()
  })

  it('should not allow skipToken in queryFn', () => {
    useSuspenseInfiniteQuery({
      queryKey: ['key'],
      // @ts-expect-error
      queryFn: skipToken,
    })

    useSuspenseInfiniteQuery({
      queryKey: ['key'],
      // @ts-expect-error
      queryFn: Math.random() > 0.5 ? skipToken : () => Promise.resolve(5),
    })
  })

  it('should not have pending status', () => {
    const { status } = useSuspenseInfiniteQuery({
      queryKey: ['key'],
      queryFn: () => Promise.resolve(5),
      initialPageParam: 1,
      getNextPageParam: () => 1,
    })

    expectTypeOf(status).toEqualTypeOf<'error' | 'success'>()
  })

  it('should not allow placeholderData, enabled or throwOnError props', () => {
    useSuspenseInfiniteQuery({
      queryKey: ['key'],
      queryFn: () => Promise.resolve(5),
      initialPageParam: 1,
      getNextPageParam: () => 1,
      // @ts-expect-error TS2345
      placeholderData: 5,
      enabled: true,
    })

    useSuspenseInfiniteQuery({
      queryKey: ['key'],
      queryFn: () => Promise.resolve(5),
      initialPageParam: 1,
      getNextPageParam: () => 1,
      // @ts-expect-error TS2345
      enabled: true,
    })

    useSuspenseInfiniteQuery({
      queryKey: ['key'],
      queryFn: () => Promise.resolve(5),
      initialPageParam: 1,
      getNextPageParam: () => 1,
      // @ts-expect-error TS2345
      throwOnError: true,
    })
  })

  it('should not return isPlaceholderData', () => {
    const query = useSuspenseInfiniteQuery({
      queryKey: ['key'],
      queryFn: () => Promise.resolve(5),
      initialPageParam: 1,
      getNextPageParam: () => 1,
    })

    // @ts-expect-error TS2339
    query.isPlaceholderData
  })
})
