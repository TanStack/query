import { describe, expect, expectTypeOf, it, vi } from 'vitest'
import { fireEvent, render, waitFor } from '@testing-library/react'
import * as React from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { QueryClient } from '@tanstack/query-core'
import { QueryCache, queryOptions, skipToken, useQueries } from '..'
import { createQueryClient, queryKey, renderWithClient, sleep } from './utils'
import type {
  QueryFunction,
  QueryKey,
  QueryObserverResult,
  UseQueryOptions,
  UseQueryResult,
} from '..'
import type { QueryFunctionContext } from '@tanstack/query-core'

describe('useQueries', () => {
  const queryCache = new QueryCache()
  const queryClient = createQueryClient({ queryCache })

  it('should return the correct states', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const results: Array<Array<UseQueryResult>> = []

    function Page() {
      const result = useQueries({
        queries: [
          {
            queryKey: key1,
            queryFn: async () => {
              await sleep(10)
              return 1
            },
          },
          {
            queryKey: key2,
            queryFn: async () => {
              await sleep(200)
              return 2
            },
          },
        ],
      })
      results.push(result)

      return (
        <div>
          <div>
            data1: {String(result[0].data ?? 'null')}, data2:{' '}
            {String(result[1].data ?? 'null')}
          </div>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    await waitFor(() => rendered.getByText('data1: 1, data2: 2'))

    expect(results.length).toBe(3)
    expect(results[0]).toMatchObject([{ data: undefined }, { data: undefined }])
    expect(results[1]).toMatchObject([{ data: 1 }, { data: undefined }])
    expect(results[2]).toMatchObject([{ data: 1 }, { data: 2 }])
  })

  it('should track results', async () => {
    const key1 = queryKey()
    const results: Array<Array<UseQueryResult>> = []
    let count = 0

    function Page() {
      const result = useQueries({
        queries: [
          {
            queryKey: key1,
            queryFn: async () => {
              await sleep(10)
              count++
              return count
            },
          },
        ],
      })
      results.push(result)

      return (
        <div>
          <div>data: {String(result[0].data ?? 'null')} </div>
          <button onClick={() => result[0].refetch()}>refetch</button>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    await waitFor(() => rendered.getByText('data: 1'))

    expect(results.length).toBe(2)
    expect(results[0]).toMatchObject([{ data: undefined }])
    expect(results[1]).toMatchObject([{ data: 1 }])

    fireEvent.click(rendered.getByRole('button', { name: /refetch/i }))

    await waitFor(() => rendered.getByText('data: 2'))

    // only one render for data update, no render for isFetching transition
    expect(results.length).toBe(3)

    expect(results[2]).toMatchObject([{ data: 2 }])
  })

  it('handles type parameter - tuple of tuples', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const key3 = queryKey()

    // @ts-expect-error (Page component is not rendered)
    function Page() {
      const result1 = useQueries<
        [[number], [string], [Array<string>, boolean]]
      >({
        queries: [
          {
            queryKey: key1,
            queryFn: () => 1,
          },
          {
            queryKey: key2,
            queryFn: () => 'string',
          },
          {
            queryKey: key3,
            queryFn: () => ['string[]'],
          },
        ],
      })
      expectTypeOf(result1[0]).toEqualTypeOf<UseQueryResult<number, unknown>>()
      expectTypeOf(result1[1]).toEqualTypeOf<UseQueryResult<string, unknown>>()
      expectTypeOf(result1[2]).toEqualTypeOf<
        UseQueryResult<Array<string>, boolean>
      >()
      expectTypeOf(result1[0].data).toEqualTypeOf<number | undefined>()
      expectTypeOf(result1[1].data).toEqualTypeOf<string | undefined>()
      expectTypeOf(result1[2].data).toEqualTypeOf<Array<string> | undefined>()
      expectTypeOf(result1[2].error).toEqualTypeOf<boolean | null>()

      // TData (3rd element) takes precedence over TQueryFnData (1st element)
      const result2 = useQueries<
        [[string, unknown, string], [string, unknown, number]]
      >({
        queries: [
          {
            queryKey: key1,
            queryFn: () => 'string',
            select: (a) => {
              expectTypeOf(a).toEqualTypeOf<string>()
              return a.toLowerCase()
            },
          },
          {
            queryKey: key2,
            queryFn: () => 'string',
            select: (a) => {
              expectTypeOf(a).toEqualTypeOf<string>()
              return parseInt(a)
            },
          },
        ],
      })
      expectTypeOf(result2[0]).toEqualTypeOf<UseQueryResult<string, unknown>>()
      expectTypeOf(result2[1]).toEqualTypeOf<UseQueryResult<number, unknown>>()
      expectTypeOf(result2[0].data).toEqualTypeOf<string | undefined>()
      expectTypeOf(result2[1].data).toEqualTypeOf<number | undefined>()

      // types should be enforced
      useQueries<[[string, unknown, string], [string, boolean, number]]>({
        queries: [
          {
            queryKey: key1,
            queryFn: () => 'string',
            select: (a) => {
              expectTypeOf(a).toEqualTypeOf<string>()
              return a.toLowerCase()
            },
            placeholderData: 'string',
            // @ts-expect-error (initialData: string)
            initialData: 123,
          },
          {
            queryKey: key2,
            queryFn: () => 'string',
            select: (a) => {
              expectTypeOf(a).toEqualTypeOf<string>()
              return parseInt(a)
            },
            placeholderData: 'string',
            // @ts-expect-error (initialData: string)
            initialData: 123,
          },
        ],
      })

      // field names should be enforced
      useQueries<[[string]]>({
        queries: [
          {
            queryKey: key1,
            queryFn: () => 'string',
            // @ts-expect-error (invalidField)
            someInvalidField: [],
          },
        ],
      })
    }
  })

  it('handles type parameter - tuple of objects', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const key3 = queryKey()

    // @ts-expect-error (Page component is not rendered)
    function Page() {
      const result1 = useQueries<
        [
          { queryFnData: number },
          { queryFnData: string },
          { queryFnData: Array<string>; error: boolean },
        ]
      >({
        queries: [
          {
            queryKey: key1,
            queryFn: () => 1,
          },
          {
            queryKey: key2,
            queryFn: () => 'string',
          },
          {
            queryKey: key3,
            queryFn: () => ['string[]'],
          },
        ],
      })
      expectTypeOf(result1[0]).toEqualTypeOf<UseQueryResult<number, unknown>>()
      expectTypeOf(result1[1]).toEqualTypeOf<UseQueryResult<string, unknown>>()
      expectTypeOf(result1[2]).toEqualTypeOf<
        UseQueryResult<Array<string>, boolean>
      >()
      expectTypeOf(result1[0].data).toEqualTypeOf<number | undefined>()
      expectTypeOf(result1[1].data).toEqualTypeOf<string | undefined>()
      expectTypeOf(result1[2].data).toEqualTypeOf<Array<string> | undefined>()
      expectTypeOf(result1[2].error).toEqualTypeOf<boolean | null>()

      // TData (data prop) takes precedence over TQueryFnData (queryFnData prop)
      const result2 = useQueries<
        [
          { queryFnData: string; data: string },
          { queryFnData: string; data: number },
        ]
      >({
        queries: [
          {
            queryKey: key1,
            queryFn: () => 'string',
            select: (a) => {
              expectTypeOf(a).toEqualTypeOf<string>()
              return a.toLowerCase()
            },
          },
          {
            queryKey: key2,
            queryFn: () => 'string',
            select: (a) => {
              expectTypeOf(a).toEqualTypeOf<string>()
              return parseInt(a)
            },
          },
        ],
      })
      expectTypeOf(result2[0]).toEqualTypeOf<UseQueryResult<string, unknown>>()
      expectTypeOf(result2[1]).toEqualTypeOf<UseQueryResult<number, unknown>>()
      expectTypeOf(result2[0].data).toEqualTypeOf<string | undefined>()
      expectTypeOf(result2[1].data).toEqualTypeOf<number | undefined>()

      // can pass only TData (data prop) although TQueryFnData will be left unknown
      const result3 = useQueries<[{ data: string }, { data: number }]>({
        queries: [
          {
            queryKey: key1,
            queryFn: () => 'string',
            select: (a) => {
              expectTypeOf(a).toEqualTypeOf<unknown>()
              return a as string
            },
          },
          {
            queryKey: key2,
            queryFn: () => 'string',
            select: (a) => {
              expectTypeOf(a).toEqualTypeOf<unknown>()
              return a as number
            },
          },
        ],
      })
      expectTypeOf(result3[0]).toEqualTypeOf<UseQueryResult<string, unknown>>()
      expectTypeOf(result3[1]).toEqualTypeOf<UseQueryResult<number, unknown>>()
      expectTypeOf(result3[0].data).toEqualTypeOf<string | undefined>()
      expectTypeOf(result3[1].data).toEqualTypeOf<number | undefined>()

      // types should be enforced
      useQueries<
        [
          { queryFnData: string; data: string },
          { queryFnData: string; data: number; error: boolean },
        ]
      >({
        queries: [
          {
            queryKey: key1,
            queryFn: () => 'string',
            select: (a) => {
              expectTypeOf(a).toEqualTypeOf<string>()
              return a.toLowerCase()
            },
            placeholderData: 'string',
            // @ts-expect-error (initialData: string)
            initialData: 123,
          },
          {
            queryKey: key2,
            queryFn: () => 'string',
            select: (a) => {
              expectTypeOf(a).toEqualTypeOf<string>()
              return parseInt(a)
            },
            placeholderData: 'string',
            // @ts-expect-error (initialData: string)
            initialData: 123,
          },
        ],
      })

      // field names should be enforced
      useQueries<[{ queryFnData: string }]>({
        queries: [
          {
            queryKey: key1,
            queryFn: () => 'string',
            // @ts-expect-error (invalidField)
            someInvalidField: [],
          },
        ],
      })
    }
  })

  it('correctly returns types when passing through queryOptions', () => {
    // @ts-expect-error (Page component is not rendered)
    function Page() {
      // data and results types are correct when using queryOptions
      const result4 = useQueries({
        queries: [
          queryOptions({
            queryKey: ['key1'],
            queryFn: () => 'string',
            select: (a) => {
              expectTypeOf(a).toEqualTypeOf<string>()
              return a.toLowerCase()
            },
          }),
          queryOptions({
            queryKey: ['key2'],
            queryFn: () => 'string',
            select: (a) => {
              expectTypeOf(a).toEqualTypeOf<string>()
              return parseInt(a)
            },
          }),
        ],
      })
      expectTypeOf(result4[0]).toEqualTypeOf<UseQueryResult<string, Error>>()
      expectTypeOf(result4[1]).toEqualTypeOf<UseQueryResult<number, Error>>()
      expectTypeOf(result4[0].data).toEqualTypeOf<string | undefined>()
      expectTypeOf(result4[1].data).toEqualTypeOf<number | undefined>()
    }
  })

  it('handles array literal without type parameter to infer result type', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const key3 = queryKey()
    const key4 = queryKey()
    const key5 = queryKey()

    type BizError = { code: number }
    const throwOnError = (_error: BizError) => true

    // @ts-expect-error (Page component is not rendered)
    function Page() {
      // Array.map preserves TQueryFnData
      const result1 = useQueries({
        queries: Array(50).map((_, i) => ({
          queryKey: ['key', i] as const,
          queryFn: () => i + 10,
        })),
      })
      expectTypeOf(result1).toEqualTypeOf<
        Array<UseQueryResult<number, Error>>
      >()
      if (result1[0]) {
        expectTypeOf(result1[0].data).toEqualTypeOf<number | undefined>()
      }

      // Array.map preserves TError
      const result1_err = useQueries({
        queries: Array(50).map((_, i) => ({
          queryKey: ['key', i] as const,
          queryFn: () => i + 10,
          throwOnError,
        })),
      })
      expectTypeOf(result1_err).toEqualTypeOf<
        Array<UseQueryResult<number, BizError>>
      >()
      if (result1_err[0]) {
        expectTypeOf(result1_err[0].data).toEqualTypeOf<number | undefined>()
        expectTypeOf(result1_err[0].error).toEqualTypeOf<BizError | null>()
      }

      // Array.map preserves TData
      const result2 = useQueries({
        queries: Array(50).map((_, i) => ({
          queryKey: ['key', i] as const,
          queryFn: () => i + 10,
          select: (data: number) => data.toString(),
        })),
      })
      expectTypeOf(result2).toEqualTypeOf<
        Array<UseQueryResult<string, Error>>
      >()

      const result2_err = useQueries({
        queries: Array(50).map((_, i) => ({
          queryKey: ['key', i] as const,
          queryFn: () => i + 10,
          select: (data: number) => data.toString(),
          throwOnError,
        })),
      })
      expectTypeOf(result2_err).toEqualTypeOf<
        Array<UseQueryResult<string, BizError>>
      >()

      const result3 = useQueries({
        queries: [
          {
            queryKey: key1,
            queryFn: () => 1,
          },
          {
            queryKey: key2,
            queryFn: () => 'string',
          },
          {
            queryKey: key3,
            queryFn: () => ['string[]'],
            select: () => 123,
          },
          {
            queryKey: key5,
            queryFn: () => 'string',
            throwOnError,
          },
        ],
      })
      expectTypeOf(result3[0]).toEqualTypeOf<UseQueryResult<number, Error>>()
      expectTypeOf(result3[1]).toEqualTypeOf<UseQueryResult<string, Error>>()
      expectTypeOf(result3[2]).toEqualTypeOf<UseQueryResult<number, Error>>()
      expectTypeOf(result3[0].data).toEqualTypeOf<number | undefined>()
      expectTypeOf(result3[1].data).toEqualTypeOf<string | undefined>()
      expectTypeOf(result3[3].data).toEqualTypeOf<string | undefined>()
      // select takes precedence over queryFn
      expectTypeOf(result3[2].data).toEqualTypeOf<number | undefined>()
      // infer TError from throwOnError
      expectTypeOf(result3[3].error).toEqualTypeOf<BizError | null>()

      // initialData/placeholderData are enforced
      useQueries({
        queries: [
          {
            queryKey: key1,
            queryFn: () => 'string',
            placeholderData: 'string',
            // @ts-expect-error (initialData: string)
            initialData: 123,
          },
          {
            queryKey: key2,
            queryFn: () => 123,
            // @ts-expect-error (placeholderData: number)
            placeholderData: 'string',
            initialData: 123,
          },
        ],
      })

      // select and throwOnError params are "indirectly" enforced
      useQueries({
        queries: [
          // unfortunately TS will not suggest the type for you
          {
            queryKey: key1,
            queryFn: () => 'string',
          },
          // however you can add a type to the callback
          {
            queryKey: key2,
            queryFn: () => 'string',
          },
          // the type you do pass is enforced
          {
            queryKey: key3,
            queryFn: () => 'string',
          },
          {
            queryKey: key4,
            queryFn: () => 'string',
            select: (a: string) => parseInt(a),
          },
          {
            queryKey: key5,
            queryFn: () => 'string',
            throwOnError,
          },
        ],
      })

      // callbacks are also indirectly enforced with Array.map
      useQueries({
        queries: Array(50).map((_, i) => ({
          queryKey: ['key', i] as const,
          queryFn: () => i + 10,
          select: (data: number) => data.toString(),
        })),
      })
      useQueries({
        queries: Array(50).map((_, i) => ({
          queryKey: ['key', i] as const,
          queryFn: () => i + 10,
          select: (data: number) => data.toString(),
        })),
      })

      // results inference works when all the handlers are defined
      const result4 = useQueries({
        queries: [
          {
            queryKey: key1,
            queryFn: () => 'string',
          },
          {
            queryKey: key2,
            queryFn: () => 'string',
          },
          {
            queryKey: key4,
            queryFn: () => 'string',
            select: (a: string) => parseInt(a),
          },
          {
            queryKey: key5,
            queryFn: () => 'string',
            select: (a: string) => parseInt(a),
            throwOnError,
          },
        ],
      })
      expectTypeOf(result4[0]).toEqualTypeOf<UseQueryResult<string, Error>>()
      expectTypeOf(result4[1]).toEqualTypeOf<UseQueryResult<string, Error>>()
      expectTypeOf(result4[2]).toEqualTypeOf<UseQueryResult<number, Error>>()
      expectTypeOf(result4[3]).toEqualTypeOf<UseQueryResult<number, BizError>>()

      // handles when queryFn returns a Promise
      const result5 = useQueries({
        queries: [
          {
            queryKey: key1,
            queryFn: () => Promise.resolve('string'),
          },
        ],
      })
      expectTypeOf(result5[0]).toEqualTypeOf<UseQueryResult<string, Error>>()

      // Array as const does not throw error
      const result6 = useQueries({
        queries: [
          {
            queryKey: ['key1'],
            queryFn: () => 'string',
          },
          {
            queryKey: ['key1'],
            queryFn: () => 123,
          },
          {
            queryKey: key5,
            queryFn: () => 'string',
            throwOnError,
          },
        ],
      } as const)
      expectTypeOf(result6[0]).toEqualTypeOf<UseQueryResult<string, Error>>()
      expectTypeOf(result6[1]).toEqualTypeOf<UseQueryResult<number, Error>>()
      expectTypeOf(result6[2]).toEqualTypeOf<UseQueryResult<string, BizError>>()

      // field names should be enforced - array literal
      useQueries({
        queries: [
          {
            queryKey: key1,
            queryFn: () => 'string',
            // @ts-expect-error (invalidField)
            someInvalidField: [],
          },
        ],
      })

      // field names should be enforced - Array.map() result
      useQueries({
        // @ts-expect-error (invalidField)
        queries: Array(10).map(() => ({
          someInvalidField: '',
        })),
      })

      // field names should be enforced - array literal
      useQueries({
        queries: [
          {
            queryKey: key1,
            queryFn: () => 'string',
            // @ts-expect-error (invalidField)
            someInvalidField: [],
          },
        ],
      })

      // supports queryFn using fetch() to return Promise<any> - Array.map() result
      useQueries({
        queries: Array(50).map((_, i) => ({
          queryKey: ['key', i] as const,
          queryFn: () =>
            fetch('return Promise<any>').then((resp) => resp.json()),
        })),
      })

      // supports queryFn using fetch() to return Promise<any> - array literal
      useQueries({
        queries: [
          {
            queryKey: key1,
            queryFn: () =>
              fetch('return Promise<any>').then((resp) => resp.json()),
          },
        ],
      })
    }
  })

  it('handles strongly typed queryFn factories and useQueries wrappers', () => {
    // QueryKey + queryFn factory
    type QueryKeyA = ['queryA']
    const getQueryKeyA = (): QueryKeyA => ['queryA']
    type GetQueryFunctionA = () => QueryFunction<number, QueryKeyA>
    const getQueryFunctionA: GetQueryFunctionA = () => async () => {
      return 1
    }
    type SelectorA = (data: number) => [number, string]
    const getSelectorA = (): SelectorA => (data) => [data, data.toString()]

    type QueryKeyB = ['queryB', string]
    const getQueryKeyB = (id: string): QueryKeyB => ['queryB', id]
    type GetQueryFunctionB = () => QueryFunction<string, QueryKeyB>
    const getQueryFunctionB: GetQueryFunctionB = () => async () => {
      return '1'
    }
    type SelectorB = (data: string) => [string, number]
    const getSelectorB = (): SelectorB => (data) => [data, +data]

    // Wrapper with strongly typed array-parameter
    function useWrappedQueries<
      TQueryFnData,
      TError,
      TData,
      TQueryKey extends QueryKey,
    >(queries: Array<UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>>) {
      return useQueries({
        queries: queries.map(
          // no need to type the mapped query
          (query) => {
            const { queryFn: fn, queryKey: key } = query
            expectTypeOf(fn).toEqualTypeOf<
              | typeof skipToken
              | QueryFunction<TQueryFnData, TQueryKey, never>
              | undefined
            >()
            return {
              queryKey: key,
              queryFn:
                fn && fn !== skipToken
                  ? (ctx: QueryFunctionContext<TQueryKey>) => {
                      // eslint-disable-next-line vitest/valid-expect
                      expectTypeOf<TQueryKey>(ctx.queryKey)
                      return fn.call({}, ctx)
                    }
                  : undefined,
            }
          },
        ),
      })
    }

    // @ts-expect-error (Page component is not rendered)
    function Page() {
      const result = useQueries({
        queries: [
          {
            queryKey: getQueryKeyA(),
            queryFn: getQueryFunctionA(),
          },
          {
            queryKey: getQueryKeyB('id'),
            queryFn: getQueryFunctionB(),
          },
        ],
      })
      expectTypeOf(result[0]).toEqualTypeOf<UseQueryResult<number, Error>>()
      expectTypeOf(result[1]).toEqualTypeOf<UseQueryResult<string, Error>>()

      const withSelector = useQueries({
        queries: [
          {
            queryKey: getQueryKeyA(),
            queryFn: getQueryFunctionA(),
            select: getSelectorA(),
          },
          {
            queryKey: getQueryKeyB('id'),
            queryFn: getQueryFunctionB(),
            select: getSelectorB(),
          },
        ],
      })
      expectTypeOf(withSelector[0]).toEqualTypeOf<
        UseQueryResult<[number, string], Error>
      >()
      expectTypeOf(withSelector[1]).toEqualTypeOf<
        UseQueryResult<[string, number], Error>
      >()

      const withWrappedQueries = useWrappedQueries(
        Array(10).map(() => ({
          queryKey: getQueryKeyA(),
          queryFn: getQueryFunctionA(),
          select: getSelectorA(),
        })),
      )

      expectTypeOf(withWrappedQueries).toEqualTypeOf<
        Array<UseQueryResult<number, Error>>
      >()
    }
  })

  it("should throw error if in one of queries' queryFn throws and throwOnError is in use", async () => {
    const consoleMock = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)
    const key1 = queryKey()
    const key2 = queryKey()
    const key3 = queryKey()
    const key4 = queryKey()

    function Page() {
      useQueries({
        queries: [
          {
            queryKey: key1,
            queryFn: () =>
              Promise.reject(
                new Error(
                  'this should not throw because throwOnError is not set',
                ),
              ),
          },
          {
            queryKey: key2,
            queryFn: () => Promise.reject(new Error('single query error')),
            throwOnError: true,
            retry: false,
          },
          {
            queryKey: key3,
            queryFn: async () => 2,
          },
          {
            queryKey: key4,
            queryFn: async () =>
              Promise.reject(
                new Error('this should not throw because query#2 already did'),
              ),
            throwOnError: true,
            retry: false,
          },
        ],
      })

      return null
    }

    const rendered = renderWithClient(
      queryClient,
      <ErrorBoundary
        fallbackRender={({ error }) => (
          <div>
            <div>error boundary</div>
            <div>{error.message}</div>
          </div>
        )}
      >
        <Page />
      </ErrorBoundary>,
    )

    await waitFor(() => rendered.getByText('error boundary'))
    await waitFor(() => rendered.getByText('single query error'))
    consoleMock.mockRestore()
  })

  it("should throw error if in one of queries' queryFn throws and throwOnError function resolves to true", async () => {
    const consoleMock = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)
    const key1 = queryKey()
    const key2 = queryKey()
    const key3 = queryKey()
    const key4 = queryKey()

    function Page() {
      useQueries({
        queries: [
          {
            queryKey: key1,
            queryFn: () =>
              Promise.reject(
                new Error(
                  'this should not throw because throwOnError function resolves to false',
                ),
              ),
            throwOnError: () => false,
            retry: false,
          },
          {
            queryKey: key2,
            queryFn: async () => 2,
          },
          {
            queryKey: key3,
            queryFn: () => Promise.reject(new Error('single query error')),
            throwOnError: () => true,
            retry: false,
          },
          {
            queryKey: key4,
            queryFn: async () =>
              Promise.reject(
                new Error('this should not throw because query#3 already did'),
              ),
            throwOnError: true,
            retry: false,
          },
        ],
      })

      return null
    }

    const rendered = renderWithClient(
      queryClient,
      <ErrorBoundary
        fallbackRender={({ error }) => (
          <div>
            <div>error boundary</div>
            <div>{error.message}</div>
          </div>
        )}
      >
        <Page />
      </ErrorBoundary>,
    )

    await waitFor(() => rendered.getByText('error boundary'))
    await waitFor(() => rendered.getByText('single query error'))
    consoleMock.mockRestore()
  })

  it('should use provided custom queryClient', async () => {
    const key = queryKey()
    const queryFn = async () => {
      return Promise.resolve('custom client')
    }

    function Page() {
      const queries = useQueries(
        {
          queries: [
            {
              queryKey: key,
              queryFn,
            },
          ],
        },
        queryClient,
      )

      return <div>data: {queries[0].data}</div>
    }

    const rendered = render(<Page></Page>)

    await waitFor(() => rendered.getByText('data: custom client'))
  })

  it('should combine queries', async () => {
    const key1 = queryKey()
    const key2 = queryKey()

    function Page() {
      const queries = useQueries(
        {
          queries: [
            {
              queryKey: key1,
              queryFn: () => Promise.resolve('first result'),
            },
            {
              queryKey: key2,
              queryFn: () => Promise.resolve('second result'),
            },
          ],
          combine: (results) => {
            return {
              combined: true,
              res: results.map((res) => res.data).join(','),
            }
          },
        },
        queryClient,
      )

      return (
        <div>
          <div>
            data: {String(queries.combined)} {queries.res}
          </div>
        </div>
      )
    }

    const rendered = render(<Page />)

    await waitFor(() =>
      rendered.getByText('data: true first result,second result'),
    )
  })

  it('should not return new instances when called without queries', async () => {
    const key = queryKey()
    const ids: Array<number> = []
    let resultChanged = 0

    function Page() {
      const [count, setCount] = React.useState(0)
      const result = useQueries({
        queries: ids.map((id) => {
          return {
            queryKey: [key, id],
            queryFn: async () => async () => {
              return {
                id,
                content: { value: Math.random() },
              }
            },
          }
        }),
        combine: () => ({ empty: 'object' }),
      })

      React.useEffect(() => {
        resultChanged++
      }, [result])

      return (
        <div>
          <div>count: {count}</div>
          <div>data: {JSON.stringify(result)}</div>
          <button onClick={() => setCount((c) => c + 1)}>inc</button>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    await waitFor(() => rendered.getByText('data: {"empty":"object"}'))
    await waitFor(() => rendered.getByText('count: 0'))

    expect(resultChanged).toBe(1)

    fireEvent.click(rendered.getByRole('button', { name: /inc/i }))

    await waitFor(() => rendered.getByText('count: 1'))
    // there should be no further effect calls because the returned object is structurally shared
    expect(resultChanged).toBe(1)
  })

  it('should not have infinite render loops with empty queries (#6645)', async () => {
    let renderCount = 0

    function Page() {
      const result = useQueries({
        queries: [],
      })

      React.useEffect(() => {
        renderCount++
      })

      return <div>data: {JSON.stringify(result)}</div>
    }

    renderWithClient(queryClient, <Page />)

    await sleep(10)

    expect(renderCount).toBe(1)
  })

  it('should only call combine with query results', async () => {
    const key1 = queryKey()
    const key2 = queryKey()

    function Page() {
      const result = useQueries({
        queries: [
          {
            queryKey: key1,
            queryFn: async () => {
              await sleep(5)
              return Promise.resolve('query1')
            },
          },
          {
            queryKey: key2,
            queryFn: async () => {
              await sleep(20)
              return Promise.resolve('query2')
            },
          },
        ],
        combine: ([query1, query2]) => {
          return {
            data: { query1: query1.data, query2: query2.data },
          }
        },
      })

      return <div>data: {JSON.stringify(result)}</div>
    }

    const rendered = renderWithClient(queryClient, <Page />)
    await waitFor(() =>
      rendered.getByText(
        'data: {"data":{"query1":"query1","query2":"query2"}}',
      ),
    )
  })

  it('should track property access through combine function', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    let count = 0
    const results: Array<unknown> = []

    function Page() {
      const queries = useQueries(
        {
          queries: [
            {
              queryKey: key1,
              queryFn: async () => {
                await sleep(5)
                return Promise.resolve('first result ' + count)
              },
            },
            {
              queryKey: key2,
              queryFn: async () => {
                await sleep(50)
                return Promise.resolve('second result ' + count)
              },
            },
          ],
          combine: (queryResults) => {
            return {
              combined: true,
              refetch: () => queryResults.forEach((res) => res.refetch()),
              res: queryResults
                .flatMap((res) => (res.data ? [res.data] : []))
                .join(','),
            }
          },
        },
        queryClient,
      )

      results.push(queries)

      return (
        <div>
          <div>
            data: {String(queries.combined)} {queries.res}
          </div>
          <button onClick={() => queries.refetch()}>refetch</button>
        </div>
      )
    }

    const rendered = render(<Page />)

    await waitFor(() =>
      rendered.getByText('data: true first result 0,second result 0'),
    )

    expect(results.length).toBe(3)

    expect(results[0]).toStrictEqual({
      combined: true,
      refetch: expect.any(Function),
      res: '',
    })

    expect(results[1]).toStrictEqual({
      combined: true,
      refetch: expect.any(Function),
      res: 'first result 0',
    })

    expect(results[2]).toStrictEqual({
      combined: true,
      refetch: expect.any(Function),
      res: 'first result 0,second result 0',
    })

    count++

    fireEvent.click(rendered.getByRole('button', { name: /refetch/i }))

    await waitFor(() =>
      rendered.getByText('data: true first result 1,second result 1'),
    )

    const length = results.length

    expect([4, 5]).toContain(results.length)

    expect(results[results.length - 1]).toStrictEqual({
      combined: true,
      refetch: expect.any(Function),
      res: 'first result 1,second result 1',
    })

    fireEvent.click(rendered.getByRole('button', { name: /refetch/i }))

    await sleep(100)
    // no further re-render because data didn't change
    expect(results.length).toBe(length)
  })

  it('should synchronously track properties of all observer even if a property (isLoading) is only accessed on one observer (#7000)', async () => {
    const key = queryKey()
    const ids = [1, 2]

    function Page() {
      const { isLoading } = useQueries({
        queries: ids.map((id) => ({
          queryKey: [key, id],
          queryFn: () => {
            return new Promise<{
              id: number
              title: string
            }>((resolve, reject) => {
              if (id === 2) {
                setTimeout(() => {
                  reject(new Error('FAILURE'))
                }, 10)
              }
              setTimeout(() => {
                resolve({ id, title: `Post ${id}` })
              }, 10)
            })
          },
          retry: false,
        })),
        combine: (results) => {
          // this tracks data on all observers
          void results.forEach((result) => result.data)
          return {
            // .some aborts early, so `isLoading` might not be accessed (and thus tracked) on all observers
            // leading to missing re-renders
            isLoading: results.some((result) => result.isLoading),
          }
        },
      })

      return (
        <div>
          <p>Loading Status: {isLoading ? 'Loading...' : 'Loaded'}</p>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    await waitFor(() => rendered.getByText('Loading Status: Loading...'))

    await waitFor(() => rendered.getByText('Loading Status: Loaded'))
  })

  it('should not have stale closures with combine (#6648)', async () => {
    const key = queryKey()

    function Page() {
      const [count, setCount] = React.useState(0)
      const queries = useQueries(
        {
          queries: [
            {
              queryKey: key,
              queryFn: () => Promise.resolve('result'),
            },
          ],
          combine: (results) => {
            return {
              count,
              res: results.map((res) => res.data).join(','),
            }
          },
        },
        queryClient,
      )

      return (
        <div>
          <div>
            data: {String(queries.count)} {queries.res}
          </div>
          <button onClick={() => setCount((c) => c + 1)}>inc</button>
        </div>
      )
    }

    const rendered = render(<Page />)

    await waitFor(() => rendered.getByText('data: 0 result'))

    fireEvent.click(rendered.getByRole('button', { name: /inc/i }))

    await waitFor(() => rendered.getByText('data: 1 result'))
  })

  it('should optimize combine if it is a stable reference', async () => {
    const key1 = queryKey()
    const key2 = queryKey()

    const client = new QueryClient()

    const spy = vi.fn()
    let value = 0

    function Page() {
      const [state, setState] = React.useState(0)
      const queries = useQueries(
        {
          queries: [
            {
              queryKey: key1,
              queryFn: async () => {
                await sleep(10)
                return 'first result:' + value
              },
            },
            {
              queryKey: key2,
              queryFn: async () => {
                await sleep(20)
                return 'second result:' + value
              },
            },
          ],
          combine: React.useCallback((results: Array<QueryObserverResult>) => {
            const result = {
              combined: true,
              res: results.map((res) => res.data).join(','),
            }
            spy(result)
            return result
          }, []),
        },
        client,
      )

      return (
        <div>
          <div>
            data: {String(queries.combined)} {queries.res}
          </div>
          <button onClick={() => setState(state + 1)}>rerender</button>
        </div>
      )
    }

    const rendered = render(<Page />)

    await waitFor(() =>
      rendered.getByText('data: true first result:0,second result:0'),
    )

    // both pending, one pending, both resolved
    expect(spy).toHaveBeenCalledTimes(3)

    await client.refetchQueries()
    // no increase because result hasn't changed
    expect(spy).toHaveBeenCalledTimes(3)

    fireEvent.click(rendered.getByRole('button', { name: /rerender/i }))

    // no increase because just a re-render
    expect(spy).toHaveBeenCalledTimes(3)

    value = 1

    await client.refetchQueries()

    await waitFor(() =>
      rendered.getByText('data: true first result:1,second result:1'),
    )

    // two value changes = two re-renders
    expect(spy).toHaveBeenCalledTimes(5)
  })

  it('should re-run combine if the functional reference changes', async () => {
    const key1 = queryKey()
    const key2 = queryKey()

    const client = new QueryClient()

    const spy = vi.fn()

    function Page() {
      const [state, setState] = React.useState(0)
      const queries = useQueries(
        {
          queries: [
            {
              queryKey: [key1],
              queryFn: async () => {
                await sleep(10)
                return 'first result'
              },
            },
            {
              queryKey: [key2],
              queryFn: async () => {
                await sleep(20)
                return 'second result'
              },
            },
          ],
          combine: React.useCallback(
            (results: Array<QueryObserverResult>) => {
              const result = {
                combined: true,
                state,
                res: results.map((res) => res.data).join(','),
              }
              spy(result)
              return result
            },
            [state],
          ),
        },
        client,
      )

      return (
        <div>
          <div>
            data: {String(queries.state)} {queries.res}
          </div>
          <button onClick={() => setState(state + 1)}>rerender</button>
        </div>
      )
    }

    const rendered = render(<Page />)

    await waitFor(() =>
      rendered.getByText('data: 0 first result,second result'),
    )

    // both pending, one pending, both resolved
    expect(spy).toHaveBeenCalledTimes(3)

    fireEvent.click(rendered.getByRole('button', { name: /rerender/i }))

    // state changed, re-run combine
    expect(spy).toHaveBeenCalledTimes(4)
  })

  it('should not re-render if combine returns a stable reference', async () => {
    const key1 = queryKey()
    const key2 = queryKey()

    const client = new QueryClient()

    const queryFns: Array<string> = []
    let renders = 0

    function Page() {
      const data = useQueries(
        {
          queries: [
            {
              queryKey: [key1],
              queryFn: async () => {
                await sleep(10)
                queryFns.push('first result')
                return 'first result'
              },
            },
            {
              queryKey: [key2],
              queryFn: async () => {
                await sleep(20)
                queryFns.push('second result')
                return 'second result'
              },
            },
          ],
          combine: () => 'foo',
        },
        client,
      )

      renders++

      return (
        <div>
          <div>data: {data}</div>
        </div>
      )
    }

    const rendered = render(<Page />)

    await waitFor(() => rendered.getByText('data: foo'))

    await waitFor(() =>
      expect(queryFns).toEqual(['first result', 'second result']),
    )

    expect(renders).toBe(1)
  })

  it('should re-render once combine returns a different reference', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const key3 = queryKey()

    const client = new QueryClient()

    let renders = 0

    function Page() {
      const data = useQueries(
        {
          queries: [
            {
              queryKey: [key1],
              queryFn: async () => {
                await sleep(10)
                return 'first result'
              },
            },
            {
              queryKey: [key2],
              queryFn: async () => {
                await sleep(15)
                return 'second result'
              },
            },
            {
              queryKey: [key3],
              queryFn: async () => {
                await sleep(20)
                return 'third result'
              },
            },
          ],
          combine: (results) => {
            const isPending = results.some((res) => res.isPending)

            return isPending ? 'pending' : 'foo'
          },
        },
        client,
      )

      renders++

      return (
        <div>
          <div>data: {data}</div>
        </div>
      )
    }

    const rendered = render(<Page />)

    await waitFor(() => rendered.getByText('data: pending'))
    await waitFor(() => rendered.getByText('data: foo'))

    // one with pending, one with foo
    expect(renders).toBe(2)
  })
})
