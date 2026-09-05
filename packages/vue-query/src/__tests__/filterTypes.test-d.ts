import { describe, expectTypeOf, it } from 'vitest'
import type {
  MutationFilters as CoreMutationFilters,
  QueryFilters as CoreQueryFilters,
} from '@tanstack/query-core'
import type { MutationFilters, QueryFilters } from '../index'

describe('filter type exports', () => {
  it('should re-export core query filters', () => {
    expectTypeOf<QueryFilters>().toEqualTypeOf<CoreQueryFilters>()
    expectTypeOf<QueryFilters<readonly ['todos', string]>>().toEqualTypeOf<
      CoreQueryFilters<readonly ['todos', string]>
    >()
  })

  it('should re-export core mutation filters', () => {
    expectTypeOf<MutationFilters>().toEqualTypeOf<CoreMutationFilters>()
    expectTypeOf<
      MutationFilters<string, Error, number, boolean>
    >().toEqualTypeOf<CoreMutationFilters<string, Error, number, boolean>>()
  })
})
