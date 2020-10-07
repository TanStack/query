import React from 'react'

import { useQueryClient } from '../react'
import { hydrate, HydrateOptions } from './hydration'

export function useHydrate(state: unknown, options?: HydrateOptions) {
  const client = useQueryClient()
  const cache = client.getCache()

  const optionsRef = React.useRef(options)
  optionsRef.current = options

  // Running hydrate again with the same queries is safe,
  // it wont overwrite or initialize existing queries,
  // relying on useMemo here is only a performance optimization
  React.useMemo(() => {
    if (state) {
      hydrate(cache, state, optionsRef.current)
    }
  }, [cache, state])
}

export interface HydrateProps {
  state?: unknown
  options?: HydrateOptions
}

export const Hydrate: React.FC<HydrateProps> = ({
  children,
  options,
  state,
}) => {
  useHydrate(state, options)
  return children as React.ReactElement<any>
}
