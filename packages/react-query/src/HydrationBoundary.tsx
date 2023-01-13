import * as React from 'react'

import type { HydrateOptions } from '@tanstack/query-core'
import { hydrate } from '@tanstack/query-core'
import { useQueryClient } from './QueryClientProvider'
import type { ContextOptions } from './types'

export interface HydrationBoundaryProps {
  state?: unknown
  options?: HydrateOptions & ContextOptions,
  children?: React.ReactNode
}

export const HydrationBoundary = ({ children, options = {}, state }: HydrationBoundaryProps) => {
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

  return children as React.ReactElement
}
