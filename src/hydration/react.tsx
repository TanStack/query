import React from 'react'

import { useQueryClient } from 'react-query'
import { hydrate, HydrateOptions } from './hydration'

export function useHydrate(state: unknown, options?: HydrateOptions) {
  const queryClient = useQueryClient()

  const optionsRef = React.useRef(options)
  optionsRef.current = options

  // Running hydrate again with the same queries is safe,
  // it wont overwrite or initialize existing queries,
  // relying on useMemo here is only a performance optimization.
  // hydrate can and should be run *during* render here for SSR to work properly
  React.useMemo(() => {
    if (state) {
      hydrate(queryClient, state, optionsRef.current)
    }
  }, [queryClient, state])
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
