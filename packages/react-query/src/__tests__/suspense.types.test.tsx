import { describe, it } from 'vitest'
import { useSuspenseQuery } from '../useSuspenseQuery'
import { useSuspenseInfiniteQuery } from '../useSuspenseInfiniteQuery'
import { doNotExecute } from './utils'
import type { InfiniteData } from '@tanstack/query-core'
import type { Equal, Expect } from './utils'

describe('useSuspenseQuery', () => {
  it('should always have data defined', () => {
    doNotExecute(() => {
      const { data } = useSuspenseQuery({
        queryKey: ['key'],
        queryFn: () => Promise.resolve(5),
      })

      const result: Expect<Equal<typeof data, number>> = true
      return result
    })
  })

  it('should not have pending status', () => {
    doNotExecute(() => {
      const { status } = useSuspenseQuery({
        queryKey: ['key'],
        queryFn: () => Promise.resolve(5),
      })

      const result: Expect<Equal<typeof status, 'error' | 'success'>> = true
      return result
    })
  })

  it('should not allow placeholderData, enabled or throwOnError props', () => {
    doNotExecute(() => {
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
  })

  it('should not return isPlaceholderData', () => {
    doNotExecute(() => {
      const query = useSuspenseQuery({
        queryKey: ['key'],
        queryFn: () => Promise.resolve(5),
      })

      // @ts-expect-error TS2339
      void query.isPlaceholderData
    })
  })
})

describe('useSuspenseInfiniteQuery', () => {
  it('should always have data defined', () => {
    doNotExecute(() => {
      const { data } = useSuspenseInfiniteQuery({
        queryKey: ['key'],
        queryFn: () => Promise.resolve(5),
        initialPageParam: 1,
        getNextPageParam: () => 1,
      })

      const result: Expect<Equal<typeof data, InfiniteData<number, unknown>>> =
        true
      return result
    })
  })

  it('should not have pending status', () => {
    doNotExecute(() => {
      const { status } = useSuspenseInfiniteQuery({
        queryKey: ['key'],
        queryFn: () => Promise.resolve(5),
        initialPageParam: 1,
        getNextPageParam: () => 1,
      })

      const result: Expect<Equal<typeof status, 'error' | 'success'>> = true
      return result
    })
  })

  it('should not allow placeholderData, enabled or throwOnError props', () => {
    doNotExecute(() => {
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
  })

  it('should not return isPlaceholderData', () => {
    doNotExecute(() => {
      const query = useSuspenseInfiniteQuery({
        queryKey: ['key'],
        queryFn: () => Promise.resolve(5),
        initialPageParam: 1,
        getNextPageParam: () => 1,
      })

      // @ts-expect-error TS2339
      void query.isPlaceholderData
    })
  })
})
