import { fireEvent, render, waitFor } from '@testing-library/react'
import * as React from 'react'
import { ErrorBoundary } from 'react-error-boundary'

import type { QueryFunctionContext } from '@tanstack/query-core'
import { vi } from 'vitest'
import type {
  QueryFunction,
  QueryKey,
  QueryObserverResult,
  UseQueryOptions,
  UseQueryResult,
} from '..'
import { QueryCache, useQueries } from '..'
import {
  createQueryClient,
  expectType,
  expectTypeNotAny,
  queryKey,
  renderWithClient,
  sleep,
} from './utils'

describe('useQueries', () => {
  const queryCache = new QueryCache()
  const queryClient = createQueryClient({ queryCache })

  it('should return the correct states', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const results: UseQueryResult[][] = []

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
    const results: UseQueryResult[][] = []
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
      const result1 = useQueries<[[number], [string], [string[], boolean]]>({
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
      expectType<QueryObserverResult<number, unknown>>(result1[0])
      expectType<QueryObserverResult<string, unknown>>(result1[1])
      expectType<QueryObserverResult<string[], boolean>>(result1[2])
      expectType<number | undefined>(result1[0].data)
      expectType<string | undefined>(result1[1].data)
      expectType<string[] | undefined>(result1[2].data)
      expectType<boolean | null>(result1[2].error)

      // TData (3rd element) takes precedence over TQueryFnData (1st element)
      const result2 = useQueries<
        [[string, unknown, string], [string, unknown, number]]
      >({
        queries: [
          {
            queryKey: key1,
            queryFn: () => 'string',
            select: (a) => {
              expectType<string>(a)
              expectTypeNotAny(a)
              return a.toLowerCase()
            },
          },
          {
            queryKey: key2,
            queryFn: () => 'string',
            select: (a) => {
              expectType<string>(a)
              expectTypeNotAny(a)
              return parseInt(a)
            },
          },
        ],
      })
      expectType<QueryObserverResult<string, unknown>>(result2[0])
      expectType<QueryObserverResult<number, unknown>>(result2[1])
      expectType<string | undefined>(result2[0].data)
      expectType<number | undefined>(result2[1].data)

      // types should be enforced
      useQueries<[[string, unknown, string], [string, boolean, number]]>({
        queries: [
          {
            queryKey: key1,
            queryFn: () => 'string',
            select: (a) => {
              expectType<string>(a)
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
              expectType<string>(a)
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
          { queryFnData: string[]; error: boolean },
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
      expectType<QueryObserverResult<number, unknown>>(result1[0])
      expectType<QueryObserverResult<string, unknown>>(result1[1])
      expectType<QueryObserverResult<string[], boolean>>(result1[2])
      expectType<number | undefined>(result1[0].data)
      expectType<string | undefined>(result1[1].data)
      expectType<string[] | undefined>(result1[2].data)
      expectType<boolean | null>(result1[2].error)

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
              expectType<string>(a)
              expectTypeNotAny(a)
              return a.toLowerCase()
            },
          },
          {
            queryKey: key2,
            queryFn: () => 'string',
            select: (a) => {
              expectType<string>(a)
              expectTypeNotAny(a)
              return parseInt(a)
            },
          },
        ],
      })
      expectType<QueryObserverResult<string, unknown>>(result2[0])
      expectType<QueryObserverResult<number, unknown>>(result2[1])
      expectType<string | undefined>(result2[0].data)
      expectType<number | undefined>(result2[1].data)

      // can pass only TData (data prop) although TQueryFnData will be left unknown
      const result3 = useQueries<[{ data: string }, { data: number }]>({
        queries: [
          {
            queryKey: key1,
            queryFn: () => 'string',
            select: (a) => {
              expectType<unknown>(a)
              expectTypeNotAny(a)
              return a as string
            },
          },
          {
            queryKey: key2,
            queryFn: () => 'string',
            select: (a) => {
              expectType<unknown>(a)
              expectTypeNotAny(a)
              return a as number
            },
          },
        ],
      })
      expectType<QueryObserverResult<string, unknown>>(result3[0])
      expectType<QueryObserverResult<number, unknown>>(result3[1])
      expectType<string | undefined>(result3[0].data)
      expectType<number | undefined>(result3[1].data)

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
              expectType<string>(a)
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
              expectType<string>(a)
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

  it('handles array literal without type parameter to infer result type', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const key3 = queryKey()
    const key4 = queryKey()

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
      expectType<QueryObserverResult<number, unknown>[]>(result1)
      expectType<number | undefined>(result1[0]?.data)

      // Array.map preserves TData
      const result2 = useQueries({
        queries: Array(50).map((_, i) => ({
          queryKey: ['key', i] as const,
          queryFn: () => i + 10,
          select: (data: number) => data.toString(),
        })),
      })
      expectType<QueryObserverResult<string, unknown>[]>(result2)

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
        ],
      })
      expectType<QueryObserverResult<number, unknown>>(result3[0])
      expectType<QueryObserverResult<string, unknown>>(result3[1])
      expectType<QueryObserverResult<number, unknown>>(result3[2])
      expectType<number | undefined>(result3[0].data)
      expectType<string | undefined>(result3[1].data)
      // select takes precedence over queryFn
      expectType<number | undefined>(result3[2].data)

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

      // select params are "indirectly" enforced
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
        ],
      })
      expectType<QueryObserverResult<string, unknown>>(result4[0])
      expectType<QueryObserverResult<string, unknown>>(result4[1])
      expectType<QueryObserverResult<number, unknown>>(result4[2])

      // handles when queryFn returns a Promise
      const result5 = useQueries({
        queries: [
          {
            queryKey: key1,
            queryFn: () => Promise.resolve('string'),
          },
        ],
      })
      expectType<QueryObserverResult<string, unknown>>(result5[0])

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
        ],
      } as const)
      expectType<QueryObserverResult<string, unknown>>(result6[0])
      expectType<QueryObserverResult<number, unknown>>(result6[1])

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
    >(queries: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>[]) {
      return useQueries({
        queries: queries.map(
          // no need to type the mapped query
          (query) => {
            const { queryFn: fn, queryKey: key } = query
            expectType<QueryFunction<TQueryFnData, TQueryKey> | undefined>(fn)
            return {
              queryKey: key,
              queryFn: fn
                ? (ctx: QueryFunctionContext<TQueryKey>) => {
                    expectType<TQueryKey>(ctx.queryKey)
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
      expectType<QueryObserverResult<number, unknown>>(result[0])
      expectType<QueryObserverResult<string, unknown>>(result[1])

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
      expectType<QueryObserverResult<[number, string], unknown>>(
        withSelector[0],
      )
      expectType<QueryObserverResult<[string, number], unknown>>(
        withSelector[1],
      )

      const withWrappedQueries = useWrappedQueries(
        Array(10).map(() => ({
          queryKey: getQueryKeyA(),
          queryFn: getQueryFunctionA(),
          select: getSelectorA(),
        })),
      )

      expectType<QueryObserverResult<number | undefined, unknown>[]>(
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
                await sleep(10)
                return Promise.resolve('first result ' + count)
              },
            },
            {
              queryKey: key2,
              queryFn: async () => {
                await sleep(20)
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

    expect(results.length).toBe(5)

    expect(results[3]).toStrictEqual({
      combined: true,
      refetch: expect.any(Function),
      res: 'first result 1,second result 0',
    })

    expect(results[4]).toStrictEqual({
      combined: true,
      refetch: expect.any(Function),
      res: 'first result 1,second result 1',
    })

    fireEvent.click(rendered.getByRole('button', { name: /refetch/i }))

    await sleep(50)
    // no further re-render because data didn't change
    expect(results.length).toBe(5)
  })
})
