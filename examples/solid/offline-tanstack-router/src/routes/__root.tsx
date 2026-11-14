import { createRootRouteWithContext } from '@tanstack/solid-router'
import type { QueryClient } from '@tanstack/solid-query'
import type { Accessor } from 'solid-js'

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
  isRestoring: Accessor<boolean>
}>()({})
