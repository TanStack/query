import type { ResourceSnapshot } from '@angular/core'
import type { QueryObserverResult } from '@tanstack/query-core'

/**
 * Projects a TanStack `QueryObserverResult` onto Angular's `ResourceSnapshot` shape
 * so it can drive a real `Resource<T>` through `resourceFromSnapshots`.
 *
 * The mapping is intentionally lossless for the states Angular's resource model can
 * represent and deterministic for the rest:
 *
 * | TanStack result                                   | Resource status |
 * | ------------------------------------------------- | --------------- |
 * | `status: 'error'` (no data)                       | `error`         |
 * | `status: 'pending'` + `fetchStatus: 'idle'`       | `idle`          |
 * | `status: 'pending'` + fetching/paused             | `loading`       |
 * | `isPlaceholderData` (placeholder / keepPrevious)  | `loading`       |
 * | `status: 'success'` + `fetchStatus: 'fetching'`   | `reloading`     |
 * | `status: 'success'` + idle                        | `resolved`      |
 *
 * Notes:
 * - The `loading`/`reloading` snapshot variants carry a `value`, so placeholder data
 *   and the previously cached data stay visible while a refetch is in flight — the
 *   same behaviour as `placeholderData` / `keepPreviousData` in the other APIs.
 * - A background refetch that errors while data is still cached keeps surfacing the
 *   data as `reloading` rather than flipping to `error`, matching how the rest of the
 *   library preserves the last good data across refetch errors.
 */
export function toResourceSnapshot<TData, TError>(
  result: QueryObserverResult<TData, TError>,
): ResourceSnapshot<TData | undefined> {
  if (result.status === 'error' && result.data === undefined) {
    return { status: 'error', error: result.error as Error }
  }

  if (result.status === 'pending') {
    return result.fetchStatus === 'idle'
      ? { status: 'idle', value: undefined }
      : { status: 'loading', value: undefined }
  }

  // `success` (or `error` with previously cached data still shown).
  if (result.isPlaceholderData) {
    return { status: 'loading', value: result.data }
  }

  return {
    status: result.fetchStatus === 'fetching' ? 'reloading' : 'resolved',
    value: result.data,
  }
}
