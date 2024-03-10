import { describe, expect, expectTypeOf, it, vi } from 'vitest'
import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import * as QueryCore from '@tanstack/query-core'
import { createRenderEffect, createSignal } from 'solid-js'
import {
  QueriesObserver,
  QueryCache,
  QueryClientProvider,
  createQueries,
} from '..'
import { createQueryClient, queryKey, sleep } from './utils'
import type { QueryFunctionContext, QueryKey } from '@tanstack/query-core'
import type { CreateQueryResult, QueryFunction, SolidQueryOptions } from '..'

describe('useQueries', () => {
  const queryCache = new QueryCache()
  const queryClient = createQueryClient({ queryCache })

  it('should return the correct states', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const results: Array<Array<CreateQueryResult>> = []

    function Page() {
      const result = createQueries(() => ({
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
              await sleep(100)
              return 2
            },
          },
        ],
      }))

      createRenderEffect(() => {
        results.push([{ ...result[0] }, { ...result[1] }])
      })

      return (
        <div>
          <div>
            data1: {String(result[0].data ?? 'null')}, data2:{' '}
            {String(result[1].data ?? 'null')}
          </div>
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await waitFor(() => rendered.getByText('data1: 1, data2: 2'))

    expect(results.length).toBe(3)
    expect(results[0]).toMatchObject([{ data: undefined }, { data: undefined }])
    expect(results[1]).toMatchObject([{ data: 1 }, { data: undefined }])
    expect(results[2]).toMatchObject([{ data: 1 }, { data: 2 }])
  })

  it('handles type parameter - tuple of tuples', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const key3 = queryKey()

    // @ts-expect-error (Page component is not rendered)
    function Page() {
      const result1 = createQueries<
        [[number], [string], [Array<string>, boolean]]
      >(() => ({
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
      }))
      expectTypeOf(result1[0]).toEqualTypeOf<CreateQueryResult<number>>()
      expectTypeOf(result1[1]).toEqualTypeOf<CreateQueryResult<string>>()
      expectTypeOf(result1[2]).toEqualTypeOf<
        CreateQueryResult<Array<string>, boolean>
      >()
      expectTypeOf(result1[0].data).toEqualTypeOf<number | undefined>()
      expectTypeOf(result1[1].data).toEqualTypeOf<string | undefined>()
      expectTypeOf(result1[2].data).toEqualTypeOf<Array<string> | undefined>()
      expectTypeOf(result1[2].error).toEqualTypeOf<boolean | null>()

      // TData (3rd element) takes precedence over TQueryFnData (1st element)
      const result2 = createQueries<
        [[string, unknown, string], [string, unknown, number]]
      >(() => ({
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
      }))
      expectTypeOf(result2[0]).toEqualTypeOf<
        CreateQueryResult<string, unknown>
      >()
      expectTypeOf(result2[1]).toEqualTypeOf<
        CreateQueryResult<number, unknown>
      >()
      expectTypeOf(result2[0].data).toEqualTypeOf<string | undefined>()
      expectTypeOf(result2[1].data).toEqualTypeOf<number | undefined>()

      // types should be enforced
      createQueries<[[string, unknown, string], [string, boolean, number]]>(
        () => ({
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
        }),
      )

      // field names should be enforced
      createQueries<[[string]]>(() => ({
        queries: [
          {
            queryKey: key1,
            queryFn: () => 'string',
          },
        ],
      }))
    }
  })

  it('handles type parameter - tuple of objects', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const key3 = queryKey()

    // @ts-expect-error (Page component is not rendered)
    function Page() {
      const result1 = createQueries<
        [
          { queryFnData: number },
          { queryFnData: string },
          { queryFnData: Array<string>; error: boolean },
        ]
      >(() => ({
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
      }))
      expectTypeOf(result1[0]).toEqualTypeOf<
        CreateQueryResult<number, unknown>
      >()
      expectTypeOf(result1[1]).toEqualTypeOf<
        CreateQueryResult<string, unknown>
      >()
      expectTypeOf(result1[2]).toEqualTypeOf<
        CreateQueryResult<Array<string>, boolean>
      >()
      expectTypeOf(result1[0].data).toEqualTypeOf<number | undefined>()
      expectTypeOf(result1[1].data).toEqualTypeOf<string | undefined>()
      expectTypeOf(result1[2].data).toEqualTypeOf<Array<string> | undefined>()
      expectTypeOf(result1[2].error).toEqualTypeOf<boolean | null>()

      // TData (data prop) takes precedence over TQueryFnData (queryFnData prop)
      const result2 = createQueries<
        [
          { queryFnData: string; data: string },
          { queryFnData: string; data: number },
        ]
      >(() => ({
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
      }))
      expectTypeOf(result2[0]).toEqualTypeOf<
        CreateQueryResult<string, unknown>
      >()
      expectTypeOf(result2[1]).toEqualTypeOf<
        CreateQueryResult<number, unknown>
      >()
      expectTypeOf(result2[0].data).toEqualTypeOf<string | undefined>()
      expectTypeOf(result2[1].data).toEqualTypeOf<number | undefined>()

      // can pass only TData (data prop) although TQueryFnData will be left unknown
      const result3 = createQueries<[{ data: string }, { data: number }]>(
        () => ({
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
        }),
      )
      expectTypeOf(result3[0]).toEqualTypeOf<
        CreateQueryResult<string, unknown>
      >()
      expectTypeOf(result3[1]).toEqualTypeOf<
        CreateQueryResult<number, unknown>
      >()
      expectTypeOf(result3[0].data).toEqualTypeOf<string | undefined>()
      expectTypeOf(result3[1].data).toEqualTypeOf<number | undefined>()

      // types should be enforced
      createQueries<
        [
          { queryFnData: string; data: string },
          { queryFnData: string; data: number; error: boolean },
        ]
      >(() => ({
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
      }))

      // field names should be enforced
      createQueries<[{ queryFnData: string }]>(() => ({
        queries: [
          {
            queryKey: key1,
            queryFn: () => 'string',
          },
        ],
      }))
    }
  })

  it('handles array literal without type parameter to infer result type', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const key3 = queryKey()
    const key4 = queryKey()

    // @ts-expect-error (Page component is not rendered)
    function Page() {
      // Array.map preserves TQueryFnData
      const result1 = createQueries(() => ({
        queries: Array(50).map((_, i) => ({
          queryKey: ['key', i] as const,
          queryFn: () => i + 10,
        })),
      }))
      expectTypeOf(result1).toEqualTypeOf<
        Array<CreateQueryResult<number, Error>>
      >()
      if (result1[0]) {
        expectTypeOf(result1[0].data).toEqualTypeOf<number | undefined>()
      }

      // Array.map preserves TData
      const result2 = createQueries(() => ({
        queries: Array(50).map((_, i) => ({
          queryKey: ['key', i] as const,
          queryFn: () => i + 10,
          select: (data: number) => data.toString(),
        })),
      }))
      expectTypeOf(result2).toEqualTypeOf<
        Array<CreateQueryResult<string, Error>>
      >()

      const result3 = createQueries(() => ({
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
      }))
      expectTypeOf(result3[0]).toEqualTypeOf<CreateQueryResult<number, Error>>()
      expectTypeOf(result3[1]).toEqualTypeOf<CreateQueryResult<string, Error>>()
      expectTypeOf(result3[2]).toEqualTypeOf<CreateQueryResult<number, Error>>()
      expectTypeOf(result3[0].data).toEqualTypeOf<number | undefined>()
      expectTypeOf(result3[1].data).toEqualTypeOf<string | undefined>()
      // select takes precedence over queryFn
      expectTypeOf(result3[2].data).toEqualTypeOf<number | undefined>()

      // initialData/placeholderData are enforced
      createQueries(() => ({
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
      }))

      // select params are "indirectly" enforced
      createQueries(() => ({
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
      }))

      // callbacks are also indirectly enforced with Array.map
      createQueries(() => ({
        queries: Array(50).map((_, i) => ({
          queryKey: ['key', i] as const,
          queryFn: () => i + 10,
          select: (data: number) => data.toString(),
        })),
      }))

      createQueries(() => ({
        queries: Array(50).map((_, i) => ({
          queryKey: ['key', i] as const,
          queryFn: () => i + 10,
          select: (data: number) => data.toString(),
        })),
      }))

      // results inference works when all the handlers are defined
      const result4 = createQueries(() => ({
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
      }))
      expectTypeOf(result4[0]).toEqualTypeOf<CreateQueryResult<string, Error>>()
      expectTypeOf(result4[1]).toEqualTypeOf<CreateQueryResult<string, Error>>()
      expectTypeOf(result4[2]).toEqualTypeOf<CreateQueryResult<number, Error>>()

      // handles when queryFn returns a Promise
      const result5 = createQueries(() => ({
        queries: [
          {
            queryKey: key1,
            queryFn: () => Promise.resolve('string'),
          },
        ],
      }))
      expectTypeOf(result5[0]).toEqualTypeOf<CreateQueryResult<string, Error>>()

      // Array as const does not throw error
      const result6 = createQueries(
        () =>
          ({
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
          }) as const,
      )
      expectTypeOf(result6[0]).toEqualTypeOf<CreateQueryResult<string, Error>>()
      expectTypeOf(result6[1]).toEqualTypeOf<CreateQueryResult<number, Error>>()

      // field names should be enforced - array literal
      createQueries(() => ({
        queries: [
          {
            queryKey: key1,
            queryFn: () => 'string',
          },
        ],
      }))

      // field names should be enforced - Array.map() result
      createQueries(() => ({
        // @ts-expect-error (invalidField)
        queries: Array(10).map(() => ({
          someInvalidField: '',
        })),
      }))

      // field names should be enforced - array literal
      createQueries(() => ({
        queries: [
          {
            queryKey: key1,
            queryFn: () => 'string',
          },
        ],
      }))

      // supports queryFn using fetch() to return Promise<any> - Array.map() result
      createQueries(() => ({
        queries: Array(50).map((_, i) => ({
          queryKey: ['key', i] as const,
          queryFn: () =>
            fetch('return Promise<any>').then((resp) => resp.json()),
        })),
      }))

      // supports queryFn using fetch() to return Promise<any> - array literal
      createQueries(() => ({
        queries: [
          {
            queryKey: key1,
            queryFn: () =>
              fetch('return Promise<any>').then((resp) => resp.json()),
          },
        ],
      }))
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
    >(
      queries: Array<SolidQueryOptions<TQueryFnData, TError, TData, TQueryKey>>,
    ) {
      return createQueries(() => ({
        queries: queries.map(
          // no need to type the mapped query
          (query) => {
            const { queryFn: fn, queryKey: key } = query
            expectTypeOf(fn).toEqualTypeOf<
              | typeof QueryCore.skipToken
              | QueryCore.QueryFunction<TQueryFnData, TQueryKey, never>
              | undefined
            >()
            return {
              queryKey: key,
              queryFn: fn
                ? (ctx: QueryFunctionContext<TQueryKey>) => {
                    expectTypeOf<TQueryKey>(ctx.queryKey)
                    return (fn as QueryFunction<TQueryFnData, TQueryKey>).call(
                      {},
                      ctx,
                    )
                  }
                : undefined,
            }
          },
        ),
      }))
    }

    // @ts-expect-error (Page component is not rendered)
    function Page() {
      const result = createQueries(() => ({
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
      }))
      expectTypeOf(result[0]).toEqualTypeOf<CreateQueryResult<number, Error>>()
      expectTypeOf(result[1]).toEqualTypeOf<CreateQueryResult<string, Error>>()

      const withSelector = createQueries(() => ({
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
      }))
      expectTypeOf(withSelector[0]).toEqualTypeOf<
        CreateQueryResult<[number, string], Error>
      >()
      expectTypeOf(withSelector[1]).toEqualTypeOf<
        CreateQueryResult<[string, number], Error>
      >()

      const withWrappedQueries = useWrappedQueries(
        Array(10).map(() => ({
          queryKey: getQueryKeyA(),
          queryFn: getQueryFunctionA(),
          select: getSelectorA(),
        })),
      )

      expectTypeOf(withWrappedQueries).toEqualTypeOf<
        Array<CreateQueryResult<number, Error>>
      >()
    }
  })

  it('should not change state if unmounted', async () => {
    const key1 = queryKey()

    // We have to mock the QueriesObserver to not unsubscribe
    // the listener when the component is unmounted
    class QueriesObserverMock extends QueriesObserver {
      subscribe(listener: any) {
        super.subscribe(listener)
        return () => void 0
      }
    }

    const QueriesObserverSpy = vi
      .spyOn(QueryCore, 'QueriesObserver')
      .mockImplementation((fn) => {
        return new QueriesObserverMock(fn, [])
      })

    function Queries() {
      createQueries(() => ({
        queries: [
          {
            queryKey: key1,
            queryFn: async () => {
              await sleep(10)
              return 1
            },
          },
        ],
      }))

      return (
        <div>
          <span>queries</span>
        </div>
      )
    }

    function Page() {
      const [mounted, setMounted] = createSignal(true)

      return (
        <div>
          <button onClick={() => setMounted(false)}>unmount</button>
          {mounted() && <Queries />}
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    fireEvent.click(rendered.getByText('unmount'))

    // Should not display the console error
    // "Warning: Can't perform a React state update on an unmounted component"

    await sleep(20)
    QueriesObserverSpy.mockRestore()
  })
})
