import { useBaseQuery } from './useBaseQuery'
import { getQueryArgs, statusError, statusLoading } from './utils'

export function useQuery(...args) {
  const query = useBaseQuery(...getQueryArgs(args))

  if (query.config.suspense) {
    if (query.status === statusError) {
      throw query.error
    }
    if (query.status === statusLoading) {
      query.wasSuspensed = true
      throw query.refetch()
    }
  }

  return query
}
