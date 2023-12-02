import { describe, it } from 'vitest'
import { queryOptions, useQueries } from '..'
import { doNotExecute } from './utils'
import type { UseQueryOptions } from '..'
import type { Equal, Expect } from './utils'

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

    doNotExecute(() => {
      const queryResults = useQueries({ queries: [query1, query2, query3] })

      const query1Data = queryResults[0].data
      const query2Data = queryResults[1].data
      const query3Data = queryResults[2].data

      const result1: Expect<Equal<{ wow: boolean }, typeof query1Data>> = true

      const result2: Expect<Equal<string, typeof query2Data>> = true

      const result3: Expect<Equal<string | undefined, typeof query3Data>> = true

      return result1 && result2 && result3
    })
  })

  it('TData should be defined when passed through queryOptions', () => {
    doNotExecute(() => {
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

      const result: Expect<Equal<{ wow: boolean }, typeof data>> = true
      return result
    })
  })

  it('it should be possible to define a different TData than TQueryFnData using select with queryOptions spread into useQuery', () => {
    doNotExecute(() => {
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

      const result1: Expect<Equal<boolean | undefined, typeof query1Data>> =
        true
      const result2: Expect<Equal<boolean | undefined, typeof query2Data>> =
        true
      return result1 && result2
    })
  })

  it('TData should have undefined in the union when initialData is provided as a function which can return undefined', () => {
    doNotExecute(() => {
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

      const result: Expect<Equal<{ wow: boolean } | undefined, typeof data>> =
        true
      return result
    })
  })

  describe('custom hook', () => {
    it('should allow custom hooks using UseQueryOptions', () => {
      doNotExecute(() => {
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

        const queryResults = useCustomQueries()
        const data = queryResults[0].data

        const result: Expect<Equal<Data | undefined, typeof data>> = true
        return result
      })
    })
  })
})
