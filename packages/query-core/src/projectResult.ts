import type { Query, QueryState } from './query'
import type { QueryObserverResultContext } from './queryObserver'
import type { QueryKey, QueryObserverOptionsBase } from './types'

/**
 * Computes the data, status and error visible to one observer.
 * @param query - The query whose cached data is being read.
 * @param state - The query state for this read, including optimistic fetch state.
 * @param options - The selection, placeholder and structural sharing options.
 * @param context - Memoized results for this observer or uncommitted result reader.
 * @param previousData - The preceding observer result for structural sharing.
 * @param previousQuery - The preceding query with defined cached data.
 * @param committed - The observer's committed projection state.
 * @returns The projected fields, including whether the result contains placeholder data.
 */
export function projectResult<
  TQueryFnData,
  TError,
  TData,
  TQueryData,
  TQueryKey extends QueryKey,
>(
  query: Query<TQueryFnData, TError, TQueryData, TQueryKey>,
  state: QueryState<TQueryData, TError>,
  options: QueryObserverOptionsBase<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey
  >,
  context: QueryObserverResultContext<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey
  >,
  previousData: TData | undefined,
  previousQuery: Query<TQueryFnData, TError, TQueryData, TQueryKey> | undefined,
  committed: typeof context,
): Pick<
  QueryState<TData, TError>,
  'data' | 'status' | 'error' | 'errorUpdatedAt'
> & { isPlaceholderData: boolean } {
  context.project = projectResult
  const { select, placeholderData } = options
  context.placeholder =
    state.data === undefined && state.status === 'pending' && placeholderData
      ? placeholderData[0].resolve(
          options,
          context,
          previousData,
          previousQuery,
        )
      : undefined
  const placeholder = context.placeholder
  const input = placeholder ? placeholder.input : state.data
  // A previously selected query may have lost its data even if this render has no selector.
  if (
    context.selected?.query &&
    context.selected.query.state.data === undefined
  ) {
    context.selected = undefined
    if (!context.selection?.failure) context.selection = undefined
  }
  if (select && input !== undefined) {
    select[0].resolve(
      options,
      select[1],
      context,
      committed,
      previousData,
      input,
      placeholder ? placeholder.sourceQuery : query,
    )
  } else {
    context.selection = undefined
  }
  const failure = placeholder?.failure ?? context.selection?.failure
  const isPlaceholderData = !!placeholder && input !== undefined && !failure
  const { error, errorUpdatedAt } = failure ?? state
  return {
    data: context.selection
      ? context.selected?.data
      : (input as unknown as TData | undefined),
    error,
    errorUpdatedAt,
    status: failure ? 'error' : isPlaceholderData ? 'success' : state.status,
    isPlaceholderData,
  }
}
