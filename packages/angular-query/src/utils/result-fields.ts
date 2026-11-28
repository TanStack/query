import { computed } from '@angular/core'
import {
  isError,
  isFetchNextPageError,
  isFetchPreviousPageError,
  isFetched,
  isFetching,
  isFetchingNextPage,
  isFetchingPreviousPage,
  isLoading,
  isLoadingError,
  isPaused,
  isPending,
  isRefetchError,
  isRefetching,
  isSuccess,
} from '@tanstack/query-core'
import type { Signal } from '@angular/core'
import type {
  InfiniteQueryObserverResult,
  MutationObserverResult,
  QueryObserverResult,
} from '@tanstack/query-core'
import type { MethodKeys } from './signal-proxy'

type Fields<T> = { [K in Exclude<keyof T, MethodKeys<T>>]: true }

// Exhaustive maps keep the field surface aligned with query-core at compile time.
const queryFields = {
  data: true,
  dataUpdatedAt: true,
  dataUpdateCount: true,
  error: true,
  errorUpdatedAt: true,
  failureCount: true,
  failureReason: true,
  errorUpdateCount: true,
  isFetchedAfterMount: true,
  isPlaceholderData: true,
  isStale: true,
  isEnabled: true,
  status: true,
  fetchStatus: true,
} satisfies Fields<QueryObserverResult>

const infiniteQueryFields = {
  ...queryFields,
  fetchDirection: true,
  hasNextPage: true,
  hasPreviousPage: true,
} satisfies Fields<InfiniteQueryObserverResult>

const mutationFields = {
  context: true,
  data: true,
  error: true,
  failureCount: true,
  failureReason: true,
  isPaused: true,
  status: true,
  variables: true,
  submittedAt: true,
  isError: true,
  isIdle: true,
  isPending: true,
  isSuccess: true,
} satisfies Fields<MutationObserverResult>

export const queryResultFields = /* #__PURE__ */ Object.keys(
  queryFields,
) as Array<keyof typeof queryFields>
/**
 * The query observer value fields exposed as Angular signals.
 */
export type QueryResultFields = (typeof queryResultFields)[number]

export const infiniteQueryResultFields = /* #__PURE__ */ Object.keys(
  infiniteQueryFields,
) as Array<keyof typeof infiniteQueryFields>
/**
 * The paginated query observer value fields exposed as Angular signals.
 */
export type InfiniteQueryResultFields =
  (typeof infiniteQueryResultFields)[number]

export const mutationResultFields = /* #__PURE__ */ Object.keys(
  mutationFields,
) as Array<keyof typeof mutationFields>
/**
 * The mutation observer value fields exposed as Angular signals.
 */
export type MutationResultFields = (typeof mutationResultFields)[number]

/**
 * Angular exposes reactive status signals derived from the observer snapshot.
 * @param result - The current observer snapshot as a signal.
 * @returns Reactive predicates for the current query.
 */
export function queryStatusSignals(
  result: Signal<QueryObserverResult<unknown, unknown>>,
) {
  return {
    isError: computed(() => isError(result())),
    isFetched: computed(() => isFetched(result())),
    isFetching: computed(() => isFetching(result())),
    isLoading: computed(() => isLoading(result())),
    isPending: computed(() => isPending(result())),
    isLoadingError: computed(() => isLoadingError(result())),
    isPaused: computed(() => isPaused(result())),
    isRefetchError: computed(() => isRefetchError(result())),
    isRefetching: computed(() => isRefetching(result())),
    isSuccess: computed(() => isSuccess(result())),
  }
}

/**
 * Directional status signals of an infinite-query observer.
 * @param result - The current observer snapshot as a signal.
 * @returns Reactive predicates for the current page fetch.
 */
export function infiniteQueryStatusSignals(
  result: Signal<InfiniteQueryObserverResult<unknown, unknown>>,
) {
  return {
    ...queryStatusSignals(result),
    isFetchNextPageError: computed(() => isFetchNextPageError(result())),
    isFetchingNextPage: computed(() => isFetchingNextPage(result())),
    isFetchPreviousPageError: computed(() =>
      isFetchPreviousPageError(result()),
    ),
    isFetchingPreviousPage: computed(() => isFetchingPreviousPage(result())),
  }
}
