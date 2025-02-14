import { describe, expectTypeOf, it } from 'vitest'
import { signal } from '@angular/core'
import { injectQueries, queryOptions } from '..'
import type { QueryObserverResult } from '..'
import type { Signal } from '@angular/core'

describe('Config object overload', () => {
  it('should return correct data for dynamic queries with mixed result types', () => {
    const Queries1 = {
      get: () =>
        queryOptions({
          queryKey: ['key1'],
          queryFn: () => Promise.resolve(1),
        }),
    }
    const Queries2 = {
      get: () =>
        queryOptions({
          queryKey: ['key2'],
          queryFn: () => Promise.resolve(true),
        }),
    }

    const queries1List = [1, 2, 3].map(() => ({ ...Queries1.get() }))
    const result = injectQueries({
      queries: signal([...queries1List, { ...Queries2.get() }]),
    })

    expectTypeOf(result).toEqualTypeOf<
      Signal<
        [
          ...Array<QueryObserverResult<number, Error>>,
          QueryObserverResult<boolean, Error>,
        ]
      >
    >()

    expectTypeOf(result()[0].data).toEqualTypeOf<number | boolean | undefined>()
  })
})
