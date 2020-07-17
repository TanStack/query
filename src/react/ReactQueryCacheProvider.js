import React from 'react'
import { queryCache as defaultQueryCache, queryCaches, makeQueryCache } from '../core'

export const queryCacheContext = React.createContext(defaultQueryCache)

export const useQueryCache = () => React.useContext(queryCacheContext)

export function ReactQueryCacheProvider({ queryCache, children }) {
  const resolvedQueryCache = React.useMemo(
    () => queryCache || makeQueryCache(),
    [queryCache]
  )

  React.useEffect(() => {
    queryCaches.push(resolvedQueryCache)

    return () => {
      // remove the cache from the active list
      const i = queryCaches.indexOf(resolvedQueryCache)
      if (i > -1) {
        queryCaches.splice(i, 1)
      }
      // if the resolvedQueryCache was created by us, we need to tear it down
      if (queryCache == null) {
        resolvedQueryCache.clear({ notify: false })
      }
    }
  }, [resolvedQueryCache, queryCache])

  return (
    <queryCacheContext.Provider value={resolvedQueryCache}>
      {children}
    </queryCacheContext.Provider>
  )
}
