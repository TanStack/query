import React from 'react'
import { hydrate } from './hydration'
import { useQueryCache } from 'react-query'

import type { HydrateConfig } from './hydration'

export function useHydrate(queries: unknown, hydrateConfig?: HydrateConfig) {
  const queryCache = useQueryCache()

  // Running hydrate again with the same queries is safe,
  // it wont overwrite or initialize existing queries,
  // relying on useMemo here is only a performance optimization
  const activateTimeouts = React.useMemo(() => {
    if (queries) {
      return hydrate(
        queryCache,
        queries,
        hydrateConfig
          ? { ...hydrateConfig, activateTimeoutsManually: true }
          : { activateTimeoutsManually: true }
      )
    }
    return undefined
  }, [queryCache, queries, hydrateConfig])

  React.useEffect(() => {
    if (activateTimeouts) {
      activateTimeouts()
    }
  }, [activateTimeouts])
}
