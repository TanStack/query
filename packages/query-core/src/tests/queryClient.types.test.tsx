import { QueryClient } from '../queryClient'
import { doNotExecute } from './utils'
import type { Equal, Expect } from './utils'
import type { TaggedQueryKey } from '../types'

describe('getQueryData', () => {
  it('should be typed if key is tagged', () => {
    doNotExecute(() => {
      const queryKey = ['key'] as TaggedQueryKey<Array<string>, number>
      const queryClient = new QueryClient()
      const data = queryClient.getQueryData(queryKey)

      const result: Expect<Equal<typeof data, number | undefined>> = true
      return result
    })
  })

  it('should infer unknown if key is not tagged', () => {
    doNotExecute(() => {
      const queryKey = ['key'] as const
      const queryClient = new QueryClient()
      const data = queryClient.getQueryData(queryKey)

      const result: Expect<Equal<typeof data, unknown>> = true
      return result
    })
  })

  it('should infer passed generic if passed', () => {
    doNotExecute(() => {
      const queryKey = ['key'] as const
      const queryClient = new QueryClient()
      const data = queryClient.getQueryData<number>(queryKey)

      const result: Expect<Equal<typeof data, number | undefined>> = true
      return result
    })
  })
})

describe('setQueryData', () => {
  it('should be typed if key is tagged', () => {
    doNotExecute(() => {
      const queryKey = ['key'] as TaggedQueryKey<Array<string>, number>
      const queryClient = new QueryClient()
      const data = queryClient.setQueryData(queryKey, (prev) => {
        const result: Expect<Equal<typeof prev, number | undefined>> = true
        return result ? prev : 1
      })

      const result: Expect<Equal<typeof data, number>> = true
      return result
    })
  })

  it('should infer unknown if key is not tagged', () => {
    doNotExecute(() => {
      const queryKey = ['key'] as const
      const queryClient = new QueryClient()
      const data = queryClient.setQueryData(queryKey, (prev) => {
        const result: Expect<Equal<typeof prev, unknown>> = true
        return result ? prev : 1
      })

      const result: Expect<Equal<typeof data, unknown>> = true
      return result
    })
  })

  it('should infer passed generic if passed', () => {
    doNotExecute(() => {
      const queryKey = ['key'] as const
      const queryClient = new QueryClient()
      const data = queryClient.setQueryData<string>(queryKey, (prev) => {
        const result: Expect<Equal<typeof prev, string | undefined>> = true
        return result ? prev : '1'
      })

      const result: Expect<Equal<typeof data, string | undefined>> = true
      return result
    })
  })
})
