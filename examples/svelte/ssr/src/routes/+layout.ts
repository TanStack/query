import { QueryClient } from '@tanstack/svelte-query'
import type { LayoutLoad } from './$types'
import { browser } from '$app/environment'

export const load: LayoutLoad = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        enabled: browser,
        staleTime: 60 * 1000,
      },
    },
  })

  return { queryClient }
}
