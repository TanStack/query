export const infiniteQueryFunctions = [
  'infiniteQueryOptions',
  'useInfiniteQuery',
  'useSuspenseInfiniteQuery',
] as const

/**
 * The names of the functions whose options the `infinite-query-property-order` rule checks.
 */
export type InfiniteQueryFunctions = (typeof infiniteQueryFunctions)[number]

export const checkedProperties = [
  'queryFn',
  'getPreviousPageParam',
  'getNextPageParam',
] as const

/**
 * The option properties whose order the `infinite-query-property-order` rule checks.
 */
export type InfiniteQueryProperties = (typeof checkedProperties)[number]

export const sortRules = [
  [['queryFn'], ['getPreviousPageParam', 'getNextPageParam']],
] as const
