import { describe, expectTypeOf, it } from 'vitest'
import { QueryClient, dataTagSymbol } from '@tanstack/query-core'
import { queryKey } from '@tanstack/query-test-utils'
import { useInfiniteQuery } from '../useInfiniteQuery'
import { infiniteQueryOptions } from '../infiniteQueryOptions'
import type { InfiniteData } from '@tanstack/query-core'
import type {
  DefinedInitialDataInfiniteOptions,
  UndefinedInitialDataInfiniteOptions,
} from '../infiniteQueryOptions'

describe('infiniteQueryOptions', () => {
  it('should work when passed to infiniteQuery', async () => {
    const options = infiniteQueryOptions({
      getNextPageParam: () => 10,
      queryKey: ['key'],
      queryFn: () => ({ wow: true }),
      initialPageParam: 0,
    })

    const data = await new QueryClient().infiniteQuery(options)

    expectTypeOf(data).toEqualTypeOf<InfiniteData<{ wow: boolean }, number>>()
  })

  it('should work when passed to infiniteQuery with select', async () => {
    const options = infiniteQueryOptions({
      getNextPageParam: () => 10,
      queryKey: ['key'],
      queryFn: () => ({ wow: true }),
      initialPageParam: 0,
      select: (data) => data.pages,
    })

    const data = await new QueryClient().infiniteQuery(options)

    expectTypeOf(data).toEqualTypeOf<Array<{ wow: boolean }>>()
  })

  it('should infer defined types', () => {
    const options = infiniteQueryOptions({
      getNextPageParam: () => 10,
      queryKey: queryKey(),
      queryFn: () => ({ wow: true }),
      initialData: {
        pageParams: [undefined],
        pages: [{ wow: true }],
      },
      initialPageParam: 0,
    })

    expectTypeOf(useInfiniteQuery(() => options).data).toEqualTypeOf<
      InfiniteData<{ wow: boolean }, unknown>
    >()

    expectTypeOf(options).toExtend<
      ReturnType<
        DefinedInitialDataInfiniteOptions<
          { wow: boolean },
          Error,
          InfiniteData<{ wow: boolean }, unknown>,
          Array<string>,
          number | undefined
        >
      >
    >()

    expectTypeOf(options.queryKey[dataTagSymbol]).toEqualTypeOf<
      InfiniteData<{ wow: boolean }>
    >()
  })

  it('should work without defined types', () => {
    const options = infiniteQueryOptions({
      getNextPageParam: () => undefined,
      queryKey: queryKey(),
      queryFn: () => ({ wow: true }),
      initialPageParam: 0,
    })

    expectTypeOf(() => useInfiniteQuery(() => options).data).toEqualTypeOf<
      () => InfiniteData<{ wow: boolean }, unknown> | undefined
    >()

    expectTypeOf(options).toExtend<
      ReturnType<
        UndefinedInitialDataInfiniteOptions<
          { wow: boolean },
          Error,
          InfiniteData<{ wow: boolean }, unknown>,
          Array<string>,
          number
        >
      >
    >()

    expectTypeOf(options.queryKey[dataTagSymbol]).toEqualTypeOf<
      InfiniteData<{
        wow: boolean
      }>
    >()
  })
})
