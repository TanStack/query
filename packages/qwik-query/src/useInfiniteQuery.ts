import type {
  DehydratedState
} from '@tanstack/query-core'
import { ObserverType, useBaseQuery } from './useBaseQuery'

export const useInfiniteQuery = (
  options: any,
  //  InfiniteQueryObserverOptions<
  //   unknown,
  //   Error,
  //   unknown,
  //   unknown,
  //   QueryKey
  // >,
  initialState?: DehydratedState,
) => {
  return useBaseQuery(ObserverType.inifinite, options, initialState)
}
