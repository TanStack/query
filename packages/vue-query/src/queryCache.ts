import { QueryCache as QC } from '@tanstack/query-core'
import { cloneDeepUnref, isQueryKey } from './utils'
import type { Query, QueryFilters, QueryKey } from '@tanstack/query-core'
import type { MaybeRefDeep } from './types'

export class QueryCache extends QC {
  find<TQueryFnData = unknown, TError = unknown, TData = TQueryFnData>(
    filters: MaybeRefDeep<QueryFilters>,
  ): Query<TQueryFnData, TError, TData> | undefined
  find<TQueryFnData = unknown, TError = unknown, TData = TQueryFnData>(
    queryKey: MaybeRefDeep<QueryKey>,
    filters?: MaybeRefDeep<QueryFilters>,
  ): Query<TQueryFnData, TError, TData> | undefined
  find<TQueryFnData = unknown, TError = unknown, TData = TQueryFnData>(
    arg1: MaybeRefDeep<QueryKey> | MaybeRefDeep<QueryFilters>,
    arg2?: MaybeRefDeep<QueryFilters>,
  ): Query<TQueryFnData, TError, TData> | undefined {
    const arg1Unreffed = cloneDeepUnref(arg1) as QueryKey | QueryFilters
    const arg2Unreffed = cloneDeepUnref(arg2) as QueryFilters
    if (isQueryKey(arg1Unreffed)) {
      return super.find(arg1Unreffed, arg2Unreffed)
    }
    return super.find(arg1Unreffed)
  }

  findAll(
    queryKey?: MaybeRefDeep<QueryKey>,
    filters?: MaybeRefDeep<QueryFilters>,
  ): Query[]
  findAll(filters?: MaybeRefDeep<QueryFilters>): Query[]
  findAll(
    arg1?: MaybeRefDeep<QueryKey | QueryFilters>,
    arg2?: MaybeRefDeep<QueryFilters>,
  ): Query[]
  findAll(
    arg1?: MaybeRefDeep<QueryKey> | MaybeRefDeep<QueryFilters>,
    arg2?: MaybeRefDeep<QueryFilters>,
  ): Query[] {
    const arg1Unreffed = cloneDeepUnref(arg1) as QueryKey | QueryFilters
    const arg2Unreffed = cloneDeepUnref(arg2) as QueryFilters
    if (isQueryKey(arg1Unreffed)) {
      return super.findAll(arg1Unreffed, arg2Unreffed)
    }
    return super.findAll(arg1Unreffed)
  }
}
