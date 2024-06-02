import { describe, expectTypeOf, it } from 'vitest'
import { reactive } from 'vue'
import { skipToken, useQueries } from '..'
import { queryOptions } from '../queryOptions'
import type { OmitKeyof } from '..'
import type { UseQueryOptions } from '../useQuery'

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

    const query2 = queryOptions({
      queryKey: ['key2'],
      queryFn: () => 'Query Data',
      initialData: 'initial data',
    })

    const query3 = {
      queryKey: ['key2'],
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

    const { value: queriesState } = useQueries({ queries: [options] })

    expectTypeOf(queriesState[0].data).toEqualTypeOf<{ wow: boolean }>()
  })

  it('it should be possible to define a different TData than TQueryFnData using select with queryOptions spread into useQueries', () => {
    const query1 = queryOptions({
      queryKey: ['key'],
      queryFn: () => Promise.resolve(1),
      select: (data) => data > 1,
    })

    const query2 = {
      queryKey: ['key'],
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
    const { value: queriesState } = useQueries({
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

    expectTypeOf(queriesState[0].data).toEqualTypeOf<
      { wow: boolean } | undefined
    >()
  })

  it('TData should have correct type when conditional skipToken is passed', () => {
    const { value: queriesState } = useQueries({
      queries: [
        queryOptions({
          queryKey: ['key'],
          queryFn: Math.random() > 0.5 ? skipToken : () => Promise.resolve(5),
        }),
      ],
    })

    expectTypeOf(queriesState[0].data).toEqualTypeOf<number | undefined>()
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
              queryKey: ['todos-key'],
              queryFn: () => Promise.resolve('data'),
            },
          ],
        })

      const { value: queriesState } = useCustomQueries()

      expectTypeOf(queriesState[0].data).toEqualTypeOf<string | undefined>()
    })
  })
})
