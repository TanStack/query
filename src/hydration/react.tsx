import React from 'react'
import {
  useQueryCache,
  ReactQueryCacheProvider as CacheProvider,
} from 'react-query'
import { hydrate } from './hydration'

import type { ReactQueryCacheProviderProps } from '../react'

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

interface HydratorProps {
  dehydratedState?: unknown
}

const Hydrator: React.FC<HydratorProps> = ({ dehydratedState, children }) => {
  useHydrate(dehydratedState)
  return children as React.ReactElement<any>
}

export interface HydrationCacheProviderProps
  extends ReactQueryCacheProviderProps {
  dehydratedState?: unknown
}

export const ReactQueryCacheProvider: React.FC<HydrationCacheProviderProps> = ({
  dehydratedState,
  children,
  ...rest
}) => {
  return (
    <CacheProvider {...rest}>
      <Hydrator dehydratedState={dehydratedState}>{children}</Hydrator>
    </CacheProvider>
  )
}
