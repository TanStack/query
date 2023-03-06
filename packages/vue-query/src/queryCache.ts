import { QueryCache as QC } from '@tanstack/query-core'
import type {
  Query,
  QueryFilters,
  WithRequired,
  DefaultError,
} from '@tanstack/query-core'
import type { MaybeRefDeep } from './types'
import { cloneDeepUnref } from './utils'

export class QueryCache extends QC {
  find<TQueryFnData = unknown, TError = DefaultError, TData = TQueryFnData>(
    filters: MaybeRefDeep<WithRequired<QueryFilters, 'queryKey'>>,
  ): Query<TQueryFnData, TError, TData> | undefined {
    return super.find(cloneDeepUnref(filters))
  }

  findAll(filters: MaybeRefDeep<QueryFilters> = {}): Query[] {
    return super.findAll(cloneDeepUnref(filters))
  }
}
