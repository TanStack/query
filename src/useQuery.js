import { useBaseQuery } from './useBaseQuery'
import { getQueryArgs, handleSuspense } from './utils'

export function useQuery(...args) {
  const query = useBaseQuery(...getQueryArgs(args))

  handleSuspense(query)

  return query
}
