import { describe, expectTypeOf, it } from 'vitest'
import { dataTagSymbol } from '@tanstack/query-core'
import { useInfiniteQuery } from '../useInfiniteQuery'
import { infiniteQueryOptions } from '../infiniteQueryOptions'
import type { InfiniteData } from '@tanstack/query-core'
import type {
  DefinedInitialDataInfiniteOptions,
  UndefinedInitialDataInfiniteOptions,
} from '../infiniteQueryOptions'

describe('infiniteQueryOptions', () => {
  it('should infer defined types', () => {
    const options = infiniteQueryOptions({
      getNextPageParam: () => 10,
      queryKey: ['key'],
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

    expectTypeOf(options).toMatchTypeOf<
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
      queryKey: ['key'],
      queryFn: () => ({ wow: true }),
      initialPageParam: 0,
    })

    expectTypeOf(() => useInfiniteQuery(() => options).data).toEqualTypeOf<
      () => InfiniteData<{ wow: boolean }, unknown> | undefined
    >()

    expectTypeOf(options).toMatchTypeOf<
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
