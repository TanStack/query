import { expectTypeOf } from 'expect-type'
import {
  type DefinedUseQueryResult,
  QueryCache,
  type UseQueryResult,
  type UseSuspenseQueryResult,
  queryOptions,
  useQueries,
  useQuery,
  useQueryClient,
  useSuspenseQueries,
  useSuspenseQuery,
} from '..'
import { doNotExecute } from './utils'

const queryKey = ['key'] as const
const queryFn = () => Promise.resolve({ field: 'success' })

describe('queryOptions', () => {
  it('should be used with useQuery', () => {
    doNotExecute(() => {
      const dd = useQuery(
        queryOptions({
          queryKey,
          queryFn,
        }),
      )
      expectTypeOf(dd).toEqualTypeOf<UseQueryResult<{ field: string }>>()
      expectTypeOf(
        useQuery({
          ...queryOptions({
            queryKey,
            queryFn,
          }),
          select: (data) => data.field,
        }),
      ).toEqualTypeOf<UseQueryResult<string>>()
      expectTypeOf(
        useQuery({
          ...queryOptions({
            queryKey,
            queryFn,
            select: (data) => data.field,
          }),
        }),
      ).toEqualTypeOf<UseQueryResult<string>>()
      expectTypeOf(
        useQuery({
          ...queryOptions({
            queryKey,
            queryFn,
          }),
          initialData: { field: 'success' },
        }),
      ).toEqualTypeOf<DefinedUseQueryResult<{ field: string }>>()
      expectTypeOf(
        useQuery({
          ...queryOptions({
            queryKey,
            queryFn,
          }),
          initialData: { field: 'success' },
          select: (data) => data.field,
        }),
      ).toEqualTypeOf<DefinedUseQueryResult<string>>()
      expectTypeOf(
        useQuery({
          ...queryOptions({
            queryKey,
            queryFn,
          }),
          initialData: undefined,
          select: (data) => data.field,
        }),
      ).toEqualTypeOf<UseQueryResult<string>>()
      expectTypeOf(
        useQuery({
          ...queryOptions({
            queryKey,
            queryFn,
          }),
          initialData: () => undefined,
          select: (data) => data.field,
        }),
      ).toEqualTypeOf<UseQueryResult<string>>()
      expectTypeOf(
        useQuery({
          ...queryOptions({
            queryKey,
            queryFn,
            select: (data) => data.field,
          }),
          refetchInterval: 1000,
        }),
      ).toEqualTypeOf<UseQueryResult<string>>()
    })
  })
  it('should be used with useSuspenseQuery', () => {
    doNotExecute(() => {
      expectTypeOf(
        useSuspenseQuery(
          queryOptions({
            queryKey,
            queryFn,
          }),
        ),
      ).toEqualTypeOf<UseSuspenseQueryResult<{ field: string }>>()

      expectTypeOf(
        useSuspenseQuery({
          ...queryOptions({
            queryKey,
            queryFn,
          }),
          select: (data) => data.field,
        }),
      ).toEqualTypeOf<UseSuspenseQueryResult<string>>()
      expectTypeOf(
        useSuspenseQuery({
          ...queryOptions({
            queryKey,
            queryFn,
          }),
          initialData: { field: 'success' },
        }),
      ).toEqualTypeOf<UseSuspenseQueryResult<{ field: string }>>()
      expectTypeOf(
        useSuspenseQuery({
          ...queryOptions({
            queryKey,
            queryFn,
          }),
          initialData: undefined,
          select: (data) => data.field,
        }),
      ).toEqualTypeOf<UseSuspenseQueryResult<string>>()
      expectTypeOf(
        useSuspenseQuery({
          ...queryOptions({
            queryKey,
            queryFn,
          }),
          initialData: { field: 'success' },
          select: (data) => data.field,
        }),
      ).toEqualTypeOf<UseSuspenseQueryResult<string>>()
      expectTypeOf(
        useSuspenseQuery({
          ...queryOptions({
            queryKey,
            queryFn,
            select: (data) => data.field,
          }),
          refetchInterval: 1000,
        }),
      ).toEqualTypeOf<UseSuspenseQueryResult<string>>()
    })
  })
  it('should be used with useQueries', () => {
    doNotExecute(() => {
      const [query1, query2, query3, query4] = useQueries({
        queries: [
          queryOptions({
            queryKey,
            queryFn,
          }),
          queryOptions({
            queryKey,
            queryFn,
            initialData: { field: 'success' },
          }),
          {
            ...queryOptions({
              queryKey,
              queryFn,
            }),
            initialData: { field: 'success' },
          },
          {
            ...queryOptions({
              queryKey,
              queryFn,
            }),
            initialData: undefined,
          },
        ],
      })
      expectTypeOf(query1).toEqualTypeOf<UseQueryResult<{ field: string }>>()
      expectTypeOf(query2).toEqualTypeOf<
        DefinedUseQueryResult<{ field: string }>
      >()
      expectTypeOf(query3).toEqualTypeOf<
        DefinedUseQueryResult<{ field: string }>
      >()
      expectTypeOf(query4).toEqualTypeOf<UseQueryResult<{ field: string }>>()
    })
  })
  it('should be used with useSuspenseQueries', () => {
    doNotExecute(() => {
      const [query1, query2, query3, query4, query5] = useSuspenseQueries({
        queries: [
          queryOptions({
            queryKey,
            queryFn,
          }),
          queryOptions({
            queryKey,
            queryFn,
            initialData: { field: 'success' },
          }),
          {
            ...queryOptions({
              queryKey,
              queryFn,
            }),
            initialData: { field: 'success' },
          },
          {
            ...queryOptions({
              queryKey,
              queryFn,
            }),
            initialData: undefined,
          },
          {
            ...queryOptions({
              queryKey,
              queryFn,
              select: (data) => data.field,
            }),
          },
        ],
      })
      expectTypeOf(query1).toEqualTypeOf<
        UseSuspenseQueryResult<{ field: string }>
      >()
      expectTypeOf(query2).toEqualTypeOf<
        UseSuspenseQueryResult<{ field: string }>
      >()
      expectTypeOf(query3).toEqualTypeOf<
        UseSuspenseQueryResult<{ field: string }>
      >()
      expectTypeOf(query4).toEqualTypeOf<
        UseSuspenseQueryResult<{ field: string }>
      >()
      expectTypeOf(query5).toEqualTypeOf<UseSuspenseQueryResult<string>>()
    })
  })
  it('should be used with useQueryClient', () => {
    doNotExecute(async () => {
      const queryClient = useQueryClient()
      queryClient.invalidateQueries(queryOptions({ queryKey, queryFn }))
      queryClient.resetQueries(queryOptions({ queryKey, queryFn }))
      queryClient.removeQueries(queryOptions({ queryKey, queryFn }))
      queryClient.cancelQueries(queryOptions({ queryKey, queryFn }))
      queryClient.prefetchQuery(queryOptions({ queryKey, queryFn }))
      queryClient.refetchQueries(queryOptions({ queryKey, queryFn }))
      expectTypeOf(
        await queryClient.fetchQuery(queryOptions({ queryKey, queryFn })),
      ).toEqualTypeOf<{ field: string }>()
    })
  })
  it('should be used with queryCache', () => {
    doNotExecute(() => {
      const queryCache = new QueryCache()
      queryCache.find({ queryKey: [] })
      queryCache.find(queryOptions({ queryKey, queryFn }))
      queryCache.find(queryKey)
    })
  })
})
