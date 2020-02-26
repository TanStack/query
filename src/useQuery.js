import { useBaseQuery } from './useBaseQuery'
import { getQueryArgs } from './utils'

export function useQuery(...args) {
  return useBaseQuery(...getQueryArgs(args))
}
