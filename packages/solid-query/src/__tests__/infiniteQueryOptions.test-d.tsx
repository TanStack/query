import { describe, expectTypeOf, it } from 'vitest'
import { QueryClient, dataTagSymbol, skipToken } from '@tanstack/query-core'
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

  it('should work when passed to infiniteQuery with enabled: false', async () => {
    const options = infiniteQueryOptions({
      getNextPageParam: () => 10,
      queryKey: ['key'],
      queryFn: () => ({ wow: true }),
      initialPageParam: 0,
      enabled: false,
    })

    const data = await new QueryClient().infiniteQuery(options)

    expectTypeOf(data).toEqualTypeOf<InfiniteData<{ wow: boolean }, number>>()
  })

  it('should work when passed to infiniteQuery with skipToken', async () => {
    const options = infiniteQueryOptions({
      getNextPageParam: () => 10,
      queryKey: ['key'],
      queryFn: skipToken,
      initialPageParam: 0,
    })

    const data = await new QueryClient().infiniteQuery(options)

    expectTypeOf(data).toEqualTypeOf<InfiniteData<unknown, number>>()
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

  it('should allow optional initialData object', () => {
    const initialData = { wow: true } as { wow: boolean } | undefined
    const options = infiniteQueryOptions({
      queryKey: queryKey(),
      queryFn: () => initialData,
      initialData: initialData
        ? { pages: [initialData], pageParams: [] }
        : undefined,
      getNextPageParam: () => 1,
      initialPageParam: 1,
    })

    expectTypeOf(options.initialData).toExtend<
      | InfiniteData<{ wow: boolean } | undefined, number>
      | (() => InfiniteData<{ wow: boolean } | undefined, number>)
      | undefined
    >()
  })
})
