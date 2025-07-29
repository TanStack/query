import { expectTypeOf } from 'expect-type'
import { infiniteQueryOptions, useSuspenseInfiniteQuery } from '..'
import { doNotExecute, sleep } from './utils'
import type { UseSuspenseInfiniteQueryResult } from '..'

import type { InfiniteData } from '@tanstack/react-query'

const queryKey = ['key'] as const
const queryFn = () => sleep(10).then(() => ({ text: 'response' }))

describe('useSuspenseInfiniteQuery', () => {
  it('type check', () => {
    doNotExecute(() => {
      // @ts-expect-error no arg
      useSuspenseInfiniteQuery()

      useSuspenseInfiniteQuery({
        queryKey,
        queryFn,
        // @ts-expect-error no suspense
        suspense: boolean,
      })
      useSuspenseInfiniteQuery({
        queryKey,
        queryFn,
        // @ts-expect-error no useErrorBoundary
        useErrorBoundary: boolean,
      })
      useSuspenseInfiniteQuery({
        queryKey,
        queryFn,
        // @ts-expect-error no enabled
        enabled: boolean,
      })
      useSuspenseInfiniteQuery({
        queryKey,
        queryFn,
        // @ts-expect-error no placeholderData
        placeholderData: 'placeholder',
      })
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      useSuspenseInfiniteQuery({
        queryKey,
        queryFn,
        // @ts-expect-error no isPlaceholderData
      }).isPlaceholderData
      useSuspenseInfiniteQuery({
        queryKey,
        queryFn,
        //@ts-expect-error no networkMode
        networkMode: 'always',
      })

      const infiniteQuery = useSuspenseInfiniteQuery({ queryKey, queryFn })
      expectTypeOf(infiniteQuery).toEqualTypeOf<
        UseSuspenseInfiniteQueryResult<{ text: string }>
      >()
      expectTypeOf(infiniteQuery.data).toEqualTypeOf<
        InfiniteData<{ text: string }>
      >()
      expectTypeOf(infiniteQuery.status).toEqualTypeOf<'error' | 'success'>()

      const selectedInfiniteQuery = useSuspenseInfiniteQuery({
        queryKey,
        queryFn,
        select: (data) => ({
          pages: data.pages.map(({ text }) => text),
          pageParams: data.pageParams,
        }),
      })
      expectTypeOf(selectedInfiniteQuery).toEqualTypeOf<
        UseSuspenseInfiniteQueryResult<string>
      >()
      expectTypeOf(selectedInfiniteQuery.data).toEqualTypeOf<
        InfiniteData<string>
      >()
      expectTypeOf(selectedInfiniteQuery.status).toEqualTypeOf<
        'error' | 'success'
      >()

      const options = infiniteQueryOptions({
        queryKey,
        queryFn,
      })

      const infiniteQueryWithOptions = useSuspenseInfiniteQuery(options)
      expectTypeOf(infiniteQueryWithOptions).toEqualTypeOf<
        UseSuspenseInfiniteQueryResult<{ text: string }>
      >()
      expectTypeOf(infiniteQueryWithOptions.data).toEqualTypeOf<
        InfiniteData<{ text: string }>
      >()
      expectTypeOf(infiniteQueryWithOptions.status).toEqualTypeOf<
        'error' | 'success'
      >()

      const selectedInfiniteQueryWithOptions = useSuspenseInfiniteQuery({
        ...options,
        select: (data) => ({
          pages: data.pages.map(({ text }) => text),
          pageParams: data.pageParams,
        }),
      })
      expectTypeOf(selectedInfiniteQueryWithOptions).toEqualTypeOf<
        UseSuspenseInfiniteQueryResult<string>
      >()
      expectTypeOf(selectedInfiniteQueryWithOptions.data).toEqualTypeOf<
        InfiniteData<string>
      >()
      expectTypeOf(selectedInfiniteQueryWithOptions.status).toEqualTypeOf<
        'error' | 'success'
      >()
    })
  })
})
