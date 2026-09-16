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
  error: true,
  errorUpdatedAt: true,
  failureCount: true,
  failureReason: true,
  errorUpdateCount: true,
  isError: true,
  isFetched: true,
  isFetchedAfterMount: true,
  isFetching: true,
  isLoading: true,
  isPending: true,
  isLoadingError: true,
  isInitialLoading: true,
  isPaused: true,
  isPlaceholderData: true,
  isRefetchError: true,
  isRefetching: true,
  isStale: true,
  isSuccess: true,
  isEnabled: true,
  status: true,
  fetchStatus: true,
} satisfies Fields<QueryObserverResult>

const infiniteQueryFields = {
  ...queryFields,
  hasNextPage: true,
  hasPreviousPage: true,
  isFetchNextPageError: true,
  isFetchingNextPage: true,
  isFetchPreviousPageError: true,
  isFetchingPreviousPage: true,
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

export const queryResultFields = /* @__PURE__ */ Object.keys(
  queryFields,
) as Array<keyof typeof queryFields>
export const infiniteQueryResultFields = /* @__PURE__ */ Object.keys(
  infiniteQueryFields,
) as Array<keyof typeof infiniteQueryFields>

export const mutationResultFields = /* @__PURE__ */ Object.keys(
  mutationFields,
) as Array<keyof typeof mutationFields>
