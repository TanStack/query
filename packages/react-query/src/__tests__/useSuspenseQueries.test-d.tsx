import { describe, expectTypeOf, it } from 'vitest'
import { skipToken, useSuspenseQueries } from '..'
import { queryOptions } from '../queryOptions'
import type { OmitKeyof } from '..'
import type { UseQueryOptions, UseSuspenseQueryResult } from '../types'

describe('UseSuspenseQueries config object overload', () => {
  it('TData should always be defined', () => {
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
    }

    const queryResults = useSuspenseQueries({ queries: [query1, query2] })

    const query1Data = queryResults[0].data
    const query2Data = queryResults[1].data

    expectTypeOf(query1Data).toEqualTypeOf<{ wow: boolean }>()
    expectTypeOf(query2Data).toEqualTypeOf<string>()
  })

  it('TData should be defined when passed through queryOptions', () => {
    const options = queryOptions({
      queryKey: ['key'],
      queryFn: () => {
        return {
          wow: true,
        }
      },
    })
    const queryResults = useSuspenseQueries({ queries: [options] })

    const data = queryResults[0].data

    expectTypeOf(data).toEqualTypeOf<{ wow: boolean }>()
  })

  it('should be possible to define a different TData than TQueryFnData using select with queryOptions spread into useQuery', () => {
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

    const queryResults = useSuspenseQueries({ queries: [query1, query2] })
    const query1Data = queryResults[0].data
    const query2Data = queryResults[1].data

    expectTypeOf(query1Data).toEqualTypeOf<boolean>()
    expectTypeOf(query2Data).toEqualTypeOf<boolean>()
  })

  it('TData should have undefined in the union when initialData is provided as a function which can return undefined', () => {
    const queryResults = useSuspenseQueries({
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

    expectTypeOf(data).toEqualTypeOf<{ wow: boolean }>()
  })

  it('should not allow skipToken in queryFn', () => {
    useSuspenseQueries({
      queries: [
        {
          queryKey: ['key'],
          // @ts-expect-error
          queryFn: skipToken,
        },
      ],
    })

    useSuspenseQueries({
      queries: [
        {
          queryKey: ['key'],
          // @ts-expect-error
          queryFn: Math.random() > 0.5 ? skipToken : () => Promise.resolve(5),
        },
      ],
    })
  })

  it('TData should have correct type when conditional skipToken is passed', () => {
    const queryResults = useSuspenseQueries({
      queries: [
        {
          queryKey: ['withSkipToken'],
          // @ts-expect-error
          queryFn: Math.random() > 0.5 ? skipToken : () => Promise.resolve(5),
        },
      ],
    })

    const firstResult = queryResults[0]

    expectTypeOf(firstResult).toEqualTypeOf<
      UseSuspenseQueryResult<number, Error>
    >()
    expectTypeOf(firstResult.data).toEqualTypeOf<number>()
  })

  describe('custom hook', () => {
    it('should allow custom hooks using UseQueryOptions', () => {
      type Data = string

      const useCustomQueries = (
        options?: OmitKeyof<UseQueryOptions<Data>, 'queryKey' | 'queryFn'>,
      ) => {
        return useSuspenseQueries({
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

      expectTypeOf(data).toEqualTypeOf<Data>()
    })
  })
})
