import { assertType, describe, expectTypeOf, it } from 'vitest'
import { dataTagSymbol, skipToken } from '@tanstack/query-core'
import { computed, reactive, ref } from 'vue-demi'
import { queryKey } from '@tanstack/query-test-utils'
import { infiniteQueryOptions } from '../infiniteQueryOptions'
import { QueryClient } from '../queryClient'
import { useInfiniteQuery } from '../useInfiniteQuery'
import type { InfiniteData, QueryKeyWithDataTag } from '@tanstack/query-core'
import type { InfiniteQueryOptions } from '../infiniteQueryOptions'

// Regression test for exported infiniteQueryOptions inference under declaration emit.
// TypeScript should be able to name the return type without expanding the
// internal data tag symbols into the consumer's .d.ts output.
export const exportedInfiniteQueryOptions: InfiniteQueryOptions<
  unknown,
  Error,
  InfiniteData<unknown>,
  Array<string>,
  number
> & {
  initialData?: undefined
} & QueryKeyWithDataTag<Array<string>, InfiniteData<unknown>, Error> =
  infiniteQueryOptions({
    queryKey: ['invalid'],
    getNextPageParam: () => 1,
    initialPageParam: 1,
  })

describe('infiniteQueryOptions', () => {
  it('should not allow excess properties', () => {
    const key = queryKey()
    assertType(
      infiniteQueryOptions({
        queryKey: key,
        queryFn: () => Promise.resolve('data'),
        getNextPageParam: () => 1,
        initialPageParam: 1,
        // @ts-expect-error this is a good error, because stallTime does not exist!
        stallTime: 1000,
      }),
    )
  })
  it('should infer types for callbacks', () => {
    const key = queryKey()
    infiniteQueryOptions({
      queryKey: key,
      queryFn: () => Promise.resolve('data'),
      staleTime: 1000,
      getNextPageParam: () => 1,
      initialPageParam: 1,
      select: (data) => {
        expectTypeOf(data).toEqualTypeOf<InfiniteData<string, number>>()
      },
    })
  })
  it('should work when passed to useInfiniteQuery', () => {
    const key = queryKey()
    const options = infiniteQueryOptions({
      queryKey: key,
      queryFn: () => Promise.resolve('string'),
      getNextPageParam: () => 1,
      initialPageParam: 1,
    })

    const { data } = reactive(useInfiniteQuery(options))

    expectTypeOf(data).toEqualTypeOf<
      InfiniteData<string, unknown> | undefined
    >()
  })
  it('should work when passed to infiniteQuery', async () => {
    const options = infiniteQueryOptions({
      queryKey: ['key'],
      queryFn: () => Promise.resolve('string'),
      getNextPageParam: () => 1,
      initialPageParam: 1,
    })

    const data = await new QueryClient().infiniteQuery({
      ...options,
      staleTime: 0,
      pages: 1,
    })

    expectTypeOf(data).toEqualTypeOf<InfiniteData<string, number>>()
  })
  it('should work when passed to infiniteQuery with select', async () => {
    const options = infiniteQueryOptions({
      queryKey: ['key'],
      queryFn: () => Promise.resolve('string'),
      getNextPageParam: () => 1,
      initialPageParam: 1,
      select: (data) => data.pages,
    })

    const data = await new QueryClient().infiniteQuery({
      ...options,
      staleTime: 0,
      pages: 1,
    })

    expectTypeOf(data).toEqualTypeOf<Array<string>>()
  })
  it('should tag the queryKey with the result type of the QueryFn', () => {
    const key = queryKey()
    const { queryKey: tagged } = infiniteQueryOptions({
      queryKey: key,
      queryFn: () => Promise.resolve('string'),
      getNextPageParam: () => 1,
      initialPageParam: 1,
    })

    expectTypeOf(tagged[dataTagSymbol]).toEqualTypeOf<InfiniteData<string>>()
  })
  it('should tag the queryKey even if no promise is returned', () => {
    const key = queryKey()
    const { queryKey: tagged } = infiniteQueryOptions({
      queryKey: key,
      queryFn: () => 'string',
      getNextPageParam: () => 1,
      initialPageParam: 1,
    })

    expectTypeOf(tagged[dataTagSymbol]).toEqualTypeOf<InfiniteData<string>>()
  })
  it('should tag the queryKey with the result type of the QueryFn if select is used', () => {
    const key = queryKey()
    const { queryKey: tagged } = infiniteQueryOptions({
      queryKey: key,
      queryFn: () => Promise.resolve('string'),
      select: (data) => data.pages,
      getNextPageParam: () => 1,
      initialPageParam: 1,
    })

    expectTypeOf(tagged[dataTagSymbol]).toEqualTypeOf<InfiniteData<string>>()
  })
  it('should return the proper type when passed to getQueryData', () => {
    const key = queryKey()
    const { queryKey: tagged } = infiniteQueryOptions({
      queryKey: key,
      queryFn: () => Promise.resolve('string'),
      getNextPageParam: () => 1,
      initialPageParam: 1,
    })

    const queryClient = new QueryClient()
    const data = queryClient.getQueryData(tagged)

    expectTypeOf(data).toEqualTypeOf<
      InfiniteData<string, unknown> | undefined
    >()
  })
  it('should properly type when passed to setQueryData', () => {
    const key = queryKey()
    const { queryKey: tagged } = infiniteQueryOptions({
      queryKey: key,
      queryFn: () => Promise.resolve('string'),
      getNextPageParam: () => 1,
      initialPageParam: 1,
    })

    const queryClient = new QueryClient()
    const data = queryClient.setQueryData(tagged, (prev) => {
      expectTypeOf(prev).toEqualTypeOf<
        InfiniteData<string, unknown> | undefined
      >()
      return prev
    })

    expectTypeOf(data).toEqualTypeOf<
      InfiniteData<string, unknown> | undefined
    >()
  })

  it('should allow a computed queryFn resolving to skipToken', () => {
    const id = ref<string | null>('1')

    const options = infiniteQueryOptions({
      queryKey: computed(() => ['foo', id.value]),
      queryFn: computed(() =>
        id.value
          ? ({ pageParam }: { pageParam: number }) =>
              Promise.resolve({ id: id.value, pageParam })
          : skipToken,
      ),
      getNextPageParam: () => 1,
      initialPageParam: 1,
    })

    const { data } = reactive(useInfiniteQuery(options))

    expectTypeOf(data).toEqualTypeOf<
      InfiniteData<{ id: string | null; pageParam: number }> | undefined
    >()
  })

  it('should reject a ref for an option other than enabled/queryKey/queryFn', () => {
    // Unlike `useInfiniteQuery`, `infiniteQueryOptions` only tracks `enabled`/`queryKey`/`queryFn` reactively —
    // every other option (`staleTime` here) stays a plain value. This is deliberate: the returned object is
    // shared with plain APIs like `queryClient.infiniteQuery`, so a `ref` slipping into an arbitrary option
    // would make the declared (plain) type lie about the actual (reactive) value.
    assertType(
      infiniteQueryOptions({
        queryKey: queryKey(),
        queryFn: ({ pageParam }: { pageParam: number }) =>
          Promise.resolve(pageParam),
        getNextPageParam: () => 1,
        initialPageParam: 1,
        // @ts-expect-error staleTime must be a plain value, not a ref
        staleTime: ref(1000),
      }),
    )
  })

  it('should reject the whole options object wrapped in a ref', () => {
    assertType(
      infiniteQueryOptions(
        // @ts-expect-error infiniteQueryOptions only accepts a plain object or a getter for the whole object,
        // not a ref
        ref({
          queryKey: queryKey(),
          queryFn: ({ pageParam }: { pageParam: number }) =>
            Promise.resolve(pageParam),
          getNextPageParam: () => 1,
          initialPageParam: 1,
        }),
      ),
    )
  })
})
