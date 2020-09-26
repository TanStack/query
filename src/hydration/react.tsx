import React from 'react'

import { useQueryClient } from '../react'
import { hydrate } from './hydration'

export function useHydrate(queries: unknown) {
  const client = useQueryClient()
  const cache = client.getCache()

  // Running hydrate again with the same queries is safe,
  // it wont overwrite or initialize existing queries,
  // relying on useMemo here is only a performance optimization
  React.useMemo(() => {
    if (queries) {
      hydrate(cache, queries)
    }
  }, [cache, queries])
}

export interface HydrateProps {
  state?: unknown
}

export const Hydrate: React.FC<HydrateProps> = ({ state, children }) => {
  useHydrate(state)
  return children as React.ReactElement<any>
}
