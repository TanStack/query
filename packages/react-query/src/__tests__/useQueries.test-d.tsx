import { describe, expectTypeOf, it } from 'vitest'
import { skipToken } from '..'
import { useQueries } from '../useQueries'
import { queryOptions } from '../queryOptions'
import type { OmitKeyof } from '..'
import type { UseQueryOptions } from '../types'

describe('UseQueries config object overload', () => {
  it('TData should always be defined when initialData is provided as an object', () => {
    const query1 = {
      queryKey: ['key1'],
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
      queryKey: ['key2'],
      queryFn: () => 'Query Data',
      initialData: 'initial data',
    }

    const query3 = {
      queryKey: ['key2'],
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
    const queryResults = useQueries({ queries: [options] })

    const data = queryResults[0].data

    expectTypeOf(data).toEqualTypeOf<{ wow: boolean }>()
  })

  it('it should be possible to define a different TData than TQueryFnData using select with queryOptions spread into useQuery', () => {
    const query1 = queryOptions({
      queryKey: ['key'],
      queryFn: () => Promise.resolve(1),
      select: (data) => data > 1,
    })

    const query2 = {
      queryKey: ['key'],
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
          queryKey: ['key'],
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
              queryKey: ['todos-key'],
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
          queryKey: ['withSkipToken'],
          queryFn: Math.random() > 0.5 ? skipToken : () => Promise.resolve(5),
        },
      ],
    })

    const data = queryResults[0].data

    expectTypeOf(data).toEqualTypeOf<number | undefined>()
  })
})
