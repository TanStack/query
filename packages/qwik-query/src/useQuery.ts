import type {
  DefaultedQueryObserverOptions,
  DehydratedState,
  QueryKey,
} from '@tanstack/query-core'
import { ObserverType, useBaseQuery } from './useBaseQuery'

export const useQuery = (
  options: DefaultedQueryObserverOptions<
    unknown,
    Error,
    unknown,
    unknown,
    QueryKey
  >,
  initialState?: DehydratedState,
) => {
  return useBaseQuery(ObserverType.base, options, initialState)
}
