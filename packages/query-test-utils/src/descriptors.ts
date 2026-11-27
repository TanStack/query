/** Reports the reference identity promised by the original v6 factories. */
export const reusesQueryOptions = true
/** The original factory erases the numeric page parameter in its tagged data. */
export type NumericPageParam = unknown

/** Direction-specific fields exposed by a v6 infinite result. */
export type PageDirectionResultKeys =
  | 'isFetchNextPageError'
  | 'isFetchPreviousPageError'
  | 'isFetchingNextPage'
  | 'isFetchingPreviousPage'
/** The v6 loading-error type pins direction-specific page flags to false. */
export type PageFailureDuringLoad = false
/** The v6 refetch-error type leaves both page-error fields boolean. */
export type PageFailureDuringFullRefetch = boolean
