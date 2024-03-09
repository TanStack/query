import { describe, expectTypeOf, it } from 'vitest'
import { reactive } from 'vue'
import { useQueries } from '..'
import { queryOptions } from '../queryOptions'
import type { UseQueryOptions } from '../useQuery'

describe('UseQueries config object overload', () => {
  it('TData should always be defined when initialData is provided as an object', () => {
    const query1 = {
      queryKey: ['key1'],
      queryFn: () => ({ wow: true }),
      initialData: { wow: false },
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

    const query1Data = queriesState[0].data
    const query2Data = queriesState[1].data
    const query3Data = queriesState[2].data

    expectTypeOf(query1Data).toEqualTypeOf<{ wow: boolean }>()
    expectTypeOf(query2Data).toEqualTypeOf<string>()
    expectTypeOf(query3Data).toEqualTypeOf<string | undefined>()
  })

  it('TData should be defined when passed through queryOptions', () => {
    const options = queryOptions({
      queryKey: ['key'],
      queryFn: () => ({ wow: true }),
      initialData: { wow: true },
    })

    const { value: queriesState } = useQueries({ queries: [options] })

    const data = queriesState[0].data

    expectTypeOf(data).toEqualTypeOf<{ wow: boolean }>()
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
    const query1Data = queriesState.value[0].data
    const query2Data = queriesState.value[1].data

    expectTypeOf(query1Data).toEqualTypeOf<boolean | undefined>()
    expectTypeOf(query2Data).toEqualTypeOf<boolean | undefined>()
  })

  it('TData should have undefined in the union when initialData is provided as a function which can return undefined', () => {
    const { value: queriesState } = useQueries({
      queries: [
        {
          queryKey: ['key'],
          queryFn: () => ({ wow: true }),
          initialData: () => undefined as { wow: boolean } | undefined,
        },
      ],
    })

    const data = queriesState[0].data

    expectTypeOf(data).toEqualTypeOf<{ wow: boolean } | undefined>()
  })

  describe('custom hook', () => {
    it('should allow custom hooks using UseQueryOptions', () => {
      type Data = string

      const useCustomQueries = (
        options?: Omit<UseQueryOptions<Data>, 'queryKey' | 'queryFn'>,
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

      const { value: queriesState } = useCustomQueries()
      const data = queriesState[0].data

      expectTypeOf(data).toEqualTypeOf<Data | undefined>()
    })
  })
})
