import { describe, it } from 'vitest'
import { reactive } from 'vue-demi'
import { useInfiniteQuery } from '../useInfiniteQuery'
import { doNotExecute, simpleFetcher } from './test-utils'
import type { Equal, Expect } from './test-utils'
import type { InfiniteData } from '@tanstack/query-core'

describe('Discriminated union return type', () => {
  it('data should be possibly undefined by default', () => {
    doNotExecute(() => {
      const query = reactive(
        useInfiniteQuery({
          queryKey: ['infiniteQuery'],
          queryFn: simpleFetcher,
          getNextPageParam: () => undefined,
          initialPageParam: 0,
        }),
      )

      // TODO: Order of generics prevents pageParams to be typed correctly. Using `unknown` for now
      const result: Expect<
        Equal<InfiniteData<string, unknown> | undefined, typeof query.data>
      > = true
      return result
    })
  })

  it('data should be defined when query is success', () => {
    doNotExecute(() => {
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
        const result: Expect<
          Equal<InfiniteData<string, unknown>, typeof query.data>
        > = true
        return result
      }
      return
    })
  })

  it('error should be null when query is success', () => {
    doNotExecute(() => {
      const query = reactive(
        useInfiniteQuery({
          queryKey: ['infiniteQuery'],
          queryFn: simpleFetcher,
          getNextPageParam: () => undefined,
          initialPageParam: 0,
        }),
      )

      if (query.isSuccess) {
        const result: Expect<Equal<null, typeof query.error>> = true
        return result
      }
      return
    })
  })

  it('data should be undefined when query is pending', () => {
    doNotExecute(() => {
      const query = reactive(
        useInfiniteQuery({
          queryKey: ['infiniteQuery'],
          queryFn: simpleFetcher,
          getNextPageParam: () => undefined,
          initialPageParam: 0,
        }),
      )

      if (query.isPending) {
        const result: Expect<Equal<undefined, typeof query.data>> = true
        return result
      }
      return
    })
  })

  it('error should be defined when query is error', () => {
    doNotExecute(() => {
      const query = reactive(
        useInfiniteQuery({
          queryKey: ['infiniteQuery'],
          queryFn: simpleFetcher,
          getNextPageParam: () => undefined,
          initialPageParam: 0,
        }),
      )

      if (query.isError) {
        const result: Expect<Equal<Error, typeof query.error>> = true
        return result
      }
      return
    })
  })
})
