import React from 'react'

import { useQueryCache } from './ReactQueryCacheProvider'
import { useSafeState } from './utils'

export function useIsFetching(): number {
  const queryCache = useQueryCache()

  const [isFetching, setIsFetching] = useSafeState(queryCache.isFetching)

  React.useEffect(
    () =>
      queryCache.subscribe(() => {
        setIsFetching(queryCache.isFetching)
      }),
    [queryCache, setIsFetching]
  )

  return isFetching
}
