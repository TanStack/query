import { assertType, describe, expectTypeOf, it } from 'vitest'
import { computed, reactive, ref } from 'vue-demi'
import { skipToken } from '@tanstack/query-core'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import { useInfiniteQuery } from '../useInfiniteQuery'
import { infiniteQueryOptions } from '../infiniteQueryOptions'
import type { InfiniteData } from '@tanstack/query-core'

describe('Discriminated union return type', () => {
  it('data should be possibly undefined by default', () => {
    const key = queryKey()
    const query = reactive(
      useInfiniteQuery({
        queryKey: key,
        queryFn: () => sleep(0).then(() => 'Some data'),
        getNextPageParam: () => undefined,
        initialPageParam: 0,
      }),
    )

    // TODO: Order of generics prevents pageParams to be typed correctly. Using `unknown` for now
    expectTypeOf(query.data).toEqualTypeOf<
      InfiniteData<string, unknown> | undefined
    >()
  })

  it('data should be defined when query is success', () => {
    const key = queryKey()
    const query = reactive(
      useInfiniteQuery({
        queryKey: key,
        queryFn: () => sleep(0).then(() => 'Some data'),
        getNextPageParam: () => undefined,
        initialPageParam: 0,
      }),
    )

    if (query.isSuccess) {
      // TODO: Order of generics prevents pageParams to be typed correctly. Using `unknown` for now
      expectTypeOf(query.data).toEqualTypeOf<InfiniteData<string, unknown>>()
    }
  })

  it('error should be null when query is success', () => {
    const key = queryKey()
    const query = reactive(
      useInfiniteQuery({
        queryKey: key,
        queryFn: () => sleep(0).then(() => 'Some data'),
        getNextPageParam: () => undefined,
        initialPageParam: 0,
      }),
    )

    if (query.isSuccess) {
      expectTypeOf(query.error).toEqualTypeOf<null>()
    }
  })

  it('data should be undefined when query is pending', () => {
    const key = queryKey()
    const query = reactive(
      useInfiniteQuery({
        queryKey: key,
        queryFn: () => sleep(0).then(() => 'Some data'),
        getNextPageParam: () => undefined,
        initialPageParam: 0,
      }),
    )

    if (query.isPending) {
      expectTypeOf(query.data).toEqualTypeOf<undefined>()
    }
  })

  it('error should be defined when query is error', () => {
    const key = queryKey()
    const query = reactive(
      useInfiniteQuery({
        queryKey: key,
        queryFn: () => sleep(0).then(() => 'Some data'),
        getNextPageParam: () => undefined,
        initialPageParam: 0,
      }),
    )

    if (query.isError) {
      expectTypeOf(query.error).toEqualTypeOf<Error>()
    }
  })

  it('should accept computed options', () => {
    const key = queryKey()
    const options = computed(() => ({
      queryKey: key,
      queryFn: () => sleep(0).then(() => 'Some data'),
      getNextPageParam: () => undefined,
      initialPageParam: 0,
    }))
    const query = reactive(useInfiniteQuery(options))

    if (query.isSuccess) {
      expectTypeOf(query.data).toEqualTypeOf<InfiniteData<string, unknown>>()
    }
  })

  it('should accept a computed queryFn resolving to skipToken', () => {
    const key = queryKey()
    const id = ref<string | null>('1')

    // The resulting `data` type can't be asserted here: `vue-tsc`'s language-service plugin (unlike `tsc` or
    // vitest's own typecheck) fails to resolve `TQueryFnData` through this inference path, leaking the
    // unresolved type parameter into `query.data`'s type. Runtime skip/refetch behavior is covered in
    // `useInfiniteQuery.test.ts`.
    assertType(
      reactive(
        useInfiniteQuery({
          queryKey: key,
          queryFn: computed(() =>
            id.value
              ? ({ pageParam }: { pageParam: number }) =>
                  sleep(0).then(() => 'data on page ' + pageParam)
              : skipToken,
          ),
          getNextPageParam: () => undefined,
          initialPageParam: 0,
        }),
      ),
    )
  })

  it('should accept computed options using infiniteQueryOptions', () => {
    const key = queryKey()
    const options = computed(() =>
      infiniteQueryOptions({
        queryKey: key,
        queryFn: () => sleep(0).then(() => 'Some data'),
        getNextPageParam: () => undefined,
        initialPageParam: 0,
      }),
    )
    const query = reactive(useInfiniteQuery(options))

    if (query.isSuccess) {
      expectTypeOf(query.data).toEqualTypeOf<InfiniteData<string, unknown>>()
    }
  })

  it('should accept plain options using infiniteQueryOptions', () => {
    const key = queryKey()
    const options = () =>
      infiniteQueryOptions({
        queryKey: key,
        queryFn: () => sleep(0).then(() => 'Some data'),
        getNextPageParam: () => undefined,
        initialPageParam: 0,
      })
    const query = reactive(useInfiniteQuery(options))

    if (query.isSuccess) {
      expectTypeOf(query.data).toEqualTypeOf<InfiniteData<string, unknown>>()
    }
  })
})

describe('queryKey reactivity rules', () => {
  it('should reject a bare reactive getter for the whole queryKey array', () => {
    const id = ref(1)
    assertType(
      useInfiniteQuery({
        // @ts-expect-error when passed directly to useInfiniteQuery, queryKey cannot be a bare
        // reactive getter for the whole array (queryOptions() allows this)
        queryKey: () => ['post', id.value],
        queryFn: () => sleep(0).then(() => 'Some data'),
        getNextPageParam: () => undefined,
        initialPageParam: 0,
      }),
    )
  })
})
