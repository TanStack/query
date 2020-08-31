import React from 'react'
import { useQueryCache } from 'react-query'

import { hydrate } from './hydration'

export function useHydrate(queries: unknown) {
  const queryCache = useQueryCache()

  // Running hydrate again with the same queries is safe,
  // it wont overwrite or initialize existing queries,
  // relying on useMemo here is only a performance optimization
  React.useMemo(() => {
    if (queries) {
      hydrate(queryCache, queries)
    }
    return undefined
  }, [queryCache, queries])
}

export interface HydrateProps {
  state?: unknown
}

export const Hydrate: React.FC<HydrateProps> = ({ state, children }) => {
  useHydrate(state)
  return children as React.ReactElement<any>
}
