import { createRootRouteWithContext } from '@tanstack/solid-router'
import type { Accessor } from 'solid-js'
import type { QueryClient } from '@tanstack/solid-query'

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
  isRestoring: Accessor<boolean>
}>()({})
