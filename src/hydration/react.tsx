import React from 'react'
import {
  useQueryCache,
  ReactQueryCacheProvider as CacheProvider,
} from 'react-query'
import { hydrate } from './hydration'

import type { HydrateConfig } from './hydration'
import type { ReactQueryCacheProviderProps } from '../react'

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

interface HydratorProps {
  dehydratedState?: unknown
  hydrationConfig?: HydrateConfig
}

const Hydrator: React.FC<HydratorProps> = ({
  dehydratedState,
  hydrationConfig,
  children,
}) => {
  useHydrate(dehydratedState, hydrationConfig)
  return children as React.ReactElement<any>
}

export interface HydrationCacheProviderProps
  extends ReactQueryCacheProviderProps {
  dehydratedState?: unknown
  hydrationConfig?: HydrateConfig
}

export const ReactQueryCacheProvider: React.FC<HydrationCacheProviderProps> = ({
  dehydratedState,
  hydrationConfig,
  children,
  ...rest
}) => {
  return (
    <CacheProvider {...rest}>
      <Hydrator
        dehydratedState={dehydratedState}
        hydrationConfig={hydrationConfig}
      >
        {children}
      </Hydrator>
    </CacheProvider>
  )
}
