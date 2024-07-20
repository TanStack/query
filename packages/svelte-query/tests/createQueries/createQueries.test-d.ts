import { describe, expectTypeOf, test } from 'vitest'
import { get } from 'svelte/store'
import { createQueries, queryOptions } from '../../src/index'

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
})
