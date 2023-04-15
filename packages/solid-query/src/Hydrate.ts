import type { JSX } from 'solid-js'
import type { HydrateOptions } from '@tanstack/query-core'
import { hydrate } from '@tanstack/query-core'
import { useQueryClient } from './QueryClientProvider'
import type { ContextOptions } from './types'

export function useHydrate(
  state: unknown,
  options: HydrateOptions & ContextOptions = {},
) {
  const queryClient = useQueryClient({ context: options.context })

  if (state) {
    hydrate(queryClient, state, options)
  }
}

export interface HydrateProps {
  state?: unknown
  options?: HydrateOptions
  children?: JSX.Element
}

export const Hydrate = ({ children, options, state }: HydrateProps) => {
  useHydrate(state, options)
  return children as JSX.Element
}
