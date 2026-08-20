import { describe, expectTypeOf, it } from 'vitest'
import { queryKey } from '@tanstack/query-test-utils'
import { skipToken } from '..'
import { injectQueries } from '../inject-queries'
import { queryOptions } from '../query-options'
import type { CreateQueryOptions, CreateQueryResult, OmitKeyof } from '..'
import type { Signal } from '@angular/core'

describe('injectQueries', () => {
  describe('config object overload', () => {
    it('TData should always be defined when initialData is provided as an object', () => {
      const key1 = queryKey()
      const key2 = queryKey()
      const key3 = queryKey()

      const query1 = {
        queryKey: key1,
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
        queryKey: key2,
        queryFn: () => 'Query Data',
        initialData: 'initial data',
      }

      const query3 = {
        queryKey: key3,
        queryFn: () => 'Query Data',
      }

      const queryResults = injectQueries(() => ({
        queries: [query1, query2, query3],
      }))

      const query1Data = queryResults()[0].data()
      const query2Data = queryResults()[1].data()
      const query3Data = queryResults()[2].data()

      expectTypeOf(query1Data).toEqualTypeOf<{ wow: boolean }>()
      expectTypeOf(query2Data).toEqualTypeOf<string>()
      expectTypeOf(query3Data).toEqualTypeOf<string | undefined>()
    })

    it('TData should be defined when passed through queryOptions', () => {
      const key = queryKey()
      const options = queryOptions({
        queryKey: key,
        queryFn: () => {
          return {
            wow: true,
          }
        },
        initialData: {
          wow: true,
        },
      })
      const queryResults = injectQueries(() => ({ queries: [options] }))

      const data = queryResults()[0].data()

      expectTypeOf(data).toEqualTypeOf<{ wow: boolean }>()
    })

    it('should be possible to define a different TData than TQueryFnData using select with queryOptions spread into injectQuery', () => {
      const key1 = queryKey()
      const key2 = queryKey()

      const query1 = queryOptions({
        queryKey: key1,
        queryFn: () => Promise.resolve(1),
        select: (data) => data > 1,
      })

      const query2 = {
        queryKey: key2,
        queryFn: () => Promise.resolve(1),
        select: (data: number) => data > 1,
      }

      const queryResults = injectQueries(() => ({ queries: [query1, query2] }))
      const query1Data = queryResults()[0].data()
      const query2Data = queryResults()[1].data()

      expectTypeOf(query1Data).toEqualTypeOf<boolean | undefined>()
      expectTypeOf(query2Data).toEqualTypeOf<boolean | undefined>()
    })

    it('TData should have undefined in the union when initialData is provided as a function which can return undefined', () => {
      const key = queryKey()
      const queryResults = injectQueries(() => ({
        queries: [
          {
            queryKey: key,
            queryFn: () => {
              return {
                wow: true,
              }
            },
            initialData: () => undefined as { wow: boolean } | undefined,
          },
        ],
      }))

      const data = queryResults()[0].data()

      expectTypeOf(data).toEqualTypeOf<{ wow: boolean } | undefined>()
    })

    describe('custom injectable', () => {
      it('should allow custom hooks using UseQueryOptions', () => {
        type Data = string
        const key = queryKey()

        const injectCustomQueries = (
          options?: OmitKeyof<CreateQueryOptions<Data>, 'queryKey' | 'queryFn'>,
        ) => {
          return injectQueries(() => ({
            queries: [
              {
                ...options,
                queryKey: key,
                queryFn: () => Promise.resolve('data'),
              },
            ],
          }))
        }

        const queryResults = injectCustomQueries()
        const data = queryResults()[0].data()

        expectTypeOf(data).toEqualTypeOf<Data | undefined>()
      })
    })

    it('TData should have correct type when conditional skipToken is passed', () => {
      const key = queryKey()
      const queryResults = injectQueries(() => ({
        queries: [
          {
            queryKey: key,
            queryFn: Math.random() > 0.5 ? skipToken : () => Promise.resolve(5),
          },
        ],
      }))

      const firstResult = queryResults()[0]

      expectTypeOf(firstResult).toEqualTypeOf<
        CreateQueryResult<number, Error>
      >()
      expectTypeOf(firstResult.data()).toEqualTypeOf<number | undefined>()
    })

    it('should return correct data for dynamic queries with mixed result types', () => {
      const key1 = queryKey()
      const key2 = queryKey()

      const Queries1 = {
        get: () =>
          queryOptions({
            queryKey: key1,
            queryFn: () => Promise.resolve(1),
          }),
      }
      const Queries2 = {
        get: () =>
          queryOptions({
            queryKey: key2,
            queryFn: () => Promise.resolve(true),
          }),
      }

      const queries1List = [1, 2, 3].map(() => ({ ...Queries1.get() }))
      const result = injectQueries(() => ({
        queries: [...queries1List, { ...Queries2.get() }],
      }))

      expectTypeOf(result).branded.toEqualTypeOf<
        Signal<
          [
            ...Array<CreateQueryResult<number, Error>>,
            CreateQueryResult<boolean, Error>,
          ]
        >
      >()
    })
  })
})
