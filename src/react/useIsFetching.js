import React from 'react'

import { useRerenderer, useGetLatest } from './utils'
import { useQueryCache } from './ReactQueryCacheProvider'

export function useIsFetching() {
  const queryCache = useQueryCache()
  const rerender = useRerenderer()
  const isFetching = queryCache.isFetching

  const getIsFetching = useGetLatest(isFetching)

  React.useEffect(
    () =>
      queryCache.subscribe(newCache => {
        if (getIsFetching() !== newCache.isFetching) {
          rerender()
        }
      }),
    [getIsFetching, queryCache, rerender]
  )

  return isFetching
}
