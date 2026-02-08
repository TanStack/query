import type { DataTag, DefaultError, QueryKey } from '@tanstack/query-core'
import type {
  DefinedInitialQueryOptions,
  UndefinedInitialQueryOptions,
} from './useQuery'
import type { ComputedRef, Ref } from 'vue-demi'

// Removes Ref and ComputedRef branches from a MaybeRef union type,
// leaving only the plain object type so all properties are directly
// accessible via dot notation.
// Fixes #7892: queryOptions return type only contains queryKey and
// initialData properties due to MaybeRef union narrowing.
type PlainQueryOptions<T> = Exclude<T, Ref<any> | ComputedRef<any>>

export function queryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: DefinedInitialQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
): PlainQueryOptions<
  DefinedInitialQueryOptions<TQueryFnData, TError, TData, TQueryKey>
> & {
  queryKey: DataTag<TQueryKey, TQueryFnData, TError>
}

export function queryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UndefinedInitialQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
): PlainQueryOptions<
  UndefinedInitialQueryOptions<TQueryFnData, TError, TData, TQueryKey>
> & {
  queryKey: DataTag<TQueryKey, TQueryFnData, TError>
}

export function queryOptions(options: unknown) {
  return options
}
