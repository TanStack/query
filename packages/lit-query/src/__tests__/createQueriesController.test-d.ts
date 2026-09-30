import { QueryClient, skipToken } from '@tanstack/query-core'
import { queryKey } from '@tanstack/query-test-utils'
import { LitElement } from 'lit'
import { describe, expectTypeOf, it } from 'vitest'
import { createQueriesController } from '../createQueriesController.js'
import { queryOptions } from '../queryOptions.js'
import type {
  OmitKeyof,
  QueryFunction,
  QueryFunctionContext,
  QueryKey,
  QueryObserverResult,
} from '@tanstack/query-core'
import type { CreateQueryOptions } from '../createQueryController.js'

class Host extends LitElement {}

describe('createQueriesController', () => {
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

      const queryResults = createQueriesController(
        new Host(),
        { queries: [query1, query2, query3] },
        new QueryClient(),
      )()

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
      const queryResults = createQueriesController(
        new Host(),
        { queries: [options] },
        new QueryClient(),
      )()

      const data = queryResults[0].data

      expectTypeOf(data).toEqualTypeOf<{ wow: boolean }>()
    })

    it('should be possible to define a different TData than TQueryFnData using select with queryOptions spread into createQueriesController', () => {
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

      const queryResults = createQueriesController(
        new Host(),
        { queries: [query1, query2] },
        new QueryClient(),
      )()
      const query1Data = queryResults[0].data
      const query2Data = queryResults[1].data

      expectTypeOf(query1Data).toEqualTypeOf<boolean | undefined>()
      expectTypeOf(query2Data).toEqualTypeOf<boolean | undefined>()
    })

    it('TData should have undefined in the union when initialData is provided as a function which can return undefined', () => {
      const queryResults = createQueriesController(
        new Host(),
        {
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
        },
        new QueryClient(),
      )()

      const data = queryResults[0].data

      expectTypeOf(data).toEqualTypeOf<{ wow: boolean } | undefined>()
    })

    describe('custom controller', () => {
      it('should allow custom controllers using CreateQueryOptions', () => {
        type Data = string

        const createCustomQueries = (
          options?: OmitKeyof<CreateQueryOptions<Data>, 'queryKey' | 'queryFn'>,
        ) => {
          return createQueriesController(
            new Host(),
            {
              queries: [
                {
                  ...options,
                  queryKey: queryKey(),
                  queryFn: () => Promise.resolve('data'),
                },
              ],
            },
            new QueryClient(),
          )()
        }

        const queryResults = createCustomQueries()
        const data = queryResults[0].data

        expectTypeOf(data).toEqualTypeOf<Data | undefined>()
      })
    })

    it('TData should have correct type when conditional skipToken is passed', () => {
      const queryResults = createQueriesController(
        new Host(),
        {
          queries: [
            {
              queryKey: queryKey(),
              queryFn:
                Math.random() > 0.5 ? skipToken : () => Promise.resolve(5),
            },
          ],
        },
        new QueryClient(),
      )()

      const firstResult = queryResults[0]

      expectTypeOf(firstResult).toEqualTypeOf<
        QueryObserverResult<number, Error>
      >()
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
      const result = createQueriesController(
        new Host(),
        {
          queries: [...queries1List, { ...Queries2.get() }],
        },
        new QueryClient(),
      )()

      expectTypeOf(result).toEqualTypeOf<
        [
          ...Array<QueryObserverResult<number, Error>>,
          QueryObserverResult<boolean, Error>,
        ]
      >()
    })
  })

  describe('type parameters', () => {
    it('should handle type parameter - tuple of tuples', () => {
      const key1 = queryKey()
      const key2 = queryKey()
      const key3 = queryKey()

      const result1 = createQueriesController<
        [[number], [string], [Array<string>, boolean]]
      >(
        new Host(),
        {
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
        },
        new QueryClient(),
      )()
      expectTypeOf(result1[0]).toEqualTypeOf<
        QueryObserverResult<number, unknown>
      >()
      expectTypeOf(result1[1]).toEqualTypeOf<
        QueryObserverResult<string, unknown>
      >()
      expectTypeOf(result1[2]).toEqualTypeOf<
        QueryObserverResult<Array<string>, boolean>
      >()
      expectTypeOf(result1[0].data).toEqualTypeOf<number | undefined>()
      expectTypeOf(result1[1].data).toEqualTypeOf<string | undefined>()
      expectTypeOf(result1[2].data).toEqualTypeOf<Array<string> | undefined>()
      expectTypeOf(result1[2].error).toEqualTypeOf<boolean | null>()

      // TData (3rd element) takes precedence over TQueryFnData (1st element)
      const result2 = createQueriesController<
        [[string, unknown, string], [string, unknown, number]]
      >(
        new Host(),
        {
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
        },
        new QueryClient(),
      )()
      expectTypeOf(result2[0]).toEqualTypeOf<
        QueryObserverResult<string, unknown>
      >()
      expectTypeOf(result2[1]).toEqualTypeOf<
        QueryObserverResult<number, unknown>
      >()
      expectTypeOf(result2[0].data).toEqualTypeOf<string | undefined>()
      expectTypeOf(result2[1].data).toEqualTypeOf<number | undefined>()

      // types should be enforced
      createQueriesController<
        [[string, unknown, string], [string, boolean, number]]
      >(
        new Host(),
        {
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
        },
        new QueryClient(),
      )()

      // field names should be enforced
      createQueriesController<[[string]]>(
        new Host(),
        {
          queries: [
            {
              queryKey: key1,
              queryFn: () => 'string',
              // @ts-expect-error (invalidField)
              someInvalidField: [],
            },
          ],
        },
        new QueryClient(),
      )()
    })

    it('should handle type parameter - tuple of objects', () => {
      const key1 = queryKey()
      const key2 = queryKey()
      const key3 = queryKey()

      const result1 = createQueriesController<
        [
          { queryFnData: number },
          { queryFnData: string },
          { queryFnData: Array<string>; error: boolean },
        ]
      >(
        new Host(),
        {
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
        },
        new QueryClient(),
      )()
      expectTypeOf(result1[0]).toEqualTypeOf<
        QueryObserverResult<number, unknown>
      >()
      expectTypeOf(result1[1]).toEqualTypeOf<
        QueryObserverResult<string, unknown>
      >()
      expectTypeOf(result1[2]).toEqualTypeOf<
        QueryObserverResult<Array<string>, boolean>
      >()
      expectTypeOf(result1[0].data).toEqualTypeOf<number | undefined>()
      expectTypeOf(result1[1].data).toEqualTypeOf<string | undefined>()
      expectTypeOf(result1[2].data).toEqualTypeOf<Array<string> | undefined>()
      expectTypeOf(result1[2].error).toEqualTypeOf<boolean | null>()

      // TData (data prop) takes precedence over TQueryFnData (queryFnData prop)
      const result2 = createQueriesController<
        [
          { queryFnData: string; data: string },
          { queryFnData: string; data: number },
        ]
      >(
        new Host(),
        {
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
        },
        new QueryClient(),
      )()
      expectTypeOf(result2[0]).toEqualTypeOf<
        QueryObserverResult<string, unknown>
      >()
      expectTypeOf(result2[1]).toEqualTypeOf<
        QueryObserverResult<number, unknown>
      >()
      expectTypeOf(result2[0].data).toEqualTypeOf<string | undefined>()
      expectTypeOf(result2[1].data).toEqualTypeOf<number | undefined>()

      // can pass only TData (data prop) although TQueryFnData will be left unknown
      const result3 = createQueriesController<
        [{ data: string }, { data: number }]
      >(
        new Host(),
        {
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
        },
        new QueryClient(),
      )()
      expectTypeOf(result3[0]).toEqualTypeOf<
        QueryObserverResult<string, unknown>
      >()
      expectTypeOf(result3[1]).toEqualTypeOf<
        QueryObserverResult<number, unknown>
      >()
      expectTypeOf(result3[0].data).toEqualTypeOf<string | undefined>()
      expectTypeOf(result3[1].data).toEqualTypeOf<number | undefined>()

      // types should be enforced
      createQueriesController<
        [
          { queryFnData: string; data: string },
          { queryFnData: string; data: number; error: boolean },
        ]
      >(
        new Host(),
        {
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
        },
        new QueryClient(),
      )()

      // field names should be enforced
      createQueriesController<[{ queryFnData: string }]>(
        new Host(),
        {
          queries: [
            {
              queryKey: key1,
              queryFn: () => 'string',
              // @ts-expect-error (invalidField)
              someInvalidField: [],
            },
          ],
        },
        new QueryClient(),
      )()
    })

    it('should return correct types when passing through queryOptions', () => {
      // data and results types are correct when using queryOptions
      const result4 = createQueriesController(
        new Host(),
        {
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
                return parseInt(a)
              },
            }),
          ],
        },
        new QueryClient(),
      )()
      expectTypeOf(result4[0]).toEqualTypeOf<
        QueryObserverResult<string, Error>
      >()
      expectTypeOf(result4[1]).toEqualTypeOf<
        QueryObserverResult<number, Error>
      >()
      expectTypeOf(result4[0].data).toEqualTypeOf<string | undefined>()
      expectTypeOf(result4[1].data).toEqualTypeOf<number | undefined>()
    })

    it('should handle array literal without type parameter to infer result type', () => {
      const key1 = queryKey()
      const key2 = queryKey()
      const key3 = queryKey()
      const key4 = queryKey()
      const key5 = queryKey()

      type BizError = { code: number }
      const throwOnError = (_error: BizError) => true

      // Array.map preserves TQueryFnData
      const result1 = createQueriesController(
        new Host(),
        {
          queries: Array(50).map((_, i) => ({
            queryKey: ['key', i] as const,
            queryFn: () => i + 10,
          })),
        },
        new QueryClient(),
      )()
      expectTypeOf(result1).toEqualTypeOf<
        Array<QueryObserverResult<number, Error>>
      >()
      if (result1[0]) {
        expectTypeOf(result1[0].data).toEqualTypeOf<number | undefined>()
      }

      // Array.map preserves TError
      const result1_err = createQueriesController(
        new Host(),
        {
          queries: Array(50).map((_, i) => ({
            queryKey: ['key', i] as const,
            queryFn: () => i + 10,
            throwOnError,
          })),
        },
        new QueryClient(),
      )()
      expectTypeOf(result1_err).toEqualTypeOf<
        Array<QueryObserverResult<number, BizError>>
      >()
      if (result1_err[0]) {
        expectTypeOf(result1_err[0].data).toEqualTypeOf<number | undefined>()
        expectTypeOf(result1_err[0].error).toEqualTypeOf<BizError | null>()
      }

      // Array.map preserves TData
      const result2 = createQueriesController(
        new Host(),
        {
          queries: Array(50).map((_, i) => ({
            queryKey: ['key', i] as const,
            queryFn: () => i + 10,
            select: (data: number) => data.toString(),
          })),
        },
        new QueryClient(),
      )()
      expectTypeOf(result2).toEqualTypeOf<
        Array<QueryObserverResult<string, Error>>
      >()

      const result2_err = createQueriesController(
        new Host(),
        {
          queries: Array(50).map((_, i) => ({
            queryKey: ['key', i] as const,
            queryFn: () => i + 10,
            select: (data: number) => data.toString(),
            throwOnError,
          })),
        },
        new QueryClient(),
      )()
      expectTypeOf(result2_err).toEqualTypeOf<
        Array<QueryObserverResult<string, BizError>>
      >()

      const result3 = createQueriesController(
        new Host(),
        {
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
        },
        new QueryClient(),
      )()
      expectTypeOf(result3[0]).toEqualTypeOf<
        QueryObserverResult<number, Error>
      >()
      expectTypeOf(result3[1]).toEqualTypeOf<
        QueryObserverResult<string, Error>
      >()
      expectTypeOf(result3[2]).toEqualTypeOf<
        QueryObserverResult<number, Error>
      >()
      expectTypeOf(result3[0].data).toEqualTypeOf<number | undefined>()
      expectTypeOf(result3[1].data).toEqualTypeOf<string | undefined>()
      expectTypeOf(result3[3].data).toEqualTypeOf<string | undefined>()
      // select takes precedence over queryFn
      expectTypeOf(result3[2].data).toEqualTypeOf<number | undefined>()
      // infer TError from throwOnError
      expectTypeOf(result3[3].error).toEqualTypeOf<BizError | null>()

      // initialData/placeholderData are enforced
      createQueriesController(
        new Host(),
        {
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
        },
        new QueryClient(),
      )()

      // select and throwOnError params are "indirectly" enforced
      createQueriesController(
        new Host(),
        {
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
        },
        new QueryClient(),
      )()

      // callbacks are also indirectly enforced with Array.map
      createQueriesController(
        new Host(),
        {
          queries: Array(50).map((_, i) => ({
            queryKey: ['key', i] as const,
            queryFn: () => i + 10,
            select: (data: number) => data.toString(),
          })),
        },
        new QueryClient(),
      )()
      createQueriesController(
        new Host(),
        {
          queries: Array(50).map((_, i) => ({
            queryKey: ['key', i] as const,
            queryFn: () => i + 10,
            select: (data: number) => data.toString(),
          })),
        },
        new QueryClient(),
      )()

      // results inference works when all the handlers are defined
      const result4 = createQueriesController(
        new Host(),
        {
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
        },
        new QueryClient(),
      )()
      expectTypeOf(result4[0]).toEqualTypeOf<
        QueryObserverResult<string, Error>
      >()
      expectTypeOf(result4[1]).toEqualTypeOf<
        QueryObserverResult<string, Error>
      >()
      expectTypeOf(result4[2]).toEqualTypeOf<
        QueryObserverResult<number, Error>
      >()
      expectTypeOf(result4[3]).toEqualTypeOf<
        QueryObserverResult<number, BizError>
      >()

      // handles when queryFn returns a Promise
      const result5 = createQueriesController(
        new Host(),
        {
          queries: [
            {
              queryKey: key1,
              queryFn: () => Promise.resolve('string'),
            },
          ],
        },
        new QueryClient(),
      )()
      expectTypeOf(result5[0]).toEqualTypeOf<
        QueryObserverResult<string, Error>
      >()

      // Array as const does not throw error
      const result6 = createQueriesController(
        new Host(),
        {
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
        } as const,
        new QueryClient(),
      )()
      expectTypeOf(result6[0]).toEqualTypeOf<
        QueryObserverResult<string, Error>
      >()
      expectTypeOf(result6[1]).toEqualTypeOf<
        QueryObserverResult<number, Error>
      >()
      expectTypeOf(result6[2]).toEqualTypeOf<
        QueryObserverResult<string, BizError>
      >()

      // field names should be enforced - array literal
      createQueriesController(
        new Host(),
        {
          queries: [
            {
              queryKey: key1,
              queryFn: () => 'string',
              // @ts-expect-error (invalidField)
              someInvalidField: [],
            },
          ],
        },
        new QueryClient(),
      )()

      // field names should be enforced - Array.map() result
      createQueriesController(
        new Host(),
        {
          // @ts-expect-error (invalidField)
          queries: Array(10).map(() => ({
            someInvalidField: '',
          })),
        },
        new QueryClient(),
      )()

      // field names should be enforced - array literal
      createQueriesController(
        new Host(),
        {
          queries: [
            {
              queryKey: key1,
              queryFn: () => 'string',
              // @ts-expect-error (invalidField)
              someInvalidField: [],
            },
          ],
        },
        new QueryClient(),
      )()

      // supports queryFn using fetch() to return Promise<any> - Array.map() result
      createQueriesController(
        new Host(),
        {
          queries: Array(50).map((_, i) => ({
            queryKey: ['key', i] as const,
            queryFn: () =>
              fetch('return Promise<any>').then((resp) => resp.json()),
          })),
        },
        new QueryClient(),
      )()

      // supports queryFn using fetch() to return Promise<any> - array literal
      createQueriesController(
        new Host(),
        {
          queries: [
            {
              queryKey: key1,
              queryFn: () =>
                fetch('return Promise<any>').then((resp) => resp.json()),
            },
          ],
        },
        new QueryClient(),
      )()
    })

    it('should handle strongly typed queryFn factories and createQueriesController wrappers', () => {
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
      function createWrappedQueries<
        TQueryFnData,
        TError,
        TData,
        TQueryKey extends QueryKey,
      >(
        queries: Array<
          CreateQueryOptions<
            TQueryFnData,
            TError,
            TData,
            TQueryFnData,
            TQueryKey
          >
        >,
      ) {
        return createQueriesController(
          new Host(),
          {
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
          },
          new QueryClient(),
        )()
      }

      const result = createQueriesController(
        new Host(),
        {
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
        },
        new QueryClient(),
      )()
      expectTypeOf(result[0]).toEqualTypeOf<
        QueryObserverResult<number, Error>
      >()
      expectTypeOf(result[1]).toEqualTypeOf<
        QueryObserverResult<string, Error>
      >()

      const withSelector = createQueriesController(
        new Host(),
        {
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
        },
        new QueryClient(),
      )()
      expectTypeOf(withSelector[0]).toEqualTypeOf<
        QueryObserverResult<[number, string], Error>
      >()
      expectTypeOf(withSelector[1]).toEqualTypeOf<
        QueryObserverResult<[string, number], Error>
      >()

      const withWrappedQueries = createWrappedQueries(
        Array(10).map(() => ({
          queryKey: getQueryKeyA(),
          queryFn: getQueryFunctionA(),
          select: getSelectorA(),
        })),
      )

      expectTypeOf(withWrappedQueries).toEqualTypeOf<
        Array<QueryObserverResult<number, Error>>
      >()
    })
  })

  describe('select', () => {
    // Inferring the `select` argument of an *inline* query object from its
    // sibling `queryFn` is a known TypeScript limitation, because `createQueriesController`
    // infers its array generic from the argument itself. The two supported
    // workarounds are to annotate the `select` parameter, or to define the
    // query with the `queryOptions` helper.
    // https://github.com/TanStack/query/issues/6556

    describe('without queryOptions (inline query object)', () => {
      it('leaves the select argument as `unknown` without an annotation', () => {
        createQueriesController(
          new Host(),
          {
            queries: [
              {
                queryKey: queryKey(),
                queryFn: () => Promise.resolve(1),
                select: (data) => {
                  expectTypeOf(data).toBeUnknown()
                  // @ts-expect-error `data` is `unknown`, not the expected `number`
                  return data.toFixed()
                },
              },
            ],
          },
          new QueryClient(),
        )()
      })

      it('infers the result when the select parameter is annotated', () => {
        const queryResults = createQueriesController(
          new Host(),
          {
            queries: [
              {
                queryKey: queryKey(),
                queryFn: () => Promise.resolve(1),
                select: (data: number) => data.toFixed(),
              },
            ],
          },
          new QueryClient(),
        )()
        expectTypeOf(queryResults[0].data).toEqualTypeOf<string | undefined>()
      })
    })

    describe('with queryOptions passed directly', () => {
      it('without select, infers the queryFn data as the result', () => {
        const options = queryOptions({
          queryKey: queryKey(),
          queryFn: () => Promise.resolve(1),
        })
        const queryResults = createQueriesController(
          new Host(),
          { queries: [options] },
          new QueryClient(),
        )()
        expectTypeOf(queryResults[0].data).toEqualTypeOf<number | undefined>()
      })

      it('with select, infers the select argument and the result', () => {
        const options = queryOptions({
          queryKey: queryKey(),
          queryFn: () => Promise.resolve(1),
          select: (data) => {
            expectTypeOf(data).toEqualTypeOf<number>()
            return data.toFixed()
          },
        })
        const queryResults = createQueriesController(
          new Host(),
          { queries: [options] },
          new QueryClient(),
        )()
        expectTypeOf(queryResults[0].data).toEqualTypeOf<string | undefined>()
      })

      it('infers select when a base queryOptions is re-wrapped with queryOptions', () => {
        const baseOptions = queryOptions({
          queryKey: queryKey(),
          queryFn: () => Promise.resolve(1),
        })
        const queryResults = createQueriesController(
          new Host(),
          {
            queries: [
              queryOptions({
                ...baseOptions,
                select: (data) => {
                  expectTypeOf(data).toEqualTypeOf<number>()
                  return data.toFixed()
                },
              }),
              baseOptions,
            ],
          },
          new QueryClient(),
        )()
        expectTypeOf(queryResults[0].data).toEqualTypeOf<string | undefined>()
        expectTypeOf(queryResults[1].data).toEqualTypeOf<number | undefined>()
      })

      it('infers an overriding select when a queryOptions with a select is re-wrapped with queryOptions', () => {
        const baseOptions = queryOptions({
          queryKey: queryKey(),
          queryFn: () => Promise.resolve(1),
          select: (data) => data + 1,
        })
        const queryResults = createQueriesController(
          new Host(),
          {
            queries: [
              queryOptions({
                ...baseOptions,
                select: (data) => {
                  expectTypeOf(data).toEqualTypeOf<number>()
                  return data.toFixed()
                },
              }),
            ],
          },
          new QueryClient(),
        )()
        expectTypeOf(queryResults[0].data).toEqualTypeOf<string | undefined>()
      })
    })

    describe('with queryOptions spread into an inline query object', () => {
      it('without select in the factory, leaves an unannotated select as `unknown`', () => {
        const options = queryOptions({
          queryKey: queryKey(),
          queryFn: () => Promise.resolve(1),
        })
        createQueriesController(
          new Host(),
          {
            queries: [
              // @ts-expect-error Without an annotation the inline `select` receives `data: unknown`, which makes the whole spread query object unassignable to the expected options type
              {
                ...options,
                select: (data) => {
                  expectTypeOf(data).toBeUnknown()
                  return data
                },
              },
            ],
          },
          new QueryClient(),
        )()
      })

      it('without select in the factory, an annotated select compiles', () => {
        const options = queryOptions({
          queryKey: queryKey(),
          queryFn: () => Promise.resolve(1),
        })
        const queryResults = createQueriesController(
          new Host(),
          {
            queries: [{ ...options, select: (data: number) => data.toFixed() }],
          },
          new QueryClient(),
        )()
        expectTypeOf(queryResults[0].data).toEqualTypeOf<string | undefined>()
      })

      it('with select in the factory, leaves an unannotated overriding select as `unknown`', () => {
        const options = queryOptions({
          queryKey: queryKey(),
          queryFn: () => Promise.resolve(1),
          select: (data) => data + 1,
        })
        createQueriesController(
          new Host(),
          {
            queries: [
              // @ts-expect-error Without an annotation the inline `select` receives `data: unknown`, which makes the whole spread query object unassignable to the expected options type
              {
                ...options,
                select: (data) => {
                  expectTypeOf(data).toBeUnknown()
                  return data
                },
              },
            ],
          },
          new QueryClient(),
        )()
      })

      it('with select in the factory, an annotated overriding select compiles', () => {
        const options = queryOptions({
          queryKey: queryKey(),
          queryFn: () => Promise.resolve(1),
          select: (data) => data + 1,
        })
        const queryResults = createQueriesController(
          new Host(),
          {
            queries: [{ ...options, select: (data: number) => data.toFixed() }],
          },
          new QueryClient(),
        )()
        expectTypeOf(queryResults[0].data).toEqualTypeOf<string | undefined>()
      })
    })
  })

  describe('combine', () => {
    it('should infer the result type of combine', () => {
      const result = createQueriesController(
        new Host(),
        {
          queries: [
            {
              queryKey: queryKey(),
              queryFn: () => Promise.resolve(7),
            },
            {
              queryKey: queryKey(),
              queryFn: () => Promise.resolve('ok'),
            },
          ],
          combine: (results) => ({
            first: results[0].data,
            second: results[1].data,
          }),
        },
        new QueryClient(),
      )

      expectTypeOf(result().first).toEqualTypeOf<number | undefined>()
      expectTypeOf(result().second).toEqualTypeOf<string | undefined>()
    })

    it('TData should be defined in combine when passed through queryOptions', () => {
      const result = createQueriesController(
        new Host(),
        {
          queries: [
            queryOptions({
              queryKey: queryKey(),
              queryFn: () => Promise.resolve({ id: 5, name: 'Katherine' }),
              initialData: { id: 1, name: 'Init' },
            }),
          ],
          combine: (results) => results[0].data.name,
        },
        new QueryClient(),
      )

      const combined: string = result()
      expectTypeOf(combined).toEqualTypeOf<string>()
    })
  })
})
