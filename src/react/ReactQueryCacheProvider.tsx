import React from 'react'

import {
  QueryCache,
  queryCache as defaultQueryCache,
  queryCaches,
} from '../core'

const queryCacheContext = React.createContext(defaultQueryCache)

export const useQueryCache = () => React.useContext(queryCacheContext)

export interface ReactQueryCacheProviderProps {
  queryCache?: QueryCache
}

export const ReactQueryCacheProvider: React.FC<ReactQueryCacheProviderProps> = ({
  queryCache,
  children,
}) => {
  const resolvedQueryCache = React.useMemo(
    () => queryCache || new QueryCache(),
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
