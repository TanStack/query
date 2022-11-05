import type { QueryClient } from '@tanstack/query-core'
import { onDestroy, onMount } from 'svelte'
import { client } from './store'

export function useQueryClient(): QueryClient {
  let queryClient!: QueryClient
  let unsubscribe = client.subscribe((val) => {
    queryClient = val
    queryClient.mount()
  })

  onMount(() => {
    queryClient.mount()
    return () => {
      queryClient.unmount()
    }
  })

  onDestroy(() => {
    unsubscribe
  })
  return queryClient
}
