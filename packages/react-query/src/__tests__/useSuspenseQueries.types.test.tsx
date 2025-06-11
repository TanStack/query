import { expectTypeOf } from 'expect-type'
import {
  type UseSuspenseQueryResult,
  queryOptions,
  useSuspenseQueries,
} from '..'
import { doNotExecute } from './utils'

export const queryKey = ['key'] as const
const sleep = (ms: number) =>
  new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), ms))
export const queryFn = () => sleep(10).then(() => ({ text: 'response' }))
export const select = (data: Awaited<ReturnType<typeof queryFn>>) => data.text

describe('useSuspenseQueries', () => {
  it('type check', () => {
    doNotExecute(() => {
      useSuspenseQueries({
        queries: [
          {
            queryKey: [...queryKey, 1] as const,
            queryFn,
            // @ts-expect-error no suspense
            suspense: false,
          },
        ] as const,
      })
      useSuspenseQueries({
        queries: [
          {
            queryKey: [...queryKey, 2] as const,
            queryFn,
            select,
            // @ts-expect-error no suspense
            suspense: true,
          },
        ] as const,
      })
      useSuspenseQueries({
        queries: [
          {
            queryKey: [...queryKey, 3] as const,
            queryFn,
            // @ts-expect-error no enabled
            enabled: true,
          },
        ] as const,
      })
      useSuspenseQueries({
        queries: [
          {
            queryKey: [...queryKey, 4] as const,
            queryFn,
            // @ts-expect-error no enabled
            enabled: true,
            select,
          },
        ] as const,
      })
      useSuspenseQueries({
        queries: [
          {
            queryKey: [...queryKey, 4] as const,
            queryFn,
            // @ts-expect-error no networkMode
            networkMode: 'always',
            select,
          },
        ] as const,
      })
      useSuspenseQueries({
        queries: [
          queryOptions({
            queryKey: [...queryKey, 4] as const,
            queryFn: () => Promise.resolve({ field: 'success' }),
            select: (data) => data.field,
          }),
        ] as const,
      })
      // @ts-expect-error if no items
      useSuspenseQueries({})
      // @ts-expect-error if no items
      useSuspenseQueries()

      const [query1, query2, query3] = useSuspenseQueries({
        queries: [
          { queryKey: [...queryKey, 5] as const, queryFn },
          { queryKey: [...queryKey, 6] as const, queryFn, select },
          queryOptions({
            queryKey: [...queryKey, 4] as const,
            queryFn: () => Promise.resolve({ field: 'success' }),
            select: (data) => data.field,
          }),
        ] as const,
      })

      expectTypeOf(query1).toEqualTypeOf<
        UseSuspenseQueryResult<{ text: string }>
      >()
      expectTypeOf(query2).toEqualTypeOf<UseSuspenseQueryResult<string>>()
      expectTypeOf(query3).toEqualTypeOf<UseSuspenseQueryResult<string>>()
    })
  })
})
