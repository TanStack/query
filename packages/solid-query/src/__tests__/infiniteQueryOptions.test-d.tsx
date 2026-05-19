import { describe, expectTypeOf, it } from 'vitest'
import { dataTagSymbol } from '@tanstack/query-core'
import { queryKey } from '@tanstack/query-test-utils'
import { useInfiniteQuery } from '../useInfiniteQuery'
import { infiniteQueryOptions } from '../infiniteQueryOptions'
import type { InfiniteData } from '@tanstack/query-core'
import type {
  DefinedInitialDataInfiniteOptions,
  UndefinedInitialDataInfiniteOptions,
} from '../infiniteQueryOptions'

// Regression test for exported infiniteQueryOptions inference under declaration emit.
// TypeScript should be able to name the return type without expanding the
// internal data tag symbols into the consumer's .d.ts output.
export const exportedInfiniteQueryOptions = infiniteQueryOptions({
  queryKey: ['invalid'],
  getNextPageParam: () => 1,
  initialPageParam: 1,
})

describe('infiniteQueryOptions', () => {
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
