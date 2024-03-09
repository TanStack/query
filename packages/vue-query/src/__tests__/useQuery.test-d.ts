import { describe, expectTypeOf, it } from 'vitest'
import { reactive } from 'vue-demi'
import { useQuery } from '../useQuery'
import { queryOptions } from '../queryOptions'
import { simpleFetcher } from './test-utils'
import type { UseQueryOptions } from '../useQuery'

describe('initialData', () => {
  describe('Config object overload', () => {
    it('TData should always be defined when initialData is provided as an object', () => {
      const { data } = reactive(
        useQuery({
          queryKey: ['key'],
          queryFn: () => ({ wow: true }),
          initialData: { wow: true },
        }),
      )

      expectTypeOf(data).toEqualTypeOf<{ wow: boolean }>()
    })

    it('TData should be defined when passed through queryOptions', () => {
      const options = queryOptions({
        queryKey: ['key'],
        queryFn: () => ({ wow: true }),
        initialData: { wow: true },
      })
      const { data } = reactive(useQuery(options))

      expectTypeOf(data).toEqualTypeOf<{ wow: boolean }>()
    })

    it('it should be possible to define a different TData than TQueryFnData using select with queryOptions spread into useQuery', () => {
      const options = queryOptions({
        queryKey: ['key'],
        queryFn: () => Promise.resolve(1),
      })

      const query = reactive(
        useQuery({
          ...options,
          select: (data) => data > 1,
        }),
      )

      expectTypeOf(query.data).toEqualTypeOf<boolean | undefined>()
    })

    it('TData should always be defined when initialData is provided as a function which ALWAYS returns the data', () => {
      const { data } = reactive(
        useQuery({
          queryKey: ['key'],
          queryFn: () => ({ wow: true }),
          initialData: () => ({ wow: true }),
        }),
      )

      expectTypeOf(data).toEqualTypeOf<{ wow: boolean }>()
    })

    it('TData should have undefined in the union when initialData is NOT provided', () => {
      const { data } = reactive(
        useQuery({
          queryKey: ['key'],
          queryFn: () => {
            return {
              wow: true,
            }
          },
        }),
      )

      expectTypeOf(data).toEqualTypeOf<{ wow: boolean } | undefined>()
    })

    it('TData should have undefined in the union when initialData is provided as a function which can return undefined', () => {
      const { data } = reactive(
        useQuery({
          queryKey: ['key'],
          queryFn: () => ({ wow: true }),
          initialData: () => undefined as { wow: boolean } | undefined,
        }),
      )

      expectTypeOf(data).toEqualTypeOf<{ wow: boolean } | undefined>()
    })

    it('TData should be narrowed after an isSuccess check when initialData is provided as a function which can return undefined', () => {
      const { data, isSuccess } = reactive(
        useQuery({
          queryKey: ['key'],
          queryFn: () => ({ wow: true }),
          initialData: () => undefined as { wow: boolean } | undefined,
        }),
      )

      if (isSuccess) {
        expectTypeOf(data).toEqualTypeOf<{ wow: boolean }>()
      }
    })
  })

  describe('custom composable', () => {
    it('should allow custom composable using UseQueryOptions', () => {
      type Data = string

      const useCustomQuery = (
        options?: Omit<UseQueryOptions<Data>, 'queryKey' | 'queryFn'>,
      ) => {
        return useQuery({
          ...options,
          queryKey: ['todos-key'],
          queryFn: () => Promise.resolve('data'),
        })
      }

      const { data } = reactive(useCustomQuery())

      expectTypeOf(data).toEqualTypeOf<Data | undefined>()
    })
  })

  describe('structuralSharing', () => {
    it('should restrict to same types', () => {
      useQuery({
        queryKey: ['key'],
        queryFn: () => 5,
        structuralSharing: (_oldData, newData) => newData,
      })
    })
  })

  describe('Discriminated union return type', () => {
    it('data should be possibly undefined by default', () => {
      const query = reactive(
        useQuery({
          queryKey: ['key'],
          queryFn: simpleFetcher,
        }),
      )

      expectTypeOf(query.data).toEqualTypeOf<string | undefined>()
    })

    it('data should be defined when query is success', () => {
      const query = reactive(
        useQuery({
          queryKey: ['key'],
          queryFn: simpleFetcher,
        }),
      )

      if (query.isSuccess) {
        expectTypeOf(query.data).toEqualTypeOf<string>()
      }
    })

    it('error should be null when query is success', () => {
      const query = reactive(
        useQuery({
          queryKey: ['key'],
          queryFn: simpleFetcher,
        }),
      )

      if (query.isSuccess) {
        expectTypeOf(query.error).toEqualTypeOf<null>()
      }
    })

    it('data should be undefined when query is pending', () => {
      const query = reactive(
        useQuery({
          queryKey: ['key'],
          queryFn: simpleFetcher,
        }),
      )

      if (query.isPending) {
        expectTypeOf(query.data).toEqualTypeOf<undefined>()
      }
    })

    it('error should be defined when query is error', () => {
      const query = reactive(
        useQuery({
          queryKey: ['key'],
          queryFn: simpleFetcher,
        }),
      )

      if (query.isError) {
        expectTypeOf(query.error).toEqualTypeOf<Error>()
      }
    })
  })
})
