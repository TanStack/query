import { queryKey } from '@tanstack/query-test-utils'
import { describe, expectTypeOf, it } from 'vitest'

import { skipToken } from '..'
import type { OmitKeyof, QueryFunction, QueryKey } from '..'
import { queryOptions } from '../queryOptions'
import type { UseQueryOptions, UseQueryResult } from '../types'
import { useQueries } from '../useQueries'
import type { QueryFunctionContext } from '@tanstack/query-core'

describe('useQueries', () => {
  describe('config object overload', () => {
    it('TData should always be defined when initialData is provided as an object', () => {
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

      const queryResults = useQueries({ queries: [query1, query2, query3] })

      const query1Data = queryResults[0].data
      const query2Data = queryResults[1].data
      const query3Data = queryResults[2].data

      expectTypeOf(query1Data).toEqualTypeOf<{ wow: boolean }>()
      expectTypeOf(query2Data).toEqualTypeOf<string>()
      expectTypeOf(query3Data).toEqualTypeOf<string | undefined>()
    })

    it('TData should be defined when passed through queryOptions', () => {
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
      const queryResults = useQueries({ queries: [options] })

      const data = queryResults[0].data

      expectTypeOf(data).toEqualTypeOf<{ wow: boolean }>()
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

      const queryResults = useQueries({ queries: [query1, query2] })
      const query1Data = queryResults[0].data
      const query2Data = queryResults[1].data

      expectTypeOf(query1Data).toEqualTypeOf<boolean | undefined>()
      expectTypeOf(query2Data).toEqualTypeOf<boolean | undefined>()
    })

    it('TData should have undefined in the union when initialData is provided as a function which can return undefined', () => {
      const queryResults = useQueries({
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
      })

      const data = queryResults[0].data

      expectTypeOf(data).toEqualTypeOf<{ wow: boolean } | undefined>()
    })

    describe('custom hook', () => {
      it('should allow custom hooks using UseQueryOptions', () => {
        type Data = string

        const useCustomQueries = (
          options?: OmitKeyof<UseQueryOptions<Data>, 'queryKey' | 'queryFn'>,
        ) => {
          return useQueries({
            queries: [
              {
                ...options,
                queryKey: queryKey(),
                queryFn: () => Promise.resolve('data'),
              },
            ],
          })
        }

        const queryResults = useCustomQueries()
        const data = queryResults[0].data

        expectTypeOf(data).toEqualTypeOf<Data | undefined>()
      })
    })

    it('TData should have correct type when conditional skipToken is passed', () => {
      const queryResults = useQueries({
        queries: [
          {
            queryKey: queryKey(),
            queryFn: Math.random() > 0.5 ? skipToken : () => Promise.resolve(5),
          },
        ],
      })

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
      const result = useQueries({
        queries: [...queries1List, { ...Queries2.get() }],
      })

      expectTypeOf(result).toEqualTypeOf<
        [
          ...Array<UseQueryResult<number, Error>>,
          UseQueryResult<boolean, Error>,
        ]
      >()
    })
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
                return parseInt(a, 10)
              },
            },
          ],
        })
        expectTypeOf(result2[0]).toEqualTypeOf<
          UseQueryResult<string, unknown>
        >()
        expectTypeOf(result2[1]).toEqualTypeOf<
          UseQueryResult<number, unknown>
        >()
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
                return parseInt(a, 10)
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
                return parseInt(a, 10)
              },
            },
          ],
        })
        expectTypeOf(result2[0]).toEqualTypeOf<
          UseQueryResult<string, unknown>
        >()
        expectTypeOf(result2[1]).toEqualTypeOf<
          UseQueryResult<number, unknown>
        >()
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
                return parseInt(a, 10)
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

    it('should return correct types when passing through queryOptions', () => {
      // @ts-expect-error (Page component is not rendered)
      function Page() {
        // data and results types are correct when using queryOptions
        const result4 = useQueries({
          queries: [
            queryOptions({
              queryKey: queryKey(),
              queryFn: () => 'string',
              select: (a) => {
                expectTypeOf(a).toEqualTypeOf<string>()
                return a.toLowerCase()
              },
            }),
            queryOptions({
              queryKey: queryKey(),
              queryFn: () => 'string',
              select: (a) => {
                expectTypeOf(a).toEqualTypeOf<string>()
                return parseInt(a, 10)
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

    it('should handle array literal without type parameter to infer result type', () => {
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
              select: (a: string) => parseInt(a, 10),
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
              select: (a: string) => parseInt(a, 10),
            },
            {
              queryKey: key5,
              queryFn: () => 'string',
              select: (a: string) => parseInt(a, 10),
              throwOnError,
            },
          ],
        })
        expectTypeOf(result4[0]).toEqualTypeOf<UseQueryResult<string, Error>>()
        expectTypeOf(result4[1]).toEqualTypeOf<UseQueryResult<string, Error>>()
        expectTypeOf(result4[2]).toEqualTypeOf<UseQueryResult<number, Error>>()
        expectTypeOf(result4[3]).toEqualTypeOf<
          UseQueryResult<number, BizError>
        >()

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
        expectTypeOf(result6[2]).toEqualTypeOf<
          UseQueryResult<string, BizError>
        >()

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

    it('should handle strongly typed queryFn factories and useQueries wrappers', () => {
      // QueryKey + queryFn factory
      type QueryKeyA = ['queryA']
      const getQueryKeyA = (): QueryKeyA => ['queryA']
      type GetQueryFunctionA = () => QueryFunction<number, QueryKeyA>
      const getQueryFunctionA: GetQueryFunctionA = () => () => {
        return Promise.resolve(1)
      }
      type SelectorA = (data: number) => [number, string]
      const getSelectorA = (): SelectorA => (data) => [data, data.toString()]

      type QueryKeyB = ['queryB', string]
      const getQueryKeyB = (id: string): QueryKeyB => ['queryB', id]
      type GetQueryFunctionB = () => QueryFunction<string, QueryKeyB>
      const getQueryFunctionB: GetQueryFunctionB = () => () => {
        return Promise.resolve('1')
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
        queries: Array<UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>>,
      ) {
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
  })
})
