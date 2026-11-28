import { equalItems } from './equalItems'
import { clearObsoleteSelection, projectResult } from './projectResult'
import { replaceData } from './utils'
import type { Select } from './projectionTypes'
import type { Query } from './query'
import type { QueryObserverResultContext } from './queryObserver'
import type { QueryKey, QueryObserverOptionsBase } from './types'

/* #__NO_SIDE_EFFECTS__ */
/**
 * Derives observer data from the cached query data.
 * @param transform - Computes the selected data from the cached value.
 * @returns A query selection option.
 */
export function select<TInput, TData>(
  transform: (input: TInput) => TData,
): Select<TInput, TData> {
  // A callable option lets TypeScript infer the callback input from the surrounding query.
  const selection = [select, transform] as const
  return () => selection
}

select.project = projectResult
select.resolve = resolveSelection

/**
 * Memoizes the result or error of applying a selector to query or placeholder data.
 * @param options - Options controlling structural sharing.
 * @param transform - The caller's selector.
 * @param context - Selection state for this observer or render.
 * @param committed - The last committed selection, which a reader may reuse.
 * @param previousData - The previous data for structural sharing.
 * @param input - The value passed to the selector.
 * @param sourceQuery - The query supplying the selected data, if any.
 */
function resolveSelection<
  TQueryFnData,
  TError,
  TData,
  TQueryData,
  TQueryKey extends QueryKey,
>(
  options: QueryObserverOptionsBase<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey
  >,
  transform: (data: TQueryData) => TData,
  context: QueryObserverResultContext<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey
  >,
  committed: typeof context,
  previousData: TData | undefined,
  input: TQueryData,
  sourceQuery: Query<TQueryFnData, TError, TQueryData, TQueryKey> | undefined,
): void {
  const key = [input, transform, options.structuralSharing] as const
  if (
    context !== committed &&
    equalItems<unknown>(key, committed.selection?.key)
  ) {
    context.selection = committed.selection
    context.selected = committed.selected
    clearObsoleteSelection(context)
  }
  if (equalItems<unknown>(key, context.selection?.key)) return
  try {
    const data = replaceData(previousData, transform(input), options)
    context.selected = { data, query: sourceQuery }
    context.selection = { key }
  } catch (error) {
    context.selection = {
      key,
      failure: { error: error as TError, errorUpdatedAt: Date.now() },
    }
  }
}
