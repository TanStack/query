'use client'
import * as React from 'react'

import { hydrate } from '@tanstack/query-core'
import { useQueryClient } from './QueryClientProvider'
import type { HydrateOptions, QueryClient } from '@tanstack/query-core'

export interface HydrationBoundaryProps {
  state?: unknown
  options?: HydrateOptions
  children?: React.ReactNode
  queryClient?: QueryClient
}

export const HydrationBoundary = ({
  children,
  options = {},
  state,
  queryClient,
}: HydrationBoundaryProps) => {
  const client = useQueryClient(queryClient)

  const optionsRef = React.useRef(options)
  optionsRef.current = options

  // Running hydrate again with the same queries is safe,
  // it wont overwrite or initialize existing queries,
  // relying on useMemo here is only a performance optimization.
  // hydrate can and should be run *during* render here for SSR to work properly
  React.useMemo(() => {
    if (state) {
      hydrate(client, state, optionsRef.current)
    }
  }, [client, state])

  return children as React.ReactElement
}
