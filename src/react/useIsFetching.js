import React from 'react'

import { useMountedCallback } from './utils'
import { useQueryCache } from './ReactQueryCacheProvider'

export function useIsFetching() {
  const queryCache = useQueryCache()
  const [state, unsafeRerender] = React.useReducer(d => d + 1, 1)
  const rerender = useMountedCallback(unsafeRerender)

  React.useEffect(() => queryCache.subscribe(rerender), [queryCache, rerender])

  return React.useMemo(() => state && queryCache.isFetching, [
    queryCache.isFetching,
    state,
  ])
}
