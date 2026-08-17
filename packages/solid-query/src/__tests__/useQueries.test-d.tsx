import { describe, expectTypeOf, it } from 'vitest'
import { skipToken } from '@tanstack/query-core'
import { queryKey } from '@tanstack/query-test-utils'
import { queryOptions, useQueries } from '..'
import { QueryClient } from '../QueryClient'
import type * as QueryCore from '@tanstack/query-core'
import type { OmitKeyof } from '@tanstack/query-core'
import type {
  QueryFunction,
  QueryFunctionContext,
  QueryKey,
  UseQueryResult,
} from '..'
import type { QueryOptions } from '../types'

describe('useQueries', () => {
  it('TData should have undefined in the union even when initialData is provided as an object', () => {
    const query1 = {
      queryKey: queryKey(),
      queryFn: () => {
        return {
          wow: true,
        }
      },
      initialData: {
        wow: false,
      },
    }

    const query2 = {
      queryKey: queryKey(),
      queryFn: () => 'Query Data',
      initialData: 'initial data',
    }

    const query3 = {
      queryKey: queryKey(),
      queryFn: () => 'Query Data',
    }

    const queryResults = useQueries(() => ({
      queries: [query1, query2, query3],
    }))

    const query1Data = queryResults[0].data
    const query2Data = queryResults[1].data
    const query3Data = queryResults[2].data

    expectTypeOf(query1Data).toEqualTypeOf<{ wow: boolean } | undefined>()
    expectTypeOf(query2Data).toEqualTypeOf<string | undefined>()
    expectTypeOf(query3Data).toEqualTypeOf<string | undefined>()
  })

  it('TData should have undefined in the union when passed through queryOptions', () => {
    const options = queryOptions({
      queryKey: queryKey(),
      queryFn: () => {
        return {
          wow: true,
        }
      },
      initialData: {
        wow: true,
      },
    })
    const queryResults = useQueries(() => ({ queries: [options] }))

    const data = queryResults[0].data

    expectTypeOf(data).toEqualTypeOf<{ wow: boolean } | undefined>()
  })

  it('TData should have undefined in the union when initialData is provided as a function which can return undefined', () => {
    const queryResults = useQueries(() => ({
      queries: [
        {
          queryKey: queryKey(),
          queryFn: () => {
            return {
              wow: true,
            }
          },
          initialData: () => undefined as { wow: boolean } | undefined,
        },
      ],
    }))

    const data = queryResults[0].data

    expectTypeOf(data).toEqualTypeOf<{ wow: boolean } | undefined>()
  })

  it('should infer types from explicit object type parameter', () => {
    const queryResults = useQueries<
      [
        { queryFnData: number },
        { queryFnData: string; error: Error },
        { queryFnData: boolean; data: string },
      ]
    >(() => ({
      queries: [
        {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve(1),
        },
        {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve('data'),
        },
        {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve(true),
          select: () => 'selected',
        },
      ],
    }))

    expectTypeOf(queryResults[0].data).toEqualTypeOf<number | undefined>()
    expectTypeOf(queryResults[1].data).toEqualTypeOf<string | undefined>()
    expectTypeOf(queryResults[1].error).toEqualTypeOf<Error | null>()
    expectTypeOf(queryResults[2].data).toEqualTypeOf<string | undefined>()
  })

  it('should infer types from explicit tuple type parameter', () => {
    const queryResults = useQueries<
      [[number], [string, Error], [boolean, Error, string]]
    >(() => ({
      queries: [
        {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve(1),
        },
        {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve('data'),
        },
        {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve(true),
          select: () => 'selected',
        },
      ],
    }))

    expectTypeOf(queryResults[0].data).toEqualTypeOf<number | undefined>()
    expectTypeOf(queryResults[1].data).toEqualTypeOf<string | undefined>()
    expectTypeOf(queryResults[1].error).toEqualTypeOf<Error | null>()
    expectTypeOf(queryResults[2].data).toEqualTypeOf<string | undefined>()
  })

  it('should be possible to define a different TData than TQueryFnData using select with queryOptions spread into useQueries', () => {
    const query1 = queryOptions({
      queryKey: queryKey(),
      queryFn: () => Promise.resolve(1),
      select: (data) => data > 1,
    })

    const query2 = {
      queryKey: queryKey(),
      queryFn: () => Promise.resolve(1),
      select: (data: number) => data > 1,
    }

    const queryResults = useQueries(() => ({ queries: [query1, query2] }))
    const query1Data = queryResults[0].data
    const query2Data = queryResults[1].data

    expectTypeOf(query1Data).toEqualTypeOf<boolean | undefined>()
    expectTypeOf(query2Data).toEqualTypeOf<boolean | undefined>()
  })

  describe('custom hook', () => {
    it('should allow custom hooks using QueryOptions', () => {
      type Data = string

      const useCustomQueries = (
        options?: OmitKeyof<QueryOptions<Data>, 'queryKey' | 'queryFn'>,
      ) => {
        return useQueries(() => ({
          queries: [
            {
              ...options,
              queryKey: queryKey(),
              queryFn: () => Promise.resolve('data'),
            },
          ],
        }))
      }

      const queryResults = useCustomQueries()
      const data = queryResults[0].data

      expectTypeOf(data).toEqualTypeOf<Data | undefined>()
    })
  })

  it('should infer custom TError from throwOnError', () => {
    class CustomError extends Error {
      code: number
      constructor(code: number) {
        super()
        this.code = code
      }
    }

    const queryResults = useQueries(() => ({
      queries: [
        {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve('data'),
          throwOnError: (_error: CustomError) => false,
        },
      ],
    }))

    expectTypeOf(queryResults[0].error).toEqualTypeOf<CustomError | null>()
  })

  it('TData should have correct type when conditional skipToken is passed', () => {
    const queryResults = useQueries(() => ({
      queries: [
        {
          queryKey: queryKey(),
          queryFn: Math.random() > 0.5 ? skipToken : () => Promise.resolve(5),
        },
      ],
    }))

    const firstResult = queryResults[0]

    expectTypeOf(firstResult).toEqualTypeOf<UseQueryResult<number, Error>>()
    expectTypeOf(firstResult.data).toEqualTypeOf<number | undefined>()
  })

  it('should return correct data for dynamic queries with mixed result types', () => {
    const Queries1 = {
      get: () =>
        queryOptions({
          queryKey: queryKey(),
          queryFn: () => Promise.resolve(1),
        }),
    }
    const Queries2 = {
      get: () =>
        queryOptions({
          queryKey: queryKey(),
          queryFn: () => Promise.resolve(true),
        }),
    }

    const queries1List = [1, 2, 3].map(() => ({ ...Queries1.get() }))
    const result = useQueries(() => ({
      queries: [...queries1List, { ...Queries2.get() }],
    }))

    expectTypeOf(result).toEqualTypeOf<
      [...Array<UseQueryResult<number, Error>>, UseQueryResult<boolean, Error>]
    >()
  })

  it('should accept queryClient as second argument', () => {
    const queryClient = new QueryClient()

    const queryResults = useQueries(
      () => ({
        queries: [
          {
            queryKey: queryKey(),
            queryFn: () => Promise.resolve('data'),
          },
        ],
      }),
      () => queryClient,
    )

    expectTypeOf(queryResults[0].data).toEqualTypeOf<string | undefined>()
  })

  it('should infer correct types for combine callback parameter', () => {
    useQueries(() => ({
      queries: [
        {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve(1),
        },
        {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve('hello'),
        },
      ],
      combine: (results) => {
        expectTypeOf(results[0]).toEqualTypeOf<UseQueryResult<number, Error>>()
        expectTypeOf(results[1]).toEqualTypeOf<UseQueryResult<string, Error>>()
        return results
      },
    }))
  })

  describe('type parameters', () => {
    it('should handle type parameter - tuple of tuples', () => {
      const key1 = queryKey()
      const key2 = queryKey()
      const key3 = queryKey()

      // @ts-expect-error (Page component is not rendered)
      function Page() {
        const result1 = useQueries<
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
        expectTypeOf(result1[0]).toEqualTypeOf<UseQueryResult<number>>()
        expectTypeOf(result1[1]).toEqualTypeOf<UseQueryResult<string>>()
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
          UseQueryResult<string, unknown>
        >()
        expectTypeOf(result2[1]).toEqualTypeOf<
          UseQueryResult<number, unknown>
        >()
        expectTypeOf(result2[0].data).toEqualTypeOf<string | undefined>()
        expectTypeOf(result2[1].data).toEqualTypeOf<number | undefined>()

        // types should be enforced
        useQueries<[[string, unknown, string], [string, boolean, number]]>(
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
        useQueries<[[string]]>(() => ({
          queries: [
            {
              queryKey: key1,
              queryFn: () => 'string',
            },
          ],
        }))
      }
    })

    it('should handle type parameter - tuple of objects', () => {
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
          UseQueryResult<number, unknown>
        >()
        expectTypeOf(result1[1]).toEqualTypeOf<
          UseQueryResult<string, unknown>
        >()
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
          UseQueryResult<string, unknown>
        >()
        expectTypeOf(result2[1]).toEqualTypeOf<
          UseQueryResult<number, unknown>
        >()
        expectTypeOf(result2[0].data).toEqualTypeOf<string | undefined>()
        expectTypeOf(result2[1].data).toEqualTypeOf<number | undefined>()

        // can pass only TData (data prop) although TQueryFnData will be left unknown
        const result3 = useQueries<[{ data: string }, { data: number }]>(
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
          UseQueryResult<string, unknown>
        >()
        expectTypeOf(result3[1]).toEqualTypeOf<
          UseQueryResult<number, unknown>
        >()
        expectTypeOf(result3[0].data).toEqualTypeOf<string | undefined>()
        expectTypeOf(result3[1].data).toEqualTypeOf<number | undefined>()

        // types should be enforced
        useQueries<
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
        useQueries<[{ queryFnData: string }]>(() => ({
          queries: [
            {
              queryKey: key1,
              queryFn: () => 'string',
            },
          ],
        }))
      }
    })

    it('should handle array literal without type parameter to infer result type', () => {
      const key1 = queryKey()
      const key2 = queryKey()
      const key3 = queryKey()
      const key4 = queryKey()

      // @ts-expect-error (Page component is not rendered)
      function Page() {
        // Array.map preserves TQueryFnData
        const result1 = useQueries(() => ({
          queries: Array(50).map((_, i) => ({
            queryKey: ['key', i] as const,
            queryFn: () => i + 10,
          })),
        }))
        expectTypeOf(result1).toEqualTypeOf<
          Array<UseQueryResult<number, Error>>
        >()
        if (result1[0]) {
          expectTypeOf(result1[0].data).toEqualTypeOf<number | undefined>()
        }

        // Array.map preserves TData
        const result2 = useQueries(() => ({
          queries: Array(50).map((_, i) => ({
            queryKey: ['key', i] as const,
            queryFn: () => i + 10,
            select: (data: number) => data.toString(),
          })),
        }))
        expectTypeOf(result2).toEqualTypeOf<
          Array<UseQueryResult<string, Error>>
        >()

        const result3 = useQueries(() => ({
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
        expectTypeOf(result3[0]).toEqualTypeOf<UseQueryResult<number, Error>>()
        expectTypeOf(result3[1]).toEqualTypeOf<UseQueryResult<string, Error>>()
        expectTypeOf(result3[2]).toEqualTypeOf<UseQueryResult<number, Error>>()
        expectTypeOf(result3[0].data).toEqualTypeOf<number | undefined>()
        expectTypeOf(result3[1].data).toEqualTypeOf<string | undefined>()
        // select takes precedence over queryFn
        expectTypeOf(result3[2].data).toEqualTypeOf<number | undefined>()

        // initialData/placeholderData are enforced
        useQueries(() => ({
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
        useQueries(() => ({
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
        useQueries(() => ({
          queries: Array(50).map((_, i) => ({
            queryKey: ['key', i] as const,
            queryFn: () => i + 10,
            select: (data: number) => data.toString(),
          })),
        }))

        useQueries(() => ({
          queries: Array(50).map((_, i) => ({
            queryKey: ['key', i] as const,
            queryFn: () => i + 10,
            select: (data: number) => data.toString(),
          })),
        }))

        // results inference works when all the handlers are defined
        const result4 = useQueries(() => ({
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
        expectTypeOf(result4[0]).toEqualTypeOf<UseQueryResult<string, Error>>()
        expectTypeOf(result4[1]).toEqualTypeOf<UseQueryResult<string, Error>>()
        expectTypeOf(result4[2]).toEqualTypeOf<UseQueryResult<number, Error>>()

        // handles when queryFn returns a Promise
        const result5 = useQueries(() => ({
          queries: [
            {
              queryKey: key1,
              queryFn: () => Promise.resolve('string'),
            },
          ],
        }))
        expectTypeOf(result5[0]).toEqualTypeOf<UseQueryResult<string, Error>>()

        // Array as const does not throw error
        const result6 = useQueries(
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
        expectTypeOf(result6[0]).toEqualTypeOf<UseQueryResult<string, Error>>()
        expectTypeOf(result6[1]).toEqualTypeOf<UseQueryResult<number, Error>>()

        // field names should be enforced - array literal
        useQueries(() => ({
          queries: [
            {
              queryKey: key1,
              queryFn: () => 'string',
            },
          ],
        }))

        // field names should be enforced - Array.map() result
        useQueries(() => ({
          // @ts-expect-error (invalidField)
          queries: Array(10).map(() => ({
            someInvalidField: '',
          })),
        }))

        // field names should be enforced - array literal
        useQueries(() => ({
          queries: [
            {
              queryKey: key1,
              queryFn: () => 'string',
            },
          ],
        }))

        // supports queryFn using fetch() to return Promise<any> - Array.map() result
        useQueries(() => ({
          queries: Array(50).map((_, i) => ({
            queryKey: ['key', i] as const,
            queryFn: () =>
              fetch('return Promise<any>').then((resp) => resp.json()),
          })),
        }))

        // supports queryFn using fetch() to return Promise<any> - array literal
        useQueries(() => ({
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

    it('should handle strongly typed queryFn factories and useQueries wrappers', () => {
      // QueryKey + queryFn factory
      type QueryKeyA = ['queryA']
      const getQueryKeyA = (): QueryKeyA => ['queryA']
      type GetQueryFunctionA = () => QueryFunction<number, QueryKeyA>
      const getQueryFunctionA: GetQueryFunctionA = () => () => {
        return 1
      }
      type SelectorA = (data: number) => [number, string]
      const getSelectorA = (): SelectorA => (data) => [data, data.toString()]

      type QueryKeyB = ['queryB', string]
      const getQueryKeyB = (id: string): QueryKeyB => ['queryB', id]
      type GetQueryFunctionB = () => QueryFunction<string, QueryKeyB>
      const getQueryFunctionB: GetQueryFunctionB = () => () => {
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
      >(queries: Array<QueryOptions<TQueryFnData, TError, TData, TQueryKey>>) {
        return useQueries(() => ({
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
                      // eslint-disable-next-line vitest/valid-expect
                      expectTypeOf<TQueryKey>(ctx.queryKey)
                      return (
                        fn as QueryFunction<TQueryFnData, TQueryKey>
                      ).call({}, ctx)
                    }
                  : undefined,
              }
            },
          ),
        }))
      }

      // @ts-expect-error (Page component is not rendered)
      function Page() {
        const result = useQueries(() => ({
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
        expectTypeOf(result[0]).toEqualTypeOf<UseQueryResult<number, Error>>()
        expectTypeOf(result[1]).toEqualTypeOf<UseQueryResult<string, Error>>()

        const withSelector = useQueries(() => ({
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
  })
})
