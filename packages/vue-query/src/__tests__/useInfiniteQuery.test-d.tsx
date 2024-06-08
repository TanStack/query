import { describe, expectTypeOf, it } from 'vitest'
import { reactive } from 'vue-demi'
import { useInfiniteQuery } from '../useInfiniteQuery'
import { simpleFetcher } from './test-utils'
import type { InfiniteData } from '@tanstack/query-core'

describe('Discriminated union return type', () => {
  it('data should be possibly undefined by default', () => {
    const query = reactive(
      useInfiniteQuery({
        queryKey: ['infiniteQuery'],
        queryFn: simpleFetcher,
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
    const query = reactive(
      useInfiniteQuery({
        queryKey: ['infiniteQuery'],
        queryFn: simpleFetcher,
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
    const query = reactive(
      useInfiniteQuery({
        queryKey: ['infiniteQuery'],
        queryFn: simpleFetcher,
        getNextPageParam: () => undefined,
        initialPageParam: 0,
      }),
    )

    if (query.isSuccess) {
      expectTypeOf(query.error).toEqualTypeOf<null>()
    }
  })

  it('data should be undefined when query is pending', () => {
    const query = reactive(
      useInfiniteQuery({
        queryKey: ['infiniteQuery'],
        queryFn: simpleFetcher,
        getNextPageParam: () => undefined,
        initialPageParam: 0,
      }),
    )

    if (query.isPending) {
      expectTypeOf(query.data).toEqualTypeOf<undefined>()
    }
  })

  it('error should be defined when query is error', () => {
    const query = reactive(
      useInfiniteQuery({
        queryKey: ['infiniteQuery'],
        queryFn: simpleFetcher,
        getNextPageParam: () => undefined,
        initialPageParam: 0,
      }),
    )

    if (query.isError) {
      expectTypeOf(query.error).toEqualTypeOf<Error>()
    }
  })
})
