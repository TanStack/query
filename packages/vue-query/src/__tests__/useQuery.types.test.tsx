import { describe, it } from 'vitest'
import { reactive } from 'vue'
import { useQuery } from '../useQuery'
import { doNotExecute, simpleFetcher } from './test-utils'
import type { Equal, Expect } from './test-utils'

describe('Discriminated union return type', () => {
  it('data should be possibly undefined by default', () => {
    doNotExecute(() => {
      const query = reactive(
        useQuery({
          queryKey: ['key'],
          queryFn: simpleFetcher,
        }),
      )

      const result: Expect<Equal<string | undefined, typeof query.data>> = true
      return result
    })
  })

  it('data should be defined when query is success', () => {
    doNotExecute(() => {
      const query = reactive(
        useQuery({
          queryKey: ['key'],
          queryFn: simpleFetcher,
        }),
      )

      if (query.isSuccess) {
        const result: Expect<Equal<string, typeof query.data>> = true
        return result
      }
      return
    })
  })

  it('error should be null when query is success', () => {
    doNotExecute(() => {
      const query = reactive(
        useQuery({
          queryKey: ['key'],
          queryFn: simpleFetcher,
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
        useQuery({
          queryKey: ['key'],
          queryFn: simpleFetcher,
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
        useQuery({
          queryKey: ['key'],
          queryFn: simpleFetcher,
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
