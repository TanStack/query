import { describe, expectTypeOf, it } from 'vitest'
import { QueryClient } from '../queryClient'
import type { QueryFilters } from '../utils'
import type { DataTag, QueryKey } from '../types'

describe('QueryFilters', () => {
  it('should be typed unknown even if tagged generics are passed', () => {
    type TData = { a: number; b: string }
    type TError = Error & { message: string }

    const filters: QueryFilters<DataTag<QueryKey, TData, TError>> = {
      predicate(query) {
        expectTypeOf(query.setData({ a: 1, b: '1' })).toEqualTypeOf<unknown>()
        return true
      },
      queryKey: ['key'] as DataTag<undefined, TData, TError>,
    }

    const queryClient = new QueryClient()

    const data = queryClient.getQueryData(filters.queryKey!)
    expectTypeOf(data).toEqualTypeOf<TData | undefined>()

    const error = queryClient.getQueryState(filters.queryKey!)?.error
    expectTypeOf(error).toEqualTypeOf<TError | null | undefined>()
  })

  it('should be loose typed if generics are defaults', () => {
    const a: QueryFilters = {
      predicate(query) {
        expectTypeOf(query.setData({ a: 1, b: '1' })).toEqualTypeOf<unknown>()
        return true
      },
      queryKey: ['key'],
    }

    const queryClient = new QueryClient()

    const data = queryClient.getQueryData(a.queryKey!)
    expectTypeOf(data).toEqualTypeOf<unknown>()

    const error = queryClient.getQueryState(a.queryKey!)?.error
    expectTypeOf(error).toEqualTypeOf<Error | null | undefined>()
  })
})
