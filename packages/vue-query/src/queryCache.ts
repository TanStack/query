import { QueryCache as QC } from '@tanstack/query-core'
import type { Query, QueryFilters, WithRequired } from '@tanstack/query-core'
import type { MaybeRefDeep } from './types'
import { cloneDeepUnref } from './utils'

export class QueryCache extends QC {
  find<TQueryFnData = unknown, TError = Error, TData = TQueryFnData>(
    filters: MaybeRefDeep<WithRequired<QueryFilters, 'queryKey'>>,
  ): Query<TQueryFnData, TError, TData> | undefined {
    const filtersUnreffed = cloneDeepUnref(filters) as WithRequired<
      QueryFilters,
      'queryKey'
    >
    return super.find(filtersUnreffed)
  }

  findAll(filters?: MaybeRefDeep<QueryFilters>): Query[] {
    const filtersUnreffed = cloneDeepUnref(filters) as QueryFilters
    return super.findAll(filtersUnreffed)
  }
}
