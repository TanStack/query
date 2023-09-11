import { queryOptions } from '../queryOptions'
import { doNotExecute } from './utils'
import type { Equal, Expect } from './utils'

describe('queryOptions', () => {
  it('should not allow excess properties', () => {
    doNotExecute(() => {
      // @ts-expect-error stallTime does not exist
      return queryOptions({
        queryKey: ['key'],
        queryFn: () => Promise.resolve(5),
        stallTime: 1000,
      })
    })
  })
  it('should infer types for callbacks', () => {
    doNotExecute(() => {
      return queryOptions({
        queryKey: ['key'],
        queryFn: () => Promise.resolve(5),
        staleTime: 1000,
        select: (data) => {
          const result: Expect<Equal<number, typeof data>> = true
          return result
        },
      })
    })
  })
})
