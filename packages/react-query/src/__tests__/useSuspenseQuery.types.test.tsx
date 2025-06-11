import { expectTypeOf } from 'expect-type'
import { type UseSuspenseQueryResult, queryOptions, useSuspenseQuery } from '..'
import { doNotExecute } from './utils'

const queryKey = ['key'] as const
const sleep = (ms: number) =>
  new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), ms))
const queryFn = () => sleep(10).then(() => ({ text: 'response' }))

describe('useSuspenseQuery', () => {
  it('type check', () => {
    doNotExecute(() => {
      //@ts-expect-error no arg
      useSuspenseQuery()
      useSuspenseQuery({
        queryKey,
        queryFn,
        //@ts-expect-error no suspense
        suspense: boolean,
      })
      useSuspenseQuery({
        queryKey,
        queryFn,
        //@ts-expect-error no useErrorBoundary
        useErrorBoundary: boolean,
      })
      useSuspenseQuery({
        queryKey,
        queryFn,
        //@ts-expect-error no enabled
        enabled: boolean,
      })
      useSuspenseQuery({
        queryKey,
        queryFn,
        //@ts-expect-error no placeholderData
        placeholderData: 'placeholder',
      })
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      useSuspenseQuery({
        queryKey,
        queryFn,
        //@ts-expect-error no isPlaceholderData
      }).isPlaceholderData
      useSuspenseQuery({
        queryKey,
        queryFn,
        //@ts-expect-error no networkMode
        networkMode: 'always',
      })

      expectTypeOf(useSuspenseQuery({ queryKey, queryFn })).toEqualTypeOf<
        UseSuspenseQueryResult<{ text: string }>
      >()
      expectTypeOf(
        useSuspenseQuery({
          queryKey,
          queryFn,
          select: (data) => data.text,
        }),
      ).toEqualTypeOf<UseSuspenseQueryResult<string>>()
      const options = queryOptions({
        queryKey,
        queryFn,
      })
      expectTypeOf(useSuspenseQuery(options)).toEqualTypeOf<
        UseSuspenseQueryResult<{ text: string }>
      >()
      expectTypeOf(
        useSuspenseQuery({
          ...options,
          select: (data) => data.text,
        }),
      ).toEqualTypeOf<UseSuspenseQueryResult<string>>()
    })
  })
})
