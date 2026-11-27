import type { FetchDirection } from './query'
import type { FetchStatus, QueryStatus } from './types'

type Status = { status: QueryStatus }
type Fetch = { fetchStatus: FetchStatus }
type Data = { data: unknown }
type Page = { fetchDirection: FetchDirection | undefined }

/**
 * Narrows the result to the pending state, where there is no data to display.
 * @param result - The observer snapshot to inspect.
 * @returns Whether an observer is pending, including a paused or disabled initial fetch.
 */
export function isPending<TResult extends Status>(
  result: TResult,
): result is TResult & { status: 'pending' } {
  return result.status === 'pending'
}

/**
 * Narrows the result to the success state and preserves the selected data type.
 * @param result - The observer snapshot to inspect.
 * @returns Whether the observer has a successful result, including placeholder data.
 */
export function isSuccess<TResult extends Status>(
  result: TResult,
): result is TResult & { status: 'success' } {
  return result.status === 'success'
}

/**
 * Narrows the result to the error state and exposes the typed error.
 * @param result - The observer snapshot to inspect.
 * @returns Whether a fetch or selection failed, preserving the observer's error type.
 */
export function isError<TResult extends Status>(
  result: TResult,
): result is TResult & { status: 'error' } {
  return result.status === 'error'
}

/**
 * Checks the fetch status independently of displayed data and errors.
 * @param result - The observer snapshot to inspect.
 * @returns Whether the observer is fetching initial data, refreshing, or fetching a page.
 */
export function isFetching<TResult extends Fetch>(
  result: TResult,
): result is TResult & { fetchStatus: 'fetching' } {
  return result.fetchStatus === 'fetching'
}

/**
 * Identifies a request waiting for conditions such as network connectivity.
 * @param result - The observer snapshot to inspect.
 * @returns Whether the fetch is paused until it can continue.
 */
export function isPaused<TResult extends Fetch>(
  result: TResult,
): result is TResult & { fetchStatus: 'paused' } {
  return result.fetchStatus === 'paused'
}

/**
 * Distinguishes the first in-flight request from a disabled or paused query.
 * @param result - The observer snapshot to inspect.
 * @returns Whether the initial fetch is running and the observer is still pending.
 */
export function isLoading<TResult extends Status & Fetch>(
  result: TResult,
): result is TResult & { status: 'pending'; fetchStatus: 'fetching' } {
  return result.status === 'pending' && result.fetchStatus === 'fetching'
}

/**
 * Checks the underlying update counts, which also reflect manual cache writes.
 * @param result - The observer snapshot to inspect.
 * @returns Whether the underlying query has received at least one data update or error.
 */
export function isFetched(result: {
  dataUpdateCount: number
  errorUpdateCount: number
}): boolean {
  return result.dataUpdateCount + result.errorUpdateCount > 0
}

/**
 * Distinguishes an initial error from an error with data still available.
 * @param result - The observer snapshot to inspect.
 * @returns Whether a failed fetch or selection left the observer without data.
 */
export function isLoadingError<TResult extends Status & Data>(
  result: TResult,
): result is TResult & { status: 'error'; data: undefined } {
  return result.status === 'error' && result.data === undefined
}

/**
 * Narrows a failed full refetch to its retained data and error.
 * @param result - The observer snapshot to inspect.
 * @returns Whether a full refetch failed with existing data, excluding directional page requests.
 */
export function isRefetchError<TResult extends Status & Data & Partial<Page>>(
  result: TResult,
): result is TResult & {
  status: 'error'
  data: Exclude<TResult['data'], undefined>
  fetchDirection?: undefined
} {
  return (
    result.status === 'error' &&
    result.data !== undefined &&
    (!('fetchDirection' in result) || result.fetchDirection === undefined)
  )
}

/**
 * Identifies a full background fetch while previously resolved data or an error is visible.
 * @param result - The observer snapshot to inspect.
 * @returns Whether a full background refetch is running, excluding directional page requests.
 */
export function isRefetching<TResult extends Status & Fetch & Partial<Page>>(
  result: TResult,
): result is TResult & {
  status: 'success' | 'error'
  fetchStatus: 'fetching'
  fetchDirection?: undefined
} {
  return (
    result.fetchStatus === 'fetching' &&
    result.status !== 'pending' &&
    (!('fetchDirection' in result) || result.fetchDirection === undefined)
  )
}

/**
 * Checks for a forward page request currently in flight.
 * @param result - The observer snapshot to inspect.
 * @returns Whether the infinite observer is fetching its next page.
 */
export function isFetchingNextPage<TResult extends Fetch & Page>(
  result: TResult,
): result is TResult & { fetchStatus: 'fetching'; fetchDirection: 'forward' } {
  return (
    result.fetchStatus === 'fetching' && result.fetchDirection === 'forward'
  )
}

/**
 * Checks for a backward page request currently in flight.
 * @param result - The observer snapshot to inspect.
 * @returns Whether the infinite observer is fetching its previous page.
 */
export function isFetchingPreviousPage<TResult extends Fetch & Page>(
  result: TResult,
): result is TResult & { fetchStatus: 'fetching'; fetchDirection: 'backward' } {
  return (
    result.fetchStatus === 'fetching' && result.fetchDirection === 'backward'
  )
}

/**
 * Narrows an infinite result to a failed forward request.
 * @param result - The observer snapshot to inspect.
 * @returns Whether the most recent forward page request failed.
 */
export function isFetchNextPageError<TResult extends Status & Page>(
  result: TResult,
): result is TResult & { status: 'error'; fetchDirection: 'forward' } {
  return result.status === 'error' && result.fetchDirection === 'forward'
}

/**
 * Narrows an infinite result to a failed backward request.
 * @param result - The observer snapshot to inspect.
 * @returns Whether the most recent backward page request failed.
 */
export function isFetchPreviousPageError<TResult extends Status & Page>(
  result: TResult,
): result is TResult & { status: 'error'; fetchDirection: 'backward' } {
  return result.status === 'error' && result.fetchDirection === 'backward'
}
