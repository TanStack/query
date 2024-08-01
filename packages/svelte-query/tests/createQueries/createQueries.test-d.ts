import { describe, expectTypeOf, test } from 'vitest'
import { get } from 'svelte/store'
import { skipToken } from '@tanstack/query-core'
import { createQueries, queryOptions } from '../../src/index.js'
import type { OmitKeyof, QueryObserverResult } from '@tanstack/query-core'
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
    const queryResults = createQueries({ queries: [options] })

    const data = get(queryResults)[0].data

    expectTypeOf(data).toEqualTypeOf<{ wow: boolean }>()
  })

  test('Allow custom hooks using UseQueryOptions', () => {
    type Data = string

    const useCustomQueries = (
      options?: OmitKeyof<CreateQueryOptions<Data>, 'queryKey' | 'queryFn'>,
    ) => {
      return createQueries({
        queries: [
          {
            ...options,
            queryKey: ['todos-key'],
            queryFn: () => Promise.resolve('data'),
          },
        ],
      })
    }

    const query = useCustomQueries()
    const data = get(query)[0].data

    expectTypeOf(data).toEqualTypeOf<Data | undefined>()
  })

  test('TData should have correct type when conditional skipToken is passed', () => {
    const queryResults = createQueries({
      queries: [
        {
          queryKey: ['withSkipToken'],
          queryFn: Math.random() > 0.5 ? skipToken : () => Promise.resolve(5),
        },
      ],
    })

    const firstResult = get(queryResults)[0]

    expectTypeOf(firstResult).toEqualTypeOf<
      QueryObserverResult<number, Error>
    >()
    expectTypeOf(firstResult.data).toEqualTypeOf<number | undefined>()
  })
})
