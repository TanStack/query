import { QueryCache as QC } from '@tanstack/query-core'
import { cloneDeepUnref } from './utils'
import type {
  DefaultError,
  Query,
  QueryFilters,
  WithRequired,
} from '@tanstack/query-core'
import type { MaybeRefDeep } from './types'

/**
 * Vue-aware subclass of `@tanstack/query-core`'s `QueryCache`. `find`/`findAll` also accept a
 * {@link MaybeRefDeep} filters object, so `ref`s can be passed directly without unwrapping. Access it via
 * `queryClient.getQueryCache()` — `QueryClient` constructs one of these by default.
 */
export class QueryCache extends QC {
  find<TQueryFnData = unknown, TError = DefaultError, TData = TQueryFnData>(
    filters: MaybeRefDeep<WithRequired<QueryFilters, 'queryKey'>>,
  ): Query<TQueryFnData, TError, TData> | undefined {
    return super.find(cloneDeepUnref(filters))
  }

  findAll(filters: MaybeRefDeep<QueryFilters> = {}): Array<Query> {
    return super.findAll(cloneDeepUnref(filters))
  }
}
