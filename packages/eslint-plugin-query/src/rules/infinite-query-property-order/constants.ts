export const infiniteQueryFunctions = [
  'infiniteQueryOptions',
  'useInfiniteQuery',
  'useSuspenseInfiniteQuery',
] as const

export type InfiniteQueryFunctions = (typeof infiniteQueryFunctions)[number]

export const checkedProperties = [
  'queryFn',
  'getPreviousPageParam',
  'getNextPageParam',
] as const

export type InfiniteQueryProperties = (typeof checkedProperties)[number]

export const sortRules = [
  [['queryFn'], ['getPreviousPageParam', 'getNextPageParam']],
] as const
