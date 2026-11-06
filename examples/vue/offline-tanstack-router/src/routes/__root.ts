import { createRootRouteWithContext } from '@tanstack/vue-router'
import type { QueryClient } from '@tanstack/vue-query'

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
  {},
)
