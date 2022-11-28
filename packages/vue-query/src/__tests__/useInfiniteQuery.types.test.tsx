import { InfiniteData } from '@tanstack/query-core'
import { reactive } from 'vue'
import { useInfiniteQuery } from '../useInfiniteQuery'
import { doNotExecute, Equal, Expect, simpleFetcher } from './test-utils'

describe('Discriminated union return type', () => {
  it('data should be possibly undefined by default', () => {
    doNotExecute(() => {
      const query = reactive(
        useInfiniteQuery({
          queryFn: simpleFetcher,
        }),
      )

      const result: Expect<
        Equal<InfiniteData<string> | undefined, typeof query.data>
      > = true
      return result
    })
  })

  it('data should be defined when query is success', () => {
    doNotExecute(() => {
      const query = reactive(
        useInfiniteQuery({
          queryFn: simpleFetcher,
        }),
      )

      if (query.isSuccess) {
        const result: Expect<Equal<InfiniteData<string>, typeof query.data>> =
          true
        return result
      }
    })
  })

  it('error should be null when query is success', () => {
    doNotExecute(() => {
      const query = reactive(
        useInfiniteQuery({
          queryFn: simpleFetcher,
        }),
      )

      if (query.isSuccess) {
        const result: Expect<Equal<null, typeof query.error>> = true
        return result
      }
    })
  })

  it('data should be undefined when query is loading', () => {
    doNotExecute(() => {
      const query = reactive(
        useInfiniteQuery({
          queryFn: simpleFetcher,
        }),
      )

      if (query.isLoading) {
        const result: Expect<Equal<undefined, typeof query.data>> = true
        return result
      }
    })
  })

  it('error should be defined when query is error', () => {
    doNotExecute(() => {
      const query = reactive(
        useInfiniteQuery({
          queryFn: simpleFetcher,
        }),
      )

      if (query.isError) {
        const result: Expect<Equal<unknown, typeof query.error>> = true
        return result
      }
    })
  })
})
