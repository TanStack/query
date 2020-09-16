import React from 'react'

import { useQueryCache } from './ReactQueryCacheProvider'
import { useIsMounted } from './utils'

export function useIsFetching(): number {
  const isMounted = useIsMounted()
  const queryCache = useQueryCache()
  const [isFetching, setIsFetching] = React.useState(queryCache.isFetching)

  React.useEffect(
    () =>
      queryCache.subscribe(() => {
        if (isMounted()) {
          setIsFetching(queryCache.isFetching)
        }
      }),
    [queryCache, setIsFetching, isMounted]
  )

  return isFetching
}
