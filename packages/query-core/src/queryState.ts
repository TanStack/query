import { canFetch } from './retryer'
import type { QueryState } from './query'
import type { InitialDataFunction, QueryOptions } from './types'

/**
 * Returns the state changes applied when a query starts fetching.
 * @param data - The query's current data. If it is `undefined`, the query is also reset to
 * `'pending'` with no error.
 * @param options - The query options, whose `networkMode` decides whether the query is `'fetching'`
 * or `'paused'`.
 * @returns The partial query state for a starting fetch.
 */
export function fetchState<TData>(
  data: TData | undefined,
  options: Pick<QueryOptions, 'networkMode'>,
) {
  return {
    fetchFailureCount: 0,
    fetchFailureReason: null,
    fetchStatus: canFetch(options.networkMode) ? 'fetching' : 'paused',
    ...(data === undefined &&
      ({
        error: null,
        status: 'pending',
      } as const)),
  } as const
}

/**
 * Returns the state changes applied when a query receives data.
 * @param data - The new data.
 * @param dataUpdatedAt - The timestamp the data is recorded with. Defaults to the current time.
 * @returns The partial query state for a successful update.
 */
export function successState<TData>(
  data: TData | undefined,
  dataUpdatedAt?: number,
) {
  return {
    data,
    dataUpdatedAt: dataUpdatedAt ?? Date.now(),
    error: null,
    isInvalidated: false,
    status: 'success' as const,
  }
}

/**
 * Returns the initial state of a query, based on its `initialData` and `initialDataUpdatedAt`
 * options.
 * @param options - Supplies the initial cache value and its update time.
 * @returns The initial query state: `'success'` if `initialData` is set, otherwise `'pending'`.
 */
export function getDefaultQueryState<TData>(
  options: Pick<QueryOptions<TData>, 'initialData' | 'initialDataUpdatedAt'>,
): QueryState<TData, never> {
  const { initialData, initialDataUpdatedAt } = options
  const data = typeof initialData === 'function'
    ? (initialData as InitialDataFunction<TData>)()
    : initialData

  const hasData = data !== undefined

  const dataUpdatedAt = hasData
    ? (typeof initialDataUpdatedAt === 'function' ? initialDataUpdatedAt() : initialDataUpdatedAt) ?? Date.now()
    : 0

  return {
    data,
    dataUpdateCount: 0,
    dataUpdatedAt,
    error: null,
    errorUpdateCount: 0,
    errorUpdatedAt: 0,
    fetchFailureCount: 0,
    fetchFailureReason: null,
    fetchMeta: null,
    isInvalidated: false,
    status: hasData ? 'success' : 'pending',
    fetchStatus: 'idle',
  }
}
