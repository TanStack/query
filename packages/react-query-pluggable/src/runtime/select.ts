import {
  replaceData,
  shallowEqualObjects,
} from '@tanstack/query-core/primitives'
import { projectResult } from './projectResult'
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
  return [select, transform]
}

select.project = projectResult
select.reuse = reuseSelection
select.resolve = resolveSelection

/**
 * Reuses the last committed selection when a reader sees the same input and selector.
 * @param options - The reader's options.
 * @param query - The query being read.
 * @param committed - Memoized selections for the active observer.
 * @param context - Selections local to this result reader.
 */
function reuseSelection<
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
  query: Query<TQueryFnData, TError, TQueryData, TQueryKey>,
  committed: QueryObserverResultContext<
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
): void {
  const transform = options.select?.[1]
  const input = query.state.data
  if (
    input !== undefined &&
    transform &&
    shallowEqualObjects(
      {
        input,
        select: transform,
        structuralSharing: options.structuralSharing,
      },
      committed.selection?.key,
    )
  ) {
    context.selection = committed.selection
    context.selected = committed.selected
  }
}

/**
 * Memoizes the result or error of applying a selector to query or placeholder data.
 * @param options - Options controlling structural sharing.
 * @param transform - The caller's selector.
 * @param context - Selection state for this observer or render.
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
  previousData: TData | undefined,
  input: TQueryData,
  sourceQuery: Query<TQueryFnData, TError, TQueryData, TQueryKey> | undefined,
): void {
  const key = {
    input,
    select: transform,
    structuralSharing: options.structuralSharing,
  }
  if (shallowEqualObjects(key, context.selection?.key)) return
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
