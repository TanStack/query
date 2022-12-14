import { reactive } from 'vue'
import { useQuery } from '../useQuery'
import { doNotExecute, Equal, Expect, simpleFetcher } from './test-utils'

describe('Discriminated union return type', () => {
  it('data should be possibly undefined by default', () => {
    doNotExecute(() => {
      const query = reactive(
        useQuery({
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

  it('data should be undefined when query is loading', () => {
    doNotExecute(() => {
      const query = reactive(
        useQuery({
          queryFn: simpleFetcher,
        }),
      )

      if (query.isLoading) {
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
          queryFn: simpleFetcher,
        }),
      )

      if (query.isError) {
        const result: Expect<Equal<unknown, typeof query.error>> = true
        return result
      }
      return
    })
  })
})
