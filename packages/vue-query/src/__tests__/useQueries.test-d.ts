import { describe, expectTypeOf, it } from 'vitest'
import { reactive } from 'vue'
import { queryKey } from '@tanstack/query-test-utils'
import { skipToken, useQueries } from '..'
import { queryOptions } from '../queryOptions'
import type { OmitKeyof, QueryObserverResult } from '..'
import type { UseQueryOptions } from '../useQuery'

describe('UseQueries config object overload', () => {
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

    const query2 = queryOptions({
      queryKey: key2,
      queryFn: () => 'Query Data',
      initialData: 'initial data',
    })

    const query3 = {
      queryKey: key3,
      queryFn: () => 'Query Data',
    }

    const { value: queriesState } = useQueries({
      queries: [query1, query2, query3],
    })

    expectTypeOf(queriesState[0].data).toEqualTypeOf<{ wow: boolean }>()
    expectTypeOf(queriesState[1].data).toEqualTypeOf<string>()
    expectTypeOf(queriesState[2].data).toEqualTypeOf<string | undefined>()
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

    const { value: queriesState } = useQueries({ queries: [options] })

    expectTypeOf(queriesState[0].data).toEqualTypeOf<{ wow: boolean }>()
  })

  it('should be possible to define a different TData than TQueryFnData using select with queryOptions spread into useQueries', () => {
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
      select: (data: any) => data > 1,
    }

    const queriesState = reactive(useQueries({ queries: [query1, query2] }))

    expectTypeOf(queriesState.value[0].data).toEqualTypeOf<
      boolean | undefined
    >()
    expectTypeOf(queriesState.value[1].data).toEqualTypeOf<
      boolean | undefined
    >()
  })

  it('TData should have undefined in the union when initialData is provided as a function which can return undefined', () => {
    const key = queryKey()
    const { value: queriesState } = useQueries({
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
    })

    expectTypeOf(queriesState[0].data).toEqualTypeOf<
      { wow: boolean } | undefined
    >()
  })

  it('TData should have correct type when conditional skipToken is passed', () => {
    const key = queryKey()
    const { value: queriesState } = useQueries({
      queries: [
        queryOptions({
          queryKey: key,
          queryFn: Math.random() > 0.5 ? skipToken : () => Promise.resolve(5),
        }),
      ],
    })

    const firstResult = queriesState[0]

    expectTypeOf(firstResult).toEqualTypeOf<
      QueryObserverResult<number, Error>
    >()
    expectTypeOf(firstResult.data).toEqualTypeOf<number | undefined>()
  })

  describe('custom hook', () => {
    it('should allow custom hooks using UseQueryOptions', () => {
      const useCustomQueries = (
        options?: OmitKeyof<
          UseQueryOptions<string>,
          'queryKey' | 'queryFn',
          'safely'
        >,
      ) =>
        useQueries({
          queries: [
            {
              ...options,
              queryKey: queryKey(),
              queryFn: () => Promise.resolve('data'),
            },
          ],
        })

      const { value: queriesState } = useCustomQueries()

      expectTypeOf(queriesState[0].data).toEqualTypeOf<string | undefined>()
    })
  })

  // Fix #7270
  it('should have proper type inference with different options provided', () => {
    const numbers = [1, 2, 3]
    const getQueryKey = (n: number) => [n]
    const queryFn = (n: number) => () => Promise.resolve(n)
    const select = (data: number) => data.toString()

    const queries = numbers.map((n) => ({
      queryKey: [n],
      queryFn: () => Promise.resolve(n),
      select: (data: number) => data.toString(),
    }))

    const queriesWithoutSelect = numbers.map((n) => ({
      queryKey: getQueryKey(n),
      queryFn: queryFn(n),
    }))

    const queriesWithQueryOptions = numbers.map((n) =>
      queryOptions({
        queryKey: getQueryKey(n),
        queryFn: queryFn(n),
        select,
      }),
    )

    const queriesWithQueryOptionsWithoutSelect = numbers.map((n) =>
      queryOptions({
        queryKey: getQueryKey(n),
        queryFn: queryFn(n),
      }),
    )

    const query1 = useQueries({ queries: queries })
    expectTypeOf(query1.value).toEqualTypeOf<
      Array<QueryObserverResult<string, Error>>
    >()

    const query2 = useQueries({ queries: queriesWithoutSelect })
    expectTypeOf(query2.value).toEqualTypeOf<
      Array<QueryObserverResult<number, Error>>
    >()

    const query3 = useQueries({ queries: queriesWithQueryOptions })
    expectTypeOf(query3.value).toEqualTypeOf<
      Array<QueryObserverResult<string, Error>>
    >()

    const query4 = useQueries({ queries: queriesWithQueryOptionsWithoutSelect })
    expectTypeOf(query4.value).toEqualTypeOf<
      Array<QueryObserverResult<number, Error>>
    >()

    const queryCombine = useQueries({
      queries: queries,
      combine: (data) => {
        return data.reduce((acc, i) => {
          acc.push(i.data ?? '')
          return acc
        }, [] as Array<string>)
      },
    })
    expectTypeOf(queryCombine.value).toEqualTypeOf<Array<string>>()

    const queryCombineWithoutSelect = useQueries({
      queries: queriesWithoutSelect,
      combine: (data) => {
        return data.reduce((acc, i) => {
          acc.push(i.data ?? 0)
          return acc
        }, [] as Array<number>)
      },
    })

    expectTypeOf(queryCombineWithoutSelect.value).toEqualTypeOf<Array<number>>()
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
    const { value: queriesState } = useQueries({
      queries: [...queries1List, { ...Queries2.get() }],
    })

    expectTypeOf(queriesState).toEqualTypeOf<
      [
        ...Array<QueryObserverResult<number, Error>>,
        QueryObserverResult<boolean, Error>,
      ]
    >()

    expectTypeOf(queriesState[0].data).toEqualTypeOf<
      number | boolean | undefined
    >()
  })

  it('should infer correct data type from queryOptions without initialData in useQueries', () => {
    const options = queryOptions({
      queryKey: queryKey(),
      queryFn: () => Promise.resolve(5),
    })

    const { value: queriesState } = useQueries({ queries: [options] })

    expectTypeOf(queriesState[0].data).toEqualTypeOf<number | undefined>()
  })

  it('should infer correct data type from queryOptions with select in useQueries', () => {
    const options = queryOptions({
      queryKey: queryKey(),
      queryFn: () => Promise.resolve(5),
      select: (data) => data.toString(),
    })

    const { value: queriesState } = useQueries({ queries: [options] })

    expectTypeOf(queriesState[0].data).toEqualTypeOf<string | undefined>()
  })
})
