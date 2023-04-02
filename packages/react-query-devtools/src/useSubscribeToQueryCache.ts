import React from 'react'
import type { QueryCache } from '@tanstack/react-query'
import { notifyManager } from '@tanstack/react-query'

const useSubscribeToQueryCache = <T>(
  queryCache: QueryCache,
  getSnapshot: () => T,
  skip: boolean = false,
): T => {
  return React.useSyncExternalStore(
    React.useCallback(
      (onStoreChange) => {
        if (!skip)
          return queryCache.subscribe(notifyManager.batchCalls(onStoreChange))
        return () => {
          return
        }
      },
      [queryCache, skip],
    ),
    getSnapshot,
    getSnapshot,
  )
}

export default useSubscribeToQueryCache
