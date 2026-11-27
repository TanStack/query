import {
  replaceData,
  shallowEqualObjects,
} from '@tanstack/query-core/primitives'
import { projectResult } from './projectResult'
import type { Query } from './query'
import type {
  ProjectionFailure,
  QueryObserverResultContext,
} from './queryObserver'
import type { QueryKey, QueryObserverOptionsBase } from './types'

/* #__NO_SIDE_EFFECTS__ */
/**
 * Supplies temporary data while an observed query has no cached result.
 * @param value - A placeholder value or a factory receiving the previous query and its data.
 * @returns A query placeholder option.
 */
export function placeholderData<TValue>(
  value: TValue,
): readonly [typeof placeholderData, TValue] {
  return [placeholderData, value]
}

placeholderData.project = projectResult
placeholderData.resolve = resolvePlaceholder

/**
 * Reuses a pending query's placeholder until its factory, source query or sharing policy changes.
 * @param options - Options that supply the placeholder.
 * @param context - This observer or reader's cached placeholder.
 * @param previousData - The previous data for structural sharing.
 * @param previousQuery - The last observed query with defined data.
 * @returns Placeholder data or the error thrown by its factory.
 */
function resolvePlaceholder<
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
  context: QueryObserverResultContext<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey
  >,
  previousData: TData | undefined,
  previousQuery: Query<TQueryFnData, TError, TQueryData, TQueryKey> | undefined,
): QueryObserverResultContext<
  TQueryFnData,
  TError,
  TData,
  TQueryData,
  TQueryKey
>['placeholder'] {
  const value = options.placeholderData![1]
  const previousState = previousQuery?.state
  const key: NonNullable<typeof context.placeholder>['key'] = {
    placeholderData: value,
    structuralSharing: options.structuralSharing,
    previousQuery,
    previousState,
    previousOptions: previousQuery?.options,
  }
  const memo = context.placeholder
  if (shallowEqualObjects(key, memo?.key)) return memo

  let input: TQueryData | undefined
  let sourceQuery: typeof previousQuery
  let failure: ProjectionFailure<TError> | undefined
  if (typeof value === 'function') {
    try {
      input = (
        value as unknown as (
          previous: TQueryData | undefined,
          query: typeof previousQuery,
        ) => TQueryData | undefined
      )(previousState?.data, previousQuery)
    } catch (error) {
      failure = { error: error as TError, errorUpdatedAt: Date.now() }
    }
    if (previousState?.data !== undefined) sourceQuery = previousQuery
  } else {
    input = value
  }
  if (input !== undefined)
    input = replaceData(previousData, input as unknown, options) as TQueryData
  return input !== undefined || failure
    ? { key, input, sourceQuery, failure }
    : undefined
}
