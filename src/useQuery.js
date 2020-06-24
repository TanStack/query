import { useBaseQuery } from './useBaseQuery'
import { useQueryArgs, handleSuspense } from './utils'

export function useQuery(...args) {
  const query = useBaseQuery(...useQueryArgs(args))

  handleSuspense(query)

  return query
}
