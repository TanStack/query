import type {
  DehydratedState,
  InfiniteQueryObserverOptions,
  QueryKey
} from '@tanstack/query-core'
import { ObserverType, useBaseQuery } from './useBaseQuery'

export const useInfiniteQuery = (
  options: InfiniteQueryObserverOptions<
    unknown,
    Error,
    unknown,
    unknown,
    QueryKey
  >,
  initialState?: DehydratedState,
) => {
  return useBaseQuery(ObserverType.inifinite, options, initialState)
}
