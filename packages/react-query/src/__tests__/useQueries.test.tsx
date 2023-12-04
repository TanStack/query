import { describe, expect, expectTypeOf, it, vi } from 'vitest'
import { fireEvent, render, waitFor } from '@testing-library/react'
import * as React from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { QueryCache, queryOptions, useQueries } from '..'
import {
  createQueryClient,
  expectTypeNotAny,
  queryKey,
  renderWithClient,
  sleep,
} from './utils'
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
    // eslint-disable-next-line
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
      expectTypeOf<QueryObserverResult<number, unknown>>(result1[0])
      expectTypeOf<QueryObserverResult<string, unknown>>(result1[1])
      expectTypeOf<QueryObserverResult<Array<string>, boolean>>(result1[2])
      expectTypeOf<number | undefined>(result1[0].data)
      expectTypeOf<string | undefined>(result1[1].data)
      expectTypeOf<Array<string> | undefined>(result1[2].data)
      expectTypeOf<boolean | null>(result1[2].error)

      // TData (3rd element) takes precedence over TQueryFnData (1st element)
      const result2 = useQueries<
        [[string, unknown, string], [string, unknown, number]]
      >({
        queries: [
          {
            queryKey: key1,
            queryFn: () => 'string',
            select: (a) => {
              expectTypeOf<string>(a)
              expectTypeNotAny(a)
              return a.toLowerCase()
            },
          },
          {
            queryKey: key2,
            queryFn: () => 'string',
            select: (a) => {
              expectTypeOf<string>(a)
              expectTypeNotAny(a)
              return parseInt(a)
            },
          },
        ],
      })
      expectTypeOf<QueryObserverResult<string, unknown>>(result2[0])
      expectTypeOf<QueryObserverResult<number, unknown>>(result2[1])
      expectTypeOf<string | undefined>(result2[0].data)
      expectTypeOf<number | undefined>(result2[1].data)

      // types should be enforced
      useQueries<[[string, unknown, string], [string, boolean, number]]>({
        queries: [
          {
            queryKey: key1,
            queryFn: () => 'string',
            select: (a) => {
              expectTypeOf<string>(a)
              expectTypeNotAny(a)
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
              expectTypeOf<string>(a)
              expectTypeNotAny(a)
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
    // eslint-disable-next-line
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
      expectTypeOf<QueryObserverResult<number, unknown>>(result1[0])
      expectTypeOf<QueryObserverResult<string, unknown>>(result1[1])
      expectTypeOf<QueryObserverResult<Array<string>, boolean>>(result1[2])
      expectTypeOf<number | undefined>(result1[0].data)
      expectTypeOf<string | undefined>(result1[1].data)
      expectTypeOf<Array<string> | undefined>(result1[2].data)
      expectTypeOf<boolean | null>(result1[2].error)

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
              expectTypeOf<string>(a)
              expectTypeNotAny(a)
              return a.toLowerCase()
            },
          },
          {
            queryKey: key2,
            queryFn: () => 'string',
            select: (a) => {
              expectTypeOf<string>(a)
              expectTypeNotAny(a)
              return parseInt(a)
            },
          },
        ],
      })
      expectTypeOf<QueryObserverResult<string, unknown>>(result2[0])
      expectTypeOf<QueryObserverResult<number, unknown>>(result2[1])
      expectTypeOf<string | undefined>(result2[0].data)
      expectTypeOf<number | undefined>(result2[1].data)

      // can pass only TData (data prop) although TQueryFnData will be left unknown
      const result3 = useQueries<[{ data: string }, { data: number }]>({
        queries: [
          {
            queryKey: key1,
            queryFn: () => 'string',
            select: (a) => {
              expectTypeOf<unknown>(a)
              expectTypeNotAny(a)
              return a as string
            },
          },
          {
            queryKey: key2,
            queryFn: () => 'string',
            select: (a) => {
              expectTypeOf<unknown>(a)
              expectTypeNotAny(a)
              return a as number
            },
          },
        ],
      })
      expectTypeOf<QueryObserverResult<string, unknown>>(result3[0])
      expectTypeOf<QueryObserverResult<number, unknown>>(result3[1])
      expectTypeOf<string | undefined>(result3[0].data)
      expectTypeOf<number | undefined>(result3[1].data)

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
              expectTypeOf<string>(a)
              expectTypeNotAny(a)
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
              expectTypeOf<string>(a)
              expectTypeNotAny(a)
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

  it('correctly returns types when passing through queryOptions ', () => {
    // @ts-expect-error (Page component is not rendered)
    // eslint-disable-next-line
    function Page() {
      // data and results types are correct when using queryOptions
      const result4 = useQueries({
        queries: [
          queryOptions({
            queryKey: ['key1'],
            queryFn: () => 'string',
            select: (a) => {
              expectTypeOf<string>(a)
              expectTypeNotAny(a)
              return a.toLowerCase()
            },
          }),
          queryOptions({
            queryKey: ['key2'],
            queryFn: () => 'string',
            select: (a) => {
              expectTypeOf<string>(a)
              expectTypeNotAny(a)
              return parseInt(a)
            },
          }),
        ],
      })
      expectTypeOf<QueryObserverResult<string, unknown>>(result4[0])
      expectTypeOf<QueryObserverResult<number, unknown>>(result4[1])
      expectTypeOf<string | undefined>(result4[0].data)
      expectTypeOf<number | undefined>(result4[1].data)
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
    // eslint-disable-next-line
    function Page() {
      // Array.map preserves TQueryFnData
      const result1 = useQueries({
        queries: Array(50).map((_, i) => ({
          queryKey: ['key', i] as const,
          queryFn: () => i + 10,
        })),
      })
      expectTypeOf<Array<QueryObserverResult<number, unknown>>>(result1)
      expectTypeOf<number | undefined>(result1[0]?.data)

      // Array.map preserves TError
      const result1_err = useQueries({
        queries: Array(50).map((_, i) => ({
          queryKey: ['key', i] as const,
          queryFn: () => i + 10,
          throwOnError,
        })),
      })
      expectTypeOf<Array<QueryObserverResult<number, unknown>>>(result1_err)
      expectTypeOf<number | undefined>(result1_err[0]?.data)
      expectTypeOf<BizError | null | undefined>(result1_err[0]?.error)

      // Array.map preserves TData
      const result2 = useQueries({
        queries: Array(50).map((_, i) => ({
          queryKey: ['key', i] as const,
          queryFn: () => i + 10,
          select: (data: number) => data.toString(),
        })),
      })
      expectTypeOf<Array<QueryObserverResult<string, unknown>>>(result2)

      const result2_err = useQueries({
        queries: Array(50).map((_, i) => ({
          queryKey: ['key', i] as const,
          queryFn: () => i + 10,
          select: (data: number) => data.toString(),
          throwOnError,
        })),
      })
      expectTypeOf<Array<QueryObserverResult<string, BizError>>>(result2_err)

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
      expectTypeOf<QueryObserverResult<number, unknown>>(result3[0])
      expectTypeOf<QueryObserverResult<string, unknown>>(result3[1])
      expectTypeOf<QueryObserverResult<number, unknown>>(result3[2])
      expectTypeOf<number | undefined>(result3[0].data)
      expectTypeOf<string | undefined>(result3[1].data)
      expectTypeOf<string | undefined>(result3[3].data)
      // select takes precedence over queryFn
      expectTypeOf<number | undefined>(result3[2].data)
      // infer TError from throwOnError
      expectTypeOf<BizError | null | undefined>(result3[3].error)

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
      expectTypeOf<QueryObserverResult<string, unknown>>(result4[0])
      expectTypeOf<QueryObserverResult<string, unknown>>(result4[1])
      expectTypeOf<QueryObserverResult<number, unknown>>(result4[2])
      expectTypeOf<QueryObserverResult<number, BizError>>(result4[3])

      // handles when queryFn returns a Promise
      const result5 = useQueries({
        queries: [
          {
            queryKey: key1,
            queryFn: () => Promise.resolve('string'),
          },
        ],
      })
      expectTypeOf<QueryObserverResult<string, unknown>>(result5[0])

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
      expectTypeOf<QueryObserverResult<string, unknown>>(result6[0])
      expectTypeOf<QueryObserverResult<number, unknown>>(result6[1])
      expectTypeOf<QueryObserverResult<string, BizError>>(result6[2])

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
            expectTypeOf<QueryFunction<TQueryFnData, TQueryKey> | undefined>(fn)
            return {
              queryKey: key,
              queryFn: fn
                ? (ctx: QueryFunctionContext<TQueryKey>) => {
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
    // eslint-disable-next-line
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
      expectTypeOf<QueryObserverResult<number, unknown>>(result[0])
      expectTypeOf<QueryObserverResult<string, unknown>>(result[1])

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
      expectTypeOf<QueryObserverResult<[number, string], unknown>>(
        withSelector[0],
      )
      expectTypeOf<QueryObserverResult<[string, number], unknown>>(
        withSelector[1],
      )

      const withWrappedQueries = useWrappedQueries(
        Array(10).map(() => ({
          queryKey: getQueryKeyA(),
          queryFn: getQueryFunctionA(),
          select: getSelectorA(),
        })),
      )

      expectTypeOf<Array<QueryObserverResult<number | undefined, unknown>>>(
        withWrappedQueries,
      )
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
})
