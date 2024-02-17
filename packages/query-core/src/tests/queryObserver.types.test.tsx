import { describe, it } from 'vitest'
import { QueryObserver } from '..'
import { createQueryClient, doNotExecute } from './utils'
import type { Equal, Expect } from './utils'

describe('placeholderData', () => {
  describe('placeholderData function', () => {
    it('previousQuery should have typed queryKey', () => {
      doNotExecute(() => {
        const queryKey = ['SomeQuery', 42, { foo: 'bar' }] as const
        type QueryKey = typeof queryKey

        new QueryObserver(createQueryClient(), {
          queryKey,
          placeholderData: (_, previousQuery) => {
            const previousQueryKey = previousQuery?.queryKey

            const result: Expect<
              Equal<typeof previousQueryKey, QueryKey | undefined>
            > = true
            return result
          },
        })
      })
    })

    it('previousQuery should have typed error', () => {
      doNotExecute(() => {
        class CustomError extends Error {
          name = 'CustomError' as const
        }

        new QueryObserver<boolean, CustomError>(createQueryClient(), {
          queryKey: ['key'],
          placeholderData: (_, previousQuery) => {
            const error = previousQuery?.state.error

            const result: Expect<
              Equal<typeof error, CustomError | null | undefined>
            > = true
            return result
          },
        })
      })
    })

    it('previousData should have the same type as query data', () => {
      doNotExecute(() => {
        const queryData = { foo: 'bar' } as const
        type QueryData = typeof queryData

        new QueryObserver(createQueryClient(), {
          queryKey: ['key'],
          queryFn: () => queryData,
          select: (data) => data.foo,
          placeholderData: (previousData) => {
            const result: Expect<
              Equal<typeof previousData, QueryData | undefined>
            > = true
            return result ? previousData : undefined
          },
        })
      })
    })
  })
})
