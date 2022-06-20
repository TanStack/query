import * as React from 'react'

import { hydrate, HydrateOptions } from '@tanstack/query-core'
import { useQueryClient } from './QueryClientProvider'
import { ContextOptions } from './types'

export function useHydrate(
  state: unknown,
  options: HydrateOptions & ContextOptions = {},
) {
  const queryClient = useQueryClient({ context: options.context })

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
  children?: React.ReactNode
}

export const Hydrate = ({ children, options, state }: HydrateProps) => {
  useHydrate(state, options)
  return children as React.ReactElement
}
