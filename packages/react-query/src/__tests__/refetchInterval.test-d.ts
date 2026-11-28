import { describe, expectTypeOf, it } from 'vitest'
import {
  infiniteQueryOptions,
  queryOptions,
  refetchInterval,
  select,
  suspenseInfiniteQueryOptions,
  suspenseQueryOptions,
  useQuery,
} from '..'
import type { InfiniteData } from '..'

describe('refetchInterval types', () => {
  it('infers cached data in polling callbacks for regular and suspense hooks', () => {
    const options = { queryKey: ['book'], queryFn: () => 'Dune' }
    useQuery(
      queryOptions({
        ...options,
        select: select((book) => book.length),
        refetchInterval: (query) => {
          expectTypeOf(query.state.data).toEqualTypeOf<string | undefined>()
          return refetchInterval(query.state.data ? false : 3000)
        },
      }),
    )
    useQuery(
      suspenseQueryOptions({
        ...options,
        refetchInterval: (query) => {
          expectTypeOf(query.state.data).toEqualTypeOf<string | undefined>()
          return undefined
        },
      }),
    )
  })

  it('infers cached pages in both infinite query hooks', () => {
    const options = {
      queryKey: ['list'],
      initialPageParam: 1,
      queryFn: () => 'Dune',
      getNextPageParam: () => 2,
    }
    useQuery(
      infiniteQueryOptions({
        ...options,
        refetchInterval: (query) => {
          expectTypeOf(query.state.data).toEqualTypeOf<
            InfiniteData<string, number> | undefined
          >()
          return refetchInterval(3000)
        },
      }),
    )
    useQuery(
      suspenseInfiniteQueryOptions({
        ...options,
        refetchInterval: (query) => {
          expectTypeOf(query.state.data).toEqualTypeOf<
            InfiniteData<string, number> | undefined
          >()
          return refetchInterval(3000)
        },
      }),
    )
  })
})
