import { describe, expectTypeOf, it } from 'vitest'
import {
  refetchInterval,
  select,
  useInfiniteQuery,
  useQuery,
  useSuspenseInfiniteQuery,
  useSuspenseQuery,
} from '..'
import type { InfiniteData } from '..'

describe('refetchInterval types', () => {
  it('infers cached data in polling callbacks for regular and suspense hooks', () => {
    const options = { queryKey: ['book'], queryFn: () => 'Dune' }
    useQuery({
      ...options,
      select: [select, (book) => book.length],
      refetchInterval: (query) => {
        expectTypeOf(query.state.data).toEqualTypeOf<string | undefined>()
        return refetchInterval(query.state.data ? false : 3000)
      },
    })
    useSuspenseQuery({
      ...options,
      refetchInterval: (query) => {
        expectTypeOf(query.state.data).toEqualTypeOf<string | undefined>()
        return undefined
      },
    })
  })

  it('infers cached pages in both infinite query hooks', () => {
    const options = {
      queryKey: ['list'],
      initialPageParam: 1,
      queryFn: () => 'Dune',
      getNextPageParam: () => 2,
    }
    useInfiniteQuery({
      ...options,
      refetchInterval: (query) => {
        expectTypeOf(query.state.data).toEqualTypeOf<
          InfiniteData<string, number> | undefined
        >()
        return refetchInterval(3000)
      },
    })
    useSuspenseInfiniteQuery({
      ...options,
      refetchInterval: (query) => {
        expectTypeOf(query.state.data).toEqualTypeOf<
          InfiniteData<string, number> | undefined
        >()
        return refetchInterval(3000)
      },
    })
  })
})
