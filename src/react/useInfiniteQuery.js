//

import { useBaseQuery } from './useBaseQuery'
import { useQueryArgs, handleSuspense } from './utils'

export function useInfiniteQuery(...args) {
  let [queryKey, config] = useQueryArgs(args)

  config.infinite = true

  const queryInfo = useBaseQuery(queryKey, config)

  handleSuspense(queryInfo)

  return queryInfo
}
