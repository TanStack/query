import { describe, expectTypeOf, it } from 'vitest'
import { SuspenseQuery } from '../SuspenseQuery'
import { queryOptions } from '../queryOptions'
import type { UseSuspenseQueryResult } from '../types'

const useSuspenseQueryOptions = () =>
  queryOptions({
    queryKey: ['key'] as const,
    queryFn: () => Promise.resolve({ field: 'success' }),
  })

describe('<SuspenseQuery/>', () => {
  it('type check', () => {
    ;() => (
      <SuspenseQuery {...useSuspenseQueryOptions()}>
        {(query) => {
          expectTypeOf(query).toEqualTypeOf<
            UseSuspenseQueryResult<{ field: string }>
          >()
          expectTypeOf(query.data).toEqualTypeOf<{ field: string }>()
          expectTypeOf(query.data.field).toEqualTypeOf<string>()
          return null
        }}
      </SuspenseQuery>
    )
    ;() => (
      <SuspenseQuery
        {...useSuspenseQueryOptions()}
        select={(data) => data.field}
      >
        {(selectedQuery) => {
          expectTypeOf(selectedQuery).toEqualTypeOf<
            UseSuspenseQueryResult<string>
          >()
          expectTypeOf(selectedQuery.data).toEqualTypeOf<string>()
          return null
        }}
      </SuspenseQuery>
    )
  })
})
