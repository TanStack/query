import type { QueryClient } from '@tanstack/query-core'
import { onMount } from 'svelte'
import { getQueryClientContext } from './context'
// import { client } from './store'

export function useQueryClient(): QueryClient {
  const queryClient = getQueryClientContext()

  onMount(() => {
    queryClient.mount()
    return () => {
      queryClient.unmount()
    }
  })

  return queryClient
}
