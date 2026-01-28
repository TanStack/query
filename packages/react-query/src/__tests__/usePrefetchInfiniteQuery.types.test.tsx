import { expectTypeOf } from 'expect-type'
import { usePrefetchInfiniteQuery } from '../usePrefetchInfiniteQuery'
import { doNotExecute } from './utils'

describe('usePrefetchInfiniteQuery', () => {
  it('should return nothing', () => {
    doNotExecute(() => {
      const result = usePrefetchInfiniteQuery({
        queryKey: ['key'],
        queryFn: () => Promise.resolve(5),
        getNextPageParam: () => 1,
      })

      expectTypeOf(result).toEqualTypeOf<void>()
    })
  })

  it('should not allow refetchInterval, enabled or throwOnError options', () => {
    doNotExecute(() => {
      usePrefetchInfiniteQuery({
        queryKey: ['key'],
        queryFn: () => Promise.resolve(5),
        getNextPageParam: () => 1,
        // @ts-expect-error TS2353
        refetchInterval: 1000,
      })

      usePrefetchInfiniteQuery({
        queryKey: ['key'],
        queryFn: () => Promise.resolve(5),
        getNextPageParam: () => 1,
        // @ts-expect-error TS2353
        enabled: true,
      })

      usePrefetchInfiniteQuery({
        queryKey: ['key'],
        queryFn: () => Promise.resolve(5),
        getNextPageParam: () => 1,
        // @ts-expect-error TS2353
        throwOnError: true,
      })
    })
  })
})
