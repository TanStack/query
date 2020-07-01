import React from 'react'

import { useMountedCallback, useGetLatest } from './utils'
import { useQueryCache } from './ReactQueryCacheProvider'

export function useIsFetching() {
  const queryCache = useQueryCache()
  const [state, unsafeRerender] = React.useReducer(d => d + 1, 1)
  const rerender = useMountedCallback(unsafeRerender)

  const isFetching = React.useMemo(() => state && queryCache.isFetching, [
    queryCache.isFetching,
    state,
  ])

  const getIsFetching = useGetLatest(isFetching)

  React.useEffect(
    () =>
      queryCache.subscribe(newCache => {
        if (getIsFetching() !== newCache.isFetching) rerender()
      }),
    [getIsFetching, queryCache, rerender]
  )

  return isFetching
}
