import { describe, expectTypeOf, it } from 'vitest'
import { useQuery } from '../useQuery'
import { queryOptions } from '../queryOptions'
import type { OmitKeyof } from '..'
import type { UseQueryOptions, UseQueryResult } from '../types'

describe('initialData', () => {
  describe('Config object overload', () => {
    it('TData should always be defined when initialData is provided as an object', () => {
      const { data } = useQuery({
        queryKey: ['key'],
        queryFn: () => ({ wow: true }),
        initialData: { wow: true },
      })

      expectTypeOf(data).toEqualTypeOf<{ wow: boolean }>()
    })

    it('TData should be defined when passed through queryOptions', () => {
      const options = queryOptions({
        queryKey: ['key'],
        queryFn: () => {
          return {
            wow: true,
          }
        },
        initialData: {
          wow: true,
        },
      })
      const { data } = useQuery(options)

      expectTypeOf(data).toEqualTypeOf<{ wow: boolean }>()
    })

    it('should be possible to define a different TData than TQueryFnData using select with queryOptions spread into useQuery', () => {
      const options = queryOptions({
        queryKey: ['key'],
        queryFn: () => Promise.resolve(1),
      })

      const query = useQuery({
        ...options,
        select: (data) => data > 1,
      })

      expectTypeOf(query.data).toEqualTypeOf<boolean | undefined>()
    })

    it('TData should always be defined when initialData is provided as a function which ALWAYS returns the data', () => {
      const { data } = useQuery({
        queryKey: ['key'],
        queryFn: () => {
          return {
            wow: true,
          }
        },
        initialData: () => ({
          wow: true,
        }),
      })

      expectTypeOf(data).toEqualTypeOf<{ wow: boolean }>()
    })

    it('TData should have undefined in the union when initialData is NOT provided', () => {
      const { data } = useQuery({
        queryKey: ['key'],
        queryFn: () => {
          return {
            wow: true,
          }
        },
      })

      expectTypeOf(data).toEqualTypeOf<{ wow: boolean } | undefined>()
    })

    it('TData should have undefined in the union when initialData is provided as a function which can return undefined', () => {
      const { data } = useQuery({
        queryKey: ['key'],
        queryFn: () => {
          return {
            wow: true,
          }
        },
        initialData: () => undefined as { wow: boolean } | undefined,
      })

      expectTypeOf(data).toEqualTypeOf<{ wow: boolean } | undefined>()
    })

    it('TData should be narrowed after an isSuccess check when initialData is provided as a function which can return undefined', () => {
      const { data, isSuccess } = useQuery({
        queryKey: ['key'],
        queryFn: () => {
          return {
            wow: true,
          }
        },
        initialData: () => undefined as { wow: boolean } | undefined,
      })

      if (isSuccess) {
        expectTypeOf(data).toEqualTypeOf<{ wow: boolean }>()
      }
    })

    it('data should not have undefined when initialData is provided', () => {
      const { data } = useQuery({
        queryKey: ['query-key'],
        initialData: 42,
      })

      expectTypeOf(data).toEqualTypeOf<number>()
    })
  })

  describe('custom hook', () => {
    it('should allow custom hooks using UseQueryOptions', () => {
      type Data = string

      const useCustomQuery = (
        options?: OmitKeyof<UseQueryOptions<Data>, 'queryKey' | 'queryFn'>,
      ) => {
        return useQuery({
          ...options,
          queryKey: ['todos-key'],
          queryFn: () => Promise.resolve('data'),
        })
      }

      const { data } = useCustomQuery()

      expectTypeOf(data).toEqualTypeOf<Data | undefined>()
    })
  })

  describe('TData type inference', () => {
    it('no inference of TData from return annotations', () => {
      const _testFn = (): UseQueryResult<string, unknown> => {
        // @ts-expect-error expect number to be un-assignable to string
        return useQuery({
          queryKey: [],
          queryFn: () => 5,
        })
      }

      // @ts-expect-error expect number to be un-assignable to string
      const _val: UseQueryResult<string, unknown> = useQuery({
        queryKey: [],
        queryFn: () => 5,
      })
    })

    it('correct or superset type annotations produce no type errors', () => {
      const _testFn = (): UseQueryResult<number | string, unknown> => {
        return useQuery({
          queryKey: [],
          queryFn: () => 5,
        })
      }

      expectTypeOf(_testFn()['data']).toEqualTypeOf<string | number>()

      const _val: UseQueryResult<string | number, unknown> = useQuery({
        queryKey: [],
        queryFn: () => 5,
      })

      expectTypeOf(_val['data']).toEqualTypeOf<string | number | undefined>()
    })

    it('usage of select function still changes generic inference', () => {
      const result = useQuery({
        queryKey: [],
        queryFn: () => 5,
        select: () => 'foo',
      })

      expectTypeOf(result['data']).toEqualTypeOf<string | undefined>()

      const _result2 = useQuery<number, unknown, string, unknown[]>({
        queryKey: [],
        queryFn: () => 5,
        // @ts-expect-error select fn differs from generic (when provided), so correctly type errors)
        select: () => 5,
      })
    })
  })

  describe('structuralSharing', () => {
    it('should restrict to same types', () => {
      useQuery({
        queryKey: ['key'],
        queryFn: () => 5,
        structuralSharing: (_oldData, newData) => {
          return newData
        },
      })
    })
  })
})
