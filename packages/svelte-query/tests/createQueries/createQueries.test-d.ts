import { describe, expectTypeOf, test } from 'vitest'
import { skipToken } from '@tanstack/query-core'
import { createQueries, queryOptions } from '../../src/index.js'
import type { QueryObserverResult } from '@tanstack/query-core'
import type { CreateQueryOptions } from '../../src/index.js'

describe('createQueries', () => {
  test('TData should be defined when passed through queryOptions', () => {
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
    const queryResults = createQueries({ queries: () => [options] })

    const data = queryResults[0].data

    expectTypeOf(data).toEqualTypeOf<{ wow: boolean }>()
  })

  test('Allow custom hooks using UseQueryOptions', () => {
    type Data = string

    const useCustomQueries = (options?: CreateQueryOptions<Data>) => {
      return createQueries({
        queries: () => [
          {
            ...options,
            queryKey: ['todos-key'],
            queryFn: () => Promise.resolve('data'),
          },
        ],
      })
    }

    const query = useCustomQueries()
    const data = query[0].data

    expectTypeOf(data).toEqualTypeOf<Data | undefined>()
  })

  test('TData should have correct type when conditional skipToken is passed', () => {
    const queryResults = createQueries({
      queries: () => [
        {
          queryKey: ['withSkipToken'],
          queryFn: Math.random() > 0.5 ? skipToken : () => Promise.resolve(5),
        },
      ],
    })

    const firstResult = queryResults[0]

    expectTypeOf(firstResult).toEqualTypeOf<
      QueryObserverResult<number, Error>
    >()
    expectTypeOf(firstResult.data).toEqualTypeOf<number | undefined>()
  })
})
