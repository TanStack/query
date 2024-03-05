import { describe, expectTypeOf, it } from 'vitest'
import { useSuspenseQuery } from '../useSuspenseQuery'
import { useSuspenseInfiniteQuery } from '../useSuspenseInfiniteQuery'
import type { UseSuspenseQueryOptions } from '..'
import type { InfiniteData } from '@tanstack/query-core'

describe('useSuspenseQuery', () => {
  it('should always have data defined', () => {
    const { data } = useSuspenseQuery({
      queryKey: ['key'],
      queryFn: () => Promise.resolve(5),
    })

    expectTypeOf(data).toEqualTypeOf<number>()
  })

  it('should not have pending status', () => {
    const { status } = useSuspenseQuery({
      queryKey: ['key'],
      queryFn: () => Promise.resolve(5),
    })

    expectTypeOf(status).toEqualTypeOf<'error' | 'success'>()
  })

  it('should not allow placeholderData, enabled or throwOnError props', () => {
    useSuspenseQuery({
      queryKey: ['key'],
      queryFn: () => Promise.resolve(5),
      // @ts-expect-error TS2345
      placeholderData: 5,
      enabled: true,
    })

    useSuspenseQuery({
      queryKey: ['key'],
      queryFn: () => Promise.resolve(5),
      // @ts-expect-error TS2345
      enabled: true,
    })

    useSuspenseQuery({
      queryKey: ['key'],
      queryFn: () => Promise.resolve(5),
      // @ts-expect-error TS2345
      throwOnError: true,
    })
  })

  it('should not return isPlaceholderData', () => {
    const query = useSuspenseQuery({
      queryKey: ['key'],
      queryFn: () => Promise.resolve(5),
    })

    // @ts-expect-error TS2339
    query.isPlaceholderData
  })
})

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

  it('should not accept skipToken type for queryFn in useSuspenseQuery', () => {
    const query: UseSuspenseQueryOptions = {
      // @ts-expect-error
      queryFn: skipToken,
      queryKey: [1],
    }

    return query
  })
})
