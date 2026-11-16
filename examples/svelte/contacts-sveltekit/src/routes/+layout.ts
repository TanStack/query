import { QueryClient } from '@tanstack/svelte-query'
import { browser } from '$app/environment'
import type { LayoutLoad } from './$types'

export const load: LayoutLoad = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        enabled: browser,
        staleTime: 10 * 1000,
      },
    },
  })

  return { queryClient }
}
