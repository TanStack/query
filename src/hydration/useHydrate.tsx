import React from 'react'
import { hydrate } from './hydration'
import { useQueryCache } from 'react-query'

import type { HydrateConfig } from './hydration'

export function useHydrate(queries: unknown, hydrateConfig?: HydrateConfig) {
  const queryCache = useQueryCache()

  // Running hydrate again with the same queries is safe,
  // it wont overwrite or initialize existing queries,
  // relying on useMemo here is only a performance optimization
  React.useMemo(() => {
    if (queries) {
      hydrate(queryCache, queries, hydrateConfig)
    }
    return undefined
  }, [queryCache, queries, hydrateConfig])
}
