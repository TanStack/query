import { expectTypeOf } from 'expect-type'
import {
  type UseQueryResult,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { queryOptions } from '..'
import { useSuspenseQueries, useSuspenseQuery } from '..'
import { type UseSuspenseQueryResult } from '../useSuspenseQuery'
import { doNotExecute } from './utils'

const queryKey = ['key'] as const

const query = {
  options1: () =>
    queryOptions({
      queryKey: [...queryKey, 1] as const,
      queryFn: () => Promise.resolve({ field: 'success' }),
    }),
  options2: () =>
    queryOptions({
      queryKey: [...queryKey, 2] as const,
      queryFn: () => Promise.resolve({ field: 'success' }),
    }),
}

describe('queryOptions', () => {
  it('should be used with useQuery', () => {
    doNotExecute(() => {
      const keyFn1Query = useQuery(query.options1())
      expectTypeOf(keyFn1Query).toEqualTypeOf<
        UseQueryResult<{ field: string }>
      >()
      expectTypeOf(keyFn1Query.data).toEqualTypeOf<
        { field: string } | undefined
      >()
      const keyFn1Query_Select = useQuery({
        ...query.options1(),
        select: (data) => data.field,
      })
      expectTypeOf(keyFn1Query_Select).toEqualTypeOf<UseQueryResult<string>>()
      expectTypeOf(keyFn1Query_Select.data).toEqualTypeOf<string | undefined>()
    })
  })
  it('should be used with useSuspenseQuery', () => {
    doNotExecute(() => {
      const keyFn1SuspenseQuery = useSuspenseQuery(query.options1())
      expectTypeOf(keyFn1SuspenseQuery).toEqualTypeOf<
        UseSuspenseQueryResult<{ field: string }>
      >()
      expectTypeOf(keyFn1SuspenseQuery.data).toEqualTypeOf<{ field: string }>()
      const keyFn1SuspenseQuery_Select = useSuspenseQuery({
        ...query.options1(),
        select: (data) => data.field,
      })
      expectTypeOf(keyFn1SuspenseQuery_Select).toEqualTypeOf<
        UseSuspenseQueryResult<string>
      >()
      expectTypeOf(keyFn1SuspenseQuery_Select.data).toEqualTypeOf<string>()
    })
  })
  it('should be used with useQueries', () => {
    doNotExecute(() => {
      const [query1, query2, query3] = useQueries({
        queries: [
          query.options1(),
          { ...query.options2() },
          queryOptions({
            queryKey: [...queryKey, 4] as const,
            queryFn: () => Promise.resolve({ field: 'success' }),
            select: (data) => {
              expectTypeOf(data).toEqualTypeOf<{ field: string }>()
              return data.field
            },
          }),
        ],
      })
      expectTypeOf(query1).toEqualTypeOf<UseQueryResult<{ field: string }>>()
      expectTypeOf(query1.data).toEqualTypeOf<{ field: string } | undefined>()
      expectTypeOf(query2).toEqualTypeOf<UseQueryResult<{ field: string }>>()
      expectTypeOf(query2.data).toEqualTypeOf<{ field: string } | undefined>()
      expectTypeOf(query3).toEqualTypeOf<UseQueryResult<string>>()
      expectTypeOf(query3.data).toEqualTypeOf<string | undefined>()
    })
  })
  it('should be used with useSuspenseQueries', () => {
    doNotExecute(() => {
      const [query1, query2, query3] = useSuspenseQueries({
        queries: [
          query.options1(),
          { ...query.options2() },
          queryOptions({
            queryKey: [...queryKey, 4] as const,
            queryFn: () => Promise.resolve({ field: 'success' }),
            select: (data) => {
              expectTypeOf(data).toEqualTypeOf<{ field: string }>()
              return data.field
            },
          }),
        ],
      })

      expectTypeOf(query1).toEqualTypeOf<
        UseSuspenseQueryResult<{ field: string }>
      >()
      expectTypeOf(query1.data).toEqualTypeOf<{ field: string }>()
      expectTypeOf(query2).toEqualTypeOf<
        UseSuspenseQueryResult<{ field: string }>
      >()
      expectTypeOf(query2.data).toEqualTypeOf<{ field: string }>()
      expectTypeOf(query3).toEqualTypeOf<UseSuspenseQueryResult<string>>()
      expectTypeOf(query3.data).toEqualTypeOf<string>()
    })
  })
  it('should be used with useQueryClient', () => {
    doNotExecute(async () => {
      const queryClient = useQueryClient()

      queryClient.invalidateQueries(query.options1())
      queryClient.resetQueries(query.options1())
      queryClient.removeQueries(query.options1())
      queryClient.cancelQueries(query.options1())
      queryClient.prefetchQuery(query.options1())
      queryClient.refetchQueries(query.options1())

      const query1 = await queryClient.fetchQuery(query.options1())
      expectTypeOf(query1).toEqualTypeOf<{ field: string }>()
    })
  })
})
